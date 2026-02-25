import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { X } from 'lucide-react'
import '@xterm/xterm/css/xterm.css'
import {
  startTerminalSession,
  pollTerminalOutput,
  sendTerminalInput,
  resizeTerminalSession,
  stopTerminalSession,
} from '../db/terminal'

interface TerminalPanelProps {
  cwd: string
  /** If provided, reconnects to an existing PTY session instead of starting a new one */
  existingBackendSessionId?: string
  /** Called once the backend session ID is known (new or reconnected) */
  onBackendSessionStarted?: (sessionId: string) => void
  /**
   * When true the component will NOT kill the PTY session on unmount.
   * Use this for retained sessions managed by an external context.
   */
  detach?: boolean
  /** Hide the built-in drag handle + header bar (e.g. when used inside TerminalTabs) */
  showHeader?: boolean
  onClose: () => void
  onHeightChange?: (newHeight: number) => void
  onToggleMaximize?: () => void
  isMaximized?: boolean
}

export default function TerminalPanel({
  cwd,
  existingBackendSessionId,
  onBackendSessionStarted,
  detach = false,
  showHeader = true,
  onClose,
  onHeightChange,
  onToggleMaximize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isMaximized: _isMaximized,
}: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragStartHeight = useRef<number>(0)

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragStartY.current = e.clientY
      // read current rendered height from the panel's parent
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

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const term = new XTerm({
      theme: {
        background: '#030712',
        foreground: '#e2e8f0',
        cursor: '#94a3b8',
      },
      fontFamily: '"Cascadia Code", "JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(el)
    term.focus()

    requestAnimationFrame(() => {
      fitAddon.fit()
      setTimeout(() => fitAddon.fit(), 100)
    })

    let sessionId: string | null = existingBackendSessionId ?? null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let alive = true

    async function initSession() {
      if (sessionId) {
        // Reconnecting to existing PTY — just resize and start polling
        fitAddon.fit()
        resizeTerminalSession({ data: { sessionId, cols: term.cols, rows: term.rows } })
      } else {
        try {
          const { sessionId: sid } = await startTerminalSession({ data: { cwd } })
          if (!alive) {
            stopTerminalSession({ data: { sessionId: sid } })
            return
          }
          sessionId = sid
          onBackendSessionStarted?.(sid)
          fitAddon.fit()
          resizeTerminalSession({ data: { sessionId: sid, cols: term.cols, rows: term.rows } })
        } catch {
          term.write('\r\n\x1b[31m[failed to start terminal session]\x1b[0m\r\n')
          return
        }
      }

      pollTimer = setInterval(async () => {
        if (!sessionId) return
        try {
          const { output, alive } = await pollTerminalOutput({ data: { sessionId } })
          if (output) term.write(output)
          if (!alive) {
            if (pollTimer) clearInterval(pollTimer)
            pollTimer = null
            onClose()
          }
        } catch {
          // non-fatal poll failure
        }
      }, 100)
    }

    initSession()

    const disposeData = term.onData((data) => {
      if (sessionId) sendTerminalInput({ data: { sessionId, input: data } })
    })

    const observer = new ResizeObserver(() => {
      fitAddon.fit()
      if (sessionId) {
        resizeTerminalSession({ data: { sessionId, cols: term.cols, rows: term.rows } })
      }
    })
    observer.observe(el)

    return () => {
      alive = false
      observer.disconnect()
      disposeData.dispose()
      if (pollTimer) clearInterval(pollTimer)
      if (!detach && sessionId) stopTerminalSession({ data: { sessionId } })
      term.dispose()
    }
  }, [cwd, existingBackendSessionId])

  return (
    <div data-terminal-panel className="flex flex-col h-full bg-[#030712] border-t border-gray-800">
      {showHeader && (
        <>
          {/* Drag resize handle */}
          <div
            data-testid="terminal-drag-handle"
            onMouseDown={handleDragMouseDown}
            className="h-1.5 w-full bg-gray-800 hover:bg-cyan-700 cursor-row-resize flex-shrink-0 transition-colors"
            title="Drag to resize"
          />
          <div
            className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 flex-shrink-0 select-none"
            onDoubleClick={onToggleMaximize}
            title="Double-click to toggle maximize"
          >
            <span className="text-xs text-gray-400 font-mono truncate max-w-[80%]">{cwd}</span>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors ml-2"
              title="Close terminal"
            >
              <X size={14} />
            </button>
          </div>
        </>
      )}
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ minHeight: 0 }} />
    </div>
  )
}
