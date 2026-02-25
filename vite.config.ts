import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  optimizeDeps: {
    include: ['@xterm/xterm', '@xterm/addon-fit'],
    exclude: ['better-sqlite3'],
  },
  ssr: {
    external: ['better-sqlite3'],
  },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//, 'better-sqlite3'] } }),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
