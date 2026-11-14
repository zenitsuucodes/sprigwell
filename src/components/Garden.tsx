import { motion, useTransform, type MotionValue } from 'framer-motion'

/*
 * Detailed SVG scenery for the growing-year timeline. Everything sits on a
 * baseline at y = 0 and reacts to the season values passed in.
 */

export type Season = {
  grow: MotionValue<number>
  bloom: MotionValue<number>
  wilt: MotionValue<number>
  canopy: MotionValue<string>
  bare: MotionValue<number>
  blossom: MotionValue<number>
  snow: MotionValue<number>
}

const STEM = '#3d8a33'
const LEAF = '#4fa83f'
const LEAF2 = '#6bbf4f'

function Leaf({ x, y, r, s = 1, c = LEAF }: { x: number; y: number; r: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 8 -6, 22 -6, 30 0 C 22 6, 8 6, 0 0 Z" fill={c} />
      <path d="M2 0 H 26" stroke="#2f6e28" strokeWidth="1" opacity=".5" />
    </g>
  )
}

function Tulip({ x, s, i }: { x: number; s: Season; i: number }) {
  const cols = [['#e8455a', '#c22c44'], ['#ffcf3a', '#e8a81a'], ['#ff8fb8', '#e2638f']][i % 3]
  const h = 64 + (i % 3) * 10
  const wiltRot = useTransform(s.wilt, [0, 1], [0, i % 2 ? 22 : -22])
  return (
    <g transform={`translate(${x} 0)`}>
      <motion.g style={{ scaleY: s.grow, originY: 1, rotate: wiltRot }}>
        <path d={`M0 0 Q 3 ${-h / 2} 0 ${-h}`} stroke={STEM} strokeWidth="3.5" fill="none" />
        <path d={`M0 -4 C -16 -20, -14 -46, -4 -58 C -6 -40, -4 -22, 0 -8 Z`} fill={LEAF} />
        <path d={`M0 -4 C 14 -18, 16 -38, 8 -50 C 8 -34, 4 -18, 0 -8 Z`} fill={LEAF2} />
        <g transform={`translate(0 ${-h})`}><motion.g style={{ scale: s.bloom }}>
          <path d="M-10 0 C -12 -14, -8 -22, -4 -24 L 0 -14 L 4 -24 C 8 -22, 12 -14, 10 0 C 6 6, -6 6, -10 0 Z" fill={cols[0]} />
          <path d="M-4 -24 L 0 -14 L 4 -24 C 2 -18, -2 -18, -4 -24 Z" fill={cols[1]} />
          <path d="M-7 -2 C -8 -10, -6 -16, -4 -18" stroke="#fff" strokeOpacity=".45" strokeWidth="2" fill="none" />
        </motion.g></g>
      </motion.g>
    </g>
  )
}

function Daisies({ x, s, i }: { x: number; s: Season; i: number }) {
  const heads = [[-12, -44], [4, -56], [16, -40]]
  return (
    <g transform={`translate(${x} 0)`}>
      <motion.g style={{ scaleY: s.grow, originY: 1 }}>
        {heads.map(([hx, hy], k) => (
          <path key={k} d={`M0 0 Q ${hx / 2} ${hy / 2} ${hx} ${hy}`} stroke={STEM} strokeWidth="2.5" fill="none" />
        ))}
        <Leaf x={0} y={-6} r={-150} s={0.6} />
        <Leaf x={0} y={-10} r={-30} s={0.6} c={LEAF2} />
        {heads.map(([hx, hy], k) => (
          <g key={k} transform={`translate(${hx} ${hy})`}><motion.g style={{ scale: s.bloom }}>
            {Array.from({ length: 12 }, (_, p) => (
              <ellipse key={p} cx="0" cy="-7" rx="2.6" ry="6.5" fill={i % 2 ? '#ffffff' : '#fff4fb'} stroke="#e6e1d6" strokeWidth=".6" transform={`rotate(${p * 30})`} />
            ))}
            <circle r="4.5" fill="#f4b81a" />
            <circle r="4.5" fill="none" stroke="#c98a0c" strokeDasharray="1 1.6" />
          </motion.g></g>
        ))}
      </motion.g>
    </g>
  )
}

function Sunflower({ x, s }: { x: number; s: Season }) {
  const h = 150
  const droop = useTransform(s.wilt, [0, 1], [0, 28])
  return (
    <g transform={`translate(${x} 0)`}>
      <motion.g style={{ scaleY: s.grow, originY: 1 }}>
        <path d={`M0 0 C 4 -50, -4 -100, 0 ${-h}`} stroke="#3a7d2e" strokeWidth="5" fill="none" />
        <Leaf x={0} y={-40} r={-160} s={1.3} />
        <Leaf x={0} y={-70} r={-20} s={1.2} c={LEAF2} />
        <Leaf x={0} y={-104} r={-165} s={1} />
        <g transform={`translate(0 ${-h})`}><motion.g style={{ scale: s.bloom, rotate: droop }}>
          {Array.from({ length: 18 }, (_, p) => (
            <path key={p} d="M0 -14 C 4 -20, 3 -28, 0 -32 C -3 -28, -4 -20, 0 -14 Z" fill={p % 2 ? '#ffc21a' : '#ffd84a'} transform={`rotate(${p * 20})`} />
          ))}
          <circle r="15" fill="#6b3f12" />
          <circle r="11" fill="#5a3510" />
          {Array.from({ length: 14 }, (_, p) => (
            <circle key={p} cx={Math.cos(p * 2.4) * (3 + (p % 4) * 2)} cy={Math.sin(p * 2.4) * (3 + (p % 4) * 2)} r="1.1" fill="#d99a3a" />
          ))}
        </motion.g></g>
      </motion.g>
    </g>
  )
}

function Lavender({ x, s }: { x: number; s: Season }) {
  const stems = [-14, -7, 0, 7, 14]
  return (
    <g transform={`translate(${x} 0)`}>
      <motion.g style={{ scaleY: s.grow, originY: 1 }}>
        {stems.map((dx, k) => {
          const h = 58 + (k % 2) * 12
          return (
            <g key={k}>
              <path d={`M0 0 Q ${dx / 2} ${-h / 2} ${dx} ${-h}`} stroke="#6f8f5c" strokeWidth="2" fill="none" />
              <motion.g style={{ opacity: s.bloom }}>
                {Array.from({ length: 6 }, (_, p) => (
                  <ellipse key={p} cx={dx + (p % 2 ? 2 : -2)} cy={-h - p * 4 + 4} rx="2.6" ry="3.4" fill={p % 2 ? '#9a7ed6' : '#b39be6'} />
                ))}
              </motion.g>
            </g>
          )
        })}
        <path d="M-18 0 C -14 -16, 14 -16, 18 0 Z" fill="#7fa36b" />
      </motion.g>
    </g>
  )
}

function Shrub({ x, s, i }: { x: number; s: Season; i: number }) {
  const scale = useTransform(s.grow, [0, 1], [0.7, 1])
  return (
    <g transform={`translate(${x} 0)`}>
      <motion.g style={{ scale, originY: 1 }}>
        <ellipse cx="0" cy="-2" rx="34" ry="5" fill="#2c5a22" opacity=".25" />
        {[[-18, -20, 18], [0, -30, 22], [18, -20, 18], [-8, -14, 16], [10, -12, 16]].map(([cx, cy, r], k) => (
          <motion.circle key={k} cx={cx} cy={cy} r={r} style={{ fill: s.canopy }} />
        ))}
        {[[-14, -28, 8], [4, -40, 9], [20, -26, 6]].map(([cx, cy, r], k) => (
          <circle key={k} cx={cx} cy={cy} r={r} fill="#ffffff" opacity=".18" />
        ))}
        <motion.g style={{ opacity: s.bloom }}>
          {Array.from({ length: 9 }, (_, k) => (
            <circle key={k} cx={Math.cos(k * 1.7 + i) * 22} cy={-22 + Math.sin(k * 1.7 + i) * 14} r="3" fill={i % 2 ? '#ff7aa8' : '#ffffff'} />
          ))}
        </motion.g>
      </motion.g>
    </g>
  )
}

export function Tree({ x, s, i }: { x: number; s: Season; i: number }) {
  const blobs: [number, number, number][] = [[0, -190, 54], [-48, -160, 42], [48, -164, 44], [-26, -128, 40], [28, -126, 40], [-60, -126, 30], [62, -128, 30], [0, -150, 46]]
  return (
    <g transform={`translate(${x} 0) scale(${0.9 + (i % 3) * 0.1})`}>
      <ellipse cx="0" cy="-2" rx="70" ry="9" fill="#1f4a1a" opacity=".22" />
      {/* trunk with bark lines and roots */}
      <path d="M-14 0 C -10 -40, -9 -90, -7 -128 L 7 -128 C 9 -90, 10 -40, 14 0 C 20 2, 24 4, 26 6 L -26 6 C -24 4, -20 2, -14 0 Z" fill="#7a5233" />
      <path d="M-4 -10 C -3 -40, -4 -80, -2 -120 M 4 -20 C 5 -50, 4 -80, 3 -110" stroke="#5b3b22" strokeWidth="2" fill="none" />
      <path d="M0 -100 C -20 -120, -36 -140, -50 -160 M 0 -112 C 18 -130, 32 -146, 46 -168 M 0 -126 C 2 -150, 0 -170, -2 -196" stroke="#7a5233" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M-30 -138 l -14 -8 M 30 -142 l 14 -10 M -1 -172 l 10 -10" stroke="#7a5233" strokeWidth="4" strokeLinecap="round" />
      {/* canopy: base, shadow and highlight layers */}
      <motion.g style={{ opacity: s.bare }}>
        {blobs.map(([cx, cy, r], k) => <motion.circle key={k} cx={cx} cy={cy} r={r} style={{ fill: s.canopy }} />)}
        {blobs.map(([cx, cy, r], k) => <circle key={`sh${k}`} cx={cx + r * 0.2} cy={cy + r * 0.3} r={r * 0.7} fill="#0b2a08" opacity=".14" />)}
        {blobs.slice(0, 5).map(([cx, cy, r], k) => <circle key={`hl${k}`} cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.42} fill="#ffffff" opacity=".16" />)}
        <motion.g style={{ opacity: s.blossom }}>
          {Array.from({ length: 34 }, (_, k) => {
            const [cx, cy, r] = blobs[k % blobs.length]
            const a = k * 2.39
            return <circle key={k} cx={cx + Math.cos(a) * r * 0.7} cy={cy + Math.sin(a) * r * 0.7} r={3.2} fill={k % 3 ? '#ffd1e3' : '#ffffff'} />
          })}
        </motion.g>
      </motion.g>
      {/* snow on the bare branches */}
      <motion.g style={{ opacity: s.snow }}>
        <path d="M-50 -162 q 10 -4 20 2 M 30 -150 q 8 -6 16 -18 M -6 -194 q 4 -4 8 0" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
      </motion.g>
    </g>
  )
}

export function Fence({ width }: { width: number }) {
  const n = Math.ceil(width / 26)
  return (
    <g opacity=".9">
      <rect x="0" y="-52" width={width} height="7" fill="#efe9da" />
      <rect x="0" y="-26" width={width} height="7" fill="#efe9da" />
      {Array.from({ length: n }, (_, k) => (
        <g key={k} transform={`translate(${k * 26} 0)`}>
          <path d="M2 0 V -62 L 9 -72 L 16 -62 V 0 Z" fill="#fbf8ef" />
          <path d="M12 0 V -62 L 16 -62 V 0 Z" fill="#e3dccb" />
        </g>
      ))}
    </g>
  )
}

/** Props that belong to a particular month, positioned by the caller. */
export function Birdhouse() {
  return (
    <g>
      <rect x="-3" y="-120" width="6" height="120" fill="#7a5233" />
      <path d="M-26 -150 L 0 -176 L 26 -150 Z" fill="#c2452c" />
      <rect x="-20" y="-150" width="40" height="34" rx="2" fill="#ffd23f" />
      <circle cx="0" cy="-136" r="7" fill="#3a2a1a" />
      <rect x="-1.5" y="-126" width="3" height="10" fill="#7a5233" />
      <g transform="translate(14 -158)">
        <ellipse cx="0" cy="0" rx="9" ry="7" fill="#4a7fd8" />
        <circle cx="7" cy="-5" r="5" fill="#4a7fd8" />
        <path d="M11 -5 l 5 1 l -5 2 z" fill="#f2a01a" />
        <circle cx="8" cy="-6" r="1.2" fill="#111" />
        <ellipse cx="2" cy="3" rx="6" ry="3" fill="#ffb07a" />
      </g>
    </g>
  )
}

export function WateringCan() {
  return (
    <g>
      <path d="M-20 0 L -16 -36 L 16 -36 L 20 0 Z" fill="#5aa0d8" />
      <path d="M-16 -36 L 16 -36" stroke="#3d7fb5" strokeWidth="3" />
      <path d="M16 -28 L 44 -48" stroke="#5aa0d8" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="46" cy="-50" rx="7" ry="4" fill="#3d7fb5" transform="rotate(-35 46 -50)" />
      <path d="M-16 -30 C -36 -36, -36 -10, -18 -10" stroke="#3d7fb5" strokeWidth="5" fill="none" />
      {[0, 1, 2, 3].map((k) => (
        <motion.circle key={k} cx={52} cy={-44} r="2.4" fill="#8fd3f2"
          animate={{ cx: [52, 60 + k * 4], cy: [-44, 4], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: k * 0.22, ease: 'easeIn' }} />
      ))}
    </g>
  )
}

export function Wheelbarrow() {
  return (
    <g>
      <path d="M-46 -34 L 20 -34 L 8 -8 L -36 -8 Z" fill="#2f6e9e" />
      <path d="M-40 -34 C -30 -48, 6 -50, 14 -34 Z" fill="#7b5a3a" />
      {[[-30, -42], [-16, -46], [0, -44]].map(([cx, cy], k) => <circle key={k} cx={cx} cy={cy} r="5" fill="#5c4128" />)}
      <circle cx="18" cy="-8" r="10" fill="#2a2a2a" />
      <circle cx="18" cy="-8" r="3.5" fill="#cfcfcf" />
      <path d="M-36 -10 L -56 -2 M -32 -12 L -40 0" stroke="#5b3b22" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

export function Pumpkins() {
  const one = (x: number, r: number, c: string) => (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx="0" cy={-r} rx={r * 1.25} ry={r} fill={c} />
      <path d={`M0 ${-2 * r} C ${-r * 0.5} ${-r * 1.5}, ${-r * 0.5} ${-r * 0.5}, 0 0 M0 ${-2 * r} C ${r * 0.5} ${-r * 1.5}, ${r * 0.5} ${-r * 0.5}, 0 0`} stroke="#c25a14" strokeWidth="1.6" fill="none" opacity=".6" />
      <path d={`M0 ${-2 * r} q 2 -8 6 -10`} stroke="#4e6b2a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
  return <g>{one(-20, 16, '#f28c28')}{one(16, 12, '#ffa94a')}{one(-2, 9, '#f6b55a')}</g>
}

export function LeafPile() {
  const cols = ['#e07a2e', '#c4a23a', '#b5452c', '#e8a33a']
  return (
    <g>
      <path d="M-50 0 C -40 -34, 40 -34, 50 0 Z" fill="#c46a2a" />
      {Array.from({ length: 22 }, (_, k) => (
        <ellipse key={k} cx={Math.cos(k * 2.1) * 34} cy={-10 - Math.abs(Math.sin(k * 1.3)) * 18} rx="7" ry="4" fill={cols[k % 4]} transform={`rotate(${k * 37} ${Math.cos(k * 2.1) * 34} ${-10 - Math.abs(Math.sin(k * 1.3)) * 18})`} />
      ))}
      <path d="M58 0 L 30 -90" stroke="#7a5233" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 -96 L 40 -84 M 22 -92 l -4 -8 M 28 -88 l -2 -9 M 34 -86 l 0 -9" stroke="#8a8f94" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

export function Snowman({ s }: { s: Season }) {
  return (
    <motion.g style={{ opacity: s.snow }}>
      <circle cx="0" cy="-26" r="26" fill="#ffffff" stroke="#dfe8f2" strokeWidth="2" />
      <circle cx="0" cy="-70" r="19" fill="#ffffff" stroke="#dfe8f2" strokeWidth="2" />
      <circle cx="0" cy="-102" r="14" fill="#ffffff" stroke="#dfe8f2" strokeWidth="2" />
      <rect x="-12" y="-126" width="24" height="5" fill="#2a2a2a" />
      <rect x="-8" y="-146" width="16" height="22" fill="#2a2a2a" />
      <rect x="-8" y="-131" width="16" height="4" fill="#c2452c" />
      <circle cx="-5" cy="-105" r="1.8" fill="#222" /><circle cx="5" cy="-105" r="1.8" fill="#222" />
      <path d="M0 -100 L 14 -97 L 0 -96 Z" fill="#f28c28" />
      <path d="M-18 -84 C -6 -78, 6 -78, 18 -84 L 18 -78 L 10 -60 L 4 -60 L 8 -76 C 0 -74, -8 -74, -18 -78 Z" fill="#c2452c" />
      <path d="M-18 -72 L -42 -90 M -36 -86 l -4 -8 M 18 -72 L 40 -86 M 36 -83 l 6 -6" stroke="#7a5233" strokeWidth="3" strokeLinecap="round" />
      {[-60, -50, -40].map((cy) => <circle key={cy} cx="0" cy={cy} r="2.2" fill="#2a2a2a" />)}
    </motion.g>
  )
}

export function Bees({ s }: { s: Season }) {
  return (
    <motion.g style={{ opacity: s.bloom }}>
      {[0, 1, 2].map((k) => (
        <motion.g key={k} animate={{ x: [0, 26, 8, -20, 0], y: [0, -12, -26, -8, 0] }} transition={{ repeat: Infinity, duration: 3 + k, ease: 'easeInOut', delay: k * 0.4 }}>
          <g transform={`translate(${k * 30 - 30} ${-150 - k * 14})`}>
            <ellipse cx="0" cy="0" rx="7" ry="5" fill="#ffc21a" />
            <path d="M-2 -4.5 V 4.5 M 2.5 -4 V 4" stroke="#222" strokeWidth="2" />
            <motion.ellipse cx="-1" cy="-6" rx="4" ry="6" fill="#ffffff" opacity=".8" animate={{ ry: [6, 2, 6] }} transition={{ repeat: Infinity, duration: 0.12 }} />
          </g>
        </motion.g>
      ))}
    </motion.g>
  )
}

export const species = [Tulip, Daisies, Lavender, Shrub] as const
export { Sunflower }
