import { useMemo } from 'react'

interface ScoreCircleProps {
  score: number
  size?: number
}

export default function ScoreCircle({ score, size = 160 }: ScoreCircleProps): JSX.Element {
  const strokeWidth = size * 0.06
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (score / 100) * circumference

  const strokeColor = useMemo(() => {
    if (score > 80) return '#22d3ee'   // cyan-400
    if (score >= 50) return '#f59e0b'  // amber-500
    return '#ef4444'                   // red-500
  }, [score])

  const trackColor = '#27272a'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="animate-score-draw"
          style={
            {
              '--circumference': circumference,
              '--target-offset': targetOffset
            } as React.CSSProperties
          }
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none text-gray-100"
          style={{ fontSize: size * 0.28 }}
        >
          {score}
        </span>
        <span
          className="text-gray-500"
          style={{ fontSize: size * 0.1 }}
        >
          /100
        </span>
      </div>
    </div>
  )
}
