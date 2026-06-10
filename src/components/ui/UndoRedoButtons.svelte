<script lang="ts">
  let { canUndo, canRedo, onUndo, onRedo }: {
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
  } = $props()
</script>

<div class="ur-wrap">
  <button
    class="ur-btn"
    onclick={onUndo}
    disabled={!canUndo}
    title="元に戻す (Ctrl+Z)"
    aria-label="元に戻す"
  >↩</button>
  <button
    class="ur-btn"
    onclick={onRedo}
    disabled={!canRedo}
    title="やり直す (Ctrl+Y)"
    aria-label="やり直す"
  >↪</button>
</div>

<style>
  .ur-wrap { display: flex; gap: 2px }
  .ur-btn { background: none; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; color: var(--text); padding: 4px 8px; font-size: 15px; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; transition: .15s }
  .ur-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent) }
  .ur-btn:disabled { opacity: .3; cursor: default }
</style>
