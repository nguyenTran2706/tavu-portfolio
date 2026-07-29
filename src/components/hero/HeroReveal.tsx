'use client';

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

/**
 * Hero choreography: a staggered load-in for everything marked `data-hero-item`,
 * then a scrubbed drift-and-fade as the section scrolls away.
 *
 * The headline is excluded — `SplitText` owns that, so the two never animate the
 * same node. Items are set visible up front under reduced motion, and the CSS
 * fallback in `globals.css` covers the case where this script never runs.
 */
export default function HeroReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Layout effect: hides the items before first paint, so nothing flashes in
  // at full opacity and then jumps back to hidden. Because the hiding happens
  // here rather than in CSS, a failure to run leaves the hero simply visible.
  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = root.querySelectorAll<HTMLElement>('[data-hero-item]');

    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.85, ease: 'expo.out', stagger: 0.09, delay: 0.35 },
      );

      // Drift the whole block up and out as the hero leaves. Small travel — the
      // 3D backdrop is already carrying the depth cue.
      gsap.to(root, {
        y: -70,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.4 },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
