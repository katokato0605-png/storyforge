<script lang="ts">
  import { insertRuby, insertBouten, insertDash } from '../../lib/utils/textHelpers'
  import { appStore } from '../../lib/stores/appStore.svelte'

  let { oninsert }: {
    oninsert: (result: { value: string; selectionStart: number; selectionEnd: number }) => void
  } = $props()

  let textareaRef: HTMLTextAreaElement | null = null

  export function setRef(el: HTMLTextAreaElement) { textareaRef = el }

  function handleRuby() {
    if (!textareaRef) return
    const ta = textareaRef
    appStore.openModal('prompt', {
      title: '読み仮名',
      placeholder: 'よみがな',
      onConfirm: (reading: string) => oninsert(insertRuby(ta, reading)),
    })
  }
  function handleBouten() {
    if (!textareaRef) return
    oninsert(insertBouten(textareaRef))
  }
  function handleDash() {
    if (!textareaRef) return
    oninsert(insertDash(textareaRef))
  }
</script>

<div class="ruby-bar">
  <span class="ruby-bar-label">挿入：</span>
  <button class="ruby-btn" onclick={handleRuby} type="button">｜《ルビ》</button>
  <button class="ruby-btn" onclick={handleBouten} type="button">《《傍点》》</button>
  <button class="ruby-btn" onclick={handleDash} type="button">──ダッシュ</button>
</div>

<style>
  .ruby-bar{padding:4px 28px;display:flex;gap:6px;align-items:center;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--surface)}
  .ruby-btn{background:var(--surface2);border:1px solid var(--border);color:var(--muted);padding:3px 9px;border-radius:5px;cursor:pointer;font-size:12px;transition:.1s;white-space:nowrap;font-family:inherit}
  .ruby-btn:hover{color:var(--text);border-color:var(--muted)}
  .ruby-bar-label{font-size:10px;color:var(--muted);margin-right:2px}
  @media(max-width:640px){.ruby-bar{padding:4px 14px}}
</style>
