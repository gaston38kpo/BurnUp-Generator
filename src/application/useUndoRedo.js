/**
 * useUndoRedo.js — React adapter for domain/burnupReducer
 *
 * This file is kept as an adapter layer. The pure domain logic
 * (appReducer, undoRedoReducer, buildSprints, DEFAULT_STATE, ACTION_TYPES)
 * lives in src/domain/burnupReducer.js with ZERO React dependencies.
 *
 * This file provides the React hook (useReducer + useCallback) that
 * connects the domain reducer to the React component tree.
 */

import { useReducer, useCallback } from 'react';
import {
  undoRedoReducer,
  DEFAULT_STATE,
  ACTION_TYPES,
  buildSprints,
} from '../domain/burnupReducer.js';

export { ACTION_TYPES, buildSprints, DEFAULT_STATE, undoRedoReducer };

export default function useUndoRedo(initialPresent) {
  const initialState = {
    past: [],
    present: initialPresent || DEFAULT_STATE,
    future: [],
  };

  const [state, dispatch] = useReducer(undoRedoReducer, initialState);

  const undo = useCallback(() => {
    dispatch({ type: ACTION_TYPES.UNDO });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: ACTION_TYPES.REDO });
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
