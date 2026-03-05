import { createFileRoute } from '@tanstack/react-router'
import { getBoardDataFn } from '../../../../db/kanban'

export const Route = createFileRoute('/api/projects/$id/board')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const data = await getBoardDataFn({ projectId: Number(params.id) })
        return Response.json(data)
      },
    },
  },
})
