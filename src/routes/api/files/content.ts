import { createFileRoute } from '@tanstack/react-router'
import { readProjectFileFn, writeProjectFileFn } from '../../../db/worktree'

export const Route = createFileRoute('/api/files/content')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const rootPath = params.get('rootPath') ?? ''
        const filePath = params.get('filePath') ?? ''
        const data = await readProjectFileFn({ rootPath, filePath })
        return Response.json(data)
      },
      PUT: async ({ request }) => {
        const body = await request.json() as { rootPath: string; filePath: string; content: string }
        const data = await writeProjectFileFn(body)
        return Response.json(data)
      },
    },
  },
})
