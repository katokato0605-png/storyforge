<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import Modal from './Modal.svelte'

  interface Props {
    title?: string
    placeholder?: string
    defaultValue?: string
    confirmLabel?: string
    onConfirm: (value: string) => void
  }

  const props = appStore.modalProps as Props

  let value = $state(props.defaultValue ?? '')

  function confirm() {
    if (!value.trim()) return
    appStore.closeModal()
    props.onConfirm(value.trim())
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); confirm() }
  }
</script>

<Modal>
  <h2 class="modal-title">{props.title ?? '入力'}</h2>
  <div class="fg">
    <!-- svelte-ignore a11y_autofocus -->
    <input
      class="fi"
      value={value}
      oninput={(e) => value = (e.target as HTMLInputElement).value}
      onkeydown={handleKeydown}
      placeholder={props.placeholder ?? ''}
      autofocus
    />
  </div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick={() => appStore.closeModal()}>キャンセル</button>
    <button class="btn btn-primary" onclick={confirm} disabled={!value.trim()}>
      {props.confirmLabel ?? 'OK'}
    </button>
  </div>
</Modal>

<style>
  .modal-title  { font-size: 16px; font-weight: 700; margin-bottom: 14px }
  .modal-actions{ display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px }
</style>
