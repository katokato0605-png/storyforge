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
  }
}
