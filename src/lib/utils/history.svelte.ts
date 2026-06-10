export function createHistory<T>(maxSize = 50) {
  let past = $state<T[]>([])
  let future = $state<T[]>([])

  return {
    get canUndo() { return past.length > 0 },
    get canRedo() { return future.length > 0 },

    push(snapshot: T) {
      past = [...past.slice(-(maxSize - 1)), snapshot]
      future = []
    },

    undo(current: T): T | null {
      if (past.length === 0) return null
      future = [current, ...future]
      const prev = past[past.length - 1]
      past = past.slice(0, -1)
      return prev
    },

    redo(current: T): T | null {
      if (future.length === 0) return null
      past = [...past, current]
      const next = future[0]
      future = future.slice(1)
      return next
    },

    reset() {
      past = []
      future = []
    },
  }
}
