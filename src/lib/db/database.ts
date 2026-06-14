import Dexie, { type EntityTable } from 'dexie'
import type { Project, Chapter, ProjectNote, Idea, LoreEntry, BackupEntry, Meta } from './schema'

class StoryForgeDB extends Dexie {
  projects!: EntityTable<Project, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  projectNotes!: EntityTable<ProjectNote, 'id'>
  ideas!: EntityTable<Idea, 'id'>
  loreEntries!: EntityTable<LoreEntry, 'id'>
  backups!: EntityTable<BackupEntry, 'id'>
  meta!: EntityTable<Meta, 'key'>

  constructor() {
    super('StoryForge')
    this.version(1).stores({
      projects:     'id, updatedAt',
      chapters:     'id, projectId, order, updatedAt',
      projectNotes: 'id, projectId, type, updatedAt',
      ideas:        'id, *tags, linkedProjectId, createdAt',
      backups:      'id, generation, createdAt',
      meta:         'key',
    })
    this.version(2).stores({
      projects:     'id, updatedAt',
      chapters:     'id, projectId, order, updatedAt',
      projectNotes: 'id, projectId, type, updatedAt',
      ideas:        'id, *tags, linkedProjectId, createdAt',
      loreEntries:  'id, projectId, type, *tags, createdAt',
      backups:      'id, generation, createdAt',
      meta:         'key',
    })
    this.version(3).stores({
      projects:     'id, updatedAt',
      chapters:     'id, projectId, order, updatedAt',
      projectNotes: 'id, projectId, type, updatedAt',
      ideas:        'id, *tags, linkedProjectId, createdAt',
      loreEntries:  'id, projectId, type, *tags, createdAt',
      backups:      'id, generation, createdAt',
      meta:         'key',
    }).upgrade(tx => {
      return tx.table('ideas').toCollection().modify(idea => {
        if (idea.title === undefined) idea.title = ''
      })
    })
    this.version(4).stores({
      projects:     'id, updatedAt',
      chapters:     'id, projectId, order, updatedAt',
      projectNotes: 'id, projectId, type, updatedAt',
      ideas:        'id, *tags, linkedProjectId, createdAt, isTrash',
      loreEntries:  'id, projectId, type, *tags, createdAt',
      backups:      'id, generation, createdAt',
      meta:         'key',
    })
  }
}

export const db = new StoryForgeDB()
