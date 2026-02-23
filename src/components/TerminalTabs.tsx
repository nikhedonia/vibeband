import { useCallback, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import type { TerminalSession } from '../contexts/TerminalSessions'
import TerminalPanel from './Terminal'

interface TerminalTabsProps {
  sessions: TerminalSession[]
  activeId: string | null
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onAddSession?: () => void
  onSetBackendSessionId?: (id: string, backendSessionId: string) => void
  onHeightChange?: (newHeight: number) => void
  onToggleMaximize?: () => void
  isMaximized?: boolean
}

export default function TerminalTabs({
  sessions,
  activeId,
  onActivate,
  onClose,
  onAddSession,
  onSetBackendSessionId,
  onHeightChange,
  onToggleMaximize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isMaximized: _isMaximized,
}: TerminalTabsProps) {
  const dragStartY = useRef<number | null>(null)
  const dragStartHeight = useRef<number>(0)

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragStartY.current = e.clientY
      const panel = (e.currentTarget as HTMLElement).closest('[data-terminal-panel]') as HTMLElement | null
      dragStartHeight.current = panel?.offsetHeight ?? 256

      const onMouseMove = (ev: MouseEvent) => {
        if (dragStartY.current === null) return
        const delta = dragStartY.current - ev.clientY
        const newHeight = Math.max(80, dragStartHeight.current + delta)
        onHeightChange?.(newHeight)
      }
      const onMouseUp = () => {
        dragStartY.current = null
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [onHeightChange],
  )

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0]

  if (sessions.length === 0) return null

  return (
    <div data-terminal-panel className="flex flex-col h-full bg-[#030712] border-t border-gray-800">
      {/* Drag resize handle */}
      <div
        data-testid="terminal-drag-handle"
        onMouseDown={handleDragMouseDown}
        className="h-1.5 w-full bg-gray-800 hover:bg-cyan-700 cursor-row-resize flex-shrink-0 transition-colors"
        title="Drag to resize"
      />

      {/* Tab bar */}
      <div
        className="flex items-center bg-gray-900 border-b border-gray-800 flex-shrink-0 select-none overflow-x-auto"
        onDoubleClick={onToggleMaximize}
        title="Double-click to toggle maximize"
      >
        {sessions.map((s) => {
          const isActive = s.id === active?.id
          const label = s.ticketTitle ?? s.cwd.split('/').pop() ?? s.cwd
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onActivate(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border-r border-gray-800 transition-colors flex-shrink-0 max-w-[160px] group/tab ${
                isActive
                  ? 'bg-[#030712] text-cyan-300'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="truncate">{label}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onClose(s.id) }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClose(s.id) } }}
                className="ml-auto opacity-0 group-hover/tab:opacity-100 text-gray-500 hover:text-white transition-opacity flex-shrink-0"
                title="Close session"
              >
                <X size={11} />
              </span>
            </button>
          )
        })}

        {onAddSession && (
          <button
            type="button"
            onClick={onAddSession}
            className="px-2 py-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
            title="New terminal session"
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {/* Active terminal body */}
      {active && (
        <TerminalPanel
          key={active.id}
          cwd={active.cwd}
          existingBackendSessionId={active.backendSessionId}
          onBackendSessionStarted={(sid) => onSetBackendSessionId?.(active.id, sid)}
          detach
          showHeader={false}
          onClose={() => onClose(active.id)}
        />
      )}
    </div>
  )
}
