export type { FileNode, WorktreeInfo } from '../db/worktree'
export type { AuditEventType } from '../db/audit'

const BASE_URL =
  typeof window === 'undefined'
    ? `http://localhost:${process.env.PORT ?? 3000}`
    : ''

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, options)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// Projects
export const getProjects = () => apiFetch<any[]>('/api/projects')
export const createProject = (data: { name: string; description?: string; repoUrl?: string }) =>
  apiFetch<any>('/api/projects', { method: 'POST', ...json(data) })
export const deleteProject = (id: number) =>
  apiFetch<void>(`/api/projects/${id}`, { method: 'DELETE' })
export const updateProject = (id: number, data: { name?: string; description?: string; repoUrl?: string }) =>
  apiFetch<any>(`/api/projects/${id}`, { method: 'PATCH', ...json(data) })
export const getBoardData = (projectId: number) =>
  apiFetch<any>(`/api/projects/${projectId}/board`)

// Columns
export const getColumns = (projectId: number) =>
  apiFetch<any[]>(`/api/columns?projectId=${projectId}`)
export const createColumn = (data: { projectId: number; name: string; position: number }) =>
  apiFetch<any>('/api/columns', { method: 'POST', ...json(data) })
export const updateColumn = (id: number, data: { name: string }) =>
  apiFetch<void>(`/api/columns/${id}`, { method: 'PATCH', ...json(data) })
export const deleteColumn = (id: number) =>
  apiFetch<void>(`/api/columns/${id}`, { method: 'DELETE' })

// Tickets
export const getTickets = (projectId: number) =>
  apiFetch<any[]>(`/api/tickets?projectId=${projectId}`)
export const createTicket = (data: { projectId: number; columnId: number; title: string; position: number }) =>
  apiFetch<any>('/api/tickets', { method: 'POST', ...json(data) })
export const updateTicket = (id: number, data: { title?: string; content?: string; columnId?: number; position?: number }) =>
  apiFetch<any>(`/api/tickets/${id}`, { method: 'PATCH', ...json(data) })
export const deleteTicket = (id: number) =>
  apiFetch<void>(`/api/tickets/${id}`, { method: 'DELETE' })

// Audit
export const listAuditEvents = () => apiFetch<any[]>('/api/audit')
export const logAuditEvent = (data: { eventType: string; message: string }) =>
  apiFetch<void>('/api/audit', { method: 'POST', ...json(data) })

// Terminal sessions
export const listTerminalSessions = () => apiFetch<any[]>('/api/terminal/sessions')
export const startTerminalSession = (data: { cwd?: string }) =>
  apiFetch<{ sessionId: string }>('/api/terminal/sessions', { method: 'POST', ...json(data) })
export const stopTerminalSession = (sessionId: string, reason?: string) => {
  const url = reason
    ? `/api/terminal/sessions/${sessionId}?reason=${encodeURIComponent(reason)}`
    : `/api/terminal/sessions/${sessionId}`
  return apiFetch<void>(url, { method: 'DELETE' })
}
export const pollTerminalOutput = (sessionId: string) =>
  apiFetch<{ output: string; alive: boolean }>(`/api/terminal/sessions/${sessionId}/output`)
export const sendTerminalInput = (sessionId: string, input: string) =>
  apiFetch<void>(`/api/terminal/sessions/${sessionId}/input`, { method: 'POST', ...json({ input }) })
export const resizeTerminalSession = (sessionId: string, data: { cols: number; rows: number }) =>
  apiFetch<void>(`/api/terminal/sessions/${sessionId}/resize`, { method: 'POST', ...json(data) })
export const registerSessionMeta = (sessionId: string, data: { cwd: string; projectId: number; projectName: string; ticketId?: number; ticketTitle?: string }) =>
  apiFetch<void>(`/api/terminal/sessions/${sessionId}/meta`, { method: 'POST', ...json(data) })

// Worktrees
export const listWorktrees = (repoPath: string) =>
  apiFetch<{ worktrees: any[] }>(`/api/worktrees?repoPath=${encodeURIComponent(repoPath)}`)
export const createWorktree = (data: { repoPath: string; projectSlug: string; branchSlug: string }) =>
  apiFetch<{ path: string; created: boolean }>('/api/worktrees', { method: 'POST', ...json(data) })
export const removeWorktree = (data: { repoPath: string; worktreePath: string }) =>
  apiFetch<{ removed: boolean }>('/api/worktrees/remove', { method: 'POST', ...json(data) })
export const ensureMainWorktree = (data: { repoPath: string; projectSlug: string }) =>
  apiFetch<{ path: string; created: boolean; branch?: string }>('/api/worktrees/main', { method: 'POST', ...json(data) })
export const ensureRepoCloned = (data: { repoUrl: string; projectSlug: string }) =>
  apiFetch<{ path: string; cloned: boolean }>('/api/repos/clone', { method: 'POST', ...json(data) })
export const listProjectFiles = (rootPath: string) =>
  apiFetch<{ files: any[] }>(`/api/files?rootPath=${encodeURIComponent(rootPath)}`)
export const readProjectFile = (rootPath: string, filePath: string) =>
  apiFetch<{ content: string }>(`/api/files/content?rootPath=${encodeURIComponent(rootPath)}&filePath=${encodeURIComponent(filePath)}`)
export const writeProjectFile = (rootPath: string, filePath: string, content: string) =>
  apiFetch<{ ok: boolean }>('/api/files/content', { method: 'PUT', ...json({ rootPath, filePath, content }) })
export const getWorktreeDiffStats = (data: { worktreePath: string; baseBranch?: string }) => {
  const params = new URLSearchParams({ worktreePath: data.worktreePath })
  if (data.baseBranch) params.set('baseBranch', data.baseBranch)
  return apiFetch<{ added: number; deleted: number; changed: number }>(`/api/worktrees/diff?${params}`)
}

// Env
export const getEnvInfo = () => apiFetch<any>('/api/env')
export const runHealthCheck = (data: { command: string; cwd?: string }) =>
  apiFetch<{ ok: boolean; output: string }>('/api/env/health-check', { method: 'POST', ...json(data) })
export const getProjectScripts = (repoPath: string) =>
  apiFetch<{ scripts: Record<string, string>; hasDockerfile: boolean }>(`/api/env/scripts?repoPath=${encodeURIComponent(repoPath)}`)
