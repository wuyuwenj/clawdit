import { useState, useCallback, useEffect, type FormEvent } from 'react'

interface ConnectFormProps {
  onStartScan: (config: { targetUrl: string; authToken: string }) => Promise<void>
}

export default function ConnectForm({ onStartScan }: ConnectFormProps): JSX.Element {
  const [targetUrl, setTargetUrl] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoDetected, setAutoDetected] = useState(false)

  // Auto-fill from ~/.openclaw/openclaw.json on mount
  useEffect(() => {
    window.shellclaw.readOpenClawConfig().then((config) => {
      if (config?.gateway) {
        const port = config.gateway.port || 18789
        const token = config.gateway.auth?.token || ''
        setTargetUrl(`http://127.0.0.1:${port}`)
        if (token) setAuthToken(token)
        setAutoDetected(true)
      }
    }).catch(() => {
      // No config found, user fills manually
    })
  }, [])

  const isValidUrl = useCallback((url: string): boolean => {
    return /^https?:\/\/.+/.test(url.trim())
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setError(null)

      const trimmedUrl = targetUrl.trim()
      if (!isValidUrl(trimmedUrl)) {
        setError('URL must start with http:// or https://')
        return
      }

      const trimmedToken = authToken.trim()
      if (!trimmedToken) {
        setError('Gateway token is required')
        return
      }

      setSubmitting(true)
      try {
        await onStartScan({
          targetUrl: trimmedUrl,
          authToken: trimmedToken
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start scan')
        setSubmitting(false)
      }
    },
    [targetUrl, authToken, isValidUrl, onStartScan]
  )

  const canSubmit = targetUrl.trim().length > 0 && authToken.trim().length > 0 && !submitting

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#09090b] p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-100">
            Clawdit
          </h1>
          <p className="text-sm text-zinc-500">
            Autonomous Red-Team Harness for OpenClaw Agents
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl"
        >
          {/* Auto-detect badge */}
          {autoDetected && (
            <div className="mb-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-400">
              Auto-detected OpenClaw config from ~/.openclaw/openclaw.json
            </div>
          )}

          {/* Target URL */}
          <div className="mb-4">
            <label
              htmlFor="target-url"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Target URL
            </label>
            <input
              id="target-url"
              type="text"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value)
                setError(null)
              }}
              placeholder="https://localhost:8080 or gateway URL"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-lg border border-zinc-700 bg-[#09090b] px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Auth Token */}
          <div className="mb-6">
            <label
              htmlFor="auth-token"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Gateway Token{' '}
              <span className="normal-case tracking-normal text-red-400">*</span>
            </label>
            <input
              id="auth-token"
              type="password"
              value={authToken}
              onChange={(e) => {
                setAuthToken(e.target.value)
                setError(null)
              }}
              placeholder="Gateway auth token"
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-lg border border-zinc-700 bg-[#09090b] px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Connecting...
              </span>
            ) : (
              'Initiate Scan'
            )}
          </button>

          {/* Disclaimer */}
          <p className="mt-4 text-center text-xs leading-relaxed text-zinc-600">
            Authorized systems only. Ensure you have permission to test this target.
          </p>
        </form>
      </div>
    </div>
  )
}
