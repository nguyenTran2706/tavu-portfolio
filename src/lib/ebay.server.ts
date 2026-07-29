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

/**
 * Reads every CSV in `/data` and routes each by CONTENT, not filename — so
 * renamed or re-dated exports keep working. Returns empty shapes (never throws)
 * when the folder is missing, so the site still builds and the dashboard shows
 * its clearly-labelled placeholder state instead of fabricated numbers.
 */
export function loadStoreData(): StoreData {
  const dir = path.join(process.cwd(), 'data');

  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'));
  } catch {
    return EMPTY;
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

  return {
    lines,
    orders,
    fees: parseListings(listingTexts),
    ranks,
    sources,
    isEmpty: orders.length === 0,
  };
}
