export type TabId = 'plot' | 'timeline' | 'lore' | 'ideas' | 'charmaker' | 'name'
export type Theme = 'dark' | 'light'

export interface TabDef {
  id: TabId
  icon: string
  label: string
  shortLabel: string
}

const DEFAULT_TABS: TabDef[] = [
  { id: 'plot',      icon: '📋', label: 'プロット',       shortLabel: 'プロット' },
  { id: 'timeline',  icon: '🕐', label: 'タイムライン',   shortLabel: 'タイム' },
  { id: 'lore',      icon: '📖', label: '設定',           shortLabel: '設定' },
  { id: 'ideas',     icon: '💡', label: 'アイデア',       shortLabel: 'アイデア' },
  { id: 'charmaker', icon: '🎲', label: 'キャラメーカー', shortLabel: 'キャラ' },
  { id: 'name',      icon: '📝', label: 'ネーム',         shortLabel: 'ネーム' },
]

function loadTabOrder(): TabDef[] {
  try {
    const saved = localStorage.getItem('sf_tab_order')
    if (!saved) return [...DEFAULT_TABS]
    const ids: TabId[] = JSON.parse(saved)
    const ordered = ids
      .map(id => DEFAULT_TABS.find(t => t.id === id))
      .filter((t): t is TabDef => t !== undefined)
    const missing = DEFAULT_TABS.filter(t => !ids.includes(t.id))
    return [...ordered, ...missing]
  } catch {
    return [...DEFAULT_TABS]
  }
}

let tabs = $state<TabDef[]>([...DEFAULT_TABS])
let activeTab = $state<TabId>('plot')
let theme = $state<Theme>('dark')
let activeModal = $state<string | null>(null)
let modalProps = $state<unknown>(null)
let status = $state<'idle' | 'ready'>('idle')

export const appStore = {
  get tabs() { return tabs },
  get activeTab() { return activeTab },
  get theme() { return theme },
  get activeModal() { return activeModal },
  get modalProps() { return modalProps },
  get status() { return status },

  setTab(tab: TabId) { activeTab = tab },
  reorderTabs(next: TabDef[]) {
    tabs = next
    localStorage.setItem('sf_tab_order', JSON.stringify(next.map(t => t.id)))
  },
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
    tabs = loadTabOrder()
    status = 'ready'
  },
}
