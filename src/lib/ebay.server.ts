/**
 * Server-only half of the eBay pipeline: filesystem access.
 *
 * Kept apart from `ebay.ts` because that module is imported by the client
 * dashboard. If `node:fs` appeared there, webpack would try to bundle it for the
 * browser — and, worse, the raw CSVs (which contain buyer PII) would be one
 * careless import away from shipping. This file must only ever be imported from
 * a server component.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  parseOrders,
  parseListings,
  parseQualityReport,
  type CategoryRank,
  type LineFact,
  type OrderFact,
  type StoreData,
} from './ebay';

const EMPTY: StoreData = {
  lines: [],
  orders: [],
  fees: null,
  ranks: [],
  sources: [],
  isEmpty: true,
};

const SNAPSHOT = path.join(process.cwd(), 'src', 'content', 'store-snapshot.json');

/**
 * The committed stand-in for the CSVs, written by `npm run build:snapshot`.
 *
 * Deployments never have `/data` — the raw exports are gitignored because of the
 * buyer PII in them. The snapshot holds the same parse output, which carries no
 * personal data (see the script's header), so the hosted dashboard shows the
 * real figures rather than a placeholder. Still never fabricated: if the file is
 * absent or malformed, this returns empty and the placeholder comes back.
 */
function loadSnapshot(): StoreData {
  try {
    const data = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as StoreData;
    return data.orders?.length ? data : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * Reads every CSV in `/data` and routes each by CONTENT, not filename — so
 * renamed or re-dated exports keep working. Never throws.
 *
 * Live CSVs win when present, so dropping a fresh export in and rebuilding shows
 * the new numbers immediately. Otherwise it falls back to the committed
 * snapshot, which is what happens on Vercel. Only when both are missing does the
 * dashboard show its clearly-labelled placeholder instead of fabricated numbers.
 *
 * `allowSnapshot: false` forces the CSV-only path — used by the snapshot builder
 * itself, which must not be able to regenerate its output from its own output.
 */
export function loadStoreData(opts: { allowSnapshot?: boolean } = {}): StoreData {
  const { allowSnapshot = true } = opts;
  const dir = path.join(process.cwd(), 'data');

  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'));
  } catch {
    return allowSnapshot ? loadSnapshot() : EMPTY;
  }

  let lines: LineFact[] = [];
  let orders: OrderFact[] = [];
  let ranks: CategoryRank[] = [];
  const listingTexts: string[] = [];
  const sources: string[] = [];

  for (const file of files) {
    let text: string;
    try {
      text = fs.readFileSync(path.join(dir, file), 'utf8');
    } catch {
      continue;
    }

    if (text.includes('Sales Record Number')) {
      const parsed = parseOrders(text);
      lines = lines.concat(parsed.lines);
      orders = orders.concat(parsed.orders);
      sources.push(`${file} — Orders Report`);
    } else if (text.includes('eBay item ID')) {
      listingTexts.push(text);
      sources.push(`${file} — Listings Sales Report`);
    } else if (/rank by sales \(GMV\)/i.test(text)) {
      ranks = ranks.concat(parseQualityReport(text));
      sources.push(`${file} — Listing Quality Report`);
    }
  }

  // Guard against the same Orders Report being dropped into /data twice.
  const seenOrders = new Set<string>();
  orders = orders.filter((o) => (seenOrders.has(o.orderId) ? false : seenOrders.add(o.orderId)));

  const keep = new Set(orders.map((o) => o.orderId));
  const seenLines = new Set<string>();
  lines = lines.filter((l) => {
    const key = `${l.orderId}::${l.itemId}::${l.unitPrice}::${l.quantity}`;
    if (!keep.has(l.orderId) || seenLines.has(key)) return false;
    seenLines.add(key);
    return true;
  });

  // A `/data` folder holding no usable exports is the same situation as none.
  if (orders.length === 0) return allowSnapshot ? loadSnapshot() : EMPTY;

  return {
    lines,
    orders,
    fees: parseListings(listingTexts),
    ranks,
    sources,
    isEmpty: false,
  };
}
