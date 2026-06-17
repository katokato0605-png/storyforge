<script lang="ts">
  import { onMount } from 'svelte'
  import { nanoid } from 'nanoid'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'
  import { createHistory } from '../../lib/utils/history.svelte'
  import { createDragSort } from '../../lib/utils/dragSort.svelte'
  import UndoRedoButtons from '../ui/UndoRedoButtons.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'

  const epDs = createDragSort()
  const chDs = createDragSort()
  const sceneDs = createDragSort()
  const beatDs = createDragSort()

  // ---- Types ----
  type SceneRole = '起' | '承' | '転' | '結' | '自由'

  interface Scene {
    id: string
    role: SceneRole
    memo: string
    dialogue: string
    dialogueOpen: boolean
  }

  interface Episode {
    id: string
    number: number
    title: string
    groupName: string
    groupColor: string
    chapterId: string | null
    scenes: Scene[]
  }

  interface ChapterBeat {
    id: string
    stage: string
    title: string
    memo: string
  }

  interface Chapter {
    id: string
    title: string
    theme: string
    stateStart: string
    stateEnd: string
    beats: ChapterBeat[]
  }

  interface NameDataV1 {
    version: 1
    episodes: Episode[]
    chapters: Chapter[]
  }

  interface NameData {
    version: 2
    episodes: Episode[]
    structureChapters: Record<string, Chapter[]>
  }

  // ---- Structure tabs ----
  const STRUCTURE_TABS = [
    { key: 'free',          label: '自由' },
    { key: 'three_act',     label: '三幕構成' },
    { key: 'heros_journey', label: 'ヒーローズジャーニー' },
    { key: 'kishoten',      label: '起承転結' },
    { key: 'johakyuu',      label: '序破急' },
  ] as const

  type StructureKey = typeof STRUCTURE_TABS[number]['key']

  // ---- Templates ----
  const CHAPTER_TEMPLATES: Record<string, { label: string; beats: { stage: string; title: string; hint: string }[] }> = {
    three_act: {
      label: '三幕構成（8ビート）',
      beats: [
        { stage: '第一幕', title: '日常世界',       hint: '主人公の普段の生活・性格・欲求を描く。' },
        { stage: '第一幕', title: 'きっかけ',       hint: '主人公の日常を揺るがす出来事が起きる。' },
        { stage: '第一幕', title: '決意',           hint: '主人公が「行動する」と決める瞬間。' },
        { stage: '第二幕', title: '新世界へ',       hint: '主人公が未知の環境・状況に飛び込む。' },
        { stage: '第二幕', title: '中間転換点',     hint: '物語の折り返し地点。' },
        { stage: '第二幕', title: '最大の危機',     hint: '主人公がどん底に落ちる瞬間。' },
        { stage: '第三幕', title: 'クライマックス', hint: '物語の頂点。' },
        { stage: '第三幕', title: '解決',           hint: '戦いの後の世界を描く。' },
      ],
    },
    heros_journey: {
      label: 'ヒーローズジャーニー（12段階）',
      beats: [
        { stage: '出発',            title: '日常世界',         hint: '冒険前の主人公の普通の生活。' },
        { stage: '出発',            title: '冒険への召喚',     hint: '主人公に使命・問題・誘いが訪れる。' },
        { stage: '出発',            title: '召喚の拒否',       hint: '主人公が恐れや義務感から冒険を断る。' },
        { stage: '出発',            title: '師との出会い',     hint: '主人公を導く存在が現れ、旅への準備が整う。' },
        { stage: '出発',            title: '第一関門突破',     hint: '日常世界を離れ、未知の領域に踏み込む。' },
        { stage: 'イニシエーション', title: 'テスト・仲間・敵', hint: '新しい世界でのルールを学ぶ。' },
        { stage: 'イニシエーション', title: '最深部への接近',  hint: '最大の試練が待つ場所へ近づく。' },
        { stage: 'イニシエーション', title: '最大の試練',      hint: '主人公が「死」に最も近づく瞬間。' },
        { stage: 'イニシエーション', title: '報酬',            hint: '試練を乗り越えた主人公が宝を手に入れる。' },
        { stage: '帰還',            title: '帰路',             hint: '宝を持って日常世界に戻ろうとする。' },
        { stage: '帰還',            title: '復活',             hint: '最後の浄化・試練。' },
        { stage: '帰還',            title: '宝を持っての帰還', hint: '変容した主人公が日常世界に戻る。' },
      ],
    },
    kishoten: {
      label: '起承転結（4ビート）',
      beats: [
        { stage: '起', title: '導入',   hint: '物語の世界観・登場人物・状況を提示する。' },
        { stage: '承', title: '展開',   hint: '事件や問題が発生し、物語が動き出す。' },
        { stage: '転', title: '転換',   hint: '予想外の展開や逆転が起きる。' },
        { stage: '結', title: 'まとめ', hint: '物語が締めくくられ、結末を迎える。' },
      ],
    },
    johakyuu: {
      label: '序破急（3ビート）',
      beats: [
        { stage: '序', title: '序',   hint: 'ゆっくりとした導入。世界と人物を丁寧に描く。' },
        { stage: '破', title: '破',   hint: '変化と発展。展開が加速し、葛藤が深まる。' },
        { stage: '急', title: '急',   hint: '急激な加速とクライマックス。一気に結末へ。' },
      ],
    },
  }

  // ---- State ----
  let subTab = $state<'episode' | 'chapter' | 'idea'>('chapter')
  let structureKey = $state<StructureKey>('free')

  // Idea sub-tab
  const SCENE_TAG = '書きたいシーン'
  const sceneIdeas = $derived(ideaStore.ideas.filter(i => i.tags.includes(SCENE_TAG)))
  let ideaEditId = $state<string | null>(null)
  let ideaEditTitle = $state('')
  let ideaEditContent = $state('')
  let ideaEditTags = $state('')
  let ideaAdding = $state(false)
  let newIdeaTitle = $state('')
  let newIdeaContent = $state('')
  let newIdeaTags = $state(SCENE_TAG)

  function startIdeaEdit(idea: { id: string; title: string; content: string; tags: string[] }) {
    ideaEditId = idea.id
    ideaEditTitle = idea.title ?? ''
    ideaEditContent = idea.content
    ideaEditTags = idea.tags.join(', ')
  }

  async function saveIdeaEdit() {
    if (!ideaEditId) return
    const tags = ideaEditTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    await ideaStore.update(ideaEditId, { title: ideaEditTitle.trim(), content: ideaEditContent.trim(), tags })
    ideaEditId = null
  }

  async function addSceneIdea() {
    if (!newIdeaTitle.trim() && !newIdeaContent.trim()) return
    const tags = newIdeaTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    if (!tags.includes(SCENE_TAG)) tags.unshift(SCENE_TAG)
    await ideaStore.create(newIdeaTitle.trim(), newIdeaContent.trim(), tags, projectStore.currentProjectId ?? null)
    newIdeaTitle = ''
    newIdeaContent = ''
    newIdeaTags = SCENE_TAG
    ideaAdding = false
  }

  // Episode sub-tab
  let episodes = $state<Episode[]>([])
  let selectedEpisodeId = $state<string | null>(null)
  let sceneEditId = $state<string | null>(null)

  // Chapter sub-tab
  let structureChapters = $state<Record<string, Chapter[]>>({})
  // selectedChapterId per structure key
  let selectedChapterIds: Record<string, string | null> = {}
  let selectedChapterId = $state<string | null>(null)
  let showTmplMenu = $state(false)
  let beatEditId = $state<string | null>(null)
  const chapterHist = createHistory<Chapter[]>()

  const chapters = $derived(structureChapters[structureKey] ?? [])
  const allChapters = $derived(Object.values(structureChapters).flat())

  function setChapters(key: string, newChaps: Chapter[]) {
    structureChapters = { ...structureChapters, [key]: newChaps }
  }

  function switchStructure(key: StructureKey) {
    // save current selection
    selectedChapterIds[structureKey] = selectedChapterId
    structureKey = key
    // restore saved selection, or default to first chapter
    const saved = selectedChapterIds[key]
    const chs = structureChapters[key] ?? []
    selectedChapterId = saved !== undefined ? saved : (chs[0]?.id ?? null)
  }

  // Persistence
  let saveTimer: ReturnType<typeof setTimeout>
  let loaded = $state(false)

  const storageKey = $derived(
    projectStore.currentProjectId ? `sf_name_${projectStore.currentProjectId}` : null
  )

  // Load on project change
  $effect(() => {
    const key = storageKey
    loaded = false
    if (!key) return
    let eps: Episode[] = []
    let strChaps: Record<string, Chapter[]> = {}
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.version === 2) {
          const data = parsed as NameData
          eps = data.episodes ?? []
          strChaps = data.structureChapters ?? {}
        } else {
          // v1 → v2 migration
          const data = parsed as NameDataV1
          eps = data.episodes ?? []
          strChaps = { free: data.chapters ?? [] }
        }
      }
    } catch {
      // keep empty
    }
    episodes = eps
    structureChapters = strChaps
    selectedEpisodeId = eps[0]?.id ?? null
    selectedChapterIds = {}
    structureKey = 'free'
    selectedChapterId = (strChaps['free'] ?? [])[0]?.id ?? null
    loaded = true
  })

  function save() {
    const key = storageKey
    if (!key) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const data: NameData = { version: 2, episodes, structureChapters }
      localStorage.setItem(key, JSON.stringify(data))
    }, 300)
  }

  // ---- Episode helpers ----
  const selectedEpisode = $derived(
    selectedEpisodeId ? episodes.find(e => e.id === selectedEpisodeId) ?? null : null
  )

  const GROUP_COLORS = ['#6b7cff', '#ff7c7c', '#7cda7c', '#f0c040', '#c07cff', '#7ce8e8', '#ff9e50']

  function addEpisode() {
    const ep: Episode = {
      id: nanoid(), number: episodes.length + 1, title: '',
      groupName: '', groupColor: '', chapterId: null, scenes: [],
    }
    episodes = [...episodes, ep]
    selectedEpisodeId = ep.id
    save()
  }

  function deleteEpisode(id: string) {
    episodes = episodes.filter(e => e.id !== id)
    if (selectedEpisodeId === id) selectedEpisodeId = episodes[0]?.id ?? null
    save()
  }

  function updateEpisode(id: string, patch: Partial<Omit<Episode, 'scenes'>>) {
    episodes = episodes.map(e => e.id === id ? { ...e, ...patch } : e)
    save()
  }

  // ---- Scene helpers ----
  const ROLES: SceneRole[] = ['起', '承', '転', '結', '自由']
  const ROLE_COLORS: Record<SceneRole, string> = {
    '起': '#6b7cff', '承': '#7cda7c', '転': '#f0c040', '結': '#ff7c7c', '自由': '#aaa',
  }

  function addScene(epId: string) {
    const scene: Scene = { id: nanoid(), role: '自由', memo: '', dialogue: '', dialogueOpen: false }
    episodes = episodes.map(e => e.id === epId ? { ...e, scenes: [...e.scenes, scene] } : e)
    sceneEditId = scene.id
    save()
  }

  function deleteScene(epId: string, sceneId: string) {
    episodes = episodes.map(e => e.id === epId
      ? { ...e, scenes: e.scenes.filter(s => s.id !== sceneId) }
      : e
    )
    if (sceneEditId === sceneId) sceneEditId = null
    save()
  }

  function updateScene(epId: string, sceneId: string, patch: Partial<Scene>) {
    episodes = episodes.map(e => e.id === epId
      ? { ...e, scenes: e.scenes.map(s => s.id === sceneId ? { ...s, ...patch } : s) }
      : e
    )
    save()
  }

  function dragScene(epId: string, toIdx: number) {
    const ep = episodes.find(e => e.id === epId)
    if (!ep) return
    const next = sceneDs.drop(ep.scenes, toIdx)
    if (!next) return
    episodes = episodes.map(e => e.id === epId ? { ...e, scenes: next } : e)
    save()
  }

  // ---- Chapter helpers ----
  const selectedChapter = $derived(
    selectedChapterId ? chapters.find(c => c.id === selectedChapterId) ?? null : null
  )

  function addChapter() {
    chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    const ch: Chapter = {
      id: nanoid(), title: '', theme: '', stateStart: '', stateEnd: '', beats: [],
    }
    const next = [...chapters, ch]
    setChapters(structureKey, next)
    selectedChapterId = ch.id
    save()
  }

  function deleteChapter(id: string) {
    chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    const next = chapters.filter(c => c.id !== id)
    setChapters(structureKey, next)
    if (selectedChapterId === id) selectedChapterId = next[0]?.id ?? null
    save()
  }

  function updateChapter(id: string, patch: Partial<Omit<Chapter, 'beats'>>) {
    setChapters(structureKey, chapters.map(c => c.id === id ? { ...c, ...patch } : c))
    save()
  }

  function applyTemplate(key: string, targetChapterId?: string) {
    showTmplMenu = false
    const tmpl = CHAPTER_TEMPLATES[key]
    if (!tmpl) return
    const chId = targetChapterId ?? selectedChapterId
    if (!chId) return
    const ch = chapters.find(c => c.id === chId)
    if (!ch) return
    const doApply = () => {
      chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
      const newBeats: ChapterBeat[] = tmpl.beats.map(b => ({
        id: nanoid(), stage: b.stage, title: b.title, memo: b.hint,
      }))
      setChapters(structureKey, chapters.map(c => c.id === chId ? { ...c, beats: newBeats } : c))
      save()
    }
    if (ch.beats.length > 0) {
      appStore.openModal('confirm', {
        title: 'テンプレート適用',
        message: '既存のビートをテンプレートで上書きしますか？',
        danger: true,
        onConfirm: doApply,
      })
      return
    }
    doApply()
  }

  function applyTemplateNewChapter(templateKey: string) {
    const tmpl = CHAPTER_TEMPLATES[templateKey]
    if (!tmpl) return
    chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    const newBeats: ChapterBeat[] = tmpl.beats.map(b => ({
      id: nanoid(), stage: b.stage, title: b.title, memo: b.hint,
    }))
    const ch: Chapter = {
      id: nanoid(), title: tmpl.label, theme: '', stateStart: '', stateEnd: '', beats: newBeats,
    }
    const next = [...chapters, ch]
    setChapters(structureKey, next)
    selectedChapterId = ch.id
    save()
  }

  function addBeat(chId: string) {
    chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    const beat: ChapterBeat = { id: nanoid(), stage: '', title: '', memo: '' }
    setChapters(structureKey, chapters.map(c => c.id === chId ? { ...c, beats: [...c.beats, beat] } : c))
    beatEditId = beat.id
    save()
  }

  function deleteBeat(chId: string, beatId: string) {
    chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    setChapters(structureKey, chapters.map(c => c.id === chId
      ? { ...c, beats: c.beats.filter(b => b.id !== beatId) }
      : c
    ))
    if (beatEditId === beatId) beatEditId = null
    save()
  }

  function updateBeat(chId: string, beatId: string, patch: Partial<ChapterBeat>) {
    setChapters(structureKey, chapters.map(c => c.id === chId
      ? { ...c, beats: c.beats.map(b => b.id === beatId ? { ...b, ...patch } : b) }
      : c
    ))
    save()
  }

  function dragBeat(chId: string, toIdx: number) {
    const ch = chapters.find(c => c.id === chId)
    if (!ch) return
    const next = beatDs.drop(ch.beats, toIdx)
    if (!next) return
    chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    setChapters(structureKey, chapters.map(c => c.id === chId ? { ...c, beats: next } : c))
    save()
  }

  function dragEpisode(toIdx: number) {
    const next = epDs.drop(episodes, toIdx)
    if (!next) return
    episodes = next
    if (!next.find(e => e.id === selectedEpisodeId)) selectedEpisodeId = next[0]?.id ?? null
    save()
  }

  function dragChapter(toIdx: number) {
    const next = chDs.drop(chapters, toIdx)
    if (!next) return
    chapterHist.push(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    setChapters(structureKey, next)
    if (!next.find(c => c.id === selectedChapterId)) selectedChapterId = next[0]?.id ?? null
    save()
  }

  // ---- Chapter undo/redo ----
  function chapterUndo() {
    const prev = chapterHist.undo(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    if (!prev) return
    setChapters(structureKey, prev)
    if (!prev.find(c => c.id === selectedChapterId)) selectedChapterId = prev[0]?.id ?? null
    save()
  }

  function chapterRedo() {
    const next = chapterHist.redo(chapters.map(c => ({ ...c, beats: [...c.beats] })))
    if (!next) return
    setChapters(structureKey, next)
    if (!next.find(c => c.id === selectedChapterId)) selectedChapterId = next[0]?.id ?? null
    save()
  }

  $effect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (subTab !== 'chapter') return
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); chapterUndo() }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); chapterRedo() }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  })

  // ---- Structure tab default template ----
  // When switching to a non-free structure with no chapters, offer to apply template
  const structureHasTemplate = $derived(structureKey !== 'free' && structureKey in CHAPTER_TEMPLATES)

  onMount(() => ideaStore.load())
</script>

{#if loaded && projectStore.currentProjectId}
  <div class="nt-overlay">
    <!-- Header -->
    <div class="nt-header">
      <span class="nt-header-title">📝 ネーム</span>
      <div class="nt-subtabs">
        <button
          class="nt-stab"
          class:active={subTab === 'chapter'}
          onclick={() => subTab = 'chapter'}
        >章</button>
        <button
          class="nt-stab"
          class:active={subTab === 'episode'}
          onclick={() => subTab = 'episode'}
        >話</button>
        <button
          class="nt-stab"
          class:active={subTab === 'idea'}
          onclick={() => subTab = 'idea'}
        >アイデア</button>
      </div>
    </div>

    <!-- ============ 一話サブタブ ============ -->
    {#if subTab === 'episode'}
      <div class="nt-body">
        <!-- Left: episode list -->
        <div class="nt-left">
          <div class="nt-left-toolbar">
            <span class="nt-left-title">話リスト</span>
            <button class="iBtn" onclick={addEpisode} aria-label="追加">＋</button>
          </div>
          <div class="nt-list">
            {#if episodes.length === 0}
              <div class="nt-empty-hint">話を追加してください</div>
            {:else}
              {#each episodes as ep, idx (ep.id)}
                {@const linkedCh = ep.chapterId ? allChapters.find(c => c.id === ep.chapterId) ?? null : null}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="nt-list-drag-row"
                  class:drag-over={epDs.dragOverIdx === idx}
                  class:dragging={epDs.dragIdx === idx}
                  draggable="true"
                  data-drag-idx={idx}
                  ondragstart={() => epDs.start(idx)}
                  ondragover={(e) => epDs.over(e, idx)}
                  ondrop={() => dragEpisode(idx)}
                  ondragend={() => epDs.end()}
                  ontouchstart={() => epDs.touchstart(idx)}
                  ontouchmove={(e) => epDs.touchmove(e)}
                  ontouchend={() => { const to = epDs.dragOverIdx; if (to !== null) dragEpisode(to); else epDs.end() }}
                >
                  <span class="drag-handle-sm">⠿</span>
                  <button
                    class="nt-list-item"
                    class:active={selectedEpisodeId === ep.id}
                    onclick={() => selectedEpisodeId = ep.id}
                  >
                    {#if ep.groupColor}
                      <span class="nt-group-dot" style="background:{ep.groupColor}"></span>
                    {/if}
                    <span class="nt-ep-num">{ep.number}話</span>
                    <span class="nt-ep-title">{ep.title || '（無題）'}</span>
                    {#if linkedCh}
                      <span class="nt-ch-tag">{linkedCh.title || '章'}</span>
                    {:else if ep.groupName}
                      <span class="nt-ch-tag">{ep.groupName}</span>
                    {/if}
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Right: selected episode scenes -->
        <div class="nt-right">
          {#if selectedEpisode}
            <div class="nt-right-header">
              <div class="nt-ep-fields">
                <input
                  class="fi nt-ep-num-input"
                  type="number"
                  value={selectedEpisode.number}
                  oninput={(e) => updateEpisode(selectedEpisode!.id, { number: Number((e.target as HTMLInputElement).value) })}
                  placeholder="話数"
                />
                <input
                  class="fi nt-ep-title-input"
                  value={selectedEpisode.title}
                  oninput={(e) => updateEpisode(selectedEpisode!.id, { title: (e.target as HTMLInputElement).value })}
                  placeholder="タイトル（任意）"
                />
                <select
                  class="fi nt-ep-group-select"
                  value={selectedEpisode.chapterId ?? ''}
                  onchange={(e) => {
                    const chId = (e.target as HTMLSelectElement).value || null
                    const ch = chId ? allChapters.find(c => c.id === chId) : null
                    const label = ch ? (ch.title || '章') : ''
                    updateEpisode(selectedEpisode!.id, { chapterId: chId, groupName: label })
                  }}
                >
                  <option value="">（章なし）</option>
                  {#each STRUCTURE_TABS as stab}
                    {@const strChs = structureChapters[stab.key] ?? []}
                    {#if strChs.length > 0}
                      <optgroup label={stab.label}>
                        {#each strChs as ch (ch.id)}
                          <option value={ch.id}>{ch.title || '（無題）'}</option>
                        {/each}
                      </optgroup>
                    {/if}
                  {/each}
                </select>
                <div class="nt-color-row">
                  {#each GROUP_COLORS as color}
                    <button
                      class="nt-color-btn"
                      class:selected={selectedEpisode.groupColor === color}
                      style="background:{color}"
                      onclick={() => updateEpisode(selectedEpisode!.id, { groupColor: color })}
                      aria-label={color}
                    ></button>
                  {/each}
                  <button
                    class="nt-color-btn nt-color-none"
                    class:selected={!selectedEpisode.groupColor}
                    onclick={() => updateEpisode(selectedEpisode!.id, { groupColor: '' })}
                    aria-label="色なし"
                  >×</button>
                </div>
              </div>
              <div class="nt-right-acts">
                <button class="btn btn-primary btn-sm" onclick={() => addScene(selectedEpisode!.id)}>＋ 場面</button>
                <button class="iBtn del" onclick={() => deleteEpisode(selectedEpisode!.id)} aria-label="話を削除">🗑</button>
              </div>
            </div>

            <div class="nt-scenes">
              {#if selectedEpisode.scenes.length === 0}
                <div class="nt-empty">場面がありません。「＋ 場面」で追加してください。</div>
              {:else}
                {#each selectedEpisode.scenes as scene, idx (scene.id)}
                  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
                  <div
                    class="nt-scene-card"
                    class:editing={sceneEditId === scene.id}
                    class:dragging={sceneDs.dragIdx === idx}
                    class:drag-over={sceneDs.dragOverIdx === idx}
                    draggable="true"
                    data-drag-idx={idx}
                    ondragstart={() => sceneDs.start(idx)}
                    ondragover={(e) => sceneDs.over(e, idx)}
                    ondrop={() => dragScene(selectedEpisode!.id, idx)}
                    ondragend={() => sceneDs.end()}
                    ontouchstart={() => sceneDs.touchstart(idx)}
                    ontouchmove={(e) => sceneDs.touchmove(e)}
                    ontouchend={() => { const to = sceneDs.dragOverIdx; if (to !== null) dragScene(selectedEpisode!.id, to); else sceneDs.end() }}
                    onclick={() => sceneEditId = sceneEditId === scene.id ? null : scene.id}
                  >
                    <!-- Scene header row -->
                    <div class="nt-scene-top">
                      <span class="drag-handle-sm scene-drag">⠿</span>
                      <div class="nt-role-btns" onclick={(e) => e.stopPropagation()}>
                        {#each ROLES as role}
                          <button
                            class="nt-role-badge"
                            class:active={scene.role === role}
                            style={scene.role === role ? `background:${ROLE_COLORS[role]};color:#fff;border-color:${ROLE_COLORS[role]}` : ''}
                            onclick={() => updateScene(selectedEpisode!.id, scene.id, { role })}
                          >{role}</button>
                        {/each}
                      </div>
                      <div class="nt-scene-acts" onclick={(e) => e.stopPropagation()}>
                        <button class="iBtn del" onclick={() => deleteScene(selectedEpisode!.id, scene.id)}>🗑</button>
                      </div>
                    </div>

                    {#if sceneEditId === scene.id}
                      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
                      <div onclick={(e) => e.stopPropagation()} style="display:contents">
                      <textarea
                        class="fta nt-scene-memo"
                        value={scene.memo}
                        oninput={(e) => updateScene(selectedEpisode!.id, scene.id, { memo: (e.target as HTMLTextAreaElement).value })}
                        placeholder="内容メモ"
                      ></textarea>
                      <div class="nt-dlg-toggle">
                        <button
                          class="nt-dlg-btn"
                          onclick={() => updateScene(selectedEpisode!.id, scene.id, { dialogueOpen: !scene.dialogueOpen })}
                        >{scene.dialogueOpen ? '▾' : '▸'} セリフメモ</button>
                      </div>
                      {#if scene.dialogueOpen}
                        <textarea
                          class="fta nt-scene-dlg"
                          value={scene.dialogue}
                          oninput={(e) => updateScene(selectedEpisode!.id, scene.id, { dialogue: (e.target as HTMLTextAreaElement).value })}
                          placeholder="セリフ・台詞メモ"
                        ></textarea>
                      {/if}
                      </div>
                    {:else}
                      {#if scene.memo}
                        <div class="nt-scene-preview">{scene.memo}</div>
                      {:else}
                        <div class="nt-scene-empty">（内容メモなし）</div>
                      {/if}
                      {#if scene.dialogue}
                        <div class="nt-dlg-preview">💬 {scene.dialogue}</div>
                      {/if}
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          {:else}
            <div class="nt-empty">左から話を選んでください</div>
          {/if}
        </div>
      </div>

    <!-- ============ 章サブタブ ============ -->
    {:else if subTab === 'chapter'}
      <!-- Structure tab bar -->
      <div class="nt-structure-bar">
        {#each STRUCTURE_TABS as stab}
          <button
            class="nt-str-tab"
            class:active={structureKey === stab.key}
            onclick={() => switchStructure(stab.key)}
          >{stab.label}</button>
        {/each}
      </div>
      <div class="nt-body">
        <!-- Left: chapter list -->
        <div class="nt-left">
          <div class="nt-left-toolbar">
            <span class="nt-left-title">章リスト</span>
            <button class="iBtn" onclick={addChapter} aria-label="追加">＋</button>
          </div>
          <div class="nt-list">
            {#if chapters.length === 0}
              <div class="nt-empty-hint">章を追加してください</div>
            {:else}
              {#each chapters as ch, idx (ch.id)}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="nt-list-drag-row"
                  class:drag-over={chDs.dragOverIdx === idx}
                  class:dragging={chDs.dragIdx === idx}
                  draggable="true"
                  data-drag-idx={idx}
                  ondragstart={() => chDs.start(idx)}
                  ondragover={(e) => chDs.over(e, idx)}
                  ondrop={() => dragChapter(idx)}
                  ondragend={() => chDs.end()}
                  ontouchstart={() => chDs.touchstart(idx)}
                  ontouchmove={(e) => chDs.touchmove(e)}
                  ontouchend={() => { const to = chDs.dragOverIdx; if (to !== null) dragChapter(to); else chDs.end() }}
                >
                  <span class="drag-handle-sm">⠿</span>
                  <button
                    class="nt-list-item"
                    class:active={selectedChapterId === ch.id}
                    onclick={() => selectedChapterId = ch.id}
                  >
                    <span class="nt-ep-num">{idx + 1}章</span>
                    <span class="nt-ep-title">{ch.title || '（無題）'}</span>
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Right: chapter detail -->
        <div class="nt-right">
          <div class="nt-ch-toolbar">
            <UndoRedoButtons canUndo={chapterHist.canUndo} canRedo={chapterHist.canRedo} onUndo={chapterUndo} onRedo={chapterRedo} />
          </div>
          {#if selectedChapter}
            <div class="nt-right-header">
              <div class="nt-ep-fields">
                <input
                  class="fi"
                  value={selectedChapter.title}
                  oninput={(e) => updateChapter(selectedChapter!.id, { title: (e.target as HTMLInputElement).value })}
                  placeholder="章タイトル"
                />
                <input
                  class="fi"
                  value={selectedChapter.theme}
                  oninput={(e) => updateChapter(selectedChapter!.id, { theme: (e.target as HTMLInputElement).value })}
                  placeholder="テーマ・キーワード"
                />
                <div class="nt-state-row">
                  <input
                    class="fi"
                    value={selectedChapter.stateStart}
                    oninput={(e) => updateChapter(selectedChapter!.id, { stateStart: (e.target as HTMLInputElement).value })}
                    placeholder="始まりの状態"
                  />
                  <span class="nt-arrow">→</span>
                  <input
                    class="fi"
                    value={selectedChapter.stateEnd}
                    oninput={(e) => updateChapter(selectedChapter!.id, { stateEnd: (e.target as HTMLInputElement).value })}
                    placeholder="終わりの状態"
                  />
                </div>
              </div>
              <div class="nt-right-acts">
                <button class="btn btn-primary btn-sm" onclick={() => addBeat(selectedChapter!.id)}>＋ ビート</button>
                <div class="nt-tmpl-wrap">
                  <button class="btn btn-ghost btn-sm" onclick={() => showTmplMenu = !showTmplMenu}>テンプレート ▾</button>
                  {#if showTmplMenu}
                    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
                    <div class="nt-tmpl-bg" onclick={() => showTmplMenu = false}></div>
                    <div class="nt-tmpl-menu">
                      {#each Object.entries(CHAPTER_TEMPLATES) as [key, tmpl]}
                        <button class="nt-tmpl-item" onclick={() => applyTemplate(key)}>{tmpl.label}</button>
                      {/each}
                    </div>
                  {/if}
                </div>
                <button class="iBtn del" onclick={() => deleteChapter(selectedChapter!.id)} aria-label="章を削除">🗑</button>
              </div>
            </div>

            <div class="nt-scenes">
              {#if selectedChapter.beats.length === 0}
                <div class="nt-empty">ビートがありません。「＋ ビート」またはテンプレートから追加できます。</div>
              {:else}
                {#each selectedChapter.beats as beat, idx (beat.id)}
                  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
                  <div
                    class="nt-scene-card"
                    class:editing={beatEditId === beat.id}
                    class:dragging={beatDs.dragIdx === idx}
                    class:drag-over={beatDs.dragOverIdx === idx}
                    draggable="true"
                    data-drag-idx={idx}
                    ondragstart={() => beatDs.start(idx)}
                    ondragover={(e) => beatDs.over(e, idx)}
                    ondrop={() => dragBeat(selectedChapter!.id, idx)}
                    ondragend={() => beatDs.end()}
                    ontouchstart={() => beatDs.touchstart(idx)}
                    ontouchmove={(e) => beatDs.touchmove(e)}
                    ontouchend={() => { const to = beatDs.dragOverIdx; if (to !== null) dragBeat(selectedChapter!.id, to); else beatDs.end() }}
                    onclick={() => beatEditId = beatEditId === beat.id ? null : beat.id}
                  >
                    <div class="nt-scene-top">
                      <span class="drag-handle-sm scene-drag">⠿</span>
                      <div class="nt-beat-labels">
                        {#if beat.stage}<span class="pb-stage-badge">{beat.stage}</span>{/if}
                        <span class="nt-beat-title">{beat.title || '（タイトル未設定）'}</span>
                      </div>
                      <div class="nt-scene-acts" onclick={(e) => e.stopPropagation()}>
                        <button class="iBtn del" onclick={() => deleteBeat(selectedChapter!.id, beat.id)}>🗑</button>
                      </div>
                    </div>

                    {#if beatEditId === beat.id}
                      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
                      <div onclick={(e) => e.stopPropagation()} style="display:contents">
                      <input
                        class="fi"
                        value={beat.stage}
                        oninput={(e) => updateBeat(selectedChapter!.id, beat.id, { stage: (e.target as HTMLInputElement).value })}
                        placeholder="幕・段階"
                      />
                      <input
                        class="fi"
                        value={beat.title}
                        oninput={(e) => updateBeat(selectedChapter!.id, beat.id, { title: (e.target as HTMLInputElement).value })}
                        placeholder="ビートタイトル"
                      />
                      <textarea
                        class="fta nt-scene-memo"
                        value={beat.memo}
                        oninput={(e) => updateBeat(selectedChapter!.id, beat.id, { memo: (e.target as HTMLTextAreaElement).value })}
                        placeholder="メモ・詳細"
                      ></textarea>
                      </div>
                    {:else}
                      {#if beat.memo}
                        <div class="nt-scene-preview">{beat.memo}</div>
                      {:else}
                        <div class="nt-scene-empty">（メモなし）</div>
                      {/if}
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          {:else}
            <div class="nt-ch-empty">
              <div class="nt-ch-empty-icon">📖</div>
              <div class="nt-ch-empty-msg">章がまだありません</div>
              <div class="nt-ch-empty-actions">
                <button class="btn btn-primary btn-sm" onclick={addChapter}>＋ 章を追加</button>
                {#if structureHasTemplate}
                  <button class="btn btn-ghost btn-sm" onclick={() => applyTemplateNewChapter(structureKey)}>
                    {CHAPTER_TEMPLATES[structureKey].label}で始める
                  </button>
                {:else}
                  <button class="btn btn-ghost btn-sm" onclick={() => applyTemplateNewChapter('three_act')}>三幕構成で始める</button>
                  <button class="btn btn-ghost btn-sm" onclick={() => applyTemplateNewChapter('heros_journey')}>ヒーローズジャーニーで始める</button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    <!-- ============ アイデアサブタブ ============ -->
    {:else if subTab === 'idea'}
      <div class="nt-idea-body">
        <div class="nt-idea-toolbar">
          <span class="nt-idea-hint">「書きたいシーン」タグのついたアイデアが表示されます</span>
          <button class="btn btn-primary btn-sm" onclick={() => { ideaAdding = true; newIdeaTitle = ''; newIdeaContent = ''; newIdeaTags = SCENE_TAG }}>＋ 追加</button>
        </div>

        {#if ideaAdding}
          <div class="nt-idea-form">
            <input
              class="fi"
              bind:value={newIdeaTitle}
              placeholder="タイトル（任意）"
              autofocus
            />
            <textarea
              class="fta nt-idea-ta"
              bind:value={newIdeaContent}
              placeholder="内容"
            ></textarea>
            <input
              class="fi nt-idea-tags-input"
              bind:value={newIdeaTags}
              placeholder="タグ（カンマ区切り）"
            />
            <div class="nt-idea-form-acts">
              <button class="btn btn-primary btn-sm" onclick={addSceneIdea}>保存</button>
              <button class="btn btn-ghost btn-sm" onclick={() => ideaAdding = false}>キャンセル</button>
            </div>
          </div>
        {/if}

        {#if sceneIdeas.length === 0 && !ideaAdding}
          <div class="nt-empty">「書きたいシーン」タグのアイデアがありません。<br>アイデアタブでタグを付けるか、＋ 追加で作成してください。</div>
        {:else}
          <div class="nt-idea-list">
            {#each sceneIdeas as idea (idea.id)}
              <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
              <div class="nt-idea-card" class:editing={ideaEditId === idea.id} onclick={() => ideaEditId !== idea.id && startIdeaEdit(idea)}>
                {#if ideaEditId === idea.id}
                  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
                  <div onclick={(e) => e.stopPropagation()} style="display:contents">
                  <input
                    class="fi nt-idea-title-edit"
                    bind:value={ideaEditTitle}
                    placeholder="タイトル"
                  />
                  <textarea
                    class="fta nt-idea-ta"
                    bind:value={ideaEditContent}
                    placeholder="内容"
                  ></textarea>
                  <input
                    class="fi nt-idea-tags-input"
                    bind:value={ideaEditTags}
                    placeholder="タグ（カンマ区切り）"
                  />
                  <div class="nt-idea-form-acts">
                    <button class="btn btn-primary btn-sm" onclick={saveIdeaEdit}>保存</button>
                    <button class="btn btn-ghost btn-sm" onclick={() => ideaEditId = null}>キャンセル</button>
                  </div>
                  </div>
                {:else}
                  <div class="nt-idea-card-top">
                    {#if idea.title}<div class="nt-idea-title">{idea.title}</div>{/if}
                    <div class="nt-scene-acts" onclick={(e) => e.stopPropagation()}>
                      <button class="iBtn del" onclick={() => ideaStore.delete(idea.id)}>🗑</button>
                    </div>
                  </div>
                  {#if idea.content}
                    <div class="nt-idea-content">{idea.content}</div>
                  {/if}
                  <div class="nt-idea-tags">
                    {#each idea.tags as tag}
                      <span class="nt-tag-badge">{tag}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .nt-overlay {
    height: 100%; display: flex; flex-direction: column; overflow: hidden;
  }

  /* Header */
  .nt-header {
    display: flex; align-items: center; gap: 12px;
    padding: 0 20px;
    height: 52px; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .nt-header-title {
    font-size: 15px; font-weight: 700; color: var(--text); flex-shrink: 0;
  }
  .nt-subtabs { display: flex; gap: 4px; flex: 1 }
  .nt-stab {
    padding: 5px 16px; border-radius: 20px; border: 1px solid var(--border);
    background: none; cursor: pointer; font-size: 13px; color: var(--muted);
    font-family: inherit; transition: .1s; flex-shrink: 0; white-space: nowrap;
  }
  .nt-stab:hover { color: var(--text); background: var(--surface2) }
  .nt-stab.active { background: var(--accent); color: #fff; border-color: var(--accent) }

  /* Structure tab bar */
  .nt-structure-bar {
    display: flex; gap: 0; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    padding: 0 16px;
    overflow-x: auto;
  }
  .nt-str-tab {
    padding: 8px 16px; border: none; border-bottom: 2px solid transparent;
    background: none; cursor: pointer; font-size: 12px; font-weight: 600;
    color: var(--muted); font-family: inherit; transition: .1s;
    white-space: nowrap; flex-shrink: 0;
  }
  .nt-str-tab:hover { color: var(--text) }
  .nt-str-tab.active { color: var(--accent); border-bottom-color: var(--accent) }

  /* Body layout */
  .nt-body {
    flex: 1; display: flex; overflow: hidden; min-height: 0;
  }

  /* Left panel */
  .nt-left {
    width: 200px; min-width: 160px; flex-shrink: 0;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    background: var(--surface);
  }
  .nt-left-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px 8px;
    border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .nt-left-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--muted) }
  .nt-list { flex: 1; overflow-y: auto; padding: 6px 0 }
  .nt-list-drag-row { display: flex; align-items: center; cursor: grab; transition: opacity .12s }
  .nt-list-drag-row.dragging { opacity: 0.35; cursor: grabbing }
  .nt-list-drag-row.drag-over { background: color-mix(in srgb, var(--accent) 10%, transparent); border-radius: 6px }
  .drag-handle-sm { color: var(--muted); font-size: 12px; padding: 0 4px 0 8px; flex-shrink: 0; cursor: grab; user-select: none }
  .scene-drag { padding: 0 6px }
  .nt-list-item {
    flex: 1; display: flex; align-items: center; gap: 6px;
    padding: 8px 12px 8px 4px; background: none; border: none; cursor: pointer;
    font-family: inherit; font-size: 13px; color: var(--text);
    text-align: left; transition: .1s;
  }
  .nt-list-item:hover { background: var(--surface2) }
  .nt-list-item.active { background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent) }
  .nt-group-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0 }
  .nt-ep-num { font-size: 11px; color: var(--muted); flex-shrink: 0 }
  .nt-ep-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  .nt-empty-hint { padding: 16px 12px; font-size: 12px; color: var(--muted) }

  /* Right panel */
  .nt-right {
    flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  }
  .nt-right-header {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .nt-ep-fields { flex: 1; display: flex; flex-direction: column; gap: 6px }
  .nt-ep-num-input { width: 80px }
  .nt-ep-title-input { font-size: 15px; font-weight: 700 }
  .nt-ep-group-select { font-size: 12px }
  .nt-ch-tag {
    font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; flex-shrink: 0;
    background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent);
  }
  .nt-color-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center }
  .nt-color-btn {
    width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; transition: .1s; flex-shrink: 0;
  }
  .nt-color-btn.selected { border-color: var(--text); transform: scale(1.2) }
  .nt-color-none {
    background: var(--surface2) !important;
    border-color: var(--border); font-size: 10px; color: var(--muted);
    display: flex; align-items: center; justify-content: center;
  }
  .nt-right-acts { display: flex; align-items: center; gap: 8px; flex-shrink: 0 }

  /* Scenes */
  .nt-scenes { flex: 1; overflow-y: auto; padding: 12px 20px 80px }
  .nt-empty { padding: 40px 0; text-align: center; color: var(--muted); font-size: 13px }

  .nt-scene-card {
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface); margin-bottom: 8px;
    overflow: hidden; transition: border-color .15s, opacity .12s; cursor: grab;
  }
  .nt-scene-card:hover { border-color: var(--accent) }
  .nt-scene-card.editing { cursor: default; border-color: var(--accent) }
  .nt-scene-card.dragging { opacity: 0.35; cursor: grabbing }
  .nt-scene-card.drag-over { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent) }
  .nt-scene-top {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; border-bottom: 1px solid var(--border);
  }
  .nt-role-btns { display: flex; gap: 4px; flex-wrap: wrap; flex: 1 }
  .nt-role-badge {
    padding: 2px 10px; border-radius: 20px; border: 1px solid var(--border);
    background: none; cursor: pointer; font-size: 12px; font-weight: 700;
    color: var(--muted); font-family: inherit; transition: .1s;
  }
  .nt-role-badge:hover { color: var(--text) }
  .nt-role-badge.active { font-weight: 800 }
  .nt-scene-acts { display: flex; align-items: center; gap: 2px }
  .nt-move-btn {
    background: none; border: none; cursor: pointer; color: var(--muted);
    font-size: 12px; padding: 3px 5px; border-radius: 4px;
  }
  .nt-move-btn:hover { color: var(--text); background: var(--surface2) }
  .nt-move-btn:disabled { opacity: .3; cursor: default }

  .nt-scene-memo { width: 100%; min-height: 80px; resize: vertical; font-size: 13px; line-height: 1.7; margin: 0; border-radius: 0; border: none; border-bottom: 1px solid var(--border) }
  .nt-scene-preview { padding: 8px 12px; font-size: 13px; color: var(--text); white-space: pre-wrap; line-height: 1.6 }
  .nt-scene-empty { padding: 8px 12px; font-size: 12px; color: var(--muted) }
  .nt-dlg-toggle { padding: 4px 10px }
  .nt-dlg-btn { background: none; border: none; cursor: pointer; font-size: 11px; color: var(--muted); font-family: inherit; padding: 2px 4px }
  .nt-dlg-btn:hover { color: var(--accent) }
  .nt-scene-dlg { width: 100%; min-height: 60px; resize: vertical; font-size: 12px; line-height: 1.6; border-radius: 0; border: none }
  .nt-dlg-preview { padding: 4px 12px 8px; font-size: 12px; color: var(--accent); white-space: pre-wrap }

  /* Chapter beats */
  .nt-beat-labels { display: flex; align-items: center; gap: 8px; flex: 1 }
  .nt-beat-title { font-size: 13px; font-weight: 600; color: var(--text) }
  .pb-stage-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: var(--accent); color: #fff }

  /* Chapter toolbar */
  .nt-ch-toolbar { padding: 8px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; gap: 8px }

  /* Chapter empty state */
  .nt-ch-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--muted) }
  .nt-ch-empty-icon { font-size: 36px }
  .nt-ch-empty-msg { font-size: 14px; font-weight: 600; color: var(--text) }
  .nt-ch-empty-actions { display: flex; flex-direction: column; align-items: center; gap: 8px }

  /* State row */
  .nt-state-row { display: flex; align-items: center; gap: 6px }
  .nt-state-row .fi { flex: 1 }
  .nt-arrow { font-size: 14px; color: var(--muted); flex-shrink: 0 }

  /* Template menu */
  .nt-tmpl-wrap { position: relative }
  .nt-tmpl-bg { position: fixed; inset: 0; z-index: 10 }
  .nt-tmpl-menu {
    position: absolute; top: calc(100% + 4px); left: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
    z-index: 20; min-width: 240px; overflow: hidden;
  }
  .nt-tmpl-item {
    display: block; width: 100%; text-align: left; padding: 10px 14px;
    background: none; border: none; cursor: pointer;
    font-size: 13px; color: var(--text); font-family: inherit;
  }
  .nt-tmpl-item:hover { background: var(--surface2) }

  /* Idea subtab */
  .nt-idea-body {
    flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;
  }
  .nt-idea-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .nt-idea-hint { font-size: 12px; color: var(--muted) }
  .nt-idea-list {
    flex: 1; overflow-y: scroll; padding: 12px 20px 80px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .nt-idea-form {
    padding: 12px 20px; border-bottom: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
    background: color-mix(in srgb, var(--accent) 5%, transparent);
  }
  .nt-idea-form-acts { display: flex; gap: 8px }
  .nt-idea-card {
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface); overflow: hidden; transition: border-color .15s;
    padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; cursor: pointer;
  }
  .nt-idea-card:hover { border-color: var(--accent) }
  .nt-idea-card.editing { border-color: var(--accent); padding: 12px 14px; gap: 8px; cursor: default }
  .nt-idea-card-top { display: flex; align-items: flex-start; gap: 8px }
  .nt-idea-title { flex: 1; font-size: 14px; font-weight: 700; color: var(--text) }
  .nt-idea-title-edit { font-size: 14px; font-weight: 700 }
  .nt-idea-content { font-size: 13px; color: var(--text); white-space: pre-wrap; line-height: 1.6 }
  .nt-idea-ta { width: 100%; min-height: 100px; resize: vertical; font-size: 13px; line-height: 1.7 }
  .nt-idea-tags { display: flex; flex-wrap: wrap; gap: 4px }
  .nt-idea-tags-input { font-size: 12px }
  .nt-tag-badge {
    font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px;
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    color: var(--accent);
  }

  /* Shared */
  .iBtn { background: none; border: none; cursor: pointer; padding: 6px; font-size: 16px; border-radius: 6px; color: var(--muted); line-height: 1 }
  .iBtn:hover { color: var(--text); background: var(--surface2) }
  .iBtn.del:hover { color: #e05555 }

  @media (max-width: 640px) {
    .nt-left { width: 120px; min-width: 100px }
    .nt-right-header { flex-direction: column }
    .nt-structure-bar { padding: 0 8px }
    .nt-str-tab { padding: 8px 10px; font-size: 11px }
  }
</style>
