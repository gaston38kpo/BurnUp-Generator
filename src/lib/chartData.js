/**
 * chartData.js — Sprint-based burnup chart data computation
 *
 * Computes one data point per sprint with cumulative scope/completed
 * and a linear ideal line. Empty sprints carry forward values automatically.
 *
 * The completed line stops at the last sprint that has a Completed entry.
 * Subsequent data points get null, which breaks the line in Recharts.
 */

export function computeCumulatives(sprints, entries) {
  const entryBySprintTipo = new Map()
  for (const e of entries) {
    entryBySprintTipo.set(e.sprintId + '|' + e.tipo, {
      valor: Number(e.valor) || 0,
      mode: e.mode || 'relative',
    })
  }

  const sprintMap = new Map()
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

    sprintMap.set(s.id, { scope: scopeAcc, completed: completedAcc })
  }

  return { sprintMap, maxScope: scopeAcc }
}

export function computeChartData(sprints, entries) {
  if (!sprints.length) return { data: [], maxScope: 0 }

  const { sprintMap, maxScope } = computeCumulatives(sprints, entries)

  // Find the last sprint index that has a Completed entry
  const entryBySprintTipo = new Map()
  for (const e of entries) {
    entryBySprintTipo.set(e.sprintId + '|' + e.tipo, true)
  }

  let lastCompletedIdx = -1
  for (let i = sprints.length - 1; i >= 0; i--) {
    if (entryBySprintTipo.has(sprints[i].id + '|Completed')) {
      lastCompletedIdx = i
      break
    }
  }

  const data = sprints.map((s, i) => ({
    sprint: s.name,
    scope: sprintMap.get(s.id)?.scope ?? 0,
    completed: i <= lastCompletedIdx ? (sprintMap.get(s.id)?.completed ?? 0) : null,
  }))

  // Linear Regression for Trend Line
  const completedPoints = data
    .map((d, i) => ({ x: i, y: d.completed }))
    .filter(p => p.y !== null)

  let trendValue = 0
  if (completedPoints.length >= 2) {
    const n = completedPoints.length
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0

    for (const p of completedPoints) {
      sumX += p.x
      sumY += p.y
      sumXY += p.x * p.y
      sumXX += p.x * p.x
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // We store the formula in the loop below
    var regression = { slope, intercept }
  }

  for (let i = 0; i < data.length; i++) {
    const ideal = data.length > 1 ? (maxScope * i) / (data.length - 1) : 0
    data[i].ideal = Math.round(ideal * 100) / 100
    
    if (typeof regression !== 'undefined') {
      const val = regression.slope * i + regression.intercept
      data[i].trendValue = Math.round(val * 100) / 100
    } else {
      data[i].trendValue = completedPoints.length > 0 ? completedPoints[0].y : 0
    }
  }

  return { data, maxScope }
}
