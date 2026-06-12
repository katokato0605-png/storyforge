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

  let beats = $state<PlotBeat[]>([])
  let timelineEvents = $state<TimelineEvent[]>([])
  let overlayId = $state<string | null>(null)
  let overlaySnapshot = $state<PlotBeat | null>(null)
  let loaded = $state(false)
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
  .fs-overlay { position: fixed; inset: 0; z-index: 200; background: var(--surface); display: flex; align-items: stretch; justify-content: stretch }
  .fs-panel { background: var(--surface); border-radius: 0; width: 100%; height: 100%; display: flex; flex-direction: column }
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
