<script lang="ts">
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'
  import IdeaVaultTab from '../tabs/IdeaVaultTab.svelte'
  import type { Project } from '../../lib/db/schema'

  let homeSection = $state<'projects' | 'ideas'>('projects')

  let showForm = $state(false)
  let editTarget = $state<Project | null>(null)
  let formTitle = $state('')
  let formDesc = $state('')

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
</script>

<div class="hv-root">
  <div class="hv-tabs">
    <button class="hv-tab" class:active={homeSection === 'projects'} onclick={() => homeSection = 'projects'}>
      📚 作品一覧
    </button>
    <button class="hv-tab" class:active={homeSection === 'ideas'} onclick={() => homeSection = 'ideas'}>
      💡 アイデア保管庫
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
  {:else}
    <div class="ideas-section">
      <IdeaVaultTab />
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
  .hv-root{display:flex;flex-direction:column;height:100%}
  .hv-tabs{display:flex;gap:4px;padding:0 0 16px 0;border-bottom:1px solid var(--border);flex-shrink:0}
  .hv-tab{background:none;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;color:var(--muted);transition:.15s;font-family:inherit}
  .hv-tab:hover{color:var(--text);background:var(--surface2)}
  .hv-tab.active{color:var(--accent);background:var(--surface2)}

  .projects-section{padding-top:20px;overflow-y:auto;flex:1}
  .ideas-section{flex:1;overflow:hidden;margin-top:16px}

  .sec-head{display:flex;align-items:center;justify-content:flex-end;margin-bottom:16px}
  .works-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .wcard{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;cursor:pointer;transition:.15s;position:relative}
  .wcard:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 4px 16px var(--shadow)}
  .wcard-title{font-size:15px;font-weight:700;margin-bottom:5px}
  .wcard-desc{font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px;min-height:32px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .wcard-meta{font-size:11px;color:var(--muted)}
  .wcard-acts{position:absolute;top:10px;right:10px;display:none;gap:4px}
  .wcard:hover .wcard-acts{display:flex}

  .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:13px;width:100%;max-width:480px;padding:24px;max-height:90vh;overflow-y:auto}
  .modal-title{font-size:16px;font-weight:700;margin-bottom:14px}
  .modal-acts{display:flex;gap:7px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)}

</style>
