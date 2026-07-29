'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

// The whole three.js bundle stays out of the initial payload and never loads at
// all for visitors who don't get the canvas.
const Scene = dynamic(() => import('./Scene'), { ssr: false });

/**
 * Decides whether the 3D scene runs, and feeds it scroll progress.
 *
 * It is skipped entirely — not merely paused — when the viewer prefers reduced
 * motion, the viewport is narrow, or WebGL is unavailable. In each case the
 * static gradient underneath is the finished design, not a degraded one.
 */
export default function HeroCanvas() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const scrollRef = useRef(0);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      setEnabled(false);
      return;
    }

    const wide = window.matchMedia('(min-width: 768px)');
    const supportsWebGL = (() => {
      try {
        const c = document.createElement('canvas');
        return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
      } catch {
        return false;
      }
    })();

    const sync = () => setEnabled(wide.matches && supportsWebGL);
    sync();
    wide.addEventListener('change', sync);
    return () => wide.removeEventListener('change', sync);
  }, [reduced]);

  // Scroll progress through the first viewport, written to a ref so the value
  // reaches useFrame without re-rendering React on every scroll event.
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled]);

  // Stop rendering once the hero is off screen — the GPU should be idle while
  // someone is reading the dashboard.
  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(host);
    return () => io.disconnect();
  }, [enabled]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="grain absolute inset-0 overflow-hidden"
    >
      {/* Always present: the finished look when the canvas is absent. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#1d1913_0%,#100f0d_55%,#0b0a09_100%)]" />
      <div className="absolute left-1/2 top-[38%] h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.09] blur-[120px]" />

      {enabled && (
        <div className={visible ? 'absolute inset-0' : 'absolute inset-0 invisible'}>
          <Scene scrollRef={scrollRef} />
        </div>
      )}

      {/* Fade the backdrop into the page so the hero doesn't end on a hard edge. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-page" />
    </div>
  );
}
