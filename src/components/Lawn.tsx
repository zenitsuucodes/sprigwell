import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildButterflies, buildFlowers, buildHorizon, buildMower } from './lawnProps'

/*
 * A patch of lawn made of tens of thousands of instanced grass blades.
 * Moving the cursor (or a finger) over it mows the grass: a small data texture
 * records where the "mower" has been and which way it was going, and the blade
 * shader shortens those blades and shades them light or dark, like real stripes.
 */

const W = 60 // lawn width (x), wide enough that the side edges stay off screen
const D = 20 // lawn depth (z)
const Z0 = -16 // far edge
const MAP_W = 256
const MAP_H = 160

const vertex = /* glsl */ `
  attribute vec3 offset;
  attribute float bladeHeight;
  attribute float angle;
  attribute float tint;
  uniform float uTime;
  uniform float uWind;
  uniform sampler2D uMow;
  uniform vec2 uLawnMin;
  uniform vec2 uLawnSize;
  varying float vH;
  varying float vTint;
  varying vec2 vMow;
  varying float vDist;

  void main() {
    vec2 uv = (offset.xz - uLawnMin) / uLawnSize;
    vec4 mow = texture2D(uMow, uv);
    vMow = mow.rg;
    float cut = smoothstep(0.15, 0.85, mow.r);
    float h = bladeHeight * mix(1.0, 0.16, cut);

    vec3 p = position;
    float c = cos(angle), s = sin(angle);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y *= h;

    // wind: bend more towards the tip, less once mowed
    float bend = (sin(uTime * 1.6 + offset.x * 0.35 + offset.z * 0.22) * 0.5 + 0.5) * uWind * (1.0 - cut * 0.9);
    float t = position.y; // 0 at root, 1 at tip
    p.x += bend * t * t * 0.45;
    p.z += bend * t * t * 0.2;

    vH = t;
    vTint = tint;
    vec4 world = modelMatrix * vec4(p + offset, 1.0);
    vec4 mv = viewMatrix * world;
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uTip;
  uniform vec3 uFog;
  uniform vec3 uLight;
  uniform vec3 uDark;
  varying float vH;
  varying float vTint;
  varying vec2 vMow;
  varying float vDist;

  void main() {
    vec3 col = mix(uBase, uTip, smoothstep(0.0, 1.0, vH));
    col *= 0.88 + vTint * 0.24;
    // mowing stripes: cut grass turns an even light or dark green, depending on direction
    float cut = smoothstep(0.15, 0.85, vMow.r);
    vec3 stripe = mix(uDark, uLight, step(0.5, vMow.g));
    col = mix(col, stripe * (0.86 + vH * 0.22 + vTint * 0.08), cut);
    float fog = smoothstep(9.0, 26.0, vDist);
    col = mix(col, uFog, fog);
    gl_FragColor = vec4(col, 1.0);
  }
`

export default function Lawn() {
  const host = useRef<HTMLDivElement>(null)
  const [mowed, setMowed] = useState(0)
  const [hint, setHint] = useState(true)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.innerWidth < 760
    const COUNT = small ? 40000 : 110000

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
    camera.position.set(0, 3.1, 8.6)
    camera.lookAt(0, 0, -3)

    // light and haze for the solid scenery (the grass shades itself)
    scene.add(new THREE.HemisphereLight('#e8f7ff', '#4c7a35', 1.5))
    const sun = new THREE.DirectionalLight('#fff1c8', 2.2)
    sun.position.set(6, 10, 4)
    scene.add(sun)
    scene.fog = new THREE.Fog('#c6ecd0', 15, 36)
    scene.add(buildHorizon(W))
    const flowers = buildFlowers(small ? 140 : 300)
    scene.add(flowers.group)
    const butterflies = buildButterflies(small ? 3 : 5)
    if (!reduced) scene.add(butterflies.group)
    const mower = buildMower()
    const PARK = new THREE.Vector3(small ? 1 : 3.6, 0, 2.4)
    mower.group.position.copy(PARK)
    mower.group.rotation.y = -Math.PI / 2.4
    scene.add(mower.group)

    // soil under the grass

    // mow map: R = mowed, G = stripe direction
    const mowData = new Uint8Array(MAP_W * MAP_H * 4)
    const mowTex = new THREE.DataTexture(mowData, MAP_W, MAP_H, THREE.RGBAFormat)
    mowTex.magFilter = THREE.LinearFilter
    mowTex.minFilter = THREE.LinearFilter
    mowTex.needsUpdate = true

    // one blade: 7 vertices, tapered, in a unit box (y 0..1)
    const blade = new THREE.InstancedBufferGeometry()
    const bw = 0.055
    const verts = new Float32Array([
      -bw, 0, 0, bw, 0, 0,
      -bw * 0.8, 0.33, 0, bw * 0.8, 0.33, 0,
      -bw * 0.5, 0.66, 0, bw * 0.5, 0.66, 0,
      0, 1, 0,
    ])
    blade.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    blade.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6])

    const offsets = new Float32Array(COUNT * 3)
    const heights = new Float32Array(COUNT)
    const angles = new Float32Array(COUNT)
    const tints = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      // denser near the camera, where it matters
      const zr = Math.pow(Math.random(), 0.7)
      offsets[i * 3] = (Math.random() - 0.5) * W
      offsets[i * 3 + 1] = 0
      offsets[i * 3 + 2] = Z0 + D * zr
      heights[i] = 0.32 + Math.random() * 0.34
      angles[i] = Math.random() * Math.PI
      tints[i] = Math.random()
    }
    blade.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3))
    blade.setAttribute('bladeHeight', new THREE.InstancedBufferAttribute(heights, 1))
    blade.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1))
    blade.setAttribute('tint', new THREE.InstancedBufferAttribute(tints, 1))
    blade.instanceCount = COUNT

    const uniforms = {
      uTime: { value: 0 },
      uWind: { value: reduced ? 0 : 0.6 },
      uMow: { value: mowTex },
      uLawnMin: { value: new THREE.Vector2(-W / 2, Z0) },
      uLawnSize: { value: new THREE.Vector2(W, D) },
      uBase: { value: new THREE.Color('#2d6a26') },
      uTip: { value: new THREE.Color('#9bdc5c') },
      uFog: { value: new THREE.Color('#bfe9c6') },
      uLight: { value: new THREE.Color('#bde97a') },
      uDark: { value: new THREE.Color('#6fb84a') },
    }
    const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, side: THREE.DoubleSide })

    const groundMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vWorld;
        varying float vDist;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xz;
          vec4 mv = viewMatrix * w;
          vDist = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMow;
        uniform vec2 uLawnMin;
        uniform vec2 uLawnSize;
        uniform vec3 uLight;
        uniform vec3 uDark;
        uniform vec3 uFog;
        varying vec2 vWorld;
        varying float vDist;
        void main() {
          vec4 mow = texture2D(uMow, (vWorld - uLawnMin) / uLawnSize);
          float cut = smoothstep(0.15, 0.85, mow.r);
          vec3 soil = vec3(0.17, 0.4, 0.15);
          vec3 col = mix(soil, mix(uDark, uLight, step(0.5, mow.g)) * 0.92, cut);
          col = mix(col, uFog, smoothstep(9.0, 26.0, vDist));
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(W + 6, D + 6), groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, 0, Z0 + D / 2)
    scene.add(ground)
    const grass = new THREE.Mesh(blade, mat)
    grass.frustumCulled = false
    scene.add(grass)

    // ---- clippings: a small pool of particles thrown up behind the mower ----
    const CLIP = 360
    const clipPos = new Float32Array(CLIP * 3)
    const clipVel = new Float32Array(CLIP * 3)
    const clipLife = new Float32Array(CLIP)
    const clipGeo = new THREE.BufferGeometry()
    clipGeo.setAttribute('position', new THREE.BufferAttribute(clipPos, 3))
    const clipMat = new THREE.PointsMaterial({ color: '#c8f08a', size: 0.08, transparent: true, opacity: 0.95, depthWrite: false })
    const clippings = new THREE.Points(clipGeo, clipMat)
    clippings.frustumCulled = false
    scene.add(clippings)
    let clipNext = 0
    const throwClippings = (x: number, z: number, n: number) => {
      for (let k = 0; k < n; k++) {
        const i = clipNext++ % CLIP
        clipPos[i * 3] = x + (Math.random() - 0.5) * 0.3
        clipPos[i * 3 + 1] = 0.3
        clipPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3
        clipVel[i * 3] = Math.cos(heading) * (1.5 + Math.random() * 1.5) + (Math.random() - 0.5)
        clipVel[i * 3 + 1] = 1.2 + Math.random() * 1.6
        clipVel[i * 3 + 2] = -Math.sin(heading) * (1.5 + Math.random() * 1.5) + (Math.random() - 0.5)
        clipLife[i] = 0.7 + Math.random() * 0.5
      }
    }
    for (let i = 0; i < CLIP; i++) clipPos[i * 3 + 1] = -10

    // ---- mowing ----
    const ray = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    const ndc = new THREE.Vector2()
    const target = new THREE.Vector3()
    const lastCut = new THREE.Vector3().copy(mower.group.position)
    let driving = false
    let heading = mower.group.rotation.y
    let dirty = false
    const isCut = (x: number, z: number) => {
      const u = Math.floor(((x + W / 2) / W) * MAP_W)
      const v = Math.floor(((z - Z0) / D) * MAP_H)
      if (u < 0 || v < 0 || u >= MAP_W || v >= MAP_H) return false
      return mowData[(v * MAP_W + u) * 4] > 128
    }

    const stamp = (x: number, z: number, light: boolean) => {
      const u = ((x + W / 2) / W) * MAP_W
      const v = ((z - Z0) / D) * MAP_H
      const R = 0.82 // cut radius in metres, matches the mower deck
      const rx = Math.ceil(R / (W / MAP_W))
      const rz = Math.ceil(R / (D / MAP_H))
      for (let j = -rz; j <= rz; j++) {
        for (let i = -rx; i <= rx; i++) {
          if ((i * i) / (rx * rx) + (j * j) / (rz * rz) > 1) continue
          const px = Math.round(u + i)
          const py = Math.round(v + j)
          if (px < 0 || py < 0 || px >= MAP_W || py >= MAP_H) continue
          const k = (py * MAP_W + px) * 4
          mowData[k] = 255
          mowData[k + 1] = light ? 255 : 0
        }
      }
      dirty = true
    }

    const onMove = (e: PointerEvent) => {
      const b = renderer.domElement.getBoundingClientRect()
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      if (!ray.ray.intersectPlane(plane, hit)) return
      if (hit.z < Z0 + 6 || hit.z > Z0 + D) return
      setHint(false)
      target.set(Math.max(-W / 2 + 1, Math.min(W / 2 - 1, hit.x)), 0, hit.z)
      driving = true
    }
    const onLeave = () => { driving = false }
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerleave', onLeave)
    renderer.domElement.addEventListener('pointerdown', onMove)

    // report how much is mowed (only the visible front part counts)
    const countTimer = window.setInterval(() => {
      let n = 0
      let total = 0
      for (let y = Math.floor(MAP_H * 0.45); y < MAP_H; y++) {
        for (let x = Math.floor(MAP_W * 0.2); x < MAP_W * 0.8; x++) {
          total++
          if (mowData[(y * MAP_W + x) * 4] > 0) n++
        }
      }
      setMowed(Math.min(100, Math.round((n / total) * 100)))
    }, 400)

    // ---- size + loop ----
    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.fov = w < 760 ? 50 : 38
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let visible = true
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
    io.observe(el)

    let prev = performance.now()
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const now = performance.now()
      const dt = Math.min((now - prev) / 1000, 0.05)
      uniforms.uTime.value += dt
      prev = now
      // drive the mower toward the pointer
      const mp = mower.group.position
      if (driving) {
        const dx = target.x - mp.x
        const dz = target.z - mp.z
        const dist = Math.hypot(dx, dz)
        if (dist > 0.05) {
          const speed = Math.min(dist * 7, 14) * dt
          mp.x += (dx / dist) * speed
          mp.z += (dz / dist) * speed
          const want = Math.atan2(dx, dz)
          let diff = want - heading
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          heading += diff * Math.min(1, dt * 9)
          mower.group.rotation.y = heading
          for (const w of mower.wheels) w.rotation.x += speed / 0.22
        }
      }
      // engine idle shake, stronger while moving
      mower.group.position.y = Math.sin(uniforms.uTime.value * 60) * (driving ? 0.006 : 0.002)
      const moved = Math.hypot(mp.x - lastCut.x, mp.z - lastCut.z)
      if (moved > 0.08) {
        const dx = mp.x - lastCut.x
        const dz = mp.z - lastCut.z
        const light = Math.abs(dx) > Math.abs(dz) ? dx > 0 : dz > 0
        const steps = Math.ceil(moved / 0.2)
        for (let k = 1; k <= steps; k++) stamp(lastCut.x + (dx * k) / steps, lastCut.z + (dz * k) / steps, light)
        // clippings fly out of the side chute
        if (!reduced) {
          const cx = mp.x + Math.cos(heading) * 0.85
          const cz = mp.z - Math.sin(heading) * 0.85
          throwClippings(cx, cz, Math.min(8, steps * 2))
        }
        lastCut.set(mp.x, 0, mp.z)
      }
      flowers.update(isCut, dt)
      if (!reduced) butterflies.update(uniforms.uTime.value)

      for (let i = 0; i < CLIP; i++) {
        if (clipLife[i] <= 0) continue
        clipLife[i] -= dt
        clipVel[i * 3 + 1] -= 9 * dt
        clipPos[i * 3] += clipVel[i * 3] * dt
        clipPos[i * 3 + 1] = Math.max(0.04, clipPos[i * 3 + 1] + clipVel[i * 3 + 1] * dt)
        clipPos[i * 3 + 2] += clipVel[i * 3 + 2] * dt
        if (clipLife[i] <= 0) clipPos[i * 3 + 1] = -10
      }
      clipGeo.attributes.position.needsUpdate = true
      if (dirty) {
        mowTex.needsUpdate = true
        dirty = false
      }
      renderer.render(scene, camera)
    }
    loop()

    ;(el as HTMLDivElement & { resetLawn?: () => void }).resetLawn = () => {
      mowData.fill(0)
      dirty = true
      driving = false
      mower.group.position.copy(PARK)
      lastCut.copy(PARK)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(countTimer)
      ro.disconnect()
      io.disconnect()
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerleave', onLeave)
      renderer.domElement.removeEventListener('pointerdown', onMove)
      blade.dispose()
      mat.dispose()
      mowTex.dispose()
      ground.geometry.dispose()
      groundMat.dispose()
      clipGeo.dispose()
      clipMat.dispose()
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        mesh.geometry?.dispose()
        const mm = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
        else mm?.dispose()
      })
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  const reset = () => {
    ;(host.current as (HTMLDivElement & { resetLawn?: () => void }) | null)?.resetLawn?.()
    setMowed(0)
  }

  return (
    <div className="lawn" ref={host} aria-label="Interactive 3D lawn. Move your pointer across it to mow stripes." role="img">
      <div className={`mow-hint ${hint ? '' : 'gone'}`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 16h11l3-6h2M6 16v-3h7M7 19.5a1.5 1.5 0 1 0 0-.01M16 19.5a1.5 1.5 0 1 0 0-.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Point at the grass to start mowing
      </div>
      <div className="mow-meter" aria-live="polite">
        <span className="mow-bar"><i style={{ width: `${mowed}%` }} /></span>
        <b>{mowed}% mowed</b>
        {mowed > 0 && <button type="button" onClick={reset}>Grow it back</button>}
        {mowed >= 35 && <a href="#packages" className="mow-cta">Nice stripes. Want us to do yours?</a>}
      </div>
    </div>
  )
}
