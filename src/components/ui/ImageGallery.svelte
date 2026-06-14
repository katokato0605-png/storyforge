<script lang="ts">
  import { onMount } from 'svelte'
  import { imageStore } from '../../lib/stores/imageStore.svelte'

  let { projectId, tabId }: { projectId: string; tabId: string } = $props()

  let open = $state(false)
  let viewImg = $state<{ dataUrl: string; name: string } | null>(null)
  let fileInput: HTMLInputElement

  onMount(() => {
    imageStore.load(projectId, tabId)
  })

  $effect(() => {
    if (projectId && tabId) imageStore.load(projectId, tabId)
  })

  function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        imageStore.add(projectId, tabId, file.name, dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer?.files ?? null)
  }

  function onPaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        handleFiles(item.getAsFile() ? [item.getAsFile()!] as unknown as FileList : null)
      }
    }
  }
</script>

<svelte:window onpaste={open ? onPaste : undefined} />

<div class="ig-wrap">
  <button class="ig-toggle" onclick={() => open = !open}>
    <span class="ig-icon">🖼</span>
    <span class="ig-lbl">画像 {imageStore.images.length > 0 ? `(${imageStore.images.length})` : ''}</span>
    <span class="ig-chevron">{open ? '▲' : '▼'}</span>
  </button>

  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="ig-panel"
      ondragover={(e) => e.preventDefault()}
      ondrop={onDrop}
    >
      <div class="ig-grid">
        {#each imageStore.images as img (img.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div class="ig-thumb" onclick={() => viewImg = { dataUrl: img.dataUrl, name: img.name }}>
            <img src={img.dataUrl} alt={img.name} />
            <button
              class="ig-del"
              onclick={(e) => { e.stopPropagation(); imageStore.remove(img.id) }}
              aria-label="削除"
            >✕</button>
          </div>
        {/each}
        <button class="ig-add" onclick={() => fileInput.click()} aria-label="画像を追加">
          <span>＋</span>
          <span class="ig-add-hint">画像追加</span>
        </button>
      </div>
      <div class="ig-hint">ドラッグ＆ドロップまたは Ctrl+V でも追加できます</div>
    </div>
  {/if}
</div>

<input
  bind:this={fileInput}
  type="file"
  accept="image/*"
  multiple
  style="display:none"
  onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
/>

{#if viewImg}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="ig-viewer" onclick={() => viewImg = null}>
    <div class="ig-viewer-inner" onclick={(e) => e.stopPropagation()}>
      <img src={viewImg.dataUrl} alt={viewImg.name} />
      <button class="ig-viewer-close" onclick={() => viewImg = null}>✕</button>
    </div>
  </div>
{/if}

<style>
  .ig-wrap { border-top: 1px solid var(--border); flex-shrink: 0 }

  .ig-toggle {
    width: 100%; display: flex; align-items: center; gap: 6px;
    padding: 10px 20px; background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 12px; font-family: inherit;
    text-align: left; transition: color .15s;
  }
  .ig-toggle:hover { color: var(--text) }
  .ig-icon { font-size: 14px }
  .ig-lbl { flex: 1; font-weight: 600 }
  .ig-chevron { font-size: 10px }

  .ig-panel {
    padding: 10px 20px 14px;
    background: var(--surface2);
    border-top: 1px solid var(--border);
  }
  .ig-grid {
    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;
  }
  .ig-thumb {
    position: relative; width: 72px; height: 72px;
    border-radius: 8px; overflow: hidden;
    border: 1px solid var(--border); cursor: pointer;
    transition: border-color .15s;
  }
  .ig-thumb:hover { border-color: var(--accent) }
  .ig-thumb img { width: 100%; height: 100%; object-fit: cover }
  .ig-del {
    position: absolute; top: 2px; right: 2px;
    background: rgba(0,0,0,.6); color: #fff;
    border: none; border-radius: 50%;
    width: 18px; height: 18px; font-size: 10px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .15s;
  }
  .ig-thumb:hover .ig-del { opacity: 1 }

  .ig-add {
    width: 72px; height: 72px; border-radius: 8px;
    border: 1.5px dashed var(--border);
    background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2px; color: var(--muted); font-size: 20px;
    transition: border-color .15s, color .15s;
  }
  .ig-add:hover { border-color: var(--accent); color: var(--accent) }
  .ig-add-hint { font-size: 9px; font-weight: 600 }

  .ig-hint { font-size: 10px; color: var(--muted); margin-top: 2px }

  .ig-viewer {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,.85);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .ig-viewer-inner {
    position: relative; max-width: 90vw; max-height: 90vh;
  }
  .ig-viewer-inner img {
    max-width: 100%; max-height: 90vh;
    border-radius: 8px; display: block;
  }
  .ig-viewer-close {
    position: absolute; top: -12px; right: -12px;
    background: rgba(0,0,0,.7); color: #fff;
    border: none; border-radius: 50%;
    width: 28px; height: 28px; font-size: 14px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
</style>
