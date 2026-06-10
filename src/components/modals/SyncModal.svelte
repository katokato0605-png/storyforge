<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { chapterStore } from '../../lib/stores/chapterStore.svelte'
  import { noteStore } from '../../lib/stores/noteStore.svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'
  import Modal from './Modal.svelte'
  import { isConfigured, generateCode, pushSync, pullSync } from '../../lib/utils/sync'

  const STORAGE_KEY = 'sf_sync_code'
  // Matches generateCode() charset — excludes I, O, 1, 0 to avoid visual ambiguity
  const VALID_CHARS = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g

  function getStoredCode(): string {
    try { return localStorage.getItem(STORAGE_KEY) ?? '' } catch { return '' }
  }

  let code = $state(getStoredCode())
  let status = $state<'idle' | 'pushing' | 'pulling' | 'ok' | 'error'>('idle')
  let message = $state('')
  let confirmingPull = $state(false)
  let isComposing = false
  let inputEl = $state<HTMLInputElement | undefined>(undefined)

  function applyFilter(raw: string): string {
    return raw.toUpperCase().replace(VALID_CHARS, '').slice(0, 6)
  }

  function handleInput(e: Event) {
    if (isComposing) return
    const el = e.target as HTMLInputElement
    const filtered = applyFilter(el.value)
    // Set DOM value directly to avoid Svelte reactive reset confusing mobile IME
    el.value = filtered
    code = filtered
    try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
  }

  function handleCompositionEnd(e: CompositionEvent) {
    isComposing = false
    const el = e.target as HTMLInputElement
    const filtered = applyFilter(el.value)
    el.value = filtered
    code = filtered
    try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
  }

  function handleGenerate() {
    const newCode = generateCode()
    code = newCode
    if (inputEl) inputEl.value = newCode
    try { localStorage.setItem(STORAGE_KEY, newCode) } catch { /* ignore */ }
  }

  async function handlePush() {
    if (!code || code.length !== 6) { message = '6文字のコードを入力してください'; status = 'error'; return }
    status = 'pushing'
    message = ''
    try {
      await pushSync(code)
      status = 'ok'
      message = 'アップロード完了！他の端末で同じコードを入力してダウンロードしてください'
    } catch (e) {
      status = 'error'
      message = (e as Error).message
    }
  }

  function handlePull() {
    if (!code || code.length !== 6) { message = '6文字のコードを入力してください'; status = 'error'; return }
    confirmingPull = true
  }

  async function executePull() {
    confirmingPull = false
    status = 'pulling'
    message = ''
    try {
      const { projects, chapters } = await pullSync(code)
      await projectStore.load()
      const pid = projectStore.currentProjectId
      if (pid) {
        await chapterStore.load(pid)
        noteStore.invalidate()
        await noteStore.load(pid)
      }
      await ideaStore.reload()
      status = 'ok'
      message = `ダウンロード完了！${projects}作品・${chapters}章を取得しました`
    } catch (e) {
      status = 'error'
      message = (e as Error).message
    }
  }
</script>

<Modal>
  <h2 class="modal-title">🔄 デバイス間同期</h2>

  {#if !isConfigured()}
    <div class="warn-box">
      <p>Supabaseの設定が必要です。</p>
      <p><code>.env</code> に <code>VITE_SUPABASE_URL</code> と <code>VITE_SUPABASE_ANON_KEY</code> を設定してビルドしてください。</p>
    </div>
  {:else}
    <p class="desc">同じコードを全端末で入力することでデータを同期できます。</p>

    <div class="code-row">
      <input
        bind:this={inputEl}
        class="fi code-input"
        oninput={handleInput}
        oncompositionstart={() => isComposing = true}
        oncompositionend={handleCompositionEnd}
        placeholder="例：ABC123"
        maxlength="6"
        inputmode="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="characters"
        spellcheck={false}
        aria-label="同期コード"
      />
      <button class="btn btn-ghost btn-sm" onclick={handleGenerate}>生成</button>
    </div>

    {#if confirmingPull}
      <div class="confirm-box">
        <p class="confirm-msg">現在のデータが上書きされます。この操作は取り消せません。</p>
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
          disabled={status === 'pushing' || status === 'pulling' || code.length !== 6}
        >📤 アップロード</button>
      </div>
      <div class="action-card">
        <div class="action-label">他のデバイスからデータを受け取る</div>
        <button
          class="btn btn-primary"
          onclick={handlePull}
          disabled={status === 'pushing' || status === 'pulling' || code.length !== 6 || confirmingPull}
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
  .code-row     { display: flex; gap: 8px; margin-bottom: 14px }
  .code-input   { font-size: 20px; font-family: monospace; letter-spacing: 4px; text-transform: uppercase; text-align: center; flex: 1 }
  .actions      { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px }
  .action-card  { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; align-items: center; text-align: center }
  .action-label { font-size: 12px; color: var(--muted); line-height: 1.5 }
  .msg          { font-size: 13px; padding: 8px 12px; border-radius: 7px; margin-bottom: 12px; line-height: 1.5 }
  .msg.ok       { background: #1a3a2a; color: #4caf50; border: 1px solid #2d5a3d }
  .msg.err      { background: #3a1a1a; color: #f44336; border: 1px solid #5a2d2d }
  .msg.loading  { background: var(--surface2); color: var(--muted); border: 1px solid var(--border) }
  .warn-box     { background: #3a2a0a; border: 1px solid #5a4a1a; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.8; margin-bottom: 14px }
  .warn-box code{ background: var(--surface2); padding: 2px 5px; border-radius: 3px; font-size: 12px }
  .confirm-box  { background: var(--surface2); border: 1px solid var(--danger); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px }
  .confirm-msg  { font-size: 13px; color: var(--text); margin-bottom: 10px; line-height: 1.5 }
  .confirm-acts { display: flex; justify-content: flex-end; gap: 8px }
  .modal-footer { display: flex; justify-content: flex-end }
</style>
