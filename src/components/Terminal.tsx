import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { X } from 'lucide-react'
import '@xterm/xterm/css/xterm.css'

interface TerminalPanelProps {
  cwd: string
  onClose: () => void
}

export default function TerminalPanel({ cwd, onClose }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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

    // Multiple deferred fits to handle flex layout settling
    requestAnimationFrame(() => {
      fitAddon.fit()
      setTimeout(() => fitAddon.fit(), 100)
    })

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${location.host}/ws/terminal?cwd=${encodeURIComponent(cwd)}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      fitAddon.fit()
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
    }

    ws.onmessage = (e: MessageEvent<string>) => {
      term.write(e.data)
    }

    ws.onclose = () => {
      term.write('\r\n\x1b[2m[connection closed]\x1b[0m\r\n')
    }

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    const observer = new ResizeObserver(() => {
      fitAddon.fit()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      ws.close()
      term.dispose()
    }
  }, [cwd])

  return (
    <div className="flex flex-col h-full bg-[#030712] border-t border-gray-800">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
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
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ minHeight: 0 }} />
    </div>
  )
}
