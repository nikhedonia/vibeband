import { createServerFn } from '@tanstack/react-start'
import { getProjectsFn, getBoardDataFn } from '../db/kanban'

export const getProjectsServerFn = createServerFn({ method: 'GET' }).handler(
  async () => getProjectsFn(),
)

export const getBoardDataServerFn = createServerFn({ method: 'GET' }).handler(
  async (ctx) => getBoardDataFn({ projectId: ctx.data as number }),
)
