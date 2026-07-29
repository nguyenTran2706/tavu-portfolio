/** Display formatting. Deterministic — no locale-dependent month/day names. */

export const aud = (n: number, opts: { decimals?: number } = {}) =>
  'A$' +
  n.toLocaleString('en-AU', {
    minimumFractionDigits: opts.decimals ?? 0,
    maximumFractionDigits: opts.decimals ?? 0,
  });

/** Axis-scale currency: A$1.2k / A$18k. */
export const audCompact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1000) return `A$${(n / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `A$${Math.round(n)}`;
};

export const pct = (n: number, decimals = 1) => `${n.toFixed(decimals)}%`;

export const count = (n: number) => n.toLocaleString('en-AU');

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');
