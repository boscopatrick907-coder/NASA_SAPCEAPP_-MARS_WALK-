# Willy map release QA

## Map-level science marker empty state

The map now explains when the active image has no positioned science records. The message appears only after the active image is ready and while the marker layer is visible. It directs users to the existing Science Context panel under Confidence & Data. Positioned markers continue to use the existing active-image and image-bounds checks; this change does not alter records, coordinates, route state, or shared mission state.

### Automated coverage

`src/app/map/map.component.spec.ts` covers:

- Contextual records with no positions: explanation and Science Context direction are shown, and marker, route, and observation state remain unchanged.
- A positioned marker for the active image: the marker is rendered and the empty state is absent.
- A positioned record for another image: no marker is rendered for the active image and the empty state is shown.
- Hidden marker layer: the empty state is not shown when the marker layer is off.

### Verification

From the `feature/willy-map-release` worktree:

- `npm.cmd test -- --include=src/app/map/map.component.spec.ts` — passed; 1 test file, 38 tests.
- `git diff --check` — passed.

### Narrow-screen follow-up

At 390 × 844, the original bottom-anchored card fell below the map workspace. On screens up to 600px wide, it now anchors near the top of the map frame; desktop placement is unchanged.

Post-fix visual verification in headless Edge:

- **1440 × 1000:** The loaded active image and empty-state card are visible. The card remains 406 × 78 pixels in its original lower-right desktop position. Hiding the marker layer removes it. With the layer visible and a temporary browser-only positioned marker for the active image, the marker renders and the card disappears.
- **390 × 844:** The card is visible near the top of the map frame at 295 × 96 pixels. Hit testing reaches the card, it clears the following workspace footer by 65 pixels, and document scroll width remains 390 pixels.
- **360 × 800:** The card is visible at 265 × 96 pixels, clears the footer by 12 pixels, and document scroll width remains 360 pixels.

The temporary positioned marker was restored to the original loaded records. The browser-only checks did not write mission data.

## Phase 2 keyboard, touch and control usability

Map controls use the repository theme palette (`--bg-*`, `--text-*`, `--border-*`, `--science-cyan`, `--error-red`) and `--touch-target-min`. The shared token sheet defines no spacing tokens; control gaps and padding use its existing rem-based spacing scale. No global styles or other component files were changed.

- The Leaflet image map explicitly enables keyboard navigation, pointer dragging, touch pinch zoom and scroll-wheel zoom. Its accessible name describes the gestures and route-placement action; native visible controls remain labeled.
- Native, labeled toolbar controls remain keyboard-focusable. Keyboard users can select an existing route drawing mode and place its point at the current map center; the existing map tap/click behavior remains available for pointer and touch users. Center points are clamped to the active image bounds before dispatch through the existing `MissionService.applyMapPoint` contract.
- Layer labels, view controls, keyboard route placement, zoom buttons, retry, and marker-detail close controls meet the shared 44px minimum target. Focus indicators and links use shared focus/theme tokens. Toolbar items wrap on narrow layouts.
- Reset, focus, image readiness, retry guards, image coordinate conversion, route rendering, and mission state remain on the existing component/service paths. Calibration remains unimplemented because Gaddielle's verified scale and coordinator approval are still pending.

Automated coverage now checks keyboard placement from the viewport center, bounds clamping, inspect-mode/readiness guards, and retains existing pan/zoom/draw/reset/focus/retry and route-preservation checks. See the final handoff for the commands and actual results.

### Final Phase 2 verification

- `npm.cmd test` — **PASS**, 17 test files and 202 tests. The jsdom run emitted two canvas `getContext()` not-implemented messages; all tests passed.
- `npm.cmd run build` — **PASS**, 18 offline-pack assets generated. The map component stylesheet is within its existing 4 kB budget. The only build warning is the existing Leaflet CommonJS optimization warning.
- `git diff --check` — **PASS**.
- Production build in headless Edge reviewed at **1440 × 1000**, **390 × 844**, and **360 × 800**. Desktop retained the loaded image, zoom controls and lower-right empty-state card. At both phone sizes the complete empty-state message is visible above the shell workspace footer. No page-width overflow was observed; the narrow app's existing tab strip remains independently scrollable.
- The keyboard route-placement button and bounds/readiness behavior are covered by component tests. The screenshots are layout checks, not physical-device touch acceptance. Route draw/click, zoom, reset, focus, retry, image readiness and mission-state preservation remain covered by the passing suite.

No shared state, calculations, scientific data, PWA files, or global styles were changed. Calibration remains blocked until Gaddielle supplies verified scale evidence and the coordinator approves integration. Screenshots were reviewed from temporary Edge output and were not added to the repository.
