import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'
import { pushSync, pullSync, cloudExists } from '../utils/sync'
import { projectStore } from './projectStore.svelte'
import { chapterStore } from './chapterStore.svelte'
import { noteStore } from './noteStore.svelte'
import { ideaStore } from './ideaStore.svelte'

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

let status = $state<SyncStatus>('idle')
let lastSyncedAt = $state<Date | null>(null)
let errorMessage = $state<string | null>(null)
let intervalId: ReturnType<typeof setInterval> | null = null

async function reloadStores() {
  await projectStore.load()
  const pid = projectStore.currentProjectId
  if (pid) {
    await chapterStore.load(pid)
    noteStore.invalidate()
    await noteStore.load(pid)
  }
  await ideaStore.reload()
}

async function runPush(uid: string) {
  status = 'syncing'
  errorMessage = null
  try {
    await pushSync(uid)
    status = 'ok'
    lastSyncedAt = new Date()
  } catch (e) {
    status = 'error'
    errorMessage = (e as Error).message
  }
}

async function onLogin(user: User) {
  status = 'syncing'
  errorMessage = null
  try {
    const hasCloud = await cloudExists(user.uid)
    if (hasCloud) {
      await pullSync(user.uid)
      await reloadStores()
    } else {
      await pushSync(user.uid)
    }
    status = 'ok'
    lastSyncedAt = new Date()
  } catch (e) {
    status = 'error'
    errorMessage = (e as Error).message
  }

  // 60秒ごとに自動プッシュ
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(() => runPush(user.uid), 60_000)
}

function onLogout() {
  if (intervalId) { clearInterval(intervalId); intervalId = null }
  status = 'idle'
  lastSyncedAt = null
  errorMessage = null
}

onAuthStateChanged(auth, (user) => {
  if (user) onLogin(user)
  else onLogout()
})

export const autoSyncStore = {
  get status() { return status },
  get lastSyncedAt() { return lastSyncedAt },
  get errorMessage() { return errorMessage },
  async syncNow(uid: string) { await runPush(uid) },
}
