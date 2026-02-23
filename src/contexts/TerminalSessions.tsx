import { createContext, useContext, useState, useCallback } from 'react'
import { stopTerminalSession } from '../db/terminal'

export interface TerminalSession {
  id: string
  cwd: string
  projectId: number
  projectName: string
  ticketId?: number
  ticketTitle?: string
  backendSessionId?: string
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

interface ContextValue {
  sessions: TerminalSession[]
  addSession: (opts: Omit<TerminalSession, 'id' | 'backendSessionId'>) => string
  removeSession: (id: string) => void
  setBackendSessionId: (id: string, backendSessionId: string) => void
  closeSessionsForTicket: (ticketId: number) => void
  getSessionsForProject: (projectId: number) => TerminalSession[]
}

const TerminalSessionsContext = createContext<ContextValue | null>(null)

export function TerminalSessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<TerminalSession[]>([])

  const addSession = useCallback((opts: Omit<TerminalSession, 'id' | 'backendSessionId'>) => {
    const id = genId()
    setSessions((prev) => [...prev, { ...opts, id }])
    return id
  }, [])

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => {
      const session = prev.find((s) => s.id === id)
      if (session?.backendSessionId) {
        stopTerminalSession({ data: { sessionId: session.backendSessionId } }).catch(() => {})
      }
      return prev.filter((s) => s.id !== id)
    })
  }, [])

  const setBackendSessionId = useCallback((id: string, backendSessionId: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, backendSessionId } : s)))
  }, [])

  const closeSessionsForTicket = useCallback((ticketId: number) => {
    setSessions((prev) => {
      const toClose = prev.filter((s) => s.ticketId === ticketId)
      for (const s of toClose) {
        if (s.backendSessionId) {
          stopTerminalSession({ data: { sessionId: s.backendSessionId } }).catch(() => {})
        }
      }
      return prev.filter((s) => s.ticketId !== ticketId)
    })
  }, [])

  const getSessionsForProject = useCallback(
    (projectId: number) => sessions.filter((s) => s.projectId === projectId),
    [sessions],
  )

  return (
    <TerminalSessionsContext.Provider
      value={{
        sessions,
        addSession,
        removeSession,
        setBackendSessionId,
        closeSessionsForTicket,
        getSessionsForProject,
      }}
    >
      {children}
    </TerminalSessionsContext.Provider>
  )
}

export function useTerminalSessions() {
  const ctx = useContext(TerminalSessionsContext)
  if (!ctx) throw new Error('useTerminalSessions must be used within TerminalSessionsProvider')
  return ctx
}
