import { db } from '../db/database'
import { exportAll } from './exportImport'
import { nanoid } from 'nanoid'

export async function createBackup(): Promise<void> {
  const json = await exportAll()

  // Keep latest 3 backups, oldest first
  const existing = await db.backups.orderBy('createdAt').toArray()
  if (existing.length >= 3) {
    await db.backups.delete(existing[0].id)
  }

  const gen = Math.min(existing.length + 1, 3) as 1 | 2 | 3
  await db.backups.put({ id: nanoid(), generation: gen, data: json, createdAt: Date.now() })
  await db.meta.put({ key: '_lastBackup', value: Date.now() })
}

export async function listBackups() {
  return db.backups.orderBy('createdAt').reverse().toArray()
}

export async function restoreBackup(id: string): Promise<void> {
  const entry = await db.backups.get(id)
  if (!entry) throw new Error('バックアップが見つかりません')
  const { importFromJSON } = await import('./exportImport')
  await importFromJSON(entry.data)
}

export async function getLastBackupTime(): Promise<number | null> {
  const meta = await db.meta.get('_lastBackup')
  return meta ? (meta.value as number) : null
}
