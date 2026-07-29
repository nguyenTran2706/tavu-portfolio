'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

const DURATION = 1100;
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts up to `value` once, when the tile first enters the viewport.
 *
 * Under reduced motion — and for anyone whose JS hasn't run — the final value is
 * what renders. The animation is never the only way to read the number, and the
 * element is `aria-live`-free so screen readers announce the settled figure once.
 */
export default function KpiCard({
  label,
  value,
  format,
  note,
  emphasis,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  note?: string;
  emphasis?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    // A filter change should land on the new number immediately, not re-animate.
    if (started.current) setShown(value);
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || started.current) {
      setShown(value);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();

        const from = 0;
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          setShown(from + (value - from) * easeOutExpo(t));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.35 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, reduced]);

  return (
    <div
      ref={ref}
      className={`surface flex flex-col justify-between gap-4 p-5 transition-colors duration-200 ease-out hover:bg-raised ${
        emphasis ? 'sm:col-span-2' : ''
      }`}
    >
      <p className="eyebrow">{label}</p>
      <div>
        {/* Proportional figures, sans face — never tabular-nums at display size. */}
        <p
          className={`font-sans font-semibold leading-none text-ink ${
            emphasis ? 'text-[2.75rem]' : 'text-[2rem]'
          }`}
        >
          {format(shown)}
        </p>
        {note && <p className="mt-2 text-[0.8125rem] leading-snug text-ink-muted">{note}</p>}
      </div>
    </div>
  );
}
