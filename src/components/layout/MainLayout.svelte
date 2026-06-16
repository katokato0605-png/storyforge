<script lang="ts">
  import TopBar from './TopBar.svelte'
  import Sidebar from './Sidebar.svelte'
  import BottomNav from './BottomNav.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'

  let {
    children,
    home,
  }: {
    children?: import('svelte').Snippet
    home?: import('svelte').Snippet
  } = $props()

  let sceneOpen = $state(false)
  let sceneTitle = $state('')
  let sceneContent = $state('')

  // ─── Swipe navigation ────────────────────────────────────────────────────────
  let swipeStartX = 0
  let swipeStartY = 0

  function onTouchStart(e: TouchEvent) {
    swipeStartX = e.touches[0].clientX
    swipeStartY = e.touches[0].clientY
  }

  function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - swipeStartX
    const dy = e.changedTouches[0].clientY - swipeStartY
    // 水平方向に 60px 以上、かつ垂直より横方向が大きい場合のみ
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return
    const tabs = appStore.tabs
    const cur = tabs.findIndex(t => t.id === appStore.activeTab)
    if (dx < 0 && cur < tabs.length - 1) appStore.setTab(tabs[cur + 1].id)  // 左スワイプ → 次タブ
    if (dx > 0 && cur > 0)               appStore.setTab(tabs[cur - 1].id)  // 右スワイプ → 前タブ
  }

  function openScene() { sceneOpen = true }
  function closeScene() { sceneOpen = false; sceneTitle = ''; sceneContent = '' }

  async function saveScene() {
    const pid = projectStore.currentProjectId
    if (!pid || (!sceneTitle.trim() && !sceneContent.trim())) return
    await ideaStore.create(sceneTitle.trim(), sceneContent.trim(), ['書きたいシーン'], pid)
    closeScene()
  }

  function handleSceneKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveScene()
    if (e.key === 'Escape') closeScene()
  }
</script>

<TopBar />
<BottomNav />

<div id="main">
  {#if projectStore.currentProject}
    <div class="work-layout">
      <Sidebar />
      <main class="work-main" ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
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

    <!-- 書きたいシーン フローティングボタン -->
    <button class="scene-fab" onclick={openScene} title="書きたいシーンを追加">📝</button>

    {#if sceneOpen}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div class="scene-ov" onclick={(e) => { if (e.target === e.currentTarget) closeScene() }} onkeydown={(e) => e.key === 'Escape' && closeScene()} role="dialog" aria-modal="true" aria-label="書きたいシーン追加" tabindex="-1">
        <div class="scene-panel">
          <div class="scene-head">
            <span class="scene-head-title">📝 書きたいシーン</span>
            <span class="scene-project-name">{projectStore.currentProject?.title}</span>
            <button class="iBtn" onclick={closeScene} aria-label="閉じる">✕</button>
          </div>
          <input
            class="fi scene-title-fi"
            placeholder="タイトル（任意）"
            value={sceneTitle}
            oninput={(e) => sceneTitle = (e.target as HTMLInputElement).value}
            onkeydown={handleSceneKey}
            aria-label="タイトル"
          />
          <textarea
            class="fta scene-fta"
            placeholder="書きたいシーンのメモ… (Ctrl+Enter で保存)"
            value={sceneContent}
            oninput={(e) => sceneContent = (e.target as HTMLTextAreaElement).value}
            onkeydown={handleSceneKey}
            rows="5"
            aria-label="内容"
          ></textarea>
          <div class="scene-foot">
            <button class="btn btn-ghost btn-sm" onclick={closeScene}>キャンセル</button>
            <button class="btn btn-primary btn-sm" onclick={saveScene} disabled={!sceneTitle.trim() && !sceneContent.trim()}>保存</button>
          </div>
        </div>
      </div>
    {/if}
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

  .scene-fab{position:fixed;bottom:72px;right:18px;width:48px;height:48px;border-radius:50%;background:var(--accent);color:#fff;border:none;font-size:20px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:100;display:flex;align-items:center;justify-content:center;transition:transform .15s,box-shadow .15s}
  .scene-fab:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,.4)}
  @media(max-width:640px){.scene-fab{bottom:70px}}

  .scene-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
  .scene-panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;width:100%;max-width:520px;display:flex;flex-direction:column;gap:10px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,.3)}
  .scene-head{display:flex;align-items:center;gap:8px;margin-bottom:2px}
  .scene-head-title{font-size:15px;font-weight:700;flex:1}
  .scene-project-name{font-size:12px;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);border-radius:6px;padding:2px 8px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .scene-title-fi{width:100%;font-size:14px}
  .scene-fta{width:100%;font-size:13px;resize:none}
  .scene-foot{display:flex;gap:8px;justify-content:flex-end}
</style>
