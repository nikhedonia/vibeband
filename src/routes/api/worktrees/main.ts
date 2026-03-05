import { createFileRoute } from '@tanstack/react-router'
import { ensureMainWorktreeFn } from '../../../db/worktree'

export const Route = createFileRoute('/api/worktrees/main')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await ensureMainWorktreeFn(body)
        return Response.json(result)
      },
    },
  },
})
