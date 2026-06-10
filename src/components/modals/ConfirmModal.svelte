<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import Modal from './Modal.svelte'

  interface Props {
    title?: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm: () => void
  }

  const props = appStore.modalProps as Props

  function confirm() {
    appStore.closeModal()
    props.onConfirm()
  }
</script>

<Modal>
  <h2 class="modal-title">{props.title ?? '確認'}</h2>
  <p class="modal-msg">{props.message}</p>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick={() => appStore.closeModal()}>キャンセル</button>
    <button
      class="btn"
      class:btn-danger={props.danger}
      class:btn-primary={!props.danger}
      onclick={confirm}
    >{props.confirmLabel ?? 'OK'}</button>
  </div>
</Modal>

<style>
  .modal-title { font-size: 16px; font-weight: 700; margin-bottom: 10px }
  .modal-msg   { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 20px }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px }
</style>
