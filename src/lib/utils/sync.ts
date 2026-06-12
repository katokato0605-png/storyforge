import { doc, setDoc, getDoc } from 'firebase/firestore'
import { firestore } from '../firebase'
import { exportAll, importFromJSON } from './exportImport'
import { projectStore } from '../stores/projectStore.svelte'
import { chapterStore } from '../stores/chapterStore.svelte'
import { noteStore } from '../stores/noteStore.svelte'
import { ideaStore } from '../stores/ideaStore.svelte'
import { loreStore } from '../stores/loreStore.svelte'

export function isConfigured(): boolean {
  return !!(import.meta.env.VITE_FIREBASE_API_KEY)
}

export async function pushSync(uid: string): Promise<void> {
  const data = await exportAll()
  if (data.length > 900_000) {
    throw new Error(`データサイズが大きすぎます（${Math.round(data.length / 1024)}KB）。不要なデータを削除してください。`)
  }
  const ref = doc(firestore, 'syncs', uid)
  await setDoc(ref, { data, updatedAt: Date.now() })
}

export async function pullSync(uid: string): Promise<{ projects: number; chapters: number; lore: number }> {
  const ref = doc(firestore, 'syncs', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('クラウドにデータが見つかりません。まず別の端末からアップロードしてください。')
  const { data } = snap.data() as { data: string }
  const result = await importFromJSON(data)

  // ストアをリロード
  await projectStore.load()
  const pid = projectStore.currentProjectId
  if (pid) {
    await chapterStore.load(pid)
    noteStore.invalidate()
    await noteStore.load(pid)
    await loreStore.load(pid)
  }
  await ideaStore.reload()

  return result
}
