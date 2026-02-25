import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  GitBranch,
  ExternalLink,
  Pencil,
  Check,
  X,
  PanelRight,
} from 'lucide-react'
import ProjectHealthBar from '../../components/ProjectHealthBar'
import { getBoardData, updateProject } from '../../api/client'
import { isRemoteUrl } from '../../utils/url'
import { ensureRepoCloned } from '../../api/client'
import {
  createWorktreeApi,
  removeWorktreeApi,
  ensureMainWorktreeApi,
  listWorktreesApi,
  getWorktreeDiffStatsApi,
} from '../../api/worktreeApi'
import type { WorktreeInfo } from '../../components/kanban/KanbanBoard'
import KanbanBoard from '../../components/kanban/KanbanBoard'
import type { KanbanBoardHandle } from '../../components/kanban/KanbanBoard'
import MarkdownEditor from '../../components/kanban/MarkdownEditor'
import TerminalTabs from '../../components/TerminalTabs'
import { useNotifications } from '../../components/Notifications'
import { useTerminalSessions } from '../../contexts/TerminalSessions'
import { slugify } from '../../utils/slugify'
import { logAuditEvent } from '../../api/client'

export const Route = createFileRoute('/board/$boardId')({
  loader: async ({ params }) => {
    const projectId = Number(params.boardId)
    if (Number.isNaN(projectId)) throw notFound()
    try {
      return await getBoardData(projectId)
    } catch {
      throw notFound()
    }
  },
  component: BoardPage,
  notFoundComponent: () => (
    <div className="flex items-center justify-center h-full text-gray-500">
      Board not found
    </div>
  ),
})

// ── Repo URL editor ───────────────────────────────────────────────────────────

function RepoUrlEditor({
  projectId,
  initialUrl,
  onChange,
}: {
  projectId: number
  initialUrl: string
  onChange?: (url: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(initialUrl)
  const [saved, setSaved] = useState(initialUrl)

  const isRemote = saved.startsWith('http://') || saved.startsWith('https://')

  async function save() {
    await updateProject(projectId, { repoUrl: url })
    setSaved(url)
    setEditing(false)
    onChange?.(url)
  }

  function cancel() {
    setUrl(saved)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <GitBranch className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          placeholder="https://github.com/org/repo or /local/path"
          className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-gray-200 w-72 focus:outline-none focus:border-indigo-500"
        />
        <button type="button" onClick={save} className="text-green-400 hover:text-green-300" title="Save">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={cancel} className="text-gray-400 hover:text-gray-300" title="Cancel">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 mt-1 group">
      <GitBranch className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
      {saved ? (
        isRemote ? (
          <a
            href={saved}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            {saved}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-400 font-mono">{saved}</span>
        )
      ) : (
        <span className="text-xs text-gray-600 italic">No git repo linked</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 ml-1 transition-opacity"
        title="Edit repo URL"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  )
}

// ── Board page ────────────────────────────────────────────────────────────────

interface Ticket {
  id: number
  columnId: number
  projectId: number
  title: string
  content: string | null
  position: number
  createdAt: Date | null
  updatedAt: Date | null
}

interface Column {
  id: number
  projectId: number
  name: string
  position: number
  createdAt: Date | null
}

function isLocalPath(url: string): boolean {
  return !!url && !isRemoteUrl(url)
}

function BoardPage() {
  const { project, columns, tickets } = Route.useLoaderData()
  const { notify } = useNotifications()
  const {
    addSession,
    removeSession,
    setBackendSessionId,
    closeSessionsForTicket,
    getSessionsForProject,
  } = useTerminalSessions()

  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? '')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [resolvedRepoPath, setResolvedRepoPath] = useState<string | undefined>(
    isLocalPath(project.repoUrl ?? '') ? (project.repoUrl ?? undefined) : undefined,
  )
  const [worktrees, setWorktrees] = useState<Record<string, WorktreeInfo>>({})
  const [terminalHeight, setTerminalHeight] = useState(256)
  const [terminalMaximized, setTerminalMaximized] = useState(false)
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null)
  const kanbanRef = useRef<KanbanBoardHandle>(null)

  const projectSessions = getSessionsForProject(project.id)

  // Auto-select a tab when sessions change
  useEffect(() => {
    if (projectSessions.length > 0 && (activeTerminalId === null || !projectSessions.find((s) => s.id === activeTerminalId))) {
      setActiveTerminalId(projectSessions[projectSessions.length - 1].id)
    }
    if (projectSessions.length === 0) setActiveTerminalId(null)
  }, [projectSessions, activeTerminalId])

  const terminalCountsByTicket = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const s of projectSessions) {
      if (s.ticketId != null) counts[s.ticketId] = (counts[s.ticketId] ?? 0) + 1
    }
    return counts
  }, [projectSessions])

  async function refreshWorktrees(repoPath: string) {
    try {
      const { worktrees: wts } = await listWorktreesApi({ repoPath })
      const projectSlug = `${slugify(project.name)}-${project.id}`
      const map: Record<string, WorktreeInfo> = {}
      for (const wt of wts) {
        // derive slug from path: /var/tmp/{projectSlug}/{branchSlug}
        const branchSlug = wt.path.replace(`/var/tmp/${projectSlug}/`, '')
        if (!branchSlug || branchSlug === 'main' || branchSlug === 'repo') continue
        // fetch diff stats (non-blocking per worktree)
        const stats = await getWorktreeDiffStatsApi({ worktreePath: wt.path }).catch(() => ({ added: 0, deleted: 0, changed: 0 }))
        map[branchSlug] = { ...wt, ...stats }
      }
      setWorktrees(map)
    } catch {
      // non-fatal
    }
  }

  // When repoUrl changes, resolve to a local path (clone if remote)
  async function resolveRepoPath(url: string): Promise<string | undefined> {
    if (!url) return undefined
    if (isLocalPath(url)) return url
    // Remote URL — clone/fetch
    const projectSlug = `${slugify(project.name)}-${project.id}`
    try {
      notify(`Cloning repository…`, 'info')
      const result = await ensureRepoCloned({ repoUrl: url, projectSlug })
      if (result.cloned) notify(`Repository cloned to ${result.path}`, 'success')
      return result.path
    } catch (e) {
      notify(`Failed to clone repo: ${e}`, 'error')
      return undefined
    }
  }

  async function handleRepoUrlChange(url: string) {
    setRepoUrl(url)
    const resolved = await resolveRepoPath(url)
    setResolvedRepoPath(resolved)
    if (resolved) refreshWorktrees(resolved)
  }

  // Resolve on mount for remote URLs already saved; refresh worktrees for local paths
  useEffect(() => {
    if (repoUrl && isRemoteUrl(repoUrl)) {
      resolveRepoPath(repoUrl).then((p) => {
        setResolvedRepoPath(p)
        if (p) refreshWorktrees(p)
      })
    } else if (resolvedRepoPath) {
      refreshWorktrees(resolvedRepoPath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const localRepo = resolvedRepoPath

  function handleTicketSelect(ticket: Ticket | null) {
    setSelectedTicket(ticket)
    if (ticket && !editorOpen) setEditorOpen(true)
  }

  function handleEditorSave(updated: Ticket) {
    setSelectedTicket(updated)
    kanbanRef.current?.updateTicket(updated)
  }

  function handleEditorDelete(id: number) {
    setSelectedTicket(null)
    kanbanRef.current?.deleteTicket(id)
  }

  async function handleTicketMoved(ticket: Ticket, column: Column) {
    if (!localRepo) {
      const colName = column.name.toLowerCase()
      if (colName === 'in progress' || colName === 'done') {
        notify('No repo linked — worktree skipped. Set a repo URL in project settings.', 'info')
      }
      return
    }
    const projectSlug = `${slugify(project.name)}-${project.id}`
    const ticketSlug = `${slugify(ticket.title) || 'ticket'}-${ticket.id}`
    const colName = column.name.toLowerCase()

    if (colName === 'in progress') {
      // Create ticket worktree and ensure main worktree exists
      try {
        const [mainResult, ticketResult] = await Promise.all([
          ensureMainWorktreeApi({ repoPath: localRepo, projectSlug }),
          createWorktreeApi({ repoPath: localRepo, projectSlug, branchSlug: ticketSlug }),
        ])
        if (mainResult.created) {
          notify(`Main worktree created: ${mainResult.path}`, 'info')
        }
        if (ticketResult.created) {
          notify(`Worktree created: ${ticketResult.path}`, 'success')
        }
        refreshWorktrees(localRepo)
      } catch (e) {
        notify(`Worktree error: ${e}`, 'error')
      }
    } else if (colName === 'done') {
      // Close any open terminal sessions for this ticket
      const closedCount = closeSessionsForTicket(ticket.id, 'workspace destroyed')
      if (closedCount > 0) {
        notify(
          `Closing ${closedCount} terminal session${closedCount > 1 ? 's' : ''} for "${ticket.title}"…`,
          'info',
        )
      }
      // Remove ticket worktree
      const worktreePath = `/var/tmp/${projectSlug}/${ticketSlug}`
      try {
        const result = await removeWorktreeApi({ repoPath: localRepo, worktreePath })
        if (result.removed) {
          notify(`Workspace destroyed: ${worktreePath}`, 'success')
          logAuditEvent({
              eventType: 'workspace_destroyed',
              message: `Workspace destroyed for ticket "${ticket.title}" (${worktreePath}), ${closedCount} terminal session${closedCount !== 1 ? 's' : ''} closed`,
            }).catch(() => {})
        }
        refreshWorktrees(localRepo)
      } catch (e) {
        notify(`Workspace destruction error: ${e}`, 'error')
        logAuditEvent({
          eventType: 'workspace_destroyed',
          message: `Workspace destruction failed for ticket "${ticket.title}" (${worktreePath}): ${e}`,
        }).catch(() => {})
      }
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left column: header + kanban + terminal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Board header */}
        <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>
            )}
            <RepoUrlEditor
              projectId={project.id}
              initialUrl={project.repoUrl ?? ''}
              onChange={handleRepoUrlChange}
            />
          </div>
          <div className="flex items-center gap-2">
            <ProjectHealthBar projectId={project.id} repoPath={resolvedRepoPath} />
            <button
              onClick={() => setEditorOpen((v) => !v)}
              title={editorOpen ? 'Hide editor' : 'Show editor'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                editorOpen
                  ? 'bg-cyan-700/40 text-cyan-300 hover:bg-cyan-700/60'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <PanelRight size={16} />
              <span className="text-xs">{editorOpen ? 'Hide' : 'Editor'}</span>
            </button>
          </div>
        </div>

        {/* Kanban board */}
        <div className="flex-1 overflow-auto p-4 min-h-0">
          <KanbanBoard
            ref={kanbanRef}
            projectId={project.id}
            initialColumns={columns}
            initialTickets={tickets}
            selectedTicketId={selectedTicket?.id ?? null}
            onTicketSelect={handleTicketSelect}
            onTicketMoved={handleTicketMoved}
            worktrees={worktrees}
            terminalCountsByTicket={terminalCountsByTicket}
                const id = addSession({
                  cwd: path,
                  projectId: project.id,
                  projectName: project.name,
                  ticketId: ticket.id,
                  ticketTitle: ticket.title,
                })
                setActiveTerminalId(id)
              }}
          />
        </div>

        {/* Terminal tabs panel */}
        {projectSessions.length > 0 && (
          <div
            className={terminalMaximized ? 'flex-1 min-h-0' : 'flex-shrink-0'}
            style={terminalMaximized ? undefined : { height: terminalHeight }}
          >
            <TerminalTabs
              sessions={projectSessions}
              activeId={activeTerminalId}
              onActivate={setActiveTerminalId}
              onClose={removeSession}
              onSetBackendSessionId={setBackendSessionId}
              onAddSession={
                localRepo
                  ? () => {
                      const id = addSession({
                        cwd: localRepo,
                        projectId: project.id,
                        projectName: project.name,
                      })
                      setActiveTerminalId(id)
                    }
                  : undefined
              }
              onHeightChange={(h) => { setTerminalMaximized(false); setTerminalHeight(h) }}
              onToggleMaximize={() => setTerminalMaximized((v) => !v)}
              isMaximized={terminalMaximized}
            />
          </div>
        )}
      </div>

      {/* Editor panel — full height */}
      {editorOpen && (
        <MarkdownEditor
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onSave={handleEditorSave}
          onDelete={handleEditorDelete}
          repoPath={localRepo}
        />
      )}
    </div>
  )
}
