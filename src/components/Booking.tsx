import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { lotSizes, services, type LotSize } from '../data'
import { totals, usePlan } from '../store'
import { Icon } from './Icons'

/*
 * Free yard visit request. Days show an expected-sky icon: on wet days the slot
 * becomes a video call, so nobody waits around for a rained-out visit.
 */
const skies = ['sun', 'part', 'cloud', 'rain', 'sun', 'part', 'sun', 'rain', 'cloud', 'sun']

function upcoming() {
  const out: { iso: string; dow: string; day: number; mon: string; sky: string }[] = []
  const d = new Date()
  d.setDate(d.getDate() + 2)
  let i = 0
  while (out.length < 10) {
    const wd = d.getDay()
    if (wd !== 0) {
      out.push({ iso: d.toISOString().slice(0, 10), dow: d.toLocaleDateString('en-CA', { weekday: 'short' }), day: d.getDate(), mon: d.toLocaleDateString('en-CA', { month: 'short' }), sky: skies[(d.getDate() + i) % skies.length] })
      i++
    }
    d.setDate(d.getDate() + 1)
  }
  return out
}

const schema = z.object({
  date: z.string().min(1, 'Pick a day for the visit.'),
  slot: z.enum(['9:30 am', '1:30 pm', '4:30 pm'], { message: 'Pick a time.' }),
  postal: z.string().trim().regex(/^L[0-9][A-Z]\s?[0-9][A-Z][0-9]$/i, 'Enter a full postal code in Oakville, Burlington or Milton, like L6J 2Z4.'),
  name: z.string().trim().min(2, 'Enter your name.'),
  email: z.string().trim().email('Enter a valid email.'),
  phone: z.string().trim().regex(/^[\d\s()+.-]{10,20}$/, 'Enter a phone number.'),
  interests: z.array(z.string()).min(1, 'Tick at least one thing you would like help with.'),
  notes: z.string().max(800),
})

export default function Booking() {
  const days = useMemo(upcoming, [])
  const planState = usePlan((s) => s)
  const t = totals(planState)
  const [f, setF] = useState({ date: '', slot: '', postal: '', name: '', email: '', phone: '', interests: ['Lawn care'] as string[], notes: '', lot: planState.lot as LotSize })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ref, setRef] = useState<string | null>(null)
  const form = useRef<HTMLFormElement>(null)
  const day = days.find((d) => d.iso === f.date)
  const wet = day?.sky === 'rain'

  const set = (k: string, v: unknown) => {
    setF((x) => ({ ...x, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = schema.safeParse(f)
    if (!r.success) {
      const errs: Record<string, string> = {}
      r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message })
      setErrors(errs)
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setRef(`SW-${Math.random().toString(36).slice(2, 7).toUpperCase()}`)
  }
  const inv = (k: string) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `${k}-err` } : {})
  const err = (k: string) => errors[k] && <span className="err" id={`${k}-err`}>{errors[k]}</span>

  if (ref) {
    return (
      <motion.div className="booked" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div className="booked-seal" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
          <Icon name="sprout" size={40} />
        </motion.div>
        <h3>Request received, {f.name.split(' ')[0]}.</h3>
        <p>Reference <b>{ref}</b>. This is a request, not a confirmed appointment yet.</p>
        <ol>
          <li>We hold <b>{day?.dow} {day?.mon} {day?.day}, {f.slot}</b> for you for 24 hours{wet ? ', as a video call because rain is likely' : ''}.</li>
          <li>A designer calls {f.phone} to confirm and ask a few questions about the yard.</li>
          <li>At the visit you get a written plan and a firm price{t.chosen.length ? `, starting from the ${t.chosen.length} package${t.chosen.length > 1 ? 's' : ''} you picked` : ''}.</li>
        </ol>
        <button className="btn ghost" type="button" onClick={() => setRef(null)}>Change something</button>
      </motion.div>
    )
  }

  return (
    <form ref={form} className="book-form" onSubmit={submit} noValidate>
      <fieldset>
        <legend>1 · Pick a day</legend>
        <div className="days" {...inv('date')} tabIndex={-1}>
          {days.map((d, i) => (
            <motion.button key={d.iso} type="button" aria-pressed={f.date === d.iso} onClick={() => set('date', d.iso)}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
              aria-label={`${d.dow} ${d.mon} ${d.day}${d.sky === 'rain' ? ', rain likely, video call' : ''}`}>
              <small>{d.dow}</small>
              <b>{d.day}</b>
              <Icon name={d.sky} size={22} className={`sky ${d.sky}`} />
            </motion.button>
          ))}
        </div>
        {err('date')}
        <AnimatePresence>
          {wet && <motion.p className="wet" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>Rain looks likely that day, so this visit would be a 20-minute video call. Send us a few yard photos after booking.</motion.p>}
        </AnimatePresence>
      </fieldset>

      <fieldset>
        <legend>2 · Pick a time</legend>
        <div className="slots" role="radiogroup" aria-label="Time" {...inv('slot')} tabIndex={-1}>
          {(['9:30 am', '1:30 pm', '4:30 pm'] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={f.slot === s} onClick={() => set('slot', s)}>
              {s}<small>{wet ? 'video call' : 'on-site, 45 min'}</small>
            </button>
          ))}
        </div>
        {err('slot')}
      </fieldset>

      <fieldset>
        <legend>3 · What would you like help with?</legend>
        <div className="interest" {...inv('interests')} tabIndex={-1}>
          {services.map((s) => {
            const on = f.interests.includes(s.title)
            return (
              <label key={s.title} className={on ? 'on' : ''}>
                <input type="checkbox" checked={on} onChange={() => set('interests', on ? f.interests.filter((x) => x !== s.title) : [...f.interests, s.title])} />
                {s.title}
              </label>
            )
          })}
        </div>
        {err('interests')}
      </fieldset>

      <fieldset>
        <legend>4 · About you</legend>
        <div className="fields">
          <label>Name<input autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} {...inv('name')} />{err('name')}</label>
          <label>Postal code<input autoComplete="postal-code" placeholder="L6J 2Z4" value={f.postal} onChange={(e) => set('postal', e.target.value.toUpperCase())} {...inv('postal')} />{err('postal')}</label>
          <label>Email<input type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} {...inv('email')} />{err('email')}</label>
          <label>Phone<input type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} {...inv('phone')} />{err('phone')}</label>
          <label>Lawn size
            <select value={f.lot} onChange={(e) => set('lot', e.target.value)}>
              {(Object.keys(lotSizes) as LotSize[]).map((k) => <option key={k} value={k}>{lotSizes[k].label} · {lotSizes[k].detail}</option>)}
            </select>
          </label>
          <label className="full">Anything we should know? <small>(optional)</small><textarea rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Slopes, dogs, a patch that never grows" /></label>
        </div>
      </fieldset>

      <button className="btn sun" type="submit">Request my free visit <Icon name="arrow" size={18} /></button>
      <p className="fine">Free, no obligation. We confirm by phone within one business day.</p>
    </form>
  )
}
