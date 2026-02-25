import { createServerFn } from '@tanstack/react-start'
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

export const logAuditEvent = createServerFn({ method: 'POST' })
  .inputValidator((data: { eventType: AuditEventType; message: string }) => data)
  .handler(async ({ data }) => {
    await insertAuditEvent(data.eventType, data.message)
    return {}
  })

export const listAuditEvents = createServerFn({ method: 'GET' })
  .handler(async () => {
    return db
      .select()
      .from(schema.auditLog)
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(200)
      .all()
  })
