<script lang="ts">
  import { onMount } from 'svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'

  // ─── Types ───────────────────────────────────────────────────────────────────
  interface DiagramNode {
    id: string
    label: string
    x: number
    y: number
    color: string
    custom: boolean
    imageUrl?: string
  }

  interface DiagramEdge {
    id: string
    from: string
    to: string
    label: string
    hx?: number  // handle x (bezier midpoint drag position)
    hy?: number  // handle y
  }

  interface DiagramDef {
    id: string
    name: string
  }

  // ─── Constants ───────────────────────────────────────────────────────────────
  const NODE_W = 120
  const NODE_H = 52
  const COLORS = ['#5b8dee','#e8734a','#56b87c','#c46be3','#e8b84a','#4abce8','#e84a7a','#7ae84a']

  // ─── Diagrams list state ──────────────────────────────────────────────────────
  let diagrams = $state<DiagramDef[]>([])
  let openDiagramId = $state<string | null>(null)
  let addingDiagram = $state(false)
  let newDiagramName = $state('')
  let editDiagramId = $state<string | null>(null)
  let editDiagramName = $state('')

  // ─── Canvas state (for open diagram) ─────────────────────────────────────────
  let nodes = $state<DiagramNode[]>([])
  let edges = $state<DiagramEdge[]>([])
  let editEdgeId = $state<string | null>(null)
  let editEdgeLabel = $state('')
  let draggingId = $state<string | null>(null)
  let dragOffset = $state({ x: 0, y: 0 })
  let draggingEdgeId = $state<string | null>(null)
  let edgeDragOffset = $state({ x: 0, y: 0 })
  let connectFrom = $state<string | null>(null)
  let canvasEl: HTMLDivElement
  let addingCustom = $state(false)
  let newNodeLabel = $state('')
  let editNodeId = $state<string | null>(null)
  let editNodeLabel = $state('')
  let showHelp = $state(false)

  // ─── Persistence: diagrams list ───────────────────────────────────────────────
  function diagramsKey() {
    return `sf_diagrams_${projectStore.currentProjectId}`
  }

  function saveDiagrams() {
    localStorage.setItem(diagramsKey(), JSON.stringify(diagrams))
  }

  function loadDiagrams() {
    const pid = projectStore.currentProjectId
    if (!pid) { diagrams = []; return }
    try {
      const raw = localStorage.getItem(diagramsKey())
      if (raw) {
        diagrams = JSON.parse(raw)
      } else {
        const oldNodes = localStorage.getItem(`sf_diagram_${pid}_nodes`)
        if (oldNodes) {
          const defId = crypto.randomUUID()
          diagrams = [{ id: defId, name: '構図 1' }]
          localStorage.setItem(`sf_diagram_${pid}_${defId}_nodes`, oldNodes)
          const oldEdges = localStorage.getItem(`sf_diagram_${pid}_edges`)
          if (oldEdges) localStorage.setItem(`sf_diagram_${pid}_${defId}_edges`, oldEdges)
        } else {
          diagrams = []
        }
        saveDiagrams()
      }
    } catch {
      diagrams = []
    }
  }

  // ─── Persistence: canvas data ─────────────────────────────────────────────────
  function nodeKey(diagId: string) {
    return `sf_diagram_${projectStore.currentProjectId}_${diagId}_nodes`
  }
  function edgeKey(diagId: string) {
    return `sf_diagram_${projectStore.currentProjectId}_${diagId}_edges`
  }

  function saveNodes() {
    if (!openDiagramId) return
    localStorage.setItem(nodeKey(openDiagramId), JSON.stringify(nodes))
  }
  function saveEdges() {
    if (!openDiagramId) return
    localStorage.setItem(edgeKey(openDiagramId), JSON.stringify(edges))
  }

  function loadCanvasData(diagId: string) {
    try {
      const sn = localStorage.getItem(nodeKey(diagId))
      const se = localStorage.getItem(edgeKey(diagId))
      nodes = sn ? JSON.parse(sn) : []
      edges = se ? JSON.parse(se) : []
    } catch {
      nodes = []; edges = []
    }
  }

  // ─── Diagram management ───────────────────────────────────────────────────────
  function addDiagram() {
    const name = newDiagramName.trim() || `構図 ${diagrams.length + 1}`
    const d: DiagramDef = { id: crypto.randomUUID(), name }
    diagrams = [...diagrams, d]
    saveDiagrams()
    newDiagramName = ''
    addingDiagram = false
  }

  function startEditDiagram(d: DiagramDef) {
    editDiagramId = d.id
    editDiagramName = d.name
  }

  function saveDiagramName() {
    if (!editDiagramId || !editDiagramName.trim()) return
    diagrams = diagrams.map(d => d.id === editDiagramId ? { ...d, name: editDiagramName.trim() } : d)
    saveDiagrams()
    editDiagramId = null
  }

  function deleteDiagram(id: string) {
    const pid = projectStore.currentProjectId
    diagrams = diagrams.filter(d => d.id !== id)
    saveDiagrams()
    if (pid) {
      localStorage.removeItem(nodeKey(id))
      localStorage.removeItem(edgeKey(id))
    }
    if (openDiagramId === id) closeDiagram()
    editDiagramId = null
  }

  function openDiagram(id: string) {
    openDiagramId = id
    addingCustom = false
    showHelp = false
    loadCanvasData(id)
  }

  function closeDiagram() {
    openDiagramId = null
    nodes = []
    edges = []
    addingCustom = false
    connectFrom = null
  }

  onMount(() => {
    if (projectStore.currentProjectId) loadDiagrams()
  })

  $effect(() => {
    if (projectStore.currentProjectId) loadDiagrams()
  })

  // ─── Connect mode ────────────────────────────────────────────────────────────
  function onNodeClick(e: MouseEvent, id: string) {
    if (draggingId) return
    if (connectFrom === null) return
    if (connectFrom === id) { connectFrom = null; return }
    const already = edges.find(edge =>
      (edge.from === connectFrom && edge.to === id) ||
      (edge.from === id && edge.to === connectFrom)
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

  function onNodeDblClick(e: MouseEvent, id: string) {
    e.stopPropagation()
    if (connectFrom !== null) { connectFrom = null; return }
    connectFrom = id
  }

  // ─── Node drag ───────────────────────────────────────────────────────────────
  function onNodePointerDown(e: PointerEvent, id: string) {
    if (connectFrom !== null) return
    e.stopPropagation()
    draggingId = id
    const n = nodes.find(n => n.id === id)!
    const rect = canvasEl.getBoundingClientRect()
    dragOffset = { x: e.clientX - rect.left - n.x, y: e.clientY - rect.top - n.y }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  // ─── Edge handle drag ─────────────────────────────────────────────────────────
  function onEdgeHandlePointerDown(e: PointerEvent, edge: DiagramEdge) {
    e.stopPropagation()
    const mid = edgeMidpoint(edge)!
    const rect = canvasEl.getBoundingClientRect()
    edgeDragOffset = { x: e.clientX - rect.left - mid.x, y: e.clientY - rect.top - mid.y }
    draggingEdgeId = edge.id
    canvasEl.setPointerCapture(e.pointerId)
  }

  function onCanvasPointerMove(e: PointerEvent) {
    const rect = canvasEl.getBoundingClientRect()
    if (draggingId) {
      const x = Math.max(0, e.clientX - rect.left - dragOffset.x)
      const y = Math.max(0, e.clientY - rect.top - dragOffset.y)
      nodes = nodes.map(n => n.id === draggingId ? { ...n, x, y } : n)
    } else if (draggingEdgeId) {
      const hx = e.clientX - rect.left - edgeDragOffset.x
      const hy = e.clientY - rect.top - edgeDragOffset.y
      edges = edges.map(edge => edge.id === draggingEdgeId ? { ...edge, hx, hy } : edge)
    }
  }

  function onCanvasPointerUp() {
    if (draggingId) { saveNodes(); draggingId = null }
    if (draggingEdgeId) { saveEdges(); draggingEdgeId = null }
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
    if (edge.hx !== undefined && edge.hy !== undefined) {
      return { x: edge.hx, y: edge.hy }
    }
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
    let cx: number, cy: number
    if (edge.hx !== undefined && edge.hy !== undefined) {
      // Derive control point so bezier passes through handle at t=0.5
      cx = 2 * edge.hx - 0.5 * (fx + tx)
      cy = 2 * edge.hy - 0.5 * (fy + ty)
    } else {
      cx = (fx + tx) / 2
      cy = (fy + ty) / 2 - 30
    }
    return `M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`
  }

  const canvasW = $derived(nodes.length > 0 ? Math.max(900, ...nodes.map(n => n.x + NODE_W + 60)) : 900)
  const canvasH = $derived(nodes.length > 0 ? Math.max(500, ...nodes.map(n => n.y + NODE_H + 80)) : 500)

  const openDiagramDef = $derived(diagrams.find(d => d.id === openDiagramId))
</script>

{#if projectStore.currentProjectId}
  <div class="tab-wrap">
    <!-- Header -->
    <div class="tab-header">
      <h2 class="tab-title">🗺 物語構図</h2>
      <button class="btn btn-primary btn-sm" onclick={() => { addingDiagram = !addingDiagram; newDiagramName = '' }}>
        {addingDiagram ? 'キャンセル' : '＋ 新しい構図'}
      </button>
    </div>

    {#if addingDiagram}
      <div class="add-bar">
        <input
          class="fi"
          placeholder="構図の名前（例：第一部、登場人物関係図…）"
          value={newDiagramName}
          oninput={(e) => newDiagramName = (e.target as HTMLInputElement).value}
          onkeydown={(e) => { if (e.key === 'Enter') addDiagram(); if (e.key === 'Escape') { addingDiagram = false } }}
          autofocus
        />
        <button class="btn btn-primary btn-sm" onclick={addDiagram}>作成</button>
        <button class="btn btn-ghost btn-sm" onclick={() => addingDiagram = false}>キャンセル</button>
      </div>
    {/if}

    <!-- Diagram list -->
    <div class="diagram-list">
      {#if diagrams.length === 0}
        <div class="empty-hint">
          <div class="empty-icon">🗺</div>
          <div>「＋ 新しい構図」で構図を作成しましょう</div>
          <div class="empty-sub">複数の構図を作って場面ごとに整理できます</div>
        </div>
      {:else}
        {#each diagrams as diagram (diagram.id)}
          <button class="diagram-card" onclick={() => openDiagram(diagram.id)}>
            <span class="diagram-icon">🗺</span>
            <span class="diagram-name">{diagram.name}</span>
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <span
              class="diagram-edit"
              onclick={(e) => { e.stopPropagation(); startEditDiagram(diagram) }}
              title="名前を変更・削除"
            >✏</span>
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<!-- Diagram name edit dialog -->
{#if editDiagramId}
  {@const d = diagrams.find(d => d.id === editDiagramId)}
  {#if d}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={() => editDiagramId = null}>
      <div class="modal-box" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-title">構図の名前を変更</div>
        <input
          class="fi"
          value={editDiagramName}
          oninput={(e) => editDiagramName = (e.target as HTMLInputElement).value}
          onkeydown={(e) => { if (e.key === 'Enter') saveDiagramName(); if (e.key === 'Escape') editDiagramId = null }}
          autofocus
        />
        <div class="modal-acts">
          <button class="btn btn-danger btn-sm" onclick={() => deleteDiagram(editDiagramId!)}>削除</button>
          <button class="btn btn-ghost btn-sm" onclick={() => editDiagramId = null}>キャンセル</button>
          <button class="btn btn-primary btn-sm" onclick={saveDiagramName}>保存</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<!-- Diagram overlay -->
{#if openDiagramId && openDiagramDef}
  <div class="diagram-overlay">
    <!-- Overlay header -->
    <div class="overlay-header">
      <span class="overlay-title">🗺 {openDiagramDef.name}</span>
      <div class="hdr-acts">
        <button class="btn btn-ghost btn-sm" onclick={() => addingCustom = !addingCustom}>＋ ノード追加</button>
        <button class="btn btn-ghost btn-sm" onclick={() => showHelp = !showHelp}>?</button>
        <button class="btn btn-ghost btn-sm close-btn" onclick={closeDiagram}>✕ 閉じる</button>
      </div>
    </div>

    {#if showHelp}
      <div class="help-bar">
        <strong>使い方：</strong>
        ノードをドラッグして移動 ／
        ノードをダブルクリックで接続モード開始 → 別のノードをクリックして関係線を追加 ／
        ノードの ✏ ボタンで名前変更・削除 ／
        関係線のラベルをドラッグして曲がりを調整 ／
        関係線の ✏ ボタンでラベル編集・削除
      </div>
    {/if}

    {#if addingCustom}
      <div class="add-bar">
        <input
          class="fi"
          placeholder="ノード名（キャラクター・グループ・概念など）"
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
      >
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
              <!-- Drag handle: label rect -->
              <g
                style="pointer-events: all; cursor: move"
                onpointerdown={(e) => onEdgeHandlePointerDown(e, edge)}
              >
                <rect
                  x={mid.x - 28} y={mid.y - 11}
                  width="56" height="22" rx="6"
                  fill="var(--surface2)" stroke="var(--accent)" stroke-width="1"
                />
                <text x={mid.x} y={mid.y + 4} text-anchor="middle" font-size="10" fill="var(--text)">{edge.label || '…'}</text>
              </g>
              <!-- Edit button -->
              <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
              <g
                style="pointer-events: all; cursor: pointer"
                onclick={(e) => { e.stopPropagation(); startEditEdge(edge.id) }}
              >
                <rect
                  x={mid.x + 32} y={mid.y - 11}
                  width="22" height="22" rx="6"
                  fill="var(--surface2)" stroke="var(--accent)" stroke-width="1"
                />
                <text x={mid.x + 43} y={mid.y + 4} text-anchor="middle" font-size="11" fill="var(--accent)">✏</text>
              </g>
            {/if}
          {/each}
        </svg>

        {#each nodes as node (node.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="node"
            class:connect-from={connectFrom === node.id}
            class:connect-target={connectFrom !== null && connectFrom !== node.id}
            style="left:{node.x}px; top:{node.y}px; width:{NODE_W}px; min-height:{NODE_H}px; border-color:{node.color};"
            onpointerdown={(e) => onNodePointerDown(e, node.id)}
            onclick={(e) => onNodeClick(e, node.id)}
            ondblclick={(e) => onNodeDblClick(e, node.id)}
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
            <div>「＋ ノード追加」でキャラクターや<br>グループを追加しましょう</div>
          </div>
        {/if}
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
              <button class="btn btn-danger btn-sm" onclick={() => deleteNode(editNodeId!)}>削除</button>
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
  </div>
{/if}

<style>
  .tab-wrap    { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .tab-header  { padding: 12px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; gap: 10px }
  .tab-title   { font-size: 16px; font-weight: 700; margin-right: auto }
  .hdr-acts    { display: flex; align-items: center; gap: 6px }

  .add-bar  { background: var(--surface2); padding: 10px 20px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .add-bar .fi { flex: 1 }

  /* Diagram list */
  .diagram-list { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px }
  .diagram-card {
    display: flex; align-items: center; gap: 12px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px 16px; cursor: pointer; text-align: left; font-family: inherit;
    font-size: 14px; color: var(--text); transition: border-color .15s, box-shadow .15s;
    width: 100%;
  }
  .diagram-card:hover { border-color: var(--accent); box-shadow: 0 2px 12px var(--shadow) }
  .diagram-icon { font-size: 20px; flex-shrink: 0 }
  .diagram-name { flex: 1; font-weight: 600 }
  .diagram-edit {
    opacity: 0; font-size: 14px; color: var(--muted); padding: 4px 6px;
    border-radius: 6px; transition: opacity .15s, color .15s, background .15s;
    cursor: pointer;
  }
  .diagram-card:hover .diagram-edit { opacity: 1 }
  .diagram-edit:hover { color: var(--accent); background: var(--surface2) }

  .empty-hint {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex: 1; gap: 8px; color: var(--muted); font-size: 13px; text-align: center; line-height: 1.8;
  }
  .empty-icon { font-size: 40px }
  .empty-sub  { font-size: 11px }

  /* Overlay */
  .diagram-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: var(--bg);
    display: flex; flex-direction: column;
  }
  .overlay-header {
    padding: 10px 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    background: var(--surface);
  }
  .overlay-title { font-size: 15px; font-weight: 700; margin-right: auto }
  .close-btn { color: var(--muted) }

  .help-bar { background: var(--surface2); padding: 8px 20px; font-size: 12px; color: var(--muted); border-bottom: 1px solid var(--border); flex-shrink: 0 }

  .canvas-outer { flex: 1; overflow: auto; background: var(--bg) }
  .canvas {
    position: relative;
    background:
      radial-gradient(circle, color-mix(in srgb, var(--border) 60%, transparent) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .edge-svg { position: absolute; inset: 0; pointer-events: none }
  .edge-svg text { font-family: inherit }

  .node {
    position: absolute; border: 2px solid; border-radius: 12px;
    background: var(--surface); box-shadow: 0 2px 10px var(--shadow);
    display: flex; flex-direction: column; align-items: center;
    padding: 8px 8px 4px; cursor: grab; user-select: none;
    transition: box-shadow .15s, transform .1s;
  }
  .node:hover  { box-shadow: 0 4px 18px var(--shadow); z-index: 10 }
  .node.connect-from   { box-shadow: 0 0 0 3px var(--accent); z-index: 20 }
  .node.connect-target { cursor: crosshair }
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
  .node-actions { display: flex; gap: 4px; margin-top: 4px; opacity: 0; transition: opacity .15s }
  .node:hover .node-actions { opacity: 1 }
  .node-act-btn {
    background: none; border: none; cursor: pointer;
    font-size: 12px; padding: 2px 4px; border-radius: 4px;
    color: var(--muted); transition: color .15s, background .15s;
  }
  .node-act-btn:hover { color: var(--accent); background: var(--surface2) }

  /* Modals */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,.5);
    display: flex; align-items: center; justify-content: center; padding: 24px;
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
