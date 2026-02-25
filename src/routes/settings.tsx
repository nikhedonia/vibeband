import { createFileRoute } from '@tanstack/react-router'
import { Settings, Database, Info, Activity } from 'lucide-react'
import { useEnvConfig } from '../hooks/useEnvConfig'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { config, update } = useEnvConfig()

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Project Health Checks */}
        <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-cyan-400" />
            <h2 className="font-semibold text-white">Project Health Checks</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Choose which health checks are shown in the sidebar.
          </p>
          <div className="space-y-3">
            {(
              [
                { key: 'showTests', label: 'Tests', description: 'package.json test script' },
                { key: 'showBuild', label: 'Build', description: 'package.json build script or Dockerfile' },
                { key: 'showPreview', label: 'Dev / Preview', description: 'package.json dev script' },
              ] as const
            ).map(({ key, label, description }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config[key]}
                  onClick={() => update({ [key]: !config[key] })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    config[key] ? 'bg-cyan-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      config[key] ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </section>

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
