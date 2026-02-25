import { useEffect, useState } from 'react'
import { getEnvInfo } from '../db/env'
import { useEnvConfig } from '../hooks/useEnvConfig'
import { CircleDot, Container, Bot, FlaskConical, Hammer, Play } from 'lucide-react'

type EnvInfo = Awaited<ReturnType<typeof getEnvInfo>>

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${ok ? 'bg-green-400' : 'bg-red-400'}`}
    />
  )
}

function EnvRow({
  icon,
  label,
  ok,
  detail,
}: {
  icon: React.ReactNode
  label: string
  ok: boolean
  detail: string
}) {
  return (
    <div className="flex items-start gap-1.5" title={detail}>
      <span className="text-gray-500 mt-px">{icon}</span>
      <span className={`truncate ${ok ? 'text-gray-300' : 'text-gray-500'}`}>{label}</span>
      <StatusDot ok={ok} />
    </div>
  )
}

function HealthBadge({
  icon,
  label,
  ok,
}: {
  icon: React.ReactNode
  label: string
  ok: boolean
}) {
  return (
    <span
      title={ok ? `${label}: found` : `${label}: not found`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
        ok
          ? 'bg-green-900/50 text-green-300 border border-green-800/60'
          : 'bg-red-900/30 text-red-400 border border-red-900/40'
      }`}
    >
      {icon}
      {label}
    </span>
  )
}

export default function EnvInfoBar() {
  const [info, setInfo] = useState<EnvInfo | null>(null)
  const { config } = useEnvConfig()

  useEffect(() => {
    getEnvInfo().then(setInfo).catch(() => {})
  }, [])

  if (!info) {
    return (
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="text-[10px] text-gray-600 animate-pulse">Checking environment…</div>
      </div>
    )
  }

  const anyHealthVisible = config.showTests || config.showBuild || config.showPreview

  return (
    <div className="px-3 py-2 border-b border-gray-800 text-[11px] space-y-1">
      <EnvRow
        icon={<CircleDot size={11} />}
        label="GitHub CLI"
        ok={info.gh.loggedIn}
        detail={
          !info.gh.installed
            ? 'gh: not installed'
            : info.gh.loggedIn
              ? 'gh: logged in'
              : 'gh: not logged in'
        }
      />
      <EnvRow
        icon={<Container size={11} />}
        label="Docker"
        ok={info.docker.running}
        detail={info.docker.running ? 'Docker daemon: running' : 'Docker daemon: not running'}
      />
      <EnvRow
        icon={<Bot size={11} />}
        label="Copilot CLI"
        ok={info.copilot.installed}
        detail={info.copilot.installed ? 'gh copilot: installed' : 'gh copilot: not installed'}
      />

      {anyHealthVisible && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {config.showTests && (
            <HealthBadge icon={<FlaskConical size={9} />} label="Test" ok={info.health.hasTests} />
          )}
          {config.showBuild && (
            <HealthBadge icon={<Hammer size={9} />} label="Build" ok={info.health.hasBuild} />
          )}
          {config.showPreview && (
            <HealthBadge icon={<Play size={9} />} label="Dev" ok={info.health.hasPreview} />
          )}
        </div>
      )}
    </div>
  )
}
