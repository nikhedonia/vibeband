import { useState, useEffect } from 'react'

export interface HealthCheck {
  id: string
  label: string
  command: string
  enabled: boolean
}

const DEFAULT_CHECKS: HealthCheck[] = [
  { id: 'test', label: 'Test', command: 'npm test', enabled: true },
  { id: 'build', label: 'Build', command: 'npm run build', enabled: true },
  { id: 'dev', label: 'Dev', command: 'npm run dev', enabled: true },
]

function storageKey(projectId: number) {
  return `vibeband:health:${projectId}`
}

export function useProjectHealth(projectId: number) {
  const [checks, setChecks] = useState<HealthCheck[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CHECKS
    try {
      const stored = localStorage.getItem(storageKey(projectId))
      return stored ? JSON.parse(stored) : DEFAULT_CHECKS
    } catch {
      return DEFAULT_CHECKS
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(checks))
    } catch { /* ignore */ }
  }, [checks, projectId])

  function updateChecks(next: HealthCheck[]) {
    setChecks(next)
  }

  return { checks, updateChecks }
}
