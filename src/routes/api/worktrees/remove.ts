import { createFileRoute } from '@tanstack/react-router'
import { removeWorktreeFn } from '../../../db/worktree'

export const Route = createFileRoute('/api/worktrees/remove')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await removeWorktreeFn(body)
        return Response.json(result)
      },
    },
  },
})
