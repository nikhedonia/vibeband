import { createFileRoute, Link } from '@tanstack/react-router'
import { FolderKanban, Plus } from 'lucide-react'
import { getProjects } from '../db/kanban'

export const Route = createFileRoute('/')({
  loader: async () => {
    const projects = await getProjects()
    return { projects }
  },
  component: HomePage,
})

function HomePage() {
  const { projects } = Route.useLoaderData()

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Home</h1>
          <p className="text-gray-400 text-sm mt-1">Your kanban boards</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban size={48} className="text-gray-700 mb-4" />
          <h2 className="text-lg font-semibold text-gray-400 mb-2">
            No boards yet
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Create your first kanban board using the sidebar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: { id: number; name: string; description: string | null }) => (
            <Link
              key={p.id}
              to="/board/$boardId"
              params={{ boardId: String(p.id) }}
              className="group bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-5 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <FolderKanban size={20} className="text-cyan-400" />
                <h2 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {p.name}
                </h2>
              </div>
              {p.description && (
                <p className="text-sm text-gray-400">{p.description}</p>
              )}
            </Link>
          ))}

          {/* Create new board card */}
          <button
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl p-5 text-gray-500 hover:text-gray-300 transition-all"
            onClick={() => {
              // Focus the sidebar create button by triggering keyboard nav
              document.querySelector<HTMLButtonElement>('[title="New board"]')?.click()
            }}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">New board</span>
          </button>
        </div>
      )}
    </div>
  )
}
