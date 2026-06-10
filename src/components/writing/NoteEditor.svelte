<script lang="ts">
  import { noteStore } from '../../lib/stores/noteStore.svelte'
  import type { NoteType } from '../../lib/db/schema'

  let {
    type,
    projectId,
    placeholder = '',
    label = '',
  }: { type: NoteType; projectId: string; placeholder?: string; label?: string } = $props()

  let content = $state('')
  let isComposing = $state(false)
  let saveTimer: ReturnType<typeof setTimeout>

  $effect(() => {
    let cancelled = false
    noteStore.load(projectId).then(() => {
      if (!cancelled) content = noteStore.getContent(type)
    })
    return () => { cancelled = true }
  })

  function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => noteStore.save(projectId, type, content), 800)
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

  $effect(() => {
    const flush = () => { clearTimeout(saveTimer); noteStore.save(projectId, type, content) }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('beforeunload', flush)
      clearTimeout(saveTimer)
    }
  })
</script>

<div class="ne-wrap">
  {#if label}
    <div class="ne-label">{label}</div>
  {/if}
  <textarea
    class="ne-ta"
    value={content}
    {placeholder}
    oncompositionstart={handleCompositionStart}
    oncompositionend={handleCompositionEnd}
    oninput={handleInput}
    aria-label={label || placeholder}
  ></textarea>
</div>

<style>
  .ne-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100% }
  .ne-label {
    padding: 10px 16px 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: var(--muted);
    font-weight: 600;
    flex-shrink: 0;
  }
  .ne-ta {
    flex: 1;
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    color: var(--text);
    font-size: 14px;
    line-height: 1.9;
    font-family: inherit;
    padding: 12px 28px 80px;
  }
  .ne-ta::placeholder { color: var(--muted) }
</style>
