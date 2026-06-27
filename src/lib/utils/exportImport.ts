import * as v from 'valibot'
import { db } from '../db/database'
import type { DiagramData } from '../db/schema'

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
  status: v.picklist(['draft', 'writing', 'review', 'done'] as const),
  order: v.number(),
  wordCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const ProjectNoteSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  type: v.picklist(['plot', 'character', 'world', 'memo', 'lore', 'timeline'] as const),
  content: v.string(),
  updatedAt: v.number(),
})

const IdeaSchema = v.object({
  id: v.string(),
  title: v.optional(v.string(), ''),
  content: v.string(),
  tags: v.array(v.string()),
  linkedProjectId: v.nullable(v.string()),
  createdAt: v.number(),
  isTrash: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
  // imageUrl はサイズが大きいため同期対象外（デバイスローカルのみ）
})

const LoreEntrySchema = v.object({
  id: v.string(),
  projectId: v.string(),
  type: v.picklist(['character', 'world', 'lore'] as const),
  title: v.string(),
  content: v.string(),
  tags: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const DiagramDataSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  diagrams: v.unknown(),
  nodes: v.record(v.string(), v.array(v.unknown())),
  edges: v.record(v.string(), v.array(v.unknown())),
  updatedAt: v.number(),
})

const MetaEntrySchema = v.object({
  key: v.string(),
  value: v.unknown(),
})

const ExportDataSchema = v.object({
  version: v.literal(5),
  exportedAt: v.number(),
  projects: v.array(ProjectSchema),
  chapters: v.array(ChapterSchema),
  projectNotes: v.array(ProjectNoteSchema),
  ideas: v.array(IdeaSchema),
  loreEntries: v.array(LoreEntrySchema),
  diagramData: v.optional(v.array(DiagramDataSchema), []),
  metaEntries: v.optional(v.array(MetaEntrySchema), []),
})

// v4 (legacy) — no diagrams, no metaEntries
const ExportDataSchemaV4 = v.object({
  version: v.literal(4),
  exportedAt: v.number(),
  projects: v.array(ProjectSchema),
  chapters: v.array(ChapterSchema),
  projectNotes: v.array(ProjectNoteSchema),
  ideas: v.array(IdeaSchema),
  loreEntries: v.array(LoreEntrySchema),
})

// v3 (legacy) — loreEntries absent
const ExportDataSchemaV3 = v.object({
  version: v.literal(3),
  exportedAt: v.number(),
  projects: v.array(ProjectSchema),
  chapters: v.array(ChapterSchema),
  projectNotes: v.array(ProjectNoteSchema),
  ideas: v.array(IdeaSchema),
})

type ExportData = v.InferOutput<typeof ExportDataSchema>
type MetaEntry = v.InferOutput<typeof MetaEntrySchema>

// ---- public API ----

export async function exportAll(): Promise<string> {
  const [projects, chapters, projectNotes, ideas, loreEntries, diagramData, allMeta] = await Promise.all([
    db.projects.toArray(),
    db.chapters.toArray(),
    db.projectNotes.toArray(),
    db.ideas.toArray(),
    db.loreEntries.toArray(),
    db.diagrams.toArray(),
    db.meta.toArray(),
  ])
  const metaEntries: MetaEntry[] = allMeta
    .filter(m => typeof m.key === 'string' && m.key.startsWith('sf_name_'))
    .map(m => ({ key: m.key, value: m.value }))
  const data: ExportData = {
    version: 5,
    exportedAt: Date.now(),
    projects, chapters, projectNotes, ideas, loreEntries, diagramData, metaEntries,
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

export async function importFromJSON(json: string): Promise<{ projects: number; chapters: number; lore: number }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('JSONの解析に失敗しました')
  }

  // v5 (current - includes diagrams + metaEntries)
  const v5 = v.safeParse(ExportDataSchema, parsed)
  if (v5.success) {
    const data = v5.output
    await db.transaction('rw', [db.projects, db.chapters, db.projectNotes, db.ideas, db.loreEntries, db.diagrams, db.meta], async () => {
      if (data.projects.length)     await db.projects.bulkPut(data.projects)
      if (data.chapters.length)     await db.chapters.bulkPut(data.chapters)
      if (data.projectNotes.length) await db.projectNotes.bulkPut(data.projectNotes)
      if (data.ideas.length) {
        // imageUrl はエクスポートに含まれないため、既存の imageUrl を保持してマージ
        for (const incoming of data.ideas) {
          const existing = await db.ideas.get(incoming.id)
          await db.ideas.put(existing ? { ...existing, ...incoming } : incoming)
        }
      }
      if (data.loreEntries.length)  await db.loreEntries.bulkPut(data.loreEntries)
      if (data.diagramData && data.diagramData.length) await db.diagrams.bulkPut(data.diagramData as DiagramData[])
      if (data.metaEntries && data.metaEntries.length) await db.meta.bulkPut(data.metaEntries)
    })
    return { projects: data.projects.length, chapters: data.chapters.length, lore: data.loreEntries.length }
  }

  // v4 fallback (no diagrams, no metaEntries)
  const r4 = v.safeParse(ExportDataSchemaV4, parsed)
  if (r4.success) {
    const data = r4.output
    await db.transaction('rw', [db.projects, db.chapters, db.projectNotes, db.ideas, db.loreEntries], async () => {
      if (data.projects.length)     await db.projects.bulkPut(data.projects)
      if (data.chapters.length)     await db.chapters.bulkPut(data.chapters)
      if (data.projectNotes.length) await db.projectNotes.bulkPut(data.projectNotes)
      if (data.ideas.length) {
        for (const incoming of data.ideas) {
          const existing = await db.ideas.get(incoming.id)
          await db.ideas.put(existing ? { ...existing, ...incoming } : incoming)
        }
      }
      if (data.loreEntries.length)  await db.loreEntries.bulkPut(data.loreEntries)
    })
    return { projects: data.projects.length, chapters: data.chapters.length, lore: data.loreEntries.length }
  }

  const v3 = v.safeParse(ExportDataSchemaV3, parsed)
  if (v3.success) {
    const data = v3.output
    await db.transaction('rw', [db.projects, db.chapters, db.projectNotes, db.ideas], async () => {
      if (data.projects.length)     await db.projects.bulkPut(data.projects)
      if (data.chapters.length)     await db.chapters.bulkPut(data.chapters)
      if (data.projectNotes.length) await db.projectNotes.bulkPut(data.projectNotes)
      if (data.ideas.length)        await db.ideas.bulkPut(data.ideas)
    })
    return { projects: data.projects.length, chapters: data.chapters.length, lore: 0 }
  }

  throw new Error('無効なデータ形式です（バージョンまたは構造が一致しません）')
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
