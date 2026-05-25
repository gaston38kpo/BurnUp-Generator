import { useReducer, useCallback } from 'react';

const SPRINT_0_ID = 's0';
const SPRINT_0_NAME = 'Sprint 0';

export function buildSprints(count) {
  const sprints = [{ id: SPRINT_0_ID, name: SPRINT_0_NAME }];
  for (let i = 1; i <= count; i++) {
    sprints.push({ id: 's' + i, name: 'Sprint ' + i });
  }
  return sprints;
}

const DEFAULT_SPRINT_COUNT = 1;

export const DEFAULT_STATE = {
  title: '',
  sprintCount: DEFAULT_SPRINT_COUNT,
  sprints: buildSprints(DEFAULT_SPRINT_COUNT),
  entries: [],
  dateFrom: '',
  dateTo: '',
  chartConfig: { scopeType: 'linear', completedType: 'linear', scopeFill: true, completedFill: true, scopeColor: '#75AADB', completedColor: '#FCBF49', idealColor: '' },
};

function undoRedoReducer(state, action) {
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
    case 'SET_ENTRIES':
    case 'SET_CHART_CONFIG': {
      const keyMap = {
        SET_TITLE: 'title',
        SET_DATE_FROM: 'dateFrom',
        SET_DATE_TO: 'dateTo',
        SET_ENTRIES: 'entries',
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
    case 'SET_SPRINT_COUNT': {
      const count = Math.max(1, Number(action.payload) || 1);
      const currentCount = present.sprints.length - 1;
      let newPresent;
      if (count === currentCount) {
        newPresent = present;
      } else if (count > currentCount) {
        const added = [];
        for (let i = currentCount + 1; i <= count; i++) {
          added.push({ id: 's' + i, name: 'Sprint ' + i });
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
