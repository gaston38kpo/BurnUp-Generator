/**
 * StatsBar.jsx — Summary metrics between the chart and the data table
 *
 * Shows:
 *   - Total Scope (cumulative)
 *   - Completed (cumulative)
 *   - Remaining (scope - completed)
 *   - Progress bar (% complete)
 *
 * This gives users instant at-a-glance numbers without reading the chart.
 */

import { useMemo } from 'react'

export default function StatsBar({ entries }) {
  const stats = useMemo(() => {
    let totalScope = 0
    let totalCompleted = 0
    for (const e of entries) {
      const val = Number(e.valor) || 0
      if (e.tipo === 'Scope') totalScope += val
      else if (e.tipo === 'Completed') totalCompleted += val
    }
    const remaining = Math.max(0, totalScope - totalCompleted)
    const pct = totalScope > 0 ? Math.min(100, Math.round((totalCompleted / totalScope) * 100)) : 0
    const onTrack = totalCompleted >= totalScope * (pct / 100) // simplified

    return { totalScope, totalCompleted, remaining, pct, onTrack }
  }, [entries])

  const hasScope = stats.totalScope > 0

  return (
    <div className="stats-bar">
      <div className="stats-metrics">
        <div className="stat-item stat-scope">
          <span className="stat-label">Scope</span>
          <span className="stat-value">{stats.totalScope}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item stat-completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.totalCompleted}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item stat-remaining">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{stats.remaining}</span>
        </div>
      </div>

      {/* Progress bar */}
      {hasScope && (
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${stats.pct}%`,
              backgroundColor: stats.pct >= 100 ? 'var(--completed)' : 'var(--accent)',
            }}
          />
          <span className="progress-label">{stats.pct}%</span>
        </div>
      )}

      {!hasScope && (
        <p className="stats-empty">Add scope and completed entries to see progress</p>
      )}
    </div>
  )
}
