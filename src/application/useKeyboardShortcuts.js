import { useEffect } from 'react';

export default function useKeyboardShortcuts(undo, redo, canUndo, canRedo) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));
      if (isUndo && canUndo) { e.preventDefault(); undo(); }
      else if (isRedo && canRedo) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
