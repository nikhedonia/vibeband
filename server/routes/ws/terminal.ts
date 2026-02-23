import { defineWebSocketHandler } from 'h3'
import pty from 'node-pty'
import { existsSync } from 'node:fs'

export default defineWebSocketHandler({
  open(peer) {
    const url = new URL(peer.request!.url, 'http://localhost')
    const cwd = url.searchParams.get('cwd') ?? process.cwd()
    const validCwd = existsSync(cwd) ? cwd : process.cwd()

    const shell = process.env.SHELL ?? '/bin/bash'
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: validCwd,
      env: process.env as Record<string, string>,
    })

    ;(peer as any)._pty = ptyProcess

    ptyProcess.onData((data: string) => {
      peer.send(data)
    })

    ptyProcess.onExit(() => {
      peer.close()
    })
  },

  message(peer, message) {
    const ptyProcess = (peer as any)._pty as pty.IPty | undefined
    if (!ptyProcess) return

    const text = message.text()
    try {
      const msg = JSON.parse(text) as { type: string; data?: string; cols?: number; rows?: number }
      if (msg.type === 'input' && msg.data !== undefined) {
        ptyProcess.write(msg.data)
      } else if (msg.type === 'resize' && msg.cols && msg.rows) {
        ptyProcess.resize(msg.cols, msg.rows)
      }
    } catch {
      ptyProcess.write(text)
    }
  },

  close(peer) {
    const ptyProcess = (peer as any)._pty as pty.IPty | undefined
    if (ptyProcess) {
      try {
        ptyProcess.kill()
      } catch {
        // already dead
      }
    }
  },
})
