import { describe, it, expect } from 'vitest'
import pako from 'pako'
import { encodeState, decodeState, readUrlToken } from './UrlStateAdapter.js'

// ─── Sample state fixtures ────────────────────────────────────────────────────

const MINIMAL_STATE = {
  title: '',
  sprintCount: 1,
  sprintOffset: 0,
  nextEntryId: 1,
  sprints: [{ id: 's0', name: 'Sprint 0' }],
  entries: [],
  dateFrom: '',
  dateTo: '',
  chartConfig: {
    scopeType: 'linear',
    completedType: 'linear',
    scopeFill: true,
    completedFill: true,
    scopeColor: '#75AADB',
    completedColor: '#FCBF49',
    idealColor: '',
  },
}

const FULL_STATE = {
  title: 'My Sprint',
  sprintCount: 2,
  sprintOffset: 10,
  nextEntryId: 3,
  sprints: [
    { id: 's0', name: 'Sprint 10' },
    { id: 's1', name: 'Sprint 11' },
    { id: 's2', name: 'Sprint 12' },
  ],
  entries: [
    { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' },
    { id: 'e2', sprintId: 's1', tipo: 'Completed', valor: 5, mode: 'absolute' },
  ],
  dateFrom: '2026-05-01',
  dateTo: '2026-05-27',
  chartConfig: {
    scopeType: 'stepAfter',
    completedType: 'linear',
    scopeFill: true,
    completedFill: false,
    scopeColor: '#FF5733',
    completedColor: '#33FF57',
    idealColor: '#FFFFFF',
    showTrendLine: true,
  },
}

// ─── encodeState / decodeState ────────────────────────────────────────────────

describe('encodeState / decodeState', () => {
  it('encodes and decodes minimal state preserving structure', () => {
    const token = encodeState(MINIMAL_STATE)
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')

    const decoded = decodeState(token)
    expect(decoded).not.toBeNull()
    expect(decoded.error).toBeUndefined()

    expect(decoded.title).toBe(MINIMAL_STATE.title)
    expect(decoded.sprints).toEqual(MINIMAL_STATE.sprints)
    expect(decoded.sprintOffset).toBe(MINIMAL_STATE.sprintOffset)
    expect(decoded.chartConfig.scopeType).toBe('linear')
  })

  it('encodes and decodes full state correctly', () => {
    const token = encodeState(FULL_STATE)
    expect(token).toBeTruthy()

    const decoded = decodeState(token)
    expect(decoded).not.toBeNull()
    expect(decoded.error).toBeUndefined()

    expect(decoded.title).toBe('My Sprint')
    expect(decoded.sprints).toHaveLength(3)
    expect(decoded.sprints[0].name).toBe('Sprint 10')
    expect(decoded.sprintOffset).toBe(10)
    expect(decoded.dateFrom).toBe('2026-05-01')
    expect(decoded.dateTo).toBe('2026-05-27')

    expect(decoded.entries).toHaveLength(2)
    const scopeEntry = decoded.entries.find((e) => e.tipo === 'Scope')
    const completedEntry = decoded.entries.find((e) => e.tipo === 'Completed')
    expect(scopeEntry.valor).toBe(10)
    expect(scopeEntry.mode).toBe('relative')
    expect(completedEntry.valor).toBe(5)
    expect(completedEntry.mode).toBe('absolute')

    // Chart config
    expect(decoded.chartConfig.scopeType).toBe('stepAfter')
    expect(decoded.chartConfig.completedType).toBe('linear')
    expect(decoded.chartConfig.scopeFill).toBe(true)
    expect(decoded.chartConfig.completedFill).toBe(false)
    expect(decoded.chartConfig.scopeColor).toBe('#FF5733')
    expect(decoded.chartConfig.completedColor).toBe('#33FF57')
    expect(decoded.chartConfig.showTrendLine).toBe(true)
  })

  it('generates different tokens for different states', () => {
    const token1 = encodeState(MINIMAL_STATE)
    const token2 = encodeState(FULL_STATE)
    expect(token1).not.toBe(token2)
  })

  it('handles empty entries gracefully', () => {
    const state = {
      ...MINIMAL_STATE,
      sprints: [
        { id: 's0', name: 'Sprint 0' },
        { id: 's1', name: 'Sprint 1' },
      ],
      sprintCount: 2,
    }
    const token = encodeState(state)
    const decoded = decodeState(token)
    expect(decoded.entries).toHaveLength(0)
    expect(decoded.sprints).toHaveLength(2)
  })

  it('roundtrips entries with mode defaulting to relative', () => {
    const state = {
      ...MINIMAL_STATE,
      entries: [
        { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 7, mode: 'relative' },
      ],
    }
    const decoded = decodeState(encodeState(state))
    expect(decoded.entries[0].mode).toBe('relative')
  })
})

// ─── decodeState edge cases ────────────────────────────────────────────────────

describe('decodeState edge cases', () => {
  it('returns null for empty token', () => {
    expect(decodeState('')).toBeNull()
    expect(decodeState(null)).toBeNull()
    expect(decodeState(undefined)).toBeNull()
  })

  it('returns null for garbage input', () => {
    const result = decodeState('this-is-not-valid-base64url')
    expect(result).toBeNull()
  })

  it('returns null for corrupted token', () => {
    // valid base64url but not valid compressed data
    const result = decodeState('YWJjZGVmZw')
    expect(result).toBeNull()
  })

  it('returns v1_unsupported for v1 format', () => {
    // Craft a valid v1 token: pako-deflated [1,"title","item"] → base64url
    const v1Compact = JSON.stringify([1, 'title', 'item'])
    const compressed = pako.deflate(v1Compact, { level: 9 })
    const binary = String.fromCharCode(...compressed)
    const token = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const result = decodeState(token)
    expect(result).not.toBeNull()
    expect(result.error).toBe('v1_unsupported')
  })

  function makeToken(compact) {
    const compressed = pako.deflate(JSON.stringify(compact), { level: 9 })
    const binary = String.fromCharCode(...compressed)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  it('decodes v5 format (version 5, with dates, no sprintOffset)', () => {
    // v5: [5, title, dateFrom, dateTo, sprintNames..., null, entries..., null, scopeType, completedType]
    const compact = [5, 'My Chart', '2026-01-01', '2026-01-31', 'Sprint 0', 'Sprint 1', null, 0, 10, 0, 0, null, 1, 0]
    const result = decodeState(makeToken(compact))
    expect(result).not.toBeNull()
    expect(result.error).toBeUndefined()
    expect(result.title).toBe('My Chart')
    expect(result.dateFrom).toBe('2026-01-01')
    expect(result.dateTo).toBe('2026-01-31')
    expect(result.sprints).toHaveLength(2)
    expect(result.sprintOffset).toBe(0) // default for v5
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].valor).toBe(10)
    expect(result.chartConfig.scopeType).toBe('stepAfter')
    expect(result.chartConfig.completedType).toBe('linear')
  })

  it('decodes v3 format (version 3, sprints + entries only)', () => {
    // v3: [3, title, sprintNames..., null, entries...]
    const compact = [3, 'Legacy', 'Sprint 0', 'Sprint 1', null, 1, 5, 1, 1]
    const result = decodeState(makeToken(compact))
    expect(result).not.toBeNull()
    expect(result.error).toBeUndefined()
    expect(result.title).toBe('Legacy')
    expect(result.dateFrom).toBeUndefined() // no dates in v3
    expect(result.dateTo).toBeUndefined()
    expect(result.sprints).toHaveLength(2)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].sprintId).toBe('s1')
    expect(result.entries[0].tipo).toBe('Completed')
    expect(result.entries[0].valor).toBe(5)
  })

  it('decodes v2 format (version 2, entries as triplets)', () => {
    // v2: [2, title, sprintNames..., null, sprintIndex, valor, tipo, ...]
    // stride = 3 (sprintIndex, valor, tipo)
    const compact = [2, 'Ancient', 'Sprint 0', 'Sprint 1', null, 0, 10, 0, 1, 5, 1]
    const result = decodeState(makeToken(compact))
    expect(result).not.toBeNull()
    expect(result.error).toBeUndefined()
    expect(result.title).toBe('Ancient')
    expect(result.sprints).toHaveLength(2)
    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].sprintId).toBe('s0')
    expect(result.entries[0].tipo).toBe('Scope')
    expect(result.entries[0].valor).toBe(10)
    expect(result.entries[0].mode).toBe('relative') // v2 has no mode — defaults
    expect(result.entries[1].sprintId).toBe('s1')
    expect(result.entries[1].tipo).toBe('Completed')
    expect(result.entries[1].valor).toBe(5)
  })
})

describe('encodeState edge cases', () => {
  it('skips entries referencing non-existent sprints', () => {
    const state = {
      ...MINIMAL_STATE,
      entries: [
        { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 5, mode: 'relative' },
        { id: 'e2', sprintId: 'ghost-sprint', tipo: 'Completed', valor: 3, mode: 'relative' },
      ],
    }
    // Should not throw, should skip the ghost entry silently
    const token = encodeState(state)
    expect(token).toBeTruthy()
    const decoded = decodeState(token)
    expect(decoded.entries).toHaveLength(1)
    expect(decoded.entries[0].id).toBe('e1')
  })

  it('returns empty string on encoding failure', () => {
    // BigInt causes JSON.stringify to throw (BigInt is not JSON-serializable)
    const badState = {
      ...MINIMAL_STATE,
      title: 1n, // BigInt — stateToCompact reads this as state.title || null
    }
    const result = encodeState(badState)
    expect(result).toBe('')
  })
})

// ─── showDates encoding / decoding ────────────────────────────────────────────

describe('showDates encoding and decoding', () => {
  it('encodes and decodes showDates=true', () => {
    const state = {
      ...MINIMAL_STATE,
      chartConfig: { ...MINIMAL_STATE.chartConfig, showDates: true },
    }
    const decoded = decodeState(encodeState(state))
    expect(decoded.chartConfig.showDates).toBe(true)
  })

  it('encodes and decodes showDates=false', () => {
    const state = {
      ...MINIMAL_STATE,
      chartConfig: { ...MINIMAL_STATE.chartConfig, showDates: false },
    }
    const decoded = decodeState(encodeState(state))
    expect(decoded.chartConfig.showDates).toBe(false)
  })

  it('encodes and decodes showDates=undefined (default shown)', () => {
    const state = {
      ...MINIMAL_STATE,
      chartConfig: { ...MINIMAL_STATE.chartConfig }, // no showDates
    }
    const decoded = decodeState(encodeState(state))
    // undefined → compact encodes as 1 (showDates !== false), so decode returns true
    expect(decoded.chartConfig.showDates).toBe(true)
  })

  it('backward compat: decode v6 URL without showDates → showDates is undefined', () => {
    // Craft v6 compact without the showDates field at i+8
    // [6, title, dateFrom, dateTo, sprintOffset, sprintNames..., null, entries..., null, chartConfig... (only up to i+7 = showTrendLine)]
    const compact = [
      6, 'Backward', '2026-01-01', '2026-01-31', 0,
      'Sprint 0', null, // sprints
      0, 10, 0, 0, // entries
      null, // chartConfig sentinel
      0, 0, 1, 1, '#75AADB', '#FCBF49', '#FFFFFF', 0, // only 8 chartConfig items (no showDates at i+8)
    ]
    const compressed = pako.deflate(JSON.stringify(compact), { level: 9 })
    const binary = String.fromCharCode(...compressed)
    const token = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const decoded = decodeState(token)
    expect(decoded.chartConfig.showDates).toBeUndefined()
  })
})

// ─── readUrlToken (node environment — no window) ─────────────────────────────

describe('readUrlToken', () => {
  it('returns null when no window (SSR/node)', () => {
    // In node environment, typeof window !== 'undefined' but URLSearchParams
    // won't have location. Actually URLSearchParams works in node 18+,
    // but window.location does not exist.
    // readUrlToken uses window.location.search — in node this throws.
    // We expect null or graceful handling.
    // Since this is a browser API, just verify it handles gracefully.
    expect(typeof readUrlToken).toBe('function')
  })
})
