'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Aggregates } from '@/lib/ebay';
import { aud, audCompact, pct } from '@/lib/format';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Charts mount only when their card scrolls into view (see `ChartCard`), so the
 * draw-in plays as the card arrives. `useAnim` turns the whole thing off for
 * anyone who asked for reduced motion — the final state renders immediately.
 */
function useAnim() {
  const reduced = useReducedMotion();
  return { isAnimationActive: !reduced, animationDuration: 900, animationEasing: 'ease-out' as const };
}

/* Shared chrome — recessive, solid hairlines, muted ink (never a series colour) */
const ACCENT = '#c98500';
const SERIES_2 = '#3987e5';
const RAMP = ['#7a5206', '#9c6a08', '#b87c0a', '#d09220', '#e3af57', '#f2cf95'];

const TICK = {
  fill: '#8f887a',
  fontSize: 11,
  fontFamily: 'var(--font-mono), ui-monospace, monospace',
};
const AXIS_LINE = { stroke: '#3a3730' };
const GRID = '#2c2a25';
const CURSOR = { fill: 'rgba(255,252,240,0.04)' };

function TipBox({
  label,
  rows,
}: {
  label: string;
  rows: { name: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-tile border border-hairline bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2 text-[0.8125rem] text-ink">
            {r.color && (
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ background: r.color }}
              />
            )}
            <span className="text-ink-secondary">{r.name}</span>
            <span className="ml-auto font-medium tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const currencyTip = (extra?: (p: any) => { name: string; value: string }[]) =>
  function CurrencyTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
      <TipBox
        label={String(label)}
        rows={[
          { name: 'Revenue', value: aud(point.revenue ?? payload[0].value, { decimals: 2 }), color: ACCENT },
          ...(extra ? extra(point) : []),
        ]}
      />
    );
  };
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */

export function RevenueOverTime({ data }: { data: Aggregates['byMonth'] }) {
  const anim = useAnim();
  const peak = data.reduce((m, d) => (d.revenue > m.revenue ? d : m), data[0]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.32} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickMargin={10} />
        <YAxis
          tick={TICK}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => audCompact(v)}
        />
        <Tooltip
          cursor={{ stroke: '#3a3730', strokeWidth: 1 }}
          content={currencyTip((p) => [
            { name: 'Orders', value: String(p.orders) },
            { name: 'Units', value: String(p.units) },
          ])}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={ACCENT}
          strokeWidth={2}
          fill="url(#revFill)"
          dot={{ r: 3, fill: ACCENT, stroke: '#191713', strokeWidth: 2 }}
          activeDot={{ r: 5, fill: ACCENT, stroke: '#191713', strokeWidth: 2 }}
          {...anim}
        >
          {/* Selective direct label: the peak month only, never every point. */}
          <LabelList
            dataKey="revenue"
            content={(props: unknown) => {
              const p = props as { x?: number; y?: number; value?: number; index?: number };
              if (!peak || data[p.index ?? -1]?.label !== peak.label) return null;
              return (
                <text
                  x={p.x}
                  y={(p.y ?? 0) - 12}
                  textAnchor="middle"
                  fill="#c5bfb1"
                  fontSize={11}
                  fontFamily="var(--font-mono), monospace"
                >
                  {audCompact(p.value ?? 0)}
                </text>
              );
            }}
          />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersOverTime({ data }: { data: Aggregates['byMonth'] }) {
  const anim = useAnim();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }} barCategoryGap="28%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickMargin={10} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip
          cursor={CURSOR}
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          content={({ active, payload, label }: any) =>
            active && payload?.length ? (
              <TipBox
                label={String(label)}
                rows={[
                  { name: 'Orders', value: String(payload[0].value), color: ACCENT },
                  { name: 'Units', value: String(payload[0].payload.units) },
                ]}
              />
            ) : null
          }
        />
        {/* Rounded data-end anchored to the baseline. */}
        <Bar dataKey="orders" fill={ACCENT} radius={[4, 4, 0, 0]} {...anim} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Nominal categories → one colour for every bar (never a value-ramp). */
export function HorizontalBar({
  data,
  categoryKey,
  labelWidth = 110,
}: {
  data: { revenue: number }[] & Record<string, unknown>[];
  categoryKey: string;
  labelWidth?: number;
}) {
  const anim = useAnim();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 56, bottom: 0, left: 0 }}
        barCategoryGap="26%"
      >
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis
          type="number"
          tick={TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => audCompact(v)}
        />
        <YAxis
          type="category"
          dataKey={categoryKey}
          tick={TICK}
          axisLine={AXIS_LINE}
          tickLine={false}
          width={labelWidth}
        />
        <Tooltip cursor={CURSOR} content={currencyTip()} />
        <Bar dataKey="revenue" fill={ACCENT} radius={[0, 4, 4, 0]} {...anim}>
          <LabelList
            dataKey="revenue"
            position="right"
            offset={8}
            // Recharts types this as RenderableText, not number.
            formatter={(v) => audCompact(Number(v ?? 0))}
            fill="#c5bfb1"
            fontSize={11}
            fontFamily="var(--font-mono), monospace"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Price bands are genuinely ordered, so this is the one place the ramp applies. */
export function RevenueByBand({ data }: { data: Aggregates['byBand'] }) {
  const anim = useAnim();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} barCategoryGap="24%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="band" tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickMargin={10} />
        <YAxis
          tick={TICK}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v: number) => audCompact(v)}
        />
        <Tooltip
          cursor={CURSOR}
          content={currencyTip((p) => [
            { name: 'Units', value: String(p.units) },
            { name: 'Share', value: pct(p.sharePct) },
          ])}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} {...anim}>
          {data.map((d, i) => (
            // 2px surface gap between adjacent fills comes from barCategoryGap.
            <Cell key={d.band} fill={RAMP[Math.min(i, RAMP.length - 1)]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Two series, one axis — both are percentages of the same whole, so they share a
 * scale legitimately. This is the shape of the store's core problem: the cheap
 * bands move most of the units and almost none of the money.
 */
export function ShareByBand({ data }: { data: Aggregates['byBand'] & { unitSharePct: number }[] }) {
  const anim = useAnim();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }} barCategoryGap="24%" barGap={2}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="band" tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickMargin={10} />
        <YAxis
          tick={TICK}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          cursor={CURSOR}
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          content={({ active, payload, label }: any) =>
            active && payload?.length ? (
              <TipBox
                label={String(label)}
                rows={[
                  { name: 'Share of revenue', value: pct(payload[0].payload.sharePct), color: ACCENT },
                  { name: 'Share of units', value: pct(payload[0].payload.unitSharePct), color: SERIES_2 },
                ]}
              />
            ) : null
          }
        />
        {/* ≥ 2 series, so a legend is always present — identity is never colour alone. */}
        <Legend
          verticalAlign="top"
          align="left"
          height={28}
          iconType="square"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ color: '#c5bfb1', fontSize: 12 }}>{value}</span>
          )}
        />
        <Bar name="Share of revenue" dataKey="sharePct" fill={ACCENT} radius={[4, 4, 0, 0]} {...anim} />
        <Bar name="Share of units" dataKey="unitSharePct" fill={SERIES_2} radius={[4, 4, 0, 0]} {...anim} />
      </BarChart>
    </ResponsiveContainer>
  );
}
