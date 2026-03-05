import { createFileRoute } from '@tanstack/react-router'
import { stopTerminalSessionFn } from '../../../../db/terminal'

export const Route = createFileRoute('/api/terminal/sessions/$sessionId')({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const reason = new URL(request.url).searchParams.get('reason') ?? undefined
        await stopTerminalSessionFn({ sessionId: params.sessionId, reason })
        return new Response(null, { status: 204 })
      },
    },
  },
})
