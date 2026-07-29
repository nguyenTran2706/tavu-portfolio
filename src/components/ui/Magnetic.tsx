'use client';

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Nudges an element toward the cursor while hovered, then springs back.
 *
 * Capped at `strength` px so the control never leaves its own hit area — a
 * magnetic button that outruns the pointer is a usability bug, not a flourish.
 * Mouse pointers only; disabled under reduced motion.
 */
export default function Magnetic({
  children,
  strength = 14,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    gsap.to(ref.current, {
      x: gsap.utils.clamp(-strength, strength, dx * strength),
      y: gsap.utils.clamp(-strength, strength, dy * strength),
      duration: 0.4,
      ease: 'power3.out',
    });
  };

  const reset = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      // Focus must not leave the element displaced for keyboard users.
      onBlur={reset}
      className={className}
      style={{ display: 'inline-block' }}
    >
      {children}
    </span>
  );
}
