<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import { noteStore } from '../../lib/stores/noteStore.svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'
  import { authStore } from '../../lib/stores/authStore.svelte'
  import Modal from './Modal.svelte'
  import { pushSync, pullSync } from '../../lib/utils/sync'
  import { FirebaseError } from 'firebase/app'

  function errorMessage(e: unknown): string {
    if (e instanceof FirebaseError) return `[${e.code}] ${e.message}`
    return String(e)
  }

  let status = $state<'idle' | 'pushing' | 'pulling' | 'ok' | 'error'>('idle')
  let message = $state('')
  let confirmingPull = $state(false)

  async function handlePush() {
    if (!authStore.user) return
    status = 'pushing'
    message = ''
    try {
      await pushSync(authStore.user.uid)
      status = 'ok'
      message = 'アップロード完了！他の端末で同じGoogleアカウントでログインしてダウンロードしてください'
    } catch (e) {
      status = 'error'
      message = errorMessage(e)
    }
  }

  function handlePull() {
    confirmingPull = true
  }

  async function executePull() {
    if (!authStore.user) return
    confirmingPull = false
    status = 'pulling'
    message = ''
    try {
      const { projects, chapters } = await pullSync(authStore.user.uid)
      await projectStore.load()
      const pid = projectStore.currentProjectId
      if (pid) {
        await chapterStore.load(pid)
        noteStore.invalidate()
        await noteStore.load(pid)
      }
      await ideaStore.reload()
      appStore.bumpSyncVersion()
      status = 'ok'
      message = `ダウンロード完了！${projects}作品・${chapters}章を取得しました`
    } catch (e) {
      status = 'error'
      message = errorMessage(e)
    }
  }
</script>

<Modal>
  <h2 class="modal-title">🔄 デバイス間同期</h2>

  {#if authStore.loading}
    <div class="msg loading">読み込み中…</div>
  {:else if !authStore.user}
    <p class="desc">Googleアカウントでログインするとデバイス間でデータを同期できます。</p>
    <button class="btn btn-primary google-btn" onclick={() => authStore.signIn()}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Googleでログイン
    </button>
  {:else}
    <div class="user-row">
      {#if authStore.user.photoURL}
        <img class="avatar" src={authStore.user.photoURL} alt="avatar" referrerpolicy="no-referrer" />
      {/if}
      <span class="user-name">{authStore.user.displayName ?? authStore.user.email}</span>
      <button class="btn btn-ghost btn-sm" onclick={() => authStore.signOut()}>ログアウト</button>
    </div>

    <p class="desc">同じGoogleアカウントでログインした端末間でデータを同期できます。</p>

    {#if confirmingPull}
      <div class="confirm-box">
        <p class="confirm-msg">クラウドのデータが現在のデータに追加・更新されます（削除したアイテムは復活することがあります）。この操作は取り消せません。</p>
        <div class="confirm-acts">
          <button class="btn btn-ghost btn-sm" onclick={() => confirmingPull = false}>キャンセル</button>
          <button class="btn btn-danger btn-sm" onclick={executePull}>上書きする</button>
        </div>
      </div>
    {/if}

    {#if status === 'ok'}
      <div class="msg ok">{message}</div>
    {:else if status === 'error'}
      <div class="msg err">{message}</div>
    {:else if status === 'pushing' || status === 'pulling'}
      <div class="msg loading">{status === 'pushing' ? 'アップロード中…' : 'ダウンロード中…'}</div>
    {/if}

    <div class="actions">
      <div class="action-card">
        <div class="action-label">このデバイスのデータを送る</div>
        <button
          class="btn btn-primary"
          onclick={handlePush}
          disabled={status === 'pushing' || status === 'pulling'}
        >📤 アップロード</button>
      </div>
      <div class="action-card">
        <div class="action-label">他のデバイスからデータを受け取る</div>
        <button
          class="btn btn-primary"
          onclick={handlePull}
          disabled={status === 'pushing' || status === 'pulling' || confirmingPull}
        >📥 ダウンロード</button>
      </div>
    </div>
  {/if}

  <div class="modal-footer">
    <button class="btn btn-ghost" onclick={() => appStore.closeModal()}>閉じる</button>
  </div>
</Modal>

<style>
  .modal-title  { font-size: 16px; font-weight: 700; margin-bottom: 10px }
  .desc         { font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.6 }
  .user-row     { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding: 10px 12px; background: var(--surface2); border-radius: 8px; border: 1px solid var(--border) }
  .avatar       { width: 28px; height: 28px; border-radius: 50% }
  .user-name    { font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  .google-btn   { display: flex; align-items: center; gap: 8px; margin-bottom: 14px }
  .actions      { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px }
  .action-card  { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; align-items: center; text-align: center }
  .action-label { font-size: 12px; color: var(--muted); line-height: 1.5 }
  .msg          { font-size: 13px; padding: 8px 12px; border-radius: 7px; margin-bottom: 12px; line-height: 1.5 }
  .msg.ok       { background: #1a3a2a; color: #4caf50; border: 1px solid #2d5a3d }
  .msg.err      { background: #3a1a1a; color: #f44336; border: 1px solid #5a2d2d }
  .msg.loading  { background: var(--surface2); color: var(--muted); border: 1px solid var(--border) }
  .confirm-box  { background: var(--surface2); border: 1px solid var(--danger); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px }
  .confirm-msg  { font-size: 13px; color: var(--text); margin-bottom: 10px; line-height: 1.5 }
  .confirm-acts { display: flex; justify-content: flex-end; gap: 8px }
  .modal-footer { display: flex; justify-content: flex-end }
</style>
