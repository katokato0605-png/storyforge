import * as v from 'valibot'
import { nanoid } from 'nanoid'
import { db } from './database'
import type { Project, Chapter, ProjectNote, Idea } from './schema'

// ── 旧フォーマットのスキーマ定義 ──────────────────────────────────────────

const OldChapterSchema = v.object({
  id:        v.optional(v.string()),
  title:     v.optional(v.string(), '無題'),
  content:   v.optional(v.string(), ''),
  plotMemo:  v.optional(v.string(), ''),
  status:    v.optional(v.picklist(['draft', 'writing', 'review', 'done']), 'draft'),
  order:     v.optional(v.number(), 0),
  wordCount: v.optional(v.number(), 0),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})

const OldProjectSchema = v.object({
  id:          v.optional(v.string()),
  title:       v.optional(v.string(), '無題'),
  description: v.optional(v.string(), ''),
  chapters:    v.optional(v.array(OldChapterSchema), []),
  plotNote:    v.optional(v.string(), ''),
  characterNote: v.optional(v.string(), ''),
  worldNote:   v.optional(v.string(), ''),
  memoNote:    v.optional(v.string(), ''),
  loreNote:    v.optional(v.string(), ''),
  createdAt:   v.optional(v.number()),
  updatedAt:   v.optional(v.number()),
})

const OldIdeaSchema = v.object({
  id:               v.optional(v.string()),
  content:          v.optional(v.string(), ''),
  tags:             v.optional(v.array(v.string()), []),
  linkedProjectId:  v.optional(v.nullable(v.string()), null),
  createdAt:        v.optional(v.number()),
})

const OldRootSchema = v.object({
  projects: v.optional(v.array(OldProjectSchema), []),
  ideas:    v.optional(v.array(OldIdeaSchema), []),
})

// ── パース ────────────────────────────────────────────────────────────────

function safeParseOldFormat(raw: string) {
  const json = JSON.parse(raw)
  return v.parse(OldRootSchema, json)
}

// ── メイン ────────────────────────────────────────────────────────────────

export async function runMigrationIfNeeded(): Promise<void> {
  const done = await db.meta.get('_migrated')
  if (done) return

  const raw = localStorage.getItem('storyforge_v2')
  if (!raw) {
    await db.meta.put({ key: '_migrated', value: true })
    return
  }

  // rollback 用に生データを保存
  await db.meta.put({ key: '_migration_raw_backup', value: raw })

  let parsed: v.InferOutput<typeof OldRootSchema>
  try {
    parsed = safeParseOldFormat(raw)
  } catch {
    // パース失敗でも migrated フラグを立てて二重実行を防ぐ
    await db.meta.put({ key: '_migrated', value: true })
    await db.meta.put({ key: '_migration_parse_error', value: true })
    return
  }

  const now = Date.now()
  const projects: Project[] = []
  const chapters: Chapter[] = []
  const projectNotes: ProjectNote[] = []

  for (const p of parsed.projects) {
    const projectId = p.id ?? nanoid()
    projects.push({
      id:          projectId,
      title:       p.title ?? '無題',
      description: p.description ?? '',
      createdAt:   p.createdAt ?? now,
      updatedAt:   p.updatedAt ?? now,
    })

    for (const [i, c] of (p.chapters ?? []).entries()) {
      const chapterId = c.id ?? nanoid()
      chapters.push({
        id:        chapterId,
        projectId,
        title:     c.title ?? '無題',
        content:   c.content ?? '',
        plotMemo:  c.plotMemo ?? '',
        status:    c.status ?? 'draft',
        order:     c.order ?? i,
        wordCount: c.wordCount ?? [...(c.content ?? '')].length,
        createdAt: c.createdAt ?? now,
        updatedAt: c.updatedAt ?? now,
      })
    }

    const noteTypes = [
      { field: 'plotNote',      type: 'plot' },
      { field: 'characterNote', type: 'character' },
      { field: 'worldNote',     type: 'world' },
      { field: 'memoNote',      type: 'memo' },
      { field: 'loreNote',      type: 'lore' },
    ] as const

    for (const { field, type } of noteTypes) {
      const content = (p as Record<string, unknown>)[field] as string | undefined
      if (content) {
        projectNotes.push({
          id:        nanoid(),
          projectId,
          type,
          content,
          updatedAt: now,
        })
      }
    }
  }

  const ideas: Idea[] = (parsed.ideas ?? []).map((idea) => ({
    id:              idea.id ?? nanoid(),
    content:         idea.content ?? '',
    tags:            idea.tags ?? [],
    linkedProjectId: idea.linkedProjectId ?? null,
    createdAt:       idea.createdAt ?? now,
  }))

  await db.transaction('rw', [db.projects, db.chapters, db.projectNotes, db.ideas, db.meta], async () => {
    if (projects.length)     await db.projects.bulkPut(projects)
    if (chapters.length)     await db.chapters.bulkPut(chapters)
    if (projectNotes.length) await db.projectNotes.bulkPut(projectNotes)
    if (ideas.length)        await db.ideas.bulkPut(ideas)
    await db.meta.put({ key: '_migrated', value: true })
  })
}
