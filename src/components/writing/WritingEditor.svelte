<script lang="ts">
  import { onMount } from 'svelte'
  import { db } from '../../lib/db/database'
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import InputToolbar from './InputToolbar.svelte'
  import WordCounter from './WordCounter.svelte'

  let { chapterId }: { chapterId: string } = $props()

  let content = $state('')
  let title = $state('')
  let isComposing = $state(false)
  let textareaEl: HTMLTextAreaElement | undefined
  let toolbarRef: InputToolbar | undefined
  let saveTimer: ReturnType<typeof setTimeout>
  let maxSaveTimer: ReturnType<typeof setTimeout>
  let focusMode = $state(false)

  // 章が切り替わったらコンテンツをロード
  $effect(() => {
    const chapter = chapterStore.chapters.find(c => c.id === chapterId)
    if (chapter) {
      content = chapter.content
      title = chapter.title
    }
    if (textareaEl) toolbarRef?.setRef(textareaEl)
  })

  function scheduleSave() {
    chapterStore.markDirty()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(flushSave, 800)
  }

  async function flushSave() {
    clearTimeout(saveTimer)
    clearTimeout(maxSaveTimer)
    await chapterStore.saveContent(chapterId, content)
    // 30秒後に再フラッシュ（最長保証）
    maxSaveTimer = setTimeout(flushSave, 30_000)
  }

  function handleCompositionStart() { isComposing = true }
  function handleCompositionEnd(e: CompositionEvent) {
    isComposing = false
    content = (e.target as HTMLTextAreaElement).value
    scheduleSave()
  }
  function handleInput(e: Event) {
    if (!isComposing) {
      content = (e.target as HTMLTextAreaElement).value
      scheduleSave()
    }
  }

  async function handleTitleInput(e: Event) {
    const v = (e.target as HTMLInputElement).value
    title = v
    await chapterStore.updateTitle(chapterId, v)
  }

  function handleInsert(result: { value: string; selectionStart: number; selectionEnd: number }) {
    if (!textareaEl) return
    content = result.value
    // 次フレームでカーソル位置を復元
    requestAnimationFrame(() => {
      textareaEl!.setSelectionRange(result.selectionStart, result.selectionEnd)
      textareaEl!.focus()
    })
    scheduleSave()
  }

  // タブ離脱・非表示時に即時保存
  $effect(() => {
    const handler = () => { if (chapterStore.isDirty) flushSave() }
    document.addEventListener('visibilitychange', handler)
    window.addEventListener('beforeunload', handler)
    return () => {
      document.removeEventListener('visibilitychange', handler)
      window.removeEventListener('beforeunload', handler)
      clearTimeout(saveTimer)
      clearTimeout(maxSaveTimer)
    }
  })

  onMount(() => {
    if (textareaEl) toolbarRef?.setRef(textareaEl)
  })
</script>

<div class="write-col" class:focus-mode={focusMode}>
  <div class="ch-title-wrap">
    <input
      class="ch-title-inp"
      value={title}
      oninput={handleTitleInput}
      placeholder="章タイトル"
      aria-label="章タイトル"
    />
  </div>
  <div class="write-div"></div>

  <InputToolbar bind:this={toolbarRef} oninsert={handleInsert} />

  <div class="ch-body">
    <textarea
      bind:this={textareaEl}
      class="ch-ta"
      value={content}
      placeholder="ここから執筆を始めてください…"
      oncompositionstart={handleCompositionStart}
      oncompositionend={handleCompositionEnd}
      oninput={handleInput}
      aria-label="本文"
    ></textarea>
  </div>

  <WordCounter {content} />
</div>

<button
  class="focus-toggle iBtn"
  onclick={() => focusMode = !focusMode}
  title={focusMode ? 'フォーカスモード終了 (F)' : 'フォーカスモード (F)'}
  aria-label="フォーカスモード切替"
>
  {focusMode ? '⊠' : '⊡'}
</button>

<style>
  .write-col{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative}
  .ch-title-wrap{padding:20px 28px 0;flex-shrink:0}
  .ch-title-inp{background:transparent;border:none;outline:none;color:var(--text);font-size:22px;font-weight:800;width:100%;font-family:inherit}
  .ch-title-inp::placeholder{color:var(--muted)}
  .write-div{height:1px;background:var(--border);margin:10px 28px;flex-shrink:0}
  .ch-body{flex:1;overflow-y:auto;padding:0 28px;display:flex;flex-direction:column;min-height:0}
  .ch-ta{flex:1;min-height:600px;width:100%;background:transparent;border:none;outline:none;resize:none;color:var(--text);font-size:16px;line-height:2;font-family:'Hiragino Mincho ProN','Yu Mincho','Georgia',serif;letter-spacing:.04em;padding-bottom:120px}
  .ch-ta::placeholder{color:var(--muted)}
  .focus-toggle{position:fixed;bottom:48px;right:16px;z-index:50;opacity:.4;transition:opacity .2s}
  .focus-toggle:hover{opacity:1}
  @media(max-width:640px){
    .ch-title-wrap{padding:14px 14px 0}
    .write-div{margin:8px 14px}
    .ch-body{padding:0 14px}
  }
</style>
