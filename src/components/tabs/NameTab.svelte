<script lang="ts">
  import { nanoid } from 'nanoid'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'

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

  interface NameData {
    version: 1
    episodes: Episode[]
    chapters: Chapter[]
  }

  // ---- Templates ----
  const CHAPTER_TEMPLATES = {
    three_act: {
      label: '三幕構成（8ビート）',
      beats: [
        { stage: '第一幕', title: '日常世界',      hint: '主人公の普段の生活・性格・欲求を描く。' },
        { stage: '第一幕', title: 'きっかけ',      hint: '主人公の日常を揺るがす出来事が起きる。' },
        { stage: '第一幕', title: '決意',          hint: '主人公が「行動する」と決める瞬間。' },
        { stage: '第二幕', title: '新世界へ',      hint: '主人公が未知の環境・状況に飛び込む。' },
        { stage: '第二幕', title: '中間転換点',    hint: '物語の折り返し地点。' },
        { stage: '第二幕', title: '最大の危機',    hint: '主人公がどん底に落ちる瞬間。' },
        { stage: '第三幕', title: 'クライマックス', hint: '物語の頂点。' },
        { stage: '第三幕', title: '解決',          hint: '戦いの後の世界を描く。' },
      ],
    },
    heros_journey: {
      label: 'ヒーローズジャーニー（12段階）',
      beats: [
        { stage: '出発',           title: '日常世界',       hint: '冒険前の主人公の普通の生活。' },
        { stage: '出発',           title: '冒険への召喚',   hint: '主人公に使命・問題・誘いが訪れる。' },
        { stage: '出発',           title: '召喚の拒否',     hint: '主人公が恐れや義務感から冒険を断る。' },
        { stage: '出発',           title: '師との出会い',   hint: '主人公を導く存在が現れ、旅への準備が整う。' },
        { stage: '出発',           title: '第一関門突破',   hint: '日常世界を離れ、未知の領域に踏み込む。' },
        { stage: 'イニシエーション', title: 'テスト・仲間・敵', hint: '新しい世界でのルールを学ぶ。' },
        { stage: 'イニシエーション', title: '最深部への接近', hint: '最大の試練が待つ場所へ近づく。' },
        { stage: 'イニシエーション', title: '最大の試練',   hint: '主人公が「死」に最も近づく瞬間。' },
        { stage: 'イニシエーション', title: '報酬',         hint: '試練を乗り越えた主人公が宝を手に入れる。' },
        { stage: '帰還',           title: '帰路',           hint: '宝を持って日常世界に戻ろうとする。' },
        { stage: '帰還',           title: '復活',           hint: '最後の浄化・試練。' },
        { stage: '帰還',           title: '宝を持っての帰還', hint: '変容した主人公が日常世界に戻る。' },
      ],
    },
  } as const

  // ---- State ----
  let subTab = $state<'episode' | 'chapter'>('episode')

  // Episode sub-tab
  let episodes = $state<Episode[]>([])
  let selectedEpisodeId = $state<string | null>(null)
  let sceneEditId = $state<string | null>(null)
  let showGroupColors = $state(false)

  // Chapter sub-tab
  let chapters = $state<Chapter[]>([])
  let selectedChapterId = $state<string | null>(null)
  let showTmplMenu = $state(false)
  let beatEditId = $state<string | null>(null)

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
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed: NameData = JSON.parse(raw)
        episodes = parsed.episodes ?? []
        chapters = parsed.chapters ?? []
      } else {
        episodes = []
        chapters = []
      }
    } catch {
      episodes = []
      chapters = []
    }
    selectedEpisodeId = episodes[0]?.id ?? null
    selectedChapterId = chapters[0]?.id ?? null
    loaded = true
  })

  function save() {
    const key = storageKey
    if (!key) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const data: NameData = { version: 1, episodes, chapters }
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
      groupName: '', groupColor: '', scenes: [],
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

  function moveScene(epId: string, idx: number, dir: -1 | 1) {
    const ep = episodes.find(e => e.id === epId)
    if (!ep) return
    const arr = [...ep.scenes]
    const to = idx + dir
    if (to < 0 || to >= arr.length) return
    ;[arr[idx], arr[to]] = [arr[to], arr[idx]]
    episodes = episodes.map(e => e.id === epId ? { ...e, scenes: arr } : e)
    save()
  }

  // ---- Chapter helpers ----
  const selectedChapter = $derived(
    selectedChapterId ? chapters.find(c => c.id === selectedChapterId) ?? null : null
  )

  function addChapter() {
    const ch: Chapter = {
      id: nanoid(), title: '', theme: '', stateStart: '', stateEnd: '', beats: [],
    }
    chapters = [...chapters, ch]
    selectedChapterId = ch.id
    save()
  }

  function deleteChapter(id: string) {
    chapters = chapters.filter(c => c.id !== id)
    if (selectedChapterId === id) selectedChapterId = chapters[0]?.id ?? null
    save()
  }

  function updateChapter(id: string, patch: Partial<Omit<Chapter, 'beats'>>) {
    chapters = chapters.map(c => c.id === id ? { ...c, ...patch } : c)
    save()
  }

  function applyTemplate(key: keyof typeof CHAPTER_TEMPLATES) {
    showTmplMenu = false
    if (!selectedChapterId) return
    const ch = chapters.find(c => c.id === selectedChapterId)
    if (!ch) return
    if (ch.beats.length > 0 && !confirm('既存のビートをテンプレートで上書きしますか？')) return
    const newBeats: ChapterBeat[] = CHAPTER_TEMPLATES[key].beats.map(b => ({
      id: nanoid(), stage: b.stage, title: b.title, memo: b.hint,
    }))
    chapters = chapters.map(c => c.id === selectedChapterId ? { ...c, beats: newBeats } : c)
    save()
  }

  function addBeat(chId: string) {
    const beat: ChapterBeat = { id: nanoid(), stage: '', title: '', memo: '' }
    chapters = chapters.map(c => c.id === chId ? { ...c, beats: [...c.beats, beat] } : c)
    beatEditId = beat.id
    save()
  }

  function deleteBeat(chId: string, beatId: string) {
    chapters = chapters.map(c => c.id === chId
      ? { ...c, beats: c.beats.filter(b => b.id !== beatId) }
      : c
    )
    if (beatEditId === beatId) beatEditId = null
    save()
  }

  function updateBeat(chId: string, beatId: string, patch: Partial<ChapterBeat>) {
    chapters = chapters.map(c => c.id === chId
      ? { ...c, beats: c.beats.map(b => b.id === beatId ? { ...b, ...patch } : b) }
      : c
    )
    save()
  }

  function moveBeat(chId: string, idx: number, dir: -1 | 1) {
    const ch = chapters.find(c => c.id === chId)
    if (!ch) return
    const arr = [...ch.beats]
    const to = idx + dir
    if (to < 0 || to >= arr.length) return
    ;[arr[idx], arr[to]] = [arr[to], arr[idx]]
    chapters = chapters.map(c => c.id === chId ? { ...c, beats: arr } : c)
    save()
  }
</script>

{#if loaded && projectStore.currentProjectId}
  <!-- Full-screen overlay -->
  <div class="nt-overlay">
    <!-- Header -->
    <div class="nt-header">
      <span class="nt-header-title">📝 ネーム</span>
      <div class="nt-subtabs">
        <button
          class="nt-stab"
          class:active={subTab === 'episode'}
          onclick={() => subTab = 'episode'}
        >一話</button>
        <button
          class="nt-stab"
          class:active={subTab === 'chapter'}
          onclick={() => subTab = 'chapter'}
        >章</button>
      </div>
      <button class="nt-close iBtn" onclick={() => appStore.setTab('plot')} aria-label="閉じる">✕</button>
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
              {#each episodes as ep (ep.id)}
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
                </button>
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
                <input
                  class="fi nt-ep-group-input"
                  value={selectedEpisode.groupName}
                  oninput={(e) => updateEpisode(selectedEpisode!.id, { groupName: (e.target as HTMLInputElement).value })}
                  placeholder="章グループ名（任意）"
                />
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
                  <div class="nt-scene-card" class:editing={sceneEditId === scene.id}>
                    <!-- Scene header row -->
                    <div class="nt-scene-top">
                      <div class="nt-role-btns">
                        {#each ROLES as role}
                          <button
                            class="nt-role-badge"
                            class:active={scene.role === role}
                            style={scene.role === role ? `background:${ROLE_COLORS[role]};color:#fff;border-color:${ROLE_COLORS[role]}` : ''}
                            onclick={() => updateScene(selectedEpisode!.id, scene.id, { role })}
                          >{role}</button>
                        {/each}
                      </div>
                      <div class="nt-scene-acts">
                        <button class="nt-move-btn" onclick={() => moveScene(selectedEpisode!.id, idx, -1)} disabled={idx === 0}>↑</button>
                        <button class="nt-move-btn" onclick={() => moveScene(selectedEpisode!.id, idx, 1)} disabled={idx === selectedEpisode.scenes.length - 1}>↓</button>
                        <button class="iBtn" onclick={() => sceneEditId = sceneEditId === scene.id ? null : scene.id}>✎</button>
                        <button class="iBtn del" onclick={() => deleteScene(selectedEpisode!.id, scene.id)}>🗑</button>
                      </div>
                    </div>

                    {#if sceneEditId === scene.id}
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
    {:else}
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
                <button
                  class="nt-list-item"
                  class:active={selectedChapterId === ch.id}
                  onclick={() => selectedChapterId = ch.id}
                >
                  <span class="nt-ep-num">{idx + 1}章</span>
                  <span class="nt-ep-title">{ch.title || '（無題）'}</span>
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Right: chapter detail -->
        <div class="nt-right">
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
                        <button class="nt-tmpl-item" onclick={() => applyTemplate(key as keyof typeof CHAPTER_TEMPLATES)}>{tmpl.label}</button>
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
                  <div class="nt-scene-card" class:editing={beatEditId === beat.id}>
                    <div class="nt-scene-top">
                      <div class="nt-beat-labels">
                        {#if beat.stage}<span class="pb-stage-badge">{beat.stage}</span>{/if}
                        <span class="nt-beat-title">{beat.title || '（タイトル未設定）'}</span>
                      </div>
                      <div class="nt-scene-acts">
                        <button class="nt-move-btn" onclick={() => moveBeat(selectedChapter!.id, idx, -1)} disabled={idx === 0}>↑</button>
                        <button class="nt-move-btn" onclick={() => moveBeat(selectedChapter!.id, idx, 1)} disabled={idx === selectedChapter.beats.length - 1}>↓</button>
                        <button class="iBtn" onclick={() => beatEditId = beatEditId === beat.id ? null : beat.id}>✎</button>
                        <button class="iBtn del" onclick={() => deleteBeat(selectedChapter!.id, beat.id)}>🗑</button>
                      </div>
                    </div>

                    {#if beatEditId === beat.id}
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
            <div class="nt-empty">左から章を選んでください</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .nt-overlay {
    position: fixed; inset: 0; z-index: 150;
    background: var(--bg);
    display: flex; flex-direction: column;
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
    font-family: inherit; transition: .1s;
  }
  .nt-stab:hover { color: var(--text); background: var(--surface2) }
  .nt-stab.active { background: var(--accent); color: #fff; border-color: var(--accent) }
  .nt-close { font-size: 18px; flex-shrink: 0 }

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
  .nt-list-item {
    width: 100%; display: flex; align-items: center; gap: 6px;
    padding: 8px 12px; background: none; border: none; cursor: pointer;
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
  .nt-ep-group-input { font-size: 12px }
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
    overflow: hidden; transition: border-color .15s;
  }
  .nt-scene-card:hover { border-color: var(--accent) }
  .nt-scene-card.editing { border-color: var(--accent) }
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

  /* Shared */
  .iBtn { background: none; border: none; cursor: pointer; padding: 6px; font-size: 16px; border-radius: 6px; color: var(--muted); line-height: 1 }
  .iBtn:hover { color: var(--text); background: var(--surface2) }
  .iBtn.del:hover { color: #e05555 }

  @media (max-width: 640px) {
    .nt-left { width: 120px; min-width: 100px }
    .nt-right-header { flex-direction: column }
  }
</style>
