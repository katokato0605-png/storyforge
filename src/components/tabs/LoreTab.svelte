<script lang="ts">
  import { onMount } from 'svelte'
  import { loreStore } from '../../lib/stores/loreStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { createDragSort } from '../../lib/utils/dragSort.svelte'
  import type { LoreType } from '../../lib/db/schema'
  import { characterCategories } from '../../lib/characterTemplates'

  const loreDs = createDragSort()
  let loreOrder = $state<string[]>([])

  $effect(() => {
    const pid = projectStore.currentProjectId
    if (!pid) { loreOrder = []; return }
    try {
      const raw = localStorage.getItem(`sf_lore_order_${pid}`)
      loreOrder = raw ? JSON.parse(raw) : []
    } catch { loreOrder = [] }
  })

  function saveLoreOrder(ordered: { id: string }[]) {
    const pid = projectStore.currentProjectId
    if (!pid) return
    const newIds = ordered.map(e => e.id)
    const others = loreOrder.filter(id => !newIds.includes(id))
    loreOrder = [...newIds, ...others]
    localStorage.setItem(`sf_lore_order_${pid}`, JSON.stringify(loreOrder))
  }

  type Tab = LoreType | 'world_lore'
  let activeTab = $state<Tab>('character')

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'character', icon: '👤', label: 'キャラクター' },
    { id: 'world_lore', icon: '🌍', label: '世界観・その他' },
  ]

  let adding = $state(false)
  let newTitle = $state('')
  let newContent = $state('')
  let newTags = $state('')

  let editId = $state<string | null>(null)
  let editTitle = $state('')
  let editContent = $state('')
  let editTags = $state('')

  let filterTag = $state('')

  // テンプレート選択（キャラクタータブ用）
  let tplOpen = $state(false)
  let tplSearch = $state<Record<string, string>>({ backbone: '', looks: '', personality: '' })
  let tplSelected = $state<Record<string, string>>({ backbone: '', looks: '', personality: '' })
  let tplPickerOpen = $state<string | null>(null)

  function tplFilteredItems(key: string) {
    const q = tplSearch[key].trim().toLowerCase()
    const cat = characterCategories.find(c => c.key === key)
    if (!cat) return []
    if (!q) return cat.items
    return cat.items.filter(item => item.toLowerCase().includes(q))
  }

  function tplGenerate() {
    const next: Record<string, string> = {}
    for (const cat of characterCategories) {
      next[cat.key] = cat.items[Math.floor(Math.random() * cat.items.length)]
    }
    tplSelected = next
    tplPickerOpen = null
  }

  function tplInsert(targetContent: string, setter: (v: string) => void) {
    const lines: string[] = []
    for (const cat of characterCategories) {
      if (tplSelected[cat.key]) lines.push(`${cat.label}: ${tplSelected[cat.key]}`)
    }
    if (lines.length === 0) return
    const append = lines.join('\n')
    setter(targetContent ? targetContent + '\n' + append : append)
    tplSelected = { backbone: '', looks: '', personality: '' }
    tplOpen = false
    tplPickerOpen = null
  }

  onMount(() => {
    const pid = projectStore.currentProjectId
    if (pid) loreStore.load(pid)
  })

  $effect(() => {
    // タブ切り替え時にフィルタリセット
    activeTab
    filterTag = ''
  })

  const activeTypes = $derived<LoreType[]>(
    activeTab === 'world_lore' ? ['world', 'lore'] : [activeTab as LoreType]
  )

  const currentEntries = $derived.by(() => {
    const base = loreStore.entries.filter(e => {
      if (e.projectId !== projectStore.currentProjectId) return false
      if (!activeTypes.includes(e.type)) return false
      if (filterTag && !e.tags.includes(filterTag)) return false
      return true
    })
    if (loreOrder.length === 0) return base
    return [...base].sort((a, b) => {
      const ai = loreOrder.indexOf(a.id)
      const bi = loreOrder.indexOf(b.id)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  })

  const allTags = $derived(
    [...new Set(
      loreStore.entries
        .filter(e => activeTypes.includes(e.type) && e.projectId === projectStore.currentProjectId)
        .flatMap(e => e.tags)
    )].sort()
  )

  function resetAddForm() {
    adding = false
    newTitle = ''
    newContent = ''
    newTags = ''
  }

  async function addEntry() {
    const pid = projectStore.currentProjectId
    if (!pid || !newTitle.trim()) return
    const tags = newTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    const type: LoreType = activeTab === 'world_lore' ? 'world' : (activeTab as LoreType)
    await loreStore.create(pid, type, newTitle.trim(), newContent.trim(), tags)
    resetAddForm()
  }

  function handleAddKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addEntry()
    if (e.key === 'Escape') resetAddForm()
  }

  function startEdit(entry: { id: string; title: string; content: string; tags: string[] }) {
    editId = entry.id
    editTitle = entry.title
    editContent = entry.content
    editTags = entry.tags.join(', ')
  }

  async function saveEdit() {
    if (!editId || !editTitle.trim()) return
    const tags = editTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    await loreStore.update(editId, { title: editTitle.trim(), content: editContent.trim(), tags })
    editId = null
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit()
    if (e.key === 'Escape') editId = null
  }

  function confirmDelete(id: string) {
    appStore.openModal('confirm', {
      title: '削除',
      message: 'この項目を削除します。',
      danger: true,
      onConfirm: () => loreStore.delete(id),
    })
  }
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <div class="tab-header">
      <h2 class="tab-title">📖 設定資料</h2>
      <div class="header-actions">
        {#if allTags.length > 0}
          <select class="fsel hdr-sel" value={filterTag} onchange={(e) => filterTag = (e.target as HTMLSelectElement).value} aria-label="タグ絞り込み">
            <option value="">すべてのタグ</option>
            {#each allTags as tag}
              <option value={tag}>{tag}</option>
            {/each}
          </select>
        {/if}
        <button class="btn btn-primary btn-sm" onclick={() => adding = !adding}>
          {adding ? 'キャンセル' : '＋ 追加'}
        </button>
      </div>
    </div>

    <div class="lore-tabs">
      {#each tabs as t}
        <button
          class="lore-tab-btn"
          class:active={activeTab === t.id}
          onclick={() => { activeTab = t.id; adding = false; resetAddForm() }}
        >
          <span class="lt-icon">{t.icon}</span>
          {t.label}
        </button>
      {/each}
    </div>

    {#if adding}
      <div class="add-form">
        <input
          class="fi"
          value={newTitle}
          oninput={(e) => newTitle = (e.target as HTMLInputElement).value}
          onkeydown={handleAddKeydown}
          placeholder="タイトル（必須）"
          aria-label="タイトル"
        />
        <textarea
          class="fta"
          value={newContent}
          oninput={(e) => newContent = (e.target as HTMLTextAreaElement).value}
          onkeydown={handleAddKeydown}
          placeholder="詳細を入力… (Ctrl+Enter で保存)"
          rows="3"
          aria-label="詳細"
        ></textarea>
        {#if activeTab === 'character'}
          <div class="tpl-section">
            <button class="tpl-toggle" onclick={() => { tplOpen = !tplOpen; tplPickerOpen = null }}>
              🎭 テンプレートから追加 {tplOpen ? '▲' : '▼'}
            </button>
            {#if tplOpen}
              <div class="tpl-panel">
                {#each characterCategories as cat}
                  <div class="tpl-row">
                    <span class="tpl-cat">{cat.icon} {cat.label}</span>
                    <button
                      class="tpl-val-btn"
                      class:selected={!!tplSelected[cat.key]}
                      onclick={() => { tplPickerOpen = tplPickerOpen === cat.key ? null : cat.key; tplSearch[cat.key] = '' }}
                    >{tplSelected[cat.key] || '選択…'}</button>
                    {#if tplSelected[cat.key]}
                      <button class="tpl-clear" onclick={() => tplSelected[cat.key] = ''} aria-label="クリア">×</button>
                    {/if}
                  </div>
                  {#if tplPickerOpen === cat.key}
                    <div class="tpl-picker">
                      <input class="fi tpl-search" placeholder="絞り込み…" value={tplSearch[cat.key]}
                        oninput={e => tplSearch[cat.key] = (e.target as HTMLInputElement).value} autofocus />
                      <div class="tpl-list">
                        {#each tplFilteredItems(cat.key) as item}
                          <button class="tpl-item" class:current={tplSelected[cat.key] === item}
                            onclick={() => { tplSelected[cat.key] = item; tplPickerOpen = null }}>
                            {item}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                {/each}
                <div class="tpl-actions">
                  <button class="btn-tpl-gen" onclick={tplGenerate}>🎲 ランダム生成</button>
                  <button class="btn btn-ghost btn-sm tpl-insert-btn"
                    onclick={() => tplInsert(newContent, v => newContent = v)}
                    disabled={!Object.values(tplSelected).some(Boolean)}>
                    ＋ 内容に挿入
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
        <div class="add-row">
          <input
            class="fi"
            value={newTags}
            oninput={(e) => newTags = (e.target as HTMLInputElement).value}
            placeholder="タグ（カンマ区切り）"
            aria-label="タグ"
          />
          <button class="btn btn-primary btn-sm" onclick={addEntry} disabled={!newTitle.trim()}>保存</button>
        </div>
      </div>
    {/if}

    <div class="entry-list">
      {#if loreStore.status === 'loading'}
        <div class="empty"><div class="empty-icon">⏳</div><div class="empty-msg">読み込み中…</div></div>
      {:else if currentEntries.length === 0}
        <div class="empty">
          <div class="empty-icon">{tabs.find(t => t.id === activeTab)?.icon}</div>
          <div class="empty-msg">まだ項目がありません</div>
          <div class="empty-sub">「＋ 追加」ボタンで記録しましょう</div>
        </div>
      {:else}
        {#each currentEntries as entry, idx (entry.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="entry-card"
            class:dragging={loreDs.dragIdx === idx}
            class:drag-over={loreDs.dragOverIdx === idx}
            draggable="true"
            ondragstart={() => loreDs.start(idx)}
            ondragover={(e) => loreDs.over(e, idx)}
            ondrop={() => { const next = loreDs.drop([...currentEntries], idx); if (next) saveLoreOrder(next) }}
            ondragend={() => loreDs.end()}
            onclick={() => startEdit(entry)}
          >
            <div class="entry-title">{entry.title}</div>
            {#if entry.content}
              <p class="entry-text">{entry.content}</p>
            {/if}
            {#if entry.tags.length > 0}
              <div class="tags">
                {#each entry.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

{#if editId}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fs-overlay" onclick={(e) => { if (e.target === e.currentTarget) editId = null }}>
    <div class="fs-panel" role="dialog" aria-modal="true">
      <div class="fs-header">
        <input
          class="fi fs-title-input"
          value={editTitle}
          oninput={(e) => editTitle = (e.target as HTMLInputElement).value}
          onkeydown={handleEditKeydown}
          placeholder="タイトル"
          aria-label="タイトル"
        />
        <button class="iBtn fs-del" onclick={() => { const id = editId!; editId = null; confirmDelete(id) }} aria-label="削除">🗑</button>
        <button class="iBtn fs-close" onclick={() => editId = null} aria-label="閉じる">✕</button>
      </div>
      <div class="fs-body">
        <textarea
          class="fta fs-textarea"
          value={editContent}
          oninput={(e) => editContent = (e.target as HTMLTextAreaElement).value}
          onkeydown={handleEditKeydown}
          placeholder="詳細（Ctrl+Enter で保存）"
          aria-label="詳細"
        ></textarea>
      </div>
      {#if activeTab === 'character'}
        <div class="fs-tpl">
          <button class="tpl-toggle" onclick={() => { tplOpen = !tplOpen; tplPickerOpen = null }}>
            🎭 テンプレートから追加 {tplOpen ? '▲' : '▼'}
          </button>
          {#if tplOpen}
            <div class="tpl-panel">
              {#each characterCategories as cat}
                <div class="tpl-row">
                  <span class="tpl-cat">{cat.icon} {cat.label}</span>
                  <button
                    class="tpl-val-btn"
                    class:selected={!!tplSelected[cat.key]}
                    onclick={() => { tplPickerOpen = tplPickerOpen === cat.key ? null : cat.key; tplSearch[cat.key] = '' }}
                  >{tplSelected[cat.key] || '選択…'}</button>
                  {#if tplSelected[cat.key]}
                    <button class="tpl-clear" onclick={() => tplSelected[cat.key] = ''} aria-label="クリア">×</button>
                  {/if}
                </div>
                {#if tplPickerOpen === cat.key}
                  <div class="tpl-picker">
                    <input class="fi tpl-search" placeholder="絞り込み…" value={tplSearch[cat.key]}
                      oninput={e => tplSearch[cat.key] = (e.target as HTMLInputElement).value} autofocus />
                    <div class="tpl-list">
                      {#each tplFilteredItems(cat.key) as item}
                        <button class="tpl-item" class:current={tplSelected[cat.key] === item}
                          onclick={() => { tplSelected[cat.key] = item; tplPickerOpen = null }}>
                          {item}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
              <div class="tpl-actions">
                <button class="btn-tpl-gen" onclick={tplGenerate}>🎲 ランダム生成</button>
                <button class="btn btn-ghost btn-sm tpl-insert-btn"
                  onclick={() => tplInsert(editContent, v => editContent = v)}
                  disabled={!Object.values(tplSelected).some(Boolean)}>
                  ＋ 内容に挿入
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      <div class="fs-footer">
        <input
          class="fi fs-tags-input"
          value={editTags}
          oninput={(e) => editTags = (e.target as HTMLInputElement).value}
          placeholder="タグ（カンマ区切り）"
          aria-label="タグ"
        />
        <button class="btn btn-ghost btn-sm" onclick={() => editId = null}>キャンセル</button>
        <button class="btn btn-primary btn-sm" onclick={saveEdit}>保存</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .tab-wrap    { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header  { padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
  .tab-title   { font-size: 16px; font-weight: 700; margin-right: auto }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap }
  .hdr-sel     { width: auto; padding: 5px 8px; font-size: 12px }

  .lore-tabs {
    display: flex; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    padding: 0 16px; gap: 4px;
  }
  .lore-tab-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px; background: none; border: none;
    border-bottom: 2px solid transparent;
    color: var(--muted); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: .15s; font-family: inherit;
    margin-bottom: -1px;
  }
  .lore-tab-btn:hover { color: var(--text) }
  .lore-tab-btn.active { color: var(--accent); border-bottom-color: var(--accent) }
  .lt-icon { font-size: 15px }

  .add-form    { padding: 14px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--surface2); display: flex; flex-direction: column; gap: 8px }
  .add-row     { display: flex; gap: 8px; align-items: center }
  .add-row .fi { flex: 1 }

  .entry-list  { flex: 1; overflow-y: auto; padding: 12px 20px }
  .entry-card  { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; cursor: grab; transition: border-color .15s, opacity .12s }
  .entry-card:hover { border-color: var(--accent) }
  .entry-card.dragging { opacity: 0.35; cursor: grabbing }
  .entry-card.drag-over { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent) }
  .entry-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; transition: color .15s }
  .entry-card:hover .entry-title { color: var(--accent) }
  .entry-text  { font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; color: var(--muted); margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden }

  .fs-overlay  { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 24px }
  .fs-panel    { background: var(--surface); border-radius: 14px; width: 100%; max-width: 720px; height: 100%; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,.3) }
  .fs-header   { display: flex; align-items: center; gap: 8px; padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .fs-title-input { flex: 1; font-size: 18px; font-weight: 700; border: none; background: none; outline: none; color: var(--text); font-family: inherit }
  .fs-del, .fs-close { color: var(--muted) }
  .fs-body     { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 16px 20px }
  .fs-textarea { flex: 1; resize: none; font-size: 14px; line-height: 1.8; border: none; background: none; outline: none; color: var(--text); font-family: inherit; width: 100% }
  .fs-footer   { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); flex-shrink: 0; flex-wrap: wrap }
  .fs-tags-input { flex: 1; min-width: 120px; font-size: 13px }

  .tpl-section  { display: flex; flex-direction: column; gap: 0 }
  .tpl-toggle   { background: none; border: 1px dashed var(--border); border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; padding: 6px 12px; color: var(--muted); text-align: left; font-family: inherit; transition: .15s }
  .tpl-toggle:hover { color: var(--text); border-color: var(--accent) }
  .tpl-panel    { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-top: 6px; display: flex; flex-direction: column; gap: 8px }
  .tpl-row      { display: flex; align-items: center; gap: 8px }
  .tpl-cat      { font-size: 12px; font-weight: 600; width: 90px; flex-shrink: 0 }
  .tpl-val-btn  { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 5px 10px; font-size: 12px; color: var(--muted); cursor: pointer; text-align: left; font-family: inherit; transition: .15s; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  .tpl-val-btn:hover { border-color: var(--accent) }
  .tpl-val-btn.selected { color: var(--text); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)) }
  .tpl-clear    { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 14px; padding: 0 4px; line-height: 1 }
  .tpl-clear:hover { color: var(--danger, #e05) }
  .tpl-picker   { display: flex; flex-direction: column; gap: 4px; margin: 0 0 4px 98px }
  .tpl-search   { font-size: 12px; padding: 5px 10px }
  .tpl-list     { max-height: 140px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); display: flex; flex-direction: column }
  .tpl-item     { background: none; border: none; cursor: pointer; text-align: left; padding: 5px 10px; font-size: 12px; color: var(--text); font-family: inherit; transition: background .1s }
  .tpl-item:hover { background: var(--surface2) }
  .tpl-item.current { color: var(--accent); font-weight: 700 }
  .tpl-actions    { display: flex; align-items: center; gap: 8px; justify-content: flex-end }
  .btn-tpl-gen    { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 5px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s }
  .btn-tpl-gen:hover { opacity: .85 }
  .tpl-insert-btn { align-self: auto }

  .fs-tpl { padding: 0 20px 8px; flex-shrink: 0 }
</style>
