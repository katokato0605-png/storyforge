<script lang="ts">
  import { noteStore } from '../../lib/stores/noteStore.svelte'
  import { createHistory } from '../../lib/utils/history.svelte'
  import UndoRedoButtons from '../ui/UndoRedoButtons.svelte'
  import { nanoid } from 'nanoid'

  let { projectId }: { projectId: string } = $props()

  interface PlotBeat {
    id: string
    stage: string
    title: string
    description: string
    timelineEventId: string | null
  }

  interface PlotData {
    version: 1
    beats: PlotBeat[]
  }

  interface TimelineEvent {
    id: string
    label: string
    title: string
    note: string
    color: string
  }

  const TEMPLATES = {
    three_act: {
      label: '三幕構成（8ビート）',
      beats: [
        { stage: '第一幕', title: '日常世界',     hint: '主人公の普段の生活・性格・欲求を描く。読者がキャラに感情移入するための土台。' },
        { stage: '第一幕', title: 'きっかけ',     hint: '主人公の日常を揺るがす出来事が起きる。物語を動かすトリガー。' },
        { stage: '第一幕', title: '決意',         hint: '主人公が「行動する」と決める瞬間。ここで第一幕が終わり、物語が加速する。' },
        { stage: '第二幕', title: '新世界へ',     hint: '主人公が未知の環境・状況に飛び込む。新たなルール・人物・試練との出会い。' },
        { stage: '第二幕', title: '中間転換点',   hint: '物語の折り返し地点。主人公の目標や状況が大きく変化し、後半への転換が起きる。' },
        { stage: '第二幕', title: '最大の危機',   hint: '主人公がどん底に落ちる瞬間。失敗・喪失・絶望を描き、クライマックスへの期待を高める。' },
        { stage: '第三幕', title: 'クライマックス', hint: '物語の頂点。主人公が最大の障害に立ち向かい、内的変化を体現する決戦。' },
        { stage: '第三幕', title: '解決',         hint: '戦いの後の世界を描く。変化した主人公の新しい日常・余韻・テーマの着地点。' },
      ],
    },
    heros_journey: {
      label: 'ヒーローズジャーニー（12段階）',
      beats: [
        { stage: '出発', title: '日常世界',         hint: '冒険前の主人公の普通の生活。後のドラマとの対比を作る舞台設定。' },
        { stage: '出発', title: '冒険への召喚',     hint: '主人公に使命・問題・誘いが訪れる。物語が動き出す最初の呼びかけ。' },
        { stage: '出発', title: '召喚の拒否',       hint: '主人公が恐れや義務感から冒険を断る。内的葛藤を表すリアルな反応。' },
        { stage: '出発', title: '師との出会い',     hint: '主人公を導く存在（人物・知識・道具など）が現れ、旅への準備が整う。' },
        { stage: '出発', title: '第一関門突破',     hint: '日常世界を離れ、未知の領域に踏み込む。後戻りできない決断。' },
        { stage: 'イニシエーション', title: 'テスト・仲間・敵', hint: '新しい世界でのルールを学ぶ。味方と敵を見極め、力を試される連続的な試練。' },
        { stage: 'イニシエーション', title: '最深部への接近', hint: '最大の試練が待つ場所へ近づく。緊張感が最高潮になる準備段階。' },
        { stage: 'イニシエーション', title: '最大の試練',     hint: '主人公が「死」（肉体的・精神的）に最も近づく瞬間。ここを乗り越えることで真の成長が生まれる。' },
        { stage: 'イニシエーション', title: '報酬',           hint: '試練を乗り越えた主人公が宝（物・知識・愛など）を手に入れる。束の間の達成感。' },
        { stage: '帰還', title: '帰路',             hint: '宝を持って日常世界に戻ろうとするが、まだ追手や障害が残っている。' },
        { stage: '帰還', title: '復活',             hint: '最後の浄化・試練。主人公が完全に変容し、旧来の自分が「死に」新しい自分が生まれる。' },
        { stage: '帰還', title: '宝を持っての帰還', hint: '変容した主人公が日常世界に戻り、得たものを仲間や社会に還元する。物語の締めくくり。' },
      ],
    },
  } as const

  let beats = $state<PlotBeat[]>([])
  let timelineEvents = $state<TimelineEvent[]>([])
  let overlayId = $state<string | null>(null)
  let overlaySnapshot = $state<PlotBeat | null>(null)
  let loaded = $state(false)
  let showTemplateMenu = $state(false)
  let saveTimer: ReturnType<typeof setTimeout>

  const hist = createHistory<PlotBeat[]>()

  function undo() {
    const prev = hist.undo(beats.map(b => ({ ...b })))
    if (!prev) return
    beats = prev
    overlayId = null
    overlaySnapshot = null
    save(prev)
  }

  function redo() {
    const next = hist.redo(beats.map(b => ({ ...b })))
    if (!next) return
    beats = next
    overlayId = null
    overlaySnapshot = null
    save(next)
  }

  $effect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  })

  $effect(() => {
    const pid = projectId
    loaded = false
    hist.reset()
    let cancelled = false
    noteStore.load(pid).then(() => {
      if (cancelled) return
      try {
        const raw = noteStore.getContent('plot')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed?.version === 1 && Array.isArray(parsed.beats)) {
            beats = parsed.beats
          } else {
            beats = []
          }
        } else {
          beats = []
        }
      } catch {
        beats = []
      }
      try {
        const tlRaw = noteStore.getContent('timeline')
        if (tlRaw) {
          const parsed = JSON.parse(tlRaw)
          if (parsed?.version === 1 && Array.isArray(parsed.events)) {
            timelineEvents = parsed.events
          } else if (Array.isArray(parsed)) {
            timelineEvents = parsed
          } else {
            timelineEvents = []
          }
        } else {
          timelineEvents = []
        }
      } catch {
        timelineEvents = []
      }
      loaded = true
    })
    return () => { cancelled = true }
  })

  async function save(b: PlotBeat[]) {
    const data: PlotData = { version: 1, beats: b }
    await noteStore.save(projectId, 'plot', JSON.stringify(data))
  }

  function debouncedSave(b: PlotBeat[]) {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => save(b), 500)
  }

  function addBeat() {
    hist.push(beats.map(b => ({ ...b })))
    const beat: PlotBeat = { id: nanoid(), stage: '', title: '', description: '', timelineEventId: null }
    const next = [...beats, beat]
    beats = next
    overlaySnapshot = { ...beat }
    overlayId = beat.id
    save(next)
  }

  function openOverlay(beat: PlotBeat) {
    overlaySnapshot = { ...beat }
    overlayId = beat.id
  }

  function updateBeat(id: string, patch: Partial<PlotBeat>, debounce = false) {
    const next = beats.map(b => b.id === id ? { ...b, ...patch } : b)
    beats = next
    if (debounce) debouncedSave(next)
    else save(next)
  }

  function cancelEdit() {
    clearTimeout(saveTimer)
    if (overlaySnapshot && overlayId) {
      const restored = beats.map(b => b.id === overlayId ? overlaySnapshot! : b)
      beats = restored
      save(restored)
    }
    overlayId = null
    overlaySnapshot = null
  }

  function confirmEdit() {
    clearTimeout(saveTimer)
    if (overlaySnapshot && overlayId) {
      const pre = beats.map(b => b.id === overlayId ? overlaySnapshot! : b)
      hist.push(pre)
    }
    save(beats)
    overlayId = null
    overlaySnapshot = null
  }

  function deleteBeat(id: string) {
    hist.push(beats.map(b => ({ ...b })))
    const next = beats.filter(b => b.id !== id)
    beats = next
    overlayId = null
    overlaySnapshot = null
    save(next)
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    hist.push(beats.map(b => ({ ...b })))
    const arr = [...beats]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    beats = arr
    save(arr)
  }

  function moveDown(idx: number) {
    if (idx === beats.length - 1) return
    hist.push(beats.map(b => ({ ...b })))
    const arr = [...beats]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    beats = arr
    save(arr)
  }

  function applyTemplate(key: keyof typeof TEMPLATES) {
    showTemplateMenu = false
    if (beats.length > 0 && !confirm('既存のビートをテンプレートで上書きしますか？')) return
    hist.push(beats.map(b => ({ ...b })))
    const newBeats: PlotBeat[] = TEMPLATES[key].beats.map(b => ({
      id: nanoid(),
      stage: b.stage,
      title: b.title,
      description: (b as { hint?: string }).hint ?? '',
      timelineEventId: null,
    }))
    beats = newBeats
    overlayId = null
    overlaySnapshot = null
    save(newBeats)
  }

  function linkedEventLabel(eventId: string | null): string {
    if (!eventId) return ''
    const ev = timelineEvents.find(e => e.id === eventId)
    return ev ? (ev.title || ev.label || '（タイトル未設定）') : '（削除済み）'
  }

  const overlayBeat = $derived(overlayId ? beats.find(b => b.id === overlayId) ?? null : null)
</script>

{#if !loaded}
  <div class="pb-loading">読み込み中…</div>
{:else}
  <div class="pb-wrap">
    <div class="pb-toolbar">
      <UndoRedoButtons canUndo={hist.canUndo} canRedo={hist.canRedo} onUndo={undo} onRedo={redo} />
      <button class="btn btn-primary btn-sm" onclick={addBeat}>＋ ビートを追加</button>
      <div class="pb-tmpl-wrap">
        <button
          class="btn btn-ghost btn-sm"
          onclick={() => showTemplateMenu = !showTemplateMenu}
        >テンプレート ▾</button>
        {#if showTemplateMenu}
          <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
          <div class="pb-backdrop" onclick={() => showTemplateMenu = false}></div>
          <div class="pb-tmpl-menu">
            {#each Object.entries(TEMPLATES) as [key, tmpl]}
              <button
                class="pb-tmpl-item"
                onclick={() => applyTemplate(key as keyof typeof TEMPLATES)}
              >{tmpl.label}</button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    {#if beats.length === 0}
      <div class="pb-empty">
        <div class="pb-empty-icon">📋</div>
        <div class="pb-empty-msg">ビートがまだありません</div>
        <div class="pb-empty-sub">「＋ ビートを追加」またはテンプレートから始めましょう</div>
      </div>
    {:else}
      <div class="pb-list">
        {#each beats as beat, idx (beat.id)}
          <div class="pb-card">
            <button class="pb-view" onclick={() => openOverlay(beat)}>
              {#if beat.stage}<span class="pb-stage-badge">{beat.stage}</span>{/if}
              <div class="pb-title">{beat.title || '（タイトル未設定）'}</div>
              {#if beat.description}<div class="pb-desc">{beat.description}</div>{/if}
              {#if beat.timelineEventId}
                <div class="pb-linked-badge">🕐 {linkedEventLabel(beat.timelineEventId)}</div>
              {/if}
            </button>
            <div class="pb-move-acts">
              <button class="pb-move-btn" onclick={() => moveUp(idx)} disabled={idx === 0} aria-label="上へ">↑</button>
              <button class="pb-move-btn" onclick={() => moveDown(idx)} disabled={idx === beats.length - 1} aria-label="下へ">↓</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

{#if overlayId && overlayBeat}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fs-overlay" onclick={(e) => { if (e.target === e.currentTarget) cancelEdit() }}>
    <div class="fs-panel" role="dialog" aria-modal="true">
      <div class="fs-header">
        <span class="fs-header-title">{overlayBeat.title || '（タイトル未設定）'}</span>
        <button class="iBtn del" onclick={() => { const id = overlayId!; overlayId = null; overlaySnapshot = null; deleteBeat(id) }} aria-label="削除">🗑</button>
        <button class="iBtn" onclick={cancelEdit} aria-label="閉じる">✕</button>
      </div>
      <div class="fs-body">
        <input
          class="fi pb-input-stage"
          value={overlayBeat.stage}
          oninput={(e) => updateBeat(overlayId!, { stage: (e.target as HTMLInputElement).value }, true)}
          placeholder="幕・段階（例：第一幕）"
        />
        <input
          class="fi pb-input-title"
          value={overlayBeat.title}
          oninput={(e) => updateBeat(overlayId!, { title: (e.target as HTMLInputElement).value }, true)}
          placeholder="ビートのタイトル"
        />
        <textarea
          class="fta fs-textarea"
          value={overlayBeat.description}
          oninput={(e) => updateBeat(overlayId!, { description: (e.target as HTMLTextAreaElement).value }, true)}
          placeholder="あらすじ・詳細（任意）"
        ></textarea>
        <div class="pb-tl-row">
          <label class="pb-tl-label" for="tl-select-{overlayBeat.id}">タイムライン連携</label>
          <select
            id="tl-select-{overlayBeat.id}"
            class="fi pb-select"
            value={overlayBeat.timelineEventId ?? ''}
            onchange={(e) => updateBeat(overlayId!, { timelineEventId: (e.target as HTMLSelectElement).value || null })}
          >
            <option value="">（なし）</option>
            {#each timelineEvents as ev}
              <option value={ev.id}>{ev.label ? `${ev.label} — ` : ''}{ev.title || '（タイトル未設定）'}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="fs-footer">
        <button class="btn btn-ghost btn-sm" onclick={cancelEdit}>キャンセル</button>
        <button class="btn btn-primary btn-sm" onclick={confirmEdit}>完了</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .pb-loading { padding: 40px; text-align: center; color: var(--muted); font-size: 13px }

  .pb-wrap { padding: 16px 20px 80px; max-width: 640px; margin: 0 auto }

  .pb-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px }

  .pb-tmpl-wrap { position: relative }
  .pb-backdrop { position: fixed; inset: 0; z-index: 10 }
  .pb-tmpl-menu { position: absolute; top: calc(100% + 4px); left: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15); z-index: 20; min-width: 220px; overflow: hidden }
  .pb-tmpl-item { display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 13px; color: var(--text); font-family: inherit }
  .pb-tmpl-item:hover { background: var(--surface2) }

  .pb-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 20px; color: var(--muted) }
  .pb-empty-icon { font-size: 36px }
  .pb-empty-msg { font-size: 14px; font-weight: 600; color: var(--text) }
  .pb-empty-sub { font-size: 12px }

  .pb-list { display: flex; flex-direction: column; gap: 8px }

  .pb-card { border-radius: 10px; border: 1px solid var(--border); background: var(--surface); overflow: hidden; transition: border-color .15s; display: flex; align-items: flex-start }
  .pb-card:hover { border-color: var(--accent) }

  .pb-view { flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 12px 14px; cursor: pointer; background: none; border: none; text-align: left; font-family: inherit; color: inherit }
  .pb-stage-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: var(--accent); color: #fff; letter-spacing: .3px }
  .pb-title { font-size: 14px; font-weight: 600; color: var(--text) }
  .pb-desc { font-size: 12px; color: var(--muted); white-space: pre-wrap; line-height: 1.6 }
  .pb-linked-badge { font-size: 11px; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); padding: 2px 8px; border-radius: 20px; margin-top: 2px }

  .pb-move-acts { display: flex; flex-direction: column; gap: 2px; padding: 6px 4px; flex-shrink: 0 }
  .pb-move-btn { background: none; border: none; cursor: pointer; color: var(--muted); padding: 4px 6px; font-size: 12px; border-radius: 4px; min-width: 28px; min-height: 28px; display: inline-flex; align-items: center; justify-content: center }
  .pb-move-btn:hover { color: var(--text); background: var(--surface2) }
  .pb-move-btn:disabled { opacity: .3; cursor: default }

  /* Overlay */
  .fs-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 24px }
  .fs-panel { background: var(--surface); border-radius: 14px; width: 100%; max-width: 640px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,.3) }
  .fs-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .fs-header-title { flex: 1; font-size: 15px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  .fs-body { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 16px 20px; overflow-y: auto }
  .pb-input-stage { font-size: 12px }
  .pb-input-title { font-size: 16px; font-weight: 700 }
  .fs-textarea { flex: 1; resize: none; font-size: 14px; line-height: 1.8; min-height: 120px }
  .pb-tl-row { display: flex; flex-direction: column; gap: 4px }
  .pb-tl-label { font-size: 11px; color: var(--muted); font-weight: 600 }
  .pb-select { font-size: 13px }
  .fs-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); flex-shrink: 0 }

  .iBtn { background: none; border: none; cursor: pointer; padding: 6px; font-size: 16px; border-radius: 6px; color: var(--muted); line-height: 1 }
  .iBtn:hover { color: var(--text); background: var(--surface2) }
  .iBtn.del:hover { color: #e05555 }
</style>
