/**
 * Sanity-check the CSV pipeline without booting Next.
 *   npm run verify:data
 *
 * Prints the headline aggregates plus two internal consistency checks that catch
 * the classic multi-item-order double-count.
 */
import { aggregate, buildSummary } from '../src/lib/ebay';
import { loadStoreData } from '../src/lib/ebay.server';

const data = loadStoreData();

console.log('SOURCES');
data.sources.forEach((s) => console.log('  ' + s));
console.log(`\n  line items: ${data.lines.length}   orders: ${data.orders.length}\n`);

const a = aggregate(data);
const f = (n: number) => 'A$' + n.toLocaleString('en-AU', { maximumFractionDigits: 2 });

console.log('HEADLINE');
console.log(`  Period                ${a.periodStart} → ${a.periodEnd}`);
console.log(`  Gross revenue         ${f(a.grossRevenue)}  (items ${f(a.itemRevenue)} + postage ${f(a.postage)})`);
console.log(`  Orders / units        ${a.orderCount} / ${a.unitCount}`);
console.log(`  AOV / median          ${f(a.aov)} / ${f(a.medianOrderValue)}`);
console.log(`  Buyers / countries    ${a.buyerCount} / ${a.countryCount}`);
console.log(`  Repeat buyers         ${a.repeatBuyers} (${a.repeatOrderSharePct}% of orders, ${a.repeatRevenueSharePct}% of revenue)`);
console.log(`  International revenue ${a.internationalRevenueSharePct}%`);
console.log(`  Dispatched            ${a.dispatchedPct}%   median handling ${a.medianHandlingDays}d`);

console.log('\nBY PRODUCT LINE');
a.byLine.forEach((l) =>
  console.log(`  ${l.line.padEnd(16)} ${f(l.revenue).padStart(12)}  ${String(l.units).padStart(4)}u  ${String(l.orders).padStart(3)}o  ${String(l.sharePct).padStart(5)}%  AOV ${f(l.aov)}`),
);

console.log('\nBY PRICE BAND');
a.byBand.forEach((b) =>
  console.log(`  ${b.band.padEnd(12)} ${f(b.revenue).padStart(12)}  ${String(b.units).padStart(4)}u  ${String(b.sharePct).padStart(5)}%`),
);

console.log('\nBY MONTH');
a.byMonth.forEach((m) => console.log(`  ${m.label.padEnd(10)} ${f(m.revenue).padStart(12)}  ${String(m.orders).padStart(3)} orders`));

console.log('\nTOP COUNTRIES');
a.byCountry.slice(0, 6).forEach((c) => console.log(`  ${c.country.padEnd(20)} ${f(c.revenue).padStart(12)}  ${c.orders} orders`));

if (data.fees) {
  const x = data.fees;
  console.log('\nFEE STACK  (' + x.periodLabel + ')');
  console.log(`  Gross                 ${f(x.gross)}   listings ${x.listings}, units ${x.unitsSold}`);
  console.log(`  Final value fees      ${f(x.finalValueFees)}`);
  console.log(`  Promoted Listings     ${f(x.promotedFees)}`);
  console.log(`  International fees    ${f(x.internationalFees)}`);
  console.log(`  Fee credits           -${f(x.feeCredits)}`);
  console.log(`  Total cost of selling ${f(x.totalSellingCosts)}  = ${x.takeRatePct.toFixed(2)}% take rate`);
}

console.log('\nCATEGORY RANKS');
data.ranks.forEach((r) => console.log(`  ${r.category} (${r.condition}) — ${r.rank} of ${r.sellers}  top ${r.percentile.toFixed(1)}%`));

console.log('\nAUTO SUMMARY');
buildSummary(a, data.fees).forEach((s) => console.log('  • ' + s + '\n'));

/* ---- consistency checks ---- */
console.log('CHECKS');
const lineSum = data.lines.reduce((t, l) => t + l.itemRevenue, 0);
const orderItemSum = data.orders.reduce((t, o) => t + o.itemRevenue, 0);
const ok1 = Math.abs(lineSum - orderItemSum) < 0.01;
console.log(`  ${ok1 ? 'PASS' : 'FAIL'}  line-item revenue == order item revenue  (${f(lineSum)} vs ${f(orderItemSum)})`);

const bandSum = a.byBand.reduce((t, b) => t + b.revenue, 0);
const ok2 = Math.abs(bandSum - a.itemRevenue) < 1;
console.log(`  ${ok2 ? 'PASS' : 'FAIL'}  price bands sum to item revenue          (${f(bandSum)} vs ${f(a.itemRevenue)})`);

// Filters must partition the whole: the parts add back up to the total.
const parts = a.byLine.map((l) => aggregate(data, { line: l.line }).grossRevenue);
const partsSum = parts.reduce((t, n) => t + n, 0);
const ok3 = Math.abs(partsSum - a.grossRevenue) < 1;
console.log(`  ${ok3 ? 'PASS' : 'FAIL'}  category filters partition gross revenue (${f(partsSum)} vs ${f(a.grossRevenue)})`);

process.exit(ok1 && ok2 && ok3 ? 0 : 1);
