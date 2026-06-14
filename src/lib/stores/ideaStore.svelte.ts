import { db } from '../db/database'
import type { Idea } from '../db/schema'
import { nanoid } from 'nanoid'

const TRASH_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 1週間

let ideas = $state<Idea[]>([])
let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle')

async function purgeExpiredTrash() {
  const cutoff = Date.now() - TRASH_TTL_MS
  const expired = await db.ideas.where('isTrash').equals(1).filter(i => (i.deletedAt ?? 0) < cutoff).toArray()
  if (expired.length > 0) {
    await db.ideas.bulkDelete(expired.map(i => i.id))
  }
}

export const ideaStore = {
  get ideas() { return ideas },
  get status() { return status },

  async load() {
    if (status === 'ready' || status === 'loading') return
    status = 'loading'
    try {
      await purgeExpiredTrash()
      ideas = await db.ideas.orderBy('createdAt').reverse().toArray()
      status = 'ready'
    } catch {
      status = 'error'
    }
  },

  async create(title: string, content: string, tags: string[] = [], linkedProjectId: string | null = null) {
    const idea: Idea = { id: nanoid(), title, content, tags, linkedProjectId, createdAt: Date.now() }
    await db.ideas.put(idea)
    ideas = [idea, ...ideas]
    return idea
  },

  async update(id: string, patch: Partial<Pick<Idea, 'title' | 'content' | 'tags' | 'linkedProjectId'>>) {
    await db.ideas.update(id, patch)
    ideas = ideas.map(i => i.id === id ? { ...i, ...patch } : i)
  },

  async trash(id: string) {
    const deletedAt = Date.now()
    await db.ideas.update(id, { isTrash: true, deletedAt })
    ideas = ideas.map(i => i.id === id ? { ...i, isTrash: true, deletedAt } : i)
  },

  async restore(id: string) {
    await db.ideas.where('id').equals(id).modify(i => { i.isTrash = false; delete i.deletedAt })
    ideas = ideas.map(i => i.id === id ? { ...i, isTrash: false, deletedAt: undefined } : i)
  },

  async delete(id: string) {
    await db.ideas.delete(id)
    ideas = ideas.filter(i => i.id !== id)
  },

  async reload() {
    status = 'loading'
    try {
      await purgeExpiredTrash()
      ideas = await db.ideas.orderBy('createdAt').reverse().toArray()
      status = 'ready'
    } catch {
      status = 'error'
    }
  },
}
