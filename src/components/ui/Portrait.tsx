'use client';

import Image from 'next/image';
import { useState } from 'react';
import { User } from 'lucide-react';
import Parallax from './Parallax';

/**
 * Renders the portrait, falling back to an instructional panel if the file
 * isn't there.
 *
 * The photo is deliberately not committed to the repo, so a fresh clone would
 * otherwise show a broken image. Failing over to the panel means the page looks
 * finished either way, and it says exactly what to do — better than a broken
 * icon, and better than shipping a stand-in photograph of a stranger.
 */
export default function Portrait({ src, alt, name }: { src: string; alt: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(80%_60%_at_50%_0%,#211e19,#191713)] p-8 text-center">
        <User aria-hidden="true" className="h-10 w-10 text-ink-muted/60" />
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-status-warning">
          Portrait not found
        </p>
        <p className="max-w-[28ch] text-sm text-ink-muted">
          Save the photo as{' '}
          <code className="font-mono text-[0.75rem] text-ink-secondary">public{src}</code> and it
          appears here — no code change needed.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Slight overscale so the parallax drift never exposes an edge. */}
      <Parallax speed={-44} className="absolute inset-0 -top-[6%] h-[112%]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority
          onError={() => setFailed(true)}
          className="object-cover object-top"
        />
      </Parallax>
      {/* Warms the portrait into the palette and keeps the caption legible. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-accent/[0.07] mix-blend-overlay" />
      <p className="absolute inset-x-0 bottom-0 p-5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-secondary">
        {name}
      </p>
    </>
  );
}
