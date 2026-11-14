import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { lotSizes, months, packages, type LotSize } from '../data'
import { plan, priceOf, totals, usePlan } from '../store'
import { Icon } from './Icons'

function Money({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => `$${Math.round(v).toLocaleString('en-CA')}`)
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1] })
    return () => c.stop()
  }, [mv, value])
  return <motion.span className={className}>{text}</motion.span>
}

const seasonClass: Record<string, string> = { spring: 'sp', summer: 'su', fall: 'fa', winter: 'wi' }

export default function PackagePicker() {
  const state = usePlan((s) => s)
  const lot = state.lot
  const t = totals(state)
  const peak = Math.max(...t.byMonth, 1)

  return (
    <div className="picker">
      <div className="picker-list">
        <fieldset className="lot">
          <legend>Your lawn size</legend>
          <div className="lot-opts" role="radiogroup" aria-label="Lawn size">
            {(Object.keys(lotSizes) as LotSize[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={lot === k} onClick={() => plan.setLot(k)}>
                {lot === k && <motion.span layoutId="lot-pill" className="lot-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="lot-text"><b>{lotSizes[k].label}</b><small>{lotSizes[k].detail}</small></span>
              </button>
            ))}
          </div>
        </fieldset>

        <ul className="pk-rows">
          {packages.map((p, i) => {
            const on = !!state.picked[p.id]
            return (
              <motion.li key={p.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <label className={`pk-row ${on ? 'on' : ''} ${seasonClass[p.season]}`}>
                  <input type="checkbox" checked={on} onChange={() => plan.toggle(p.id)} />
                  <span className="pk-icon"><Icon name={p.icon} /></span>
                  <span className="pk-text">
                    <b>{p.name}</b>
                    <small>{p.blurb}</small>
                  </span>
                  <span className="pk-meta">
                    <Money value={priceOf(p.id, lot)} className="pk-price" />
                    <small>{p.unit}</small>
                  </span>
                  <span className="pk-tick" aria-hidden="true"><Icon name={on ? 'check' : 'plus'} size={16} /></span>
                </label>
              </motion.li>
            )
          })}
        </ul>
      </div>

      <aside className="picker-sum" aria-live="polite" aria-label="Your year">
        <span className="eyebrow light">Your year with Sprigwell</span>
        <Money value={t.total} className="sum-big" />
        <p className="sum-sub">
          or <b><Money value={t.monthly} /></b> a month for 10 months
          {t.discount > 0 && <span className="save"> · {Math.round(t.discount * 100)}% bundle saving</span>}
        </p>
        <div className="sum-chart" aria-hidden="true">
          {t.byMonth.map((v, i) => (
            <div key={i} className="sum-col">
              <motion.i animate={{ height: `${Math.max(3, (v / peak) * 100)}%` }} transition={{ type: 'spring', stiffness: 160, damping: 20 }} className={v ? 'on' : ''} />
              <span>{months[i][0]}</span>
            </div>
          ))}
        </div>
        <p className="sum-note">
          {t.chosen.length ? `${t.chosen.length} package${t.chosen.length > 1 ? 's' : ''}. ` : 'Pick a package to start. '}
          Bundle 3 for 5% off, 4 or more for 10% off. Estimates before tax; your firm price comes after a free site visit.
        </p>
        <a className="btn sun block" href="#book">Book a free yard visit <Icon name="arrow" size={18} /></a>
      </aside>
    </div>
  )
}
