'use client';

import { useRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx } from '@/lib/format';

const MAX_DEG = 6;

/**
 * Pointer-driven 3D tilt, capped at 6° so it reads as depth rather than a toy.
 * Writes transforms straight to the node — no state, so no re-render per frame.
 * Disabled entirely under reduced motion and on touch (where there is no hover).
 */
export default function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  const reset = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    if (ref.current) ref.current.style.transform = '';
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (!ref.current) return;
      ref.current.style.transform =
        `perspective(1000px) rotateX(${(-y * MAX_DEG).toFixed(2)}deg) ` +
        `rotateY(${(x * MAX_DEG).toFixed(2)}deg) translateZ(0)`;
    });
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cx('transition-transform duration-300 ease-out will-change-transform', className)}
    >
      {children}
    </div>
  );
}
