import { db } from '../db/database'

export function isFSASupported(): boolean {
  return 'showSaveFilePicker' in window
}

// In-memory handle for the current session
let _handle: FileSystemFileHandle | null = null
let _active = $state(false)

export const fsaStore = {
  get active() { return _active },
}

export async function tryRestoreHandle(): Promise<boolean> {
  if (!isFSASupported()) return false
  try {
    const meta = await db.meta.get('_fsaHandle')
    if (!meta) return false
    const handle = meta.value as FileSystemFileHandle
    const perm = await handle.queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') {
      _handle = handle
      _active = true
      return true
    }
    // Try requesting permission
    const req = await handle.requestPermission({ mode: 'readwrite' })
    if (req === 'granted') {
      _handle = handle
      _active = true
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function enableFileMode(): Promise<boolean> {
  if (!isFSASupported()) return false
  try {
    const handle = await (window as unknown as {
      showSaveFilePicker(opts: object): Promise<FileSystemFileHandle>
    }).showSaveFilePicker({
      suggestedName: 'storyforge-autosave.json',
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    })
    _handle = handle
    _active = true
    await db.meta.put({ key: '_fsaHandle', value: handle })
    return true
  } catch {
    return false
  }
}

export async function disableFileMode(): Promise<void> {
  _handle = null
  _active = false
  await db.meta.delete('_fsaHandle')
}

export async function writeAutoSave(json: string): Promise<void> {
  if (!_handle) return
  try {
    const writable = await _handle.createWritable()
    await writable.write(json)
    await writable.close()
  } catch {
    // Handle became invalid (file deleted, permissions revoked)
    _active = false
    _handle = null
  }
}
