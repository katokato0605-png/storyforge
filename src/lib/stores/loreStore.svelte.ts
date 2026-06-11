import { db } from '../db/database'
import type { LoreEntry, LoreType } from '../db/schema'
import { nanoid } from 'nanoid'

let entries = $state<LoreEntry[]>([])
let loadedProjectId = $state<string | null>(null)
let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle')

export const loreStore = {
  get entries() { return entries },
  get status() { return status },

  async load(projectId: string) {
    if (loadedProjectId === projectId && status === 'ready') return
    status = 'loading'
    loadedProjectId = projectId
    try {
      entries = await db.loreEntries
        .where('[projectId+type]').anyOf(
          [projectId, 'character'],
          [projectId, 'world'],
          [projectId, 'lore'],
        )
        .reverse()
        .sortBy('createdAt')
      // sortBy returns sorted asc, reverse by createdAt desc
      entries = await db.loreEntries
        .where('projectId').equals(projectId)
        .reverse()
        .sortBy('createdAt')
      status = 'ready'
    } catch {
      status = 'error'
    }
  },

  async create(projectId: string, type: LoreType, title: string, content: string, tags: string[]) {
    const now = Date.now()
    const entry: LoreEntry = { id: nanoid(), projectId, type, title, content, tags, createdAt: now, updatedAt: now }
    await db.loreEntries.put(entry)
    entries = [entry, ...entries]
    return entry
  },

  async update(id: string, patch: Partial<Pick<LoreEntry, 'title' | 'content' | 'tags'>>) {
    const now = Date.now()
    await db.loreEntries.update(id, { ...patch, updatedAt: now })
    entries = entries.map(e => e.id === id ? { ...e, ...patch, updatedAt: now } : e)
  },

  async delete(id: string) {
    await db.loreEntries.delete(id)
    entries = entries.filter(e => e.id !== id)
  },
}
