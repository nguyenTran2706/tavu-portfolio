'use client';

import { useEffect, useState } from 'react';
import { sections, identity } from '@/content/profile';
import { cx } from '@/lib/format';

/**
 * Sticky numbered nav with a scroll-progress rule and active-section highlight.
 *
 * Active section comes from scroll position rather than IntersectionObserver
 * ratios: with sections of wildly different heights (the dashboard is several
 * screens tall) ratio-based observers flicker between neighbours.
 */
export default function Nav() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>('');
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setCondensed(window.scrollY > 80);

      // The section whose top has most recently passed the upper third wins.
      const line = window.innerHeight * 0.34;
      let current = '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300 ease-out',
        condensed && 'bg-page/85 backdrop-blur-sm',
      )}
    >
      <nav aria-label="Section navigation" className="shell">
        <div
          className={cx(
            'flex items-center justify-between gap-6 transition-all duration-300 ease-out',
            condensed ? 'py-3' : 'py-5',
          )}
        >
          <a
            href="#top"
            className="cursor-pointer font-display text-lg font-semibold tracking-tight text-ink transition-colors duration-200 hover:text-accent-hover"
          >
            {identity.brand}
            <span className="sr-only"> — back to top</span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {sections.map((s) => {
              const isActive = active === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={cx(
                      'group flex cursor-pointer items-baseline gap-1.5 rounded px-2.5 py-1.5',
                      'font-mono text-[0.6875rem] uppercase tracking-[0.14em]',
                      'transition-colors duration-200 ease-out',
                      isActive ? 'text-ink' : 'text-ink-muted hover:text-ink-secondary',
                    )}
                  >
                    <span className={cx('tabular-nums', isActive ? 'text-accent' : 'text-ink-muted/70')}>
                      {s.num}
                    </span>
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href="#contact"
            className="cursor-pointer rounded-full border border-hairline px-4 py-1.5 font-mono text-[0.6875rem]
                       uppercase tracking-[0.12em] text-ink-secondary transition-colors duration-200 ease-out
                       hover:border-accent/60 hover:text-accent-hover"
          >
            Get in touch
          </a>
        </div>
      </nav>

      {/* Scroll progress. Decorative duplicate of the scrollbar, so hidden from AT. */}
      <div className="h-px w-full bg-hairline" aria-hidden="true">
        <div
          className="h-px origin-left bg-accent transition-[transform] duration-150 ease-out"
          style={{ transform: `scaleX(${progress})`, width: '100%' }}
        />
      </div>
    </header>
  );
}
