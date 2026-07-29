'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * GSAP setup has to run before the browser paints, or the initial state it sets
 * (opacity 0, offset transforms) lands one frame late and the user sees a flash
 * of the finished layout first. `useLayoutEffect` alone would warn during SSR,
 * hence the swap.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
