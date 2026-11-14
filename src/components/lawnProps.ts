import * as THREE from 'three'

/*
 * Scenery for the hero lawn: a ride-behind mower that follows the pointer,
 * a tree line and picket fence on the horizon, wild flowers that disappear
 * when mowed, and a few butterflies.
 */

const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, flatShading: true, ...extra })

export function buildMower() {
  const g = new THREE.Group()
  const body = std('#FFC23F', { roughness: 0.45 })
  const dark = std('#173A1C', { roughness: 0.6 })
  const steel = std('#c9d2cc', { metalness: 0.6, roughness: 0.35 })
  const tyre = std('#22261f', { roughness: 0.95 })
  const hub = std('#f4f1e6')
  const bag = std('#3d8a33', { roughness: 0.95 })

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, rz)
    g.add(m)
    return m
  }

  // deck: a rounded cutting deck with a lip
  const deck = new THREE.CylinderGeometry(0.62, 0.66, 0.2, 28)
  deck.scale(1, 1, 0.92)
  add(deck, body, 0, 0.3, 0.05)
  add(new THREE.TorusGeometry(0.64, 0.035, 8, 28), dark, 0, 0.22, 0.05, Math.PI / 2)
  // side discharge chute
  add(new THREE.BoxGeometry(0.28, 0.12, 0.34), body, 0.68, 0.26, 0.1, 0, -0.35, 0)
  // engine block, cover, fuel cap and pull cord housing
  add(new THREE.CylinderGeometry(0.28, 0.3, 0.26, 18), steel, 0, 0.53, 0.08)
  add(new THREE.CylinderGeometry(0.31, 0.33, 0.1, 18), dark, 0, 0.7, 0.08)
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10), std('#e2482a'), 0.14, 0.78, 0.0)
  add(new THREE.BoxGeometry(0.14, 0.1, 0.12), dark, -0.16, 0.76, 0.16)
  // badge
  add(new THREE.BoxGeometry(0.34, 0.06, 0.01), hub, 0, 0.36, 0.67)

  // wheels (kept in a list so they can spin)
  const wheels: THREE.Mesh[] = []
  const tyreGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.12, 20)
  const hubGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.13, 12)
  for (const [x, z] of [[-0.62, 0.42], [0.62, 0.42], [-0.62, -0.38], [0.62, -0.38]] as const) {
    const w = add(tyreGeo, tyre, x, 0.19, z, 0, 0, Math.PI / 2)
    const h = new THREE.Mesh(hubGeo, hub)
    w.add(h)
    // tread notches so the spin is visible
    for (let k = 0; k < 6; k++) {
      const n = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.125, 0.06), std('#3a4036'))
      const a = (k / 6) * Math.PI * 2
      n.position.set(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17)
      w.add(n)
    }
    wheels.push(w)
  }

  // handle: two bars, a cross bar, a grip and the bail lever
  const bar = new THREE.CylinderGeometry(0.025, 0.025, 1.25, 8)
  add(bar, dark, -0.3, 0.86, -0.78, -0.95, 0, 0)
  add(bar, dark, 0.3, 0.86, -0.78, -0.95, 0, 0)
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 8), dark, 0, 0.75, -0.62, 0, 0, Math.PI / 2)
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.66, 10), std('#2a2a2a'), 0, 1.36, -1.25, 0, 0, Math.PI / 2)
  add(new THREE.TorusGeometry(0.28, 0.018, 6, 16, Math.PI), steel, 0, 1.28, -1.18, -0.6, 0, 0)

  // grass catcher bag with a frame
  const bagGeo = new THREE.BoxGeometry(0.58, 0.4, 0.5, 2, 2, 2)
  const pos = bagGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    // puff the bag so it looks like fabric, not a box
    const y = pos.getY(i)
    pos.setX(i, pos.getX(i) * (1 + (0.2 - Math.abs(y)) * 0.25))
  }
  bagGeo.computeVertexNormals()
  add(bagGeo, bag, 0, 0.5, -0.78, -0.15)
  add(new THREE.BoxGeometry(0.62, 0.04, 0.04), dark, 0, 0.72, -0.56)

  // soft blob shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32),
    new THREE.MeshBasicMaterial({ color: '#0e2a10', transparent: true, opacity: 0.32, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.scale.set(0.95, 1.25, 1)
  shadow.position.set(0, 0.02, -0.25)
  g.add(shadow)

  g.scale.setScalar(1.15)
  return { group: g, wheels }
}

export function buildHorizon(W: number) {
  const g = new THREE.Group()
  // picket fence
  const PICKETS = Math.round(W / 0.26)
  const picketGeo = new THREE.BoxGeometry(0.1, 0.85, 0.04)
  picketGeo.translate(0, 0.425, 0)
  const tipGeo = new THREE.ConeGeometry(0.075, 0.14, 4)
  tipGeo.rotateY(Math.PI / 4)
  tipGeo.translate(0, 0.92, 0)
  const white = std('#fbf8ef', { roughness: 0.9 })
  const pickets = new THREE.InstancedMesh(picketGeo, white, PICKETS)
  const tips = new THREE.InstancedMesh(tipGeo, white, PICKETS)
  const m = new THREE.Matrix4()
  for (let i = 0; i < PICKETS; i++) {
    m.makeTranslation(-W / 2 + i * 0.26, 0, -9.6)
    pickets.setMatrixAt(i, m)
    tips.setMatrixAt(i, m)
  }
  g.add(pickets, tips)
  for (const y of [0.25, 0.65]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(W, 0.07, 0.05), std('#e9e3d2'))
    rail.position.set(0, y, -9.66)
    g.add(rail)
  }

  // tree line: broadleaf trees and conifers, varied greens
  const greens = ['#3f8f33', '#4e9e3a', '#2f7a2c', '#5aa844', '#3a8540', '#6bb04e']
  const trunkMat = std('#6b4a2f')
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 34; i++) {
    const x = -W / 2 + (i + rnd() * 0.6) * (W / 34)
    const z = -12.5 - rnd() * 3
    const s = 0.9 + rnd() * 0.8
    const t = new THREE.Group()
    t.position.set(x, 0, z)
    t.scale.setScalar(s)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 7), trunkMat)
    trunk.position.y = 0.8
    t.add(trunk)
    const leaf = std(greens[Math.floor(rnd() * greens.length)], { roughness: 1 })
    if (rnd() < 0.35) {
      for (let k = 0; k < 3; k++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1 - k * 0.28, 1.4, 8), leaf)
        cone.position.y = 1.7 + k * 0.75
        t.add(cone)
      }
    } else {
      const blobs = 3 + Math.floor(rnd() * 3)
      for (let k = 0; k < blobs; k++) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 + rnd() * 0.45, 1), leaf)
        b.position.set((rnd() - 0.5) * 1.3, 2.1 + rnd() * 0.9, (rnd() - 0.5) * 0.8)
        t.add(b)
      }
    }
    g.add(t)
  }
  // hedge in front of the trees
  const hedgeMat = std('#3d8a33', { roughness: 1 })
  for (let i = 0; i < 46; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), hedgeMat)
    b.position.set(-W / 2 + i * (W / 46), 0.45, -10.6 - (i % 2) * 0.3)
    b.scale.set(1.2, 0.8, 0.9)
    g.add(b)
  }
  return g
}

export function buildFlowers(count: number) {
  const headGeo = new THREE.IcosahedronGeometry(0.06, 1)
  const petalGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.015, 10)
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.01, 1, 4)
  stemGeo.translate(0, 0.5, 0)
  const heads = new THREE.InstancedMesh(headGeo, std('#FFD23F', { flatShading: false, emissive: '#5a4200', emissiveIntensity: 0.2 }), count)
  const petals = new THREE.InstancedMesh(petalGeo, std('#ffffff', { flatShading: false }), count)
  const stems = new THREE.InstancedMesh(stemGeo, std('#4c9a3a'), count)
  const data: { x: number; z: number; h: number; daisy: boolean; scale: number }[] = []
  for (let i = 0; i < count; i++) {
    data.push({
      x: (Math.random() - 0.5) * 30,
      z: -8 + Math.random() * 13.5,
      h: 0.5 + Math.random() * 0.3,
      daisy: Math.random() < 0.45,
      scale: 1,
    })
  }
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const v = new THREE.Vector3()
  const s = new THREE.Vector3()
  const write = (i: number) => {
    const d = data[i]
    const k = d.scale
    s.set(1, d.h * k + 0.0001, 1)
    m.compose(v.set(d.x, 0, d.z), q, s)
    stems.setMatrixAt(i, m)
    s.setScalar(k + 0.0001)
    m.compose(v.set(d.x, d.h * k, d.z), q, s)
    heads.setMatrixAt(i, m)
    s.setScalar(d.daisy ? k + 0.0001 : 0.0001)
    m.compose(v.set(d.x, d.h * k - 0.01, d.z), q, s)
    petals.setMatrixAt(i, m)
  }
  for (let i = 0; i < count; i++) write(i)
  const group = new THREE.Group()
  group.add(stems, heads, petals)

  /** Shrink flowers that have been mowed (reads the same mow map as the grass). */
  const update = (isCut: (x: number, z: number) => boolean, dt: number) => {
    let changed = false
    for (let i = 0; i < count; i++) {
      const d = data[i]
      const target = isCut(d.x, d.z) ? 0 : 1
      if (Math.abs(d.scale - target) > 0.001) {
        d.scale += (target - d.scale) * Math.min(1, dt * (target ? 2 : 14))
        write(i)
        changed = true
      }
    }
    if (changed) {
      stems.instanceMatrix.needsUpdate = true
      heads.instanceMatrix.needsUpdate = true
      petals.instanceMatrix.needsUpdate = true
    }
  }
  return { group, update }
}

export function buildButterflies(n: number) {
  const group = new THREE.Group()
  const colors = ['#ff9f3a', '#ffffff', '#ffd23f', '#a78bfa']
  const flies: { g: THREE.Group; l: THREE.Mesh; r: THREE.Mesh; cx: number; cz: number; phase: number }[] = []
  const wing = new THREE.CircleGeometry(0.1, 10)
  wing.scale(1, 0.75, 1)
  wing.translate(0.09, 0, 0)
  for (let i = 0; i < n; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide, roughness: 0.6 })
    const g = new THREE.Group()
    const l = new THREE.Mesh(wing, mat)
    const r = new THREE.Mesh(wing, mat)
    r.scale.x = -1
    const bodyM = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.08, 4, 6), std('#2a2a2a'))
    bodyM.rotation.x = Math.PI / 2
    g.add(l, r, bodyM)
    group.add(g)
    flies.push({ g, l, r, cx: (Math.random() - 0.5) * 16, cz: -4 + Math.random() * 7, phase: Math.random() * 10 })
  }
  const update = (t: number) => {
    for (const f of flies) {
      const tt = t * 0.35 + f.phase
      const x = f.cx + Math.sin(tt) * 3 + Math.sin(tt * 2.3) * 0.6
      const z = f.cz + Math.cos(tt * 0.8) * 2
      const y = 0.9 + Math.sin(tt * 3.1) * 0.25
      const nx = f.cx + Math.sin(tt + 0.05) * 3
      f.g.position.set(x, y, z)
      f.g.rotation.y = Math.atan2(nx - x, 0.05)
      const flap = Math.sin(t * 22 + f.phase) * 1.1
      f.l.rotation.y = flap
      f.r.rotation.y = -flap
    }
  }
  return { group, update }
}
