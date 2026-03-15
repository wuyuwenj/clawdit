import { useEffect, useRef, useState } from 'react'
import { AttackCategory, AttackResult, Attack, CATEGORY_LABELS } from '@shared/types'

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

function AttackDetail({ result, onClose }: { result: AttackResult; onClose: () => void }): JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#18181b]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          &larr; Back
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Attack Detail
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Attack name + verdict */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{result.attackName}</h3>
            <span className="text-xs text-zinc-500">{CATEGORY_LABELS[result.category]}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {result.compromised ? (
              <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                FAIL
              </span>
            ) : (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                PASS
              </span>
            )}
            {result.compromised && getSeverityChip(result.severity)}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex gap-4 text-xs text-zinc-500">
          <span>Confidence: <span className="text-zinc-300">{result.confidence}</span></span>
          <span>Finding: <span className="text-zinc-300">{result.findingType || 'N/A'}</span></span>
        </div>

        {/* Attack prompt */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Attack Prompt
          </div>
          <pre className="max-h-48 overflow-auto rounded-lg border border-zinc-800 bg-[#09090b] p-3 font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">
            {result.attackPrompt}
          </pre>
        </div>

        {/* OpenClaw response */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            OpenClaw Response
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-[#09090b] p-3 font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">
            {result.rawResponse || '[No response]'}
          </pre>
        </div>

        {/* Evidence */}
        {result.evidence && (
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Evidence
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{result.evidence}</p>
          </div>
        )}

        {/* Rationale */}
        {result.rationale && (
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Rationale
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{result.rationale}</p>
          </div>
        )}

        {/* Remediation */}
        {result.remediation && result.remediation !== 'N/A' && (
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Remediation
            </div>
            <p className="text-sm leading-relaxed text-emerald-400/80">{result.remediation}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AttackFeed({ results, activeAttacks }: AttackFeedProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Auto-scroll to bottom when new results arrive (only in list view)
  useEffect(() => {
    if (!selectedId && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [results.length, selectedId])

  const selectedResult = selectedId ? results.find(r => r.id === selectedId) : null

  // If a result is selected, show detail view
  if (selectedResult) {
    return (
      <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-[#18181b]">
        <AttackDetail result={selectedResult} onClose={() => setSelectedId(null)} />
      </div>
    )
  }

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
            onClick={() => setSelectedId(result.id)}
            className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2 animate-feed-in cursor-pointer hover:bg-zinc-800/50"
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
