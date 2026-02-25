import { createFileRoute } from '@tanstack/react-router'
import { sendTerminalInputFn } from '../../../../../db/terminal'

export const Route = createFileRoute('/api/terminal/sessions/$sessionId/input')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await request.json()
        await sendTerminalInputFn({ sessionId: params.sessionId, input: body.input })
        return new Response(null, { status: 204 })
      },
    },
  },
})
