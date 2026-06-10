<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import NoteEditor from '../writing/NoteEditor.svelte'
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <div class="tab-header">
      <h2 class="tab-title">📝 メモ</h2>
      <span class="tab-hint">自動保存されます</span>
    </div>
    <div class="tab-body">
      <NoteEditor
        type="memo"
        projectId={projectStore.currentProjectId}
        placeholder="作品に関するメモ、アイデアの断片、気になったこと、参考資料のリンクなどを自由に記録してください…"
      />
    </div>
  </div>
{/if}

<style>
  .tab-wrap  { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header{ padding: 16px 28px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between }
  .tab-title { font-size: 16px; font-weight: 700 }
  .tab-hint  { font-size: 11px; color: var(--muted) }
  .tab-body  { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-height: 0 }
</style>
