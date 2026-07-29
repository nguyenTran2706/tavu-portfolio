# TAVU — scroll-driven portfolio with a live sales-intelligence dashboard

A single-page Next.js portfolio for **Truong An Vu**, E-commerce Operations. Section 03
embeds a BI-style dashboard that recomputes every figure from raw eBay Seller Hub CSV
exports at build time — no number on the page is typed in by hand.

```bash
npm install
npm run verify:data   # parse the CSVs and print the aggregates + consistency checks
npm run dev           # http://localhost:3000
npm run build && npm start
```

Deploy: push to a Git remote and import on Vercel. Zero configuration — but see
**Deploying** below, because `/data` is gitignored on purpose.

---

## ⚠ Read this first: whose portfolio is this?

The original build brief named **"Tony (Khoi Nguyen) Tran"** as the subject. The attached
résumé, `TAVu_Ecommerce.pdf`, belongs to **Truong An Vu** — a different name, email, phone
and LinkedIn — and "TAVU" is that person's initials.

The brief's own conflict rule is *"if anything conflicts with the PDF, the PDF wins"*, so
the site is built as **Truong An Vu's** portfolio. That is also the only defensible
reading: the eBay Top Rated Seller status, the GMV ranks, the GPA and the Google
certifications are that person's credentials and cannot be transferred by changing a name
field.

If the subject really is someone else, the fix is **not** to edit `identity.name` — it is
to supply that person's own résumé and CSVs.

---

## Where things live

| Path | What it is |
|---|---|
| `src/content/profile.ts` | **All site copy.** Every word, transcribed from the résumé PDF. |
| `src/lib/ebay.ts` | CSV normalise + aggregate. Pure and isomorphic — runs on server *and* client. |
| `src/lib/ebay.server.ts` | The filesystem loader. **Server only** — see Privacy. |
| `data/*.csv` | Raw Seller Hub exports. Gitignored. Never served. |
| `design-system/MASTER.md` | Palette, type, motion, chart specs, checklist. |
| `scripts/verify-data.ts` | CLI sanity check for the data pipeline. |

---

## Swapping in a new résumé

Everything is in `src/content/profile.ts`. Replace the values and the whole site follows —
nav labels, hero, sections, footer, `<title>` and meta description.

Anything **not** found in the source document must be wrapped in `TO_CONFIRM('…')` rather
than left blank or guessed. Those render as a visible amber dashed badge, so a missing
field looks unfinished instead of looking finished:

```ts
github: TO_CONFIRM('GitHub'),                     // renders: ⚠ GitHub — to confirm
github: 'https://github.com/username',            // renders: a real link
```

### Placeholders currently on the page: **none**

Every field the résumé lacked has since been supplied and wired in:

| Field | Value |
|---|---|
| GitHub | `github.com/adgtristy-ux` |
| eBay store | `ebay.com.au/str/adgt36` |
| AnnStore live demo | `ann-store-three.vercel.app` |
| AnnStore source | `github.com/adgtristy-ux/AnnStore` |
| Google Ads credential | `credential.net/dda96a76-…` |
| Google Analytics credential | `credential.net/2273f0ee-…` |

Certification issue and expiry dates (28 Jul 2026 → 28 Jul 2027) were read from the
supplied Open Badge 3.0 credential files rather than typed in.

#### The one file not in the repo

`contact.headshot` points at **`public/portrait.jpg`**, which is intentionally not
committed. Save the portrait there and it appears — no code change needed. Until then
[Portrait.tsx](src/components/ui/Portrait.tsx) fails over to a panel that says so, rather
than rendering a broken image or substituting a stock photo of someone else.

Two sections also say out loud what the source lacks, rather than padding:
**Activities** notes there are no hackathons or awards in the résumé, and **About** notes
there is no ML/AI skill group because the résumé contains none. The brief asked for both;
inventing them would have been fabrication.

---

## Swapping in new CSVs

Drop new exports into `data/` and rebuild. **Filenames don't matter** — each file is routed
by its contents:

| Detected by | Treated as |
|---|---|
| contains `Sales Record Number` | Orders Report |
| contains `eBay item ID` | Listings Sales Report (fee level) |
| matches `rank by sales (GMV)` | Listing Quality Report |

Header rows are found by content too, so eBay's variable-length disclaimer preamble doesn't
need a hardcoded skip count, and columns are fuzzy-matched (case/punctuation-insensitive,
with a substring fallback) so renamed columns keep working. **A missing column omits its
metric rather than throwing.** Multiple Listings Sales Reports are deduped by item ID, so
overlapping exports don't double-count fees.

If `data/` is empty the site still builds: the dashboard renders a labelled empty state and
**no sample numbers**, so nothing can be mistaken for real trading data.

Run `npm run verify:data` after any swap. It prints the aggregates and three consistency
checks:

```
PASS  line-item revenue == order item revenue
PASS  price bands sum to item revenue
PASS  category filters partition gross revenue
```

---

## Privacy — the reason for the server/client split

The Orders Report contains **buyer names, email addresses, phone numbers and full street
addresses for ~105 real people.**

So the CSVs live in `data/`, never `public/`, and are parsed **on the server at build
time**. What reaches the browser is anonymised: amounts, dates, destination country,
product titles, and opaque buyer refs (`b001`, `b002`) used only to count repeat purchases.
No name, email, phone, address, postcode or tracking number is emitted.

`ebay.ts` and `ebay.server.ts` are split for this reason: the client dashboard needs
`aggregate()` to re-run on filter changes, so it imports `ebay.ts`. Keeping `node:fs` out of
that file means the boundary is enforced by the module graph — importing the loader into a
client component fails the build rather than silently shipping the raw exports.

To verify after a change:

```powershell
Get-ChildItem -Recurse -File .next\server, .next\static |
  Select-String -Pattern '@members\.ebay\.com|R2358700' -List
```

Expect no matches. (The one phone number in the output is the site owner's own, from the
résumé's contact block.)

---

## How the dashboard works

- **`aggregate(data, filters)`** is pure and runs in both places: once on the server for the
  initial render, then in the browser on every filter change. That's why the filters are
  real rather than decorative — the KPIs, charts *and* the generated narrative all recompute
  from the same function.
- **The narrative paragraphs are generated**, not written. `buildSummary()` derives each
  sentence from the filtered aggregates, so it can't drift from the numbers beside it.
- **Every chart has a table-view twin.** The table is what renders server-side and before
  hydration, so all values are in the HTML — readable without JavaScript and by a screen
  reader, without depending on the SVG.
- **Filtering by product line** reallocates each order's postage proportionally
  (matched line revenue ÷ order item revenue), so the parts sum back to the whole.

### Two data-handling details worth knowing

**Multi-item orders.** eBay writes these as a *summary row* carrying the order totals with an
empty Item Number, followed by one *child row* per line item. Counting every row as a line
item — the obvious reading — double-counts them, because the summary repeats the subtotal
alongside its own children. Only rows with an item number are counted as line items;
postage is summed across the group. A 5-item, A$74.50 order then reconciles exactly instead
of inflating to A$377.

**Orders with no destination.** A handful (local pickup / off-platform) carry no address
block. They are flagged `countryKnown: false` and excluded from the domestic/international
split rather than being bucketed as "international" merely because the country isn't
"Australia" — which would have overstated cross-border revenue at 35% instead of the
correct 21%. (21% independently matches the résumé's own claim.)

---

## Design system

`design-system/MASTER.md` holds the palette, type scale, motion spec, per-chart form
decisions and the pre-delivery checklist.

The chart colours are **validator output, not taste** — produced by the `dataviz` skill's
`validate_palette.js` and pasted into § 3 of that document. Two earlier candidates failed
and were discarded (a 5-hue warm set whose magenta↔aqua pair was invisible to deuteranopes
at ΔE 1.6, and a tighter amber ramp with insufficient lightness steps). **Re-run the
validator before changing any colour that touches a chart.**

One deliberate departure from the brief: it asked for an order-status donut, but the data
resolves to two classes, and a 2-slice pie is a documented anti-pattern. It ships as a stat
tile instead.

> The brief's first step was to run the `ui-ux-pro-max` plugin's generator. That plugin was
> not installed in this environment, so `MASTER.md` was authored directly against the same
> brief. Its data-viz half is validator-backed rather than asserted.

---

## Performance & accessibility

- three.js is `dynamic(..., { ssr: false })` — out of the initial payload, and never
  downloaded at all by visitors who don't get the canvas.
- The scene is **one `InstancedMesh`** (90 boxes, one material, no shadows) — a single draw
  call. `dpr` capped at 1.75; rendering stops via IntersectionObserver once the hero
  scrolls away.
- The canvas is skipped entirely — not merely paused — under `prefers-reduced-motion`,
  below 768px, or without WebGL. The static gradient underneath is the finished design.
- `prefers-reduced-motion` also disables Lenis (native scroll returns), settles count-ups on
  their final values, freezes the marquee and disables card tilt.
- Marquee pauses on hover **and** focus-within.
- Text contrast floor is 4.6:1 (`--ink-muted`); everything above it clears AA.
- Semantic landmarks, one `<h1>`, skip link, visible focus rings, Lucide SVG icons only,
  no emoji in UI. Responsive at 375 / 768 / 1024 / 1440.
- Without JavaScript the page is fully readable: reveals stay visible via a `.no-js` escape
  hatch, and every chart falls back to its data table.

---

## Deploying

`data/*.csv` is **gitignored**, because those files contain buyer PII and a Git remote is
the wrong place for them. That means a clean Vercel build from Git will render the
dashboard's empty state.

Pick one before deploying:

1. **Commit the aggregates, not the raw files** *(recommended)* — run the loader once, write
   its anonymised output to `data/aggregates.json`, commit that, and read it in
   `ebay.server.ts`. No PII in Git, dashboard fully live.
2. **Build locally, deploy the output** — `vercel deploy --prebuilt` from a machine that has
   `data/`.
3. **Un-ignore the CSVs** — only if the repo is private *and* the buyer columns have been
   stripped first. The exports as downloaded are not safe to commit.
