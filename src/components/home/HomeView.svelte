<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'
  import IdeaVaultTab from '../tabs/IdeaVaultTab.svelte'
  import type { Project } from '../../lib/db/schema'
  import { onMount } from 'svelte'

  let homeSection = $state<'projects' | 'ideas' | 'trash'>('projects')

  let showForm = $state(false)
  let editTarget = $state<Project | null>(null)
  let formTitle = $state('')
  let formDesc = $state('')

  onMount(() => ideaStore.load())

  function openCreate() {
    editTarget = null
    formTitle = ''
    formDesc = ''
    showForm = true
  }

  function openEdit(p: Project, e: MouseEvent) {
    e.stopPropagation()
    editTarget = p
    formTitle = p.title
    formDesc = p.description
    showForm = true
  }

  async function handleSubmit() {
    if (!formTitle.trim()) return
    if (editTarget) {
      await projectStore.updateProject(editTarget.id, { title: formTitle.trim(), description: formDesc.trim() })
    } else {
      await projectStore.createProject(formTitle.trim(), formDesc.trim())
    }
    showForm = false
  }

  function handleDelete(p: Project, e: MouseEvent) {
    e.stopPropagation()
    appStore.openModal('confirm', {
      title: '作品を削除',
      message: `「${p.title}」とすべての章を削除しますか？この操作は取り消せません。`,
      confirmLabel: '削除',
      danger: true,
      onConfirm: () => projectStore.deleteProject(p.id),
    })
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  const trashed = $derived(ideaStore.ideas.filter(i => i.isTrash))

  function formatDeletedAt(ts: number | undefined) {
    if (!ts) return ''
    const expiry = ts + 7 * 24 * 60 * 60 * 1000
    const diff = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24))
    return diff <= 0 ? '間もなく削除' : `あと${diff}日`
  }

  function restoreIdea(id: string) {
    ideaStore.restore(id)
  }

  function confirmPermanentDelete(id: string) {
    appStore.openModal('confirm', {
      title: '完全削除',
      message: 'このアイデアを完全に削除します。元に戻せません。',
      danger: true,
      onConfirm: () => ideaStore.delete(id),
    })
  }
</script>

<div class="hv-root">
  <div class="hv-tabs">
    <button class="hv-tab" class:active={homeSection === 'projects'} onclick={() => homeSection = 'projects'}>
      📚 作品一覧
    </button>
    <button class="hv-tab" class:active={homeSection === 'ideas'} onclick={() => homeSection = 'ideas'}>
      💡 アイデア保管庫
    </button>
    <button class="hv-tab" class:active={homeSection === 'trash'} onclick={() => homeSection = 'trash'}>
      🗑 ゴミ箱{trashed.length > 0 ? ` (${trashed.length})` : ''}
    </button>
  </div>

  {#if homeSection === 'projects'}
    <div class="projects-section">
      <div class="sec-head">
        <button class="btn btn-primary btn-sm" onclick={openCreate}>＋ 新しい作品</button>
      </div>

      {#if projectStore.projects.length === 0}
        <div class="empty" style="margin-top:60px">
          <div class="empty-icon">📖</div>
          <div class="empty-msg">まだ作品がありません</div>
          <div class="empty-sub">「新しい作品」ボタンから始めましょう</div>
        </div>
      {:else}
        <div class="works-grid">
          {#each projectStore.projects as p (p.id)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="wcard" onclick={() => projectStore.selectProject(p.id)} role="button" tabindex="0"
                 onkeydown={(e) => e.key === 'Enter' && projectStore.selectProject(p.id)}>
              <div class="wcard-acts">
                <button class="iBtn" onclick={(e) => openEdit(p, e)} title="編集" aria-label="編集">✎</button>
                <button class="iBtn del" onclick={(e) => handleDelete(p, e)} title="削除" aria-label="削除">✕</button>
              </div>
              <div class="wcard-title">{p.title}</div>
              <div class="wcard-desc">{p.description || '説明なし'}</div>
              <div class="wcard-meta">更新日 {formatDate(p.updatedAt)}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else if homeSection === 'ideas'}
    <div class="ideas-section">
      <IdeaVaultTab />
    </div>
  {:else}
    <div class="trash-section">
      {#if trashed.length === 0}
        <div class="empty" style="margin-top:60px">
          <div class="empty-icon">🗑</div>
          <div class="empty-msg">ゴミ箱は空です</div>
          <div class="empty-sub">削除したアイデアは1週間保存されます</div>
        </div>
      {:else}
        <div class="trash-list">
          {#each trashed as idea (idea.id)}
            <div class="trash-card">
              <div class="trash-body">
                {#if idea.title}
                  <div class="trash-title">{idea.title}</div>
                {/if}
                {#if idea.content}
                  <p class="trash-text">{idea.content}</p>
                {/if}
                <div class="trash-meta">{formatDeletedAt(idea.deletedAt)}</div>
              </div>
              <div class="trash-actions">
                <button class="btn btn-ghost btn-sm" onclick={() => restoreIdea(idea.id)}>↩ 復元</button>
                <button class="btn btn-danger btn-sm" onclick={() => confirmPermanentDelete(idea.id)}>完全削除</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if showForm}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-ov" onclick={() => showForm = false} onkeydown={(e) => e.key === 'Escape' && (showForm = false)} role="dialog" aria-modal="true" aria-label="作品フォーム" tabindex="-1">
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <div class="modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') { showForm = false; return } e.stopPropagation() }}>
      <div class="modal-title">{editTarget ? '作品を編集' : '新しい作品'}</div>

      <div class="fg">
        <label class="fl" for="proj-title">タイトル</label>
        <input id="proj-title" class="fi" bind:value={formTitle} placeholder="作品タイトル" />
      </div>
      <div class="fg">
        <label class="fl" for="proj-desc">説明（任意）</label>
        <textarea id="proj-desc" class="fta" bind:value={formDesc} placeholder="あらすじ・メモなど"></textarea>
      </div>

      <div class="modal-acts">
        <button class="btn btn-ghost" onclick={() => showForm = false}>キャンセル</button>
        <button class="btn btn-primary" onclick={handleSubmit} disabled={!formTitle.trim()}>
          {editTarget ? '更新' : '作成'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .hv-root{display:grid;grid-template-rows:auto 1fr;height:100%;width:100%;overflow:hidden}
  .hv-tabs{display:flex;gap:4px;padding:0 0 16px 0;border-bottom:1px solid var(--border);white-space:nowrap;overflow-x:auto}
  .hv-tab{background:none;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;color:var(--muted);transition:.15s;font-family:inherit;white-space:nowrap;flex-shrink:0}
  .hv-tab:hover{color:var(--text);background:var(--surface2)}
  .hv-tab.active{color:var(--accent);background:var(--surface2)}

  .projects-section{padding-top:20px;overflow-y:auto;width:100%;min-width:0}
  .ideas-section{overflow:hidden;margin-top:16px;width:100%;min-width:0;height:100%}
  .trash-section{overflow-y:auto;padding-top:16px;width:100%;min-width:0}

  .sec-head{display:flex;align-items:center;justify-content:flex-end;margin-bottom:16px}
  .works-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .wcard{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;cursor:pointer;transition:.15s;position:relative}
  .wcard:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 4px 16px var(--shadow)}
  .wcard-title{font-size:15px;font-weight:700;margin-bottom:5px}
  .wcard-desc{font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px;min-height:32px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .wcard-meta{font-size:11px;color:var(--muted)}
  .wcard-acts{position:absolute;top:10px;right:10px;display:none;gap:4px}
  .wcard:hover .wcard-acts{display:flex}

  .trash-list{display:flex;flex-direction:column;gap:10px}
  .trash-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;display:flex;align-items:flex-start;gap:12px}
  .trash-body{flex:1;min-width:0}
  .trash-title{font-size:14px;font-weight:700;margin-bottom:4px;color:var(--text)}
  .trash-text{font-size:13px;line-height:1.6;color:var(--muted);white-space:pre-wrap;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:4px}
  .trash-meta{font-size:11px;color:var(--muted)}
  .trash-actions{display:flex;flex-direction:column;gap:6px;flex-shrink:0}
  .btn-danger{background:color-mix(in srgb,#e53e3e 15%,transparent);color:#e53e3e;border:1px solid color-mix(in srgb,#e53e3e 30%,transparent)}
  .btn-danger:hover{background:color-mix(in srgb,#e53e3e 25%,transparent)}

  .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:13px;width:100%;max-width:480px;padding:24px;max-height:90vh;overflow-y:auto}
  .modal-title{font-size:16px;font-weight:700;margin-bottom:14px}
  .modal-acts{display:flex;gap:7px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)}
</style>
