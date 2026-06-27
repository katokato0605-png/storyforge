import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: '/storyforge/',
  plugins: [svelte()],
  build: {
    target: 'esnext',
  },
  optimizeDeps: { include: ['dexie'] },
})
