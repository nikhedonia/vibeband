import { createFileRoute } from '@tanstack/react-router'
import { getProjectsFn, createProjectFn } from '../../db/kanban'

export const Route = createFileRoute('/api/projects')({
  server: {
    handlers: {
      GET: async () => {
        const data = await getProjectsFn()
        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await createProjectFn(body)
        return Response.json(result, { status: 201 })
      },
    },
  },
})
