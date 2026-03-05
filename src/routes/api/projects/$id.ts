import { createFileRoute } from '@tanstack/react-router'
import { updateProjectFn, deleteProjectFn } from '../../../db/kanban'

export const Route = createFileRoute('/api/projects/$id')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await request.json()
        const result = await updateProjectFn({ id: Number(params.id), ...body })
        return Response.json(result)
      },
      DELETE: async ({ params }) => {
        await deleteProjectFn({ id: Number(params.id) })
        return new Response(null, { status: 204 })
      },
    },
  },
})
