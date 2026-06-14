<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { loreStore } from '../../lib/stores/loreStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'

  // ─── Types ───────────────────────────────────────────────────────────────────
  interface DiagramNode {
    id: string
    label: string
    x: number
    y: number
    color: string
    custom: boolean   // true = manually added node (not from lore)
    imageUrl?: string // optional portrait
  }

  interface DiagramEdge {
    id: string
    from: string
    to: string
    label: string
  }

  // ─── Constants ───────────────────────────────────────────────────────────────
  const NODE_W = 120
  const NODE_H = 52
  const COLORS = ['#5b8dee','#e8734a','#56b87c','#c46be3','#e8b84a','#4abce8','#e84a7a','#7ae84a']

  // ─── State ───────────────────────────────────────────────────────────────────
  let nodes = $state<DiagramNode[]>([])
  let edges = $state<DiagramEdge[]>([])
  let connectFrom = $state<string | null>(null) // node id awaiting second click
  let editEdgeId = $state<string | null>(null)
  let editEdgeLabel = $state('')
  let draggingId = $state<string | null>(null)
  let dragOffset = $state({ x: 0, y: 0 })
  let canvasEl: HTMLDivElement
  let addingCustom = $state(false)
  let newNodeLabel = $state('')
  let editNodeId = $state<string | null>(null)
  let editNodeLabel = $state('')
  let showHelp = $state(false)
  let fileInputId = ''

  // ─── Persistence ─────────────────────────────────────────────────────────────
  function storageKey(suffix: string) {
    return `sf_diagram_${projectStore.currentProjectId}_${suffix}`
  }

  function saveNodes() {
    localStorage.setItem(storageKey('nodes'), JSON.stringify(nodes))
  }
  function saveEdges() {
    localStorage.setItem(storageKey('edges'), JSON.stringify(edges))
  }

  function loadData() {
    const pid = projectStore.currentProjectId
    if (!pid) return
    try {
      const sn = localStorage.getItem(storageKey('nodes'))
      const se = localStorage.getItem(storageKey('edges'))
      nodes = sn ? JSON.parse(sn) : []
      edges = se ? JSON.parse(se) : []
    } catch {
      nodes = []; edges = []
    }
    syncCharacters()
  }

  function syncCharacters() {
    const pid = projectStore.currentProjectId
    if (!pid) return
    const chars = loreStore.entries.filter(e => e.type === 'character' && e.projectId === pid)
    untrack(() => {
      const existing = new Set(nodes.map(n => n.id))
      let changed = false
      let cx = 80
      for (const ch of chars) {
        if (!existing.has(ch.id)) {
          nodes = [...nodes, {
            id: ch.id,
            label: ch.title,
            x: cx,
            y: 80,
            color: COLORS[nodes.length % COLORS.length],
            custom: false,
          }]
          cx += NODE_W + 40
          changed = true
        }
      }
      for (const ch of chars) {
        const n = nodes.find(n => n.id === ch.id)
        if (n && n.label !== ch.title) {
          nodes = nodes.map(nd => nd.id === ch.id ? { ...nd, label: ch.title } : nd)
          changed = true
        }
      }
      if (changed) saveNodes()
    })
  }

  onMount(async () => {
    fileInputId = crypto.randomUUID()
    const pid = projectStore.currentProjectId
    if (pid) await loreStore.load(pid)
    loadData()
  })

  $effect(() => {
    // react to lore changes
    loreStore.entries
    if (projectStore.currentProjectId) syncCharacters()
  })

  $effect(() => {
    if (projectStore.currentProjectId) loadData()
  })

  // ─── Node drag ───────────────────────────────────────────────────────────────
  function onNodePointerDown(e: PointerEvent, id: string) {
    if (connectFrom !== null) return  // in connect mode, handled by click
    e.stopPropagation()
    draggingId = id
    const n = nodes.find(n => n.id === id)!
    const rect = canvasEl.getBoundingClientRect()
    dragOffset = { x: e.clientX - rect.left - n.x, y: e.clientY - rect.top - n.y }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function onCanvasPointerMove(e: PointerEvent) {
    if (!draggingId) return
    const rect = canvasEl.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left - dragOffset.x)
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y)
    nodes = nodes.map(n => n.id === draggingId ? { ...n, x, y } : n)
  }

  function onCanvasPointerUp() {
    if (draggingId) { saveNodes(); draggingId = null }
  }

  // ─── Connect mode ────────────────────────────────────────────────────────────
  function onNodeClick(id: string) {
    if (draggingId) return
    if (connectFrom === null) {
      connectFrom = id
    } else if (connectFrom === id) {
      connectFrom = null
    } else {
      const already = edges.find(e =>
        (e.from === connectFrom && e.to === id) ||
        (e.from === id && e.to === connectFrom)
      )
      if (!already) {
        const edge: DiagramEdge = { id: crypto.randomUUID(), from: connectFrom!, to: id, label: '' }
        edges = [...edges, edge]
        saveEdges()
        editEdgeId = edge.id
        editEdgeLabel = ''
      }
      connectFrom = null
    }
  }

  // ─── Edge label edit ─────────────────────────────────────────────────────────
  function startEditEdge(id: string) {
    const e = edges.find(e => e.id === id)
    if (!e) return
    editEdgeId = id
    editEdgeLabel = e.label
  }

  function saveEdgeLabel() {
    edges = edges.map(e => e.id === editEdgeId ? { ...e, label: editEdgeLabel } : e)
    saveEdges()
    editEdgeId = null
  }

  function deleteEdge(id: string) {
    edges = edges.filter(e => e.id !== id)
    saveEdges()
    editEdgeId = null
  }

  // ─── Node edit / add ─────────────────────────────────────────────────────────
  function addCustomNode() {
    if (!newNodeLabel.trim()) return
    const n: DiagramNode = {
      id: crypto.randomUUID(),
      label: newNodeLabel.trim(),
      x: 80 + (nodes.length % 5) * (NODE_W + 20),
      y: 80 + Math.floor(nodes.length / 5) * (NODE_H + 60),
      color: COLORS[nodes.length % COLORS.length],
      custom: true,
    }
    nodes = [...nodes, n]
    saveNodes()
    newNodeLabel = ''
    addingCustom = false
  }

  function startEditNode(n: DiagramNode) {
    editNodeId = n.id
    editNodeLabel = n.label
  }

  function saveNodeLabel() {
    nodes = nodes.map(n => n.id === editNodeId ? { ...n, label: editNodeLabel } : n)
    saveNodes()
    editNodeId = null
  }

  function deleteNode(id: string) {
    nodes = nodes.filter(n => n.id !== id)
    edges = edges.filter(e => e.from !== id && e.to !== id)
    saveNodes(); saveEdges()
    editNodeId = null
  }

  // ─── Image on node ───────────────────────────────────────────────────────────
  function onNodeImageFile(e: Event, nodeId: string) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      nodes = nodes.map(n => n.id === nodeId ? { ...n, imageUrl: ev.target?.result as string } : n)
      saveNodes()
    }
    reader.readAsDataURL(file)
  }

  function removeNodeImage(nodeId: string) {
    nodes = nodes.map(n => n.id === nodeId ? { ...n, imageUrl: undefined } : n)
    saveNodes()
  }

  // ─── SVG helpers ─────────────────────────────────────────────────────────────
  function edgeMidpoint(edge: DiagramEdge) {
    const f = nodes.find(n => n.id === edge.from)
    const t = nodes.find(n => n.id === edge.to)
    if (!f || !t) return null
    return {
      x: (f.x + NODE_W / 2 + t.x + NODE_W / 2) / 2,
      y: (f.y + NODE_H / 2 + t.y + NODE_H / 2) / 2,
    }
  }

  function edgePath(edge: DiagramEdge): string {
    const f = nodes.find(n => n.id === edge.from)
    const t = nodes.find(n => n.id === edge.to)
    if (!f || !t) return ''
    const fx = f.x + NODE_W / 2
    const fy = f.y + NODE_H / 2
    const tx = t.x + NODE_W / 2
    const ty = t.y + NODE_H / 2
    const cx = (fx + tx) / 2
    const cy = (fy + ty) / 2 - 30
    return `M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`
  }

  // canvas dimensions
  const canvasW = $derived(Math.max(900, ...nodes.map(n => n.x + NODE_W + 60)))
  const canvasH = $derived(Math.max(500, ...nodes.map(n => n.y + NODE_H + 80)))
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <!-- Header -->
    <div class="tab-header">
      <h2 class="tab-title">🗺 物語構図</h2>
      <div class="hdr-acts">
        <button class="btn btn-ghost btn-sm" onclick={() => addingCustom = !addingCustom}>＋ ノード追加</button>
        <button
          class="btn btn-sm"
          class:connect-active={connectFrom !== null}
          onclick={() => connectFrom = connectFrom === null ? '' : null}
          title="2つのノードを順にクリックして関係線を引く"
        >
          {connectFrom !== null ? '🔗 接続中…' : '🔗 接続'}
        </button>
        <button class="btn btn-ghost btn-sm" onclick={() => showHelp = !showHelp}>?</button>
      </div>
    </div>

    {#if showHelp}
      <div class="help-bar">
        <strong>使い方：</strong>
        ノードをドラッグして移動 ／ 「🔗 接続」ボタン後にノードを2つクリックして関係線を追加 ／
        ノード右クリック or ダブルクリックで名前変更・削除 ／ 関係線ラベルをクリックして編集
      </div>
    {/if}

    {#if addingCustom}
      <div class="add-bar">
        <input
          class="fi"
          placeholder="ノード名（グループ・組織・概念など）"
          value={newNodeLabel}
          oninput={(e) => newNodeLabel = (e.target as HTMLInputElement).value}
          onkeydown={(e) => { if (e.key === 'Enter') addCustomNode(); if (e.key === 'Escape') addingCustom = false }}
          autofocus
        />
        <button class="btn btn-primary btn-sm" onclick={addCustomNode}>追加</button>
        <button class="btn btn-ghost btn-sm" onclick={() => addingCustom = false}>キャンセル</button>
      </div>
    {/if}

    <!-- Canvas -->
    <div class="canvas-outer">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="canvas"
        bind:this={canvasEl}
        style="width:{canvasW}px;height:{canvasH}px"
        onpointermove={onCanvasPointerMove}
        onpointerup={onCanvasPointerUp}
        onclick={() => { if (connectFrom === '') connectFrom = null }}
      >
        <!-- SVG for edges -->
        <svg class="edge-svg" width={canvasW} height={canvasH}>
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" />
            </marker>
          </defs>
          {#each edges as edge (edge.id)}
            {@const mid = edgeMidpoint(edge)}
            <path
              d={edgePath(edge)}
              fill="none"
              stroke="var(--accent)"
              stroke-width="1.8"
              stroke-dasharray="6 3"
              marker-end="url(#arrow)"
              opacity="0.7"
            />
            {#if mid}
              <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
              <g onclick={() => startEditEdge(edge.id)} style="cursor:pointer">
                <rect
                  x={mid.x - 28} y={mid.y - 11}
                  width="56" height="22"
                  rx="6"
                  fill="var(--surface2)"
                  stroke="var(--accent)"
                  stroke-width="1"
                />
                <text
                  x={mid.x} y={mid.y + 4}
                  text-anchor="middle"
                  font-size="10"
                  fill="var(--text)"
                >{edge.label || '…'}</text>
              </g>
            {/if}
          {/each}
        </svg>

        <!-- Nodes -->
        {#each nodes as node (node.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="node"
            class:connect-from={connectFrom === node.id}
            class:connect-target={connectFrom !== null && connectFrom !== node.id}
            style="
              left:{node.x}px; top:{node.y}px;
              width:{NODE_W}px; min-height:{NODE_H}px;
              border-color:{node.color};
            "
            onpointerdown={(e) => onNodePointerDown(e, node.id)}
            onclick={() => onNodeClick(node.id)}
            ondblclick={(e) => { e.stopPropagation(); startEditNode(node) }}
          >
            {#if node.imageUrl}
              <div class="node-img-wrap">
                <img class="node-img" src={node.imageUrl} alt={node.label} />
                <button class="node-img-del" onclick={(e) => { e.stopPropagation(); removeNodeImage(node.id) }}>×</button>
              </div>
            {:else}
              <div class="node-avatar" style="background:{node.color}22;color:{node.color}">
                {node.label.charAt(0)}
              </div>
            {/if}
            <div class="node-label">{node.label}</div>
            <div class="node-actions">
              <label class="node-act-btn" title="画像" onclick={(e) => e.stopPropagation()}>
                🖼
                <input type="file" accept="image/*" style="display:none" onchange={(e) => onNodeImageFile(e, node.id)} />
              </label>
              <button class="node-act-btn" onclick={(e) => { e.stopPropagation(); startEditNode(node) }} title="編集">✏</button>
            </div>
          </div>
        {/each}

        {#if nodes.length === 0}
          <div class="empty-hint">
            <div class="empty-icon">🗺</div>
            <div>「設定」タブでキャラクターを追加すると<br>ここに自動表示されます</div>
            <div class="empty-sub">「＋ ノード追加」でグループ・組織なども追加できます</div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Edit node dialog -->
  {#if editNodeId}
    {@const node = nodes.find(n => n.id === editNodeId)}
    {#if node}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="modal-overlay" onclick={() => editNodeId = null}>
        <div class="modal-box" onclick={(e) => e.stopPropagation()} role="dialog">
          <div class="modal-title">ノードを編集</div>
          <input
            class="fi"
            value={editNodeLabel}
            oninput={(e) => editNodeLabel = (e.target as HTMLInputElement).value}
            onkeydown={(e) => { if (e.key === 'Enter') saveNodeLabel(); if (e.key === 'Escape') editNodeId = null }}
            autofocus
          />
          <div class="modal-acts">
            {#if node.custom}
              <button class="btn btn-danger btn-sm" onclick={() => deleteNode(editNodeId!)}>削除</button>
            {/if}
            <button class="btn btn-ghost btn-sm" onclick={() => editNodeId = null}>キャンセル</button>
            <button class="btn btn-primary btn-sm" onclick={saveNodeLabel}>保存</button>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Edit edge label dialog -->
  {#if editEdgeId}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={() => editEdgeId = null}>
      <div class="modal-box" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-title">関係ラベルを編集</div>
        <input
          class="fi"
          placeholder="例：親子、ライバル、師弟…"
          value={editEdgeLabel}
          oninput={(e) => editEdgeLabel = (e.target as HTMLInputElement).value}
          onkeydown={(e) => { if (e.key === 'Enter') saveEdgeLabel(); if (e.key === 'Escape') editEdgeId = null }}
          autofocus
        />
        <div class="modal-acts">
          <button class="btn btn-danger btn-sm" onclick={() => deleteEdge(editEdgeId!)}>関係線を削除</button>
          <button class="btn btn-ghost btn-sm" onclick={() => editEdgeId = null}>キャンセル</button>
          <button class="btn btn-primary btn-sm" onclick={saveEdgeLabel}>保存</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .tab-wrap    { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header  { padding: 12px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; gap: 10px }
  .tab-title   { font-size: 16px; font-weight: 700; margin-right: auto }
  .hdr-acts    { display: flex; align-items: center; gap: 6px }

  .connect-active { background: color-mix(in srgb, var(--accent) 20%, transparent) !important; color: var(--accent) !important }

  .help-bar { background: var(--surface2); padding: 8px 20px; font-size: 12px; color: var(--muted); border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .add-bar  { background: var(--surface2); padding: 10px 20px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .add-bar .fi { flex: 1 }

  .canvas-outer { flex: 1; overflow: auto; background: var(--bg) }
  .canvas {
    position: relative;
    background:
      radial-gradient(circle, color-mix(in srgb, var(--border) 60%, transparent) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .edge-svg {
    position: absolute; inset: 0;
    pointer-events: none;
  }
  .edge-svg text { font-family: inherit }

  .node {
    position: absolute;
    border: 2px solid;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 2px 10px var(--shadow);
    display: flex; flex-direction: column; align-items: center;
    padding: 8px 8px 4px;
    cursor: grab; user-select: none;
    transition: box-shadow .15s, transform .1s;
  }
  .node:hover  { box-shadow: 0 4px 18px var(--shadow); z-index: 10 }
  .node.connect-from    { box-shadow: 0 0 0 3px var(--accent); z-index: 20 }
  .node.connect-target  { cursor: crosshair }
  .node.connect-target:hover { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 60%, transparent) }

  .node-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; margin-bottom: 4px;
  }
  .node-img-wrap { position: relative; margin-bottom: 4px }
  .node-img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; display: block }
  .node-img-del {
    position: absolute; top: -4px; right: -4px;
    width: 16px; height: 16px; border-radius: 50%;
    background: rgba(0,0,0,.6); color: #fff;
    border: none; font-size: 10px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .15s;
  }
  .node-img-wrap:hover .node-img-del { opacity: 1 }

  .node-label {
    font-size: 11px; font-weight: 700; text-align: center;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: 100px; line-height: 1.3;
  }
  .node-actions {
    display: flex; gap: 4px; margin-top: 4px; opacity: 0; transition: opacity .15s;
  }
  .node:hover .node-actions { opacity: 1 }
  .node-act-btn {
    background: none; border: none; cursor: pointer;
    font-size: 12px; padding: 2px 4px; border-radius: 4px;
    color: var(--muted); transition: color .15s, background .15s;
  }
  .node-act-btn:hover { color: var(--accent); background: var(--surface2) }

  .empty-hint {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; color: var(--muted); font-size: 13px; text-align: center; line-height: 1.8;
    pointer-events: none;
  }
  .empty-icon { font-size: 40px }
  .empty-sub  { font-size: 11px }

  /* Modals */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,.5);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .modal-box {
    background: var(--surface); border-radius: 14px;
    width: 100%; max-width: 360px;
    padding: 20px; display: flex; flex-direction: column; gap: 12px;
    box-shadow: 0 8px 40px rgba(0,0,0,.3);
  }
  .modal-title { font-size: 14px; font-weight: 700 }
  .modal-acts  { display: flex; gap: 8px; justify-content: flex-end }
  .btn-danger  { background: #e05; color: #fff; border: none }
  .btn-danger:hover { opacity: .85 }
</style>
