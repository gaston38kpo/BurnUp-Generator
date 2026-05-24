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

function computeStats(entries, sprints) {
  const sprintIndexMap = new Map(sprints.map((s, i) => [s.id, i]))

  const entryBySprintTipo = new Map()
  for (const e of entries) {
    entryBySprintTipo.set(e.sprintId + '|' + e.tipo, {
      valor: Number(e.valor) || 0,
      mode: e.mode || 'relative',
    })
  }

  let scopeAcc = 0
  let completedAcc = 0
  for (const s of sprints) {
    const scopeEntry = entryBySprintTipo.get(s.id + '|Scope')
    const completedEntry = entryBySprintTipo.get(s.id + '|Completed')
    if (scopeEntry) {
      scopeAcc =
        scopeEntry.mode === 'absolute'
          ? scopeEntry.valor
          : scopeAcc + scopeEntry.valor
    }
    if (completedEntry) {
      completedAcc =
        completedEntry.mode === 'absolute'
          ? completedEntry.valor
          : completedAcc + completedEntry.valor
    }
  }

  const remaining = Math.max(0, scopeAcc - completedAcc)
  const pct =
    scopeAcc > 0
      ? Math.min(100, Math.round((completedAcc / scopeAcc) * 100))
      : 0

  return { totalScope: scopeAcc, totalCompleted: completedAcc, remaining, pct }
}

export default function StatsBar({ entries, sprints }) {
  const stats = useMemo(() => {
    const { totalScope, totalCompleted, remaining, pct } = computeStats(
      entries,
      sprints || []
    )
    const onTrack = totalCompleted >= totalScope * (pct / 100)

    return { totalScope, totalCompleted, remaining, pct, onTrack }
  }, [entries, sprints])

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
