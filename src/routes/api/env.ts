import { createFileRoute } from '@tanstack/react-router'
import { getEnvInfoFn } from '../../db/env'

export const Route = createFileRoute('/api/env')({
  server: {
    handlers: {
      GET: async () => {
        const data = await getEnvInfoFn()
        return Response.json(data)
      },
    },
  },
})
