import { useState, useEffect, useRef } from 'react'
import {
  Settings,
  Play,
  Plus,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
} from 'lucide-react'
import { useProjectHealth, type HealthCheck } from '../hooks/useProjectHealth'
import { runHealthCheck, getProjectScripts } from '../db/env'

type CheckStatus = 'idle' | 'running' | 'ok' | 'fail'

interface RunState {
  status: CheckStatus
  output: string
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({
  check,
  run,
  onClick,
}: {
  check: HealthCheck
  run: RunState
  onClick: () => void
}) {
  const icon =
    run.status === 'running' ? (
      <Loader size={10} className="animate-spin" />
    ) : run.status === 'ok' ? (
      <CheckCircle size={10} />
    ) : run.status === 'fail' ? (
      <XCircle size={10} />
    ) : (
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 inline-block" />
    )

  const color =
    run.status === 'ok'
      ? 'bg-green-900/50 text-green-300 border-green-800/60'
      : run.status === 'fail'
        ? 'bg-red-900/40 text-red-400 border-red-900/50'
        : run.status === 'running'
          ? 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50'
          : 'bg-gray-800/60 text-gray-400 border-gray-700'

  const title =
    run.output
      ? `${check.label}: ${run.status}\n\n${run.output.slice(0, 300)}`
      : `${check.label}: ${run.status}`

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors hover:opacity-80 ${color}`}
    >
      {icon}
      <span>{check.label}</span>
    </button>
  )
}

// ── Preset picker ─────────────────────────────────────────────────────────────

interface Preset {
  label: string
  command: string
}

function PresetPicker({
  repoPath,
  onSelect,
}: {
  repoPath?: string
  onSelect: (preset: Preset) => void
}) {
  const [open, setOpen] = useState(false)
  const [presets, setPresets] = useState<Preset[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !repoPath) return
    getProjectScripts({ data: { repoPath } }).then(({ scripts, hasDockerfile }) => {
      const p: Preset[] = []
      if ('test' in scripts) p.push({ label: 'Test', command: 'npm run test' })
      if ('build' in scripts) p.push({ label: 'Build', command: 'npm run build' })
      if ('dev' in scripts) p.push({ label: 'Dev', command: 'npm run dev' })
      if ('preview' in scripts) p.push({ label: 'Preview', command: 'npm run preview' })
      if ('lint' in scripts) p.push({ label: 'Lint', command: 'npm run lint' })
      if (hasDockerfile) p.push({ label: 'Docker build', command: 'docker build .' })
      if (p.length === 0) {
        p.push({ label: 'Test', command: 'npm test' })
        p.push({ label: 'Build', command: 'npm run build' })
        p.push({ label: 'Dev', command: 'npm run dev' })
      }
      setPresets(p)
    }).catch(() => {})
  }, [open, repoPath])

  // close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
      >
        Add preset
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px] py-1">
          {presets.map((p) => (
            <button
              key={p.command}
              type="button"
              onClick={() => { onSelect(p); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-gray-500 ml-2">{p.command}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Check row editor ──────────────────────────────────────────────────────────

function CheckRow({
  check,
  run,
  repoPath,
  onChange,
  onDelete,
  onRun,
}: {
  check: HealthCheck
  run: RunState
  repoPath?: string
  onChange: (updated: HealthCheck) => void
  onDelete: () => void
  onRun: () => void
}) {
  return (
    <div className="space-y-1.5 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2">
        <input
          value={check.label}
          onChange={(e) => onChange({ ...check, label: e.target.value })}
          placeholder="Label"
          className="w-28 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
        />
        <input
          value={check.command}
          onChange={(e) => onChange({ ...check, command: e.target.value })}
          placeholder="Command…"
          className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white font-mono placeholder-gray-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="button"
          onClick={onRun}
          disabled={run.status === 'running'}
          title="Run command"
          className="p-1.5 rounded bg-cyan-700/40 hover:bg-cyan-700/70 text-cyan-300 disabled:opacity-50 transition-colors"
        >
          {run.status === 'running' ? (
            <Loader size={13} className="animate-spin" />
          ) : (
            <Play size={13} />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Remove"
          className="p-1.5 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {run.output && (
        <pre className={`text-[10px] font-mono p-2 rounded bg-gray-900 overflow-auto max-h-24 ${run.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
          {run.output}
        </pre>
      )}
    </div>
  )
}

// ── Editor modal ──────────────────────────────────────────────────────────────

function EditorModal({
  checks,
  repoPath,
  runStates,
  onClose,
  onUpdate,
  onRunCheck,
}: {
  checks: HealthCheck[]
  repoPath?: string
  runStates: Record<string, RunState>
  onClose: () => void
  onUpdate: (checks: HealthCheck[]) => void
  onRunCheck: (check: HealthCheck) => void
}) {
  function addCustom() {
    const id = `check-${Date.now()}`
    onUpdate([...checks, { id, label: 'Custom', command: '', enabled: true }])
  }

  function addPreset(preset: { label: string; command: string }) {
    const id = `check-${Date.now()}`
    onUpdate([...checks, { id, label: preset.label, command: preset.command, enabled: true }])
  }

  function updateCheck(index: number, updated: HealthCheck) {
    const next = [...checks]
    next[index] = updated
    onUpdate(next)
  }

  function deleteCheck(index: number) {
    onUpdate(checks.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">Project Health Checks</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {checks.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No health checks configured.</p>
          )}
          {checks.map((check, i) => (
            <CheckRow
              key={check.id}
              check={check}
              run={runStates[check.id] ?? { status: 'idle', output: '' }}
              repoPath={repoPath}
              onChange={(updated) => updateCheck(i, updated)}
              onDelete={() => deleteCheck(i)}
              onRun={() => onRunCheck(check)}
            />
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-2">
          <PresetPicker repoPath={repoPath} onSelect={addPreset} />
          <button
            type="button"
            onClick={addCustom}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            <Plus size={11} />
            Custom
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ProjectHealthBar ──────────────────────────────────────────────────────────

export default function ProjectHealthBar({
  projectId,
  repoPath,
}: {
  projectId: number
  repoPath?: string
}) {
  const { checks, updateChecks } = useProjectHealth(projectId)
  const [runStates, setRunStates] = useState<Record<string, RunState>>({})
  const [editorOpen, setEditorOpen] = useState(false)

  const enabledChecks = checks.filter((c) => c.enabled)

  async function runCheck(check: HealthCheck) {
    setRunStates((prev) => ({ ...prev, [check.id]: { status: 'running', output: '' } }))
    try {
      const result = await runHealthCheck({ data: { command: check.command, cwd: repoPath } })
      setRunStates((prev) => ({
        ...prev,
        [check.id]: { status: result.ok ? 'ok' : 'fail', output: result.output },
      }))
    } catch (e) {
      setRunStates((prev) => ({
        ...prev,
        [check.id]: { status: 'fail', output: String(e) },
      }))
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {enabledChecks.map((check) => (
        <Badge
          key={check.id}
          check={check}
          run={runStates[check.id] ?? { status: 'idle', output: '' }}
          onClick={() => runCheck(check)}
        />
      ))}

      <button
        type="button"
        onClick={() => setEditorOpen(true)}
        title="Configure health checks"
        className="p-1.5 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
      >
        <Settings size={14} />
      </button>

      {editorOpen && (
        <EditorModal
          checks={checks}
          repoPath={repoPath}
          runStates={runStates}
          onClose={() => setEditorOpen(false)}
          onUpdate={updateChecks}
          onRunCheck={runCheck}
        />
      )}
    </div>
  )
}
