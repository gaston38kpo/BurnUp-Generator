import { useReducer, useCallback } from 'react';

const SPRINT_0_ID = 's0';

export function buildSprints(count, offset = 0) {
  const sprints = [{ id: SPRINT_0_ID, name: 'Sprint ' + offset }];
  for (let i = 1; i <= count; i++) {
    sprints.push({ id: 's' + i, name: 'Sprint ' + (offset + i) });
  }
  return sprints;
}

const DEFAULT_SPRINT_COUNT = 1;

export const DEFAULT_STATE = {
  title: '',
  sprintCount: DEFAULT_SPRINT_COUNT,
  sprintOffset: 0,
  nextEntryId: 1,
  sprints: buildSprints(DEFAULT_SPRINT_COUNT, 0),
  entries: [],
  dateFrom: '',
  dateTo: '',
  chartConfig: { scopeType: 'linear', completedType: 'linear', scopeFill: true, completedFill: true, scopeColor: '#75AADB', completedColor: '#FCBF49', idealColor: '' },
};

export function undoRedoReducer(state, action) {
  const { past, present, future } = state;

  switch (action.type) {
    case 'UNDO': {
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    }
    case 'REDO': {
      if (future.length === 0) return state;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    }
    case 'SET_TITLE':
    case 'SET_DATE_FROM':
    case 'SET_DATE_TO':
    case 'SET_CHART_CONFIG': {
      const keyMap = {
        SET_TITLE: 'title',
        SET_DATE_FROM: 'dateFrom',
        SET_DATE_TO: 'dateTo',
        SET_CHART_CONFIG: 'chartConfig',
      };
      const key = keyMap[action.type];
      if (present[key] === action.payload) return state;
      const newPresent = { ...present, [key]: action.payload };
      const newPast = [...past, present].slice(-50);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    }
    case 'ADD_ENTRY': {
      const { sprintId, tipo, valor, mode } = action.payload;
      const newEntry = {
        id: 'e' + present.nextEntryId,
        sprintId,
        tipo,
        valor: Number(valor) || 0,
        mode: mode || 'relative',
      };
      const newPresent = {
        ...present,
        nextEntryId: present.nextEntryId + 1,
        entries: [...present.entries, newEntry],
      };
      const newPast = [...past, present].slice(-50);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    }
    case 'UPDATE_ENTRY': {
      const { id, field, value } = action.payload;
      const entryIndex = present.entries.findIndex((e) => e.id === id);
      if (entryIndex === -1) return state;
      if (present.entries[entryIndex][field] === value) return state;
      const newEntries = present.entries.slice();
      newEntries[entryIndex] = { ...newEntries[entryIndex], [field]: value };
      const newPresent = { ...present, entries: newEntries };
      const newPast = [...past, present].slice(-50);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    }
    case 'DELETE_ENTRY': {
      const id = action.payload;
      const entryIndex = present.entries.findIndex((e) => e.id === id);
      if (entryIndex === -1) return state;
      const newPresent = {
        ...present,
        entries: present.entries.filter((e) => e.id !== id),
      };
      const newPast = [...past, present].slice(-50);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    }
    case 'SET_SPRINT_OFFSET': {
      const offset = Math.max(0, Number(action.payload) || 0);
      if (present.sprintOffset === offset) return state;
      const newPresent = {
        ...present,
        sprintOffset: offset,
        sprints: buildSprints(present.sprintCount, offset),
      };
      const newPast = [...past, present].slice(-50);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    }
    case 'SET_SPRINT_COUNT': {
      const count = Math.max(1, Number(action.payload) || 1);
      const currentCount = present.sprints.length - 1;
      let newPresent;
      if (count === currentCount) {
        newPresent = present;
      } else if (count > currentCount) {
        const added = [];
        for (let i = currentCount + 1; i <= count; i++) {
          added.push({ id: 's' + i, name: 'Sprint ' + (present.sprintOffset + i) });
        }
        newPresent = {
          ...present,
          sprintCount: count,
          sprints: [...present.sprints, ...added],
        };
      } else {
        const kept = present.sprints.slice(0, count + 1);
        const keptIds = new Set(kept.map((s) => s.id));
        newPresent = {
          ...present,
          sprintCount: count,
          sprints: kept,
          entries: present.entries.filter((e) => keptIds.has(e.sprintId)),
        };
      }
      if (newPresent === present) return state;
      const newPast = [...past, present].slice(-50);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    }
    case 'RESET': {
      const newPresent = { ...DEFAULT_STATE };
      const newPast = [...past, present].slice(-50);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    }
    default:
      return state;
  }
}

export default function useUndoRedo(initialPresent) {
  const initialState = {
    past: [],
    present: initialPresent || DEFAULT_STATE,
    future: [],
  };

  const [state, dispatch] = useReducer(undoRedoReducer, initialState);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return {
    state,
    dispatch,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
