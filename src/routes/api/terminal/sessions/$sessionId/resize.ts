import { createFileRoute } from '@tanstack/react-router'
import { resizeTerminalSessionFn } from '../../../../../db/terminal'

export const Route = createFileRoute('/api/terminal/sessions/$sessionId/resize')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await request.json()
        await resizeTerminalSessionFn({ sessionId: params.sessionId, cols: body.cols, rows: body.rows })
        return new Response(null, { status: 204 })
      },
    },
  },
})
