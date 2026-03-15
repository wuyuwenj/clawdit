import { useEffect, useRef } from 'react'
import { LogEntry } from '@shared/types'

interface LiveLogProps {
  entries: LogEntry[]
}

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  info: 'text-gray-500',
  warn: 'text-amber-400',
  error: 'text-red-400',
  attack: 'text-cyan-400',
  result: 'text-teal-400'
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
  const shouldFollowRef = useRef(true)

  useEffect(() => {
    if (scrollRef.current && shouldFollowRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  function handleScroll(): void {
    const container = scrollRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    shouldFollowRef.current = distanceFromBottom < 32
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-[#27272a] bg-[#0a0a0c]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272a] px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Log
        </span>
        <span className="text-[10px] tabular-nums text-gray-600">
          {entries.length} line{entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-5 select-text"
      >
        {entries.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <span className="text-gray-700">No log entries yet</span>
          </div>
        )}
        {entries.map((entry, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="shrink-0 text-gray-700 tabular-nums">
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
