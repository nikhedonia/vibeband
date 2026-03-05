import { createFileRoute } from '@tanstack/react-router'
import { updateColumnFn, deleteColumnFn } from '../../../db/kanban'

export const Route = createFileRoute('/api/columns/$id')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await request.json()
        await updateColumnFn({ id: Number(params.id), ...body })
        return new Response(null, { status: 204 })
      },
      DELETE: async ({ params }) => {
        await deleteColumnFn({ id: Number(params.id) })
        return new Response(null, { status: 204 })
      },
    },
  },
})
