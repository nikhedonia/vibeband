import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const todos = sqliteTable('todos', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  title: text().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const projects = sqliteTable('projects', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text().default(''),
  repoUrl: text('repo_url').default(''),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const columns = sqliteTable('columns', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  projectId: integer('project_id', { mode: 'number' })
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  position: integer({ mode: 'number' }).notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const tickets = sqliteTable('tickets', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  projectId: integer('project_id', { mode: 'number' })
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  columnId: integer('column_id', { mode: 'number' })
    .notNull()
    .references(() => columns.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  content: text().default(''),
  position: integer({ mode: 'number' }).notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const auditLog = sqliteTable('audit_log', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(),
  message: text().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})
