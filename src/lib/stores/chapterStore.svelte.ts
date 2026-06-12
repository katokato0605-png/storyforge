import { db } from '../db/database'
import type { Chapter, ChapterStatus } from '../db/schema'
import { nanoid } from 'nanoid'

let chapters = $state<Chapter[]>([])
let currentChapterId = $state<string | null>(null)
let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle')
let isDirty = $state(false)

const totalWordCount = $derived(chapters.reduce((sum, c) => sum + c.wordCount, 0))
const currentChapter = $derived(chapters.find(c => c.id === currentChapterId) ?? null)

export const chapterStore = {
  get chapters() { return chapters },
  get currentChapterId() { return currentChapterId },
  get currentChapter() { return currentChapter },
  get status() { return status },
  get isDirty() { return isDirty },
  get totalWordCount() { return totalWordCount },

  async load(projectId: string) {
    status = 'loading'
    isDirty = false
    try {
      chapters = await db.chapters.where('projectId').equals(projectId).sortBy('order')
      currentChapterId = chapters[0]?.id ?? null
      status = 'ready'
    } catch {
      status = 'error'
    }
  },

  selectChapter(id: string) {
    currentChapterId = id
    isDirty = false
  },

  async createChapter(projectId: string, title = '新しい章') {
    const maxOrder = chapters.reduce((m, c) => Math.max(m, c.order), -1)
    const now = Date.now()
    const chapter: Chapter = {
      id: nanoid(), projectId, title, content: '', plotMemo: '',
      status: 'draft', order: maxOrder + 1, wordCount: 0,
      createdAt: now, updatedAt: now,
    }
    await db.chapters.put(chapter)
    chapters = [...chapters, chapter]
    currentChapterId = chapter.id
    return chapter
  },

  async updateTitle(id: string, title: string) {
    const now = Date.now()
    await db.chapters.update(id, { title, updatedAt: now })
    chapters = chapters.map(c => c.id === id ? { ...c, title, updatedAt: now } : c)
  },

  async updateStatus(id: string, s: ChapterStatus) {
    await db.chapters.update(id, { status: s, updatedAt: Date.now() })
    chapters = chapters.map(c => c.id === id ? { ...c, status: s } : c)
  },

  async saveContent(id: string, content: string) {
    const wordCount = [...content].length
    const updatedAt = Date.now()
    await db.chapters.update(id, { content, wordCount, updatedAt })
    chapters = chapters.map(c => c.id === id ? { ...c, content, wordCount, updatedAt } : c)
    isDirty = false
  },

  markDirty() { isDirty = true },

  async deleteChapter(id: string) {
    await db.chapters.delete(id)
    chapters = chapters.filter(c => c.id !== id)
    if (currentChapterId === id) {
      currentChapterId = chapters[0]?.id ?? null
    }
  },

  async reorder(ids: string[]) {
    const now = Date.now()
    await db.transaction('rw', db.chapters, async () => {
      await Promise.all(ids.map((id, i) => db.chapters.update(id, { order: i, updatedAt: now })))
    })
    chapters = ids
      .map(id => chapters.find(c => c.id === id))
      .filter((c): c is Chapter => c !== undefined)
      .map((c, i) => ({ ...c, order: i }))
  },
}
