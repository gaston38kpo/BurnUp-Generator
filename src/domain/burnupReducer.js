/**
 * burnupReducer.js — Pure domain logic for state management
 *
 * Contains the app state reducer, undo/redo infrastructure, and
 * all action type constants. ZERO React imports — pure JS.
 *
 * Dependency direction: domain/ imports NOTHING from outside domain/.
 */

// ─── Action Types ─────────────────────────────────────────────────────────────

export const ACTION_TYPES = {
  UNDO: 'UNDO',
  REDO: 'REDO',
  SET_TITLE: 'SET_TITLE',
  SET_DATE_FROM: 'SET_DATE_FROM',
  SET_DATE_TO: 'SET_DATE_TO',
  SET_CHART_CONFIG: 'SET_CHART_CONFIG',
  ADD_ENTRY: 'ADD_ENTRY',
  UPDATE_ENTRY: 'UPDATE_ENTRY',
  DELETE_ENTRY: 'DELETE_ENTRY',
  SET_SPRINT_COUNT: 'SET_SPRINT_COUNT',
  SET_SPRINT_OFFSET: 'SET_SPRINT_OFFSET',
  RESET: 'RESET',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SPRINT_0_ID = 's0'

export function buildSprints(count, offset = 0) {
  const sprints = [{ id: SPRINT_0_ID, name: 'Sprint ' + offset }]
  for (let i = 1; i <= count; i++) {
    sprints.push({ id: 's' + i, name: 'Sprint ' + (offset + i) })
  }
  return sprints
}

// ─── Default State ────────────────────────────────────────────────────────────

const DEFAULT_SPRINT_COUNT = 1

export const DEFAULT_STATE = {
  title: '',
  sprintCount: DEFAULT_SPRINT_COUNT,
  sprintOffset: 0,
  nextEntryId: 1,
  sprints: buildSprints(DEFAULT_SPRINT_COUNT, 0),
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
    showFirstSprintLabel: true,
  },
}

// ─── App Reducer (pure) ───────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_TITLE:
    case ACTION_TYPES.SET_DATE_FROM:
    case ACTION_TYPES.SET_DATE_TO:
    case ACTION_TYPES.SET_CHART_CONFIG: {
      const keyMap = {
        [ACTION_TYPES.SET_TITLE]: 'title',
        [ACTION_TYPES.SET_DATE_FROM]: 'dateFrom',
        [ACTION_TYPES.SET_DATE_TO]: 'dateTo',
        [ACTION_TYPES.SET_CHART_CONFIG]: 'chartConfig',
      }
      const key = keyMap[action.type]
      if (state[key] === action.payload) return state
      const newState = { ...state, [key]: action.payload }
      // If start > end, swap them
      if (key === 'dateFrom' || key === 'dateTo') {
        if (newState.dateFrom && newState.dateTo && newState.dateFrom > newState.dateTo) {
          const tmp = newState.dateFrom
          newState.dateFrom = newState.dateTo
          newState.dateTo = tmp
        }
      }
      return newState
    }
    case ACTION_TYPES.ADD_ENTRY: {
      const { sprintId, tipo, valor, mode } = action.payload
      const newEntry = {
        id: 'e' + state.nextEntryId,
        sprintId,
        tipo,
        valor: Number(valor) || 0,
        mode: mode || 'relative',
      }
      return {
        ...state,
        nextEntryId: state.nextEntryId + 1,
        entries: [...state.entries, newEntry],
      }
    }
    case ACTION_TYPES.UPDATE_ENTRY: {
      const { id, field, value } = action.payload
      const entryIndex = state.entries.findIndex((e) => e.id === id)
      if (entryIndex === -1) return state
      if (state.entries[entryIndex][field] === value) return state
      const newEntries = state.entries.slice()
      newEntries[entryIndex] = { ...newEntries[entryIndex], [field]: value }
      return { ...state, entries: newEntries }
    }
    case ACTION_TYPES.DELETE_ENTRY: {
      const id = action.payload
      const entryIndex = state.entries.findIndex((e) => e.id === id)
      if (entryIndex === -1) return state
      return { ...state, entries: state.entries.filter((e) => e.id !== id) }
    }
    case ACTION_TYPES.SET_SPRINT_OFFSET: {
      const offset = Math.max(0, Number(action.payload) || 0)
      if (state.sprintOffset === offset) return state
      return {
        ...state,
        sprintOffset: offset,
        sprints: buildSprints(state.sprintCount, offset),
      }
    }
    case ACTION_TYPES.SET_SPRINT_COUNT: {
      const count = Math.max(1, Number(action.payload) || 1)
      const currentCount = state.sprints.length - 1
      if (count === currentCount) return state
      if (count > currentCount) {
        const added = []
        for (let i = currentCount + 1; i <= count; i++) {
          added.push({ id: 's' + i, name: 'Sprint ' + (state.sprintOffset + i) })
        }
        return {
          ...state,
          sprintCount: count,
          sprints: [...state.sprints, ...added],
        }
      }
      const kept = state.sprints.slice(0, count + 1)
      const keptIds = new Set(kept.map((s) => s.id))
      return {
        ...state,
        sprintCount: count,
        sprints: kept,
        entries: state.entries.filter((e) => keptIds.has(e.sprintId)),
      }
    }
    case ACTION_TYPES.RESET: {
      return { ...DEFAULT_STATE }
    }
    default:
      return state
  }
}

// ─── Undo / Redo Wrapper ──────────────────────────────────────────────────────

function withUndo(baseReducer, maxHistory = 50) {
  return function undoWrappedReducer(state, action) {
    const { past, present, future } = state

    if (action.type === ACTION_TYPES.UNDO) {
      if (past.length === 0) return state
      const previous = past[past.length - 1]
      return {
        past: past.slice(0, past.length - 1),
        present: previous,
        future: [present, ...future],
      }
    }

    if (action.type === ACTION_TYPES.REDO) {
      if (future.length === 0) return state
      const next = future[0]
      return {
        past: [...past, present],
        present: next,
        future: future.slice(1),
      }
    }

    // All other actions delegate to baseReducer
    const newPresent = baseReducer(present, action)
    if (newPresent === present) return state
    return {
      past: [...past, present].slice(-maxHistory),
      present: newPresent,
      future: [],
    }
  }
}

// ─── Composed Reducer ─────────────────────────────────────────────────────────

export const undoRedoReducer = withUndo(appReducer)
