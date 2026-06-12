export type TabId = 'plot' | 'timeline' | 'lore' | 'ideas' | 'charmaker'
export type Theme = 'dark' | 'light'

let activeTab = $state<TabId>('plot')
let theme = $state<Theme>('dark')
let activeModal = $state<string | null>(null)
let modalProps = $state<unknown>(null)
let status = $state<'idle' | 'ready'>('idle')

export const appStore = {
  get activeTab() { return activeTab },
  get theme() { return theme },
  get activeModal() { return activeModal },
  get modalProps() { return modalProps },
  get status() { return status },

  setTab(tab: TabId) { activeTab = tab },
  setTheme(t: Theme) {
    theme = t
    document.documentElement.setAttribute('data-theme', t)
  },
  openModal(name: string, props?: unknown) {
    activeModal = name
    modalProps = props ?? null
  },
  closeModal() {
    activeModal = null
    modalProps = null
  },
  init() {
    const saved = localStorage.getItem('sf_theme') as Theme | null
    const t = saved ?? 'dark'
    theme = t
    document.documentElement.setAttribute('data-theme', t)
    status = 'ready'
  },
}
