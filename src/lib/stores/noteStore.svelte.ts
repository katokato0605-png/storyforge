import { db } from '../db/database'
import type { ProjectNote, NoteType } from '../db/schema'
import { nanoid } from 'nanoid'

let noteMap = $state<Map<NoteType, ProjectNote>>(new Map())
let currentProjectId = $state<string | null>(null)
let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle')
let _loadPromise: Promise<void> | null = null

export const noteStore = {
  get status() { return status },

  getContent(type: NoteType): string {
    return noteMap.get(type)?.content ?? ''
  },

  load(projectId: string): Promise<void> {
    if (currentProjectId === projectId && status === 'ready') return Promise.resolve()
    if (currentProjectId === projectId && _loadPromise) return _loadPromise
    currentProjectId = projectId
    status = 'loading'
    _loadPromise = (async () => {
      try {
        const rows = await db.projectNotes.where('projectId').equals(projectId).toArray()
        const map = new Map<NoteType, ProjectNote>()
        for (const r of rows) map.set(r.type, r)
        noteMap = map
        status = 'ready'
      } catch {
        status = 'error'
      } finally {
        _loadPromise = null
      }
    })()
    return _loadPromise
  },

  async save(projectId: string, type: NoteType, content: string) {
    const now = Date.now()
    const existing = noteMap.get(type)
    if (existing) {
      await db.projectNotes.update(existing.id, { content, updatedAt: now })
      const updated = new Map(noteMap)
      updated.set(type, { ...existing, content, updatedAt: now })
      noteMap = updated
    } else {
      const note: ProjectNote = { id: nanoid(), projectId, type, content, updatedAt: now }
      await db.projectNotes.put(note)
      const updated = new Map(noteMap)
      updated.set(type, note)
      noteMap = updated
    }
  },

  invalidate() {
    currentProjectId = null
    status = 'idle'
    noteMap = new Map()
  },
}
