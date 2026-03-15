import { AttackCategory, CategoryResult, CATEGORY_LABELS } from '@shared/types'

interface CategoryCardProps {
  category: CategoryResult
}

const CATEGORY_ICONS: Record<AttackCategory, string> = {
  [AttackCategory.PROMPT_INJECTION]: '\u{1F6E1}',
  [AttackCategory.DATA_LEAKAGE]: '\u{1F441}',
  [AttackCategory.UNAUTHORIZED_ACTIONS]: '\u{26A1}',
  [AttackCategory.ACCESS_CONTROL]: '\u{1F512}'
}

function getScoreColor(score: number): string {
  if (score > 80) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function getBorderClass(status: CategoryResult['status'], score: number): string {
  if (status === 'pending') return 'border-zinc-800'
  if (status === 'running') return 'border-blue-500 animate-border-glow'
  if (score > 80) return 'border-emerald-500/50'
  if (score >= 50) return 'border-yellow-500/50'
  return 'border-red-500/50'
}

function getStatusDot(status: CategoryResult['status'], score: number): JSX.Element {
  if (status === 'pending') {
    return <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />
  }
  if (status === 'running') {
    return <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-phase-pulse" />
  }
  // complete
  const color = score > 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
}

export default function CategoryCard({ category }: CategoryCardProps): JSX.Element {
  const { category: cat, status, score, attacks, results } = category
  const label = CATEGORY_LABELS[cat]
  const icon = CATEGORY_ICONS[cat]
  const findingsCount = results.filter((r) => r.compromised).length

  return (
    <div
      className={`rounded-lg border bg-[#18181b] p-3 ${getBorderClass(status, score)}`}
    >
      {/* Header row */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base" role="img" aria-label={label}>
          {icon}
        </span>
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {label}
        </span>
        {getStatusDot(status, score)}
      </div>

      {/* Stats row */}
      <div className="flex items-end justify-between">
        <div className="flex gap-3 text-xs text-zinc-500">
          <span>
            {attacks.length} attack{attacks.length !== 1 ? 's' : ''}
          </span>
          {findingsCount > 0 && (
            <span className="text-red-400">
              {findingsCount} finding{findingsCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {status === 'complete' && (
          <span className={`text-lg font-bold tabular-nums ${getScoreColor(score)}`}>
            {score}
          </span>
        )}
        {status === 'running' && (
          <span className="text-xs text-blue-400">Running</span>
        )}
        {status === 'pending' && (
          <span className="text-xs text-zinc-600">Pending</span>
        )}
      </div>
    </div>
  )
}
