# Planning V2 — map overlay and suggested-route proposal

Branch `feature/willy-terrain-map-v2`. Prepared by the coordinator's coding agent for **Willy 1's "Do now" item; Willy 1 owns the map files, this proposal and all implementation.** This is a proposal, not code: nothing in `src/app/map/` is changed. It builds on the draft [terrain contract v1](../planning/TERRAIN_CONTRACT_V1.md) and the shared `src/app/core/terrain.ts`. It does not invent image-to-grid registration; it only consumes the contract transforms.

Send replies and corrections to Patrick, Enzo 2 and Emma 1 in the runbook §9 handoff format.

## Current extension points (from `map.component.ts` on `main`)

| Point | What it does now | Why it matters |
|---|---|---|
| `renderEffect` | Reads `MissionService` signals (status, image, route, markers, layers, selection) and calls `syncImage`/`syncRoute`/`syncMarkers`/`syncLayerVisibility` | Add one more read for terrain state and a `syncTerrain()` step. No other data path needed |
| `routeLayer`, `markerLayer` (`L.LayerGroup`) | Hold the manual route and science markers | Add a separate `terrainLayer` and `suggestionLayer`, never sharing the manual route's layer |
| `loadImageOverlay()` | On image change: bumps `imageRequest`, clears route/marker layers | Also clear terrain/suggestion layers here, so an old suggestion is never drawn on a new image |
| `clickHandler` | Calls `mission.applyMapPoint` only | Unchanged. Preview/accept/reject never come from map clicks |
| `toLeafletPoint`, `imageBounds` | `[y, x]` in `CRS.Simple`, image bounds `[[0,0],[H,W]]` | All overlay geometry stays in image `Point`s and goes through these helpers |
| `canFocusRoute` / Focus Route | Fits the manual route | Keep. Optionally add "Focus suggestion" while a preview is shown |

## Proposed inputs (read-only signals from a coordinator-owned service)

Patrick owns the service (`src/app/core/`). The map only reads it.

```ts
interface TerrainMapState {
  readonly gate: TerrainFailureCode | null;        // terrainGate() result; null = terrain usable
  readonly packageId: string | null;
  readonly imageRef: string | null;                // package imageRef
  readonly footprint: { readonly sw: Point; readonly ne: Point } | null; // image px, via projectedToImage
  readonly coverage: 'full' | 'partial' | 'none' | 'unverified';
  readonly invalidMaskUrl: string | null;          // optional downsampled nodata overlay (question Q1)
}
interface TerrainSuggestionState {
  readonly status: 'idle' | 'running' | 'preview-ready' | 'no-route' | 'cancelled' | 'error';
  readonly requestId: string | null;
  readonly imageRef: string | null;
  readonly packageId: string | null;
  readonly path: readonly Point[] | null;          // only when preview-ready
  readonly stale: boolean;                          // from Emma 1's stale guard / client
}
```

Footprint from the contract: grid corners `(gt0, gt3 + rows·gt5)` and `(gt0 + cols·gt1, gt3)` → `projectedToImage()` → clip to `[0, W] × [0, H]` for display.

## Proposed rendering

| State | Map shows | Non-colour cue |
|---|---|---|
| `gate !== null` (no package, not accepted, wrong image, offline incomplete) | Nothing on the map. Existing panel text explains the state | — |
| Terrain usable | Footprint outline (`L.rectangle`, no fill) in `terrainLayer`; optional nodata hatch overlay | Dashed outline + legend entry "Terrain coverage" |
| `running` | No path. Optional small "Computing…" label in the map corner | Text |
| `preview-ready`, not stale, matching `imageRef` and `packageId` | `L.polyline(path)` in `suggestionLayer`, class `mw-suggested-route`, drawn **under** the manual route | Dash pattern + legend "Suggestion (not saved)" — never the manual route's solid orange |
| `stale` | Remove the polyline (Emma 1's planner explains why) | Panel text |
| `no-route` / `cancelled` / `error` | Remove the polyline | Panel text; "no route ≠ impassable" stays in the planner |
| After **Accept** | Suggestion layer cleared. The route arrives through the normal `mission.route()` signal (Patrick's adapter) and draws as the manual route | Same as any route |

Guards (all in `syncTerrain()`):

1. Draw a suggestion only if `suggestion.imageRef === mission.image().imageRef` **and** `suggestion.packageId === terrain.packageId` **and** `!suggestion.stale`.
2. Clear both terrain layers in `loadImageOverlay()` and when `dataStatus` leaves `ready`.
3. Never call `mission.*` setters from `syncTerrain()`. Preview, reject and cancel don't change mission geometry or notes.
4. Clip the path to the image bounds for display only. Don't change the data.

## Layer toggle

`LayerId` in `core/models.ts` is `'imagery' | 'markers' | 'grid' | 'coverage'`. Proposal: add `'terrain'` (footprint + nodata hatch), default on. The suggestion itself isn't toggleable while it's shown, so a preview is never hidden by accident. This is a core-model change, so Patrick decides.

## Tests Willy 1 would add (`map.component.spec.ts`)

- Gate non-null → no terrain or suggestion layers.
- Footprint for an exactly covering grid → rectangle bounds `[[0,0],[2048,2048]]`.
- Suggestion with a mismatched `imageRef` or `packageId`, or with `stale`, isn't drawn.
- Image change clears both layers before the new overlay loads.
- Preview → reject: `mission.route()` and observations unchanged (spy on setters).
- Suggestion polyline has `mw-suggested-route` and dash styling; manual route unchanged.
- Reset View / Focus Route / map height unchanged (existing tests stay green).

## Questions back

- **Q1 (Willy 1 → Patrick):** is a nodata overlay needed in v1, or is the footprint outline enough? An overlay means building a small PNG from `mask.u8` (e.g. ≤ 512² in a canvas), which costs memory on phones. Recommendation: outline only for v1. Show nodata through routing failures (`endpoint-on-nodata`) and the evidence panel's missing-percent figure.
- **Q2 (→ Enzo 2):** confirm the path is image `Point`s with exact endpoints (yes on `feature/enzo-routing-worker-v2`).
- **Q3 (→ Emma 1):** the planner owns all text for stale/failure states. The map shows nothing extra. Agree?
- **Q4 (→ Charles):** dash pattern and colour for the suggestion, on both themes, at 3:1 contrast against the image.
