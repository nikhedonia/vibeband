import { createFileRoute } from '@tanstack/react-router'
import { getWorktreeDiffStatsFn } from '../../../db/worktree'

export const Route = createFileRoute('/api/worktrees/diff')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const worktreePath = params.get('worktreePath') ?? ''
        const baseBranch = params.get('baseBranch') ?? undefined
        const data = await getWorktreeDiffStatsFn({ worktreePath, baseBranch })
        return Response.json(data)
      },
    },
  },
})
