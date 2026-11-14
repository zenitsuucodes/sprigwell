export const brand = {
  name: 'Sprigwell',
  full: 'Sprigwell Lawn & Garden',
  phone: '(905) 555-0127',
  phoneHref: '+19055550127',
  area: 'Oakville, Burlington and Milton',
  credit: 'https://builtbydhanush.com',
}

export type LotSize = 'small' | 'medium' | 'large'
export const lotSizes: Record<LotSize, { label: string; detail: string; factor: number }> = {
  small: { label: 'Small', detail: 'Up to 3,000 ft² of lawn', factor: 0.8 },
  medium: { label: 'Medium', detail: '3,000 to 6,000 ft²', factor: 1 },
  large: { label: 'Large', detail: '6,000 to 10,000 ft²', factor: 1.45 },
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter'
export type Pkg = {
  id: string
  name: string
  season: Season
  months: number[] // 0 = Jan
  base: number // CAD, medium lot, per season
  unit: string
  blurb: string
  icon: string
}

export const packages: Pkg[] = [
  { id: 'spring', name: 'Spring wake-up', season: 'spring', months: [3], base: 290, unit: 'one visit', blurb: 'Rake, edge, dethatch, clear beds, first feed.', icon: 'sprout' },
  { id: 'aerate', name: 'Aerate and overseed', season: 'spring', months: [4], base: 240, unit: 'one visit', blurb: 'Core aeration and premium seed for thicker turf.', icon: 'seed' },
  { id: 'mow', name: 'Weekly mowing', season: 'summer', months: [4, 5, 6, 7, 8, 9], base: 1140, unit: '24 visits', blurb: 'Mow, trim, edge and blow every week, May to October.', icon: 'mower' },
  { id: 'feed', name: 'Feeding program', season: 'summer', months: [3, 5, 7, 8, 9], base: 395, unit: '5 rounds', blurb: 'Slow-release organic fertilizer timed to the season.', icon: 'drop' },
  { id: 'beds', name: 'Garden bed care', season: 'summer', months: [4, 5, 6, 7, 8], base: 780, unit: 'every 2 weeks', blurb: 'Weeding, deadheading, mulch top-ups and pruning.', icon: 'flower' },
  { id: 'fall', name: 'Fall cleanup', season: 'fall', months: [9, 10], base: 340, unit: 'two visits', blurb: 'Leaves out, perennials cut back, last feed, gutters cleared.', icon: 'leaf' },
  { id: 'snow', name: 'Snow clearing', season: 'winter', months: [11, 0, 1, 2], base: 690, unit: 'all season', blurb: 'Driveway and walks cleared after every 5 cm snowfall.', icon: 'snow' },
]

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const services = [
  { title: 'Lawn care', text: 'Mowing, feeding, aeration and overseeding for thick, even turf.', hue: 'grass' },
  { title: 'Garden beds', text: 'Planting plans, seasonal colour, mulch and weeding that keeps up.', hue: 'bloom' },
  { title: 'Patios and paths', text: 'Natural stone, pavers and stepping paths, laid on a proper base.', hue: 'stone' },
  { title: 'Trees and hedges', text: 'Shaping, pruning and hedge lines you could set a level on.', hue: 'leaf' },
  { title: 'Seasonal cleanups', text: 'Spring wake-ups and fall cleanups so the yard is ready for what is next.', hue: 'sun' },
  { title: 'Snow clearing', text: 'Driveways and walks cleared after every 5 cm, all winter.', hue: 'frost' },
]

export const yards = [
  { file: 'cedar-deck', title: 'Cedar deck and dry-stone wall', place: 'Glen Abbey, Oakville', tags: ['Hardscape', 'Planting'] },
  { file: 'stepping-path', title: 'Stepping-stone garden path', place: 'Brant Hills, Burlington', tags: ['Hardscape', 'Lawn'] },
  { file: 'cottage-beds', title: 'Cottage-style perennial beds', place: 'Old Oakville', tags: ['Planting'] },
  { file: 'stone-circle', title: 'Circular granite sett patio', place: 'Hawthorne Village, Milton', tags: ['Hardscape'] },
  { file: 'spa-garden', title: 'Spa deck with evergreen screen', place: 'Tyandaga, Burlington', tags: ['Hardscape', 'Planting'] },
  { file: 'family-lawn', title: 'Family lawn renovation', place: 'Bronte, Oakville', tags: ['Lawn'] },
]

export const faqs = [
  ['Do I have to sign a contract?', 'No. Seasonal programs renew only if you say yes. You can pause or cancel mowing with a week of notice.'],
  ['What if it rains on my day?', 'We move you to the next dry day in the same week and text you the new time. You never pay for a visit we skipped.'],
  ['Are your products safe for kids and pets?', 'Our feeding program uses slow-release organic fertilizer. We post a small flag after any treatment and tell you when it is fine to play.'],
  ['Do you haul away clippings and leaves?', 'Yes. Clippings are mulched back into the lawn by default, and leaves and bed waste go to municipal composting.'],
  ['How does billing work?', 'Seasonal programs can be paid up front or in 10 equal monthly payments from March to December.'],
] as const
