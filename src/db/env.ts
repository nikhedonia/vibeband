import { createServerFn } from '@tanstack/react-start'
import { exec } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const execAsync = (cmd: string, options: { timeout?: number; cwd?: string } = {}) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(cmd, options, (err, stdout, stderr) => {
      if (err) {
        Object.assign(err, { stdout, stderr })
        reject(err)
      } else {
        resolve({ stdout, stderr })
      }
    })
  })

async function checkCommand(cmd: string): Promise<boolean> {
  try {
    await execAsync(cmd, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

export const getEnvInfo = createServerFn({ method: 'GET' }).handler(async () => {
  const [ghInstalled, dockerRunning, copilotInstalled] = await Promise.all([
    checkCommand('gh --version'),
    checkCommand('docker info'),
    checkCommand('gh copilot --version'),
  ])

  const ghLoggedIn = ghInstalled
    ? await checkCommand('gh auth status')
    : false

  return {
    gh: { installed: ghInstalled, loggedIn: ghLoggedIn },
    docker: { running: dockerRunning },
    copilot: { installed: copilotInstalled },
  }
})

export const getProjectScripts = createServerFn({ method: 'GET' })
  .inputValidator((data: { repoPath: string }) => data)
  .handler(async ({ data }) => {
    let scripts: Record<string, string> = {}
    const pkgPath = join(data.repoPath, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        scripts = pkg.scripts ?? {}
      } catch { /* ignore */ }
    }
    const hasDockerfile = existsSync(join(data.repoPath, 'Dockerfile'))
    return { scripts, hasDockerfile }
  })

export const runHealthCheck = createServerFn({ method: 'POST' })
  .inputValidator((data: { command: string; cwd?: string }) => data)
  .handler(async ({ data }) => {
    const cwd = data.cwd && existsSync(data.cwd) ? data.cwd : process.cwd()
    try {
      const { stdout, stderr } = await execAsync(data.command, {
        timeout: 30_000,
        cwd,
      })
      return { ok: true, output: (stdout + stderr).trim() }
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string }
      const out = [err.stdout, err.stderr, err.message].filter(Boolean).join('\n')
      return { ok: false, output: out.trim() }
    }
  })
