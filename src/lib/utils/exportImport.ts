import * as v from 'valibot'
import { db } from '../db/database'

// ---- valibot schemas ----

const ProjectSchema = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const ChapterSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  title: v.string(),
  content: v.string(),
  plotMemo: v.string(),
  status: v.picklist(['draft', 'writing', 'review', 'done']),
  order: v.number(),
  wordCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const ProjectNoteSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  type: v.picklist(['plot', 'character', 'world', 'memo', 'lore', 'timeline']),
  content: v.string(),
  updatedAt: v.number(),
})

const IdeaSchema = v.object({
  id: v.string(),
  content: v.string(),
  tags: v.array(v.string()),
  linkedProjectId: v.nullable(v.string()),
  createdAt: v.number(),
})

const ExportDataSchema = v.object({
  version: v.literal(3),
  exportedAt: v.number(),
  projects: v.array(ProjectSchema),
  chapters: v.array(ChapterSchema),
  projectNotes: v.array(ProjectNoteSchema),
  ideas: v.array(IdeaSchema),
})

type ExportData = v.InferOutput<typeof ExportDataSchema>

// ---- public API ----

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
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('JSONの解析に失敗しました')
  }

  const result = v.safeParse(ExportDataSchema, parsed)
  if (!result.success) {
    throw new Error('無効なデータ形式です（バージョンまたは構造が一致しません）')
  }
  const data = result.output

  await db.transaction('rw', [db.projects, db.chapters, db.projectNotes, db.ideas], async () => {
    if (data.projects.length)     await db.projects.bulkPut(data.projects)
    if (data.chapters.length)     await db.chapters.bulkPut(data.chapters)
    if (data.projectNotes.length) await db.projectNotes.bulkPut(data.projectNotes)
    if (data.ideas.length)        await db.ideas.bulkPut(data.ideas)
  })

  return { projects: data.projects.length, chapters: data.chapters.length }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
