'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Owns the two global scroll concerns:
 *   1. Lenis smooth scrolling, driven from GSAP's ticker so both agree on time.
 *   2. Staggered `.reveal` entrances via ScrollTrigger.batch.
 *
 * Under reduced motion neither runs: scrolling stays native and reveals are
 * marked visible immediately.
 */
export default function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Signals to CSS that JS is alive, so `.no-js .reveal` stops forcing visibility.
    document.documentElement.classList.remove('no-js');

    if (reduced) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });

    // Lenis moves the page outside the normal scroll event, so ScrollTrigger has
    // to be told; and Lenis must be ticked by GSAP rather than its own rAF, or
    // the two run on separate clocks and reveals fire a frame late.
    lenis.on('scroll', ScrollTrigger.update);

    // Publish a normalised scroll velocity (-1…1) for effects that should react
    // to how fast the page is moving, not just where it is. Clamped so a
    // trackpad fling can't push a dependent transform to an absurd value.
    lenis.on('scroll', () => {
      const v = gsap.utils.clamp(-1, 1, (lenis.velocity ?? 0) / 40);
      document.documentElement.style.setProperty('--scroll-vel', v.toFixed(3));
    });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const batch = ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: (els) =>
        els.forEach((el, i) =>
          window.setTimeout(() => el.classList.add('is-visible'), i * 60),
        ),
    });

    // Anything already on screen at load should not wait for a scroll event.
    ScrollTrigger.refresh();

    /**
     * Safety net. `.reveal` starts at opacity 0, so any failure to fire leaves
     * content permanently invisible — a far worse outcome than a missing
     * animation. This sweeps anything that is on screen but still hidden, and
     * keeps running for as long as the page is open.
     */
    const onScreen = (el: Element) => {
      const { top, bottom } = el.getBoundingClientRect();
      return top < window.innerHeight && bottom > 0;
    };

    const rescue = () => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)').forEach((el) => {
        if (onScreen(el)) el.classList.add('is-visible');
      });
      // Same guarantee for SplitText. GSAP writes the hidden start state inline,
      // so a heading stuck at opacity 0 while well inside the viewport means its
      // ScrollTrigger never fired. The 0.75 threshold sits clear of the 0.85
      // trigger point, so a heading that is merely mid-entrance is left alone.
      document.querySelectorAll<HTMLElement>('[data-word]').forEach((el) => {
        const { top, bottom } = el.getBoundingClientRect();
        const wellInside = top < window.innerHeight * 0.75 && bottom > 0;
        if (el.style.opacity === '0' && wellInside) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
    };
    const rescueTimer = window.setTimeout(rescue, 1200);
    window.addEventListener('scroll', rescue, { passive: true });

    return () => {
      batch.forEach((t) => t.kill());
      window.clearTimeout(rescueTimer);
      window.removeEventListener('scroll', rescue);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
