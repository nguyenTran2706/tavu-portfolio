'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

/**
 * An accent rule that draws downward, scrubbed to scroll position, over the
 * static hairline of a timeline.
 *
 * Purely decorative — the hairline underneath is the real divider — so this is
 * `aria-hidden` and simply absent under reduced motion.
 */
export default function TimelineRule() {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement,
            start: 'top 75%',
            end: 'bottom 65%',
            scrub: 0.3,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  if (reduced) return null;

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="absolute inset-y-0 -left-px w-px origin-top scale-y-0 bg-gradient-to-b from-accent via-accent to-transparent"
    />
  );
}
