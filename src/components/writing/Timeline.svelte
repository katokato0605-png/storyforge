<script lang="ts">
  import { noteStore } from '../../lib/stores/noteStore.svelte'
  import { nanoid } from 'nanoid'

  let { projectId }: { projectId: string } = $props()

  interface TimelineEvent {
    id: string
    label: string
    title: string
    note: string
    color: string
  }

  const COLORS = ['#7c6af7', '#e09020', '#4caf50', '#e05555', '#2196f3', '#e91e8c']

  let events = $state<TimelineEvent[]>([])
  let editingId = $state<string | null>(null)
  let loaded = $state(false)

  $effect(() => {
    const pid = projectId
    loaded = false
    noteStore.load(pid).then(() => {
      try {
        const raw = noteStore.getContent('timeline')
        events = raw ? JSON.parse(raw) : []
      } catch {
        events = []
      }
      loaded = true
    })
  })

  async function save(evts: TimelineEvent[]) {
    await noteStore.save(projectId, 'timeline', JSON.stringify(evts))
  }

  function addEvent() {
    const e: TimelineEvent = {
      id: nanoid(),
      label: '',
      title: '',
      note: '',
      color: COLORS[events.length % COLORS.length],
    }
    const next = [...events, e]
    events = next
    editingId = e.id
    save(next)
  }

  function updateEvent(id: string, patch: Partial<TimelineEvent>) {
    const next = events.map(e => e.id === id ? { ...e, ...patch } : e)
    events = next
    save(next)
  }

  function deleteEvent(id: string) {
    const next = events.filter(e => e.id !== id)
    events = next
    editingId = null
    save(next)
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const arr = [...events]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    events = arr
    save(arr)
  }

  function moveDown(idx: number) {
    if (idx === events.length - 1) return
    const arr = [...events]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    events = arr
    save(arr)
  }
</script>

{#if !loaded}
  <div class="tl-loading">読み込み中…</div>
{:else if events.length === 0}
  <div class="tl-empty">
    <div class="tl-empty-icon">🕐</div>
    <div class="tl-empty-msg">時間軸がまだありません</div>
    <button class="btn btn-primary" onclick={addEvent}>＋ 最初のイベントを追加</button>
  </div>
{:else}
  <div class="tl-wrap">
    <div class="tl-list">
      {#each events as ev, idx (ev.id)}
        <div class="tl-row">
          <div class="tl-spine">
            <div class="tl-dot" style="background:{ev.color}"></div>
            {#if idx < events.length - 1}<div class="tl-line"></div>{/if}
          </div>

          <div class="tl-card" class:editing={editingId === ev.id}>
            {#if editingId === ev.id}
              <div class="tl-edit">
                <div class="tl-edit-row">
                  <input
                    class="fi tl-input-label"
                    value={ev.label}
                    oninput={(e) => updateEvent(ev.id, { label: (e.target as HTMLInputElement).value })}
                    placeholder="時期・日付（例：第1章・1日目）"
                  />
                  <div class="tl-colors">
                    {#each COLORS as c}
                      <button
                        class="tl-color-dot"
                        class:selected={ev.color === c}
                        style="background:{c}"
                        onclick={() => updateEvent(ev.id, { color: c })}
                        aria-label="色を選択"
                      ></button>
                    {/each}
                  </div>
                </div>
                <input
                  class="fi tl-input-title"
                  value={ev.title}
                  oninput={(e) => updateEvent(ev.id, { title: (e.target as HTMLInputElement).value })}
                  placeholder="イベントのタイトル"
                />
                <textarea
                  class="fi tl-textarea"
                  value={ev.note}
                  oninput={(e) => updateEvent(ev.id, { note: (e.target as HTMLTextAreaElement).value })}
                  placeholder="詳細・メモ（任意）"
                  rows="3"
                ></textarea>
                <div class="tl-edit-acts">
                  <button class="btn btn-ghost btn-sm" onclick={() => deleteEvent(ev.id)}>🗑 削除</button>
                  <button class="btn btn-primary btn-sm" onclick={() => editingId = null}>完了</button>
                </div>
              </div>
            {:else}
              <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
              <div class="tl-view" onclick={() => editingId = ev.id}>
                <div class="tl-view-top">
                  <span class="tl-label" style="color:{ev.color}">{ev.label || '（時期未設定）'}</span>
                  <div class="tl-view-acts">
                    <button class="tl-move-btn" onclick={(e) => { e.stopPropagation(); moveUp(idx) }} disabled={idx === 0} aria-label="上へ">↑</button>
                    <button class="tl-move-btn" onclick={(e) => { e.stopPropagation(); moveDown(idx) }} disabled={idx === events.length - 1} aria-label="下へ">↓</button>
                  </div>
                </div>
                <div class="tl-title">{ev.title || '（タイトル未設定）'}</div>
                {#if ev.note}<div class="tl-note">{ev.note}</div>{/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    <button class="tl-add-btn" onclick={addEvent}>＋ イベントを追加</button>
  </div>
{/if}

<style>
  .tl-loading { padding: 40px; text-align: center; color: var(--muted); font-size: 13px }

  .tl-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--muted) }
  .tl-empty-icon { font-size: 36px }
  .tl-empty-msg { font-size: 14px }

  .tl-wrap { padding: 16px 20px 80px; max-width: 640px; margin: 0 auto }
  .tl-list { display: flex; flex-direction: column }

  .tl-row { display: flex; gap: 12px; align-items: flex-start }
  .tl-spine { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 20px; padding-top: 14px }
  .tl-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0 }
  .tl-line { width: 2px; flex: 1; min-height: 20px; background: var(--border); margin-top: 4px }

  .tl-card { flex: 1; margin-bottom: 8px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); overflow: hidden; transition: border-color .15s }
  .tl-card:hover { border-color: var(--accent) }
  .tl-card.editing { border-color: var(--accent) }

  .tl-view { padding: 10px 14px; cursor: pointer }
  .tl-view-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px }
  .tl-label { font-size: 11px; font-weight: 600 }
  .tl-view-acts { display: flex; gap: 2px; opacity: 0 }
  .tl-view:hover .tl-view-acts { opacity: 1 }
  .tl-move-btn { background: none; border: none; cursor: pointer; color: var(--muted); padding: 2px 4px; font-size: 12px; border-radius: 4px }
  .tl-move-btn:hover { color: var(--text); background: var(--surface2) }
  .tl-move-btn:disabled { opacity: .3; cursor: default }
  .tl-title { font-size: 14px; font-weight: 600; color: var(--text) }
  .tl-note { font-size: 12px; color: var(--muted); margin-top: 4px; white-space: pre-wrap; line-height: 1.6 }

  .tl-edit { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px }
  .tl-edit-row { display: flex; gap: 8px; align-items: center }
  .tl-input-label { font-size: 12px; flex: 1 }
  .tl-input-title { font-size: 14px; font-weight: 600 }
  .tl-textarea { font-size: 13px; resize: vertical; min-height: 60px; line-height: 1.6 }
  .tl-colors { display: flex; gap: 4px; flex-shrink: 0 }
  .tl-color-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; transition: .1s }
  .tl-color-dot.selected { border-color: var(--text); transform: scale(1.2) }
  .tl-edit-acts { display: flex; justify-content: space-between }

  .tl-add-btn { margin-top: 8px; margin-left: 32px; background: none; border: 1px dashed var(--border); color: var(--muted); padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; transition: .15s; width: calc(100% - 32px) }
  .tl-add-btn:hover { border-color: var(--accent); color: var(--accent) }
</style>
