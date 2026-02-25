import { createFileRoute } from '@tanstack/react-router'
import { getTicketsFn, createTicketFn } from '../../db/kanban'

export const Route = createFileRoute('/api/tickets')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const projectId = Number(new URL(request.url).searchParams.get('projectId'))
        const data = await getTicketsFn({ projectId })
        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await createTicketFn(body)
        return Response.json(result, { status: 201 })
      },
    },
  },
})
