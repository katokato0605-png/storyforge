import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '../db/database'
import { exportAll, importFromJSON } from './exportImport'

beforeEach(async () => {
  await db.projects.clear()
  await db.chapters.clear()
  await db.projectNotes.clear()
  await db.ideas.clear()
})

describe('exportAll', () => {
  it('空DBでも有効なJSONを返す', async () => {
    const json = await exportAll()
    const data = JSON.parse(json)
    expect(data.version).toBe(3)
    expect(Array.isArray(data.projects)).toBe(true)
    expect(Array.isArray(data.chapters)).toBe(true)
    expect(typeof data.exportedAt).toBe('number')
  })

  it('データが含まれる', async () => {
    await db.projects.put({ id: 'p1', title: 'テスト', description: '', createdAt: 1, updatedAt: 1 })
    await db.chapters.put({ id: 'c1', projectId: 'p1', title: '章1', content: 'content', plotMemo: '', status: 'draft', order: 0, wordCount: 7, createdAt: 1, updatedAt: 1 })

    const json = await exportAll()
    const data = JSON.parse(json)
    expect(data.projects).toHaveLength(1)
    expect(data.chapters).toHaveLength(1)
    expect(data.projects[0].title).toBe('テスト')
  })
})

describe('importFromJSON', () => {
  it('有効なデータをインポートできる', async () => {
    const payload = JSON.stringify({
      version: 3,
      exportedAt: Date.now(),
      projects: [{ id: 'imp1', title: 'インポート作品', description: '', createdAt: 1, updatedAt: 1 }],
      chapters: [],
      projectNotes: [],
      ideas: [],
    })
    const { projects } = await importFromJSON(payload)
    expect(projects).toBe(1)

    const rows = await db.projects.toArray()
    expect(rows.some(p => p.id === 'imp1')).toBe(true)
  })

  it('不正なJSONは例外を投げる', async () => {
    await expect(importFromJSON('{ invalid')).rejects.toThrow()
  })

  it('projects 配列がない場合は例外を投げる', async () => {
    await expect(importFromJSON(JSON.stringify({ version: 3 }))).rejects.toThrow()
  })

  it('JSONラウンドトリップ：export → import', async () => {
    await db.projects.put({ id: 'rt1', title: 'ラウンドトリップ', description: 'desc', createdAt: 10, updatedAt: 10 })
    await db.chapters.put({ id: 'rtc1', projectId: 'rt1', title: '章', content: '本文', plotMemo: '', status: 'draft', order: 0, wordCount: 2, createdAt: 10, updatedAt: 10 })

    const json = await exportAll()

    await db.projects.clear()
    await db.chapters.clear()

    await importFromJSON(json)

    const projects = await db.projects.toArray()
    const chapters = await db.chapters.toArray()
    expect(projects).toHaveLength(1)
    expect(projects[0].title).toBe('ラウンドトリップ')
    expect(chapters[0].content).toBe('本文')
  })

  it('同じIDのデータは上書きされる（マージ）', async () => {
    await db.projects.put({ id: 'ov1', title: '旧タイトル', description: '', createdAt: 1, updatedAt: 1 })

    await importFromJSON(JSON.stringify({
      version: 3,
      exportedAt: Date.now(),
      projects: [{ id: 'ov1', title: '新タイトル', description: '', createdAt: 1, updatedAt: 2 }],
      chapters: [],
      projectNotes: [],
      ideas: [],
    }))

    const p = await db.projects.get('ov1')
    expect(p?.title).toBe('新タイトル')
  })
})
