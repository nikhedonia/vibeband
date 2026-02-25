import { createFileRoute } from '@tanstack/react-router'
import { runHealthCheckFn } from '../../../db/env'

export const Route = createFileRoute('/api/env/health-check')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const result = await runHealthCheckFn(body)
        return Response.json(result)
      },
    },
  },
})
