import { db } from '../db/database'
import type { TabImage } from '../db/schema'

let images = $state<TabImage[]>([])
let status = $state<'idle' | 'loading' | 'ready'>('idle')

export const imageStore = {
  get images() { return images },
  get status() { return status },

  async load(projectId: string, tabId: string) {
    status = 'loading'
    images = await db.tabImages
      .where('[projectId+tabId]')
      .equals([projectId, tabId])
      .sortBy('createdAt')
    status = 'ready'
  },

  async add(projectId: string, tabId: string, name: string, dataUrl: string): Promise<void> {
    const entry: TabImage = {
      id: crypto.randomUUID(),
      projectId,
      tabId,
      name,
      dataUrl,
      createdAt: Date.now(),
    }
    await db.tabImages.add(entry)
    images = [...images, entry]
  },

  async remove(id: string) {
    await db.tabImages.delete(id)
    images = images.filter(img => img.id !== id)
  },
}
