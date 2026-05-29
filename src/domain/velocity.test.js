import { describe, it, expect } from 'vitest'
import { computeVelocity } from './velocity'
import { computeCumulatives } from './chartData'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sprint(id, name) {
  return { id, name }
}

function entry(sprintId, tipo, valor, mode = 'relative') {
  return { id: 'e1', sprintId, tipo, valor, mode }
}

function buildInput(sprints, entries) {
  const { sprintMap, entryBySprintTipo, maxScope } = computeCumulatives(sprints, entries)
  return { sprintMap, entryBySprintTipo, maxScope }
}

// ─── computeVelocity ──────────────────────────────────────────────────────────

describe('computeVelocity', () => {
  it('computes velocity and forecast for normal multi-sprint data', () => {
    const sprints = [
      sprint('s0', 'Sprint 0'),
      sprint('s1', 'Sprint 1'),
    ]
    const entries = [
      entry('s0', 'Scope', 20, 'absolute'),
      entry('s0', 'Completed', 5, 'relative'),
      entry('s1', 'Completed', 7, 'relative'),
    ]
    const result = computeVelocity(...Object.values(buildInput(sprints, entries)))

    // s0 completed=5, s1 completed=5+7=12 (cumulative)
    // Delta s0 = 5, Delta s1 = 12-5 = 7, avg = 6
    expect(result.velocity).toBe(6)
    // remaining = 20 - 12 = 8, forecast = ceil(8/6) = 2
    expect(result.forecast).toBe(2)
    expect(result.remaining).toBe(8)
    expect(result.completedSprints).toBe(2)
    expect(result.totalDelta).toBe(12)
  })

  it('returns zero velocity and null forecast when no completed entries', () => {
    const sprints = [
      sprint('s0', 'Sprint 0'),
      sprint('s1', 'Sprint 1'),
    ]
    const entries = [
      entry('s0', 'Scope', 10, 'relative'),
    ]
    const result = computeVelocity(...Object.values(buildInput(sprints, entries)))

    expect(result.velocity).toBe(0)
    expect(result.forecast).toBeNull()
    expect(result.remaining).toBe(10)
    expect(result.completedSprints).toBe(0)
    expect(result.totalDelta).toBe(0)
  })

  it('computes correct velocity for a single sprint with completed data', () => {
    const sprints = [sprint('s0', 'Sprint 0')]
    const entries = [
      entry('s0', 'Scope', 10, 'absolute'),
      entry('s0', 'Completed', 5, 'relative'),
    ]
    const result = computeVelocity(...Object.values(buildInput(sprints, entries)))

    // Delta s0 = 5, avg = 5 / 1 = 5
    expect(result.velocity).toBe(5)
    expect(result.forecast).toBe(1) // ceil(5/5) = 1
    expect(result.remaining).toBe(5)
    expect(result.completedSprints).toBe(1)
    expect(result.totalDelta).toBe(5)
  })

  it('returns forecast zero when all work is completed', () => {
    const sprints = [sprint('s0', 'Sprint 0')]
    const entries = [
      entry('s0', 'Scope', 10, 'absolute'),
      entry('s0', 'Completed', 10, 'absolute'),
    ]
    const result = computeVelocity(...Object.values(buildInput(sprints, entries)))

    expect(result.velocity).toBe(10)
    expect(result.forecast).toBe(0)
    expect(result.remaining).toBe(0)
    expect(result.completedSprints).toBe(1)
  })

  it('handles mixed relative and absolute completed modes', () => {
    const sprints = [
      sprint('s0', 'Sprint 0'),
      sprint('s1', 'Sprint 1'),
    ]
    const entries = [
      entry('s0', 'Scope', 25, 'absolute'),
      entry('s0', 'Completed', 5, 'relative'),
      entry('s1', 'Completed', 15, 'absolute'),
    ]
    const result = computeVelocity(...Object.values(buildInput(sprints, entries)))

    // s0: completed = 5 (relative: 0+5)
    // s1: completed = 15 (absolute overrides to 15)
    // Delta s0 = 5, Delta s1 = 10, avg = 7.5
    expect(result.velocity).toBe(7.5)
    expect(result.completedSprints).toBe(2)
    expect(result.totalDelta).toBe(15)
    // remaining = 25 - 15 = 10, forecast = ceil(10/7.5) = 2
    expect(result.remaining).toBe(10)
    expect(result.forecast).toBe(2)
  })

  it('guards against negative deltas', () => {
    const sprints = [
      sprint('s0', 'Sprint 0'),
      sprint('s1', 'Sprint 1'),
    ]
    const entries = [
      entry('s0', 'Completed', 10, 'absolute'),
      entry('s1', 'Completed', 3, 'absolute'),
    ]
    const result = computeVelocity(...Object.values(buildInput(sprints, entries)))

    // s0: completed = 10 (absolute)
    // s1: completed = 3 (absolute → lower than previous cumulative)
    // Delta s0 = 10, Delta s1 = Math.max(0, 3-10) = 0
    // avg = (10 + 0) / 2 = 5
    expect(result.velocity).toBe(5)
    expect(result.totalDelta).toBe(10)
    expect(result.completedSprints).toBe(2)
  })
})
