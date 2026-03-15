import { useEffect, useRef } from 'react'
import { LogEntry } from '@shared/types'

interface LiveLogProps {
  entries: LogEntry[]
}

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  info: 'text-zinc-500',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  attack: 'text-blue-400',
  result: 'text-emerald-400'
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function LiveLog({ entries }: LiveLogProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-[#09090b]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Log
        </span>
        <span className="text-xs tabular-nums text-zinc-600">
          {entries.length} line{entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs leading-5 select-text"
      >
        {entries.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <span className="text-zinc-700">No log entries yet</span>
          </div>
        )}
        {entries.map((entry, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="shrink-0 text-zinc-700 tabular-nums">
              {formatTimestamp(entry.timestamp)}
            </span>
            <span className={LEVEL_COLORS[entry.level]}>
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
