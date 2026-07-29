'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { identity } from '@/content/profile';
import { useReducedMotion } from '@/lib/useReducedMotion';

const HOLD = 0.5;

/**
 * Load curtain: the wordmark draws in, a hairline sweeps, the panel lifts away.
 *
 * Two deliberate safety properties:
 *  1. It is rendered only after mount, from a client component — so a visitor
 *     without JavaScript never gets a panel that can't be dismissed.
 *  2. It unmounts on completion and is skipped entirely under reduced motion,
 *     rather than lingering as an invisible overlay that eats clicks.
 */
export default function Intro() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const [armed, setArmed] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setArmed(true), []);

  useEffect(() => {
    if (!armed) return;

    if (reduced) {
      setDone(true);
      document.body.style.removeProperty('overflow');
      return;
    }

    // Hold the scroll position while the curtain is up, then hand it back.
    document.body.style.overflow = 'hidden';

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.removeProperty('overflow');
          setDone(true);
        },
      });

      tl.to('[data-intro-word]', {
        yPercent: 0,
        opacity: 1,
        duration: 0.75,
        ease: 'expo.out',
        stagger: 0.07,
      })
        .fromTo('[data-intro-rule]', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, '-=0.35')
        .to('[data-intro-content]', { opacity: 0, duration: 0.4, ease: 'power2.in' }, `+=${HOLD}`)
        .to(root.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.15');
    }, root);

    // If anything above throws or stalls, never trap the page.
    const failsafe = window.setTimeout(() => {
      document.body.style.removeProperty('overflow');
      setDone(true);
    }, 4000);

    return () => {
      ctx.revert();
      window.clearTimeout(failsafe);
      document.body.style.removeProperty('overflow');
    };
  }, [armed, reduced]);

  if (!armed || done) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-void"
    >
      <div data-intro-content className="flex flex-col items-center gap-5">
        <p className="flex overflow-hidden font-display text-[clamp(2.5rem,9vw,5rem)] font-semibold leading-none">
          {identity.brand.split('').map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              data-intro-word
              className="inline-block translate-y-[110%] opacity-0"
            >
              {ch}
            </span>
          ))}
        </p>
        <span
          data-intro-rule
          className="block h-px w-40 origin-left bg-accent"
        />
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-muted">
          {identity.title}
        </p>
      </div>
    </div>
  );
}
