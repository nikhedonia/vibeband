import { createFileRoute } from '@tanstack/react-router'
import { ensureRepoClonedFn } from '../../../db/worktree'

export const Route = createFileRoute('/api/repos/clone')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await ensureRepoClonedFn(body)
        return Response.json(result)
      },
    },
  },
})
