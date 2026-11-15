# ui-final — mission-planning interface pass (Takou)

15 November 2026, branch `ui-final` from `main` c6459f1 (public runtime 1fdb32e). Visual and
copy changes only: no data, calculation, unit, source, credit or limitation text changed. Done
during the release freeze at the user's request, as a separate branch; nothing reaches `main` or
the public URL unless the coordinator merges it.

## Audit: 10 highest-impact visual issues (before)

| # | Issue on c6459f1 | Result on ui-final |
| --- | --- | --- |
| 1 | The image is not the hero: at 1280 × 800 it starts at y ≈ 397 and gets ~40 % of the screen | **Partly.** Viewer frame 542 → 590 px (74vh) with a dark viewer frame in both themes; but it starts at y = 419 (22 px lower) because of the larger type and the boxed details row |
| 2 | Header at 1280: subtitle collides with the "Metadata" pill | **Fixed.** One glass row; brand no longer shrinks under the pills |
| 3 | Three status surfaces; the offline bar shows the raw token "Pack not-prepared" | **Improved.** Bar uses theme colours and plain states ("Pack not prepared", "Pack verified" only when verified); connection shown separately (amber when disconnected). Header pills and footer still exist |
| 4 | Map toolbar crowded, wraps to three rows on tablet | **Improved.** Glass toolbar, pill chips, 40 px controls; still two rows at 1280 and three on phones |
| 5 | Image letterboxed in a grey frame inside cards | **Improved.** Dark viewer frame, larger radius and soft shadow; letterbox remains (map fit, Willy's logic) |
| 6 | Tabs cut off ("Missi…") | Unchanged (scrollable full-label tabs from the earlier polish) |
| 7 | Dark source links 1.9:1; light image credit ~1:1 | **Fixed.** Shared link token (9.6:1 dark, 6.0–6.7:1 light); credit uses secondary text |
| 8 | Generic type, no tabular numerals, values do not read as quantities | **Fixed.** Inter body, Space Grotesk headings and numbers, tabular numerals for coordinates, counts and the distance value |
| 9 | Generic globe logo | **Fixed.** New original mark: Mars disc, crater, dotted traverse from start point to destination ring; wordmark in Space Grotesk |
| 10 | Side panel long, quantities without hierarchy | **Partly.** Distance value is now the card's hero beside its Derived/Unavailable badge; panel length unchanged |

## What changed (one commit per screen)

| Commit | Screen | Change |
| --- | --- | --- |
| 532e492 | Tokens and base | `src/tokens.scss`: colour (cream `#f6f1e9` base, rust `#ff8a4c` accent, warm dark theme), 8 px spacing grid, radius, shadow, glass, type and motion (150–250 ms, off under `prefers-reduced-motion`), safe-area insets; fonts; base type; route-glow hooks; `viewport-fit=cover` |
| ebcd778 | Map workspace and header | New mark and subtitle, glass header with safe-area padding, duplicate header layer buttons hidden (same toggles stay in the map toolbar), glass map toolbar and zoom, taller viewer, route line in the accent with a soft glow and fade-in, mission-summary layout |
| 8b0e5a6 | Route planner and time budget | Token radii, 3 px focus, numeric face for coordinates, active mode bold as well as coloured |
| bc55ebf | Notebook | Token radii, 3 px focus, numeric face for counts and positions; draft retention untouched |
| 04e309a | Exploration Confidence | Distance value as the hero (22 px Space Grotesk, tabular) beside its kind badge and basis |
| 827eda4 | Data sources | Science, passport and source library on the shared link/accent tokens and radius scale |
| bd9f631 | Offline pack and install | Theme colours, safe areas, plain-language pack states, separate connection indicator |

## New dependency

Two self-hosted font files, no npm package: Inter and Space Grotesk, Latin subset, variable
weight, from `@fontsource-variable/inter` and `@fontsource-variable/space-grotesk` 5.3.0
(released 19 July 2026), downloaded from jsDelivr. 48,256 + 22,288 bytes, SIL Open Font License
1.1 (`src/assets/fonts/OFL-*.txt`). The existing build emits them under `media/` and the existing
pack generator includes them: pack 20 → 22 assets. Fallback is the system font stack.

## Verification (Windows 10, Node 24.22.1, Chrome 157 headless)

- `npm test`: **29 files, 308 tests passed** (same count as main).
- `npm run build`: passes. Warnings: initial bundle **509.85 kB** (main: 504.46 kB, already over
  the 500 kB warning), `map.component.scss` **7.02 kB** (main: 6.61 kB, already over 4 kB),
  Leaflet CommonJS. Budgets unchanged. No new component over budget.
- Lint: the repository has no lint script; not run.
- Smoke harness (`tools/qa/takou`, QA branch 58c84b3) on this build: **9/9 passed**, 0 page or
  console errors, 0 failed requests: raster, science navigation/filters, route with Reset/Focus,
  note save with simulated full storage keeping the draft, export, rejected imports, full offline
  pack, offline full-process restart with automatic restore, AI-relief viewer open/close, 390 px.
- Contrast scan of the first screen (≈ 265 text elements per theme, WCAG 4.5:1 / 3:1 large):
  **0 failures** at 1280 and 390 px in both themes (main: 1 failure in dark).
- Horizontal overflow: 0 at 1280, 820 and 390 px in both themes.

Screenshots: `docs/design/ui-final/before-*.png` and `after-*.png`, 1280 × 800, 820 × 1180 and
390 × 844, light and dark. Browser automation is not physical-device certification.

## Not done (honest list)

- **Reusable component library** (Button, IconButton, StatusBadge, Card, Panel, Tabs,
  QuantityCard, Banner, EmptyState, Skeleton): not created. This pass unifies existing styles on
  shared tokens instead; replacing templates across owners' components during the freeze was
  judged too risky for 308 tests and the release.
- **First-launch walkthrough**: not implemented. It needs a persisted "seen" flag, and the
  coding-agent contract keeps browser storage inside the core services; coordinator decision.
- **Quantity cards with instrument, sol, data age and source link**: the current records do not
  carry those fields for the distance card; nothing was invented. The distance card shows value,
  kind and basis.
- Panel slide motion and skeleton loading states: not added (route fade-in only).
- Map toolbar still wraps at 1280 px; desktop image starts 22 px lower than on main.

## Decisions I was unsure about (please review)

1. Hiding the header's Imagery/Markers/Grid buttons (duplicates of the map toolbar toggles).
2. Route line colour `#f4a340` → accent `#ff8a4c` with a glow (CSS class hooks added in
   `map.component.ts`; no geometry or behaviour change).
3. A dark viewer frame around the image in the light theme.
4. Subtitle "Gale Crater EVA Planner" → "Traverse planner · Gale Crater".
5. Offline bar wording (labels above) in `src/app/core/pwa-panel.component.ts` (coordinator file).
6. Editing other owners' stylesheets (map, planner, notebook, briefing, sources) at the user's
   request during the freeze.

## AI-generated parts (for the AI-use declaration)

All code, styles, copy changes, the MARSWALK mark (SVG) and this report in `ui-final` were
produced by **Anthropic Claude Code** (AI coding agent) directed and reviewed by Takou (Charles).
Screenshots and contrast/overflow measurements were captured by automated scripts the agent
wrote. The two fonts are third-party works under the SIL OFL, not AI-generated. No AI runs in the
application at runtime.
