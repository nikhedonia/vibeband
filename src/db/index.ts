import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import * as schema from './schema.ts'

const defaultDbPath = join(homedir(), '.vibeban', 'vibeban.db')
const dbUrl = process.env.DATABASE_URL ?? defaultDbPath

mkdirSync(join(dbUrl, '..'), { recursive: true })

export const db = drizzle(dbUrl, { schema })
