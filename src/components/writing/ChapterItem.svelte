<script lang="ts">
  import type { Chapter, ChapterStatus } from '../../lib/db/schema'
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'

  let { chapter }: { chapter: Chapter } = $props()

  const statusColors: Record<ChapterStatus, string> = {
    draft: 'var(--muted)',
    writing: 'var(--accent)',
    review: '#e09020',
    done: 'var(--green)',
  }
  const statusLabels: Record<ChapterStatus, string> = {
    draft: '下書き', writing: '執筆中', review: '見直し', done: '完了',
  }

  const isActive = $derived(chapterStore.currentChapterId === chapter.id)

  function handleDelete(e: MouseEvent) {
    e.stopPropagation()
    appStore.openModal('confirm', {
      title: '章を削除',
      message: `「${chapter.title || '無題'}」（${chapter.wordCount.toLocaleString()}字）を削除しますか？この操作は取り消せません。`,
      confirmLabel: '削除',
      danger: true,
      onConfirm: () => chapterStore.deleteChapter(chapter.id),
    })
  }
</script>

<div
  class="ch-item"
  class:active={isActive}
  onclick={() => chapterStore.selectChapter(chapter.id)}
  role="button"
  tabindex="0"
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), chapterStore.selectChapter(chapter.id))}
>
  <span class="ch-status" style="background:{statusColors[chapter.status]}" aria-label={statusLabels[chapter.status]}>{statusLabels[chapter.status][0]}</span>
  <span class="ch-item-t">{chapter.title || '無題'}</span>
  <div class="ch-item-btns">
    <button class="ch-micro-btn del" onclick={handleDelete} title="削除" aria-label="章を削除">✕</button>
  </div>
</div>

<style>
  .ch-item{padding:7px 12px;cursor:pointer;color:var(--muted);font-size:13px;border-left:3px solid transparent;transition:.1s;display:flex;align-items:center;gap:5px;user-select:none}
  .ch-item:hover{color:var(--text);background:var(--surface2)}
  .ch-item.active{color:var(--text);border-left-color:var(--accent);background:var(--surface2)}
  .ch-item-t{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ch-item-btns{display:flex;flex-shrink:0;gap:2px;opacity:0;transition:opacity .15s}
  .ch-item:hover .ch-item-btns,.ch-item.active .ch-item-btns{opacity:1}
  .ch-micro-btn{background:none;border:none;cursor:pointer;color:var(--muted);padding:1px 3px;border-radius:3px;font-size:11px;line-height:1;transition:.1s}
  .ch-micro-btn.del:hover{color:var(--danger)}
  .ch-status{font-size:10px;font-weight:700;border-radius:4px;padding:2px 5px;flex-shrink:0;line-height:1.4;min-width:20px;text-align:center;color:#fff}
</style>
