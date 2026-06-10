import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from './database'
import { runMigrationIfNeeded } from './migration'

const OLD_DATA = JSON.stringify({
  projects: [
    {
      id: 'proj-1',
      title: 'テスト作品',
      description: '説明文',
      chapters: [
        {
          id: 'ch-1',
          title: '第一章',
          content: 'あいうえお',
          plotMemo: 'メモ',
          status: 'draft',
          order: 0,
          wordCount: 5,
        },
      ],
      plotNote: 'プロットメモ',
      characterNote: 'キャラメモ',
    },
  ],
  ideas: [
    {
      id: 'idea-1',
      content: 'アイデア内容',
      tags: ['SF', '冒険'],
      linkedProjectId: 'proj-1',
    },
  ],
})

beforeEach(async () => {
  localStorage.clear()
  await db.projects.clear()
  await db.chapters.clear()
  await db.projectNotes.clear()
  await db.ideas.clear()
  await db.meta.clear()
})

describe('runMigrationIfNeeded', () => {
  it('旧データを正常にパース・移行する', async () => {
    localStorage.setItem('storyforge_v2', OLD_DATA)
    await runMigrationIfNeeded()

    const projects = await db.projects.toArray()
    expect(projects).toHaveLength(1)
    expect(projects[0].title).toBe('テスト作品')

    const chapters = await db.chapters.toArray()
    expect(chapters).toHaveLength(1)
    expect(chapters[0].content).toBe('あいうえお')

    const notes = await db.projectNotes.toArray()
    expect(notes.some(n => n.type === 'plot' && n.content === 'プロットメモ')).toBe(true)
    expect(notes.some(n => n.type === 'character' && n.content === 'キャラメモ')).toBe(true)

    const ideas = await db.ideas.toArray()
    expect(ideas).toHaveLength(1)
    expect(ideas[0].tags).toEqual(['SF', '冒険'])
  })

  it('_migrated フラグが立つ', async () => {
    localStorage.setItem('storyforge_v2', OLD_DATA)
    await runMigrationIfNeeded()

    const flag = await db.meta.get('_migrated')
    expect(flag?.value).toBe(true)
  })

  it('二重実行を防ぐ（フラグ立ち後は何もしない）', async () => {
    localStorage.setItem('storyforge_v2', OLD_DATA)
    await runMigrationIfNeeded()
    await runMigrationIfNeeded() // 2回目

    const projects = await db.projects.toArray()
    expect(projects).toHaveLength(1) // 重複なし
  })

  it('LocalStorage にデータがない場合はフラグだけ立てる', async () => {
    await runMigrationIfNeeded()

    const flag = await db.meta.get('_migrated')
    expect(flag?.value).toBe(true)

    const projects = await db.projects.toArray()
    expect(projects).toHaveLength(0)
  })

  it('欠損フィールドをデフォルト値で補完する', async () => {
    const minimal = JSON.stringify({
      projects: [{ chapters: [{ content: '本文のみ' }] }],
    })
    localStorage.setItem('storyforge_v2', minimal)
    await runMigrationIfNeeded()

    const projects = await db.projects.toArray()
    expect(projects[0].title).toBe('無題')

    const chapters = await db.chapters.toArray()
    expect(chapters[0].title).toBe('無題')
    expect(chapters[0].status).toBe('draft')
  })

  it('不正なJSONでも二重migration防止フラグが立つ', async () => {
    localStorage.setItem('storyforge_v2', '{ invalid json }}}')
    await runMigrationIfNeeded()

    const flag = await db.meta.get('_migrated')
    expect(flag?.value).toBe(true)

    const error = await db.meta.get('_migration_parse_error')
    expect(error?.value).toBe(true)
  })

  it('生データのロールバックバックアップが保存される', async () => {
    localStorage.setItem('storyforge_v2', OLD_DATA)
    await runMigrationIfNeeded()

    const backup = await db.meta.get('_migration_raw_backup')
    expect(backup?.value).toBe(OLD_DATA)
  })
})
