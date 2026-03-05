import { eq, asc } from 'drizzle-orm'
import { db } from './index.ts'
import * as schema from './schema.ts'

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjectsFn() {
  return db
    .select()
    .from(schema.projects)
    .orderBy(asc(schema.projects.createdAt))
    .all()
}

export async function createProjectFn(data: { name: string; description?: string; repoUrl?: string }) {
  const DEFAULT_COLUMNS = [
    'Backlog', 'Todo', 'In Progress', 'Testing', 'In Review', 'Done',
  ]
  const [project] = await db
    .insert(schema.projects)
    .values({
      name: data.name,
      description: data.description ?? '',
      repoUrl: data.repoUrl ?? '',
    })
    .returning()
  for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
    await db
      .insert(schema.columns)
      .values({ projectId: project.id, name: DEFAULT_COLUMNS[i], position: i })
  }
  return project
}

export async function deleteProjectFn(data: { id: number }) {
  await db.delete(schema.projects).where(eq(schema.projects.id, data.id))
}

export async function updateProjectFn(data: { id: number; name?: string; description?: string; repoUrl?: string }) {
  const updates: Partial<typeof schema.projects.$inferInsert> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description
  if (data.repoUrl !== undefined) updates.repoUrl = data.repoUrl
  const [project] = await db
    .update(schema.projects)
    .set(updates)
    .where(eq(schema.projects.id, data.id))
    .returning()
  return project
}

// ── Columns ───────────────────────────────────────────────────────────────────

export async function getColumnsFn(data: { projectId: number }) {
  return db
    .select()
    .from(schema.columns)
    .where(eq(schema.columns.projectId, data.projectId))
    .orderBy(asc(schema.columns.position))
    .all()
}

export async function createColumnFn(data: { projectId: number; name: string; position: number }) {
  const [col] = await db.insert(schema.columns).values(data).returning()
  return col
}

export async function updateColumnFn(data: { id: number; name: string }) {
  await db.update(schema.columns).set({ name: data.name }).where(eq(schema.columns.id, data.id))
}

export async function deleteColumnFn(data: { id: number }) {
  await db.delete(schema.columns).where(eq(schema.columns.id, data.id))
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export async function getTicketsFn(data: { projectId: number }) {
  return db
    .select()
    .from(schema.tickets)
    .where(eq(schema.tickets.projectId, data.projectId))
    .orderBy(asc(schema.tickets.position))
    .all()
}

export async function createTicketFn(data: { projectId: number; columnId: number; title: string; position: number }) {
  const [ticket] = await db.insert(schema.tickets).values(data).returning()
  return ticket
}

export async function updateTicketFn(data: { id: number; title?: string; content?: string; columnId?: number; position?: number }) {
  const { id, ...rest } = data
  const [ticket] = await db
    .update(schema.tickets)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(schema.tickets.id, id))
    .returning()
  return ticket
}

export async function deleteTicketFn(data: { id: number }) {
  await db.delete(schema.tickets).where(eq(schema.tickets.id, data.id))
}

// ── Board data ────────────────────────────────────────────────────────────────

export async function getBoardDataFn(data: { projectId: number }) {
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
}

// Re-exports for backward compatibility
export const getProjects = getProjectsFn
export const createProject = createProjectFn
export const deleteProject = deleteProjectFn
export const updateProject = updateProjectFn
export const getColumns = getColumnsFn
export const createColumn = createColumnFn
export const updateColumn = updateColumnFn
export const deleteColumn = deleteColumnFn
export const getTickets = getTicketsFn
export const createTicket = createTicketFn
export const updateTicket = updateTicketFn
export const deleteTicket = deleteTicketFn
export const getBoardData = getBoardDataFn
