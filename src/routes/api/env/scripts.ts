import { createFileRoute } from '@tanstack/react-router'
import { getProjectScriptsFn } from '../../../db/env'

export const Route = createFileRoute('/api/env/scripts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const repoPath = new URL(request.url).searchParams.get('repoPath') ?? ''
        const data = await getProjectScriptsFn({ repoPath })
        return Response.json(data)
      },
    },
  },
})
