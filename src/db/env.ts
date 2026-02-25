import { createServerFn } from '@tanstack/react-start'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const execAsync = promisify(exec)

async function checkCommand(cmd: string): Promise<boolean> {
  try {
    await execAsync(cmd, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

export const getEnvInfo = createServerFn({ method: 'GET' }).handler(async () => {
  const cwd = process.cwd()

  const [ghInstalled, dockerRunning, copilotInstalled] = await Promise.all([
    checkCommand('gh --version'),
    checkCommand('docker info'),
    checkCommand('gh copilot --version'),
  ])

  const ghLoggedIn = ghInstalled
    ? await checkCommand('gh auth status')
    : false

  // Project health: read package.json
  let scripts: Record<string, string> = {}
  const pkgPath = join(cwd, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      scripts = pkg.scripts ?? {}
    } catch { /* ignore */ }
  }

  const hasTests = 'test' in scripts
  const hasBuild = 'build' in scripts || existsSync(join(cwd, 'Dockerfile'))
  const hasPreview = 'dev' in scripts

  return {
    gh: { installed: ghInstalled, loggedIn: ghLoggedIn },
    docker: { running: dockerRunning },
    copilot: { installed: copilotInstalled },
    health: { hasTests, hasBuild, hasPreview },
  }
})
