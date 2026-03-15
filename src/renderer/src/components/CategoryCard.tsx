import { type LucideIcon, ShieldAlert, Eye, Zap, Lock, MailWarning } from 'lucide-react'
import { AttackCategory, CategoryResult, CATEGORY_LABELS, CATEGORY_COLORS } from '@shared/types'

interface CategoryCardProps {
  category: CategoryResult
  selected?: boolean
  onClick?: () => void
}

const CATEGORY_ICONS: Record<AttackCategory, LucideIcon> = {
  [AttackCategory.PROMPT_INJECTION]: ShieldAlert,
  [AttackCategory.DATA_LEAKAGE]: Eye,
  [AttackCategory.UNAUTHORIZED_ACTIONS]: Zap,
  [AttackCategory.ACCESS_CONTROL]: Lock,
  [AttackCategory.INDIRECT_INJECTION]: MailWarning
}

function getScoreColor(cat: AttackCategory, score: number): string {
  if (score > 80) return CATEGORY_COLORS[cat].text
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function getBorderClass(cat: AttackCategory, status: CategoryResult['status'], selected: boolean): string {
  const color = CATEGORY_COLORS[cat]
  if (selected) return `${color.border} ${color.bgSubtle}`
  if (status === 'running') return `${color.border} animate-border-glow`
  if (status === 'pending' || status === 'skipped') return 'border-[#27272a]'
  return `${color.borderSubtle}`
}

function getStatusDot(cat: AttackCategory, status: CategoryResult['status']): JSX.Element {
  const color = CATEGORY_COLORS[cat]
  if (status === 'pending' || status === 'skipped') {
    return <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-600" />
  }
  if (status === 'running') {
    return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color.dot} animate-phase-pulse ${color.glow}`} />
  }
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color.dot} ${color.glow}`} />
}

export default function CategoryCard({ category, selected, onClick }: CategoryCardProps): JSX.Element {
  const { category: cat, status, score, attacks, results } = category
  const label = CATEGORY_LABELS[cat]
  const Icon = CATEGORY_ICONS[cat]
  const color = CATEGORY_COLORS[cat]
  const findingsCount = results.filter((r) => r.compromised).length

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-md border bg-[#121214] p-3 transition-colors ${getBorderClass(cat, status, !!selected)}`}
    >
      {/* Header row */}
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${color.icon}`} />
        <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
          {label}
        </span>
        {getStatusDot(cat, status)}
      </div>

      {/* Stats row */}
      <div className="flex items-end justify-between">
        <div className="flex gap-3 text-[10px] text-gray-500">
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
          <span className={`text-lg font-bold tabular-nums ${getScoreColor(cat, score)}`}>
            {score}
          </span>
        )}
        {status === 'running' && (
          <span className={`text-[10px] font-medium ${color.text}`}>Running</span>
        )}
        {status === 'skipped' && (
          <span className="text-[10px] text-gray-600">Skipped</span>
        )}
        {status === 'pending' && (
          <span className="text-[10px] text-gray-600">Pending</span>
        )}
      </div>
    </div>
  )
}
