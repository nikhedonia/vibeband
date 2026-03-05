import { desc } from 'drizzle-orm'
import { db } from './index.ts'
import * as schema from './schema.ts'

export type AuditEventType =
  | 'terminal_started'
  | 'terminal_exited'
  | 'terminal_closed'
  | 'workspace_destroyed'

export async function insertAuditEvent(eventType: AuditEventType, message: string) {
  db.insert(schema.auditLog).values({ eventType, message }).run()
}

export async function listAuditEventsFn() {
  return db
    .select()
    .from(schema.auditLog)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(200)
    .all()
}

export async function logAuditEventFn(data: { eventType: AuditEventType; message: string }) {
  await insertAuditEvent(data.eventType, data.message)
  return {}
}

// Re-exports for backward compatibility
export const listAuditEvents = listAuditEventsFn
export const logAuditEvent = logAuditEventFn
