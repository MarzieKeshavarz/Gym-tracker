import React, { useState } from 'react'
import { useBodyMetrics } from '../../hooks/useBodyMetrics.js'
import { useBodyMetricsCtx } from '../../context/BodyMetricsContext.jsx'
import BmiCard from './BmiCard.jsx'
import WeightTrendChart from './WeightTrendChart.jsx'
import MeasurementChart from './MeasurementChart.jsx'
import BodyStatsRow from './BodyStatsRow.jsx'
import BodyHistoryList from './BodyHistoryList.jsx'
import BodyLogSheet from './BodyLogSheet.jsx'

export default function BodyProgressSection() {
  const {
    hasAny,
    latest,
    stats,
    series,
    measurementStats,
    availableMeasurements,
    bmi,
    bmiZone,
    heightCm,
  } = useBodyMetrics()
  const { metrics } = useBodyMetricsCtx()
  const [logOpen, setLogOpen] = useState(false)

  if (!hasAny) {
    return (
      <div className="flex flex-col gap-3 pt-2">
        <p className="label">⚖️ Body</p>
        <button
          onClick={() => setLogOpen(true)}
          className="card text-center py-10 active:scale-[0.99] transition-all w-full"
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-2xl">
            ⚖️
          </div>
          <p className="font-display font-semibold text-base text-text-primary">Start tracking your body</p>
          <p className="body-sm mt-1">Log weight to see trends, BMI, and milestones</p>
          <span className="btn-primary mt-5 inline-flex">Log first entry</span>
        </button>
        <BodyLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
      </div>
    )
  }

  const trend = stats?.avgWeeklyChange
  const trendLabel = trend == null
    ? null
    : `${trend > 0 ? '+' : ''}${trend.toFixed(2)} kg / week avg`

  return (
    <>
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <p className="label">⚖️ Body</p>
          <button
            onClick={() => setLogOpen(true)}
            className="text-primary text-xs font-body font-semibold uppercase tracking-label active:scale-95 transition-all"
          >
            + Log
          </button>
        </div>

        <BmiCard
          bmi={bmi}
          zone={bmiZone}
          height={heightCm}
          weight={latest?.weight}
          onSetHeight={() => setLogOpen(true)}
        />

        <BodyStatsRow stats={stats} />

        {trendLabel && (
          <div className="card-flat flex items-center justify-between">
            <span className="caption">Weekly trend</span>
            <span className={`body-md font-semibold tabular ${trend < 0 ? 'text-success' : trend > 0 ? 'text-warning' : 'text-text-secondary'}`}>
              {trendLabel}
            </span>
          </div>
        )}

        <WeightTrendChart data={series} />

        {availableMeasurements.length > 0 && (
          <MeasurementChart available={availableMeasurements} stats={measurementStats} />
        )}

        <div className="flex flex-col gap-2 pt-1">
          <p className="label">Entry history</p>
          <BodyHistoryList entries={metrics} />
        </div>
      </div>

      <BodyLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  )
}
