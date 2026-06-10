import { db } from '../db/database'
import type { Project, Chapter, ProjectNote, Idea } from '../db/schema'

interface ExportData {
  version: 3
  exportedAt: number
  projects: Project[]
  chapters: Chapter[]
  projectNotes: ProjectNote[]
  ideas: Idea[]
}

export async function exportAll(): Promise<string> {
  const [projects, chapters, projectNotes, ideas] = await Promise.all([
    db.projects.toArray(),
    db.chapters.toArray(),
    db.projectNotes.toArray(),
    db.ideas.toArray(),
  ])
  const data: ExportData = {
    version: 3,
    exportedAt: Date.now(),
    projects, chapters, projectNotes, ideas,
  }
  return JSON.stringify(data, null, 2)
}

export function downloadJSON(json: string) {
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `storyforge-${date}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function importFromJSON(json: string): Promise<{ projects: number; chapters: number }> {
  let data: ExportData
  try {
    data = JSON.parse(json) as ExportData
  } catch {
    throw new Error('JSONの解析に失敗しました')
  }
  if (!Array.isArray(data.projects)) throw new Error('無効なデータ形式です')

  await db.transaction('rw', [db.projects, db.chapters, db.projectNotes, db.ideas], async () => {
    if (data.projects?.length)     await db.projects.bulkPut(data.projects)
    if (data.chapters?.length)     await db.chapters.bulkPut(data.chapters)
    if (data.projectNotes?.length) await db.projectNotes.bulkPut(data.projectNotes)
    if (data.ideas?.length)        await db.ideas.bulkPut(data.ideas)
  })

  return { projects: data.projects.length, chapters: data.chapters?.length ?? 0 }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
