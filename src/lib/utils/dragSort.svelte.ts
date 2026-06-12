function findDragIdx(el: Element | null): number | null {
  let node = el
  while (node) {
    const v = (node as HTMLElement).dataset?.dragIdx
    if (v !== undefined) return parseInt(v)
    node = node.parentElement
  }
  return null
}

export function createDragSort() {
  let dragIdx = $state<number | null>(null)
  let dragOverIdx = $state<number | null>(null)

  return {
    get dragIdx() { return dragIdx },
    get dragOverIdx() { return dragOverIdx },
    start(idx: number) { dragIdx = idx },
    over(e: DragEvent, idx: number) { e.preventDefault(); dragOverIdx = idx },
    end() { dragIdx = null; dragOverIdx = null },
    drop<T>(arr: T[], toIdx: number): T[] | null {
      if (dragIdx === null || dragIdx === toIdx) { this.end(); return null }
      const next = [...arr]
      const [item] = next.splice(dragIdx, 1)
      next.splice(toIdx, 0, item)
      this.end()
      return next
    },
    touchstart(idx: number) { dragIdx = idx },
    touchmove(e: TouchEvent) {
      e.preventDefault()
      const touch = e.touches[0]
      const el = e.currentTarget as HTMLElement
      const prev = el.style.pointerEvents
      el.style.pointerEvents = 'none'
      const target = document.elementFromPoint(touch.clientX, touch.clientY)
      el.style.pointerEvents = prev
      const idx = findDragIdx(target)
      if (idx !== null) dragOverIdx = idx
    },
  }
}
