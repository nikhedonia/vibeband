import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import { getProjects } from '../db/kanban'
import { NotificationsProvider } from './Notifications'
import { TerminalSessionsProvider, useTerminalSessions } from '../contexts/TerminalSessions'

interface Project {
  id: number
  name: string
  description: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const { sessions } = useTerminalSessions()

  const loadProjects = useCallback(async () => {
    const data = await getProjects()
    setProjects(data)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <NotificationsProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar projects={projects} onProjectsChange={loadProjects} terminalSessions={sessions} />
        <main className="flex-1 ml-56 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </NotificationsProvider>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TerminalSessionsProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </TerminalSessionsProvider>
  )
}
