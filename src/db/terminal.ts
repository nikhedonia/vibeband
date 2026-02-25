import { createServerFn } from '@tanstack/react-start'
import pty from 'node-pty'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

interface Session {
  pty: pty.IPty
  buffer: string
  createdAt: number
  exited?: boolean
}

interface SessionMeta {
  cwd: string
  projectId: number
  projectName: string
  ticketId?: number
  ticketTitle?: string
}

// Server-side only: in-memory PTY sessions
const sessions = new Map<string, Session>()
// Metadata for active sessions (used to restore frontend state on reload)
const sessionMetas = new Map<string, SessionMeta>()

// Prune stale sessions older than 30 minutes
function pruneSessions() {
  const cutoff = Date.now() - 30 * 60 * 1000
  for (const [id, s] of sessions) {
    if (s.createdAt < cutoff) {
      try { s.pty.kill() } catch { /* ignore */ }
      sessions.delete(id)
      sessionMetas.delete(id)
    }
  }
}

export const startTerminalSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { cwd?: string }) => data)
  .handler(async ({ data }) => {
    pruneSessions()
    const cwd = data.cwd && existsSync(data.cwd) ? data.cwd : process.cwd()
    const shell = process.env.SHELL ?? '/bin/bash'
    const sessionId = randomUUID()

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as Record<string, string>,
    })

    const session: Session = { pty: ptyProcess, buffer: '', createdAt: Date.now() }
    sessions.set(sessionId, session)

    ptyProcess.onData((data: string) => {
      const s = sessions.get(sessionId)
      if (s) s.buffer += data
    })

    ptyProcess.onExit(() => {
      const s = sessions.get(sessionId)
      if (s) {
        s.buffer += '\r\n\x1b[2m[process exited]\x1b[0m\r\n'
        s.exited = true
      }
    })

    return { sessionId }
  })

export const pollTerminalOutput = createServerFn({ method: 'GET' })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const session = sessions.get(data.sessionId)
    if (!session) return { output: '', alive: false }
    const output = session.buffer
    session.buffer = ''
    if (session.exited) {
      sessions.delete(data.sessionId)
      sessionMetas.delete(data.sessionId)
      return { output, alive: false }
    }
    return { output, alive: true }
  })

export const sendTerminalInput = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; input: string }) => data)
  .handler(async ({ data }) => {
    const session = sessions.get(data.sessionId)
    if (session) session.pty.write(data.input)
    return {}
  })

export const resizeTerminalSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; cols: number; rows: number }) => data)
  .handler(async ({ data }) => {
    const session = sessions.get(data.sessionId)
    if (session) session.pty.resize(data.cols, data.rows)
    return {}
  })

export const stopTerminalSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const session = sessions.get(data.sessionId)
    if (session) {
      try { session.pty.kill() } catch { /* ignore */ }
      sessions.delete(data.sessionId)
      sessionMetas.delete(data.sessionId)
    }
    return {}
  })

export const registerSessionMeta = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string } & SessionMeta) => data)
  .handler(async ({ data }) => {
    const { sessionId, ...meta } = data
    if (sessions.has(sessionId)) {
      sessionMetas.set(sessionId, meta)
    }
    return {}
  })

export const listTerminalSessions = createServerFn({ method: 'GET' })
  .handler(async () => {
    pruneSessions()
    const result: ({ sessionId: string } & SessionMeta)[] = []
    for (const [sessionId, meta] of sessionMetas) {
      if (sessions.has(sessionId)) {
        result.push({ sessionId, ...meta })
      }
    }
    return result
  })
