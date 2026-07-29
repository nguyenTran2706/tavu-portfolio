'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { cx } from '@/lib/format';

/**
 * Word-by-word mask reveal: each word sits in an `overflow-hidden` wrapper and
 * slides up from below its own baseline.
 *
 * Accessibility: the split spans are `aria-hidden` and the untouched string is
 * exposed to assistive tech separately, so a screen reader reads one sentence
 * rather than a stream of disconnected words. Under reduced motion the words
 * render in place with no transform at all.
 */
export default function SplitText({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  trigger = 'scroll',
  stagger = 0.045,
}: {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  delay?: number;
  /** `scroll` waits for the element to enter view; `load` plays immediately. */
  trigger?: 'scroll' | 'load';
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  /**
   * The hidden start state is set by GSAP, never by a CSS class.
   *
   * That is load-bearing, not stylistic. A Tailwind `translate-y-[110%]` resolves
   * to a matrix in computed style, and GSAP parses matrices into *pixels* — so it
   * reads `yPercent` as already 0, tweens it 0→0, and the word stays pushed down
   * behind its mask forever while only opacity animates. `fromTo` with an explicit
   * `yPercent: 110` gives GSAP the unit it is actually animating.
   *
   * The happy side effect: nothing hides these words except script, so if the
   * script never runs the heading is simply visible.
   */
  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const words = root.querySelectorAll<HTMLElement>('[data-word]');
    if (words.length === 0) return;

    if (reduced) {
      gsap.set(words, { yPercent: 0, opacity: 1, clearProps: 'transform' });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'expo.out',
          stagger,
          delay,
          ...(trigger === 'scroll'
            ? { scrollTrigger: { trigger: root, start: 'top 85%', once: true } }
            : {}),
        },
      );
    }, root);

    return () => ctx.revert();
  }, [reduced, delay, trigger, stagger, text]);

  const words = text.split(' ');

  return (
    <Tag ref={ref as never} className={cx('block', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span
              data-word
              // No hiding classes here — the start state comes from GSAP.
              className="inline-block will-change-transform"
            >
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
