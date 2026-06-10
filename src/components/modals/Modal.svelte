<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'

  let { children }: { children?: import('svelte').Snippet } = $props()

  let dialogEl: HTMLDivElement | undefined

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) appStore.closeModal()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); appStore.closeModal() }
    if (e.key === 'Tab') trapFocus(e)
  }

  function trapFocus(e: KeyboardEvent) {
    if (!dialogEl) return
    const focusable = dialogEl.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
  }

  $effect(() => {
    const prev = document.activeElement as HTMLElement | null
    const first = dialogEl?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    first?.focus()
    return () => prev?.focus()
  })
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="modal-backdrop"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  onmousedown={handleBackdrop}
  onkeydown={handleKeydown}
>
  <div class="modal-box" bind:this={dialogEl}>
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,.55);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .modal-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    min-width: 320px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 40px var(--shadow);
    animation: fadeIn .15s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(.96) translateY(4px) }
    to   { opacity: 1; transform: none }
  }
</style>
