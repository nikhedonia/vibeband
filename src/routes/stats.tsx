import { createFileRoute } from '@tanstack/react-router'
import { BarChart2, Columns, Ticket, FolderKanban } from 'lucide-react'
import { getProjects } from '../api/client'

export const Route = createFileRoute('/stats')({
  loader: async () => {
    const projects = await getProjects()
    return { projects }
  },
  component: StatsPage,
})

function StatsPage() {
  const { projects } = Route.useLoaderData()

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <BarChart2 className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold">Stats</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={<FolderKanban size={22} className="text-cyan-400" />}
          label="Projects"
          value={projects.length}
        />
        <StatCard
          icon={<Columns size={22} className="text-purple-400" />}
          label="Default columns / project"
          value={6}
        />
        <StatCard
          icon={<Ticket size={22} className="text-green-400" />}
          label="Total boards"
          value={projects.length}
        />
      </div>

      <h2 className="text-lg font-semibold mb-4 text-gray-300">All Projects</h2>
      {projects.length === 0 ? (
        <p className="text-gray-500">No projects yet. Create one from the sidebar.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p: { id: number; name: string; description: string | null }) => (
            <div
              key={p.id}
              className="bg-gray-800/60 border border-gray-700 rounded-xl p-4"
            >
              <h3 className="font-semibold text-white">{p.name}</h3>
              {p.description && (
                <p className="text-sm text-gray-400 mt-1">{p.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
      <div className="p-3 bg-gray-700/60 rounded-lg">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}
