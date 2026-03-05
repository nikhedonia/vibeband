import { createFileRoute } from '@tanstack/react-router'
import { pollTerminalOutputFn } from '../../../../../db/terminal'

export const Route = createFileRoute('/api/terminal/sessions/$sessionId/output')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const data = await pollTerminalOutputFn({ sessionId: params.sessionId })
        return Response.json(data)
      },
    },
  },
})
