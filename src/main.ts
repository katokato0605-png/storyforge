import { mount } from 'svelte'
import App from './App.svelte'

// テーマをマウント前に適用してフラッシュを防ぐ
const saved = localStorage.getItem('sf_theme') ?? 'dark'
document.documentElement.setAttribute('data-theme', saved)

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
