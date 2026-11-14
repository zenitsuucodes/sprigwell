const paths: Record<string, string> = {
  sprout: 'M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5z',
  seed: 'M12 3c4 4 5 8 2 12-2 2.5-6 2.5-7 0-2-3 1-8 5-12zM9 14c1-2 2-3 4-4',
  mower: 'M3 16h12l3-6h3M6 16v-3h8M7 19.5a1.5 1.5 0 1 0 0-.01M16 19.5a1.5 1.5 0 1 0 0-.01',
  drop: 'M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z',
  flower: 'M12 21v-7M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 8V5M15 11h3M9 11H6M14 9l2-2M10 9 8 7',
  leaf: 'M5 19C5 10 10 5 20 4c0 9-5 15-14 15zM5 19l8-8',
  snow: 'M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9M9 4.5l3 2 3-2M9 19.5l3-2 3 2',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  cloud: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z',
  rain: 'M7 14h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 7a3.5 3.5 0 0 0 1 7zM8 17l-1 3M12 17l-1 3M16 17l-1 3',
  part: 'M9 7a3 3 0 1 0-3 3M12 19h7a3 3 0 0 0 .5-6 4.5 4.5 0 0 0-8.5 1 2.5 2.5 0 0 0 1 5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
}

export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? ''} />
    </svg>
  )
}
