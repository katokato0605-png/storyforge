<script lang="ts">
  import { noteStore } from '../../lib/stores/noteStore.svelte'
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
        { stage: '第一幕', title: '日常世界' },
        { stage: '第一幕', title: 'きっかけ' },
        { stage: '第一幕', title: '決意' },
        { stage: '第二幕', title: '新世界へ' },
        { stage: '第二幕', title: '中間転換点' },
        { stage: '第二幕', title: '最大の危機' },
        { stage: '第三幕', title: 'クライマックス' },
        { stage: '第三幕', title: '解決' },
      ],
    },
    heros_journey: {
      label: 'ヒーローズジャーニー（12段階）',
      beats: [
        { stage: '出発', title: '日常世界' },
        { stage: '出発', title: '冒険への召喚' },
        { stage: '出発', title: '召喚の拒否' },
        { stage: '出発', title: '師との出会い' },
        { stage: '出発', title: '第一関門突破' },
        { stage: 'イニシエーション', title: 'テスト・仲間・敵' },
        { stage: 'イニシエーション', title: '最深部への接近' },
        { stage: 'イニシエーション', title: '最大の試練' },
        { stage: 'イニシエーション', title: '報酬' },
        { stage: '帰還', title: '帰路' },
        { stage: '帰還', title: '復活' },
        { stage: '帰還', title: '宝を持っての帰還' },
      ],
    },
  } as const

  let beats = $state<PlotBeat[]>([])
  let timelineEvents = $state<TimelineEvent[]>([])
  let editingId = $state<string | null>(null)
  let editSnapshot = $state<PlotBeat | null>(null)
  let loaded = $state(false)
  let showTemplateMenu = $state(false)
  let saveTimer: ReturnType<typeof setTimeout>

  $effect(() => {
    const pid = projectId
    loaded = false
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
    const beat: PlotBeat = { id: nanoid(), stage: '', title: '', description: '', timelineEventId: null }
    const next = [...beats, beat]
    beats = next
    editSnapshot = { ...beat }
    editingId = beat.id
    save(next)
  }

  function startEdit(beat: PlotBeat) {
    editSnapshot = { ...beat }
    editingId = beat.id
  }

  function updateBeat(id: string, patch: Partial<PlotBeat>, debounce = false) {
    const next = beats.map(b => b.id === id ? { ...b, ...patch } : b)
    beats = next
    if (debounce) debouncedSave(next)
    else save(next)
  }

  function cancelEdit() {
    clearTimeout(saveTimer)
    if (editSnapshot && editingId) {
      const restored = beats.map(b => b.id === editingId ? editSnapshot! : b)
      beats = restored
      save(restored)
    }
    editingId = null
    editSnapshot = null
  }

  function confirmEdit() {
    clearTimeout(saveTimer)
    save(beats)
    editingId = null
    editSnapshot = null
  }

  function deleteBeat(id: string) {
    const next = beats.filter(b => b.id !== id)
    beats = next
    editingId = null
    editSnapshot = null
    save(next)
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const arr = [...beats]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    beats = arr
    save(arr)
  }

  function moveDown(idx: number) {
    if (idx === beats.length - 1) return
    const arr = [...beats]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    beats = arr
    save(arr)
  }

  function applyTemplate(key: keyof typeof TEMPLATES) {
    showTemplateMenu = false
    if (beats.length > 0 && !confirm('既存のビートをテンプレートで上書きしますか？')) return
    const newBeats: PlotBeat[] = TEMPLATES[key].beats.map(b => ({
      id: nanoid(),
      stage: b.stage,
      title: b.title,
      description: '',
      timelineEventId: null,
    }))
    beats = newBeats
    editingId = null
    editSnapshot = null
    save(newBeats)
  }

  function linkedEventLabel(eventId: string | null): string {
    if (!eventId) return ''
    const ev = timelineEvents.find(e => e.id === eventId)
    return ev ? (ev.title || ev.label || '（タイトル未設定）') : '（削除済み）'
  }
</script>

{#if !loaded}
  <div class="pb-loading">読み込み中…</div>
{:else}
  <div class="pb-wrap">
    <div class="pb-toolbar">
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
          <div class="pb-card" class:editing={editingId === beat.id}>
            {#if editingId === beat.id}
              <div class="pb-edit">
                <div class="pb-edit-row">
                  <input
                    class="fi pb-input-stage"
                    value={beat.stage}
                    oninput={(e) => updateBeat(beat.id, { stage: (e.target as HTMLInputElement).value }, true)}
                    placeholder="幕・段階（例：第一幕）"
                  />
                  <div class="pb-move-acts">
                    <button class="pb-move-btn" onclick={() => moveUp(idx)} disabled={idx === 0} aria-label="上へ">↑</button>
                    <button class="pb-move-btn" onclick={() => moveDown(idx)} disabled={idx === beats.length - 1} aria-label="下へ">↓</button>
                  </div>
                </div>
                <input
                  class="fi pb-input-title"
                  value={beat.title}
                  oninput={(e) => updateBeat(beat.id, { title: (e.target as HTMLInputElement).value }, true)}
                  placeholder="ビートのタイトル"
                />
                <textarea
                  class="fi pb-textarea"
                  value={beat.description}
                  oninput={(e) => updateBeat(beat.id, { description: (e.target as HTMLTextAreaElement).value }, true)}
                  placeholder="あらすじ・詳細（任意）"
                  rows="3"
                ></textarea>
                <div class="pb-tl-row">
                  <label class="pb-tl-label" for="tl-select-{beat.id}">タイムライン連携</label>
                  <select
                    id="tl-select-{beat.id}"
                    class="fi pb-select"
                    value={beat.timelineEventId ?? ''}
                    onchange={(e) => updateBeat(beat.id, { timelineEventId: (e.target as HTMLSelectElement).value || null })}
                  >
                    <option value="">（なし）</option>
                    {#each timelineEvents as ev}
                      <option value={ev.id}>{ev.label ? `${ev.label} — ` : ''}{ev.title || '（タイトル未設定）'}</option>
                    {/each}
                  </select>
                </div>
                <div class="pb-edit-acts">
                  <button class="btn btn-ghost btn-sm" onclick={() => deleteBeat(beat.id)}>🗑 削除</button>
                  <div class="pb-edit-right">
                    <button class="btn btn-ghost btn-sm" onclick={cancelEdit}>キャンセル</button>
                    <button class="btn btn-primary btn-sm" onclick={confirmEdit}>完了</button>
                  </div>
                </div>
              </div>
            {:else}
              <button class="pb-view" onclick={() => startEdit(beat)}>
                {#if beat.stage}<span class="pb-stage-badge">{beat.stage}</span>{/if}
                <div class="pb-title">{beat.title || '（タイトル未設定）'}</div>
                {#if beat.description}<div class="pb-desc">{beat.description}</div>{/if}
                {#if beat.timelineEventId}
                  <div class="pb-linked-badge">🕐 {linkedEventLabel(beat.timelineEventId)}</div>
                {/if}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
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

  .pb-card { border-radius: 10px; border: 1px solid var(--border); background: var(--surface); overflow: hidden; transition: border-color .15s }
  .pb-card:hover { border-color: var(--accent) }
  .pb-card.editing { border-color: var(--accent) }

  .pb-view { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 12px 14px; cursor: pointer; background: none; border: none; text-align: left; font-family: inherit; color: inherit; width: 100% }
  .pb-stage-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: var(--accent); color: #fff; letter-spacing: .3px }
  .pb-title { font-size: 14px; font-weight: 600; color: var(--text) }
  .pb-desc { font-size: 12px; color: var(--muted); white-space: pre-wrap; line-height: 1.6 }
  .pb-linked-badge { font-size: 11px; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); padding: 2px 8px; border-radius: 20px; margin-top: 2px }

  .pb-edit { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px }
  .pb-edit-row { display: flex; gap: 8px; align-items: center }
  .pb-input-stage { font-size: 12px; flex: 1 }
  .pb-input-title { font-size: 14px; font-weight: 600 }
  .pb-textarea { font-size: 13px; resize: vertical; min-height: 60px; line-height: 1.6 }
  .pb-tl-row { display: flex; flex-direction: column; gap: 4px }
  .pb-tl-label { font-size: 11px; color: var(--muted); font-weight: 600 }
  .pb-select { font-size: 13px }
  .pb-edit-acts { display: flex; justify-content: space-between; align-items: center }
  .pb-edit-right { display: flex; gap: 6px }
  .pb-move-acts { display: flex; gap: 2px; flex-shrink: 0 }
  .pb-move-btn { background: none; border: none; cursor: pointer; color: var(--muted); padding: 4px 6px; font-size: 12px; border-radius: 4px; min-width: 28px; min-height: 28px; display: inline-flex; align-items: center; justify-content: center }
  .pb-move-btn:hover { color: var(--text); background: var(--surface2) }
  .pb-move-btn:disabled { opacity: .3; cursor: default }
</style>
