import pty from 'node-pty'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { insertAuditEvent } from './audit.ts'

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

const sessions = new Map<string, Session>()
const sessionMetas = new Map<string, SessionMeta>()

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

export async function startTerminalSessionFn(data: { cwd?: string }) {
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

  insertAuditEvent('terminal_started', `Terminal session started in ${cwd}`)

  ptyProcess.onData((data: string) => {
    const s = sessions.get(sessionId)
    if (s) s.buffer += data
  })

  ptyProcess.onExit(() => {
    const s = sessions.get(sessionId)
    if (s) {
      s.buffer += '\r\n\x1b[2m[process exited]\x1b[0m\r\n'
      s.exited = true
      insertAuditEvent('terminal_exited', `Terminal session exited (cwd: ${cwd})`)
    }
  })

  return { sessionId }
}

export async function pollTerminalOutputFn(data: { sessionId: string }) {
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
}

export async function sendTerminalInputFn(data: { sessionId: string; input: string }) {
  const session = sessions.get(data.sessionId)
  if (session) session.pty.write(data.input)
  return {}
}

export async function resizeTerminalSessionFn(data: { sessionId: string; cols: number; rows: number }) {
  const session = sessions.get(data.sessionId)
  if (session) session.pty.resize(data.cols, data.rows)
  return {}
}

export async function stopTerminalSessionFn(data: { sessionId: string; reason?: string }) {
  const session = sessions.get(data.sessionId)
  if (session) {
    try { session.pty.kill() } catch { /* ignore */ }
    sessions.delete(data.sessionId)
    const meta = sessionMetas.get(data.sessionId)
    sessionMetas.delete(data.sessionId)
    const reason = data.reason ?? 'manually closed'
    const cwd = meta?.cwd ?? 'unknown'
    insertAuditEvent('terminal_closed', `Terminal session closed (${reason}, cwd: ${cwd})`)
  }
  return {}
}

export async function registerSessionMetaFn(data: { sessionId: string; cwd: string; projectId: number; projectName: string; ticketId?: number; ticketTitle?: string }) {
  const { sessionId, ...meta } = data
  if (sessions.has(sessionId)) {
    sessionMetas.set(sessionId, meta)
  }
  return {}
}

export async function listTerminalSessionsFn() {
  pruneSessions()
  const result: ({ sessionId: string } & SessionMeta)[] = []
  for (const [sessionId, meta] of sessionMetas) {
    if (sessions.has(sessionId)) {
      result.push({ sessionId, ...meta })
    }
  }
  return result
}

// Re-exports for backward compatibility
export const startTerminalSession = startTerminalSessionFn
export const pollTerminalOutput = pollTerminalOutputFn
export const sendTerminalInput = sendTerminalInputFn
export const resizeTerminalSession = resizeTerminalSessionFn
export const stopTerminalSession = stopTerminalSessionFn
export const registerSessionMeta = registerSessionMetaFn
export const listTerminalSessions = listTerminalSessionsFn
