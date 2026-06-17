import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { exportAll, importFromJSON } from './exportImport'

export function isConfigured(): boolean {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  )
}

export async function pushSync(userId: string): Promise<void> {
  if (!db) throw new Error('Firebase が設定されていません')
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
  if (!db) return false
  const snap = await getDoc(doc(db, 'syncs', userId))
  return snap.exists()
}

/**
 * Firestore のリアルタイムリスナーを張り、別デバイスが push した際に
 * onRemoteChange を呼ぶ。自分の push による変化は ownUpdatedAt より古ければ無視。
 * 返り値は unsubscribe 関数。
 */
export function watchSync(
  userId: string,
  onRemoteChange: (updatedAt: string) => void,
  getOwnLastPushedAt: () => string | null,
): () => void {
  if (!db) return () => {}
  const docRef = doc(db, 'syncs', userId)
  let initialized = false
  const unsub = onSnapshot(docRef, (snap) => {
    if (!snap.exists()) return
    const { updated_at } = snap.data() as { updated_at: string }
    if (!initialized) { initialized = true; return }
    const own = getOwnLastPushedAt()
    // own push から2秒以内の変化は無視（自分の push による echo）
    if (own && new Date(updated_at).getTime() <= new Date(own).getTime() + 2000) return
    onRemoteChange(updated_at)
  })
  return unsub
}

export async function pullSync(userId: string): Promise<{ projects: number; chapters: number }> {
  if (!db) throw new Error('Firebase が設定されていません')
  const snap = await getDoc(doc(db, 'syncs', userId))
  if (!snap.exists()) throw new Error('クラウドにデータが見つかりません')
  const { data } = snap.data() as { data: string }
  return importFromJSON(data)
}
