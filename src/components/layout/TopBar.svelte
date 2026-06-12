<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { exportAll } from '../../lib/utils/exportImport'
  import { createBackup } from '../../lib/utils/backup'
  import { isFSASupported, fsaStore, enableFileMode, disableFileMode, tryRestoreHandle, writeAutoSave } from '../../lib/utils/fileSystemAccess.svelte'
  import { authStore } from '../../lib/stores/authStore.svelte'
  import { autoSyncStore } from '../../lib/stores/autoSyncStore.svelte'
  import { onMount } from 'svelte'

  const fsaSupported = isFSASupported()

  onMount(async () => {
    if (fsaSupported) await tryRestoreHandle()
    // auto-save to file on visibility change
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden && fsaStore.active) {
        const json = await exportAll()
        await writeAutoSave(json)
      }
    })
  })
  let toastMsg = $state('')
  let toastErr = $state(false)
  let toastTimer: ReturnType<typeof setTimeout>

  function toggleTheme() {
    const next = appStore.theme === 'dark' ? 'light' : 'dark'
    appStore.setTheme(next)
    localStorage.setItem('sf_theme', next)
  }

  function showToast(msg: string, err = false) {
    clearTimeout(toastTimer)
    toastMsg = msg
    toastErr = err
    toastTimer = setTimeout(() => toastMsg = '', 3000)
  }

  async function handleBackup() {
    try {
      await createBackup()
      showToast('バックアップを作成しました')
    } catch {
      showToast('バックアップに失敗しました', true)
    }
  }
</script>

<header id="hd">
  <span class="logo" onclick={() => projectStore.selectProject(null)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && projectStore.selectProject(null)}>
    StoryForge<span>β</span>
  </span>

  {#if projectStore.currentProject}
    <nav id="bc">
      <span class="bc-link" onclick={() => projectStore.selectProject(null)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && projectStore.selectProject(null)}>ホーム</span>
      <span class="bc-sep">›</span>
      <span class="bc-current">{projectStore.currentProject.title}</span>
    </nav>

    <button class="iBtn search-btn" onclick={() => appStore.openModal('search')} title="全文検索 (Ctrl+K)" aria-label="全文検索">
      🔍
    </button>
  {/if}

  <div id="hr">
    {#if fsaSupported}
      <button
        class="iBtn"
        class:fsa-active={fsaStore.active}
        onclick={async () => {
          if (fsaStore.active) {
            await disableFileMode()
            showToast('ファイル保存モードを無効にしました')
          } else {
            const ok = await enableFileMode()
            if (ok) showToast('ファイル保存モードを有効にしました')
          }
        }}
        title={fsaStore.active ? 'ファイル保存モード ON（クリックで無効化）' : 'ファイル保存モードを有効にする'}
        aria-label="ファイル保存モード"
      >{fsaStore.active ? '📂' : '📁'}</button>
    {/if}
    <button
      class="iBtn sync-btn"
      class:sync-ok={autoSyncStore.status === 'ok'}
      class:sync-err={autoSyncStore.status === 'error'}
      class:sync-ing={autoSyncStore.status === 'syncing'}
      onclick={() => appStore.openModal('sync')}
      title={authStore.user
        ? autoSyncStore.status === 'ok' ? `同期済み ${autoSyncStore.lastSyncedAt?.toLocaleTimeString('ja-JP', {hour:'2-digit',minute:'2-digit'}) ?? ''}`
        : autoSyncStore.status === 'error' ? `同期エラー: ${autoSyncStore.errorMessage}`
        : autoSyncStore.status === 'syncing' ? '同期中…'
        : 'デバイス間同期'
        : 'デバイス間同期'}
      aria-label="同期"
    >{autoSyncStore.status === 'ok' ? '✓' : autoSyncStore.status === 'syncing' ? '⟳' : autoSyncStore.status === 'error' ? '⚠' : '🔄'}</button>
    <button class="iBtn" onclick={handleBackup} title="バックアップ作成" aria-label="バックアップ">💾</button>
    <button class="iBtn" onclick={toggleTheme} title="テーマ切替" aria-label="テーマ切替">
      {appStore.theme === 'dark' ? '☀' : '🌙'}
    </button>
  </div>
</header>

{#if toastMsg}
  <div id="toast" class="show" class:err={toastErr}>{toastMsg}</div>
{/if}

<style>
  #hd{background:var(--surface);border-bottom:1px solid var(--border);padding:0 16px;height:50px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:100}
  .logo{font-size:16px;font-weight:800;color:var(--accent);cursor:pointer;user-select:none;white-space:nowrap}
  .logo span{color:var(--muted);font-weight:400}
  #bc{color:var(--muted);font-size:13px;display:flex;align-items:center;gap:6px;overflow:hidden;flex:1;min-width:0}
  .bc-link{cursor:pointer;white-space:nowrap;transition:color .1s;flex-shrink:0}
  .bc-link:hover{color:var(--text)}
  .bc-sep{opacity:.4;flex-shrink:0}
  .bc-current{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .search-btn{font-size:13px}
  #hr{margin-left:auto;display:flex;gap:5px;align-items:center;flex-shrink:0}
  .fsa-active{color:var(--accent)!important;border-color:var(--accent)!important}
  .sync-ok { color: #4caf50 !important }
  .sync-err { color: #f44336 !important }
  .sync-ing { animation: spin 1s linear infinite }
  @keyframes spin { to { transform: rotate(360deg) } }
</style>
