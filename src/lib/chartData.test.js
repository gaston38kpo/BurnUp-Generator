import { describe, it, expect } from 'vitest'
import { computeCumulatives, computeChartData } from './chartData'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sprint(id, name) {
  return { id, name }
}

function entry(sprintId, tipo, valor, mode = 'relative') {
  return { id: 'e1', sprintId, tipo, valor, mode }
}

// ─── computeCumulatives ───────────────────────────────────────────────────────

describe('computeCumulatives', () => {
  it('returns empty map and zero max for no sprints', () => {
    const { sprintMap, maxScope } = computeCumulatives([], [])
    expect(sprintMap.size).toBe(0)
    expect(maxScope).toBe(0)
  })

  it('accumulates relative scope correctly across sprints', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1')]
    const entries = [
      entry('s0', 'Scope', 5),
      entry('s1', 'Scope', 3),
    ]
    const { sprintMap, maxScope } = computeCumulatives(sprints, entries)

    expect(sprintMap.get('s0')).toEqual({ scope: 5, completed: 0 })
    expect(sprintMap.get('s1')).toEqual({ scope: 8, completed: 0 })
    expect(maxScope).toBe(8)
  })

  it('accumulates relative completed correctly', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1')]
    const entries = [
      entry('s0', 'Completed', 2),
      entry('s1', 'Completed', 4),
    ]
    const { sprintMap } = computeCumulatives(sprints, entries)

    expect(sprintMap.get('s0')).toEqual({ scope: 0, completed: 2 })
    expect(sprintMap.get('s1')).toEqual({ scope: 0, completed: 6 })
  })

  it('handles absolute mode correctly', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1')]
    const entries = [
      entry('s0', 'Scope', 10, 'absolute'),
      entry('s1', 'Scope', 25, 'absolute'),
    ]
    const { sprintMap } = computeCumulatives(sprints, entries)

    // absolute overrides accumulation
    expect(sprintMap.get('s0')).toEqual({ scope: 10, completed: 0 })
    expect(sprintMap.get('s1')).toEqual({ scope: 25, completed: 0 })
  })

  it('mixes relative and absolute per sprint', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1'), sprint('s2', 'Sprint 2')]
    const entries = [
      entry('s0', 'Scope', 5),
      entry('s1', 'Scope', 3),
      entry('s2', 'Scope', 20, 'absolute'),
    ]
    const { sprintMap } = computeCumulatives(sprints, entries)

    expect(sprintMap.get('s0')).toEqual({ scope: 5, completed: 0 })
    expect(sprintMap.get('s1')).toEqual({ scope: 8, completed: 0 })
    expect(sprintMap.get('s2')).toEqual({ scope: 20, completed: 0 })
  })

  it('carries forward values for sprints without entries', () => {
    const sprints = [
      sprint('s0', 'Sprint 0'),
      sprint('s1', 'Sprint 1'),
      sprint('s2', 'Sprint 2'),
    ]
    const entries = [entry('s0', 'Scope', 10)]
    const { sprintMap } = computeCumulatives(sprints, entries)

    expect(sprintMap.get('s0')).toEqual({ scope: 10, completed: 0 })
    // s1 and s2 carry forward scopeAcc = 10, completedAcc = 0
    expect(sprintMap.get('s1')).toEqual({ scope: 10, completed: 0 })
    expect(sprintMap.get('s2')).toEqual({ scope: 10, completed: 0 })
  })

  it('treats missing valor as 0', () => {
    const sprints = [sprint('s0', 'Sprint 0')]
    const entries = [{ id: 'e1', sprintId: 's0', tipo: 'Scope', valor: undefined, mode: 'relative' }]

    const { sprintMap } = computeCumulatives(sprints, entries)
    expect(sprintMap.get('s0')).toEqual({ scope: 0, completed: 0 })
  })
})

// ─── computeChartData ─────────────────────────────────────────────────────────

describe('computeChartData', () => {
  it('returns empty data for no sprints', () => {
    const { data, maxScope } = computeChartData([], [])
    expect(data).toEqual([])
    expect(maxScope).toBe(0)
  })

  it('builds one data point per sprint', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1')]
    const entries = [
      entry('s0', 'Scope', 10),
      entry('s0', 'Completed', 4),
    ]
    const { data } = computeChartData(sprints, entries)

    expect(data).toHaveLength(2)
    expect(data[0].sprint).toBe('Sprint 0')
    expect(data[1].sprint).toBe('Sprint 1')
  })

  it('sets completed to null after the last sprint with a Completed entry', () => {
    const sprints = [
      sprint('s0', 'Sprint 0'),
      sprint('s1', 'Sprint 1'),
      sprint('s2', 'Sprint 2'),
    ]
    const entries = [
      entry('s0', 'Completed', 5),
      // s1 has Scope but no Completed
    ]
    const { data } = computeChartData(sprints, entries)

    expect(data[0].completed).toBe(5)
    expect(data[1].completed).toBeNull()
    expect(data[2].completed).toBeNull()
  })

  it('computes ideal line from 0 to maxScope', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1'), sprint('s2', 'Sprint 2')]
    const entries = [entry('s0', 'Scope', 20)]
    const { data } = computeChartData(sprints, entries)

    // maxScope = 20, 3 data points
    // ideal = maxScope * i / (n-1)
    expect(data[0].ideal).toBe(0)
    expect(data[1].ideal).toBe(10)
    expect(data[2].ideal).toBe(20)
  })

  it('includes trendValue when enough completed points exist', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1'), sprint('s2', 'Sprint 2')]
    const entries = [
      entry('s0', 'Completed', 2),
      entry('s1', 'Completed', 5),
      entry('s2', 'Completed', 10),
    ]
    const { data } = computeChartData(sprints, entries)

    // data[i].trendValue must be a rounded number
    data.forEach((point) => {
      expect(typeof point.trendValue).toBe('number')
      expect(Number.isFinite(point.trendValue)).toBe(true)
    })
  })

  it('sets trendValue to first completed when not enough points', () => {
    const sprints = [sprint('s0', 'Sprint 0')]
    const entries = [entry('s0', 'Completed', 7)]
    const { data } = computeChartData(sprints, entries)

    // Only 1 completed point → trendValue = first completed y = 7
    expect(data[0].trendValue).toBe(7)
  })

  it('trendValue is 0 when no completed entries', () => {
    const sprints = [sprint('s0', 'Sprint 0'), sprint('s1', 'Sprint 1')]
    const entries = [entry('s0', 'Scope', 10)]
    const { data } = computeChartData(sprints, entries)

    // completedPoints is empty → trendValue stays 0
    // Actually: completedPoints.length === 0 → trendValue = 0 (from initialization)
    data.forEach((point) => {
      expect(point.trendValue).toBe(0)
    })
  })

  it('trendValue for 2+ points uses linear regression', () => {
    // Use absolute mode so completed values are exact (not accumulated)
    const sprints = [
      sprint('s0', 'Sprint 0'),
      sprint('s1', 'Sprint 1'),
      sprint('s2', 'Sprint 2'),
      sprint('s3', 'Sprint 3'),
    ]
    const entries = [
      entry('s0', 'Completed', 1, 'absolute'),
      entry('s1', 'Completed', 2, 'absolute'),
      entry('s2', 'Completed', 3, 'absolute'),
      entry('s3', 'Completed', 4, 'absolute'),
    ]
    const { data } = computeChartData(sprints, entries)

    // Perfect linear: slope = 1, intercept = 1
    // trendValue[i] = 1 * i + 1 = i + 1
    expect(data[0].trendValue).toBe(1)
    expect(data[1].trendValue).toBe(2)
    expect(data[2].trendValue).toBe(3)
    expect(data[3].trendValue).toBe(4)
  })
})
