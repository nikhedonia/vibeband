import { createFileRoute } from '@tanstack/react-router'
import { Settings, Database, Info } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="max-w-xl space-y-6">
        {/* DB info */}
        <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database size={18} className="text-cyan-400" />
            <h2 className="font-semibold text-white">Database</h2>
          </div>
          <p className="text-sm text-gray-400">
            Using SQLite via Drizzle ORM. Data is stored locally in{' '}
            <code className="bg-gray-700 px-1.5 py-0.5 rounded text-cyan-300 text-xs">
              kanban.db
            </code>
            .
          </p>
        </section>

        {/* About */}
        <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-cyan-400" />
            <h2 className="font-semibold text-white">About VibeBand</h2>
          </div>
          <p className="text-sm text-gray-400">
            A Kanban board built with TanStack Start, Drizzle ORM, and
            Tailwind CSS. Drag tickets between columns and write notes in
            Markdown.
          </p>
        </section>
      </div>
    </div>
  )
}
