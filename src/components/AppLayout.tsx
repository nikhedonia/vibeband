import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import { getProjects } from '../db/kanban'
import { NotificationsProvider } from './Notifications'

interface Project {
  id: number
  name: string
  description: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])

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
        <Sidebar projects={projects} onProjectsChange={loadProjects} />
        <main className="flex-1 ml-56 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </NotificationsProvider>
  )
}
