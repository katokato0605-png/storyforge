<script lang="ts">
  import { onMount } from 'svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { createDragSort } from '../../lib/utils/dragSort.svelte'

  const ideaDs = createDragSort()
  let ideaOrder = $state<string[]>([])

  $effect(() => {
    if (ideaStore.status !== 'ready') return
    try {
      const raw = localStorage.getItem('sf_idea_order')
      ideaOrder = raw ? JSON.parse(raw) : []
    } catch { ideaOrder = [] }
  })

  function saveIdeaOrder(ordered: { id: string }[]) {
    const newIds = ordered.map(i => i.id)
    const others = ideaOrder.filter(id => !newIds.includes(id))
    ideaOrder = [...newIds, ...others]
    localStorage.setItem('sf_idea_order', JSON.stringify(ideaOrder))
  }

  const TEMPLATES_LIST = [
    {
      label: 'オリジナル作品の作り方',
      content: `オリジナル作品の作り方
①メディアは?(ゲーム? アニメ? 漫画? 実写?)


②ジャンルは? (アクション? ADV? RPG?)


③ターゲットは?


④設定を考える(どこで? 誰が? 何をする?)


⑤面白かった作品を参照する


⑥「これ作りたい! ワクワクする!」まで辿り着く


⑦システムやプロットやキャラクターなどの深掘りへ…`,
    },
    {
      label: 'ストーリーライティング22の法則',
      content: `ストーリーライティング22の法則

１．成功ではなく挑戦にフォーカスする
主人公の成功という部分ではなく、諦めずに挑戦し続けるという部分を賞賛すること

２．自分ではなく読者が求めているものを書く
ライターとしての自分が書いていて楽しいものではなく、読者にとって面白いものを書くこと。この２つには、非常に大きな違いがある。

３．テーマの本質を探る
テーマ探しは非常に重要だ。しかし、ストーリーの本質は書き終えてみるまでは、ライターにも分からない。だから、書き終えたらリライト（書き直し）しよう。

４．定番のストーリーラインを抑える
むかしむかし、あるところに…。毎日…。そんなある日…。そして…。そして…。そしてついに…。

５．キャラクターの魅力を伝える
キャラクターをシンプルにして、キャラクターに焦点を合わせて、キャラクター同士の力や魅力を結合させよう。

６．キャラクターに試練を与える
キャラクターは何が得意で何が好きなのだろうか？それと正反対の試練を与えて、キャラクターに挑戦させよう。キャラクターは、その試練にどのように立ち向かうだろうか？

７．エンディングを決めておく
ストーリーの中盤部分を書く前に、エンディングを決めておこう。エンディングを考えるのは本当に骨が折れる仕事だ。だからこそ、前もってやっておこう。

８．より良いものを追求し続ける
ストーリーを書き上げたら、それが完璧になっていなくても公開しよう。そして、また書き続けて、次はもっと良いものを作ろう。

９．アイデアに詰まったらリサーチ
アイデアに詰まったら、"書くべきではない展開"のリストを作ろう。多くの場合、材料を集めれば集めるほど、良いアイデアが湧いてくる。

１０．自分の中の常識を破壊する
好きなストーリーから離れよう。あなたのアイデアは、それらのストーリーから大きな影響を受けている。自分のストーリーを書き始める前に、その事実を把握しておこう。

１１．アイデアを紙に書き起こす
アイデアを紙に書き起こすと頭の中が整理される。そして、そのアイデアが、あなたの頭から離れなければ、それは素晴らしいアイデアだ。そして、そのアイデアを他人に話してはいけない。

１２．一番最初のアイデアは無視する
一番最初に浮かんでくるアイデアは無視しよう。二番目も、三番目も…。すると、明確な良いアイデアが浮かんでくる。そして、そうやって最終的に出て来たアイデアに、あなた自身が驚くはずだ。

１３．魅力的なキャラクター作りの鉄則を知る
キャラクターにはハッキリとした意見を持たせよう。受動的で順応的なキャラクターは読者にとって退屈だ。

１４．自分の信念を知る
なぜ、あなたは、そのストーリーを伝えなければいけないのだろうか？あなたが心から伝えたい信念はなんだろうか？あなたの信念が、ストーリーの根幹となる。

１５．リアルな感情描写をする
もし、あなたがストーリーの中のキャラクターだとしたら、どう感じるだろうか？そうした感情描写の正直さが、非日常的な状況に親近感を与える。

１６．キャラクターの背景を作り込む
キャラクターが抱えているリスクや過去は何だろうか？なぜ、そのキャラクターがそうなったのかという背景を作り込もう。もし成功しなければどうなるか？挑戦に対して障害を用意しよう。

１７．継続した努力！
あなたの努力の全てはムダにはならない。もしうまくいっていなくても、気にせず進み続けよう。そうした経験は、結局あなたの糧となって戻ってくる。

１８．自分と向き合う
自分自身を知ろう。自分のベストの力が出ている時と、ただ焦って何もできなくなっている時の違いを知ろう。ストーリーライティングは、あなたを磨くのではなく、あなたをテストする。

１９．試練の到来は偶然、試練の克服は必然
キャラクターに偶然、試練が重なることは素晴らしい。しかし、その試練を克服する際に偶然の要素があると興ざめしてしまう。

２０．エクササイズ！
嫌いな映画を見て、その映画の構成要素を分析しよう。あなたは、その映画を良くするために、どのようにアレンジできるだろうか？

２１．人のリアルな心理を知る
自分自身の様々な行動や、その行動を取るにいたった動機を知ろう。ストーリーは、ただかっこ良く書けば良いものではない。

２２．ストーリーを一言で表せるようにする
あなたのストーリーのエッセンス（肝）は何だろうか？それを短い言葉で伝えるなら？もし、あなたの中で、これらのことが明確なら、あなたはそこからキャリアを築くことができる。`,
    },
  ]

  let showTemplateMenu = $state(false)
  let filterLinked = $state(false)
  let filterTag = $state('')
  let newTitle = $state('')
  let newContent = $state('')
  let newTags = $state('')
  let adding = $state(false)

  let editId = $state<string | null>(null)
  let editTitle = $state('')
  let editContent = $state('')
  let editTags = $state('')

  function startEdit(idea: { id: string; title: string; content: string; tags: string[] }) {
    editId = idea.id
    editTitle = idea.title ?? ''
    editContent = idea.content
    editTags = idea.tags.join(', ')
  }

  async function saveEdit() {
    if (!editId) return
    const tags = editTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    await ideaStore.update(editId, { title: editTitle.trim(), content: editContent.trim(), tags })
    editId = null
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit()
    if (e.key === 'Escape') editId = null
  }

  function useTemplate(content: string) {
    newContent = content
    adding = true
    showTemplateMenu = false
  }

  onMount(() => ideaStore.load())

  const filtered = $derived.by(() => {
    const base = ideaStore.ideas.filter(i => {
      if (filterLinked && i.linkedProjectId !== projectStore.currentProjectId) return false
      if (filterTag && !i.tags.includes(filterTag)) return false
      return true
    })
    if (ideaOrder.length === 0) return base
    return [...base].sort((a, b) => {
      const ai = ideaOrder.indexOf(a.id)
      const bi = ideaOrder.indexOf(b.id)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  })

  const allTags = $derived([...new Set(ideaStore.ideas.flatMap(i => i.tags))].sort())

  async function addIdea() {
    if (!newTitle.trim() && !newContent.trim()) return
    const tags = newTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    await ideaStore.create(newTitle.trim(), newContent.trim(), tags, filterLinked ? (projectStore.currentProjectId ?? null) : null)
    newTitle = ''
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

<datalist id="idea-tag-suggestions">
  <option value="書きたいシーン"></option>
  {#each allTags.filter(t => t !== '書きたいシーン') as tag}
    <option value={tag}></option>
  {/each}
</datalist>

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
      <div class="tmpl-wrap">
        <button class="btn btn-ghost btn-sm" onclick={() => showTemplateMenu = !showTemplateMenu}>📋 テンプレ ▾</button>
        {#if showTemplateMenu}
          <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
          <div class="tmpl-backdrop" onclick={() => showTemplateMenu = false}></div>
          <div class="tmpl-menu">
            {#each TEMPLATES_LIST as tmpl}
              <button class="tmpl-item" onclick={() => useTemplate(tmpl.content)}>{tmpl.label}</button>
            {/each}
          </div>
        {/if}
      </div>
      <button class="btn btn-primary btn-sm" onclick={() => { if (adding) { adding = false; newTitle = ''; newContent = ''; newTags = '' } else { adding = true } }}>
        {adding ? 'キャンセル' : '＋ 追加'}
      </button>
    </div>
  </div>

  {#if adding}
    <div class="add-form">
      <input
        class="fi idea-title-input"
        value={newTitle}
        oninput={(e) => newTitle = (e.target as HTMLInputElement).value}
        onkeydown={handleAddKeydown}
        placeholder="タイトル"
        aria-label="タイトル"
      />
      <textarea
        class="fta"
        value={newContent}
        oninput={(e) => newContent = (e.target as HTMLTextAreaElement).value}
        onkeydown={handleAddKeydown}
        placeholder="詳細（任意）… (Ctrl+Enter で保存)"
        rows="3"
        aria-label="詳細"
      ></textarea>
      <div class="add-row">
        <input
          class="fi"
          list="idea-tag-suggestions"
          value={newTags}
          oninput={(e) => newTags = (e.target as HTMLInputElement).value}
          placeholder="タグ（カンマ区切り）"
          aria-label="タグ"
        />
        <button class="btn btn-primary btn-sm" onclick={addIdea} disabled={!newTitle.trim() && !newContent.trim()}>保存</button>
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
      {#each filtered as idea, idx (idea.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
          class="idea-card"
          class:dragging={ideaDs.dragIdx === idx}
          class:drag-over={ideaDs.dragOverIdx === idx}
          draggable="true"
          ondragstart={() => ideaDs.start(idx)}
          ondragover={(e) => ideaDs.over(e, idx)}
          ondrop={() => { const next = ideaDs.drop([...filtered], idx); if (next) saveIdeaOrder(next) }}
          ondragend={() => ideaDs.end()}
          onclick={() => startEdit(idea)}
        >
          {#if idea.title}
            <div class="idea-title">{idea.title}</div>
          {/if}
          {#if idea.content}
            <p class="idea-text">{idea.content}</p>
          {/if}
          {#if idea.tags.length > 0}
            <div class="tags">
              {#each idea.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

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
        <button class="iBtn del fs-del" onclick={() => { const id = editId!; editId = null; confirmDelete(id) }} aria-label="削除">🗑</button>
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
      <div class="fs-footer">
        <input
          class="fi fs-tags-input"
          list="idea-tag-suggestions"
          value={editTags}
          oninput={(e) => editTags = (e.target as HTMLInputElement).value}
          placeholder="タグ（カンマ区切り）"
          aria-label="タグ"
        />
        {#if projectStore.currentProjectId}
          {@const linked = ideaStore.ideas.find(i => i.id === editId)?.linkedProjectId === projectStore.currentProjectId}
          <button class="btn btn-ghost btn-sm" onclick={() => linkToggle(editId!, linked)} title={linked ? 'リンク解除' : 'この作品にリンク'}>
            🔗 {linked ? 'リンク済み' : 'リンク'}
          </button>
        {/if}
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
  .linked-toggle { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); cursor: pointer; user-select: none }
  .add-form    { padding: 14px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--surface2) }
  .add-form .fta { margin-bottom: 8px }
  .add-row     { display: flex; gap: 8px; align-items: center }
  .add-row .fi { flex: 1 }
  .idea-list   { flex: 1; overflow-y: auto; padding: 12px 20px }
  .idea-card   { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; cursor: grab; transition: border-color .15s, opacity .12s }
  .idea-card:hover { border-color: var(--accent) }
  .idea-card.dragging { opacity: 0.35; cursor: grabbing }
  .idea-card.drag-over { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent) }
  .idea-title  { font-size: 14px; font-weight: 700; margin-bottom: 4px; color: var(--text) }
  .idea-card:hover .idea-title { color: var(--accent) }
  .idea-text   { font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; color: var(--muted); margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden }

  .fs-overlay  { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 24px }
  .fs-panel    { background: var(--surface); border-radius: 14px; width: 100%; max-width: 720px; height: 100%; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,.3) }
  .fs-header   { display: flex; align-items: center; gap: 8px; padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .fs-title-input { flex: 1; font-size: 18px; font-weight: 700; border: none; background: none; outline: none; color: var(--text); font-family: inherit }
  .fs-del      { color: var(--muted) }
  .fs-close    { color: var(--muted) }
  .fs-body     { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 16px 20px }
  .fs-textarea { flex: 1; resize: none; font-size: 14px; line-height: 1.8; border: none; background: none; outline: none; color: var(--text); font-family: inherit; width: 100% }
  .fs-footer   { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); flex-shrink: 0; flex-wrap: wrap }
  .fs-tags-input { flex: 1; min-width: 120px; font-size: 13px }
  .tmpl-wrap   { position: relative }
  .tmpl-backdrop { position: fixed; inset: 0; z-index: 10 }
  .tmpl-menu   { position: absolute; top: calc(100% + 4px); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15); z-index: 20; min-width: 200px; overflow: hidden }
  .tmpl-item   { display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 13px; color: var(--text); font-family: inherit }
  .tmpl-item:hover { background: var(--surface2) }
</style>
