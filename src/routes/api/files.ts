import { createFileRoute } from '@tanstack/react-router'
import { listProjectFilesFn } from '../../db/worktree'

export const Route = createFileRoute('/api/files')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const rootPath = new URL(request.url).searchParams.get('rootPath') ?? ''
        const data = await listProjectFilesFn({ rootPath })
        return Response.json(data)
      },
    },
  },
})
