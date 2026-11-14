// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  site: 'https://sprigwell.vercel.app',
  integrations: [react()],
  server: { port: 5400 },
})
