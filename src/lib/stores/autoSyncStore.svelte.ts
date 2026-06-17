import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'
import { pushSync, pullSync, cloudExists, watchSync } from '../utils/sync'
import { projectStore } from './projectStore.svelte'
import { chapterStore } from './chapterStore.svelte'
import { noteStore } from './noteStore.svelte'
import { ideaStore } from './ideaStore.svelte'

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

let status = $state<SyncStatus>('idle')
let lastSyncedAt = $state<Date | null>(null)
let errorMessage = $state<string | null>(null)
let lastPushedAt: string | null = null
let intervalId: ReturnType<typeof setInterval> | null = null
let unsubWatch: (() => void) | null = null
let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null

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
    lastPushedAt = new Date().toISOString()
    status = 'ok'
    lastSyncedAt = new Date()
  } catch (e) {
    status = 'error'
    errorMessage = (e as Error).message
  }
}

async function runPull(uid: string) {
  status = 'syncing'
  errorMessage = null
  try {
    await pullSync(uid)
    await reloadStores()
    lastSyncedAt = new Date()
    status = 'ok'
  } catch (e) {
    status = 'error'
    errorMessage = (e as Error).message
  }
}

function schedulePush(uid: string) {
  if (pushDebounceTimer) clearTimeout(pushDebounceTimer)
  pushDebounceTimer = setTimeout(() => runPush(uid), 10_000)
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
      lastPushedAt = new Date().toISOString()
    }
    status = 'ok'
    lastSyncedAt = new Date()
  } catch (e) {
    status = 'error'
    errorMessage = (e as Error).message
  }

  // 他デバイスの変更を onSnapshot でリアルタイム検知して自動 pull
  unsubWatch?.()
  unsubWatch = watchSync(
    user.uid,
    () => runPull(user.uid),
    () => lastPushedAt,
  )

  // 定期 push（10秒デバウンスで push された分のバックアップ）
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(() => runPush(user.uid), 60_000)

  // 編集イベント（sf:dirty）で即時デバウンス push
  window.addEventListener('sf:dirty', () => schedulePush(user.uid))
}

function onLogout() {
  if (intervalId) { clearInterval(intervalId); intervalId = null }
  unsubWatch?.(); unsubWatch = null
  if (pushDebounceTimer) { clearTimeout(pushDebounceTimer); pushDebounceTimer = null }
  status = 'idle'
  lastSyncedAt = null
  lastPushedAt = null
  errorMessage = null
}

let _loginInFlight = false

let _unsubAuth: (() => void) | null = null
if (auth) {
  _unsubAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (_loginInFlight) return
      _loginInFlight = true
      try { await onLogin(user) } finally { _loginInFlight = false }
    } else {
      onLogout()
    }
  })
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    _unsubAuth?.()
    if (intervalId) { clearInterval(intervalId); intervalId = null }
    unsubWatch?.(); unsubWatch = null
  })
}

export const autoSyncStore = {
  get status() { return status },
  get lastSyncedAt() { return lastSyncedAt },
  get errorMessage() { return errorMessage },
  async syncNow(uid: string) { await runPush(uid) },
}
