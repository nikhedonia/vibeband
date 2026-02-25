import { Link, useNavigate } from '@tanstack/react-router'
import { Home, BarChart2, Settings, Plus, Trello, Trash2, Terminal, X, Layers } from 'lucide-react'
import { useState } from 'react'
import { createProject, deleteProject } from '../db/kanban'
import type { TerminalSession } from '../contexts/TerminalSessions'
import { useTerminalSessions } from '../contexts/TerminalSessions'

interface Project {
  id: number
  name: string
  description: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

interface SidebarProps {
  projects: Project[]
  onProjectsChange: () => void
  terminalSessions: TerminalSession[]
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ projects, onProjectsChange, terminalSessions, collapsed, onToggleCollapse }: SidebarProps) {
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showTerminals, setShowTerminals] = useState(false)
  const navigate = useNavigate()
  const { removeSession } = useTerminalSessions()

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault()
    if (!newBoardName.trim()) return
    setCreating(true)
    const project = await createProject({ data: { name: newBoardName.trim() } })
    setCreating(false)
    setNewBoardName('')
    setShowNewBoard(false)
    onProjectsChange()
    navigate({ to: '/board/$boardId', params: { boardId: String(project.id) } })
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault()
    e.stopPropagation()
    await deleteProject({ data: { id } })
    onProjectsChange()
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-gray-900 text-white flex flex-col border-r border-gray-800 z-40 transition-[width] duration-200 overflow-hidden"
      style={{ width: collapsed ? 56 : 224 }}
    >
      {/* Logo — click to toggle collapse */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="px-3 py-4 border-b border-gray-800 flex-shrink-0 flex items-center gap-2 hover:bg-gray-800 transition-colors w-full text-left"
      >
        <Trello className="text-cyan-400 flex-shrink-0" size={22} />
        {!collapsed && <span className="font-bold text-lg tracking-tight whitespace-nowrap">VibeBand</span>}
      </button>

      {/* Nav icons */}
      <nav className="flex flex-col gap-1 px-2 py-3 flex-shrink-0">
        <NavLink
          to="/"
          icon={<Home size={18} />}
          label="Home"
          collapsed={collapsed}
          onExpandRequest={onToggleCollapse}
        />
        <NavLink
          to="/stats"
          icon={<BarChart2 size={18} />}
          label="Stats"
          collapsed={collapsed}
          onExpandRequest={onToggleCollapse}
        />
        {/* Terminals toggle */}
        <button
          type="button"
          onClick={() => setShowTerminals((v) => !v)}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            showTerminals
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Terminal size={18} className="flex-shrink-0" />
          {!collapsed && <span>Terminals</span>}
          {!collapsed && terminalSessions.length > 0 && (
            <span className="ml-auto bg-cyan-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {terminalSessions.length}
            </span>
          )}
        </button>
        {/* Projects icon — only in collapsed mode */}
        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand to see Projects"
            className="flex items-center justify-center px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <Layers size={18} className="flex-shrink-0" />
          </button>
        )}
      </nav>

      {/* Terminal sessions list */}
      {showTerminals && (
        <div className="px-2 pb-2 border-b border-gray-800">
          {terminalSessions.length === 0 ? (
            <p className="text-xs text-gray-600 px-2 py-1">No open terminals</p>
          ) : (
            <div className="flex flex-col gap-1">
              {terminalSessions.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                >
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() =>
                      navigate({
                        to: '/board/$boardId',
                        params: { boardId: String(s.projectId) },
                      })
                    }
                  >
                    <p className="text-xs text-gray-300 truncate font-medium">
                      {s.ticketTitle ?? s.projectName}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">{s.cwd.split('/').pop()}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSession(s.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-500 hover:text-red-400 transition-opacity flex-shrink-0 mt-0.5"
                    title="Close terminal"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects list (expanded only) */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Projects
            </span>
            <button
              onClick={() => setShowNewBoard(true)}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="New board"
            >
              <Plus size={15} />
            </button>
          </div>

          {projects.length === 0 && (
            <p className="text-xs text-gray-600 px-2">No projects yet</p>
          )}

          {projects.map((p) => (
            <Link
              key={p.id}
              to="/board/$boardId"
              params={{ boardId: String(p.id) }}
              className="group flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              activeProps={{ className: 'flex items-center justify-between px-2 py-1.5 rounded-md text-sm bg-cyan-900/60 text-cyan-300' }}
            >
              <span className="truncate">{p.name}</span>
              <button
                onClick={(e) => handleDelete(e, p.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-opacity"
                title="Delete project"
              >
                <Trash2 size={13} />
              </button>
            </Link>
          ))}

          {/* New board inline form */}
          {showNewBoard && (
            <form onSubmit={handleCreateBoard} className="mt-2 px-1">
              <input
                autoFocus
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name…"
                className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex gap-1 mt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 rounded text-white transition-colors"
                >
                  {creating ? '…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewBoard(false); setNewBoardName('') }}
                  className="flex-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {collapsed && <div className="flex-1" />}

      {/* Settings */}
      <div className="px-2 py-3 border-t border-gray-800 flex-shrink-0">
        <NavLink
          to="/settings"
          icon={<Settings size={18} />}
          label="Settings"
          collapsed={collapsed}
          onExpandRequest={onToggleCollapse}
        />
      </div>
    </aside>
  )
}

function NavLink({
  to,
  icon,
  label,
  collapsed,
  onExpandRequest,
}: {
  to: string
  icon: React.ReactNode
  label: string
  collapsed?: boolean
  onExpandRequest?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={() => collapsed && onExpandRequest?.()}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
      activeProps={{ className: 'flex items-center gap-3 px-3 py-2 rounded-md text-sm bg-gray-800 text-white' }}
      activeOptions={{ exact: true }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
