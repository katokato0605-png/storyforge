<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import { db } from '../../lib/db/database'
  import { searchInChapters, replaceInContent } from '../../lib/utils/searchReplace'
  import type { ChapterHit } from '../../lib/utils/searchReplace'

  let query = $state('')
  let replacement = $state('')
  let showReplace = $state(false)
  let results = $state<ChapterHit[]>([])
  let searching = $state(false)
  let replaceMsg = $state('')
  let searchTimer: ReturnType<typeof setTimeout>

  $effect(() => {
    const q = query
    clearTimeout(searchTimer)
    replaceMsg = ''
    if (!q.trim()) { results = []; return }
    searching = true
    searchTimer = setTimeout(async () => {
      const pid = projectStore.currentProjectId
      if (!pid) { searching = false; return }
      const chapters = await db.chapters.where('projectId').equals(pid).toArray()
      results = searchInChapters(chapters, q)
      searching = false
    }, 200)
  })

  function goToChapter(chapterId: string) {
    appStore.closeModal()
    appStore.setTab('writing')
    chapterStore.selectChapter(chapterId)
  }

  async function replaceInOne(chapterId: string) {
    if (!query.trim()) return
    const ch = await db.chapters.get(chapterId)
    if (!ch) return
    const { content, count } = replaceInContent(ch.content, query, replacement)
    if (count > 0) {
      await chapterStore.saveContent(chapterId, content)
      replaceMsg = `${count} 件を置換しました`
      // refresh search
      const pid = projectStore.currentProjectId!
      const chapters = await db.chapters.where('projectId').equals(pid).toArray()
      results = searchInChapters(chapters, query)
    }
  }

  async function replaceAllChapters() {
    if (!query.trim()) return
    const pid = projectStore.currentProjectId
    if (!pid) return
    let total = 0
    const chapters = await db.chapters.where('projectId').equals(pid).toArray()
    for (const ch of chapters) {
      const { content, count } = replaceInContent(ch.content, query, replacement)
      if (count > 0) {
        await chapterStore.saveContent(ch.id, content)
        total += count
      }
    }
    replaceMsg = `全 ${total} 件を置換しました`
    results = []
    query = ''
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.stopPropagation(); appStore.closeModal() }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="sm-backdrop" onmousedown={(e) => { if (e.target === e.currentTarget) appStore.closeModal() }} onkeydown={handleKeydown} role="dialog" aria-modal="true" aria-label="全文検索" tabindex="-1">
  <div class="sm-box">
    <div class="sm-top">
      <div class="sm-inp-wrap">
        <span class="sm-icon">🔍</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class="sm-inp"
          value={query}
          oninput={(e) => query = (e.target as HTMLInputElement).value}
          placeholder="作品内を検索…"
          aria-label="検索キーワード"
          autofocus
        />
        {#if query}
          <button class="sm-clear iBtn" onclick={() => { query = ''; results = [] }} aria-label="クリア">✕</button>
        {/if}
      </div>
      <button class="sm-rep-toggle btn btn-ghost btn-sm" onclick={() => showReplace = !showReplace}>
        {showReplace ? '置換を閉じる' : '置換'}
      </button>
    </div>

    {#if showReplace}
      <div class="sm-rep-row">
        <input
          class="fi"
          value={replacement}
          oninput={(e) => replacement = (e.target as HTMLInputElement).value}
          placeholder="置換後のテキスト"
          aria-label="置換テキスト"
        />
        <button class="btn btn-primary btn-sm" onclick={replaceAllChapters} disabled={!query.trim()}>
          すべて置換
        </button>
      </div>
    {/if}

    {#if replaceMsg}
      <div class="sm-rep-msg">{replaceMsg}</div>
    {/if}

    <div class="sm-results">
      {#if searching}
        <div class="sm-empty">検索中…</div>
      {:else if query && results.length === 0}
        <div class="sm-empty">「{query}」は見つかりませんでした</div>
      {:else if results.length > 0}
        <div class="sm-count">{results.reduce((s, r) => s + r.totalCount, 0)} 件 / {results.length} 章</div>
        {#each results as hit}
          <div class="sm-hit">
            <div class="sm-ch-title">
              <button class="sm-ch-btn" onclick={() => goToChapter(hit.chapterId)}>
                {hit.chapterTitle || '（無題）'}
              </button>
              <span class="sm-hit-count">{hit.totalCount} 件</span>
              {#if showReplace}
                <button class="btn btn-ghost btn-sm sm-rep-btn" onclick={() => replaceInOne(hit.chapterId)}>
                  この章を置換
                </button>
              {/if}
            </div>
            {#each hit.snippets as s}
              <div class="sm-snippet">
                <span class="sm-ctx">{s.before}</span><mark class="sm-mark">{s.match}</mark><span class="sm-ctx">{s.after}</span>
              </div>
            {/each}
          </div>
        {/each}
      {:else if !query}
        <div class="sm-empty sm-hint">Ctrl+K でいつでも開けます</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sm-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,.55);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 80px 16px 16px;
  }
  .sm-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: 100%; max-width: 600px;
    box-shadow: 0 8px 40px var(--shadow);
    overflow: hidden;
    animation: fadeIn .12s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-6px) }
    to   { opacity: 1; transform: none }
  }
  .sm-top { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--border) }
  .sm-inp-wrap { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px }
  .sm-inp-wrap:focus-within { border-color: var(--accent) }
  .sm-icon { color: var(--muted); font-size: 14px; flex-shrink: 0 }
  .sm-inp { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 15px; font-family: inherit }
  .sm-inp::placeholder { color: var(--muted) }
  .sm-clear { width: 22px; height: 22px; font-size: 11px; flex-shrink: 0 }
  .sm-rep-row { display: flex; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--border); align-items: center }
  .sm-rep-row .fi { flex: 1; padding: 6px 10px; font-size: 13px }
  .sm-rep-msg { padding: 6px 14px; font-size: 12px; color: var(--green); background: var(--surface2) }
  .sm-results { max-height: 400px; overflow-y: auto }
  .sm-empty { padding: 28px; text-align: center; color: var(--muted); font-size: 13px }
  .sm-hint { font-size: 12px }
  .sm-count { padding: 7px 14px; font-size: 11px; color: var(--muted); background: var(--surface2); border-bottom: 1px solid var(--border) }
  .sm-hit { border-bottom: 1px solid var(--border) }
  .sm-ch-title { display: flex; align-items: center; gap: 8px; padding: 8px 14px 4px; flex-wrap: wrap }
  .sm-ch-btn { background: none; border: none; cursor: pointer; color: var(--accent); font-size: 13px; font-weight: 600; padding: 0; font-family: inherit }
  .sm-ch-btn:hover { text-decoration: underline }
  .sm-hit-count { font-size: 11px; color: var(--muted); background: var(--surface2); padding: 1px 6px; border-radius: 8px }
  .sm-rep-btn { margin-left: auto }
  .sm-snippet { padding: 3px 14px 3px 22px; font-size: 13px; color: var(--muted); line-height: 1.6; white-space: pre-wrap; overflow-wrap: break-word }
  .sm-ctx { color: var(--muted) }
  .sm-mark { background: color-mix(in srgb, var(--accent) 30%, transparent); color: var(--text); border-radius: 2px; padding: 0 1px }
</style>
