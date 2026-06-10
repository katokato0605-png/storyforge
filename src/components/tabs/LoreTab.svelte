<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import NoteEditor from '../writing/NoteEditor.svelte'
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <div class="tab-header">
      <h2 class="tab-title">📖 設定資料</h2>
      <span class="tab-hint">自動保存されます</span>
    </div>
    <div class="lore-cols">
      <div class="lore-col">
        <NoteEditor
          type="character"
          projectId={projectStore.currentProjectId}
          label="キャラクター"
          placeholder="登場人物のプロフィールなど…"
        />
      </div>
      <div class="lore-col">
        <NoteEditor
          type="world"
          projectId={projectStore.currentProjectId}
          label="世界観"
          placeholder="舞台設定・歴史・魔法など…"
        />
      </div>
      <div class="lore-col">
        <NoteEditor
          type="lore"
          projectId={projectStore.currentProjectId}
          label="その他の設定"
          placeholder="用語集・固有名詞・ルールなど…"
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .tab-wrap  { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header{ padding: 16px 28px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between }
  .tab-title { font-size: 16px; font-weight: 700 }
  .tab-hint  { font-size: 11px; color: var(--muted) }
  .lore-cols {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    overflow: hidden;
    min-height: 0;
  }
  .lore-col {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    overflow: hidden;
  }
  .lore-col:last-child { border-right: none }

  @media (max-width: 900px) {
    .lore-cols { grid-template-columns: 1fr 1fr }
  }
  @media (max-width: 640px) {
    .lore-cols { grid-template-columns: 1fr; overflow-y: auto }
    .lore-col  { border-right: none; border-bottom: 1px solid var(--border); min-height: 280px }
  }
</style>
