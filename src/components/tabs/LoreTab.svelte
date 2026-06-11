<script lang="ts">
  import { onMount } from 'svelte'
  import { loreStore } from '../../lib/stores/loreStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'
  import type { LoreType } from '../../lib/db/schema'

  type Tab = LoreType
  let activeTab = $state<Tab>('character')

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'character', icon: '👤', label: 'キャラクター' },
    { id: 'world',     icon: '🌍', label: '世界観' },
    { id: 'lore',      icon: '📝', label: 'その他' },
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

  onMount(() => {
    const pid = projectStore.currentProjectId
    if (pid) loreStore.load(pid)
  })

  $effect(() => {
    // タブ切り替え時にフィルタリセット
    activeTab
    filterTag = ''
  })

  const currentEntries = $derived(
    loreStore.entries.filter(e => {
      if (e.projectId !== projectStore.currentProjectId) return false
      if (e.type !== activeTab) return false
      if (filterTag && !e.tags.includes(filterTag)) return false
      return true
    })
  )

  const allTags = $derived(
    [...new Set(
      loreStore.entries
        .filter(e => e.type === activeTab && e.projectId === projectStore.currentProjectId)
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
    await loreStore.create(pid, activeTab, newTitle.trim(), newContent.trim(), tags)
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
        {#each currentEntries as entry (entry.id)}
          <div class="entry-card">
            {#if editId === entry.id}
              <div class="edit-form">
                <input
                  class="fi"
                  value={editTitle}
                  oninput={(e) => editTitle = (e.target as HTMLInputElement).value}
                  onkeydown={handleEditKeydown}
                  placeholder="タイトル"
                  aria-label="タイトル"
                />
                <textarea
                  class="fta"
                  value={editContent}
                  oninput={(e) => editContent = (e.target as HTMLTextAreaElement).value}
                  onkeydown={handleEditKeydown}
                  rows="5"
                  aria-label="詳細を編集"
                ></textarea>
                <div class="add-row">
                  <input
                    class="fi"
                    value={editTags}
                    oninput={(e) => editTags = (e.target as HTMLInputElement).value}
                    placeholder="タグ（カンマ区切り）"
                    aria-label="タグ"
                  />
                  <button class="btn btn-ghost btn-sm" onclick={() => editId = null}>キャンセル</button>
                  <button class="btn btn-primary btn-sm" onclick={saveEdit}>保存</button>
                </div>
              </div>
            {:else}
              <div class="entry-body">
                <div class="entry-title">{entry.title}</div>
                {#if entry.content}
                  <p class="entry-text">{entry.content}</p>
                {/if}
                {#if entry.tags.length > 0}
                  <div class="tags">
                    {#each entry.tags as tag}
                      <button
                        class="tag tag-btn"
                        onclick={() => filterTag = filterTag === tag ? '' : tag}
                      >{tag}</button>
                    {/each}
                  </div>
                {/if}
              </div>
              <div class="entry-actions">
                <button class="iBtn" onclick={() => startEdit(entry)} aria-label="編集">✎</button>
                <button class="iBtn del" onclick={() => confirmDelete(entry.id)} aria-label="削除">✕</button>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
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
  .entry-card  { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; display: flex; gap: 10px; align-items: flex-start }
  .entry-body  { flex: 1; min-width: 0 }
  .entry-title { font-size: 14px; font-weight: 700; margin-bottom: 4px }
  .entry-text  { font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; color: var(--muted); margin-bottom: 6px }
  .entry-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0 }
  .edit-form   { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px }
  .tag-btn     { cursor: pointer; border: none; background: var(--surface2); transition: .1s }
  .tag-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent) }
</style>
