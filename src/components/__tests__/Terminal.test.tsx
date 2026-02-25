import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@xterm/xterm', () => {
  const terminalMock = vi.fn().mockImplementation(() => ({
    loadAddon: vi.fn(),
    open: vi.fn(),
    focus: vi.fn(),
    write: vi.fn(),
    onData: vi.fn(() => ({ dispose: vi.fn() })),
    dispose: vi.fn(),
    cols: 80,
    rows: 24,
  }))
  return {
    default: { Terminal: terminalMock },
    Terminal: terminalMock,
  }
})

vi.mock('@xterm/addon-fit', () => {
  const fitAddonMock = vi.fn().mockImplementation(() => ({ fit: vi.fn() }))
  return {
    default: { FitAddon: fitAddonMock },
    FitAddon: fitAddonMock,
  }
})

vi.mock('@xterm/xterm/css/xterm.css', () => ({}))

vi.mock('../../db/terminal', () => ({
  startTerminalSession: vi.fn().mockResolvedValue({ sessionId: 'mock-session' }),
  pollTerminalOutput: vi.fn().mockResolvedValue({ output: '' }),
  sendTerminalInput: vi.fn().mockResolvedValue(undefined),
  resizeTerminalSession: vi.fn().mockResolvedValue(undefined),
  stopTerminalSession: vi.fn().mockResolvedValue(undefined),
}))

// ── Tests ──────────────────────────────────────────────────────────────────────

import TerminalPanel from '../Terminal'

describe('TerminalPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom doesn't implement ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }))
  })

  it('renders the cwd in the title bar', () => {
    render(
      <TerminalPanel cwd="/home/user/project" onClose={vi.fn()} />,
    )
    expect(screen.getByText('/home/user/project')).toBeInTheDocument()
  })

  it('renders the drag handle', () => {
    render(<TerminalPanel cwd="/tmp" onClose={vi.fn()} />)
    expect(screen.getByTestId('terminal-drag-handle')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<TerminalPanel cwd="/tmp" onClose={onClose} />)
    fireEvent.click(screen.getByTitle('Close terminal'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onToggleMaximize on double-click of the title bar', () => {
    const onToggleMaximize = vi.fn()
    render(
      <TerminalPanel
        cwd="/tmp"
        onClose={vi.fn()}
        onToggleMaximize={onToggleMaximize}
      />,
    )
    fireEvent.doubleClick(screen.getByTitle('Double-click to toggle maximize'))
    expect(onToggleMaximize).toHaveBeenCalledOnce()
  })

  it('does not throw when onToggleMaximize is not provided', () => {
    render(<TerminalPanel cwd="/tmp" onClose={vi.fn()} />)
    expect(() =>
      fireEvent.doubleClick(screen.getByTitle('Double-click to toggle maximize')),
    ).not.toThrow()
  })

  it('calls onHeightChange during drag', () => {
    const onHeightChange = vi.fn()
    const { container } = render(
      <TerminalPanel cwd="/tmp" onClose={vi.fn()} onHeightChange={onHeightChange} />,
    )
    // jsdom always returns 0 for offsetHeight; mock the panel's height
    const panel = container.firstChild as HTMLElement
    Object.defineProperty(panel, 'offsetHeight', { value: 300, configurable: true })

    const handle = screen.getByTestId('terminal-drag-handle')

    // Drag up by 50px — terminal should grow from 300 to 350
    fireEvent.mouseDown(handle, { clientY: 300 })
    fireEvent.mouseMove(document, { clientY: 250 })

    expect(onHeightChange).toHaveBeenCalled()
    const newHeight = onHeightChange.mock.calls[0][0]
    expect(newHeight).toBe(350)
  })

  it('enforces a minimum height of 80px during drag', () => {
    const onHeightChange = vi.fn()
    render(
      <TerminalPanel cwd="/tmp" onClose={vi.fn()} onHeightChange={onHeightChange} />,
    )
    const handle = screen.getByTestId('terminal-drag-handle')

    // Drag way down (shrink terminal far below minimum)
    fireEvent.mouseDown(handle, { clientY: 100 })
    fireEvent.mouseMove(document, { clientY: 9999 })

    const newHeight = onHeightChange.mock.calls[0][0]
    expect(newHeight).toBe(80)
  })

  it('stops calling onHeightChange after mouseup', () => {
    const onHeightChange = vi.fn()
    render(
      <TerminalPanel cwd="/tmp" onClose={vi.fn()} onHeightChange={onHeightChange} />,
    )
    const handle = screen.getByTestId('terminal-drag-handle')

    fireEvent.mouseDown(handle, { clientY: 300 })
    fireEvent.mouseMove(document, { clientY: 250 })
    fireEvent.mouseUp(document)
    onHeightChange.mockClear()

    // Further moves should not trigger callback
    fireEvent.mouseMove(document, { clientY: 200 })
    expect(onHeightChange).not.toHaveBeenCalled()
  })
})
