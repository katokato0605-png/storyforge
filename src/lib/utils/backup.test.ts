import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '../db/database'
import { createBackup, listBackups, restoreBackup } from './backup'

beforeEach(async () => {
  await db.projects.clear()
  await db.chapters.clear()
  await db.projectNotes.clear()
  await db.ideas.clear()
  await db.backups.clear()
  await db.meta.clear()
})

describe('createBackup', () => {
  it('バックアップエントリを作成する', async () => {
    await createBackup()
    const backups = await db.backups.toArray()
    expect(backups).toHaveLength(1)
    expect(typeof backups[0].data).toBe('string')
    expect(backups[0].createdAt).toBeGreaterThan(0)
  })

  it('_lastBackup メタを更新する', async () => {
    await createBackup()
    const meta = await db.meta.get('_lastBackup')
    expect(meta?.value).toBeGreaterThan(0)
  })

  it('3件を超えると古いものをローテーションする', async () => {
    await createBackup()
    await createBackup()
    await createBackup()
    await createBackup() // 4回目
    const backups = await db.backups.toArray()
    expect(backups).toHaveLength(3)
  })

  it('ローテーション後も最新のデータが保持される', async () => {
    await db.projects.put({ id: 'old', title: '古い作品', description: '', createdAt: 1, updatedAt: 1 })
    await createBackup()

    await db.projects.clear()
    await db.projects.put({ id: 'new', title: '新しい作品', description: '', createdAt: 2, updatedAt: 2 })
    await createBackup()
    await createBackup()
    await createBackup() // ローテーション発生

    const backups = await listBackups()
    expect(backups).toHaveLength(3)
    // 最新バックアップには新しい作品が含まれる
    const latest = JSON.parse(backups[0].data)
    expect(latest.projects.some((p: { id: string }) => p.id === 'new')).toBe(true)
  })
})

describe('listBackups', () => {
  it('新しい順で返す', async () => {
    await createBackup()
    await new Promise(r => setTimeout(r, 5)) // 時刻差をつける
    await createBackup()
    const backups = await listBackups()
    expect(backups[0].createdAt).toBeGreaterThanOrEqual(backups[1].createdAt)
  })

  it('バックアップなしのとき空配列', async () => {
    const backups = await listBackups()
    expect(backups).toHaveLength(0)
  })
})

describe('restoreBackup', () => {
  it('指定したバックアップのデータを復元する', async () => {
    await db.projects.put({ id: 'snap', title: 'スナップショット', description: '', createdAt: 1, updatedAt: 1 })
    await createBackup()
    const [backup] = await listBackups()

    await db.projects.clear()
    expect(await db.projects.count()).toBe(0)

    await restoreBackup(backup.id)
    const projects = await db.projects.toArray()
    expect(projects.some(p => p.id === 'snap')).toBe(true)
  })

  it('存在しないIDは例外を投げる', async () => {
    await expect(restoreBackup('nonexistent')).rejects.toThrow()
  })
})
