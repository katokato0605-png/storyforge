<script lang="ts">
  import { appStore, type TabId } from '../../lib/stores/appStore.svelte'
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'

  let drawerOpen = $state(false)

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'plot',     icon: '📋', label: 'プロット' },
    { id: 'timeline', icon: '🕐', label: 'タイム' },
    { id: 'lore',     icon: '📖', label: '設定' },
    { id: 'ideas',    icon: '💡', label: 'アイデア' },
  ]

  function selectTab(id: TabId) {
    appStore.setTab(id)
    drawerOpen = false
  }

  function selectChapter(id: string) {
    chapterStore.selectChapter(id)
    drawerOpen = false
    appStore.setTab('writing')
  }

  async function addChapter() {
    const pid = projectStore.currentProjectId
    if (!pid) return
    await chapterStore.createChapter(pid)
  }

  // ESC closes drawer
  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && drawerOpen) drawerOpen = false
  }
</script>

<svelte:window onkeydown={handleKey} />

{#if drawerOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="bn-overlay" onclick={() => drawerOpen = false}></div>
  <div class="bn-drawer" role="dialog" aria-modal="true" aria-label="章一覧">
    <div class="bn-drawer-title">
      <span>章を選択</span>
      <div class="bn-drawer-acts">
        <button class="iBtn" onclick={addChapter} aria-label="章を追加">＋</button>
        <button class="bn-close" onclick={() => drawerOpen = false} aria-label="閉じる">✕</button>
      </div>
    </div>
    <div class="bn-ch-list">
      {#if chapterStore.chapters.length === 0}
        <div class="bn-empty">章がありません</div>
      {:else}
        {#each chapterStore.chapters as ch (ch.id)}
          <button
            class="bn-ch-item"
            class:active={chapterStore.currentChapterId === ch.id}
            onclick={() => selectChapter(ch.id)}
          >
            <span class="bn-ch-num">{ch.order + 1}</span>
            <span class="bn-ch-title">{ch.title || '（無題）'}</span>
            <span class="bn-ch-wc">{ch.wordCount.toLocaleString()}字</span>
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<nav class="bot-nav" aria-label="ボトムナビゲーション">
  {#if projectStore.currentProjectId}
    <div class="bn-ch-slot">
      <button
        class="bn-tab bn-ch-open"
        class:active={drawerOpen}
        onclick={() => drawerOpen = !drawerOpen}
        aria-label="章一覧を開く"
      >
        <span class="bn-icon">☰</span>
        <span class="bn-lbl">章</span>
      </button>
      <button class="bn-tab bn-ch-plus" onclick={() => projectStore.selectProject(null)} aria-label="ホームに戻る">
        <span class="bn-icon">🏠</span>
      </button>
    </div>
  {/if}

  {#each tabs as tab}
    {#if !projectStore.currentProjectId && tab.id !== 'ideas'}
      <!-- プロジェクト未選択時はアイデアのみ表示 -->
    {:else}
      <button
        class="bn-tab"
        class:active={appStore.activeTab === tab.id && !drawerOpen}
        onclick={() => selectTab(tab.id)}
        aria-label={tab.label}
        aria-current={appStore.activeTab === tab.id && !drawerOpen ? 'page' : undefined}
      >
        <span class="bn-icon">{tab.icon}</span>
        <span class="bn-lbl">{tab.label}</span>
      </button>
    {/if}
  {/each}
</nav>

<style>
  .bot-nav {
    display: none; /* shown via media query in global.css */
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 90;
    background: var(--surface); border-top: 1px solid var(--border);
    height: 56px; padding: 0 4px;
    justify-content: space-around; align-items: center;
    box-shadow: 0 -2px 12px var(--shadow);
  }
  @media (max-width: 640px) { .bot-nav { display: flex } }

  .bn-tab {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2px; background: none; border: none; cursor: pointer;
    color: var(--muted); padding: 6px 2px; border-radius: 8px;
    font-size: 10px; transition: .1s; min-width: 0;
  }
  .bn-tab:hover, .bn-tab.active { color: var(--accent) }
  .bn-ch-slot {
    flex: 1; display: flex; align-items: stretch;
    border-right: 1px solid var(--border);
  }
  .bn-ch-open { flex: 1 }
  .bn-ch-plus {
    flex: none; width: 36px; padding: 0;
    border-left: 1px solid var(--border);
    color: var(--accent); font-size: 18px;
  }
  .bn-tab.active { background: color-mix(in srgb, var(--accent) 12%, transparent) }
  .bn-icon { font-size: 18px; line-height: 1 }
  .bn-lbl  { font-size: 10px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }

  .bn-overlay {
    position: fixed; inset: 0; z-index: 110;
    background: rgba(0,0,0,.5);
  }
  .bn-drawer {
    position: fixed; bottom: 56px; left: 0; right: 0; z-index: 120;
    background: var(--surface); border-top: 1px solid var(--border);
    border-radius: 16px 16px 0 0;
    max-height: 60vh; display: flex; flex-direction: column;
    animation: slideUp .2s ease;
    box-shadow: 0 -4px 24px var(--shadow);
  }
  @keyframes slideUp {
    from { transform: translateY(100%) }
    to   { transform: none }
  }
  .bn-drawer-title {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px 10px; font-size: 14px; font-weight: 700;
    border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .bn-drawer-acts { display: flex; align-items: center; gap: 8px }
  .bn-close { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 16px; padding: 4px }
  .bn-ch-list { overflow-y: auto; padding: 8px 0 8px }
  .bn-empty   { padding: 20px; text-align: center; color: var(--muted); font-size: 13px }
  .bn-ch-item {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 10px 18px; background: none; border: none; cursor: pointer;
    color: var(--text); text-align: left; font-family: inherit; font-size: 14px;
    transition: .1s;
  }
  .bn-ch-item:hover, .bn-ch-item.active { background: var(--surface2); color: var(--accent) }
  .bn-ch-num   { font-size: 11px; color: var(--muted); min-width: 20px }
  .bn-ch-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  .bn-ch-wc    { font-size: 11px; color: var(--muted); flex-shrink: 0 }
</style>
