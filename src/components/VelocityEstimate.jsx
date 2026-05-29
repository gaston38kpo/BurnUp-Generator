/**
 * VelocityEstimate.jsx — Velocity and estimate display component
 *
 * Shows the average velocity (completed pts/sprint) and estimated
 * remaining sprints (forecast). Uses the same styling approach as StatsBar.
 */

export default function VelocityEstimate({ velocityInfo }) {
  const { velocity, estimate, completedSprints } = velocityInfo
  const hasData = completedSprints > 0

  if (!hasData) {
    return (
      <div className="velocity-forecast">
        <p className="velocity-empty">
          Add completed entries to calculate velocity and forecast
        </p>
      </div>
    )
  }

  return (
    <div className="velocity-forecast">
      <div
        className="velocity-stat"
        title="Average completed points per sprint (total delta ÷ sprints with data)"
      >
        <span className="velocity-stat-label">Velocity</span>
        <span className="velocity-stat-value">
          {velocity.toFixed(1)} pts/sprint
        </span>
      </div>
      <div className="velocity-divider" />
      <div
        className="velocity-stat"
        title="Estimated sprints remaining at current velocity (remaining ÷ velocity)"
      >
        <span className="velocity-stat-label">Estimate</span>
        <span className="velocity-stat-value">
          {estimate !== null ? `~${estimate} sprints` : '\u2014'}
        </span>
      </div>
    </div>
  )
}
