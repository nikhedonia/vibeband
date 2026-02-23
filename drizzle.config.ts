import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { homedir } from 'node:os'
import { join } from 'node:path'

config({ path: ['.env.local', '.env'] })

const defaultDbPath = join(homedir(), '.vibeban', 'vibeban.db')

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? defaultDbPath,
  },
})
