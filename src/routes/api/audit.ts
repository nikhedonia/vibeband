import { createFileRoute } from '@tanstack/react-router'
import { listAuditEventsFn, logAuditEventFn } from '../../db/audit'

export const Route = createFileRoute('/api/audit')({
  server: {
    handlers: {
      GET: async () => {
        const data = await listAuditEventsFn()
        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body = await request.json()
        await logAuditEventFn(body)
        return new Response(null, { status: 204 })
      },
    },
  },
})
