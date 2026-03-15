import { useMemo } from 'react'
import { ScanState, ScanPhase, ScanStatus, Attack } from '@shared/types'
import CategoryCard from './CategoryCard'
import AttackFeed from './AttackFeed'
import LiveLog from './LiveLog'

interface ScanDashboardProps {
  state: ScanState
  paused?: boolean
  nextAttack?: Attack | null
  onPause?: () => void
  onStop?: () => void
  onNext?: () => void
  onViewFindings?: () => void
}

const PHASE_LABELS: Record<ScanPhase, string> = {
  [ScanPhase.CONNECTING]: 'Connecting',
  [ScanPhase.RECON]: 'Recon',
  [ScanPhase.PLANNING]: 'Planning',
  [ScanPhase.EXECUTING]: 'Executing',
  [ScanPhase.COMPLETE]: 'Complete'
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function truncateUrl(url: string, max: number = 50): string {
  if (url.length <= max) return url
  return url.slice(0, max) + '...'
}

function getScoreColor(score: number): string {
  if (score > 80) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export default function ScanDashboard({ state, paused, nextAttack, onPause, onStop, onNext, onViewFindings }: ScanDashboardProps): JSX.Element {
  const isRunning = state.status === ScanStatus.RUNNING
  const allResults = useMemo(
    () => state.categories.flatMap((c) => c.results).sort((a, b) => a.timestamp - b.timestamp),
    [state.categories]
  )

  const activeAttacks = useMemo(() => {
    const resultIds = new Set(allResults.map((r) => r.attackId))
    return state.categories
      .flatMap((c) => c.attacks)
      .filter((a) => !resultIds.has(a.id))
  }, [state.categories, allResults])

  const findingsCount = useMemo(
    () => allResults.filter((r) => r.compromised).length,
    [allResults]
  )

  return (
    <div className="flex h-full flex-col">
      {/* ── Top bar (draggable title bar region) ─────────────────────────────────── */}
      <div className="drag-region flex items-center gap-4 border-b border-zinc-800 bg-[#18181b] pl-20 pr-4 py-3">
        {/* Target */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500">Target</span>
          <span className="font-mono text-sm text-zinc-300">
            {truncateUrl(state.targetUrl)}
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Elapsed */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500">Time</span>
          <span className="font-mono text-sm tabular-nums text-zinc-300">
            {formatElapsed(state.elapsed)}
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Phase badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500">Phase</span>
          <span
            className={`rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-400 ${
              state.phase !== ScanPhase.COMPLETE ? 'animate-phase-pulse' : ''
            }`}
          >
            {PHASE_LABELS[state.phase]}
          </span>
        </div>

        <div className="flex-1" />

        {/* Findings count */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500">Findings</span>
          <span
            className={`text-sm font-bold tabular-nums ${
              findingsCount > 0 ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            {findingsCount}
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Provisional score */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500">Score</span>
          <span className={`text-sm font-bold tabular-nums ${getScoreColor(state.overallScore)}`}>
            {state.overallScore}
          </span>
        </div>

        {/* Pause/Resume button (shown while scanning) */}
        {isRunning && onPause && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <button
              onClick={onPause}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                paused
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                  : 'border-yellow-500/30 bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
              }`}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </>
        )}

        {/* Stop button (shown while scanning) */}
        {isRunning && onStop && (
          <button
            onClick={onStop}
            className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25"
          >
            Stop
          </button>
        )}

        {/* Next button (shown when paused in step mode) */}
        {paused && onNext && nextAttack && (
          <button
            onClick={onNext}
            className="rounded-lg border border-blue-500/30 bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/25 animate-phase-pulse"
          >
            Run Next
          </button>
        )}

        {/* View Results button (shown when scan is complete) */}
        {onViewFindings && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <button
              onClick={onViewFindings}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25"
            >
              View Results
            </button>
          </>
        )}
      </div>

      {/* ── Paused banner ──────────────────────────── */}
      {paused && isRunning && (
        <div className="flex items-center gap-3 border-b border-yellow-500/20 bg-yellow-500/5 px-4 py-2">
          <span className="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
            PAUSED
          </span>
          {nextAttack ? (
            <>
              <span className="text-xs text-zinc-400">
                Next: <span className="font-medium text-zinc-200">{nextAttack.name}</span>
              </span>
              {onNext && (
                <button
                  onClick={onNext}
                  className="ml-auto rounded-lg border border-blue-500/30 bg-blue-500/15 px-4 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/25"
                >
                  Run This Test
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-zinc-400">
              Scan paused. Click <span className="font-medium text-emerald-400">Resume</span> to continue.
            </span>
          )}
        </div>
      )}

      {/* ── Main content area ───────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left column: Category cards */}
        <div className="flex w-[250px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-zinc-800 bg-[#09090b] p-3">
          {state.categories.map((cat) => (
            <CategoryCard key={cat.category} category={cat} />
          ))}
        </div>

        {/* Center column: Attack feed */}
        <div className="flex min-w-0 flex-1 flex-col p-3">
          <AttackFeed results={allResults} activeAttacks={activeAttacks} />
        </div>

        {/* Right column: Live log */}
        <div className="flex w-[300px] shrink-0 flex-col border-l border-zinc-800 p-3">
          <LiveLog entries={state.log} />
        </div>
      </div>
    </div>
  )
}
