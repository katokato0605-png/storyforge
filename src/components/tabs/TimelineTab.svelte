<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import Timeline from '../writing/Timeline.svelte'
  import ImageGallery from '../ui/ImageGallery.svelte'
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <div class="tab-header">
      <h2 class="tab-title">🕐 タイムライン</h2>
    </div>
    <div class="tab-body">
      <Timeline projectId={projectStore.currentProjectId} />
    </div>
    <ImageGallery projectId={projectStore.currentProjectId} tabId="timeline" />
  </div>
{/if}

<style>
  .tab-wrap  { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header{ padding: 16px 28px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .tab-title { font-size: 16px; font-weight: 700 }
  .tab-body  { flex: 1; overflow-y: auto; min-height: 0 }
</style>
