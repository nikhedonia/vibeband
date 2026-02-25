import { createFileRoute } from '@tanstack/react-router'
import { updateTicketFn, deleteTicketFn } from '../../../db/kanban'

export const Route = createFileRoute('/api/tickets/$id')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await request.json()
        const result = await updateTicketFn({ id: Number(params.id), ...body })
        return Response.json(result)
      },
      DELETE: async ({ params }) => {
        await deleteTicketFn({ id: Number(params.id) })
        return new Response(null, { status: 204 })
      },
    },
  },
})
