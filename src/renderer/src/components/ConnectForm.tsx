import { useState, useCallback, useEffect, type FormEvent } from 'react'
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react'

interface ConnectFormProps {
  onStartScan: (config: { targetUrl: string; authToken: string; stepMode?: boolean }) => Promise<void>
}

type StatusBanner =
  | { type: 'success'; message: string }
  | { type: 'warning'; message: string }
  | { type: 'error'; message: string }
  | null

export default function ConnectForm({ onStartScan }: ConnectFormProps): JSX.Element {
  const [targetUrl, setTargetUrl] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [stepMode, setStepMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusBanner, setStatusBanner] = useState<StatusBanner>(null)

  // Use preloaded gateway result (validated at startup) or fall back to reading config
  useEffect(() => {
    window.shellclaw.getPreloadedGateway().then((result) => {
      if (result) {
        // We have a preloaded result from startup validation
        if (result.config) {
          setTargetUrl(result.config.url)
          setAuthToken(result.config.token)
        }

        if (result.success) {
          if (result.autoFixed) {
            setStatusBanner({
              type: 'success',
              message: 'Auto-enabled HTTP endpoints and restarted gateway'
            })
          } else {
            setStatusBanner({
              type: 'success',
              message: 'Auto-detected OpenClaw config from ~/.openclaw/openclaw.json'
            })
          }
        } else {
          // Show error banners based on error type
          switch (result.errorType) {
            case 'no_config':
              // No banner for missing config - just leave form empty
              break
            case 'no_token':
              setStatusBanner({
                type: 'warning',
                message: 'OpenClaw config found but no auth token configured'
              })
              break
            case 'gateway_down':
              setStatusBanner({
                type: 'error',
                message: result.error || 'Could not connect to gateway'
              })
              break
            case 'auth_failed':
              setStatusBanner({
                type: 'error',
                message: 'Gateway authentication failed - check your token'
              })
              break
            case 'auto_fix_failed':
              setStatusBanner({
                type: 'error',
                message: result.error || 'Attempted to enable HTTP endpoints but gateway restart failed'
              })
              break
          }
        }
        return
      }

      // Fallback: read config file directly (shouldn't happen normally)
      window.shellclaw.readOpenClawConfig().then((config) => {
        if (config?.gateway) {
          const port = config.gateway.port || 18789
          const token = config.gateway.auth?.token || ''
          setTargetUrl(`http://127.0.0.1:${port}`)
          if (token) setAuthToken(token)
          setStatusBanner({
            type: 'success',
            message: 'Auto-detected OpenClaw config from ~/.openclaw/openclaw.json'
          })
        }
      }).catch(() => {
        // No config found, user fills manually
      })
    }).catch(() => {
      // Preload not available, try reading config directly
      window.shellclaw.readOpenClawConfig().then((config) => {
        if (config?.gateway) {
          const port = config.gateway.port || 18789
          const token = config.gateway.auth?.token || ''
          setTargetUrl(`http://127.0.0.1:${port}`)
          if (token) setAuthToken(token)
          setStatusBanner({
            type: 'success',
            message: 'Auto-detected OpenClaw config from ~/.openclaw/openclaw.json'
          })
        }
      }).catch(() => {
        // No config found
      })
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
          authToken: trimmedToken,
          stepMode
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start scan')
        setSubmitting(false)
      }
    },
    [targetUrl, authToken, stepMode, isValidUrl, onStartScan]
  )

  const canSubmit = targetUrl.trim().length > 0 && authToken.trim().length > 0 && !submitting

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#0a0a0c] p-4 font-sans">
      {/* Drag region for window movement */}
      <div className="drag-region absolute top-0 left-0 right-0 h-10" />
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-[#121214] p-3 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-zinc-300" strokeWidth={1.5} />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-gray-100">
            Clawdit
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
            Autonomous local security auditing for OpenClaw
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#27272a] bg-[#121214] p-7 shadow-2xl"
        >
          {/* Status banner */}
          {statusBanner && (
            <div
              className={`mb-5 flex items-center gap-2 rounded-md border px-3 py-2 ${
                statusBanner.type === 'success'
                  ? 'border-cyan-900/30 bg-cyan-950/20'
                  : statusBanner.type === 'warning'
                    ? 'border-amber-900/30 bg-amber-950/20'
                    : 'border-red-500/20 bg-red-500/10'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  statusBanner.type === 'success'
                    ? 'bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.5)]'
                    : statusBanner.type === 'warning'
                      ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]'
                      : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                }`}
              ></span>
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  statusBanner.type === 'success'
                    ? 'text-cyan-400'
                    : statusBanner.type === 'warning'
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                {statusBanner.message}
              </span>
            </div>
          )}

          {/* Target URL */}
          <div className="mb-5">
            <label htmlFor="target-url" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Target Agent URL
            </label>
            <input
              id="target-url"
              type="text"
              value={targetUrl}
              onChange={(e) => { setTargetUrl(e.target.value); setError(null) }}
              placeholder="http://127.0.0.1:18789"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-md border border-zinc-800 bg-[#0a0a0c] px-3 py-2.5 font-mono text-sm text-gray-200 placeholder-zinc-700 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* Auth Token */}
          <div className="mb-6">
            <label htmlFor="auth-token" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Gateway Token <span className="text-red-500">*</span>
            </label>
            <input
              id="auth-token"
              type="password"
              value={authToken}
              onChange={(e) => { setAuthToken(e.target.value); setError(null) }}
              placeholder="••••••••"
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-md border border-zinc-800 bg-[#0a0a0c] px-3 py-2.5 font-mono text-sm text-gray-200 placeholder-zinc-700 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* Step Mode Toggle */}
          <div className="mb-8 flex items-center justify-between rounded-md border border-zinc-800/80 bg-[#0a0a0c] px-3 py-2.5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-300">Step Mode</div>
              <div className="mt-0.5 text-[10px] text-zinc-500">Pause before each test, advance manually</div>
            </div>
            <button
              type="button"
              onClick={() => setStepMode(!stepMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-[#121214] ${
                stepMode ? 'border-cyan-500/50 bg-cyan-500/20' : 'border-zinc-700 bg-zinc-800'
              }`}
              role="switch"
              aria-checked={stepMode}
            >
              <span className="sr-only">Toggle Step Mode</span>
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full shadow transition duration-200 ease-in-out ${
                  stepMode ? 'translate-x-4 bg-cyan-400' : 'translate-x-1 bg-zinc-400'
                }`}
              />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-md bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-opacity hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Connecting...' : 'Initiate Scan'}
          </button>

          {/* Disclaimer & Privacy Note */}
          <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800/50 pt-5">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <p className="text-[11px] leading-relaxed text-zinc-500">
                <strong className="font-medium text-zinc-400">Privacy First:</strong> Scans private agents locally. No public exposure or external telemetry required.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/70" />
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Authorized systems only. Ensure you have permission to test this target.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
