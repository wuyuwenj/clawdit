import { useMemo, useState } from 'react'
import { ScanPhase, ScanStatus, Attack, AttackCategory } from '@shared/types'
import CategoryCard from './CategoryCard'
import AttackFeed from './AttackFeed'
import LiveLog from './LiveLog'

interface ScanDashboardProps {
  state: { startedAttackIds: Set<string> } & import('@shared/types').ScanState
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
  if (score > 80) return 'text-cyan-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

export default function ScanDashboard({ state, paused, nextAttack, onPause, onStop, onNext, onViewFindings }: ScanDashboardProps): JSX.Element {
  const isRunning = state.status === ScanStatus.RUNNING
  const [filterCategory, setFilterCategory] = useState<AttackCategory | null>(null)
  const allResults = useMemo(
    () => state.categories.flatMap((c) => c.results).sort((a, b) => a.timestamp - b.timestamp),
    [state.categories]
  )

  const activeAttacks = useMemo(() => {
    const resultIds = new Set(allResults.map((r) => r.attackId))
    return state.categories
      .flatMap((c) => c.attacks)
      .filter((a) => state.startedAttackIds.has(a.id) && !resultIds.has(a.id))
  }, [state.categories, state.startedAttackIds, allResults])

  const findingsCount = useMemo(
    () => allResults.filter((r) => r.compromised).length,
    [allResults]
  )

  return (
    <div className="flex h-full flex-col bg-[#0a0a0c]">
      {/* ── Top bar (draggable title bar region) ─────────────────────────────────── */}
      <div className="drag-region flex items-center gap-4 border-b border-[#27272a] bg-[#121214] pl-20 pr-4 py-2.5">
        {/* Target */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Target</span>
          <span className="font-mono text-xs text-gray-300">
            {truncateUrl(state.targetUrl)}
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#27272a]" />

        {/* Elapsed */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Time</span>
          <span className="font-mono text-xs tabular-nums text-gray-300">
            {formatElapsed(state.elapsed)}
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#27272a]" />

        {/* Phase badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Phase</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-cyan-500 ${
                state.phase !== ScanPhase.COMPLETE ? 'animate-phase-pulse shadow-[0_0_5px_rgba(34,211,238,0.5)]' : ''
              }`}
            />
            <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-400">
              {PHASE_LABELS[state.phase]}
            </span>
          </span>
        </div>

        <div className="flex-1" />

        {/* Findings count */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Findings</span>
          <span
            className={`text-xs font-bold tabular-nums ${
              findingsCount > 0 ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {findingsCount}
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#27272a]" />

        {/* Provisional score */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Score</span>
          <span className={`text-xs font-bold tabular-nums ${getScoreColor(state.overallScore)}`}>
            {state.overallScore}
          </span>
        </div>

        {/* Pause/Resume button (shown while scanning) */}
        {isRunning && onPause && (
          <>
            <div className="h-3.5 w-px bg-[#27272a]" />
            <button
              onClick={onPause}
              className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                paused
                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
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
            className="rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20"
          >
            Stop
          </button>
        )}

        {/* Next button (shown when paused in step mode) */}
        {paused && onNext && nextAttack && (
          <button
            onClick={onNext}
            className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/20 animate-phase-pulse"
          >
            Run Next
          </button>
        )}

        {/* View Results button (shown when scan is complete) */}
        {onViewFindings && (
          <>
            <div className="h-3.5 w-px bg-[#27272a]" />
            <button
              onClick={onViewFindings}
              className="rounded-md bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 hover:bg-white"
            >
              View Results
            </button>
          </>
        )}
      </div>

      {/* ── Paused banner ──────────────────────────── */}
      {paused && isRunning && (
        <div className="flex items-center gap-3 border-b border-amber-500/15 bg-amber-500/5 px-4 py-2">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Paused</span>
          </span>
          {nextAttack ? (
            <>
              <span className="text-[11px] text-gray-500">
                Next: <span className="font-medium text-gray-300">{nextAttack.name}</span>
              </span>
              {onNext && (
                <button
                  onClick={onNext}
                  className="ml-auto rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/20"
                >
                  Run This Test
                </button>
              )}
            </>
          ) : (
            <span className="text-[11px] text-gray-500">
              Scan paused. Click <span className="font-medium text-cyan-400">Resume</span> to continue.
            </span>
          )}
        </div>
      )}

      {/* ── Main content area ───────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left column: Category cards */}
        <div className="flex w-[250px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-[#27272a] bg-[#0a0a0c] p-3">
          {state.categories.map((cat) => (
            <CategoryCard
              key={cat.category}
              category={cat}
              selected={filterCategory === cat.category}
              onClick={() => setFilterCategory(prev => prev === cat.category ? null : cat.category)}
            />
          ))}
        </div>

        {/* Center column: Attack feed */}
        <div className="flex min-w-0 flex-1 flex-col p-3">
          <AttackFeed results={allResults} activeAttacks={activeAttacks} filterCategory={filterCategory} />
        </div>

        {/* Right column: Live log */}
        <div className="flex w-[300px] shrink-0 flex-col border-l border-[#27272a] p-3">
          <LiveLog entries={state.log} />
        </div>
      </div>
    </div>
  )
}
