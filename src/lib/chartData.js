/**
 * chartData.js — Sprint-based burnup chart data computation
 *
 * Computes one data point per sprint with cumulative scope/completed
 * and a linear ideal line. Empty sprints carry forward values automatically.
 *
 * The completed line stops at the last sprint that has a Completed entry.
 * Subsequent data points get null, which breaks the line in Recharts.
 */

export function computeChartData(sprints, entries) {
  if (!sprints.length) return { data: [], maxScope: 0 }

  const entryBySprintTipo = new Map()
  for (const e of entries) {
    entryBySprintTipo.set(e.sprintId + '|' + e.tipo, {
      valor: Number(e.valor) || 0,
      mode: e.mode || 'relative',
    })
  }

  // Find the last sprint index that has a Completed entry
  let lastCompletedIdx = -1
  for (let i = sprints.length - 1; i >= 0; i--) {
    if (entryBySprintTipo.has(sprints[i].id + '|Completed')) {
      lastCompletedIdx = i
      break
    }
  }

  let scopeAcc = 0
  let completedAcc = 0
  const data = sprints.map((s, i) => {
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

    return {
      sprint: s.name,
      scope: scopeAcc,
      // Only show completed up to the last sprint with a Completed entry
      completed: i <= lastCompletedIdx ? completedAcc : null,
    }
  })

  const maxScope = scopeAcc
  for (let i = 0; i < data.length; i++) {
    const ideal = data.length > 1 ? (maxScope * i) / (data.length - 1) : 0
    data[i].ideal = Math.round(ideal * 100) / 100
  }

  return { data, maxScope }
}
