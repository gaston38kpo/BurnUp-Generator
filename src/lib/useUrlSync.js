import { useEffect, useRef } from 'react';
import { encodeState, writeUrlToken } from './urlState';

export default function useUrlSync(state) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const token = encodeState(state);
      writeUrlToken(token);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);
}
