import { createFileRoute } from '@tanstack/react-router'
import { listTerminalSessionsFn, startTerminalSessionFn } from '../../../db/terminal'

export const Route = createFileRoute('/api/terminal/sessions')({
  server: {
    handlers: {
      GET: async () => {
        const data = await listTerminalSessionsFn()
        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await startTerminalSessionFn(body)
        return Response.json(result, { status: 201 })
      },
    },
  },
})
