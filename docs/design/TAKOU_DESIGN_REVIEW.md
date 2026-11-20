# Design audit and implementation-ready proposal — Takou

**Status: proposal for coordinator/Emma review. No product file is changed by this document.**
Styling work starts only after an explicit file-ownership handoff from Emma.

- Tested revisions: `main` **842ad3d** (runtime = calibrated public candidate **3d47a7b**, which
  adds the 0.25 m/px crop, planar distance and Emma's mission decision workspace) and, before the
  rebase, `main` **2626a6b** (= public candidate 38516f8). Screenshots are from the merge with
  `main` **7798074** (coordinator fixes b28f6ad: startup restore, scrolling phone layout).
- Screenshots: `docs/design/takou-screens/` (source, URL and viewport in the table below).
- Scope: existing tokens in `src/styles.scss`, existing components, existing capabilities.
  No new scientific values, map positions, readiness states, fonts or frameworks.

## Screenshots

All captured by the Package 3 harness run `2026-11-15T15-49-52-598Z-3u6xee`: production build
of merge e30a3fe (main 7798074 + QA commits) served at `http://127.0.0.1:4310/`, Chrome 157.0.8103.51 headless, default
light colour scheme, synthetic test mission only.

| File | Viewport | State |
| --- | --- | --- |
| `desktop-1366-initial.png` | 1366 × 768 | First load online, pack not prepared |
| `desktop-1366-route.png` | 1366 × 768 | Route drawn (start, waypoint, destination), Route Planner tab |
| `desktop-1366-notebook-failed-save.png` | 1366 × 768 | Simulated full storage: error shown, draft kept |
| `desktop-1366-offline-startup-restored.png` | 1366 × 768 | Offline after full restart: restored automatically, Notebook (1), restore message |
| `desktop-1366-viewer.png` | 1366 × 768 | Optional flat viewer open, offline |
| `phone-390-offline.png` | 390 × 844 | Offline, top of page: 178 px of map visible |
| `phone-390-map-scrolled-into-view.png` | 390 × 844 | Same, map scrolled into view: full 488 px |
| `phone-390-panel-collapsed.png` | 390 × 844 | After Collapse Panel (page scrolled to that button) |
| `prototype-phone-390.png` | 390 × 844 | **Prototype** `tools/design/takou/index.html` (file URL, not the app): map 436 px |
| `prototype-desktop-1366.png` | 1366 × 768 | **Prototype**, desktop: map + 380 px panel |

The app follows the system colour scheme. These captures are light theme; the contrast
failures in problem 5 apply to the dark theme.

## The five most serious usability problems (ranked by mission impact)

### 1. Saved work looks lost after reopening, and saving first erases it

**Status on 7798074:** largely addressed by the coordinator (b28f6ad): automatic restore with a
visible "Restored saved route and N observation(s)" message. Remaining: B2 (unreadable record
overwritten on next save) and the "Load Route" label that still says route only.

After a restart the Notebook says "No observations recorded yet for this mission session."
(`notebook.component.html:166`) and the Route Planner is empty. The only restore is **Load
Route** in another tab (`route-planner.component.html:316-328`), and its label does not say it
also restores notes. If the user saves a route or a note first, the earlier notes are
overwritten (blocker B1 in `docs/qa/TAKOU_RELEASE_BLOCKERS.md`). This is the most likely cause
of Royce's Samsung report.

- **Proposal (Emma 1, after the coordinator's B1 service fix):** one recovery banner at the
  top of the side panel when a saved mission exists and is not loaded: "Saved mission on this
  device: route with N points and M notes. [Load saved mission] [Export it first]". The
  counts come from the coordinator's service, never from the UI reading storage itself.
  Rename **Load Route** to **Load saved mission (route + notes)**. In the Notebook, replace
  the empty-state sentence with "Notes from your saved mission are not loaded yet" while that
  state is true.
- **Acceptance:** after a full restart, a first-time user finds and restores the note
  without instructions; saving before loading can no longer remove saved notes (B1 tests
  inverted and passing).

### 2. On a phone the map is almost invisible

**Status on 7798074:** fixed as a blocker by b28f6ad; the page scrolls and the full 488 px map
is reachable (178 px on first view). The proposal below still makes the map the first thing
seen on a phone.

Measured at 390 × 844 with the smoke harness (on-screen height, clipping included). On
**842ad3d** the new Mission Decision Summary sits between the header and the map; the map
starts at y = 898 px, so **0 px of map is visible** without scrolling, with or without
Collapse Panel (`phone-390-offline.png`). On **2626a6b** it was 89 px, 347 px collapsed.
Above the map: the PWA bar, brand, four status pills, header layer buttons, theme and Export
(about 270 px), the decision summary, then the map toolbar (about 110 px). On desktop
1366 × 768 about 270 px of map remains visible. The shell gives the map workspace 45 %
of the height under 768 px (`shell.component.scss`, media query at line 238). Layer toggles
exist twice (header buttons and map-toolbar checkboxes), and "Grid unavailable / Coverage
unavailable" take space for features that do not exist. On desktop 1366 px the five tabs do
not fit the 380 px panel: "Mission Tra…" is cut and "3D Rehearsal" is off-screen.

- **Proposal:** phone layout = compact header (brand + readiness + Export), the Mission
  Decision Summary collapsed to a one-line status under 768 px (Emma 1 owns it), map first at
  ≥ 55 % height, then a bottom-sheet side panel with three primary tabs (Science, Route,
  Notes) and an overflow for Transfer and 3D. Keep one set of layer toggles (map toolbar,
  Willy) and move the unavailable-layer notes into the image passport. Desktop keeps the
  current map + resizable side panel.
- **Owners:** Emma 1 (shell, header, tabs), Willy (map toolbar), coordinator (root bar).
- **Acceptance:** at 390 × 844 the on-screen map (measured like check 9 of the smoke
  harness, `visibleDefault`) is at least 460 px (≥ 55 % of 844) with the panel open, no
  horizontal document overflow, every tab reachable without sideways scrolling at 390 px
  and 1366 px.

### 3. Three competing status areas, one of them using internal state names

The top PWA bar shows "Install & offline · Connection available · Pack not-prepared" (raw
`OfflineState` value, `pwa-panel.component.ts`), the header shows four pills (Metadata,
Network, Offline Pack, Install), and the map footer says "Readiness states … are verified
independently". The one action that matters before going offline, **Prepare offline**, is
hidden inside a collapsed `<details>`.

- **Proposal (coordinator owns the root panel; Emma 1 owns the header):** one "Offline
  readiness" control in the header. Plain words for each existing state: Not prepared /
  Preparing 7 of 19 / Ready offline (pack abc123…) / Needs repair / Not supported here. Its
  popover holds the existing Prepare / Verify / Check for updates / Install actions. Remove
  the duplicate root bar after moving the controls (the coordinator contract already allows
  this). Network stays a separate small hint, never shown as readiness.
- **Acceptance:** no raw state token visible; Prepare offline reachable in one tap from
  the header at 390 px; screen reader announces each state change once.

### 4. Status messages disappear after 4–4.5 seconds, including failures

Planner and Notebook feedback clear themselves with `setTimeout` (4000 ms and 4500 ms). A
failed save ("Observation was not saved. Keep your draft and try exporting.") vanishes while a
field user is still reading it. This conflicts with WCAG 2.2.1 (timing adjustable) for error
content.

- **Proposal (Emma 1):** success messages may fade; error messages stay until the next
  action or a Dismiss button. Keep `role="status"` for success and use `role="alert"` for
  errors.
- **Acceptance:** with storage blocked, the error is still visible after 30 seconds and the
  draft is unchanged (already covered for the draft by the Package 3 smoke test).

### 5. Dark-theme text and primary buttons fall below WCAG AA contrast

Measured from the tokens in `src/styles.scss` (WCAG formula):

| Pair (dark theme) | Ratio | AA normal text (4.5) |
| --- | --- | --- |
| `--text-muted` #64748b on `--bg-card` #1a222e | 3.36 | Fails |
| `--text-muted` on `--bg-surface` #141a23 | 3.67 | Fails |
| `--mars-accent` #e05a47 text on `--bg-card` | 4.36 | Fails |
| White on `--mars-accent` (primary button) | 3.67 | Fails (passes only for large/bold text) |
| `--text-secondary` #94a3b8 on `--bg-card` | 6.24 | Passes |
| Light theme `--text-muted` on `--bg-card` | 4.55 | Passes (barely) |

- **Proposal (Emma 1, tokens only):** dark `--text-muted` → `#8a9ab0` (computed 5.59:1 on
  `--bg-card`, 6.10:1 on `--bg-surface`). Primary buttons: keep the `#e05a47` fill with dark
  text `#0b0e14` (5.26:1), or darken the fill to `#b8412f` with white text (5.48:1). Accent
  used as text on cards → `#f07a69` (5.86:1). No palette or font change otherwise.
- **Acceptance:** an automated contrast check over both themes reports no AA failure for
  body text and buttons.

## Spacing, typography and action hierarchy (existing tokens only)

- **Spacing:** 4 / 8 / 12 / 16 / 24 px steps. Panels 16 px padding, 12 px between cards,
  8 px inside button groups. Touch targets keep `--touch-target-min` (44 px).
- **Type:** `--font-sans` for everything except coordinates and hashes (`--font-mono`).
  Sizes: panel title 1.0 rem / 600, card title 0.9 rem / 600, body 0.875 rem, meta 0.8 rem
  (never below 0.75 rem). No uppercase body text.
- **Actions, one primary per panel:** Route panel → Save mission; Notes → Save observation;
  Transfer → Export mission; Offline popover → Prepare offline. Secondary: outline buttons.
  Destructive or replacing actions (Clear route, Import) use the warning style and keep their
  current confirmations and Undo.

## Information hierarchy for science, route and observation

1. **Mission question** (Emma 2 briefing, collapsible): one sentence and the boxwork objective.
2. **Evidence on this image** vs **Regional context**: the 3 current science records are all
   `positionStatus: unavailable`, so they belong under "Regional context — not located on this
   image". The map legend states "0 records located on this image" instead of offering a
   Science markers toggle that shows nothing.
3. **Route:** ordered points, then the derived planar distance with its limitation ("projected
   map plane, not terrain-following") and "slope and terrain: not available" directly under
   the table, not in a separate panel.
4. **Observations:** newest first, each with time, image reference and "Unlocated" or pixel
   position.

## State language (use these exact words)

| State | Words | Where |
| --- | --- | --- |
| Derived measurement | "Planar distance 400 m — projected map plane, not terrain-following" | Route panel, decision summary |
| Unavailable measurement | "Slope and terrain: not available — no elevation data for this image" | Route panel, viewer |
| Limited provenance | "Limited source review — excerpt only" (existing REMS wording) | Environment panel |
| Regional context | "Regional context — not located on this image" | Science list and details |
| Error | What failed + what is kept + next action, e.g. "Not saved. Your draft is kept. Export the mission or free space." | Inline, persistent |
| Offline | "Offline — working from the prepared pack" / "Offline — pack not prepared; images may be missing" | Header readiness |

## Keyboard, focus, contrast and touch checks

| Check | Result on 842ad3d | Note |
| --- | --- | --- |
| Tabs: roving tabindex and arrow keys | Present in code (`shell.component.ts` `onTabKeydown`) | Keep |
| Visible focus | `--border-focus` ring 4.75:1 on `--bg-surface` (dark theme) | Passes 3:1 non-text |
| Touch targets | `min-height: 44px` on shell tabs, panel toggle and PWA panel buttons (code read; not every control measured) | Keep |
| Contrast | Dark theme failures listed in problem 5 | Fix tokens |
| Timed messages | Errors auto-dismiss | Problem 4 |
| Map keyboard use | Leaflet map is `role="application"`; route points can only be added by pointer | Follow-up for Willy: keyboard point entry (arrow-key crosshair + Enter) |

## File and owner proposals

| Change | Files | Owner | Waits for |
| --- | --- | --- | --- |
| Recovery banner, Load label, Notebook empty state | `ui/shell`, `planner`, `notebook` | Emma 1 | Coordinator B1 fix and a read-only "saved mission summary" signal |
| Single offline readiness control | `ui/header`; remove `core/pwa-panel.component.ts` bar | Emma 1 + coordinator | Coordinator agreement on removing the root bar |
| Persistent error messages | `planner`, `notebook` | Emma 1 | Nothing |
| Phone layout and tab set | `ui/shell`, `ui/header` | Emma 1 | Nothing |
| One layer-toggle set; unavailable layers moved | `map`, `ui/header`, `evidence/image-passport` | Willy, Emma 1 | Agree which toggle set stays |
| Contrast tokens | `src/styles.scss` | Emma 1 (coordinator approves global change) | Nothing |
| Regional-context grouping | `science` | Enzo | Nothing |

## Prototype

`tools/design/takou/index.html` is a static, clearly labelled prototype of the phone layout,
recovery banner, single offline-readiness control and persistent error. It uses placeholder
text only, no app data and no framework; open the file directly in a browser. At 390 × 844 it
leaves 436 px for the map with no horizontal overflow (measured with the harness browser).
