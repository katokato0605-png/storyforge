import { db } from '../db/database'
import type { Project } from '../db/schema'
import { nanoid } from 'nanoid'

let projects = $state<Project[]>([])
let currentProjectId = $state<string | null>(null)
let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle')

export const projectStore = {
  get projects() { return projects },
  get currentProjectId() { return currentProjectId },
  get currentProject() { return projects.find(p => p.id === currentProjectId) ?? null },
  get status() { return status },

  async load() {
    status = 'loading'
    try {
      projects = await db.projects.orderBy('updatedAt').reverse().toArray()
      status = 'ready'
    } catch {
      status = 'error'
    }
  },

  selectProject(id: string | null) {
    currentProjectId = id
  },

  async createProject(title: string, description = '') {
    const now = Date.now()
    const project: Project = { id: nanoid(), title, description, createdAt: now, updatedAt: now }
    await db.projects.put(project)
    projects = [project, ...projects]
    window.dispatchEvent(new CustomEvent('sf:dirty'))
    return project
  },

  async updateProject(id: string, patch: Partial<Pick<Project, 'title' | 'description'>>) {
    const now = Date.now()
    await db.projects.update(id, { ...patch, updatedAt: now })
    projects = projects.map(p => p.id === id ? { ...p, ...patch, updatedAt: now } : p)
    window.dispatchEvent(new CustomEvent('sf:dirty'))
  },

  async deleteProject(id: string) {
    await db.transaction('rw', [db.projects, db.chapters, db.projectNotes, db.ideas], async () => {
      await db.projects.delete(id)
      await db.chapters.where('projectId').equals(id).delete()
      await db.projectNotes.where('projectId').equals(id).delete()
      await db.ideas.where('linkedProjectId').equals(id).modify({ linkedProjectId: null })
    })
    projects = projects.filter(p => p.id !== id)
    if (currentProjectId === id) currentProjectId = null
  },
}
