import { describe, it, expect } from 'vitest'
import { buildSprints, DEFAULT_STATE, undoRedoReducer } from './useUndoRedo'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function init(present = DEFAULT_STATE) {
  return { past: [], present, future: [] }
}

// ─── buildSprints ─────────────────────────────────────────────────────────────

describe('buildSprints', () => {
  it('returns Sprint 0 plus N additional sprints', () => {
    const sprints = buildSprints(2, 0)
    expect(sprints).toHaveLength(3)
    expect(sprints[0]).toEqual({ id: 's0', name: 'Sprint 0' })
    expect(sprints[1]).toEqual({ id: 's1', name: 'Sprint 1' })
    expect(sprints[2]).toEqual({ id: 's2', name: 'Sprint 2' })
  })

  it('applies offset to sprint names', () => {
    const sprints = buildSprints(1, 5)
    expect(sprints[0]).toEqual({ id: 's0', name: 'Sprint 5' })
    expect(sprints[1]).toEqual({ id: 's1', name: 'Sprint 6' })
  })

  it('returns just Sprint 0 when count is 0', () => {
    const sprints = buildSprints(0, 0)
    expect(sprints).toHaveLength(1)
    expect(sprints[0].name).toBe('Sprint 0')
  })
})

// ─── DEFAULT_STATE ────────────────────────────────────────────────────────────

describe('DEFAULT_STATE', () => {
  it('has expected structure', () => {
    expect(DEFAULT_STATE).toHaveProperty('title', '')
    expect(DEFAULT_STATE).toHaveProperty('sprintCount', 1)
    expect(DEFAULT_STATE).toHaveProperty('sprintOffset', 0)
    expect(DEFAULT_STATE).toHaveProperty('nextEntryId', 1)
    expect(DEFAULT_STATE).toHaveProperty('entries', [])
    expect(DEFAULT_STATE).toHaveProperty('dateFrom', '')
    expect(DEFAULT_STATE).toHaveProperty('dateTo', '')
    expect(DEFAULT_STATE).toHaveProperty('chartConfig')
  })

  it('has correct sprints for count 1', () => {
    expect(DEFAULT_STATE.sprints).toHaveLength(2)
    expect(DEFAULT_STATE.sprints[0].id).toBe('s0')
    expect(DEFAULT_STATE.sprints[1].id).toBe('s1')
  })

  it('chartConfig has default idealColor as empty string', () => {
    expect(DEFAULT_STATE.chartConfig.idealColor).toBe('')
  })
})

// ─── UNDO / REDO ──────────────────────────────────────────────────────────────

describe('undoRedoReducer — UNDO / REDO', () => {
  it('UNDO moves present to future and restores last past', () => {
    const pastState = { ...DEFAULT_STATE, title: 'old' }
    const presentState = { ...DEFAULT_STATE, title: 'current' }
    const state = { past: [pastState], present: presentState, future: [] }

    const next = undoRedoReducer(state, { type: 'UNDO' })

    expect(next.present.title).toBe('old')
    expect(next.future).toHaveLength(1)
    expect(next.future[0].title).toBe('current')
    expect(next.past).toHaveLength(0)
  })

  it('UNDO on empty past is no-op', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'UNDO' })
    expect(next).toBe(state)
  })

  it('REDO moves future to present and pushes present to past', () => {
    const currentState = { ...DEFAULT_STATE, title: 'current' }
    const futureState = { ...DEFAULT_STATE, title: 'future' }
    const state = { past: [], present: currentState, future: [futureState] }

    const next = undoRedoReducer(state, { type: 'REDO' })

    expect(next.present.title).toBe('future')
    expect(next.past).toHaveLength(1)
    expect(next.past[0].title).toBe('current')
    expect(next.future).toHaveLength(0)
  })

  it('REDO on empty future is no-op', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'REDO' })
    expect(next).toBe(state)
  })
})

// ─── SET_* (simple key setters) ───────────────────────────────────────────────

describe('undoRedoReducer — SET_TITLE / SET_DATE / SET_CHART_CONFIG', () => {
  it('SET_TITLE changes title and pushes history', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_TITLE', payload: 'My Chart' })
    expect(next.present.title).toBe('My Chart')
    expect(next.past).toHaveLength(1)
    expect(next.future).toHaveLength(0)
  })

  it('SET_TITLE with same value is no-op', () => {
    const state = init({ ...DEFAULT_STATE, title: 'same' })
    const next = undoRedoReducer(state, { type: 'SET_TITLE', payload: 'same' })
    expect(next).toBe(state)
  })

  it('SET_DATE_FROM changes dateFrom and pushes history', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_DATE_FROM', payload: '2026-05-01' })
    expect(next.present.dateFrom).toBe('2026-05-01')
    expect(next.past).toHaveLength(1)
  })

  it('SET_DATE_TO changes dateTo and pushes history', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_DATE_TO', payload: '2026-05-27' })
    expect(next.present.dateTo).toBe('2026-05-27')
    expect(next.past).toHaveLength(1)
  })

  it('SET_CHART_CONFIG changes chartConfig and pushes history', () => {
    const state = init()
    const newConfig = { ...DEFAULT_STATE.chartConfig, scopeType: 'stepAfter' }
    const next = undoRedoReducer(state, { type: 'SET_CHART_CONFIG', payload: newConfig })
    expect(next.present.chartConfig.scopeType).toBe('stepAfter')
    expect(next.past).toHaveLength(1)
  })
})

// ─── ADD_ENTRY ────────────────────────────────────────────────────────────────

describe('undoRedoReducer — ADD_ENTRY', () => {
  it('adds entry with auto-incremented id', () => {
    const state = init()
    const next = undoRedoReducer(state, {
      type: 'ADD_ENTRY',
      payload: { sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' },
    })

    expect(next.present.entries).toHaveLength(1)
    expect(next.present.entries[0].id).toBe('e1')
    expect(next.present.entries[0].sprintId).toBe('s0')
    expect(next.present.entries[0].valor).toBe(10)
    expect(next.present.nextEntryId).toBe(2)
  })

  it('multiple ADD_ENTRY produce sequential ids', () => {
    let state = init()
    state = undoRedoReducer(state, { type: 'ADD_ENTRY', payload: { sprintId: 's0', tipo: 'Scope', valor: 5, mode: 'relative' } })
    state = undoRedoReducer(state, { type: 'ADD_ENTRY', payload: { sprintId: 's1', tipo: 'Completed', valor: 3, mode: 'absolute' } })

    expect(state.present.entries).toHaveLength(2)
    expect(state.present.entries[0].id).toBe('e1')
    expect(state.present.entries[1].id).toBe('e2')
    expect(state.present.nextEntryId).toBe(3)
  })

  it('ADD_ENTRY with missing sprintId still adds (handler expects caller validation)', () => {
    // The reducer does NOT validate sprintId — that's the caller's job (App.jsx handles this)
    const state = init()
    const next = undoRedoReducer(state, {
      type: 'ADD_ENTRY',
      payload: { sprintId: undefined, tipo: 'Scope', valor: 10, mode: 'relative' },
    })
    expect(next.present.entries).toHaveLength(1)
  })

  it('ADD_ENTRY pushes history and clears future', () => {
    const state = { past: [], present: { ...DEFAULT_STATE, title: 'a' }, future: [{ ...DEFAULT_STATE, title: 'b' }] }
    const next = undoRedoReducer(state, {
      type: 'ADD_ENTRY',
      payload: { sprintId: 's0', tipo: 'Scope', valor: 1, mode: 'relative' },
    })
    expect(next.past).toHaveLength(1)
    expect(next.future).toHaveLength(0)
  })
})

// ─── UPDATE_ENTRY ─────────────────────────────────────────────────────────────

describe('undoRedoReducer — UPDATE_ENTRY', () => {
  const withEntry = init({
    ...DEFAULT_STATE,
    entries: [{ id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 5, mode: 'relative' }],
  })

  it('updates existing entry field', () => {
    const next = undoRedoReducer(withEntry, {
      type: 'UPDATE_ENTRY',
      payload: { id: 'e1', field: 'valor', value: 10 },
    })
    expect(next.present.entries[0].valor).toBe(10)
    expect(next.present.entries[0].tipo).toBe('Scope') // unchanged
  })

  it('does nothing for non-existent id', () => {
    const next = undoRedoReducer(withEntry, {
      type: 'UPDATE_ENTRY',
      payload: { id: 'e99', field: 'valor', value: 10 },
    })
    expect(next).toBe(withEntry)
  })

  it('does nothing if value is the same', () => {
    const next = undoRedoReducer(withEntry, {
      type: 'UPDATE_ENTRY',
      payload: { id: 'e1', field: 'valor', value: 5 },
    })
    expect(next).toBe(withEntry)
  })
})

// ─── DELETE_ENTRY ─────────────────────────────────────────────────────────────

describe('undoRedoReducer — DELETE_ENTRY', () => {
  const withEntry = init({
    ...DEFAULT_STATE,
    entries: [
      { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 5, mode: 'relative' },
      { id: 'e2', sprintId: 's0', tipo: 'Completed', valor: 3, mode: 'relative' },
    ],
  })

  it('removes entry by id', () => {
    const next = undoRedoReducer(withEntry, { type: 'DELETE_ENTRY', payload: 'e1' })
    expect(next.present.entries).toHaveLength(1)
    expect(next.present.entries[0].id).toBe('e2')
  })

  it('does nothing for non-existent id', () => {
    const next = undoRedoReducer(withEntry, { type: 'DELETE_ENTRY', payload: 'e99' })
    expect(next).toBe(withEntry)
  })
})

// ─── SET_SPRINT_OFFSET ────────────────────────────────────────────────────────

describe('undoRedoReducer — SET_SPRINT_OFFSET', () => {
  it('changes offset and rebuilds sprint names', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_SPRINT_OFFSET', payload: 5 })

    expect(next.present.sprintOffset).toBe(5)
    expect(next.present.sprints[0].name).toBe('Sprint 5')
    expect(next.present.sprints[1].name).toBe('Sprint 6')
  })

  it('clamps to 0 for negative values', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_SPRINT_OFFSET', payload: -5 })
    expect(next.present.sprintOffset).toBe(0)
  })

  it('same offset is no-op', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_SPRINT_OFFSET', payload: 0 })
    expect(next).toBe(state)
  })
})

// ─── SET_SPRINT_COUNT ─────────────────────────────────────────────────────────

describe('undoRedoReducer — SET_SPRINT_COUNT', () => {
  it('increases sprint count by adding sprints', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_SPRINT_COUNT', payload: 3 })

    expect(next.present.sprintCount).toBe(3)
    expect(next.present.sprints).toHaveLength(4) // s0 + s1 + s2 + s3
    expect(next.present.sprints[3].name).toBe('Sprint 3')
  })

  it('decreases sprint count and removes entries from removed sprints', () => {
    const state = init({
      ...DEFAULT_STATE,
      sprintCount: 2,
      sprints: [
        { id: 's0', name: 'Sprint 0' },
        { id: 's1', name: 'Sprint 1' },
        { id: 's2', name: 'Sprint 2' },
      ],
      entries: [
        { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 5, mode: 'relative' },
        { id: 'e2', sprintId: 's2', tipo: 'Completed', valor: 3, mode: 'relative' },
      ],
    })
    const next = undoRedoReducer(state, { type: 'SET_SPRINT_COUNT', payload: 1 })

    expect(next.present.sprintCount).toBe(1)
    expect(next.present.sprints).toHaveLength(2) // s0 + s1
    // e2 references s2 which was removed → filtered out
    expect(next.present.entries).toHaveLength(1)
    expect(next.present.entries[0].id).toBe('e1')
  })

  it('clamps to minimum 1', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_SPRINT_COUNT', payload: 0 })
    expect(next.present.sprintCount).toBe(1)
  })

  it('same count is no-op', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'SET_SPRINT_COUNT', payload: 1 })
    expect(next).toBe(state)
  })
})

// ─── RESET ────────────────────────────────────────────────────────────────────

describe('undoRedoReducer — RESET', () => {
  it('resets to DEFAULT_STATE', () => {
    const state = init({ ...DEFAULT_STATE, title: 'dirty', entries: [{ id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' }] })
    const next = undoRedoReducer(state, { type: 'RESET' })

    expect(next.present.title).toBe('')
    expect(next.present.entries).toEqual([])
    expect(next.present.sprintCount).toBe(1)
    expect(next.present.nextEntryId).toBe(1)
  })

  it('RESET pushes current state to history', () => {
    const state = init({ ...DEFAULT_STATE, title: 'before-reset' })
    const next = undoRedoReducer(state, { type: 'RESET' })

    expect(next.past).toHaveLength(1)
    expect(next.past[0].title).toBe('before-reset')
  })
})

// ─── Default ──────────────────────────────────────────────────────────────────

describe('undoRedoReducer — default', () => {
  it('unknown action type returns state unchanged', () => {
    const state = init()
    const next = undoRedoReducer(state, { type: 'UNKNOWN' })
    expect(next).toBe(state)
  })
})

// ─── History cap ──────────────────────────────────────────────────────────────

describe('undoRedoReducer — history cap at 50', () => {
  it('past is sliced to 50 entries', () => {
    let state = init()
    // Make 55 changes
    for (let i = 0; i < 55; i++) {
      state = undoRedoReducer(state, { type: 'SET_TITLE', payload: `title-${i}` })
    }
    expect(state.past).toHaveLength(50)
    expect(state.present.title).toBe('title-54')
    // Oldest entry in past should be title-5 (index 5, since 55-50=5)
    // Actually index 5 means 6th item (0-indexed)
    expect(state.past[0].title).toBe('title-4')
  })
})

// ─── Integration: complex scenarios ───────────────────────────────────────────

describe('undoRedoReducer — integration scenarios', () => {
  it('full undo/redo cycle preserves state', () => {
    let state = init()

    // Add scope
    state = undoRedoReducer(state, { type: 'ADD_ENTRY', payload: { sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' } })
    expect(state.present.entries).toHaveLength(1)

    // Add completed
    state = undoRedoReducer(state, { type: 'ADD_ENTRY', payload: { sprintId: 's0', tipo: 'Completed', valor: 4, mode: 'relative' } })
    expect(state.present.entries).toHaveLength(2)

    // Undo completed
    state = undoRedoReducer(state, { type: 'UNDO' })
    expect(state.present.entries).toHaveLength(1)
    expect(state.present.entries[0].tipo).toBe('Scope')

    // Redo completed
    state = undoRedoReducer(state, { type: 'REDO' })
    expect(state.present.entries).toHaveLength(2)

    // Change title, verifying history isn't corrupted
    state = undoRedoReducer(state, { type: 'SET_TITLE', payload: 'final' })
    expect(state.present.title).toBe('final')
    // Future should be cleared because we branched
    expect(state.future).toHaveLength(0)
  })

  it('can undo after RESET', () => {
    let state = init({ ...DEFAULT_STATE, title: 'original' })
    state = undoRedoReducer(state, { type: 'RESET' })
    expect(state.present.title).toBe('')

    state = undoRedoReducer(state, { type: 'UNDO' })
    expect(state.present.title).toBe('original')
  })
})
