import { useState } from 'react'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import {
  ScanState,
  ScanStatus,
  AttackResult,
  CATEGORY_LABELS,
  CATEGORY_WEIGHTS
} from '@shared/types'
import ScoreCircle from './ScoreCircle'

interface FindingsPanelProps {
  state: ScanState
  onReset: () => void
  onViewLogs: () => void
}

// ── Category bar component ─────────────────────────────────────

interface CategoryBarProps {
  label: string
  score: number
  weight: number
}

function CategoryBar({ label, score, weight }: CategoryBarProps): JSX.Element {
  const barColor =
    score > 80 ? 'bg-cyan-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    score > 80 ? 'text-cyan-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0">
        <div className="text-[11px] font-medium text-gray-300">{label}</div>
        <div className="text-[10px] text-gray-600">Weight: {Math.round(weight * 100)}%</div>
      </div>
      <div className="flex-1">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#27272a]">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${score}%`, transition: 'width 0.8s ease-out' }}
          />
        </div>
      </div>
      <span className={`w-10 text-right text-xs font-bold tabular-nums ${textColor}`}>
        {score}
      </span>
    </div>
  )
}

// ── Finding card component ─────────────────────────────────────

interface FindingCardProps {
  result: AttackResult
}

function getSeverityBadge(severity: number): JSX.Element {
  let color: string
  let label: string
  if (severity <= 2) {
    color = 'bg-amber-500/15 text-amber-400 border-amber-500/20'
    label = severity <= 1 ? 'Low' : 'Medium'
  } else if (severity === 3) {
    color = 'bg-orange-500/15 text-orange-400 border-orange-500/20'
    label = 'High'
  } else {
    color = 'bg-red-500/15 text-red-400 border-red-500/20'
    label = severity === 4 ? 'Critical' : 'Severe'
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${color}`}>
      {label} ({severity})
    </span>
  )
}

function FindingCard({ result }: FindingCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-md border border-[#27272a] bg-[#121214]">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#1a1a1e]"
      >
        {getSeverityBadge(result.severity)}
        <span className="text-[10px] uppercase tracking-wider text-gray-500">
          {result.findingType}
        </span>
        <span className="flex-1 truncate text-xs font-medium text-gray-200">
          {result.attackName}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-500 ${expanded ? 'rotate-180' : ''}`}
          style={{ transition: 'transform 200ms ease' }}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#27272a] px-4 py-4 select-text">
          <div className="mb-3 flex gap-2 text-[10px] text-gray-500">
            <span>Category: {CATEGORY_LABELS[result.category]}</span>
            <span>|</span>
            <span>Confidence: {result.confidence}</span>
          </div>

          {/* Multi-turn log (if present) */}
          {result.turnLog && result.turnLog.length > 0 ? (
            <div className="mb-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Multi-Turn Sequence
              </div>
              {result.turnLog.map((turn, idx) => (
                <div key={idx} className="mb-2 rounded-md bg-[#0a0a0c] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-teal-400">
                      Turn {idx + 1}: {turn.label}
                    </span>
                    <span className="text-[10px] text-gray-600">{turn.durationMs}ms</span>
                  </div>
                  <pre className="mb-1 font-mono text-[10px] leading-5 text-gray-400 whitespace-pre-wrap">
                    {turn.prompt}
                  </pre>
                  <pre className="font-mono text-[10px] leading-5 text-gray-500 whitespace-pre-wrap">
                    {turn.response}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Attack prompt */}
              <div className="mb-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Attack Prompt
                </div>
                <pre className="max-h-40 overflow-auto rounded-md border border-[#27272a] bg-[#0a0a0c] p-3 font-mono text-[10px] leading-5 text-gray-400">
                  {result.attackPrompt}
                </pre>
              </div>

              {/* Raw response */}
              <div className="mb-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Raw Response
                </div>
                <pre className="max-h-40 overflow-auto rounded-md border border-[#27272a] bg-[#0a0a0c] p-3 font-mono text-[10px] leading-5 text-gray-400">
                  {result.rawResponse}
                </pre>
              </div>
            </>
          )}

          {/* Evidence */}
          {result.evidence && (
            <div className="mb-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Evidence
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400">{result.evidence}</p>
            </div>
          )}

          {/* Rationale */}
          {result.rationale && (
            <div className="mb-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Rationale
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400">{result.rationale}</p>
            </div>
          )}

          {/* Remediation */}
          {result.remediation && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Remediation
              </div>
              <p className="text-[11px] leading-relaxed text-cyan-400/80">{result.remediation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main FindingsPanel ─────────────────────────────────────────

export default function FindingsPanel({ state, onReset, onViewLogs }: FindingsPanelProps): JSX.Element {
  const isError = state.status === ScanStatus.ERROR
  const findings = state.topFindings.filter((r) => r.compromised)
  const hasFindings = findings.length > 0

  const totalAttacks = state.categories.reduce((sum, c) => sum + c.results.length, 0)

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-[#0a0a0c]">
      {/* Drag region for window movement */}
      <div className="drag-region sticky top-0 left-0 right-0 h-10 z-10" />
      <div className="mx-auto w-full max-w-3xl px-6 py-10 -mt-10">
        {/* ── Error banner ──────────────────────────── */}
        {isError && (
          <div className="mb-6 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-400">Scan Error</div>
              <p className="mt-1 text-[11px] leading-relaxed text-red-400/80">
                {state.log.length > 0
                  ? state.log[state.log.length - 1].message
                  : 'An unknown error occurred during the scan.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Score section ─────────────────────────── */}
        <div className="mb-10 flex flex-col items-center">
          <ScoreCircle score={state.overallScore} size={180} />
          <div className="mt-5 text-center">
            <h2 className="text-lg font-semibold text-gray-100">
              {isError
                ? 'Scan Incomplete'
                : state.overallScore > 80
                  ? 'Target Appears Resilient'
                  : state.overallScore >= 50
                    ? 'Moderate Vulnerabilities Detected'
                    : 'Significant Vulnerabilities Found'}
            </h2>
            <p className="mt-1.5 text-[11px] text-gray-500">
              {totalAttacks} attacks executed across {state.categories.length} categories
              {hasFindings
                ? ` \u2014 ${findings.length} finding${findings.length !== 1 ? 's' : ''} identified`
                : ''}
            </p>
          </div>
        </div>

        {/* ── Category breakdown ────────────────────── */}
        <div className="mb-8">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {state.categories.map((cat) =>
              cat.status === 'skipped' ? (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className="w-44 shrink-0">
                    <div className="text-[11px] font-medium text-gray-500">{CATEGORY_LABELS[cat.category]}</div>
                    <div className="text-[10px] text-gray-600">Skipped{cat.skipReason ? ` — ${cat.skipReason}` : ''}</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#27272a]" />
                  </div>
                  <span className="w-10 text-right text-xs text-gray-600">—</span>
                </div>
              ) : (
                <CategoryBar
                  key={cat.category}
                  label={CATEGORY_LABELS[cat.category]}
                  score={cat.score}
                  weight={CATEGORY_WEIGHTS[cat.category]}
                />
              )
            )}
          </div>
        </div>

        {/* ── Top Findings ──────────────────────────── */}
        <div className="mb-8">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Top Findings
          </h3>

          {hasFindings ? (
            <div className="space-y-2">
              {findings.map((result) => (
                <FindingCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-md border border-[#27272a] bg-[#121214] py-10">
              <ShieldCheck className="mb-3 h-8 w-8 text-cyan-500" strokeWidth={1.5} />
              <p className="text-xs font-medium text-cyan-400">
                No vulnerabilities found
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                All attack vectors were successfully defended
              </p>
            </div>
          )}
        </div>

        {/* ── Action buttons ────────────────────────── */}
        <div className="flex justify-center gap-3 pb-8">
          <button
            onClick={onViewLogs}
            className="rounded-md border border-[#27272a] bg-[#121214] px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:bg-[#1a1a1e] hover:text-gray-200"
          >
            View Logs
          </button>
          <button
            onClick={onReset}
            className="rounded-md bg-zinc-100 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-900 hover:bg-white"
          >
            Scan Again
          </button>
        </div>
      </div>
    </div>
  )
}
