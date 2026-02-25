import { useEffect, useState } from 'react'
import { getEnvInfo } from '../db/env'
import { CircleDot, Container, Bot } from 'lucide-react'

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

export default function EnvInfoBar() {
  const [info, setInfo] = useState<EnvInfo | null>(null)

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
    </div>
  )
}
