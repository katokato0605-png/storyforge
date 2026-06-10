import { db } from '../db/database'
import type { Idea } from '../db/schema'
import { nanoid } from 'nanoid'

let ideas = $state<Idea[]>([])
let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle')

export const ideaStore = {
  get ideas() { return ideas },
  get status() { return status },

  async load() {
    if (status === 'ready' || status === 'loading') return
    status = 'loading'
    try {
      ideas = await db.ideas.orderBy('createdAt').reverse().toArray()
      status = 'ready'
    } catch {
      status = 'error'
    }
  },

  async create(content: string, tags: string[] = [], linkedProjectId: string | null = null) {
    const idea: Idea = { id: nanoid(), content, tags, linkedProjectId, createdAt: Date.now() }
    await db.ideas.put(idea)
    ideas = [idea, ...ideas]
    return idea
  },

  async update(id: string, patch: Partial<Pick<Idea, 'content' | 'tags' | 'linkedProjectId'>>) {
    await db.ideas.update(id, patch)
    ideas = ideas.map(i => i.id === id ? { ...i, ...patch } : i)
  },

  async delete(id: string) {
    await db.ideas.delete(id)
    ideas = ideas.filter(i => i.id !== id)
  },

  async reload() {
    status = 'loading'
    try {
      ideas = await db.ideas.orderBy('createdAt').reverse().toArray()
      status = 'ready'
    } catch {
      status = 'error'
    }
  },
}
