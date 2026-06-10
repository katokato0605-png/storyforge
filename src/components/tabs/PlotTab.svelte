<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import PlotBoard from '../writing/PlotBoard.svelte'
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <div class="tab-header">
      <h2 class="tab-title">📋 プロット</h2>
    </div>
    <div class="tab-body">
      <PlotBoard projectId={projectStore.currentProjectId} />
    </div>
  </div>
{/if}

<style>
  .tab-wrap  { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header{ padding: 16px 28px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .tab-title { font-size: 16px; font-weight: 700 }
  .tab-body  { flex: 1; overflow-y: auto; min-height: 0 }
</style>
