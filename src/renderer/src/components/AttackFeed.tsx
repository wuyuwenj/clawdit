import { useEffect, useRef } from 'react'
import { AttackCategory, AttackResult, Attack } from '@shared/types'

interface AttackFeedProps {
  results: AttackResult[]
  activeAttacks: Attack[]
}

const CATEGORY_DOT_COLORS: Record<AttackCategory, string> = {
  [AttackCategory.PROMPT_INJECTION]: 'bg-violet-500',
  [AttackCategory.DATA_LEAKAGE]: 'bg-sky-500',
  [AttackCategory.UNAUTHORIZED_ACTIONS]: 'bg-amber-500',
  [AttackCategory.ACCESS_CONTROL]: 'bg-rose-500'
}

function getSeverityChip(severity: number): JSX.Element | null {
  if (severity <= 0) return null
  let color: string
  let label: string
  if (severity <= 2) {
    color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    label = `Sev ${severity}`
  } else if (severity === 3) {
    color = 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    label = `Sev ${severity}`
  } else {
    color = 'bg-red-500/20 text-red-400 border-red-500/30'
    label = `Sev ${severity}`
  }
  return (
    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      {label}
    </span>
  )
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

export default function AttackFeed({ results, activeAttacks }: AttackFeedProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new results arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [results.length])

  const isEmpty = results.length === 0 && activeAttacks.length === 0

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-[#18181b]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Attack Feed
        </span>
        <span className="text-xs tabular-nums text-zinc-600">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feed body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto select-text"
      >
        {isEmpty && (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-zinc-600">
              Waiting for attacks
              <span className="animate-idle-dot-1">.</span>
              <span className="animate-idle-dot-2">.</span>
              <span className="animate-idle-dot-3">.</span>
            </span>
          </div>
        )}

        {/* Active attacks (in-flight) */}
        {activeAttacks.map((attack) => (
          <div
            key={`active-${attack.id}`}
            className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2 animate-feed-in"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT_COLORS[attack.category]} animate-phase-pulse`} />
            <span className="flex-1 truncate text-sm font-medium text-zinc-300">
              {attack.name}
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              RUNNING
            </span>
          </div>
        ))}

        {/* Completed results */}
        {results.map((result) => (
          <div
            key={result.id}
            className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2 animate-feed-in"
          >
            {/* Category dot */}
            <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT_COLORS[result.category]}`} />

            {/* Attack info */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-zinc-200">
                {result.attackName}
              </div>
              <div className="truncate font-mono text-xs text-zinc-600">
                {truncate(result.attackPrompt, 60)}
              </div>
            </div>

            {/* Verdict badge */}
            {result.compromised ? (
              <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                FAIL
              </span>
            ) : (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                PASS
              </span>
            )}

            {/* Severity chip */}
            {result.compromised && getSeverityChip(result.severity)}
          </div>
        ))}
      </div>
    </div>
  )
}
