<script lang="ts">
  import { loreStore } from '../../lib/stores/loreStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { characterCategories } from '../../lib/characterTemplates'

  type Category = { key: 'backbone' | 'looks' | 'personality'; label: string; icon: string; items: string[] }

  const categories: Category[] = characterCategories

  let customItems = $state<Record<string, string[]>>({
    backbone: [...categories[0].items],
    looks: [...categories[1].items],
    personality: [...categories[2].items],
  })

  const initResult = {
    backbone: categories[0].items[Math.floor(Math.random() * categories[0].items.length)],
    looks:    categories[1].items[Math.floor(Math.random() * categories[1].items.length)],
    personality: categories[2].items[Math.floor(Math.random() * categories[2].items.length)],
  }
  let history = $state<Record<string, string>[]>([initResult])
  let historyIdx = $state(0)
  let result = $derived(history[historyIdx])
  let saveSuccess = $state(false)
  let editingCategory = $state<string | null>(null)
  let newItemText = $state('')
  let pinned = $state<Record<string, boolean>>({ backbone: false, looks: false, personality: false })
  let searchingCard = $state<string | null>(null)
  let cardSearch = $state<Record<string, string>>({ backbone: '', looks: '', personality: '' })
  let overlayCategory = $state<string | null>(null)
  let overlaySearch = $state('')

  function pickRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function generate() {
    const next: Record<string, string> = {}
    for (const cat of categories) {
      if (pinned[cat.key] && result[cat.key]) {
        next[cat.key] = result[cat.key]
      } else {
        next[cat.key] = pickRandom(customItems[cat.key])
      }
    }
    history = [...history.slice(0, historyIdx + 1), next]
    historyIdx = history.length - 1
    saveSuccess = false
  }

  function overlayFiltered(key: string) {
    const q = overlaySearch.trim().toLowerCase()
    if (!q) return customItems[key]
    return customItems[key].filter(item => item.toLowerCase().includes(q))
  }

  function addItem(key: string) {
    const text = newItemText.trim()
    if (!text) return
    customItems[key] = [...customItems[key], text]
    newItemText = ''
  }

  function removeItem(key: string, idx: number) {
    const filtered = customItems[key].filter((_, i) => i !== idx)
    customItems[key] = filtered
  }

  function resetCategory(key: string) {
    const cat = categories.find(c => c.key === key)
    if (cat) customItems[key] = [...cat.items]
  }

  function filteredCardItems(key: string) {
    const q = cardSearch[key].trim().toLowerCase()
    if (!q) return customItems[key]
    return customItems[key].filter(item => item.toLowerCase().includes(q))
  }

  function selectCardItem(key: string, item: string) {
    const next = { ...result, [key]: item }
    history = [...history.slice(0, historyIdx + 1), next]
    historyIdx = history.length - 1
    searchingCard = null
    cardSearch[key] = ''
    saveSuccess = false
  }

  async function saveToLore() {
    if (!result || !projectStore.currentProjectId) return
    const title = `${result.backbone}・${result.looks}・${result.personality}`
    const content = `バックボーン: ${result.backbone}\n見た目: ${result.looks}\n性格: ${result.personality}`
    await loreStore.create(projectStore.currentProjectId, 'character', title, content, ['キャラクターメーカー'])
    saveSuccess = true
  }
</script>

<div class="cm-wrap">
  <div class="cm-header">
    <h2 class="cm-title">🎲 キャラクターメーカー</h2>
    <p class="cm-sub">各カテゴリからランダムに組み合わせてキャラクターを生成します</p>
  </div>

  <div class="cm-body">
    <!-- Categories (compact) -->
    <div class="cm-cats">
      {#each categories as cat}
        <div class="cm-cat">
          <div class="cm-cat-header">
            <span class="cm-cat-icon">{cat.icon}</span>
            <span class="cm-cat-label">{cat.label}</span>
            <span class="cm-cat-count">{customItems[cat.key].length}種類</span>
            <button class="cm-list-btn" onclick={() => { overlayCategory = cat.key; overlaySearch = '' }}>一覧 ›</button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Generate button -->
    <div class="cm-gen-area">
      <button class="btn-generate" onclick={generate}>
        <span class="gen-dice">🎲</span> ランダム生成
      </button>
    </div>

    <!-- Result (always visible) -->
    <div class="cm-result">
        <div class="cm-result-title">生成されたキャラクター</div>
        <div class="cm-result-cards">
          {#each categories as cat}
            {@const isSearching = searchingCard === cat.key}
            {@const hits = filteredCardItems(cat.key)}
            <div class="cm-result-card" class:pinned={pinned[cat.key]}>
              <div class="cm-result-cat-row">
                <span class="cm-result-cat">{cat.icon} {cat.label}</span>
                <div class="cm-card-actions">
                  <button
                    class="cm-search-toggle"
                    class:active={isSearching}
                    onclick={() => { searchingCard = isSearching ? null : cat.key; cardSearch[cat.key] = '' }}
                    title="手動で選択"
                    aria-label="検索して選択"
                  >🔍</button>
                  <button
                    class="cm-pin-btn"
                    class:active={pinned[cat.key]}
                    onclick={() => pinned[cat.key] = !pinned[cat.key]}
                    title={pinned[cat.key] ? '固定解除' : '固定（再生成でも変わらない）'}
                    aria-label={pinned[cat.key] ? '固定解除' : '固定'}
                  >{pinned[cat.key] ? '📌' : '📍'}</button>
                </div>
              </div>
              <div class="cm-result-val">{result[cat.key]}</div>
              {#if pinned[cat.key]}
                <div class="cm-pin-label">固定中</div>
              {/if}
              {#if isSearching}
                <div class="cm-card-search">
                  <input
                    class="fi cm-card-search-input"
                    placeholder="絞り込み…"
                    value={cardSearch[cat.key]}
                    oninput={e => cardSearch[cat.key] = (e.target as HTMLInputElement).value}
                    autofocus
                  />
                  <div class="cm-card-search-list">
                    {#each hits as item}
                      <button
                        class="cm-card-search-item"
                        class:current={item === result[cat.key]}
                        onclick={() => selectCardItem(cat.key, item)}
                      >{item}</button>
                    {/each}
                    {#if hits.length === 0}
                      <span class="cm-no-match">一致なし</span>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="cm-result-summary">
          「<strong>{result.backbone}</strong>」で「<strong>{result.looks}</strong>」な見た目の「<strong>{result.personality}</strong>」な人物
        </div>
        <div class="cm-result-actions">
          <button class="cm-hist-btn" onclick={() => { historyIdx--; saveSuccess = false }} disabled={historyIdx === 0} title="前の結果">‹ 前</button>
          <button class="cm-hist-btn" onclick={() => { historyIdx++; saveSuccess = false }} disabled={historyIdx === history.length - 1} title="次の結果">次 ›</button>
          <span class="cm-hist-pos">{historyIdx + 1} / {history.length}</span>
          <button class="btn btn-primary btn-sm" onclick={generate}>🎲 再生成</button>
          {#if projectStore.currentProjectId}
            <button class="btn btn-ghost btn-sm" onclick={saveToLore} disabled={saveSuccess}>
              {saveSuccess ? '✓ 保存済み' : '設定資料に保存'}
            </button>
          {/if}
        </div>
      </div>
  </div>
</div>

<!-- Category overlay -->
{#if overlayCategory}
  {@const ocat = categories.find(c => c.key === overlayCategory)!}
  {@const isEditing = editingCategory === overlayCategory}
  {@const hits = overlayFiltered(overlayCategory)}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="cm-overlay-bg" onclick={e => { if (e.target === e.currentTarget) { overlayCategory = null; editingCategory = null } }}></div>
  <div class="cm-overlay" role="dialog" aria-modal="true">
    <div class="cm-overlay-head">
      <span class="cm-overlay-icon">{ocat.icon}</span>
      <span class="cm-overlay-title">{ocat.label}</span>
      <span class="cm-cat-count">{customItems[overlayCategory].length}種類</span>
      <button
        class="cm-edit-btn"
        class:active={isEditing}
        onclick={() => { editingCategory = isEditing ? null : overlayCategory; newItemText = '' }}
      >{isEditing ? '完了' : '＋ 編集'}</button>
      <button class="cm-overlay-close" onclick={() => { overlayCategory = null; editingCategory = null }}>✕</button>
    </div>
    <div class="cm-overlay-search">
      <input
        class="fi"
        placeholder="🔍 絞り込み…"
        value={overlaySearch}
        oninput={e => overlaySearch = (e.target as HTMLInputElement).value}
      />
      {#if overlaySearch}<button class="cm-search-clear" onclick={() => overlaySearch = ''}>✕</button>{/if}
    </div>
    <div class="cm-overlay-tags">
      {#each hits as item, i}
        {@const realIdx = customItems[overlayCategory].indexOf(item)}
        <span class="cm-tag" class:editing={isEditing}>
          {item}
          {#if isEditing}
            <button class="cm-tag-del" onclick={() => removeItem(overlayCategory, realIdx)} aria-label="削除">×</button>
          {/if}
        </span>
      {/each}
      {#if hits.length === 0}<span class="cm-no-match">一致する項目がありません</span>{/if}
    </div>
    {#if isEditing}
      <div class="cm-add-row">
        <input
          class="fi cm-add-input"
          placeholder="新しい項目を追加…"
          value={newItemText}
          oninput={e => newItemText = (e.target as HTMLInputElement).value}
          onkeydown={e => { if (e.key === 'Enter') addItem(overlayCategory) }}
        />
        <button class="btn btn-primary btn-sm" onclick={() => addItem(overlayCategory)} disabled={!newItemText.trim()}>追加</button>
        <button class="btn btn-ghost btn-sm" onclick={() => resetCategory(overlayCategory)}>リセット</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .cm-wrap   { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .cm-header { padding: 16px 24px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .cm-title  { font-size: 16px; font-weight: 700; margin-bottom: 4px }
  .cm-sub    { font-size: 12px; color: var(--muted) }

  .cm-body   { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px }

  .cm-cats   { display: flex; flex-direction: column; gap: 8px }
  .cm-cat    { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px }

  .cm-cat-header { display: flex; align-items: center; gap: 8px }
  .cm-cat-icon   { font-size: 15px }
  .cm-cat-label  { font-size: 13px; font-weight: 700; flex: 1 }
  .cm-cat-count  { font-size: 11px; color: var(--muted) }
  .cm-list-btn   { background: var(--surface2); border: 1px solid var(--border); cursor: pointer; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; color: var(--muted); transition: .15s; font-family: inherit }
  .cm-list-btn:hover { color: var(--text); border-color: var(--accent) }
  .cm-edit-btn   { background: var(--surface2); border: 1px solid var(--border); cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; color: var(--muted); transition: .15s; font-family: inherit }
  .cm-edit-btn:hover { color: var(--text); border-color: var(--accent) }
  .cm-edit-btn.active { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent) }

  .cm-overlay-bg { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100 }
  .cm-overlay {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 101; width: min(560px, 92vw); max-height: 80vh;
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    display: flex; flex-direction: column; gap: 12px; padding: 18px 20px; overflow: hidden;
  }
  .cm-overlay-head { display: flex; align-items: center; gap: 8px }
  .cm-overlay-icon  { font-size: 16px }
  .cm-overlay-title { font-size: 15px; font-weight: 700; flex: 1 }
  .cm-overlay-close { background: none; border: none; cursor: pointer; font-size: 16px; color: var(--muted); padding: 0 4px; line-height: 1; transition: color .1s }
  .cm-overlay-close:hover { color: var(--text) }
  .cm-overlay-search { display: flex; align-items: center; gap: 6px }
  .cm-overlay-search .fi { flex: 1; font-size: 13px }
  .cm-search-clear { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 13px; padding: 2px 6px }
  .cm-search-clear:hover { color: var(--text) }
  .cm-overlay-tags { flex: 1; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 0 }

  .cm-tags   { display: flex; flex-wrap: wrap; gap: 6px }
  .cm-tag    { display: inline-flex; align-items: center; gap: 3px; padding: 4px 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; color: var(--text) }
  .cm-tag.editing { padding-right: 4px }
  .cm-tag-del { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 13px; line-height: 1; padding: 0 2px; transition: color .1s }
  .cm-tag-del:hover { color: var(--danger, #e05) }
  .cm-no-match { font-size: 12px; color: var(--muted); font-style: italic; padding: 4px 2px }

  .cm-add-row { display: flex; gap: 8px; align-items: center }
  .cm-add-input { flex: 1; font-size: 13px }

  .cm-gen-area { display: flex; justify-content: center }
  .btn-generate {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 36px; border-radius: 14px;
    background: var(--accent); color: #fff;
    font-size: 16px; font-weight: 700;
    border: none; cursor: pointer;
    transition: opacity .15s, transform .1s;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .btn-generate:hover  { opacity: .88 }
  .btn-generate:active { transform: scale(.97) }
  .gen-dice { font-size: 22px }

  .cm-result { background: var(--surface); border: 2px solid var(--accent); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px }
  .cm-result-title { font-size: 13px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: .5px }
  .cm-result-cards { display: flex; gap: 10px; flex-wrap: wrap }
  .cm-result-card { flex: 1; min-width: 120px; background: var(--surface2); border-radius: 10px; padding: 12px 14px; transition: border .15s; border: 2px solid transparent }
  .cm-result-card.pinned { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface2)) }
  .cm-result-cat-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px }
  .cm-result-cat  { font-size: 11px; color: var(--muted) }
  .cm-result-val  { font-size: 15px; font-weight: 700 }
  .cm-card-actions { display: flex; align-items: center; gap: 4px }
  .cm-search-toggle { background: none; border: none; cursor: pointer; font-size: 13px; padding: 0; opacity: .4; transition: opacity .15s }
  .cm-search-toggle:hover { opacity: 1 }
  .cm-search-toggle.active { opacity: 1 }
  .cm-pin-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 0; opacity: .5; transition: opacity .15s, transform .1s }
  .cm-pin-btn:hover { opacity: 1 }
  .cm-pin-btn.active { opacity: 1; transform: rotate(-15deg) }
  .cm-pin-label { font-size: 10px; font-weight: 700; color: var(--accent); letter-spacing: .5px; margin-top: 4px }
  .cm-card-search { margin-top: 8px; display: flex; flex-direction: column; gap: 6px }
  .cm-card-search-input { font-size: 12px; padding: 5px 10px; border-radius: 8px; width: 100%; box-sizing: border-box }
  .cm-card-search-list { max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface) }
  .cm-card-search-item { background: none; border: none; cursor: pointer; text-align: left; padding: 6px 10px; font-size: 12px; color: var(--text); font-family: inherit; transition: background .1s; border-radius: 6px }
  .cm-card-search-item:hover { background: var(--surface2) }
  .cm-card-search-item.current { color: var(--accent); font-weight: 700 }
  .cm-result-summary { font-size: 13px; color: var(--muted); line-height: 1.7; background: var(--surface2); border-radius: 8px; padding: 10px 14px }
  .cm-result-summary strong { color: var(--text) }
  .cm-result-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center }
  .cm-hist-btn { background: var(--surface2); border: 1px solid var(--border); cursor: pointer; font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px; color: var(--text); font-family: inherit; transition: .15s }
  .cm-hist-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent) }
  .cm-hist-btn:disabled { opacity: .3; cursor: default }
  .cm-hist-pos { font-size: 11px; color: var(--muted) }
</style>
