import { createFileRoute } from '@tanstack/react-router'
import { listWorktreesFn, createWorktreeFn } from '../../db/worktree'

export const Route = createFileRoute('/api/worktrees')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const repoPath = new URL(request.url).searchParams.get('repoPath') ?? ''
        const data = await listWorktreesFn({ repoPath })
        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await createWorktreeFn(body)
        return Response.json(result, { status: 201 })
      },
    },
  },
})
