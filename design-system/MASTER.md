# TAVU — Design System MASTER

Creative-developer portfolio with an embedded e-commerce sales-intelligence dashboard.

> **Provenance.** The `ui-ux-pro-max` plugin was not installed in the environment this
> was built in, so this document was authored directly against the same brief. The
> **data-visualisation half is not opinion** — the palette below is the output of the
> `dataviz` skill's `validate_palette.js`, and the raw validator results are pasted in
> § 3. Re-run it before changing any colour that touches a chart.

Blended directions, reconciled into one system:
3D & hyperrealism (hero) · motion-driven parallax storytelling (scroll) · bento grid
(skills + dashboard) · executive sales-intelligence dashboard (§03 Experience).

---

## 1. Design principles

1. **Warm near-black, one accent.** A single amber accent carries brand *and* data.
   Nothing else is coloured. Colour means something everywhere it appears.
2. **The dashboard is the argument.** The portfolio's claim is "this person reads
   operational data properly." So the dashboard must look and behave like a real BI
   panel, not a decorative chart wall — real filters, a table view, honest empty states.
3. **Motion is choreography, not decoration.** Every animation is tied to scroll
   position or an explicit interaction. Nothing loops in the periphery except the
   marquee, which is content.
4. **3D is a backdrop, never a gate.** Content is complete and readable with WebGL
   disabled, failed, or reduced-motion. The canvas is `aria-hidden`.
5. **Honest surfaces.** Depth from layered warm greys and hairline rings — not from
   drop shadows or glassmorphism blur stacks.

---

## 2. Colour

Single dark theme (the brief specifies warm near-black; there is no light mode).

### Surfaces & ink

| Role | Hex | Use |
|---|---|---|
| `--bg-void` | `#0b0a09` | Page plane, behind the 3D canvas |
| `--bg-page` | `#100f0d` | Page background |
| `--bg-card` | `#191713` | **Chart surface** — validator surface of record |
| `--bg-raised` | `#211e19` | Hover / nested tiles |
| `--hairline` | `rgba(255,252,240,0.10)` | 1px rings, dividers |
| `--grid` | `#2c2a25` | Chart gridlines (solid hairline, never dashed) |
| `--axis` | `#3a3730` | Baselines, axis rules |
| `--ink-primary` | `#f7f4ec` | Headings, KPI values |
| `--ink-secondary` | `#c5bfb1` | Body copy |
| `--ink-muted` | `#8f887a` | Axis ticks, captions, labels — **5.09:1** on `--bg-card`, 5.45:1 on `--bg-page` ✓ AA |

`--ink-muted` is the floor: it is the *darkest* text token permitted, and it clears 4.5:1
against both surfaces it is used on. Nothing dimmer than this carries text.

### Accent & data

| Role | Hex | Use |
|---|---|---|
| `--accent` | `#c98500` | **series-1** + brand chrome. Every single-series chart. |
| `--accent-hover` | `#e0a03c` | Interactive hover only — never a chart fill (out of the dark L band) |
| `--series-2` | `#3987e5` | The *only* second series hue (domestic ↔ international) |

**Ordinal ramp** (price bands — ordered categories, one hue light→dark):

`#7a5206` · `#9c6a08` · `#b87c0a` · `#d09220` · `#e3af57` · `#f2cf95`

**Status** (reserved — never reused as a series): good `#0ca30c` · warning `#fab219` ·
serious `#ec835a` · critical `#d03b3b`. Always shipped with icon + label, never colour alone.

---

## 3. Validator results (do not edit colours without re-running)

```
$ node scripts/validate_palette.js "#c98500,#3987e5" --mode dark --surface "#191713"
  [PASS] Lightness band       all 2 inside L 0.48–0.67
  [PASS] Chroma floor         all 2 >= 0.1
  [PASS] CVD separation       worst adjacent #3987e5↔#c98500 ΔE 27.4 (protan) · tritan 24.3
  [PASS] Normal-vision floor  worst adjacent ΔE 30.7 (normal)
  [PASS] Contrast vs surface  all 2 >= 3:1
  → ALL CHECKS PASS

$ node scripts/validate_palette.js "#7a5206,#9c6a08,#b87c0a,#d09220,#e3af57,#f2cf95" \
      --mode dark --surface "#191713" --ordinal
  [PASS] Lightness monotone   steps read light→dark
  [PASS] Adjacent ΔL          all gaps >= 0.06
  [PASS] Light-end contrast   #7a5206 at 2.59:1 vs surface
  [PASS] Single hue           hue spread 5°
  → ALL CHECKS PASS
```

Two earlier candidates **failed** and were discarded: a 5-hue warm categorical set
(magenta↔aqua CVD ΔE 1.6 — invisible to deuteranopes) and a tighter amber ramp
(adjacent ΔL 0.037). Do not reintroduce either.

---

## 4. Typography

Google Fonts, two families, loaded via `next/font` (self-hosted, no layout shift).

| Role | Family | Spec |
|---|---|---|
| Display / headings | **Fraunces** (variable serif, optical size) | 600, tight tracking `-0.02em` |
| Body / UI | **Inter** | 400/500/600 |
| Numerals & labels | **JetBrains Mono** | 400/500, uppercase `0.08em` for section eyebrows |

**Figures rule (from dataviz):** KPI values and the hero figure use *proportional*
figures in **Inter** — no serif on a hero number, no `tabular-nums` at display size.
`tabular-nums` is reserved for table columns and axis ticks.

Scale (`clamp`, fluid 375→1440): hero `clamp(3rem, 11vw, 8.5rem)` · h2 `clamp(2rem,
5vw, 3.5rem)` · h3 `1.5rem` · body `1.0625rem/1.7` · caption `0.8125rem`.

---

## 5. Layout & effects

- **Grid:** 12-col, `max-width: 1240px`, gutter `clamp(1.25rem, 5vw, 4rem)`.
- **Bento:** skills = 6 tiles on a 6-col grid; dashboard = 12-col with KPI row
  (6×2-col), then charts at 7/5 and 4/4/4.
- **Radii:** cards `16px`, tiles `12px`, chips `999px`.
- **Depth:** `1px` hairline ring + a `2%` white top-edge highlight. **No drop shadows,
  no backdrop-blur glass.**
- **Transitions:** 150–300ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Focus:** `2px` `--accent` outline at `3px` offset, always visible, never removed.

---

## 6. Chart specs (bound by dataviz rules)

| Data job | Form | Colour |
|---|---|---|
| Revenue over time | Area + line, 2px stroke | `--accent`, single series |
| Orders over time | Bar, 4px rounded top | `--accent` |
| Revenue by product line | **Horizontal** bar (long labels) | `--accent`, one colour for all bars |
| Revenue by price band | Bar | **Ordinal ramp** (bands are ordered) |
| Buyer geography | Horizontal bar, top 8 + "Other" | `--accent` |
| Domestic vs international | Grouped bar, 2 series | `--accent` + `--series-2`, legend + direct labels |
| Top products | **Table** (rank, title, units, revenue) | none — text |
| Dispatch / fulfilment split | **Stat tile** | none |

Enforced from `anti-patterns.md`:
- **No dual axis** anywhere. Two measures → two charts.
- **No donut for the order-status split** — it resolves to two classes, and a 2-slice
  pie is banned. It ships as a **stat tile** instead. *(This is a deliberate departure
  from the brief's chart list; the brief asked for a donut, the data doesn't support one.)*
- **No value-ramp on nominal categories** — product lines and countries are nominal,
  so every bar is one accent. Only price bands, which are genuinely ordered, get the ramp.
- Gridlines are **solid** hairlines, y-axis only.
- Direct-label selectively (endpoint + extreme), never every point.
- Every chart has a **table-view twin** toggle; tooltips enhance, never gate.
- **One filter row** above the whole dashboard — no per-card filters.

---

## 7. Motion

| Trigger | Behaviour |
|---|---|
| Page load | Intro curtain — wordmark letters mask up, hairline sweeps, panel lifts (`expo.inOut`) |
| Page scroll | Lenis smooth scroll, `lerp 0.1`; publishes `--scroll-vel` (−1…1) |
| Hero headline | Word-level mask reveal, 80ms stagger, `expo.out`, plays on load |
| Hero body | 26px rise + fade, 90ms stagger; drifts −70px and fades to 0.25 on scroll-out |
| Hero 3D | Camera dolly `z 6 → 2.2`, cluster blooms ×1.85 and orbits, accent light breathes |
| Section headings | Word-level mask reveal on enter, 45ms stagger |
| Section entry | 24px rise + fade, 60ms stagger, `once: true` |
| Portrait | `clip-path` wipe on enter + −44px scrubbed parallax |
| Education rule | Accent line draws downward, scrubbed to scroll |
| KPI tiles | Count-up 1100ms `easeOutExpo`, fires once on enter |
| Charts | Mount on scroll-into-view, then 900ms `ease-out` draw-in |
| Cards | Cursor-tracking accent glow (delegated listener → 2 CSS vars) |
| Buttons | Magnetic pull ≤ 14px, `elastic.out` return, resets on blur |
| Skills marquee | 40s linear loop; skews ≤ 0.8° with scroll velocity; pauses on hover **and** focus-within |
| Project cards | 3D tilt ≤ 6°, pointer-driven, spring return |

**`prefers-reduced-motion: reduce` →** intro curtain skipped entirely, Lenis off (native
scroll), 3D canvas not mounted at all (static gradient + grain instead), reveals and split
words settle instantly, count-ups render final values, charts render finished, marquee
static, tilt/magnetic/glow/parallax all disabled.

**Failure containment.** Every hide-then-reveal effect hides from **script**, inside a
layout effect — never from a CSS class — so a script that fails to run leaves the content
plainly visible. `.reveal` is the one exception (it hides in CSS for the no-flash case) and
it carries a `.no-js` escape plus a rescue sweep. `SmoothScroll` also sweeps any `[data-word]`
still at opacity 0 while well inside the viewport after 1.2s, and the intro curtain has a
4s failsafe that restores scrolling. Content being readable always outranks content being
animated.

> **Do not hide an animated element with a Tailwind transform class.** `translate-y-[110%]`
> resolves to a matrix in computed style; GSAP parses matrices into **pixels**, reads
> `yPercent` as already 0, and tweens it 0→0 — the element stays displaced forever while
> only opacity animates. This silently blanked the hero `<h1>`. Always give GSAP the start
> state explicitly via `fromTo`, in the unit you intend to animate.

---

## 8. Performance budget

- 3D bundle **lazy + `ssr: false`**, mounted only above the fold.
- `dpr={[1, 1.75]}` capped; `frameloop="demand"` when off-screen via IntersectionObserver.
- Instanced geometry — one `InstancedMesh`, ~90 boxes, one material.
- Canvas unmounts entirely below 768px width (mobile gets the static treatment).
- Target 60fps desktop; no main-thread work in the scroll handler beyond transforms.

---

## 9. Anti-patterns — banned in this project

Generic AI purple/pink gradients · emoji as icons (Lucide SVG only) · text below
4.5:1 · autoplaying loops outside the marquee · parallax that outruns the scroll ·
glassmorphism blur stacks · dual-axis charts · donuts for two classes · a number on
every data point · fake/rounded-up metrics · `tabular-nums` on hero figures ·
scroll-jacking that traps the user.

---

## 10. Pre-delivery checklist

- [x] Palette run through `validate_palette.js` — both runs PASS, pasted in § 3
- [x] All text ≥ 4.5:1 (`--ink-muted` is the floor at 5.09:1 on the card surface)
- [x] Lucide SVG icons only, zero emoji in UI
- [x] `cursor-pointer` on every clickable element
- [x] Visible focus ring on every interactive element, keyboard-reachable
- [x] `prefers-reduced-motion` fully respected (3D not mounted, count-ups settled)
- [x] Responsive at 375 / 768 / 1024 / 1440
- [x] Semantic landmarks (`header`/`nav`/`main`/`section`/`footer`), one `h1`
- [x] `alt` text on images; decorative canvas `aria-hidden`
- [x] Charts have table-view twins and legends where ≥ 2 series
- [x] No buyer-identifying data reaches the client bundle
