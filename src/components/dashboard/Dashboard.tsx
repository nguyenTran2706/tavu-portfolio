'use client';

import { useMemo, useState } from 'react';
import { Filter, Info, Sparkles } from 'lucide-react';
import {
  aggregate,
  buildSummary,
  formatDay,
  type ProductLine,
  type StoreData,
} from '@/lib/ebay';
import { aud, count, cx, pct } from '@/lib/format';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import {
  HorizontalBar,
  OrdersOverTime,
  RevenueByBand,
  RevenueOverTime,
  ShareByBand,
} from './charts';

const LINES: (ProductLine | 'All')[] = ['All', 'LEGO', 'PC hardware', 'PC peripherals', 'Other'];
const RANGES = [
  { id: 'all', label: 'Full period', days: null },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: '30', label: 'Last 30 days', days: 30 },
] as const;

export default function Dashboard({ data }: { data: StoreData }) {
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('all');
  const [line, setLine] = useState<ProductLine | 'All'>('All');

  // The dataset's own end date anchors the presets — "last 90 days" has to mean
  // 90 days of trading, not 90 days from whenever the page happens to be opened.
  const bounds = useMemo(() => {
    const dates = data.orders.map((o) => o.date).sort();
    return { first: dates[0] ?? null, last: dates[dates.length - 1] ?? null };
  }, [data.orders]);

  const filters = useMemo(() => {
    const preset = RANGES.find((r) => r.id === range);
    if (!preset?.days || !bounds.last) return { line };
    const from = new Date(bounds.last);
    from.setUTCDate(from.getUTCDate() - preset.days);
    return { from: from.toISOString().slice(0, 10), line };
  }, [range, line, bounds.last]);

  const a = useMemo(() => aggregate(data, filters), [data, filters]);
  const summary = useMemo(() => buildSummary(a, data.fees), [a, data.fees]);

  const bandShare = useMemo(() => {
    const units = a.byBand.reduce((t, b) => t + b.units, 0) || 1;
    return a.byBand.map((b) => ({
      ...b,
      unitSharePct: Math.round((b.units / units) * 1000) / 10,
    }));
  }, [a.byBand]);

  if (data.isEmpty) return <EmptyState />;

  const periodLabel =
    a.periodStart && a.periodEnd ? `${formatDay(a.periodStart)} – ${formatDay(a.periodEnd)}` : '—';

  return (
    <div className="mt-8">
      {/* ---- Filter row: one row above everything it scopes ---- */}
      <div className="surface reveal mb-5 flex flex-wrap items-center gap-x-8 gap-y-4 p-4 sm:px-5">
        <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
          <Filter aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
          Filters
        </p>

        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Date range</legend>
          {RANGES.map((r) => (
            <FilterChip
              key={r.id}
              active={range === r.id}
              onClick={() => setRange(r.id)}
              label={r.label}
            />
          ))}
        </fieldset>

        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Product line</legend>
          {LINES.map((l) => (
            <FilterChip key={l} active={line === l} onClick={() => setLine(l)} label={l} />
          ))}
        </fieldset>

        <p className="ml-auto font-mono text-[0.6875rem] uppercase tracking-[0.1em] tabular-nums text-ink-muted">
          {periodLabel}
        </p>
      </div>

      {!a.hasData ? (
        <p className="surface p-10 text-center text-ink-muted">
          No orders match these filters. Widen the date range or choose another product line.
        </p>
      ) : (
        <>
          {/* ---- Generated narrative ---- */}
          <div className="surface reveal mb-5 p-5 sm:p-6">
            <h4 className="eyebrow mb-4 flex items-center gap-2 text-accent">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              What the data says
            </h4>
            <div className="space-y-3">
              {summary.map((s) => (
                <p key={s} className="max-w-4xl text-[0.9375rem] leading-relaxed text-ink-secondary">
                  {s}
                </p>
              ))}
            </div>
            <p className="mt-4 border-t border-hairline pt-4 text-[0.8125rem] text-ink-muted">
              Written by the page, not by hand — every sentence and figure above is generated
              from the filtered rows at render time.
            </p>
          </div>

          {/* ---- KPI row ---- */}
          <div className="reveal mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Gross revenue"
              value={a.grossRevenue}
              format={(n) => aud(n)}
              note={`Items ${aud(a.itemRevenue)} + postage ${aud(a.postage)}`}
              emphasis
            />
            <KpiCard
              label="Orders"
              value={a.orderCount}
              format={(n) => count(Math.round(n))}
              note={`${count(a.unitCount)} units · ${(a.unitCount / a.orderCount).toFixed(2)} per order`}
            />
            <KpiCard
              label="Average order"
              value={a.aov}
              format={(n) => aud(n)}
              note={`Median ${aud(a.medianOrderValue)}`}
            />
            <KpiCard
              label="Buyers"
              value={a.buyerCount}
              format={(n) => count(Math.round(n))}
              note={`${a.repeatBuyers} repeat · ${pct(a.repeatOrderSharePct)} of orders`}
            />
            <KpiCard
              label="Countries"
              value={a.countryCount}
              format={(n) => count(Math.round(n))}
              note={`${pct(a.internationalRevenueSharePct)} of revenue is cross-border`}
            />
            <KpiCard
              label="Promoted orders"
              value={a.promotedOrderSharePct}
              format={(n) => pct(n)}
              note="Sold via Promoted Listings"
            />
            <KpiCard
              label="Dispatched"
              value={a.dispatchedPct}
              format={(n) => pct(n)}
              note={
                a.medianHandlingDays !== null
                  ? `Median handling ${a.medianHandlingDays} day${a.medianHandlingDays === 1 ? '' : 's'}`
                  : 'No dispatch dates recorded'
              }
            />
          </div>

          {/* ---- Charts ---- */}
          <div className="reveal grid gap-3 lg:grid-cols-12">
            <ChartCard
              className="lg:col-span-7"
              title="Revenue over time"
              caption="Gross revenue by month, including buyer-paid postage."
              height={280}
              rows={a.byMonth}
              columns={[
                { header: 'Month', cell: (r) => r.label },
                { header: 'Revenue', cell: (r) => aud(r.revenue), numeric: true },
                { header: 'Orders', cell: (r) => r.orders, numeric: true },
                { header: 'Units', cell: (r) => r.units, numeric: true },
              ]}
            >
              <RevenueOverTime data={a.byMonth} />
            </ChartCard>

            <ChartCard
              className="lg:col-span-5"
              title="Orders over time"
              caption="Order count by month — the shape revenue alone hides."
              height={280}
              rows={a.byMonth}
              columns={[
                { header: 'Month', cell: (r) => r.label },
                { header: 'Orders', cell: (r) => r.orders, numeric: true },
                { header: 'Units', cell: (r) => r.units, numeric: true },
              ]}
            >
              <OrdersOverTime data={a.byMonth} />
            </ChartCard>

            <ChartCard
              className="lg:col-span-6"
              title="Revenue by product line"
              caption="Categories assigned from listing titles."
              height={230}
              rows={a.byLine}
              columns={[
                { header: 'Line', cell: (r) => r.line },
                { header: 'Revenue', cell: (r) => aud(r.revenue), numeric: true },
                { header: 'Units', cell: (r) => r.units, numeric: true },
                { header: 'Share', cell: (r) => pct(r.sharePct), numeric: true },
                { header: 'Avg order', cell: (r) => aud(r.aov), numeric: true },
              ]}
            >
              <HorizontalBar data={a.byLine as never} categoryKey="line" labelWidth={110} />
            </ChartCard>

            <ChartCard
              className="lg:col-span-6"
              title="Revenue by price band"
              caption="Bands cut on unit selling price, so a multi-item order spans bands."
              height={230}
              rows={a.byBand}
              columns={[
                { header: 'Band', cell: (r) => r.band },
                { header: 'Revenue', cell: (r) => aud(r.revenue), numeric: true },
                { header: 'Units', cell: (r) => r.units, numeric: true },
                { header: 'Share', cell: (r) => pct(r.sharePct), numeric: true },
              ]}
            >
              <RevenueByBand data={a.byBand} />
            </ChartCard>

            <ChartCard
              className="lg:col-span-7"
              title="Where the units go vs where the money is"
              caption="Both series are shares of the same whole, so they share one axis."
              height={250}
              rows={bandShare}
              columns={[
                { header: 'Band', cell: (r) => r.band },
                { header: 'Revenue share', cell: (r) => pct(r.sharePct), numeric: true },
                { header: 'Unit share', cell: (r) => pct(r.unitSharePct), numeric: true },
              ]}
            >
              <ShareByBand data={bandShare as never} />
            </ChartCard>

            <ChartCard
              className="lg:col-span-5"
              title="Buyer geography"
              caption="Top destinations by revenue; the tail is folded into Other."
              height={250}
              rows={a.byCountry}
              columns={[
                { header: 'Destination', cell: (r) => r.country },
                { header: 'Revenue', cell: (r) => aud(r.revenue), numeric: true },
                { header: 'Orders', cell: (r) => r.orders, numeric: true },
              ]}
            >
              <HorizontalBar data={a.byCountry as never} categoryKey="country" labelWidth={124} />
            </ChartCard>
          </div>

          {/* ---- Top products (a table, because it is a list of names) ---- */}
          <div className="reveal surface mt-3 p-5 sm:p-6">
            <h4 className="font-display text-base font-semibold text-ink">Top products by revenue</h4>
            <p className="mt-1 text-[0.8125rem] text-ink-muted">
              Collapsed by title — the same design is relisted under new item IDs.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-[0.8125rem]">
                <caption className="sr-only">Top selling products by revenue</caption>
                <thead>
                  <tr className="border-b border-hairline">
                    {['#', 'Product', 'Line', 'Units', 'Revenue'].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={cx(
                          'px-2 pb-2.5 font-mono text-[0.6875rem] font-normal uppercase tracking-[0.1em] text-ink-muted',
                          i >= 3 ? 'text-right' : 'text-left',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.topProducts.map((p, i) => (
                    <tr key={p.title} className="border-b border-hairline/60 last:border-0">
                      <td className="px-2 py-2.5 tabular-nums text-ink-muted">{i + 1}</td>
                      <td className="max-w-[26rem] px-2 py-2.5 text-ink">{p.title}</td>
                      <td className="px-2 py-2.5 text-ink-muted">{p.line}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-ink-secondary">{p.units}</td>
                      <td className="px-2 py-2.5 text-right font-medium tabular-nums text-ink">
                        {aud(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---- Fee stack + benchmark ranks: separate sources, separate periods ---- */}
      <div className="reveal mt-3 grid gap-3 lg:grid-cols-2">
        {data.fees && <FeeStackPanel fees={data.fees} />}
        {data.ranks.length > 0 && <RanksPanel ranks={data.ranks} />}
      </div>

      <MethodNote sources={data.sources} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'cursor-pointer rounded-full border px-3 py-1.5 font-mono text-[0.6875rem] uppercase',
        'tracking-[0.1em] transition-colors duration-200 ease-out',
        active
          ? 'border-accent bg-accent text-void'
          : 'border-hairline text-ink-muted hover:border-accent/50 hover:text-ink-secondary',
      )}
    >
      {label}
    </button>
  );
}

function FeeStackPanel({ fees }: { fees: NonNullable<StoreData['fees']> }) {
  const rows = [
    { name: 'Final value fees', value: fees.finalValueFees },
    { name: 'Promoted Listings', value: fees.promotedFees },
    { name: 'International sales fees', value: fees.internationalFees },
    { name: 'Other eBay fees', value: fees.otherFees },
    { name: 'Fee credits recovered', value: -fees.feeCredits },
  ].filter((r) => r.value !== 0);

  return (
    <section className="surface p-5 sm:p-6">
      <h4 className="font-display text-base font-semibold text-ink">What selling actually costs</h4>
      <p className="mt-1 text-[0.8125rem] text-ink-muted">
        Fee-level detail from the Listings Sales Report{fees.periodLabel ? ` · ${fees.periodLabel}` : ''}.
        This export covers its own period and its own listing set, so it is not filtered above.
      </p>

      <table className="mt-5 w-full border-collapse text-[0.875rem]">
        <caption className="sr-only">Cost of selling by fee line</caption>
        <thead>
          <tr className="border-b border-hairline">
            <th scope="col" className="pb-2 text-left font-mono text-[0.6875rem] font-normal uppercase tracking-[0.1em] text-ink-muted">
              Fee line
            </th>
            <th scope="col" className="pb-2 text-right font-mono text-[0.6875rem] font-normal uppercase tracking-[0.1em] text-ink-muted">
              AU $
            </th>
            <th scope="col" className="pb-2 text-right font-mono text-[0.6875rem] font-normal uppercase tracking-[0.1em] text-ink-muted">
              % gross
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-hairline/60">
              <td className="py-2 text-ink-secondary">{r.name}</td>
              <td className="py-2 text-right tabular-nums text-ink-secondary">
                {aud(r.value, { decimals: 2 })}
              </td>
              <td className="py-2 text-right tabular-nums text-ink-muted">
                {((r.value / fees.gross) * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
          <tr>
            <td className="pt-3 font-medium text-ink">Total cost of selling</td>
            <td className="pt-3 text-right font-medium tabular-nums text-ink">
              {aud(fees.totalSellingCosts, { decimals: 2 })}
            </td>
            <td className="pt-3 text-right font-medium tabular-nums text-accent">
              {fees.takeRatePct.toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 border-t border-hairline pt-4 text-[0.8125rem] leading-relaxed text-ink-muted">
        Across {fees.listings} listings and {fees.unitsSold} units on {aud(fees.gross)} of gross.
        Cost of goods is absent from every export and postage labels were bought off-platform,
        so this is contribution after platform costs — not net profit.
      </p>
    </section>
  );
}

function RanksPanel({ ranks }: { ranks: StoreData['ranks'] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h4 className="font-display text-base font-semibold text-ink">Category rank by GMV</h4>
      <p className="mt-1 text-[0.8125rem] text-ink-muted">
        Position against every other Australian seller in the same category and condition.
        From the Listing Quality Report.
      </p>

      <ul className="mt-5 space-y-4">
        {ranks.map((r) => (
          <li key={`${r.category}-${r.condition}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[0.875rem] text-ink">
                {r.category}
                {r.condition && <span className="text-ink-muted"> · {r.condition}</span>}
              </p>
              <p className="font-mono text-[0.75rem] tabular-nums text-ink-secondary">
                {count(r.rank)} of {count(r.sellers)}
              </p>
            </div>
            {/* Bar shows standing, so it is filled from the good end. */}
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(2, 100 - r.percentile)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-[0.6875rem] tabular-nums text-ink-muted">
                top {r.percentile.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MethodNote({ sources }: { sources: string[] }) {
  return (
    <details className="reveal surface mt-3 p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted transition-colors duration-200 hover:text-ink-secondary">
        <Info aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
        Method &amp; sources
      </summary>
      <div className="mt-5 grid gap-6 text-[0.875rem] leading-relaxed text-ink-secondary sm:grid-cols-2">
        <div>
          <h5 className="eyebrow mb-2">Definitions</h5>
          <p>
            Revenue is item price × quantity plus buyer-paid postage, excluding eBay-collected
            tax, which eBay remits and the seller never receives. Multi-item orders are written
            as a summary row plus one row per item; only the item rows are counted, so the
            subtotal is not double-counted. Price bands are cut on unit selling price. With a
            product-line filter active, each order keeps a proportional share of its postage,
            so the parts sum back to the whole.
          </p>
        </div>
        <div>
          <h5 className="eyebrow mb-2">Sources</h5>
          <ul className="space-y-1">
            {sources.map((s) => (
              <li key={s} className="font-mono text-[0.75rem] text-ink-muted">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Parsed at build time on the server. The Orders Report carries buyer names, emails,
            phone numbers and addresses; those columns are read only to count distinct buyers
            and destinations, and none of them reach the browser.
          </p>
        </div>
      </div>
    </details>
  );
}

function EmptyState() {
  return (
    <div className="surface mt-8 border-dashed p-10 text-center">
      <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-status-warning">
        No CSV exports found
      </p>
      <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
        The dashboard renders live figures from eBay Seller Hub exports. Drop the Orders Report,
        Listings Sales Report and Listing Quality Report into{' '}
        <code className="font-mono text-[0.8125rem] text-accent">/data</code> and rebuild.
      </p>
      <p className="mt-3 font-mono text-[0.75rem] text-ink-muted">
        {/* TODO: drop in real CSV — nothing is displayed until then, by design. */}
        No sample numbers are shown, so nothing here can be mistaken for real trading data.
      </p>
    </div>
  );
}
