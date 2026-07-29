/**
 * ============================================================================
 *  eBay Seller Hub export → normalised facts → aggregates
 * ============================================================================
 *
 *  PRIVACY (important, please read before changing where this runs)
 *  ---------------------------------------------------------------
 *  The Orders Report contains buyer names, email addresses, phone numbers and
 *  full street addresses for every buyer. This module therefore runs ONLY on the
 *  server, at build time, and the raw CSVs live in `/data` — deliberately NOT in
 *  `/public`, so they are never served.
 *
 *  What crosses to the browser is `StoreData`: anonymised per-line and per-order
 *  facts (amounts, dates, destination country, product titles) plus opaque buyer
 *  refs like "b017" used only to count repeat purchases. No name, email, phone,
 *  address, postcode or tracking number is ever emitted.
 *
 *  ARCHITECTURE
 *  ------------
 *  `loadStoreData()`  — server only. Reads /data, normalises, returns facts.
 *  `aggregate()`      — pure, isomorphic. Facts + filters → every metric shown.
 *                       The dashboard re-runs this in the browser on filter change,
 *                       which is why the filters are real rather than decorative.
 *
 *  Nothing here is hardcoded from the source documents: swap the CSVs, rebuild,
 *  and every number on the site changes with them. Metrics whose source columns
 *  are absent are omitted (left `null`) rather than throwing or guessed.
 */

import Papa from 'papaparse';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProductLine = 'LEGO' | 'PC hardware' | 'PC peripherals' | 'Other';

export const PRICE_BANDS = [
  'Under $20',
  '$20–50',
  '$50–100',
  '$100–150',
  '$150–250',
  'Over $250',
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

/** One sold line item. Product titles are catalogue data, not personal data. */
export interface LineFact {
  orderId: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  itemId: string;
  unitPrice: number;
  quantity: number;
  itemRevenue: number;
  priceBand: PriceBand;
  line: ProductLine;
  promoted: boolean;
}

/** One order. `buyerRef` is an opaque counter, not a username. */
export interface OrderFact {
  orderId: string;
  date: string;
  itemRevenue: number;
  postage: number;
  revenue: number;
  units: number;
  country: string;
  /** False when the export recorded no destination — see `countryKnown`. */
  international: boolean;
  /**
   * Some orders (local pickup, off-platform) carry no address block at all.
   * They must not be silently bucketed as "international" just because the
   * destination isn't "Australia", so they are flagged and excluded from the
   * domestic/international split rather than dropped.
   */
  countryKnown: boolean;
  dispatched: boolean;
  handlingDays: number | null;
  buyerRef: string;
  promoted: boolean;
}

export const UNKNOWN_COUNTRY = 'Not specified';

/** Fee-level totals from the Listings Sales Report (its own reporting period). */
export interface FeeStack {
  periodLabel: string | null;
  gross: number;
  finalValueFees: number;
  promotedFees: number;
  internationalFees: number;
  otherFees: number;
  feeCredits: number;
  totalSellingCosts: number;
  takeRatePct: number;
  listings: number;
  unitsSold: number;
}

/** Category benchmark ranks from the Listing Quality Report. */
export interface CategoryRank {
  category: string;
  condition: string | null;
  rank: number;
  sellers: number;
  percentile: number;
}

export interface StoreData {
  lines: LineFact[];
  orders: OrderFact[];
  fees: FeeStack | null;
  ranks: CategoryRank[];
  sources: string[];
  /** True when no CSVs were found and the shapes below are empty. */
  isEmpty: boolean;
}

export interface Filters {
  from?: string | null;
  to?: string | null;
  line?: ProductLine | 'All';
}

/* ------------------------------------------------------------------ */
/* Parsing primitives                                                  */
/* ------------------------------------------------------------------ */

const stripBom = (s: string) => s.replace(/^﻿/, '');

/** eBay writes currency as `AU $1,234.56`; parenthesised values are credits. */
export function money(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const negative = raw.startsWith('(') || raw.startsWith('-');
  const cleaned = raw.replace(/AU\s*\$/gi, '').replace(/[$,()\s]/g, '').replace(/^-/, '');
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

export function num(value: unknown, fallback = 0): number {
  const n = Number.parseFloat(String(value ?? '').replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Tolerant date parse: `25-Jul-26`, `25-Jul-2026`, or anything Date understands. */
export function parseDate(value: unknown): Date | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month === undefined) return null;
    let year = Number.parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, month, Number.parseInt(m[1], 10)));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const toISO = (d: Date) => d.toISOString().slice(0, 10);

/**
 * eBay prefixes its exports with disclaimer blocks of varying length, so the
 * header row is found by content rather than a hardcoded skip count.
 */
function sliceFromHeader(text: string, marker: string): string | null {
  const lines = stripBom(text).split(/\r?\n/);
  const idx = lines.findIndex((l) => l.toLowerCase().includes(marker.toLowerCase()));
  return idx === -1 ? null : lines.slice(idx).join('\n');
}

/** Normalise a header for fuzzy matching: lowercase, alphanumerics only. */
const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

type Row = Record<string, string>;

/** Fuzzy column read — tolerates eBay renaming/reordering columns between exports. */
function field(row: Row, ...candidates: string[]): string {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const target = normKey(cand);
    const exact = keys.find((k) => normKey(k) === target);
    if (exact) return row[exact] ?? '';
  }
  for (const cand of candidates) {
    const target = normKey(cand);
    const partial = keys.find((k) => normKey(k).includes(target));
    if (partial) return row[partial] ?? '';
  }
  return '';
}

const has = (row: Row, ...candidates: string[]) => field(row, ...candidates) !== '';

/* ------------------------------------------------------------------ */
/* Classification                                                      */
/* ------------------------------------------------------------------ */

const HARDWARE = [
  'ryzen', 'rtx', ' ram', 'ssd', 'cpu', 'gigabyte', 'predator', 'ddr', 'motherboard',
  'asus', 'corsair', 'cooler', 'gaming pc', 'micro gaming', 'graphics card',
  'power supply', 'thermaltake', 'geforce', 'msi ', 'atx',
];
const PERIPHERALS = ['fan', 'lian li', 'keyboard', 'monitor', 'router', 'mouse', 'cable', 'logitech'];

/** Assign a product line from the listing title. Deliberately simple and inspectable. */
export function classifyLine(title: string): ProductLine {
  const t = ` ${String(title).toLowerCase()} `;
  if (t.includes('lego')) return 'LEGO';
  if (HARDWARE.some((k) => t.includes(k))) return 'PC hardware';
  if (PERIPHERALS.some((k) => t.includes(k))) return 'PC peripherals';
  return 'Other';
}

/** Bands are cut on unit selling price, so a multi-item order can span bands. */
export function priceBandOf(unitPrice: number): PriceBand {
  if (unitPrice < 20) return 'Under $20';
  if (unitPrice < 50) return '$20–50';
  if (unitPrice < 100) return '$50–100';
  if (unitPrice < 150) return '$100–150';
  if (unitPrice < 250) return '$150–250';
  return 'Over $250';
}

/* ------------------------------------------------------------------ */
/* Orders Report                                                       */
/* ------------------------------------------------------------------ */

/**
 * Multi-item orders are written as a PARENT row carrying order-level totals
 * (postage, order total, destination) with an EMPTY Item Number, followed by
 * one CHILD row per line item with its own Item Number and a blank postage.
 *
 * Line items are therefore the rows that HAVE an item number; order postage is
 * summed across the whole group. Treating every row as a line item — which is
 * the obvious reading — double-counts multi-item orders, because the parent row
 * repeats the order subtotal alongside its own children.
 */
export function parseOrders(text: string): { lines: LineFact[]; orders: OrderFact[] } {
  const sliced = sliceFromHeader(text, 'Sales Record Number');
  if (!sliced) return { lines: [], orders: [] };

  const parsed = Papa.parse<Row>(sliced, { header: true, skipEmptyLines: 'greedy' });
  const rows = (parsed.data || []).filter((r) => /^\d+$/.test(field(r, 'Sales Record Number').trim()));

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = field(row, 'Sales Record Number').trim();
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  const lines: LineFact[] = [];
  const orders: OrderFact[] = [];
  const buyerRefs = new Map<string, string>();

  for (const [orderId, group] of groups) {
    const itemRows = group.filter((r) => has(r, 'Item Number'));
    if (itemRows.length === 0) continue;

    // The parent row holds the destination and dates; fall back to any row.
    const pick = (...names: string[]) => {
      for (const r of group) {
        const v = field(r, ...names).trim();
        if (v && v !== '--') return v;
      }
      return '';
    };

    const saleDate = parseDate(pick('Sale Date'));
    if (!saleDate) continue;
    const date = toISO(saleDate);

    let itemRevenue = 0;
    let units = 0;
    let anyPromoted = false;

    for (const r of itemRows) {
      const quantity = Math.max(1, num(field(r, 'Quantity'), 1));
      const unitPrice = money(field(r, 'Sold For'));
      const promoted = /^yes$/i.test(field(r, 'Sold Via Promoted Listings').trim());
      const title = field(r, 'Item Title').trim();
      const revenue = unitPrice * quantity;

      itemRevenue += revenue;
      units += quantity;
      anyPromoted ||= promoted;

      lines.push({
        orderId,
        date,
        title,
        itemId: field(r, 'Item Number').trim(),
        unitPrice,
        quantity,
        itemRevenue: revenue,
        priceBand: priceBandOf(unitPrice),
        line: classifyLine(title),
        promoted,
      });
    }

    // Postage sits on the parent row for multi-item orders, on the only row otherwise.
    const postage = group.reduce((sum, r) => sum + money(field(r, 'Postage And Handling')), 0);

    const rawCountry = pick('Post To Country', 'Buyer Country');
    const countryKnown = rawCountry !== '';
    const country = countryKnown ? rawCountry : UNKNOWN_COUNTRY;
    const postedOn = parseDate(pick('Posted On Date'));
    const paidOn = parseDate(pick('Paid On Date'));
    const handlingDays =
      postedOn && paidOn ? Math.round((postedOn.getTime() - paidOn.getTime()) / 86_400_000) : null;

    // Buyer usernames never leave this function — only an opaque counter does.
    const username = pick('Buyer Username');
    let buyerRef = buyerRefs.get(username);
    if (!buyerRef) {
      buyerRef = `b${String(buyerRefs.size + 1).padStart(3, '0')}`;
      buyerRefs.set(username, buyerRef);
    }

    orders.push({
      orderId,
      date,
      itemRevenue,
      postage,
      revenue: itemRevenue + postage,
      units,
      country,
      international: countryKnown && rawCountry.toLowerCase() !== 'australia',
      countryKnown,
      dispatched: Boolean(postedOn),
      handlingDays: handlingDays !== null && handlingDays >= 0 ? handlingDays : null,
      buyerRef,
      promoted: anyPromoted,
    });
  }

  lines.sort((a, b) => a.date.localeCompare(b.date));
  orders.sort((a, b) => a.date.localeCompare(b.date));
  return { lines, orders };
}

/* ------------------------------------------------------------------ */
/* Listings Sales Report (fee level)                                   */
/* ------------------------------------------------------------------ */

/**
 * Multiple Listings Sales Reports may cover the same period with different column
 * sets (e.g. one with store-category columns, one without). Rows are deduped by
 * eBay item ID so overlapping exports do not double-count fees.
 */
export function parseListings(texts: string[]): FeeStack | null {
  const seen = new Map<string, Row>();
  let periodLabel: string | null = null;

  for (const text of texts) {
    const clean = stripBom(text);
    const period = clean.match(/Report for\s+(.+)/i);
    if (period && !periodLabel) periodLabel = period[1].trim().replace(/,+$/, '');

    const sliced = sliceFromHeader(clean, 'eBay item ID');
    if (!sliced) continue;

    const parsed = Papa.parse<Row>(sliced, { header: true, skipEmptyLines: 'greedy' });
    for (const row of parsed.data || []) {
      const id = field(row, 'eBay item ID').trim();
      if (!/^\d+$/.test(id)) continue;
      // Prefer the richer export when the same listing appears twice.
      const existing = seen.get(id);
      if (!existing || Object.keys(row).length > Object.keys(existing).length) seen.set(id, row);
    }
  }

  if (seen.size === 0) return null;

  const rows = [...seen.values()];
  const sum = (...names: string[]) => rows.reduce((t, r) => t + money(field(r, ...names)), 0);

  const gross = sum('Total sales (includes taxes)');
  if (gross <= 0) return null;

  const finalValueFees = sum('Final value fees');
  const promotedFees =
    sum('Promoted Listings - General fees') + sum('Promoted Listings - Priority fees');
  const internationalFees = sum('International sales fees');
  const otherFees =
    sum('Insertion fees') +
    sum('Optional listing upgrade fees') +
    sum('Ads Express fees') +
    sum('Promoted Offsite - Fees') +
    sum('Other eBay fees') +
    sum('Deposit processing fees');
  // Credits are a credit: they reduce the cost of selling.
  const feeCredits = sum('Fee credits');
  const totalSellingCosts =
    finalValueFees + promotedFees + internationalFees + otherFees - feeCredits;

  return {
    periodLabel,
    gross,
    finalValueFees,
    promotedFees,
    internationalFees,
    otherFees,
    feeCredits,
    totalSellingCosts,
    takeRatePct: (totalSellingCosts / gross) * 100,
    listings: rows.length,
    unitsSold: rows.reduce((t, r) => t + num(field(r, 'Quantity sold')), 0),
  };
}

/* ------------------------------------------------------------------ */
/* Listing Quality Report (benchmarks)                                 */
/* ------------------------------------------------------------------ */

export function parseQualityReport(text: string): CategoryRank[] {
  const parsed = Papa.parse<string[]>(stripBom(text), { header: false, skipEmptyLines: 'greedy' });
  const out: CategoryRank[] = [];

  for (const row of parsed.data || []) {
    if (!Array.isArray(row)) continue;
    const joined = row.join(' | ');
    const m = joined.match(/rank by sales \(GMV\) value:\s*([\d,]+)\s*out of\s*([\d,]+)\s*sellers/i);
    if (!m) continue;

    const rank = num(m[1]);
    const sellers = num(m[2]);
    if (!rank || !sellers) continue;

    // The category label sits in an earlier cell of the same row.
    const labelCell = row.find((c) => typeof c === 'string' && c.includes('/') && /condition/i.test(c));
    let category = (labelCell || '').split('/')[0].trim();
    let condition: string | null = null;
    if (labelCell) {
      const cond = labelCell.match(/Item condition:\s*([A-Za-z]+)/i);
      condition = cond ? cond[1] : null;
    }
    category = category.replace(/\s*\(R\)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (!category) continue;

    out.push({ category, condition, rank, sellers, percentile: (rank / sellers) * 100 });
  }

  return out.sort((a, b) => a.percentile - b.percentile);
}

/* ------------------------------------------------------------------ */
/* Aggregation — pure, runs on server and in the browser               */
/* ------------------------------------------------------------------ */

export interface Aggregates {
  hasData: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  grossRevenue: number;
  itemRevenue: number;
  postage: number;
  orderCount: number;
  unitCount: number;
  aov: number;
  medianOrderValue: number;
  buyerCount: number;
  countryCount: number;
  repeatBuyers: number;
  repeatOrderSharePct: number;
  repeatRevenueSharePct: number;
  promotedOrderSharePct: number;
  dispatchedPct: number;
  medianHandlingDays: number | null;
  internationalRevenueSharePct: number;
  byMonth: { month: string; label: string; revenue: number; orders: number; units: number }[];
  byLine: { line: ProductLine; revenue: number; units: number; orders: number; sharePct: number; aov: number }[];
  byBand: { band: PriceBand; revenue: number; units: number; sharePct: number }[];
  byCountry: { country: string; revenue: number; orders: number }[];
  market: { market: 'Domestic' | 'International'; revenue: number; orders: number; units: number; aov: number }[];
  topProducts: { title: string; units: number; revenue: number; line: ProductLine }[];
  bestMonth: { label: string; revenue: number } | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Month names are spelled out rather than delegated to `toLocaleString`, whose
 * abbreviations vary by ICU build (en-AU renders June as "June", not "Jun"),
 * which would make axis labels differ between the build machine and the browser.
 */
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  return `${MONTH_ABBR[Number(m) - 1]} ${y}`;
};

/** Deterministic `29 Jan 2026`, for the same reason. */
export const formatDay = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTH_ABBR[Number(m) - 1]} ${y}`;
};

/**
 * Applies the filter row, then derives every metric the dashboard renders.
 *
 * When a product-line filter is active, order-level revenue keeps a *proportional
 * share* of that order's postage (matched line revenue ÷ order item revenue), so
 * the parts still sum back to the whole when the filter is cleared.
 */
export function aggregate(data: StoreData, filters: Filters = {}): Aggregates {
  const { from, to, line: lineFilter = 'All' } = filters;

  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to);

  const lines = data.lines.filter((l) => inRange(l.date) && (lineFilter === 'All' || l.line === lineFilter));
  const lineRevenueByOrder = new Map<string, number>();
  for (const l of lines) {
    lineRevenueByOrder.set(l.orderId, (lineRevenueByOrder.get(l.orderId) ?? 0) + l.itemRevenue);
  }

  const orders = data.orders
    .filter((o) => inRange(o.date) && lineRevenueByOrder.has(o.orderId))
    .map((o) => {
      const matched = lineRevenueByOrder.get(o.orderId) ?? 0;
      const ratio = o.itemRevenue > 0 ? matched / o.itemRevenue : 1;
      const postage = o.postage * ratio;
      return { ...o, itemRevenue: matched, postage, revenue: matched + postage };
    });

  const empty: Aggregates = {
    hasData: false, periodStart: null, periodEnd: null, grossRevenue: 0, itemRevenue: 0,
    postage: 0, orderCount: 0, unitCount: 0, aov: 0, medianOrderValue: 0, buyerCount: 0,
    countryCount: 0, repeatBuyers: 0, repeatOrderSharePct: 0, repeatRevenueSharePct: 0,
    promotedOrderSharePct: 0, dispatchedPct: 0, medianHandlingDays: null,
    internationalRevenueSharePct: 0, byMonth: [], byLine: [], byBand: [], byCountry: [],
    market: [], topProducts: [], bestMonth: null,
  };
  if (orders.length === 0) return empty;

  const grossRevenue = orders.reduce((t, o) => t + o.revenue, 0);
  const itemRevenue = orders.reduce((t, o) => t + o.itemRevenue, 0);
  const postage = orders.reduce((t, o) => t + o.postage, 0);
  const unitCount = lines.reduce((t, l) => t + l.quantity, 0);
  const dates = orders.map((o) => o.date).sort();

  /* Buyers & repeat behaviour */
  const byBuyer = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    const b = byBuyer.get(o.buyerRef) ?? { orders: 0, revenue: 0 };
    b.orders += 1;
    b.revenue += o.revenue;
    byBuyer.set(o.buyerRef, b);
  }
  const repeats = [...byBuyer.values()].filter((b) => b.orders > 1);

  /* Time series */
  const monthMap = new Map<string, { revenue: number; orders: number; units: number }>();
  for (const o of orders) {
    const key = o.date.slice(0, 7);
    const m = monthMap.get(key) ?? { revenue: 0, orders: 0, units: 0 };
    m.revenue += o.revenue;
    m.orders += 1;
    m.units += o.units;
    monthMap.set(key, m);
  }
  const byMonth = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, label: monthLabel(month), revenue: round2(v.revenue), orders: v.orders, units: v.units }));

  /* Product lines — order counts attribute an order to each line it contains */
  const lineMap = new Map<ProductLine, { revenue: number; units: number; orders: Set<string> }>();
  for (const l of lines) {
    const e = lineMap.get(l.line) ?? { revenue: 0, units: 0, orders: new Set<string>() };
    e.revenue += l.itemRevenue;
    e.units += l.quantity;
    e.orders.add(l.orderId);
    lineMap.set(l.line, e);
  }
  const lineTotal = [...lineMap.values()].reduce((t, v) => t + v.revenue, 0) || 1;
  const byLine = [...lineMap.entries()]
    .map(([name, v]) => ({
      line: name,
      revenue: round2(v.revenue),
      units: v.units,
      orders: v.orders.size,
      sharePct: round2((v.revenue / lineTotal) * 100),
      aov: round2(v.revenue / v.orders.size),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  /* Price bands — ordered, so they keep the ordinal ramp */
  const bandMap = new Map<PriceBand, { revenue: number; units: number }>();
  for (const l of lines) {
    const e = bandMap.get(l.priceBand) ?? { revenue: 0, units: 0 };
    e.revenue += l.itemRevenue;
    e.units += l.quantity;
    bandMap.set(l.priceBand, e);
  }
  const bandTotal = [...bandMap.values()].reduce((t, v) => t + v.revenue, 0) || 1;
  const byBand = PRICE_BANDS.filter((b) => bandMap.has(b)).map((band) => {
    const v = bandMap.get(band)!;
    return { band, revenue: round2(v.revenue), units: v.units, sharePct: round2((v.revenue / bandTotal) * 100) };
  });

  /* Geography */
  const countryMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const e = countryMap.get(o.country) ?? { revenue: 0, orders: 0 };
    e.revenue += o.revenue;
    e.orders += 1;
    countryMap.set(o.country, e);
  }
  const sortedCountries = [...countryMap.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  const TOP_N = 8;
  const byCountry = sortedCountries.slice(0, TOP_N).map(([country, v]) => ({
    country, revenue: round2(v.revenue), orders: v.orders,
  }));
  if (sortedCountries.length > TOP_N) {
    const rest = sortedCountries.slice(TOP_N);
    byCountry.push({
      country: `Other (${rest.length})`,
      revenue: round2(rest.reduce((t, [, v]) => t + v.revenue, 0)),
      orders: rest.reduce((t, [, v]) => t + v.orders, 0),
    });
  }

  /* Domestic vs international — orders with no recorded destination sit out */
  const placed = orders.filter((o) => o.countryKnown);
  const market = (['Domestic', 'International'] as const)
    .map((m) => {
      const set = placed.filter((o) => (m === 'International') === o.international);
      const revenue = set.reduce((t, o) => t + o.revenue, 0);
      return {
        market: m,
        revenue: round2(revenue),
        orders: set.length,
        units: set.reduce((t, o) => t + o.units, 0),
        aov: set.length ? round2(revenue / set.length) : 0,
      };
    })
    .filter((m) => m.orders > 0);

  /* Top products, collapsed by title (the same design is relisted under new IDs) */
  const productMap = new Map<string, { units: number; revenue: number; line: ProductLine }>();
  for (const l of lines) {
    const key = l.title || `Item ${l.itemId}`;
    const e = productMap.get(key) ?? { units: 0, revenue: 0, line: l.line };
    e.units += l.quantity;
    e.revenue += l.itemRevenue;
    productMap.set(key, e);
  }
  const topProducts = [...productMap.entries()]
    .map(([title, v]) => ({ title, units: v.units, revenue: round2(v.revenue), line: v.line }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const handling = orders.map((o) => o.handlingDays).filter((d): d is number => d !== null);
  // Share is taken against orders with a known destination, so unplaced orders
  // neither inflate nor dilute it.
  const placedRevenue = placed.reduce((t, o) => t + o.revenue, 0) || 1;
  const internationalRevenue = placed.filter((o) => o.international).reduce((t, o) => t + o.revenue, 0);
  const bestMonth = byMonth.length
    ? byMonth.reduce((best, m) => (m.revenue > best.revenue ? m : best))
    : null;

  return {
    hasData: true,
    periodStart: dates[0] ?? null,
    periodEnd: dates[dates.length - 1] ?? null,
    grossRevenue: round2(grossRevenue),
    itemRevenue: round2(itemRevenue),
    postage: round2(postage),
    orderCount: orders.length,
    unitCount,
    aov: round2(grossRevenue / orders.length),
    medianOrderValue: round2(median(orders.map((o) => o.revenue))),
    buyerCount: byBuyer.size,
    countryCount: [...countryMap.keys()].filter((c) => c !== UNKNOWN_COUNTRY).length,
    repeatBuyers: repeats.length,
    repeatOrderSharePct: round2((repeats.reduce((t, b) => t + b.orders, 0) / orders.length) * 100),
    repeatRevenueSharePct: round2((repeats.reduce((t, b) => t + b.revenue, 0) / grossRevenue) * 100),
    promotedOrderSharePct: round2((orders.filter((o) => o.promoted).length / orders.length) * 100),
    dispatchedPct: round2((orders.filter((o) => o.dispatched).length / orders.length) * 100),
    medianHandlingDays: handling.length ? median(handling) : null,
    internationalRevenueSharePct: round2((internationalRevenue / placedRevenue) * 100),
    byMonth,
    byLine,
    byBand,
    byCountry,
    market,
    topProducts,
    bestMonth: bestMonth ? { label: bestMonth.label, revenue: bestMonth.revenue } : null,
  };
}

/* ------------------------------------------------------------------ */
/* Narrative — generated from the aggregates, never hand-written       */
/* ------------------------------------------------------------------ */

const aud = (n: number) =>
  `A$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function buildSummary(a: Aggregates, fees: FeeStack | null): string[] {
  if (!a.hasData) return [];
  const out: string[] = [];
  const period =
    a.periodStart && a.periodEnd
      ? `${formatDay(a.periodStart)} – ${formatDay(a.periodEnd)}`
      : 'the selected period';

  out.push(
    `Across ${period} the store took ${aud(a.grossRevenue)} from ${a.orderCount} orders and ${a.unitCount} units, at an average order of ${aud(a.aov)} against a median of ${aud(a.medianOrderValue)} — a gap that says a handful of large orders carry the average.`,
  );

  const top = a.byLine[0];
  if (top && a.byLine.length > 1) {
    const best = [...a.byLine].sort((x, y) => y.aov - x.aov)[0];
    out.push(
      `${top.line} is the largest line at ${top.sharePct}% of revenue from ${top.units} units, but ${best.line} turns over the most per order at ${aud(best.aov)} — ${(best.aov / (top.aov || 1)).toFixed(1)}× ${top.line}'s ${aud(top.aov)}.`,
    );
  }

  if (a.bestMonth && a.byMonth.length > 1) {
    const worst = a.byMonth.reduce((w, m) => (m.revenue < w.revenue ? m : w));
    out.push(
      `Demand is lumpy: ${a.bestMonth.label} was the strongest month at ${aud(a.bestMonth.revenue)} against ${worst.label}'s ${aud(worst.revenue)}, a ${(a.bestMonth.revenue / Math.max(worst.revenue, 1)).toFixed(1)}× spread across ${a.byMonth.length} months.`,
    );
  }

  if (a.countryCount > 1) {
    out.push(
      `${a.countryCount} destination countries account for ${a.internationalRevenueSharePct}% of revenue, and ${a.repeatBuyers} of ${a.buyerCount} buyers ordered more than once — ${a.repeatOrderSharePct}% of all orders.`,
    );
  }

  if (fees) {
    out.push(
      `Fee-level exports put the fully-loaded cost of selling at ${fees.takeRatePct.toFixed(2)}% of gross across ${fees.listings} listings, of which ${((fees.promotedFees / fees.gross) * 100).toFixed(2)} points is advertising — invisible unless the fee columns are rebuilt line by line.`,
    );
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Note                                                                */
/* ------------------------------------------------------------------ */

/**
 * The filesystem loader deliberately lives in `ebay.server.ts`, not here.
 *
 * This module is imported by the client `Dashboard` (it needs `aggregate` to
 * re-run on filter changes), so anything touching `node:fs` in this file would
 * be pulled into the browser bundle and break the build. Keeping the split means
 * the boundary is enforced by the module graph rather than by remembering.
 */
