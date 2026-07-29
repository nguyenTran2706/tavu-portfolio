'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion`, live.
 *
 * Starts `true` so the first paint is the calm one: nothing animates until we
 * have positively confirmed motion is welcome. Getting this backwards produces
 * a flash of movement for exactly the people who asked not to see it.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}
