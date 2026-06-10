<script lang="ts">
  import TopBar from './TopBar.svelte'
  import Sidebar from './Sidebar.svelte'
  import BottomNav from './BottomNav.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'

  let {
    children,
    home,
  }: {
    children?: import('svelte').Snippet
    home?: import('svelte').Snippet
  } = $props()
</script>

<TopBar />
<BottomNav />

<div id="main">
  {#if projectStore.currentProject}
    <div class="work-layout">
      <Sidebar />
      <main class="work-main">
        {#if children}
          {@render children()}
        {:else}
          <div class="empty">
            <div class="empty-icon">🚧</div>
            <div class="empty-msg">このタブは実装中です</div>
            <div class="empty-sub">({appStore.activeTab})</div>
          </div>
        {/if}
      </main>
    </div>
  {:else}
    <div class="home-wrap">
      {#if home}
        {@render home()}
      {:else}
        <div class="empty">
          <div class="empty-icon">📚</div>
          <div class="empty-msg">作品を選択してください</div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  #main{height:calc(100vh - 50px);overflow:hidden;display:flex;flex-direction:column}
  @media(max-width:640px){#main{height:calc(100vh - 50px - 56px)}}
  .work-layout{display:flex;height:100%;overflow:hidden}
  .work-main{flex:1;overflow:hidden;display:flex;flex-direction:column}
  .home-wrap{max-width:1080px;margin:0 auto;padding:32px 24px 32px;overflow:hidden;height:100%;display:flex;flex-direction:column}
</style>
