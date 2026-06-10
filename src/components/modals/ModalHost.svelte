<script lang="ts">
  import { appStore } from '../../lib/stores/appStore.svelte'
  import ConfirmModal from './ConfirmModal.svelte'
  import PromptModal from './PromptModal.svelte'
  import SearchModal from './SearchModal.svelte'
  import SyncModal from './SyncModal.svelte'
</script>

{#if appStore.activeModal === 'confirm'}
  <ConfirmModal />
{:else if appStore.activeModal === 'prompt'}
  <PromptModal />
{:else if appStore.activeModal === 'search'}
  <SearchModal />
{:else if appStore.activeModal === 'sync'}
  <SyncModal />
{/if}
