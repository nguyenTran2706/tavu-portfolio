'use client';

import { useEffect } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * A soft accent glow that tracks the cursor across every `.surface` card.
 *
 * One delegated `pointermove` listener on the document writes two CSS custom
 * properties on the hovered card; the gradient itself is pure CSS. That keeps
 * the cost to a single rAF-throttled write per frame no matter how many cards
 * are on screen — attaching a listener to each card would not scale, and the
 * dashboard alone has a dozen.
 */
export default function PointerGlow() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    let last: HTMLElement | null = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--glow', '1');
      if (last && last !== el) last.style.setProperty('--glow', '0');
      last = el;
    };

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.('.surface') as HTMLElement | null;
      if (!card) {
        if (last) {
          last.style.setProperty('--glow', '0');
          last = null;
        }
        return;
      }
      const r = card.getBoundingClientRect();
      pending = { el: card, x: e.clientX - r.left, y: e.clientY - r.top };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
      if (last) last.style.setProperty('--glow', '0');
    };
  }, [reduced]);

  return null;
}
