<script lang="ts">
  import { onMount } from 'svelte'
  import './styles/global.css'
  import MainLayout from './components/layout/MainLayout.svelte'
  import HomeView from './components/home/HomeView.svelte'
  import ModalHost from './components/modals/ModalHost.svelte'
  import PlotTab from './components/tabs/PlotTab.svelte'
  import TimelineTab from './components/tabs/TimelineTab.svelte'
  import LoreTab from './components/tabs/LoreTab.svelte'
  import IdeaVaultTab from './components/tabs/IdeaVaultTab.svelte'
  import CharacterMakerTab from './components/tabs/CharacterMakerTab.svelte'
  import { appStore } from './lib/stores/appStore.svelte'
  import { projectStore } from './lib/stores/projectStore.svelte'
  import { runMigrationIfNeeded } from './lib/db/migration'

  let ready = $state(false)

  onMount(async () => {
    appStore.init()
    await runMigrationIfNeeded()
    await projectStore.load()
    ready = true

    // Global Ctrl+K → 全文検索
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (appStore.activeModal === 'search') {
          appStore.closeModal()
        } else if (projectStore.currentProjectId) {
          appStore.openModal('search')
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  })
</script>

{#if ready}
  <MainLayout>
    {#snippet home()}
      <HomeView />
    {/snippet}

    {#snippet children()}
      {#if appStore.activeTab === 'plot'}
        <PlotTab />
      {:else if appStore.activeTab === 'timeline'}
        <TimelineTab />
      {:else if appStore.activeTab === 'lore'}
        <LoreTab />
      {:else if appStore.activeTab === 'ideas'}
        <IdeaVaultTab />
      {:else if appStore.activeTab === 'charmaker'}
        <CharacterMakerTab />
      {:else}
        <div class="empty">
          <div class="empty-icon">🚧</div>
          <div class="empty-msg">実装予定のタブです</div>
          <div class="empty-sub">({appStore.activeTab})</div>
        </div>
      {/if}
    {/snippet}
  </MainLayout>

  <ModalHost />
{:else}
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:var(--muted);font-family:sans-serif">
    読み込み中…
  </div>
{/if}
