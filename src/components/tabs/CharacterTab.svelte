<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { noteStore } from '../../lib/stores/noteStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'

  const CHARACTER_SHEET_TEMPLATE = `━━━━━━━━━━━━━━━━━━━━
キャラクターシート
━━━━━━━━━━━━━━━━━━━━

【基本情報】
名前：未記入
年齢・性別：未記入
背景：未記入

【内面・心理】
日常的な欲求：未記入
表向きの欲求：未記入
本音の欲求：未記入
恐れていること：未記入
欠如・弱点：未記入

【能力・戦闘】
特異体質：未記入
説明：未記入
制約：未記入
━━━━━━━━━━━━━━━━━━━━`

  let content = $state('')
  let isComposing = $state(false)
  let saveTimer: ReturnType<typeof setTimeout>
  let textareaEl = $state<HTMLTextAreaElement | null>(null)
  let showTmplMenu = $state(false)

  $effect(() => {
    const pid = projectStore.currentProjectId
    if (!pid) return
    let cancelled = false
    noteStore.load(pid).then(() => {
      if (!cancelled) content = noteStore.getContent('character')
    })
    return () => { cancelled = true }
  })

  function scheduleSave() {
    const pid = projectStore.currentProjectId
    if (!pid) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => noteStore.save(pid, 'character', content), 800)
  }

  function handleCompositionStart() { isComposing = true }
  function handleCompositionEnd(e: CompositionEvent) {
    isComposing = false
    content = (e.target as HTMLTextAreaElement).value
    scheduleSave()
  }
  function handleInput(e: Event) {
    if (!isComposing) {
      content = (e.target as HTMLTextAreaElement).value
      scheduleSave()
    }
  }

  $effect(() => {
    const pid = projectStore.currentProjectId
    if (!pid) return
    const flush = () => { clearTimeout(saveTimer); noteStore.save(pid, 'character', content) }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('beforeunload', flush)
      clearTimeout(saveTimer)
    }
  })

  function insertTemplate() {
    showTmplMenu = false
    const doInsert = () => {
      const sep = content.trim() ? '\n\n' : ''
      content = content + sep + CHARACTER_SHEET_TEMPLATE
      scheduleSave()
      setTimeout(() => textareaEl?.focus(), 0)
    }
    if (content.trim()) {
      appStore.openModal('confirm', {
        title: 'テンプレートを追加',
        message: '現在の内容の末尾にキャラクターシートを追加しますか？',
        danger: false,
        onConfirm: doInsert,
      })
    } else {
      doInsert()
    }
  }
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <div class="tab-header">
      <h2 class="tab-title">👤 キャラクター</h2>
      <div class="tab-header-right">
        <div class="tmpl-wrap">
          <button class="btn btn-ghost btn-sm" onclick={() => showTmplMenu = !showTmplMenu}>テンプレート ▾</button>
          {#if showTmplMenu}
            <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
            <div class="tmpl-bg" onclick={() => showTmplMenu = false}></div>
            <div class="tmpl-menu">
              <button class="tmpl-item" onclick={insertTemplate}>キャラクターシート</button>
            </div>
          {/if}
        </div>
        <span class="tab-hint">自動保存されます</span>
      </div>
    </div>
    <div class="tab-body">
      <textarea
        class="ct-ta"
        bind:this={textareaEl}
        value={content}
        placeholder="登場人物のプロフィール、性格、人間関係、成長過程などを記録してください…"
        oncompositionstart={handleCompositionStart}
        oncompositionend={handleCompositionEnd}
        oninput={handleInput}
      ></textarea>
    </div>
  </div>
{/if}

<style>
  .tab-wrap  { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header{ padding: 16px 28px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between }
  .tab-title { font-size: 16px; font-weight: 700 }
  .tab-header-right { display: flex; align-items: center; gap: 12px }
  .tab-hint  { font-size: 11px; color: var(--muted) }
  .tab-body  { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-height: 0 }

  .ct-ta {
    flex: 1; width: 100%; height: 100%;
    background: transparent; border: none; outline: none; resize: none;
    color: var(--text); font-size: 14px; line-height: 1.9; font-family: inherit;
    padding: 12px 28px 80px;
  }
  .ct-ta::placeholder { color: var(--muted) }

  .tmpl-wrap { position: relative }
  .tmpl-bg { position: fixed; inset: 0; z-index: 10 }
  .tmpl-menu {
    position: absolute; top: calc(100% + 4px); right: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
    z-index: 20; min-width: 200px; overflow: hidden;
  }
  .tmpl-item {
    display: block; width: 100%; text-align: left; padding: 10px 14px;
    background: none; border: none; cursor: pointer;
    font-size: 13px; color: var(--text); font-family: inherit;
  }
  .tmpl-item:hover { background: var(--surface2) }
</style>
