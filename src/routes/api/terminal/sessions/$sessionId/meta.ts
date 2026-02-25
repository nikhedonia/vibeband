import { createFileRoute } from '@tanstack/react-router'
import { registerSessionMetaFn } from '../../../../../db/terminal'

export const Route = createFileRoute('/api/terminal/sessions/$sessionId/meta')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await request.json()
        await registerSessionMetaFn({ sessionId: params.sessionId, ...body })
        return new Response(null, { status: 204 })
      },
    },
  },
})
