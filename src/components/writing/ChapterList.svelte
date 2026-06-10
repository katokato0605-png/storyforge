<script lang="ts">
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import ChapterItem from './ChapterItem.svelte'

  async function addChapter() {
    const pid = projectStore.currentProjectId
    if (!pid) return
    await chapterStore.createChapter(pid)
  }
</script>

<div class="ch-panel">
  <div class="ch-ph">
    <span class="ch-ph-label">章</span>
    <div class="ch-ph-acts">
      <button class="iBtn" onclick={addChapter} title="章を追加" aria-label="章を追加">＋</button>
    </div>
  </div>

  <div class="ch-list">
    {#if chapterStore.chapters.length === 0}
      <div style="padding:16px 12px;font-size:12px;color:var(--muted)">
        ＋ で章を追加
      </div>
    {:else}
      {#each chapterStore.chapters as chapter (chapter.id)}
        <ChapterItem {chapter} />
      {/each}
    {/if}
  </div>
</div>

<style>
  .ch-panel{width:180px;min-width:180px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
  .ch-ph{padding:10px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
  .ch-ph-label{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .ch-ph-acts{display:flex;gap:3px}
  .ch-list{flex:1;overflow-y:auto;padding:4px 0}
  @media(max-width:640px){.ch-panel{display:none}}
  @media(max-width:900px){.ch-panel{width:168px;min-width:168px}}
</style>
