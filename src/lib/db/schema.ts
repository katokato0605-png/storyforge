export type ChapterStatus = 'draft' | 'writing' | 'review' | 'done'
export type NoteType = 'plot' | 'character' | 'world' | 'memo' | 'lore' | 'timeline'

export interface Project {
  id: string
  title: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface Chapter {
  id: string
  projectId: string
  title: string
  content: string
  plotMemo: string
  status: ChapterStatus
  order: number
  wordCount: number
  createdAt: number
  updatedAt: number
}

export interface ProjectNote {
  id: string
  projectId: string
  type: NoteType
  content: string
  updatedAt: number
}

export interface Idea {
  id: string
  title: string
  content: string
  tags: string[]
  linkedProjectId: string | null
  createdAt: number
  isTrash?: boolean
  deletedAt?: number
}

export type LoreType = 'character' | 'world' | 'lore'

export interface LoreEntry {
  id: string
  projectId: string
  type: LoreType
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface BackupEntry {
  id: string
  generation: 1 | 2 | 3
  data: string
  createdAt: number
}

export interface Meta {
  key: string
  value: unknown
}

export interface TabImage {
  id: string
  projectId: string
  tabId: string
  name: string
  dataUrl: string
  createdAt: number
}
