/**
 * Freeze the parsed CSVs into a committable snapshot.
 *   npm run build:snapshot
 *
 * The raw Seller Hub exports can never be committed — they carry buyer names,
 * emails, phones and addresses. But the *parsed* shapes deliberately carry none
 * of that: `LineFact` is catalogue data, and `OrderFact` identifies a buyer only
 * by `buyerRef`, an opaque `b001` counter whose username is discarded during
 * parsing. So the parse output is safe to publish even though its input is not.
 *
 * That gap is what this script exploits. It runs locally, where the CSVs exist,
 * and writes the result to `src/content/store-snapshot.json`, which IS committed.
 * The deployed build then reads real figures without the CSVs ever leaving the
 * machine.
 *
 * Re-run it whenever new exports are dropped into `/data`, then commit the JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadStoreData } from '../src/lib/ebay.server';
import type { StoreData } from '../src/lib/ebay';

const OUT = path.join(process.cwd(), 'src', 'content', 'store-snapshot.json');

const data = loadStoreData({ allowSnapshot: false });

if (data.isEmpty) {
  console.error(
    'No CSVs found in /data — refusing to write an empty snapshot.\n' +
      'Drop the Seller Hub exports in and try again.',
  );
  process.exit(1);
}

/**
 * Belt-and-braces: the parser is trusted to drop PII, but this snapshot is
 * headed for a public repo, so verify rather than assume.
 *
 * Three separate guards, because each catches what the others miss:
 *
 *  1. A schema allowlist. The strongest of the three — it fails on any field the
 *     parser did not previously emit. If someone later adds `buyerName` to
 *     `OrderFact`, this aborts rather than quietly publishing it. Pattern
 *     matching cannot catch a leak it has no pattern for; this can.
 *  2. An email scan over everything. Unambiguous enough to run globally.
 *  3. Phone and street-address scans over free-text fields only. Running these
 *     globally produced false positives — ISO dates (`2026-01-29`) and 12-digit
 *     eBay item IDs both look like phone numbers to a loose regex — so they are
 *     aimed at the fields where prose can actually appear.
 */
const leaks: string[] = [];

const LINE_KEYS = ['orderId', 'date', 'title', 'itemId', 'unitPrice', 'quantity', 'itemRevenue', 'priceBand', 'line', 'promoted'];
const ORDER_KEYS = ['orderId', 'date', 'itemRevenue', 'postage', 'revenue', 'units', 'country', 'international', 'countryKnown', 'dispatched', 'handlingDays', 'buyerRef', 'promoted'];

const checkKeys = (label: string, rows: object[], allowed: string[]) => {
  const seen = new Set(rows.flatMap((r) => Object.keys(r)));
  const unexpected = [...seen].filter((k) => !allowed.includes(k));
  if (unexpected.length) leaks.push(`unexpected ${label} field(s): ${unexpected.join(', ')}`);
};

checkKeys('line item', data.lines, LINE_KEYS);
checkKeys('order', data.orders, ORDER_KEYS);

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const emails = JSON.stringify(data).match(EMAIL);
if (emails) leaks.push(`email address: ${[...new Set(emails)].slice(0, 3).join(', ')}`);

/** Only these carry prose; everything else is a number, a date or an enum. */
const freeText = [
  ...data.lines.map((l) => l.title),
  ...data.orders.map((o) => o.country),
  ...data.ranks.flatMap((r) => [r.category, r.condition ?? '']),
  data.fees?.periodLabel ?? '',
  ...data.sources,
].join('\n');

const PHONE = /\+\d[\d ()-]{7,}\d|\b0[45]\d{2}[ -]?\d{3}[ -]?\d{3}\b/g;
const STREET = /\b\d+[A-Za-z]?\s+[A-Z][a-z]+\s+(St|Street|Rd|Road|Ave|Avenue|Dr|Drive|Ln|Lane|Ct|Court|Pl|Place|Hwy|Highway)\b/g;

for (const [label, re] of [
  ['phone number', PHONE],
  ['street address', STREET],
] as const) {
  const hits = freeText.match(re);
  if (hits) leaks.push(`${label}: ${[...new Set(hits)].slice(0, 3).join(', ')}`);
}

// Every buyer reference must be the opaque counter form, never a username.
const badRefs = data.orders.filter((o) => !/^b\d{3,}$/.test(o.buyerRef));
if (badRefs.length) leaks.push(`non-opaque buyerRef: ${badRefs[0].buyerRef}`);

if (leaks.length) {
  console.error('ABORTED — snapshot appears to contain personal data:');
  leaks.forEach((l) => console.error('  ' + l));
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
const snapshot: StoreData = data;
console.log(`Wrote ${path.relative(process.cwd(), OUT)}  (${kb} kB)`);
console.log(`  ${snapshot.orders.length} orders, ${snapshot.lines.length} line items`);
console.log(`  sources: ${snapshot.sources.length}`);
console.log('  PII scan: clean (no emails, phones, addresses, or usernames)');
