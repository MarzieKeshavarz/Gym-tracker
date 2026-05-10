import React from 'react'
import { BMI_ZONES, BMI_RANGE, bmiGaugePosition } from '../../utils/bodyAnalytics.js'

// Soft gradient gauge — readable, not clinical. Shows where the user sits
// relative to the standard BMI bands without screaming red/green.
export default function BmiCard({ bmi, zone, height, weight, onSetHeight }) {
  if (!height) {
    return (
      <div className="card flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-accent-soft border border-accent/25 flex items-center justify-center text-2xl flex-shrink-0">
          📏
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[15px] tracking-tightish text-text-primary">
            Add your height
          </p>
          <p className="caption mt-0.5">Unlock BMI insights</p>
        </div>
        {onSetHeight && (
          <button onClick={onSetHeight} className="btn-ghost h-9 px-4 text-sm">
            Set
          </button>
        )}
      </div>
    )
  }

  if (bmi == null) return null

  const pos = bmiGaugePosition(bmi)
  const { min, max } = BMI_RANGE
  const total = max - min
  const stops = BMI_ZONES.map((z, i) => {
    const prev = i === 0 ? min : BMI_ZONES[i - 1].max
    const start = ((prev - min) / total) * 100
    const end = z.max === Infinity ? 100 : ((z.max - min) / total) * 100
    return { ...z, start, end }
  })

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="label">📏 Body Mass Index</p>
        <span
          className="chip"
          style={{
            color: zone?.color,
            borderColor: `${zone?.color}40`,
            backgroundColor: `${zone?.color}1A`,
          }}
        >
          {zone?.label}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="font-display font-bold text-[44px] leading-none tabular tracking-tighter2"
          style={{ color: zone?.color }}
        >
          {bmi}
        </span>
        <span className="caption tabular">
          {weight} kg · {height} cm
        </span>
      </div>

      <div className="relative">
        <div
          className="h-3 rounded-full overflow-hidden flex"
          aria-hidden
        >
          {stops.map(s => (
            <div
              key={s.key}
              style={{
                width: `${s.end - s.start}%`,
                background: `linear-gradient(90deg, ${s.color}55, ${s.color}AA)`,
              }}
            />
          ))}
        </div>

        <div
          className="absolute -top-1 w-[14px] h-[20px] rounded-full bg-text-primary border-2 border-bg shadow-elev"
          style={{
            left: `calc(${pos * 100}% - 7px)`,
            transition: 'left 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          aria-hidden
        />
      </div>

      <div className="flex justify-between caption tabular pt-0.5">
        <span>{min}</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
