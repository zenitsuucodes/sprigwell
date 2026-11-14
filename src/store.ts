import { useSyncExternalStore } from 'react'
import type { LotSize } from './data'
import { lotSizes, packages } from './data'

/*
 * Shared between Astro islands (each island is its own React root, but they all
 * import this same module), so pinning a package on the timeline also ticks it
 * in the package picker.
 */
type State = { picked: Record<string, boolean>; lot: LotSize }
let state: State = { picked: { spring: true, mow: true, fall: true }, lot: 'medium' }
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

export const plan = {
  get: () => state,
  subscribe: (f: () => void) => {
    subs.add(f)
    return () => subs.delete(f)
  },
  toggle: (id: string) => {
    state = { ...state, picked: { ...state.picked, [id]: !state.picked[id] } }
    emit()
  },
  setLot: (lot: LotSize) => {
    state = { ...state, lot }
    emit()
  },
}

export function usePlan<T>(sel: (s: State) => T) {
  return useSyncExternalStore(plan.subscribe, () => sel(state), () => sel(state))
}

export function priceOf(id: string, lot: LotSize) {
  const p = packages.find((x) => x.id === id)!
  return Math.round((p.base * lotSizes[lot].factor) / 5) * 5
}

export function totals(s: State) {
  const chosen = packages.filter((p) => s.picked[p.id])
  const byMonth = Array.from({ length: 12 }, () => 0)
  let year = 0
  for (const p of chosen) {
    const price = priceOf(p.id, s.lot)
    year += price
    p.months.forEach((m) => { byMonth[m] += price / p.months.length })
  }
  const discount = chosen.length >= 4 ? 0.1 : chosen.length >= 3 ? 0.05 : 0
  const total = Math.round(year * (1 - discount))
  return { chosen, byMonth, year, discount, total, monthly: Math.round(total / 10) }
}
