import React from 'react'

const PRIMARY = '#FF6A3D'
const TRACK = '#2A2F3A'

export default function StepRing({
  steps = 0,
  target = 0,
  size = 168,
  stroke = 12,
  showPercent = true,
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = target > 0 ? Math.min(1, steps / target) : 0
  const dashOffset = circumference * (1 - ratio)
  const reached = target > 0 && steps >= target
  const percent = target > 0 ? Math.min(100, Math.round((steps / target) * 100)) : 0

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={TRACK}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={PRIMARY}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: reached ? 'drop-shadow(0 0 12px rgba(255,106,61,0.55))' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display font-bold text-[34px] leading-none tabular tracking-tighter2 text-text-primary">
          {steps.toLocaleString()}
        </p>
        {target > 0 ? (
          <p className="caption mt-1.5 tabular">
            of {target.toLocaleString()}
          </p>
        ) : (
          <p className="caption mt-1.5">steps today</p>
        )}
        {showPercent && target > 0 && (
          <p
            className="font-body font-semibold text-xs mt-2 tabular"
            style={{ color: reached ? PRIMARY : '#8A93A6' }}
          >
            {reached ? '🎉 Goal hit' : `${percent}%`}
          </p>
        )}
      </div>
    </div>
  )
}
