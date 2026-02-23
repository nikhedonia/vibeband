import { createServerFn } from '@tanstack/react-start'
import { eq, asc } from 'drizzle-orm'
import { db } from './index.ts'
import * as schema from './schema.ts'

// ── Projects ──────────────────────────────────────────────────────────────────

export const getProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(schema.projects)
      .orderBy(asc(schema.projects.createdAt))
      .all()
  },
)

export const createProject = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string; description?: string }) => data)
  .handler(async ({ data }) => {
    const DEFAULT_COLUMNS = [
      'Backlog',
      'Todo',
      'In Progress',
      'Testing',
      'In Review',
      'Done',
    ]
    const [project] = await db
      .insert(schema.projects)
      .values({ name: data.name, description: data.description ?? '' })
      .returning()
    for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
      await db
        .insert(schema.columns)
        .values({ projectId: project.id, name: DEFAULT_COLUMNS[i], position: i })
    }
    return project
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await db.delete(schema.projects).where(eq(schema.projects.id, data.id))
  })

// ── Columns ───────────────────────────────────────────────────────────────────

export const getColumns = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: number }) => data)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(schema.columns)
      .where(eq(schema.columns.projectId, data.projectId))
      .orderBy(asc(schema.columns.position))
      .all()
  })

export const createColumn = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: number; name: string; position: number }) => data)
  .handler(async ({ data }) => {
    const [col] = await db
      .insert(schema.columns)
      .values(data)
      .returning()
    return col
  })

export const updateColumn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; name: string }) => data)
  .handler(async ({ data }) => {
    await db
      .update(schema.columns)
      .set({ name: data.name })
      .where(eq(schema.columns.id, data.id))
  })

export const deleteColumn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await db.delete(schema.columns).where(eq(schema.columns.id, data.id))
  })

// ── Tickets ───────────────────────────────────────────────────────────────────

export const getTickets = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: number }) => data)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(schema.tickets)
      .where(eq(schema.tickets.projectId, data.projectId))
      .orderBy(asc(schema.tickets.position))
      .all()
  })

export const createTicket = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { projectId: number; columnId: number; title: string; position: number }) =>
      data,
  )
  .handler(async ({ data }) => {
    const [ticket] = await db.insert(schema.tickets).values(data).returning()
    return ticket
  })

export const updateTicket = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: number; title?: string; content?: string; columnId?: number; position?: number }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { id, ...rest } = data
    const [ticket] = await db
      .update(schema.tickets)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(schema.tickets.id, id))
      .returning()
    return ticket
  })

export const deleteTicket = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await db.delete(schema.tickets).where(eq(schema.tickets.id, data.id))
  })

// ── Board data (project + columns + tickets in one call) ──────────────────────

export const getBoardData = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: number }) => data)
  .handler(async ({ data }) => {
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, data.projectId))
      .limit(1)
    if (!project) throw new Error('Project not found')
    const cols = await db
      .select()
      .from(schema.columns)
      .where(eq(schema.columns.projectId, data.projectId))
      .orderBy(asc(schema.columns.position))
      .all()
    const tix = await db
      .select()
      .from(schema.tickets)
      .where(eq(schema.tickets.projectId, data.projectId))
      .orderBy(asc(schema.tickets.position))
      .all()
    return { project, columns: cols, tickets: tix }
  })
