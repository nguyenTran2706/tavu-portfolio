import { ArrowDown, ArrowUpRight, Mail } from 'lucide-react';
import HeroCanvas from './HeroCanvas';
import HeroReveal from './HeroReveal';
import SplitText from '@/components/ui/SplitText';
import Magnetic from '@/components/ui/Magnetic';
import { identity, marquee } from '@/content/profile';

export default function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
      <HeroCanvas />

      {/* Drives the load-in stagger and the drift-away parallax on scroll. */}
      <HeroReveal className="shell relative z-10 pb-16 pt-32 sm:pb-20">
        <p data-hero-item className="eyebrow mb-6 flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-accent" aria-hidden="true" />
          {identity.title} · {identity.location.split(',')[0]}
        </p>

        <h1 className="max-w-[15ch] text-hero">
          {/* Plays on load rather than on scroll — it is already in view. */}
          <SplitText text={identity.name} trigger="load" delay={0.15} stagger={0.08} />
        </h1>

        <p data-hero-item className="mt-7 max-w-2xl text-lg text-ink-secondary sm:text-xl">
          {identity.valueProp}
        </p>

        <p data-hero-item className="mt-4 max-w-xl font-mono text-[0.8125rem] leading-relaxed text-ink-muted">
          Store brand{' '}
          <span className="text-accent">{identity.brand}</span> — independent eBay operation,
          collectibles &amp; PC hardware.
        </p>

        <ul data-hero-item className="mt-8 flex flex-wrap gap-2">
          {identity.chips.map((chip) => (
            <li key={chip} className="chip">
              {chip}
            </li>
          ))}
        </ul>

        <div data-hero-item className="mt-10 flex flex-wrap items-center gap-3">
          <Magnetic>
            <a
              href="#experience"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-6 py-3
                         font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void
                         transition-colors duration-200 ease-out hover:bg-accent-hover"
            >
              View the work
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#contact"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-hairline px-6 py-3
                         font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-secondary
                         transition-colors duration-200 ease-out hover:border-accent/60 hover:text-accent-hover"
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              Get in touch
            </a>
          </Magnetic>
        </div>
      </HeroReveal>

      {/* Skills marquee — content, so it is readable text, not an image.
          Skews a fraction of a degree with scroll velocity, which reads as the
          strip having a little mass. `--scroll-vel` is published by SmoothScroll
          and defaults to 0, so this is inert without JS or under reduced motion. */}
      <div
        className="relative z-10 border-y border-hairline bg-page/60 py-3.5"
        style={{ transform: 'skewX(calc(var(--scroll-vel, 0) * -0.8deg))' }}
      >
        <div className="group flex overflow-hidden" role="list" aria-label="Core skills">
          <MarqueeTrack />
          <MarqueeTrack ariaHidden />
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to About"
        className="absolute bottom-24 right-5 z-10 hidden cursor-pointer items-center gap-2 font-mono
                   text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted transition-colors
                   duration-200 hover:text-accent-hover sm:right-8 sm:flex lg:right-16"
      >
        Scroll
        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 animate-scroll-cue" />
      </a>
    </section>
  );
}

/**
 * The track is duplicated and the animation translates exactly -50%, so the loop
 * is seamless. The clone is `aria-hidden` to keep the list read once.
 * Paused on hover *and* focus-within, so keyboard users can read a moving strip.
 */
function MarqueeTrack({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 animate-marquee items-center gap-8 pr-8
                 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
    >
      {marquee.map((item, i) => (
        <li
          key={`${item}-${i}`}
          role={ariaHidden ? undefined : 'listitem'}
          className="flex shrink-0 items-center gap-8 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-ink-muted"
        >
          {item}
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent/50" />
        </li>
      ))}
    </ul>
  );
}
