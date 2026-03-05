import { createFileRoute } from '@tanstack/react-router'
import { getColumnsFn, createColumnFn } from '../../db/kanban'

export const Route = createFileRoute('/api/columns')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const projectId = Number(new URL(request.url).searchParams.get('projectId'))
        const data = await getColumnsFn({ projectId })
        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await createColumnFn(body)
        return Response.json(result, { status: 201 })
      },
    },
  },
})
