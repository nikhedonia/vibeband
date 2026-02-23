import { Link, useNavigate } from '@tanstack/react-router'
import { Home, BarChart2, Settings, Plus, Trello, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createProject, deleteProject } from '../db/kanban'

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
}

export default function Sidebar({ projects, onProjectsChange }: SidebarProps) {
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

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
    <aside className="fixed top-0 left-0 h-screen w-56 bg-gray-900 text-white flex flex-col border-r border-gray-800 z-40">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Trello className="text-cyan-400" size={22} />
          <span className="font-bold text-lg tracking-tight">VibeBand</span>
        </div>
      </div>

      {/* Nav icons */}
      <nav className="flex flex-col gap-1 px-2 py-3">
        <NavLink to="/" icon={<Home size={18} />} label="Home" />
        <NavLink to="/stats" icon={<BarChart2 size={18} />} label="Stats" />
      </nav>

      {/* Projects list */}
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

      {/* Settings */}
      <div className="px-2 py-3 border-t border-gray-800">
        <NavLink to="/settings" icon={<Settings size={18} />} label="Settings" />
      </div>
    </aside>
  )
}

function NavLink({
  to,
  icon,
  label,
}: {
  to: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
      activeProps={{ className: 'flex items-center gap-3 px-3 py-2 rounded-md text-sm bg-gray-800 text-white' }}
      activeOptions={{ exact: true }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
