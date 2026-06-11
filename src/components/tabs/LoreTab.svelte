<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import NoteEditor from '../writing/NoteEditor.svelte'

  type LoreTab = 'character' | 'world' | 'lore'
  let activeTab = $state<LoreTab>('character')

  const tabs: { id: LoreTab; icon: string; label: string }[] = [
    { id: 'character', icon: '👤', label: 'キャラクター' },
    { id: 'world',     icon: '🌍', label: '世界観' },
    { id: 'lore',      icon: '📝', label: 'その他' },
  ]
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <div class="tab-header">
      <h2 class="tab-title">📖 設定資料</h2>
      <span class="tab-hint">自動保存されます</span>
    </div>
    <div class="lore-tabs">
      {#each tabs as t}
        <button
          class="lore-tab-btn"
          class:active={activeTab === t.id}
          onclick={() => activeTab = t.id}
        >
          <span class="lt-icon">{t.icon}</span>
          {t.label}
        </button>
      {/each}
    </div>
    <div class="lore-body">
      {#if activeTab === 'character'}
        <NoteEditor
          type="character"
          projectId={projectStore.currentProjectId}
          placeholder="登場人物のプロフィール、性格、人間関係、成長過程などを記録してください…"
        />
      {:else if activeTab === 'world'}
        <NoteEditor
          type="world"
          projectId={projectStore.currentProjectId}
          placeholder="舞台設定・歴史・魔法など…"
        />
      {:else}
        <NoteEditor
          type="lore"
          projectId={projectStore.currentProjectId}
          placeholder="用語集・固有名詞・ルールなど…"
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  .tab-wrap   { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header { padding: 16px 28px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between }
  .tab-title  { font-size: 16px; font-weight: 700 }
  .tab-hint   { font-size: 11px; color: var(--muted) }

  .lore-tabs {
    display: flex; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    padding: 0 16px;
    gap: 4px;
  }
  .lore-tab-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px; background: none; border: none;
    border-bottom: 2px solid transparent;
    color: var(--muted); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: .15s; font-family: inherit;
    margin-bottom: -1px;
  }
  .lore-tab-btn:hover { color: var(--text) }
  .lore-tab-btn.active { color: var(--accent); border-bottom-color: var(--accent) }
  .lt-icon { font-size: 15px }

  .lore-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0 }
</style>
