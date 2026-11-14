import { motion, useMotionTemplate, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { months, packages } from '../data'
import { plan, priceOf, usePlan } from '../store'
import { Icon } from './Icons'
import { Bees, Birdhouse, Fence, LeafPile, Pumpkins, Snowman, Sunflower, Tree, WateringCan, Wheelbarrow, species, type Season } from './Garden'

/*
 * Scroll down, travel through a year sideways. The sky gradient, the tree,
 * the flowers, falling leaves and snow all follow the month you are in,
 * and each season's packages are pinned to the month they start.
 */

const COL = 420 // px per month
// month stops 0..11 as fractions of progress
const at = (m: number) => m / 11

const skyTop = ['#c7dcf2', '#d9ecff', '#cfeaff', '#b9e4ff', '#8fd3f2', '#6cc6f0', '#5fbdec', '#7cc4e8', '#a6c9de', '#f2c38b', '#c9cfdb', '#b7c6db']
const skyBottom = ['#f4f8ff', '#f6fbff', '#fff4d6', '#fdf0b8', '#fff1a8', '#ffe58a', '#ffd86b', '#ffe08a', '#ffd08a', '#ffb878', '#e9e4ef', '#eef3fb']
const groundCol = ['#f4f8ff', '#eef4fb', '#b9c98b', '#8fc25f', '#6ebd4f', '#5db04a', '#59a845', '#62a646', '#86a746', '#b49a4a', '#a39a7e', '#f1f5fb']
const canopyCol = ['#8b7a6a', '#8b7a6a', '#9fbf6a', '#79c25a', '#4fa83f', '#3f9a36', '#3c9334', '#4b9a38', '#c4a23a', '#e07a2e', '#9a6a4a', '#8b7a6a']
const stops = months.map((_, i) => at(i))

function PackagePin({ id }: { id: string }) {
  const p = packages.find((x) => x.id === id)!
  const on = usePlan((s) => !!s.picked[id])
  const lot = usePlan((s) => s.lot)
  return (
    <motion.div className={`pin-card ${on ? 'on' : ''}`} title={p.blurb} whileHover={{ y: -6, rotate: 0 }} style={{ rotate: id.length % 2 ? -1.5 : 1.5 }}>
      <span className="pin-dot" aria-hidden="true" />
      <div className="pin-head">
        <Icon name={p.icon} />
        <strong>{p.name}</strong>
      </div>
      <div className="pin-foot">
        <span>${priceOf(id, lot)} · {p.unit}</span>
        <button type="button" onClick={() => plan.toggle(id)} aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${p.name}`}>
          <Icon name={on ? 'check' : 'plus'} size={16} />
          {on ? 'In my year' : 'Add'}
        </button>
      </div>
    </motion.div>
  )
}

const notes = [
  'Snow clearing after every 5 cm.',
  'Pruning plans while trees sleep.',
  'Planning season. Book your spring slot.',
  'Spring wake-up: rake, edge, first feed.',
  'Aeration, overseeding, beds planted.',
  'Weekly mowing in full swing.',
  'Deep watering, deadheading, trimming.',
  'Second feed, hedge shaping.',
  'Overseed bare spots while nights cool.',
  'Fall cleanup and the last cut.',
  'Leaves out, beds put to sleep.',
  'Snow stakes in, plows ready.',
]

export default function YearTimeline() {
  const section = useRef<HTMLElement>(null)
  const [vw, setVw] = useState(1200)
  const [month, setMonth] = useState(0)
  useEffect(() => {
    const r = () => setVw(window.innerWidth)
    r()
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])
  const col = vw < 760 ? Math.min(320, vw * 0.82) : COL
  const trackW = col * 12 + 160
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })
  const x = useTransform(p, [0, 1], [0, -(trackW - vw + 40)])

  const top = useTransform(p, stops, skyTop)
  const bottom = useTransform(p, stops, skyBottom)
  const sky = useMotionTemplate`linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`
  const ground = useTransform(p, stops, groundCol)
  const canopy = useTransform(p, stops, canopyCol)
  const bare = useTransform(p, [at(1), at(2.6), at(9.5), at(10.6)], [0, 1, 1, 0])
  const grow = useTransform(p, [at(2.4), at(4.2), at(9.6), at(10.4)], [0.02, 1, 1, 0.02])
  const bloom = useTransform(p, [at(4), at(5.2), at(8), at(9.5)], [0, 1, 1, 0.2])
  const wilt = useTransform(p, [at(8.2), at(9.8)], [0, 1])
  const snow = useTransform(p, [0, at(1.8), at(2.4), at(10.2), at(11)], [1, 1, 0, 0, 1])
  const leaves = useTransform(p, [at(8.6), at(9.2), at(10.2), at(10.8)], [0, 1, 1, 0])
  const blossom = useTransform(p, [at(2.6), at(3.4), at(4.6), at(5.2)], [0, 1, 1, 0])
  const birds = useTransform(p, [at(2), at(3), at(8.5), at(9.5)], [0, 1, 1, 0])
  const season: Season = { grow, bloom, wilt, canopy, bare, blossom, snow }
  const sunY = useTransform(p, [0, at(6), 1], [140, 40, 150])
  const sunX = useTransform(p, [0, 1], [vw * 0.15, vw * 0.8])
  const bar = useTransform(p, [0, 1], ['0%', '100%'])
  useMotionValueEvent(p, 'change', (v) => setMonth(Math.min(11, Math.max(0, Math.round(v * 11)))))

  const plants = useMemo(() => Array.from({ length: Math.ceil(trackW / 64) }, (_, i) => i), [trackW])
  // x position of the middle of a month column on the track
  const mx = (m: number, f = 0.5) => 40 + col * (m + f)
  const flakes = useMemo(() => Array.from({ length: 46 }, (_, i) => ({ l: (i * 37) % 100, d: 4 + (i % 7), s: 4 + (i % 4) * 2, delay: (i % 10) * 0.5 })), [])
  const falling = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ l: (i * 53) % 100, d: 5 + (i % 5), delay: (i % 8) * 0.6, c: ['#e07a2e', '#c4a23a', '#b5452c'][i % 3] })), [])

  return (
    <section ref={section} className="year" id="year" style={{ height: `calc(100svh + ${trackW - vw + 40}px)` }} aria-labelledby="year-title">
      <motion.div className="year-sticky" style={{ backgroundImage: sky }}>
        <motion.div className="year-sun" style={{ x: sunX, y: sunY }} aria-hidden="true" />
        <motion.div className="year-snow" style={{ opacity: snow }} aria-hidden="true">
          {flakes.map((f, i) => <i key={i} style={{ left: `${f.l}%`, width: f.s, height: f.s, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }} />)}
        </motion.div>
        <motion.div className="year-birds" style={{ opacity: birds }} aria-hidden="true">
          {[0, 1, 2, 3].map((k) => (
            <svg key={k} viewBox="0 0 40 20" style={{ top: `${18 + k * 7}%`, animationDuration: `${16 + k * 5}s`, animationDelay: `${k * -4}s`, width: 26 - k * 3 }}>
              <path d="M2 10 Q 10 2, 20 10 Q 30 2, 38 10" fill="none" stroke="#2c3e2a" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          ))}
        </motion.div>
        <motion.div className="year-leaves" style={{ opacity: leaves }} aria-hidden="true">
          {falling.map((f, i) => <i key={i} style={{ left: `${f.l}%`, background: f.c, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }} />)}
        </motion.div>

        <div className="year-head wrap">
          <span className="eyebrow">The growing year</span>
          <h2 id="year-title">A year in your yard, <span className="hl">month by month.</span></h2>
        </div>

        <motion.div className="year-track" style={{ x, width: trackW }}>
          <div className="year-cols">
            {months.map((m, i) => {
              const starts = packages.filter((pk) => pk.months[0] === i)
              return (
                <div key={m} className={`year-col ${i === month ? 'now' : ''}`} style={{ width: col }}>
                  <span className="year-month">{m}</span>
                  <p className="year-note">{notes[i]}</p>
                  <div className="pins">{starts.map((pk) => <PackagePin key={pk.id} id={pk.id} />)}</div>
                </div>
              )
            })}
          </div>
          <svg className="year-garden" width={trackW} height="260" viewBox={`0 -220 ${trackW} 260`} aria-hidden="true">
            <g transform="translate(0 -6)"><Fence width={trackW} /></g>
            <motion.path d={`M0 0 Q ${trackW * 0.25} -8 ${trackW * 0.5} -2 T ${trackW} -4 V 40 H 0 Z`} style={{ fill: ground }} />
            <path d={`M0 6 H ${trackW}`} stroke="#000" strokeOpacity=".06" strokeWidth="10" />
            {plants.map((i) => {
              const x = i * 64 + 30
              const sc = 1.25 + (i % 3) * 0.1
              if (i % 11 === 5) return <g key={i} transform={`translate(${x} 0) scale(1.1)`}><Tree x={0} s={season} i={i} /></g>
              if (i % 7 === 3) return <g key={i} transform={`translate(${x} 0) scale(1.15)`}><Sunflower x={0} s={season} /></g>
              const Sp = species[i % species.length]
              return <g key={i} transform={`translate(${x} 0) scale(${sc})`}><Sp x={0} s={season} i={i} /></g>
            })}
            <g transform={`translate(${mx(3, 0.62)} 0)`}><Birdhouse /></g>
            <g transform={`translate(${mx(4, 0.2)} 0)`}><Bees s={season} /></g>
            <g transform={`translate(${mx(6, 0.62)} 0)`}><WateringCan /></g>
            <g transform={`translate(${mx(8, 0.6)} 0)`}><Wheelbarrow /></g>
            <g transform={`translate(${mx(9, 0.62)} 0)`}><Pumpkins /></g>
            <g transform={`translate(${mx(10, 0.55)} 0)`}><LeafPile /></g>
            <g transform={`translate(${mx(0, 0.62)} 0)`}><Snowman s={season} /></g>
            <g transform={`translate(${mx(11, 0.62)} 0)`}><Snowman s={season} /></g>
            <motion.path d={`M0 2 Q ${trackW * 0.25} -6 ${trackW * 0.5} 0 T ${trackW} -2 V 40 H 0 Z`} fill="#ffffff" style={{ opacity: snow }} />
          </svg>
        </motion.div>

        <div className="year-progress wrap" aria-hidden="true">
          <div className="year-bar"><motion.i style={{ width: bar }} /></div>
          <div className="year-ticks">{months.map((m, i) => <span key={m} className={i === month ? 'on' : ''}>{m}</span>)}</div>
        </div>
      </motion.div>
    </section>
  )
}
