import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

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
    float h = bladeHeight * mix(1.0, 0.3, mow.r);

    vec3 p = position;
    float c = cos(angle), s = sin(angle);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y *= h;

    // wind: bend more towards the tip, less once mowed
    float bend = (sin(uTime * 1.6 + offset.x * 0.35 + offset.z * 0.22) * 0.5 + 0.5) * uWind * (1.0 - mow.r * 0.7);
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
  varying float vH;
  varying float vTint;
  varying vec2 vMow;
  varying float vDist;

  void main() {
    vec3 col = mix(uBase, uTip, smoothstep(0.0, 1.0, vH));
    col *= 0.88 + vTint * 0.24;
    // mowing stripes: light one way, dark the other
    float stripe = mix(-0.17, 0.2, vMow.g);
    col += vec3(stripe * 0.6, stripe, stripe * 0.4) * vMow.r;
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

    // soil under the grass
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(W + 6, D + 6), new THREE.MeshBasicMaterial({ color: '#2f6b2a' }))
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, 0, Z0 + D / 2)
    scene.add(ground)

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
    }
    const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, side: THREE.DoubleSide })
    const grass = new THREE.Mesh(blade, mat)
    grass.frustumCulled = false
    scene.add(grass)

    // ---- mowing ----
    const ray = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    const ndc = new THREE.Vector2()
    let last: THREE.Vector3 | null = null
    let dirty = false

    const stamp = (x: number, z: number, light: boolean) => {
      const u = ((x + W / 2) / W) * MAP_W
      const v = ((z - Z0) / D) * MAP_H
      const r = 4 // brush radius in map pixels (about 0.9 m)
      for (let j = -r; j <= r; j++) {
        for (let i = -r; i <= r; i++) {
          if (i * i + j * j > r * r) continue
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
      if (hit.z < Z0 || hit.z > Z0 + D) return
      setHint(false)
      if (last) {
        // stamp along the segment so fast moves leave continuous stripes
        const dx = hit.x - last.x
        const light = Math.abs(dx) > Math.abs(hit.z - last.z) ? dx > 0 : hit.z - last.z > 0
        const steps = Math.ceil(last.distanceTo(hit) / 0.25)
        for (let s = 1; s <= steps; s++) {
          const t = s / steps
          stamp(last.x + (hit.x - last.x) * t, last.z + (hit.z - last.z) * t, light)
        }
      }
      last = hit.clone()
    }
    const onLeave = () => { last = null }
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
      uniforms.uTime.value += Math.min((now - prev) / 1000, 0.05)
      prev = now
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
        Move across the grass to mow it
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
