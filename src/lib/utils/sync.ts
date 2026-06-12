import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { exportAll, importFromJSON } from './exportImport'

export function isConfigured(): boolean {
  return !!(import.meta.env.VITE_FIREBASE_PROJECT_ID)
}

export async function pushSync(userId: string): Promise<void> {
  const data = await exportAll()
  if (data.length > 800_000) {
    throw new Error(`データサイズが大きすぎます（${Math.round(data.length / 1024)}KB）。不要なデータを削除してください。`)
  }
  await setDoc(doc(db, 'syncs', userId), {
    data,
    updated_at: new Date().toISOString(),
  })
}

export async function cloudExists(userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'syncs', userId))
  return snap.exists()
}

export async function pullSync(userId: string): Promise<{ projects: number; chapters: number }> {
  const snap = await getDoc(doc(db, 'syncs', userId))
  if (!snap.exists()) throw new Error('クラウドにデータが見つかりません')
  const { data } = snap.data() as { data: string }
  return importFromJSON(data)
}
