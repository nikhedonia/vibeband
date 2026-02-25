import { createFileRoute } from '@tanstack/react-router'
import { ClipboardList, Terminal, LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { listAuditEvents } from '../api/client'
import type { AuditEventType } from '../api/client'

export const Route = createFileRoute('/audit')({
  loader: async () => {
    const events = await listAuditEvents()
    return { events }
  },
  component: AuditPage,
})

function eventIcon(type: AuditEventType) {
  switch (type) {
    case 'terminal_started': return <Terminal size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
    case 'terminal_exited': return <LogOut size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
    case 'terminal_closed': return <Trash2 size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
    case 'workspace_destroyed': return <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
    default: return <ClipboardList size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
  }
}

function eventLabel(type: AuditEventType) {
  switch (type) {
    case 'terminal_started': return 'Terminal started'
    case 'terminal_exited': return 'Terminal exited'
    case 'terminal_closed': return 'Terminal closed'
    case 'workspace_destroyed': return 'Workspace destroyed'
    default: return type
  }
}

function eventBadgeClass(type: AuditEventType) {
  switch (type) {
    case 'terminal_started': return 'bg-cyan-900/60 text-cyan-300 border border-cyan-800'
    case 'terminal_exited': return 'bg-green-900/60 text-green-300 border border-green-800'
    case 'terminal_closed': return 'bg-orange-900/60 text-orange-300 border border-orange-800'
    case 'workspace_destroyed': return 'bg-red-900/60 text-red-300 border border-red-800'
    default: return 'bg-gray-800 text-gray-300 border border-gray-700'
  }
}

function AuditPage() {
  const { events } = Route.useLoaderData()

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <span className="ml-2 text-sm text-gray-400">({events.length} events)</span>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500">No audit events yet.</p>
      ) : (
        <div className="space-y-2 max-w-3xl">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3"
            >
              {eventIcon(e.eventType as AuditEventType)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${eventBadgeClass(e.eventType as AuditEventType)}`}>
                    {eventLabel(e.eventType as AuditEventType)}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words">{e.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
