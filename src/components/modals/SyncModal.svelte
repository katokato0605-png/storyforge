<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { authStore } from '../../lib/stores/authStore.svelte'
  import { isConfigured, pushSync, pullSync } from '../../lib/utils/sync'
  import Modal from './Modal.svelte'

  let status = $state<'idle' | 'pushing' | 'pulling' | 'ok' | 'error' | 'signing-in'>('idle')
  let message = $state('')
  let confirmingPull = $state(false)

  async function handleSignIn() {
    status = 'signing-in'
    message = ''
    try {
      await authStore.signIn()
      status = 'idle'
    } catch (e) {
      status = 'error'
      message = 'ログインに失敗しました: ' + (e as Error).message
    }
  }

  async function handleSignOut() {
    await authStore.signOut()
    status = 'idle'
    message = ''
    confirmingPull = false
  }

  async function handlePush() {
    const uid = authStore.user?.uid
    if (!uid) return
    status = 'pushing'
    message = ''
    try {
      await pushSync(uid)
      status = 'ok'
      message = 'アップロード完了！他の端末で同じアカウントでログインしてダウンロードしてください。'
    } catch (e) {
      status = 'error'
      message = (e as Error).message
    }
  }

  function handlePull() {
    confirmingPull = true
  }

  async function executePull() {
    const uid = authStore.user?.uid
    if (!uid) return
    confirmingPull = false
    status = 'pulling'
    message = ''
    try {
      const { projects, chapters, lore } = await pullSync(uid)
      status = 'ok'
      message = `ダウンロード完了！${projects}作品・${chapters}章・設定資料${lore}件を取得しました。`
    } catch (e) {
      status = 'error'
      message = (e as Error).message
    }
  }

  const busy = $derived(status === 'pushing' || status === 'pulling' || status === 'signing-in')
</script>

<Modal>
  <h2 class="modal-title">🔄 デバイス間同期</h2>

  {#if !isConfigured()}
    <div class="warn-box">
      <p>Firebaseの設定が必要です。</p>
      <p><code>.env</code> に <code>VITE_FIREBASE_*</code> の環境変数を設定してビルドしてください。</p>
    </div>
  {:else if authStore.loading}
    <div class="loading-state">読み込み中…</div>
  {:else if !authStore.user}
    <p class="desc">Googleアカウントでログインすると、全端末のデータを同期できます。</p>
    <div class="signin-area">
      <button class="btn-google" onclick={handleSignIn} disabled={busy}>
        <svg class="g-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Googleでログイン
      </button>
    </div>
    {#if status === 'error'}
      <div class="msg err">{message}</div>
    {/if}
  {:else}
    <div class="user-info">
      {#if authStore.user.photoURL}
        <img class="avatar" src={authStore.user.photoURL} alt="アバター" referrerpolicy="no-referrer" />
      {/if}
      <div class="user-detail">
        <div class="user-name">{authStore.user.displayName ?? 'ユーザー'}</div>
        <div class="user-email">{authStore.user.email}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick={handleSignOut} disabled={busy}>ログアウト</button>
    </div>

    <p class="desc">同じGoogleアカウントでログインしている端末間でデータを同期します。</p>

    {#if confirmingPull}
      <div class="confirm-box">
        <p class="confirm-msg">現在のデータにクラウドのデータが上書き追加されます。この操作は取り消せません。</p>
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
    {:else if busy}
      <div class="msg loading">{status === 'pushing' ? 'アップロード中…' : 'ダウンロード中…'}</div>
    {/if}

    <div class="actions">
      <div class="action-card">
        <div class="action-icon">📤</div>
        <div class="action-label">このデバイスのデータをクラウドへ送る</div>
        <button class="btn btn-primary" onclick={handlePush} disabled={busy}>アップロード</button>
      </div>
      <div class="action-card">
        <div class="action-icon">📥</div>
        <div class="action-label">クラウドのデータをこのデバイスへ受け取る</div>
        <button class="btn btn-primary" onclick={handlePull} disabled={busy || confirmingPull}>ダウンロード</button>
      </div>
    </div>
  {/if}

  <div class="modal-footer">
    <button class="btn btn-ghost" onclick={() => appStore.closeModal()}>閉じる</button>
  </div>
</Modal>

<style>
  .modal-title   { font-size: 16px; font-weight: 700; margin-bottom: 12px }
  .desc          { font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.6 }
  .loading-state { font-size: 13px; color: var(--muted); padding: 24px 0; text-align: center }

  .signin-area   { display: flex; justify-content: center; padding: 16px 0 }
  .btn-google    {
    display: flex; align-items: center; gap: 10px;
    background: #fff; color: #3c4043;
    border: 1px solid #dadce0; border-radius: 8px;
    padding: 10px 20px; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: box-shadow .15s;
  }
  .btn-google:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(0,0,0,.2) }
  .btn-google:disabled { opacity: .6; cursor: not-allowed }
  .g-icon        { width: 20px; height: 20px; flex-shrink: 0 }

  .user-info     { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 14px }
  .avatar        { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0 }
  .user-detail   { flex: 1; min-width: 0 }
  .user-name     { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  .user-email    { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

  .actions       { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px }
  .action-card   { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; align-items: center; text-align: center }
  .action-icon   { font-size: 24px }
  .action-label  { font-size: 12px; color: var(--muted); line-height: 1.5 }

  .msg           { font-size: 13px; padding: 8px 12px; border-radius: 7px; margin-bottom: 12px; line-height: 1.5 }
  .msg.ok        { background: #1a3a2a; color: #4caf50; border: 1px solid #2d5a3d }
  .msg.err       { background: #3a1a1a; color: #f44336; border: 1px solid #5a2d2d }
  .msg.loading   { background: var(--surface2); color: var(--muted); border: 1px solid var(--border) }

  .warn-box      { background: #3a2a0a; border: 1px solid #5a4a1a; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.8; margin-bottom: 14px }
  .warn-box code { background: var(--surface2); padding: 2px 5px; border-radius: 3px; font-size: 12px }

  .confirm-box   { background: var(--surface2); border: 1px solid var(--danger); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px }
  .confirm-msg   { font-size: 13px; color: var(--text); margin-bottom: 10px; line-height: 1.5 }
  .confirm-acts  { display: flex; justify-content: flex-end; gap: 8px }

  .modal-footer  { display: flex; justify-content: flex-end }
</style>
