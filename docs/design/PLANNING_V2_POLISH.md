# Planning V2 — usability audit (ten ranked issues)

Branch `feature/charles-planning-v2-polish`. Prepared by the coordinator's coding agent for **Charles/Takou's "Do now" item; Charles owns the ranking, fixes and any real-user sessions.** No styling was changed. No terrain is enabled, and this audit doesn't pretend otherwise. **No outside users took part:** these are measured and expert-review findings, not user-test results.

## Method

- Production build of `a81c157` (runtime = `main` 78b7c69), served locally, Chromium 157 via Playwright, 20 Nov 2026.
- Viewports: 1280×800 desktop, 820×1180 tablet, 390×844 phone, 640×400 (≈ 1280×800 at **200 % zoom**). Light and dark themes via `prefers-color-scheme`. Reduced motion via `prefers-reduced-motion: reduce`.
- Measured per view: horizontal overflow, map position and visible fraction on first load, interactive targets under 44 px, text contrast against the nearest opaque background (WCAG 4.5:1 / 3:1 large), focus outline on the first 12 Tab stops, and transitions/animations under reduced motion. Raw numbers: [planning-v2-audit/measurements.json](planning-v2-audit/measurements.json).
- Screenshots: [planning-v2-audit/](planning-v2-audit/), 1× JPEG. They were captured **after** the keyboard pass, so the scrolled workflow-pill row on the phone and the focus ring on "Science markers" are artifacts of that pass, not defects.

## What passed

| Check | Result |
|---|---|
| Horizontal page overflow | none at all four sizes, both themes |
| Text contrast | 0 failures where the background could be resolved. **Limit:** text over gradients/images was skipped, so check the map overlays by eye |
| Focus visible | first 12 Tab stops all show a 2–3 px solid outline |
| Reduced motion | no transitions or animations longer than 50 ms under `reduce` |

## Ten issues, ranked

| # | Severity | Issue | Where (viewport / theme) | Affected task | Evidence | Proposed fix | Owner to agree |
|---|---|---|---|---|---|---|---|
| 1 | **High** | **The map starts below or past the fold.** Map top: 419 px desktop (65 % visible, bottom clipped behind the sticky footer, page itself doesn't scroll), 638 px tablet (66 %), 594 px phone (51 %), **0 % visible at 200 % zoom**. The summary, step pills, layer bar and "Route point details" take the first screen | all, both themes | Every map task: inspect, set endpoints, later preview a terrain suggestion | desktop-light.jpg, tablet-dark.jpg, phone-light.jpg, zoom200-light.jpg | Collapse the Mission Decision Summary to a one-line bar by default. Move Imagery/Markers/Mode/Reset/Focus into a compact toolbar overlaid on the map. Give the map `min-height: calc(100dvh − header)` on desktop | Charles + Emma 1 (shell), Willy 1 (map) |
| 2 | **High** | **On a phone, the route mode buttons are about 900 px away from the map.** Map at y 594–1082. "Set Start Point Mode" at y 1505 inside the Route Planner tab. Placing each endpoint means scrolling down, tapping the mode, scrolling up, tapping the map | phone, both | Set start/destination (and the V2 terrain request) | phone-light-full.jpg + measurements | Put a Start / Destination / Waypoint segmented control in the map toolbar from #1. Keep the full planner in its tab | Willy 1 + Emma 1 |
| 3 | **High** | **The initial map view isn't fitted to the image.** Tablet: about 230 px of empty black above the image and its lower part hidden behind the footer. Desktop: the image is cut at the bottom | tablet, desktop | Orientation on first load | tablet-dark.jpg, desktop-light.jpg | `map.fitBounds(imageBounds(image))` after the overlay loads and on container resize. This is logic, not style | Willy 1 |
| 4 | Medium | **The tab bar hides "Mission Transfer" and "3D Rehearsal"** with no scroll cue: the bar is 597 px of tabs in 379 px at 1280 wide, and 597 in 390 on a phone. Workflow step "4. Save / export" points to a tab you can't see | desktop, tablet, phone | Save / export, import | desktop-light.jpg (tab "M…" cut off) | Wrap tabs to two rows, shorten labels ("Transfer", "3D"), or add edge fade + arrow buttons | Emma 1 (shell) |
| 5 | Medium | **The "No science records are positioned on this image" notice covers the top of the map** and sits next to the zoom buttons | phone, both | Inspect imagery | phone-dark.jpg | Show it once above the map, or make it a dismissible chip that doesn't overlap the image | Willy 1 |
| 6 | Medium | **Small targets.** Disclosure `summary` rows are 18–22 px tall ("Route point details", "Image sources & limitations", "Terrain, coverage…", "Sources, data & methods"). Inline source links are 17 px. Main buttons are 40 px (Export, steps, Reset/Focus, theme). 30 of 58 visible controls are under 44 px | all | Opening limitations/sources (scientific transparency), touch use | measurements.json `smallList` | `min-height: 44px; display: flex; align-items: center` on `summary` and buttons via existing tokens. Pad inline links to a 44 px hit area | Charles (shared tokens) |
| 7 | Medium | **Header status chips overflow on the phone** ("Offline Pa…" cut, row scrolls sideways with no cue) | phone, both | Knowing offline readiness | phone-dark.jpg | Let chips wrap, or merge into one status chip (see #8) | Charles |
| 8 | Low | **Offline state shown three times**: top "Install & offline · Pack not prepared" bar, header chip "Offline Pack: Not Prepared", footer "Readiness states … verified independently" | all | Understanding readiness | desktop-light.jpg | Keep the install/offline disclosure bar as the single source. Drop the duplicate chip, or make it a link to the bar | Charles + Patrick (PWA panel) |
| 9 | Low | **The sticky footer takes map space for technical text** ("Coordinate System: image-pixels-bottom-left", readiness note): about 50 px desktop, 90 px tablet | desktop, tablet | Map space | desktop-light.jpg, tablet-dark.jpg | Move it into "Image sources & limitations". Keep "Collapse Panel" in the panel header | Emma 1 |
| 10 | Low | **The phone page is 3 957 px long** with the planner, notebook and evidence below the map, so moving between steps means long scrolls | phone | The whole workflow | phone-light-full.jpg | After #1 and #2: a bottom tab bar on phones that switches panels in place | Emma 1 + Charles |

## Planning V2 notes (for when terrain lands)

- The suggested route needs a distinct, non-colour style (dash pattern) that reads on both themes over the imagery. See Q4 in [PLANNING_V2_MAP.md](../qa/PLANNING_V2_MAP.md) on `feature/willy-terrain-map-v2`.
- Fix issues #1–#3 before adding preview/accept/reject. Otherwise the new controls inherit the same scroll distance.
- Keep every value, unit, source, credit and limitation. Disclosures may move but not disappear.

## Next steps (Charles)

1. Re-rank with Emma/Patrick and agree the styling-file list before editing overlapping SCSS (brief requirement).
2. After fixes: re-measure with the same method, attach before/after screenshots, and record real-user observations only if sessions actually take place.
