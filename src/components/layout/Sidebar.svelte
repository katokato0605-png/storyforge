<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { createDragSort } from '../../lib/utils/dragSort.svelte'

  const ds = createDragSort()

  function onDrop(toIdx: number) {
    const next = ds.drop([...appStore.tabs], toIdx)
    if (next) appStore.reorderTabs(next)
  }
</script>

<nav class="work-sb">
  <div class="sb-sec">メニュー</div>
  {#each appStore.tabs as tab, idx (tab.id)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="sb-drag-row"
      class:dragging={ds.dragIdx === idx}
      class:drag-over={ds.dragOverIdx === idx}
      draggable="true"
      data-drag-idx={idx}
      ondragstart={() => ds.start(idx)}
      ondragover={(e) => ds.over(e, idx)}
      ondrop={() => onDrop(idx)}
      ondragend={() => ds.end()}
      ontouchstart={() => ds.touchstart(idx)}
      ontouchmove={(e) => ds.touchmove(e)}
      ontouchend={() => { const to = ds.dragOverIdx; if (to !== null) onDrop(to); else ds.end() }}
    >
      <span class="drag-handle">⠿</span>
      <button
        class="sb-item"
        class:active={appStore.activeTab === tab.id}
        onclick={() => appStore.setTab(tab.id)}
      >
        <span class="si">{tab.icon}</span>
        {tab.label}
      </button>
    </div>
  {/each}
</nav>

<style>
  .work-sb { width: 176px; min-width: 176px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; padding: 8px 0 }
  .sb-sec  { padding: 18px 14px 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted) }

  .sb-drag-row {
    display: flex; align-items: stretch;
    transition: opacity .12s;
  }
  .sb-drag-row.dragging  { opacity: 0.35 }
  .sb-drag-row.drag-over { background: color-mix(in srgb, var(--accent) 10%, transparent); border-left: 2px solid var(--accent) }

  .drag-handle {
    display: flex; align-items: center;
    padding: 0 4px 0 8px;
    color: var(--muted); font-size: 13px;
    cursor: grab; user-select: none; flex-shrink: 0;
    opacity: 0; transition: opacity .15s;
  }
  .sb-drag-row:hover .drag-handle { opacity: 1 }

  .sb-item {
    flex: 1; padding: 9px 14px 9px 2px; cursor: pointer; color: var(--muted);
    font-size: 13px; border-left: 3px solid transparent; transition: .1s;
    display: flex; align-items: center; gap: 7px; background: none;
    border-top: none; border-right: none; border-bottom: none;
    width: 100%; text-align: left; font-family: inherit;
  }
  .sb-item:hover { color: var(--text); background: var(--surface2) }
  .sb-item.active { color: var(--accent); border-left-color: var(--accent); background: var(--surface2) }
  .si { width: 16px; text-align: center }

  @media (max-width: 640px) { .work-sb { display: none !important } }
  @media (max-width: 900px) { .work-sb { width: 148px; min-width: 148px } }
</style>
