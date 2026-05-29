/**
 * velocity.js — Velocity and forecast computation
 *
 * Computes the average completed points per sprint and estimates
 * remaining sprints to complete all work.
 *
 * Pure domain logic — zero dependencies outside domain/.
 */

/**
 * Compute velocity and forecast from sprint cumulative data.
 *
 * @param {Map<string, {scope: number, completed: number}>} sprintMap - Cumulative values per sprint (ordered)
 * @param {Map<string, {valor: number, mode: string}>} entryBySprintTipo - Raw entry lookup by "sprintId|tipo"
 * @param {number} maxScope - Total scope (cumulative maximum across all sprints)
 * @returns {{ velocity: number, estimate: number|null, remaining: number, completedSprints: number, totalDelta: number }}
 */
export function computeVelocity(sprintMap, entryBySprintTipo, maxScope) {
  let previousCompleted = 0
  let completedSprints = 0
  let totalDelta = 0

  for (const [sprintId, sprintData] of sprintMap) {
    if (entryBySprintTipo.has(sprintId + '|Completed')) {
      const currentCompleted = sprintData.completed
      const delta = Math.max(0, currentCompleted - previousCompleted)
      totalDelta += delta
      completedSprints++
      previousCompleted = currentCompleted
    }
  }

  const velocity =
    completedSprints > 0
      ? Math.round((totalDelta / completedSprints) * 100) / 100
      : 0

  // Last cumulative completed (carries forward even without a Completed entry)
  const keys = [...sprintMap.keys()]
  const lastId = keys[keys.length - 1]
  const lastCumulativeCompleted = lastId ? sprintMap.get(lastId).completed : 0
  const remaining = Math.max(0, maxScope - lastCumulativeCompleted)

  let estimate = null
  if (velocity > 0) {
    estimate = remaining > 0 ? Math.ceil(remaining / velocity) : 0
  }

  return { velocity, estimate, remaining, completedSprints, totalDelta }
}
