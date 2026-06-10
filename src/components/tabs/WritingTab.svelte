<script lang="ts">
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import ChapterList from '../writing/ChapterList.svelte'
  import WritingEditor from '../writing/WritingEditor.svelte'

  $effect(() => {
    const pid = projectStore.currentProjectId
    if (pid) chapterStore.load(pid)
  })

  async function addChapter() {
    const pid = projectStore.currentProjectId
    if (!pid) return
    await chapterStore.createChapter(pid)
  }
</script>

<div class="write-layout">
  <ChapterList />

  <div class="write-col-wrap">
    {#if chapterStore.status === 'loading'}
      <div class="empty"><div class="empty-icon">⏳</div><div class="empty-msg">読み込み中…</div></div>
    {:else if chapterStore.status === 'error'}
      <div class="empty">
        <div class="empty-icon">⚠️</div>
        <div class="empty-msg">IndexedDB にアクセスできません</div>
        <div class="empty-sub">プライベートモードでは使用できない場合があります</div>
      </div>
    {:else if chapterStore.currentChapterId}
      <WritingEditor chapterId={chapterStore.currentChapterId} />
    {:else}
      <div class="empty">
        <div class="empty-icon">✏️</div>
        <div class="empty-msg">章を選択してください</div>
        <button class="add-ch-btn" onclick={addChapter}>＋ 新しい章を追加</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .write-layout{display:flex;height:100%;overflow:hidden;flex:1}
  .write-col-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
  .add-ch-btn{
    margin-top:16px;padding:10px 24px;
    background:var(--accent);color:#fff;border:none;border-radius:10px;
    font-size:15px;font-family:inherit;cursor:pointer;
  }
</style>
