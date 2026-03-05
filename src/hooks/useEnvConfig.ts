import { useState, useEffect } from 'react'

export interface EnvConfig {
  showTests: boolean
  showBuild: boolean
  showPreview: boolean
}

const STORAGE_KEY = 'vibeband:envConfig'

const defaults: EnvConfig = {
  showTests: true,
  showBuild: true,
  showPreview: true,
}

export function useEnvConfig() {
  const [config, setConfig] = useState<EnvConfig>(() => {
    if (typeof window === 'undefined') return defaults
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch { /* ignore */ }
  }, [config])

  function update(patch: Partial<EnvConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  return { config, update }
}
