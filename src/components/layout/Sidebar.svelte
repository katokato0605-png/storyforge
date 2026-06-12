<script lang="ts">
  import { appStore, type TabId } from '../../lib/stores/appStore.svelte'

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'plot',     icon: '📋', label: 'プロット' },
    { id: 'timeline', icon: '🕐', label: 'タイムライン' },
    { id: 'lore',     icon: '📖', label: '設定' },
    { id: 'ideas',    icon: '💡', label: 'アイデア' },
    { id: 'charmaker', icon: '🎲', label: 'キャラメーカー' },
    { id: 'name',      icon: '📝', label: 'ネーム' },
  ]
</script>

<nav class="work-sb">
  <div class="sb-sec">メニュー</div>
  {#each tabs as tab}
    <button
      class="sb-item"
      class:active={appStore.activeTab === tab.id}
      onclick={() => appStore.setTab(tab.id)}
    >
      <span class="si">{tab.icon}</span>
      {tab.label}
    </button>
  {/each}
</nav>

<style>
  .work-sb{width:176px;min-width:176px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;padding:8px 0}
  .sb-sec{padding:18px 14px 5px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)}
  .sb-item{padding:9px 14px;cursor:pointer;color:var(--muted);font-size:13px;border-left:3px solid transparent;transition:.1s;display:flex;align-items:center;gap:7px;background:none;border-top:none;border-right:none;border-bottom:none;width:100%;text-align:left;font-family:inherit}
  .sb-item:hover{color:var(--text);background:var(--surface2)}
  .sb-item.active{color:var(--accent);border-left-color:var(--accent);background:var(--surface2)}
  .si{width:16px;text-align:center}
  @media(max-width:640px){.work-sb{display:none!important}}
  @media(max-width:900px){.work-sb{width:148px;min-width:148px}}
</style>
