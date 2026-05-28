/**
 * useInlineEdit — Extracted inline-edit hook
 *
 * Two modes:
 *   Number-editing mode: useInlineEdit(currentValue, min, onCommit)
 *     - Manages draft state, commit (Enter), cancel (Escape), auto-focus
 *   Focus-only mode: useInlineEdit()
 *     - Manages open/close + auto-focus; onChange is handled externally
 *
 * Returns: { editing, draft, setDraft, ref, open, commit, cancel, close, handleKeyDown }
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function useInlineEdit(currentValue, min, onCommit) {
  const isNumberMode = typeof onCommit === 'function';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    currentValue != null ? String(currentValue) : '',
  );
  const ref = useRef(null);

  // Auto-focus and select when editing becomes active
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (isNumberMode) ref.current.select();
    }
  }, [editing, isNumberMode]);

  // Sync draft from external value when not editing (number mode)
  useEffect(() => {
    if (isNumberMode && !editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(String(currentValue));
    }
  }, [currentValue, editing, isNumberMode]);

  const open = useCallback(() => {
    if (currentValue != null) {
      setDraft(String(currentValue));
    }
    setEditing(true);
  }, [currentValue]);

  const commit = useCallback(() => {
    if (!isNumberMode) return;
    const val = Math.max(min, parseInt(draft, 10) || min);
    setDraft(String(val));
    onCommit(val);
    setEditing(false);
  }, [draft, min, onCommit, isNumberMode]);

  const cancel = useCallback(() => {
    if (isNumberMode && currentValue != null) {
      setDraft(String(currentValue));
    }
    setEditing(false);
  }, [currentValue, isNumberMode]);

  const close = useCallback(() => {
    setEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && isNumberMode) {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    },
    [commit, cancel, isNumberMode],
  );

  return {
    editing,
    draft,
    setDraft,
    ref,
    open,
    commit,
    cancel,
    close,
    handleKeyDown,
  };
}
