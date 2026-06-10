<script lang="ts">
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'

  let { content, dailyGoal = 1000 }: { content: string; dailyGoal?: number } = $props()

  // セッション開始時の文字数（ページロード時の現在章の文字数）
  let sessionStart = $state(0)
  let todayCount = $state(0)

  const charsNow = $derived([...content].length)
  const progress = $derived(Math.min(todayCount / dailyGoal * 100, 100))
  const done = $derived(todayCount >= dailyGoal)

  $effect(() => {
    // 章が切り替わったらセッション起点をリセット
    sessionStart = charsNow
  })

  $effect(() => {
    const delta = charsNow - sessionStart
    if (delta > 0) todayCount = delta
  })
</script>

<div class="write-foot">
  <span>{charsNow.toLocaleString()} 字</span>
  <span>合計 {chapterStore.totalWordCount.toLocaleString()} 字</span>
  {#if chapterStore.isDirty}
    <span style="color:var(--muted)">保存中…</span>
  {:else}
    <span style="color:var(--green)">✓ 保存済</span>
  {/if}
  <div class="today-cnt" title="今日の目標">
    <span style="font-size:11px">今日 {todayCount}</span>
    <div class="today-bar-wrap">
      <div class="today-bar" class:done style="width:{progress}%"></div>
    </div>
    <span style="font-size:10px;color:var(--muted)">/{dailyGoal}</span>
  </div>
</div>

<style>
  .write-foot{padding:7px 28px;border-top:1px solid var(--border);font-size:11px;color:var(--muted);display:flex;gap:16px;align-items:center;background:var(--surface);flex-wrap:wrap;flex-shrink:0}
  .today-cnt{display:flex;align-items:center;gap:6px;cursor:default;padding:2px 6px;border-radius:5px}
  .today-bar-wrap{width:60px;height:4px;background:var(--border);border-radius:2px;overflow:hidden}
  .today-bar{height:100%;background:var(--accent);border-radius:2px;transition:width .3s}
  .today-bar.done{background:var(--green)}
  @media(max-width:640px){.write-foot{padding:6px 14px}}
</style>
