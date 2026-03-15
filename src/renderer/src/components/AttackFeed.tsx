import { useEffect, useRef, useState } from 'react'
import { AttackCategory, AttackResult, Attack, CATEGORY_LABELS, CATEGORY_COLORS } from '@shared/types'

interface AttackFeedProps {
  results: AttackResult[]
  activeAttacks: Attack[]
  filterCategory?: AttackCategory | null
}

function getSeverityChip(severity: number): JSX.Element | null {
  if (severity <= 0) return null
  let color: string
  let label: string
  if (severity <= 2) {
    color = 'bg-amber-500/15 text-amber-400 border-amber-500/20'
    label = `Sev ${severity}`
  } else if (severity === 3) {
    color = 'bg-orange-500/15 text-orange-400 border-orange-500/20'
    label = `Sev ${severity}`
  } else {
    color = 'bg-red-500/15 text-red-400 border-red-500/20'
    label = `Sev ${severity}`
  }
  return (
    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${color}`}>
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
    <div className="flex h-full flex-col overflow-y-auto bg-[#121214]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#27272a] px-3 py-2">
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-[10px] font-medium text-gray-400 hover:bg-[#27272a] hover:text-gray-200"
        >
          &larr; Back
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Attack Detail
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Attack name + verdict */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-100">{result.attackName}</h3>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{CATEGORY_LABELS[result.category]}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {result.compromised ? (
              <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Fail</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">Pass</span>
              </span>
            )}
            {result.compromised && getSeverityChip(result.severity)}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex gap-4 text-[10px] text-gray-500">
          <span>Confidence: <span className="text-gray-300">{result.confidence}</span></span>
          <span>Finding: <span className="text-gray-300">{result.findingType || 'N/A'}</span></span>
        </div>

        {/* Multi-turn log (if present) */}
        {result.turnLog && result.turnLog.length > 0 ? (
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Multi-Turn Sequence
            </div>
            {result.turnLog.map((turn, idx) => (
              <div key={idx} className="mb-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 px-2 py-0.5">
                    <span className="h-1 w-1 rounded-full bg-teal-500" />
                    <span className="text-[9px] font-medium text-teal-400">Turn {idx + 1}: {turn.label}</span>
                  </span>
                  <span className="text-[10px] text-gray-600">{turn.durationMs}ms</span>
                </div>
                <pre className="mb-1 max-h-32 overflow-auto rounded-md border border-[#27272a] bg-[#0a0a0c] p-3 font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
                  {turn.prompt}
                </pre>
                <pre className="max-h-32 overflow-auto rounded-md border border-[#27272a] bg-[#0a0a0c] p-3 font-mono text-xs leading-relaxed text-gray-500 whitespace-pre-wrap">
                  {turn.response}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Attack prompt */}
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Attack Prompt
              </div>
              <pre className="max-h-48 overflow-auto rounded-md border border-[#27272a] bg-[#0a0a0c] p-3 font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
                {result.attackPrompt}
              </pre>
            </div>

            {/* OpenClaw response */}
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                OpenClaw Response
              </div>
              <pre className="max-h-64 overflow-auto rounded-md border border-[#27272a] bg-[#0a0a0c] p-3 font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
                {result.rawResponse || '[No response]'}
              </pre>
            </div>
          </>
        )}

        {/* Evidence */}
        {result.evidence && (
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Evidence
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">{result.evidence}</p>
          </div>
        )}

        {/* Rationale */}
        {result.rationale && (
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Rationale
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">{result.rationale}</p>
          </div>
        )}

        {/* Remediation */}
        {result.remediation && result.remediation !== 'N/A' && (
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Remediation
            </div>
            <p className="text-[11px] leading-relaxed text-cyan-400/80">{result.remediation}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AttackFeed({ results, activeAttacks, filterCategory }: AttackFeedProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Auto-scroll to bottom when new results arrive (only in list view)
  useEffect(() => {
    if (!selectedId && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [results.length, selectedId])

  // Clear selection when filter changes and selected result doesn't match
  useEffect(() => {
    if (filterCategory && selectedId) {
      const sel = results.find(r => r.id === selectedId)
      if (sel && sel.category !== filterCategory) setSelectedId(null)
    }
  }, [filterCategory, selectedId, results])

  const filteredResults = filterCategory
    ? results.filter(r => r.category === filterCategory)
    : results
  const filteredActive = filterCategory
    ? activeAttacks.filter(a => a.category === filterCategory)
    : activeAttacks

  const selectedResult = selectedId ? results.find(r => r.id === selectedId) : null

  // If a result is selected, show detail view
  if (selectedResult) {
    return (
      <div className="flex h-full flex-col rounded-md border border-[#27272a] bg-[#121214]">
        <AttackDetail result={selectedResult} onClose={() => setSelectedId(null)} />
      </div>
    )
  }

  const isEmpty = filteredResults.length === 0 && filteredActive.length === 0

  return (
    <div className="flex h-full flex-col rounded-md border border-[#27272a] bg-[#121214]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272a] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Attack Feed
          </span>
          {filterCategory && (
            <span className={`flex items-center gap-1.5 rounded-full ${CATEGORY_COLORS[filterCategory].bgSubtle} ${CATEGORY_COLORS[filterCategory].borderSubtle} border px-2 py-0.5`}>
              <span className={`h-1 w-1 rounded-full ${CATEGORY_COLORS[filterCategory].dot}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[filterCategory].text}`}>
                {CATEGORY_LABELS[filterCategory]}
              </span>
            </span>
          )}
        </div>
        <span className="text-[10px] tabular-nums text-gray-600">
          {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feed body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto select-text"
      >
        {isEmpty && (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-gray-600">
              Waiting for attacks
              <span className="animate-idle-dot-1">.</span>
              <span className="animate-idle-dot-2">.</span>
              <span className="animate-idle-dot-3">.</span>
            </span>
          </div>
        )}

        {/* Active attacks (in-flight) */}
        {filteredActive.map((attack) => (
          <div
            key={`active-${attack.id}`}
            className="flex items-center gap-2 border-b border-[#27272a]/50 px-3 py-2 animate-feed-in"
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${CATEGORY_COLORS[attack.category].dot} animate-phase-pulse`} />
            <span className="flex-1 truncate text-xs font-medium text-gray-300">
              {attack.name}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5">
              <span className="h-1 w-1 rounded-full bg-cyan-500 animate-phase-pulse shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
              <span className="text-[9px] font-medium uppercase tracking-wider text-cyan-400">Running</span>
            </span>
          </div>
        ))}

        {/* Completed results */}
        {filteredResults.map((result) => (
          <div
            key={result.id}
            onClick={() => setSelectedId(result.id)}
            className="flex items-center gap-2 border-b border-[#27272a]/50 px-3 py-2 animate-feed-in cursor-pointer hover:bg-[#1a1a1e]"
          >
            {/* Category dot */}
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${CATEGORY_COLORS[result.category].dot}`} />

            {/* Attack info */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-gray-200">
                {result.attackName}
              </div>
              <div className="truncate font-mono text-[10px] text-gray-600">
                {truncate(result.attackPrompt, 60)}
              </div>
            </div>

            {/* Verdict badge */}
            {result.compromised ? (
              <span className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-1.5 py-0.5">
                <span className="h-1 w-1 rounded-full bg-red-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Fail</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5">
                <span className="h-1 w-1 rounded-full bg-cyan-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">Pass</span>
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
