import { useState } from 'react'
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
    score > 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor =
    score > 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0">
        <div className="text-sm font-medium text-zinc-300">{label}</div>
        <div className="text-xs text-zinc-600">Weight: {Math.round(weight * 100)}%</div>
      </div>
      <div className="flex-1">
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${score}%`, transition: 'width 0.8s ease-out' }}
          />
        </div>
      </div>
      <span className={`w-10 text-right text-sm font-bold tabular-nums ${textColor}`}>
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
    color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    label = severity <= 1 ? 'Low' : 'Medium'
  } else if (severity === 3) {
    color = 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    label = 'High'
  } else {
    color = 'bg-red-500/20 text-red-400 border-red-500/30'
    label = severity === 4 ? 'Critical' : 'Severe'
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {label} ({severity})
    </span>
  )
}

function FindingCard({ result }: FindingCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#18181b]">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/50"
      >
        {getSeverityBadge(result.severity)}
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          {result.findingType}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-zinc-200">
          {result.attackName}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-zinc-500 ${expanded ? 'rotate-180' : ''}`}
          style={{ transition: 'transform 200ms ease' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-4 select-text">
          <div className="mb-3 flex gap-2 text-xs text-zinc-500">
            <span>Category: {CATEGORY_LABELS[result.category]}</span>
            <span>|</span>
            <span>Confidence: {result.confidence}</span>
          </div>

          {/* Attack prompt */}
          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Attack Prompt
            </div>
            <pre className="max-h-40 overflow-auto rounded-md bg-[#09090b] p-3 font-mono text-xs leading-5 text-zinc-400">
              {result.attackPrompt}
            </pre>
          </div>

          {/* Raw response */}
          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Raw Response
            </div>
            <pre className="max-h-40 overflow-auto rounded-md bg-[#09090b] p-3 font-mono text-xs leading-5 text-zinc-400">
              {result.rawResponse}
            </pre>
          </div>

          {/* Evidence */}
          {result.evidence && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Evidence
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">{result.evidence}</p>
            </div>
          )}

          {/* Rationale */}
          {result.rationale && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Rationale
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">{result.rationale}</p>
            </div>
          )}

          {/* Remediation */}
          {result.remediation && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Remediation
              </div>
              <p className="text-sm leading-relaxed text-emerald-400/80">{result.remediation}</p>
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
    <div className="flex h-full flex-col overflow-y-auto bg-[#09090b]">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* ── Error banner ──────────────────────────── */}
        {isError && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
            <div className="text-sm font-semibold text-red-400">Scan Error</div>
            <p className="mt-1 text-sm text-red-400/80">
              {state.log.length > 0
                ? state.log[state.log.length - 1].message
                : 'An unknown error occurred during the scan.'}
            </p>
          </div>
        )}

        {/* ── Score section ─────────────────────────── */}
        <div className="mb-8 flex flex-col items-center">
          <ScoreCircle score={state.overallScore} size={180} />
          <div className="mt-4 text-center">
            <h2 className="text-lg font-semibold text-zinc-200">
              {isError
                ? 'Scan Incomplete'
                : state.overallScore > 80
                  ? 'Target Appears Resilient'
                  : state.overallScore >= 50
                    ? 'Moderate Vulnerabilities Detected'
                    : 'Significant Vulnerabilities Found'}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {totalAttacks} attacks executed across {state.categories.length} categories
              {hasFindings
                ? ` \u2014 ${findings.length} finding${findings.length !== 1 ? 's' : ''} identified`
                : ''}
            </p>
          </div>
        </div>

        {/* ── Category breakdown ────────────────────── */}
        <div className="mb-8">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {state.categories.map((cat) => (
              <CategoryBar
                key={cat.category}
                label={CATEGORY_LABELS[cat.category]}
                score={cat.score}
                weight={CATEGORY_WEIGHTS[cat.category]}
              />
            ))}
          </div>
        </div>

        {/* ── Top Findings ──────────────────────────── */}
        <div className="mb-8">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Top Findings
          </h3>

          {hasFindings ? (
            <div className="space-y-2">
              {findings.map((result) => (
                <FindingCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-[#18181b] py-10">
              <svg
                className="mb-3 h-10 w-10 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-emerald-400">
                No vulnerabilities found
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                All attack vectors were successfully defended
              </p>
            </div>
          )}
        </div>

        {/* ── Action buttons ────────────────────────── */}
        <div className="flex justify-center gap-3 pb-8">
          <button
            onClick={onViewLogs}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-100"
          >
            View Logs
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-emerald-600/50 bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Scan Again
          </button>
        </div>
      </div>
    </div>
  )
}
