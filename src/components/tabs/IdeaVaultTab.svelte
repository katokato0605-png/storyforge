<script lang="ts">
  import { onMount } from 'svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'

  const TEMPLATE = `オリジナル作品の作り方
①メディアは?(ゲーム? アニメ? 漫画? 実写?)


②ジャンルは? (アクション? ADV? RPG?)


③ターゲットは?


④設定を考える(どこで? 誰が? 何をする?)


⑤面白かった作品を参照する


⑥「これ作りたい! ワクワクする!」まで辿り着く


⑦システムやプロットやキャラクターなどの深掘りへ…`

  let filterLinked = $state(false)
  let filterTag = $state('')
  let newContent = $state('')
  let newTags = $state('')
  let adding = $state(false)

  let editId = $state<string | null>(null)
  let editContent = $state('')
  let editTags = $state('')

  function startEdit(idea: { id: string; content: string; tags: string[] }) {
    editId = idea.id
    editContent = idea.content
    editTags = idea.tags.join(', ')
  }

  async function saveEdit() {
    if (!editId || !editContent.trim()) return
    const tags = editTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    await ideaStore.update(editId, { content: editContent.trim(), tags })
    editId = null
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit()
    if (e.key === 'Escape') editId = null
  }

  function useTemplate() {
    newContent = TEMPLATE
    adding = true
  }

  onMount(() => ideaStore.load())

  const filtered = $derived(ideaStore.ideas.filter(i => {
    if (filterLinked && i.linkedProjectId !== projectStore.currentProjectId) return false
    if (filterTag && !i.tags.includes(filterTag)) return false
    return true
  }))

  const allTags = $derived([...new Set(ideaStore.ideas.flatMap(i => i.tags))].sort())

  async function addIdea() {
    if (!newContent.trim()) return
    const tags = newTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    await ideaStore.create(newContent.trim(), tags, filterLinked ? (projectStore.currentProjectId ?? null) : null)
    newContent = ''
    newTags = ''
    adding = false
  }

  function handleAddKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addIdea()
    if (e.key === 'Escape') { adding = false; newContent = ''; newTags = '' }
  }

  function confirmDelete(id: string) {
    appStore.openModal('confirm', {
      title: 'アイデアを削除',
      message: 'このアイデアを削除します。',
      danger: true,
      onConfirm: () => ideaStore.delete(id),
    })
  }

  function linkToggle(id: string, linked: boolean) {
    const pid = projectStore.currentProjectId ?? null
    ideaStore.update(id, { linkedProjectId: linked ? null : pid })
  }
</script>

<div class="tab-wrap">
  <div class="tab-header">
    <h2 class="tab-title">💡 アイデアVault</h2>
    <div class="header-actions">
      {#if allTags.length > 0}
        <select class="fsel hdr-sel" value={filterTag} onchange={(e) => filterTag = (e.target as HTMLSelectElement).value} aria-label="タグ絞り込み">
          <option value="">すべてのタグ</option>
          {#each allTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
      {/if}
      {#if projectStore.currentProjectId}
        <label class="linked-toggle">
          <input type="checkbox" checked={filterLinked} onchange={() => filterLinked = !filterLinked} />
          この作品のみ
        </label>
      {/if}
      <button class="btn btn-ghost btn-sm" onclick={useTemplate}>📋 テンプレ</button>
      <button class="btn btn-primary btn-sm" onclick={() => adding = !adding}>
        {adding ? 'キャンセル' : '＋ 追加'}
      </button>
    </div>
  </div>

  {#if adding}
    <div class="add-form">
      <textarea
        class="fta"
        value={newContent}
        oninput={(e) => newContent = (e.target as HTMLTextAreaElement).value}
        onkeydown={handleAddKeydown}
        placeholder="アイデアを入力… (Ctrl+Enter で保存)"
        rows="3"
        aria-label="新しいアイデア"
      ></textarea>
      <div class="add-row">
        <input
          class="fi"
          value={newTags}
          oninput={(e) => newTags = (e.target as HTMLInputElement).value}
          placeholder="タグ（カンマ区切り）"
          aria-label="タグ"
        />
        <button class="btn btn-primary btn-sm" onclick={addIdea} disabled={!newContent.trim()}>保存</button>
      </div>
    </div>
  {/if}

  <div class="idea-list">
    {#if ideaStore.status === 'loading'}
      <div class="empty"><div class="empty-icon">⏳</div><div class="empty-msg">読み込み中…</div></div>
    {:else if filtered.length === 0}
      <div class="empty">
        <div class="empty-icon">💡</div>
        <div class="empty-msg">アイデアがありません</div>
        <div class="empty-sub">「＋ 追加」ボタンでアイデアを記録しましょう</div>
      </div>
    {:else}
      {#each filtered as idea (idea.id)}
        <div class="idea-card">
          {#if editId === idea.id}
            <div class="edit-form">
              <textarea
                class="fta"
                value={editContent}
                oninput={(e) => editContent = (e.target as HTMLTextAreaElement).value}
                onkeydown={handleEditKeydown}
                rows="6"
                aria-label="アイデアを編集"
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
            <div class="idea-body">
              <p class="idea-text">{idea.content}</p>
              {#if idea.tags.length > 0}
                <div class="tags">
                  {#each idea.tags as tag}
                    <button
                      class="tag tag-btn"
                      onclick={() => filterTag = filterTag === tag ? '' : tag}
                    >{tag}</button>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="idea-actions">
              <button class="iBtn" onclick={() => startEdit(idea)} aria-label="編集">✎</button>
              {#if projectStore.currentProjectId}
                <button
                  class="iBtn"
                  class:linked={idea.linkedProjectId === projectStore.currentProjectId}
                  title={idea.linkedProjectId === projectStore.currentProjectId ? 'この作品からリンク解除' : 'この作品にリンク'}
                  onclick={() => linkToggle(idea.id, idea.linkedProjectId === projectStore.currentProjectId)}
                  aria-label="作品リンク"
                >🔗</button>
              {/if}
              <button class="iBtn del" onclick={() => confirmDelete(idea.id)} aria-label="削除">✕</button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .tab-wrap    { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header  { padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
  .tab-title   { font-size: 16px; font-weight: 700; margin-right: auto }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap }
  .hdr-sel     { width: auto; padding: 5px 8px; font-size: 12px }
  .linked-toggle { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); cursor: pointer; user-select: none }
  .add-form    { padding: 14px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--surface2) }
  .add-form .fta { margin-bottom: 8px }
  .add-row     { display: flex; gap: 8px; align-items: center }
  .add-row .fi { flex: 1 }
  .idea-list   { flex: 1; overflow-y: auto; padding: 12px 20px }
  .idea-card   { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; display: flex; gap: 10px; align-items: flex-start }
  .idea-body   { flex: 1; min-width: 0 }
  .idea-text   { font-size: 14px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; margin-bottom: 6px }
  .idea-actions{ display: flex; flex-direction: column; gap: 5px; flex-shrink: 0 }
  .edit-form   { flex: 1; min-width: 0 }
  .edit-form .fta { margin-bottom: 8px }
  .iBtn.linked { color: var(--accent); border-color: var(--accent) }
  .tag-btn     { cursor: pointer; border: none; background: var(--surface2); transition: .1s }
  .tag-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent) }
</style>
