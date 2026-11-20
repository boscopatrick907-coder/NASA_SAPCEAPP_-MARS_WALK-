# Terrain contract v1 — DRAFT for implementer review

Status: **draft, not frozen.** Drafted 20 November 2026 from the [runbook §5](TERRAIN_DELIVERY_RUNBOOK.md#5-patrick--implementers-freeze-contract-v1-before-wiring) requirements, Emma 1's `feature/emma-terrain-planner-v2` (f7317cd) and Emma 2's `feature/emma-terrain-evidence-v2` (599c9c3) proposals, and the existing image contract ([CALIBRATED_CROP.json](../data/evidence/CALIBRATED_CROP.json), `src/app/core/models.ts`). Patrick freezes it after Enzo 1/2, Willy 1/2 and Royce reply. No terrain product is accepted; nothing here enables a user-visible feature.

Sections marked **[source-dependent]** cannot be finalised until the [source gate](../data/terrain-v2/ACCEPTANCE.md) records an inspected product. Everything else is proposed as frozen for v1.

Contract identifier in code: `TERRAIN_CONTRACT_VERSION = 'terrain-v1'`. Emma's `'v1-proposal'` constants are renamed to this on integration.

**Reference module:** [`src/app/core/terrain.ts`](../../src/app/core/terrain.ts) implements the shared types, §1 transforms, grade conversion, §3 manifest validation, §2 grid/mask check, coverage, the §4 gate and §7 readiness, with synthetic-only tests in `terrain.spec.ts`. Import types from there instead of copying them. It is not imported by any UI and enables nothing.

---

## 1. Coordinate systems and transforms

### 1.1 Image space (unchanged, already shipped)

- Existing `Point { x, y }` in `image-pixels-bottom-left`: continuous coordinates, origin at the **bottom-left corner** of the image, `0 ≤ x ≤ width`, `0 ≤ y ≤ height` (see `validPoint`). Saved missions and exports keep this space. No coordinate migration.
- Active image `hirise-psp001752-red-center-2048-025m-v2`: 2048 × 2048, 0.25 m/pixel, CRS "Equirectangular MARS" (sphere radius 3 396 190 m, centre longitude 180°, centre latitude 0°, metres).

### 1.2 Image → projected metres (same CRS as the crop)

With `ulx = −2531487.0`, `ymin = −287315.75`, `s = 0.25`:

```
E = ulx  + x · s
N = ymin + y · s
```

Inverse: `x = (E − ulx) / s`, `y = (N − ymin) / s`. Check: `y = 0 → N = ymin`; `y = 2048 → N = −286803.75 = uly`.

These constants come from the image manifest/evidence file, not from code literals. A different image requires a new `imageRef`.

### 1.3 Terrain grid space

- The grid is described by a GDAL-order geotransform `[gt0, gt1, 0, gt3, 0, gt5]` **in the same CRS as the image** (`gt1 > 0`, `gt5 < 0`, no rotation terms; rotated/sheared grids are rejected in v1).
- Row 0 is the **northernmost** row (GDAL convention). Columns increase eastward.
- Each value is the elevation at the **cell centre**: cell `(col,row)` centre is at `E = gt0 + (col + 0.5)·gt1`, `N = gt3 + (row + 0.5)·gt5`.
- Projected → grid continuous index: `col = (E − gt0)/gt1 − 0.5`, `row = (N − gt3)/gt5 − 0.5`.
- If the DTM is in a different CRS, Enzo 1 reprojects **during reviewed extraction** (§6 of the runbook) into the image CRS. The runtime never reprojects.

### 1.4 Alignment tolerance **[source-dependent]**

Willy 2 reports control-point residuals (image feature ↔ grid hillshade) in metres. Proposed acceptance limit: RMS residual ≤ **1 grid cell** and max ≤ **2 grid cells**. Patrick confirms or changes this once native spacing is known. A grid that fails is `rejected`, never shifted by hand in runtime.

## 2. Grid format

| Item | v1 decision |
|---|---|
| Elevation file | `grid.f32`: raw IEEE-754 **Float32, little-endian**, row-major, `rows × cols` values, no header |
| Validity mask | `mask.u8`: Uint8 per cell, `1 = valid`, `0 = invalid`. Required, even when every cell is valid |
| Invalid cells | Must be `NaN` in `grid.f32` **and** `0` in the mask. Any disagreement = package `corrupt` |
| Parser safety cap | ≤ 4 194 304 cells (2048²) ≈ 16 MiB grid + 4 MiB mask. This is a **memory guard**, not the performance budget (runbook §6.4 budget still to agree) |
| Units | Horizontal metres; vertical metres **[source-dependent: reference copied verbatim from source label]** |
| Interpolation | None across invalid cells. No hole filling, no extrapolation beyond coverage in v1 |
| Resampling | Recorded in provenance (`nativeSpacingMeters`, `preparedSpacingMeters`, `resamplingMethod`). Prepared spacing must be ≥ native spacing (no fake upsampled detail) |

## 3. Package layout

```
data/terrain/<packageId>/
  terrain-manifest.json   # metadata below
  grid.f32
  mask.u8
  provenance.json         # extraction command, tool versions, source hashes (Enzo 1)
```

Active package pointer: `data/terrain/index.json` = `{ "schemaVersion": 1, "activePackageId": null | "<packageId>" }`. It ships with `null`. Only Patrick changes it, and only after acceptance.

`packageId` format: `terrain-<sourceProductId>-<imageRef>-v<n>` (lower case). Any change to bytes, transform or imageRef = new `packageId`.

`terrain-manifest.json` (fields map 1:1 onto Emma 2's `TerrainProductMetadata`):

```jsonc
{
  "schemaVersion": 1,
  "contractVersion": "terrain-v1",
  "packageId": "terrain-…-v1",
  "imageRef": "hirise-psp001752-red-center-2048-025m-v2",
  "productId": "…", "productVersion": "…",
  "source": { "title": "…", "url": "https://…", "credit": "…", "producer": "…", "licenseOrTerms": "…" },
  "acquisition": { "sourceStereoImageIds": ["…"], "acquisitionDates": ["…"], "processingHistory": "…" },
  "grid": { "cols": 0, "rows": 0, "geotransform": [0, 0, 0, 0, 0, 0], "crs": { /* same shape as image crs */ } },
  "horizontal": { "units": "meters", "nativeSpacingMeters": 0, "preparedSpacingMeters": 0, "resamplingMethod": "…" },
  "vertical": { "units": "meters", "datumOrReference": "…", "accuracyNote": "…" },
  "nodata": { "sourceNodataValue": "…", "missingPercent": 0 },
  "uncertainty": { "verticalUncertaintyMeters": null, "horizontalUncertaintyMeters": null, "limitations": ["…"] },
  "files": [
    { "path": "grid.f32", "bytes": 0, "sha256": "…" },
    { "path": "mask.u8",  "bytes": 0, "sha256": "…" },
    { "path": "provenance.json", "bytes": 0, "sha256": "…" }
  ],
  "admission": { "status": "pending-review", "reviewer": null, "decidedAtUtc": null, "evidenceRef": "docs/data/terrain-v2/ACCEPTANCE.md#…" }
}
```

Validation on load: every field type-checked like `validManifest`; `files[].bytes/sha256` checked against fetched bytes; `cols·rows·4 == grid.f32 bytes`, `cols·rows == mask.u8 bytes`; geotransform finite, `gt1 > 0`, `gt5 < 0`, zero rotation; grid footprint intersects the image footprint.

## 4. Admission states

Agreed by both Emma proposals: `'none' | 'proposed' | 'pending-review' | 'rejected' | 'accepted'`.

- The **only** authority is a coordinator entry in `docs/data/terrain-v2/ACCEPTANCE.md` (product, hashes, evidence, date). The runtime `admission` block mirrors it and is written by Patrick at integration.
- Runtime enables terrain routing only when **all** hold: `admission.status === 'accepted'`; `imageRef` equals the active image; every file's hash verified locally (§7); package not `corrupt`.
- Any client or file field such as `verified: true` / `claimedVerified` is **ignored** for gating (display only, labelled "claimed").
- Coverage display (`overlapWithActiveImage`: `full | partial | none | unverified`) is computed from the transform, not typed by hand.

## 5. Routing semantics

- **Graph:** 8-connected valid cell centres. An edge exists only if both endpoints are valid cells; diagonal edges additionally require both orthogonal neighbours valid (no corner cutting across nodata).
- **Endpoint snapping:** an image `Point` maps (§1.2–1.3) to the cell containing it. If outside the grid → `endpoint-outside-coverage`; if that cell is invalid → `endpoint-on-nodata`. No nearest-valid-cell search in v1. Snap distance (m) is returned.
- **Segment grade** (per edge): `atan(|Δz| / h)` in degrees, where `h` is the planar distance between cell centres (`preparedSpacing` or `√2·preparedSpacing`). It is a **sampled grid-segment grade, not local slope, not a traversability or safety rating.**
- **Constraint:** every edge grade ≤ `maxSegmentGradeDeg`. Canonical unit in requests/results is **degrees**. UI may display percent via `percent = 100·tan(deg)`; it converts before sending.
- **Objective:** minimise total sampled terrain-following length `Σ √(h² + Δz²)` subject to the constraint. A\* with planar-distance heuristic; deterministic tie-break (lower row, then lower col). Label in UI: "Shortest sampled path under the chosen grade cap". Never "safest" or "optimal".
- **Output path:** cell-centre vertices converted back to image `Point`s, start and destination replaced by the user's exact endpoints. Collinear vertices removed (exact collinearity only, no tolerance-based simplification that could skip a checked cell).
- **Metrics returned** (engine is the only source; UI never recomputes): `sampledDistanceMeters`, `maxSampledSegmentGradeDeg`, `vertexCount`, `cellsVisited`, `preparedSpacingMeters`, `snapDistanceMeters {start,destination}`, `missingInformation[]`.

> Correction for Emma 1: the proposal's defaults 15° and 25 % are different limits (15° ≈ 26.8 %; 25 % ≈ 14.0°). v1 keeps **one** default, 15°, labelled "experimental, not an established astronaut, suit or rover capability", and shows the percent equivalent.

## 6. Worker protocol

Module worker owned by Enzo 2 (`src/app/terrain/`). Grid/mask passed once per package as transferable `ArrayBuffer`s.

```ts
// main → worker
type TerrainWorkerRequest =
  | { type: 'load'; contractVersion: 'terrain-v1'; packageId: string; image: ImageGeoref; cols: number; rows: number;
      geotransform: readonly number[]; grid: ArrayBuffer; mask: ArrayBuffer }
  | { type: 'route'; contractVersion: 'terrain-v1'; requestId: string; packageId: string; imageRef: string;
      start: Point; destination: Point; maxSegmentGradeDeg: number }
  | { type: 'cancel'; requestId: string };

// worker → main
type TerrainWorkerResponse =
  | { type: 'loaded'; packageId: string }
  | { type: 'result'; requestId: string; packageId: string; imageRef: string;
      status: 'preview-ready'; path: Point[]; metrics: TerrainRouteMetrics }
  | { type: 'result'; requestId: string; packageId: string; imageRef: string;
      status: 'no-route' | 'cancelled' | 'error'; reasonCode: TerrainFailureCode; message: string | null };
```

- `image` on `load` (amendment proposed by the routing branch): the worker needs the image georeference to snap endpoints. Load failures reply `{ type: 'load-failed', packageId, message }`.
- `requestId`: UUID from `crypto.randomUUID()`. One active request; a new `route` implicitly cancels the previous one.
- Cancellation is cooperative: the worker checks for cancel at least every 10 000 node expansions and replies `cancelled`.
- **Stale guard (main thread):** a response is discarded and recorded as `stale-response` if its `requestId` is not the latest, or its `packageId`/`imageRef` differ from current state, or endpoints/grade changed since request. Emma 1's staleness reasons stay as specified.
- Search limit **[budget pending]**: worker aborts with `worker-error` + message `search-limit` above an agreed node-expansion/time cap.

### 6.1 Failure codes (frozen — identical in both Emma proposals)

| Code | Meaning in v1 |
|---|---|
| `no-terrain-package` | No package for active image |
| `terrain-not-accepted` | Package admission ≠ `accepted` |
| `image-ref-mismatch` | Package or request `imageRef` ≠ active image |
| `offline-pack-incomplete` | Package files not all present and hash-valid |
| `invalid-endpoints` | Missing, non-finite, identical or out-of-image endpoints |
| `endpoint-outside-coverage` | Endpoint maps outside the grid |
| `endpoint-on-nodata` | Endpoint cell invalid |
| `grade-limit-exceeded` | Start or destination cell has **no** outgoing edge within the cap (isolated at this limit) |
| `no-path-within-constraints` | Search exhausted without reaching destination |
| `cancelled` | User cancel or superseded request |
| `stale-response` | Main-thread guard discarded a result (never shown as an engine failure) |
| `worker-error` | Exception, search limit, or protocol violation |
| `unknown` | Anything else; must log the message |

All failures leave the manual route, saved mission and Notebook drafts untouched. UI always states that "no route" does not prove terrain is impassable.

### 6.2 Preview lifecycle

Emma 1's states are frozen: `'idle' | 'running' | 'preview-ready' | 'no-route' | 'cancelled' | 'error'`.

## 7. Offline package readiness

States (Emma 2's set): `'not-cached' | 'partial' | 'verified' | 'corrupt' | 'unavailable'`.

- `verified` only when **every** file in `terrain-manifest.json` is in the cache and its bytes and SHA-256 match. Manifest presence, `navigator.onLine` or a passing build never imply readiness.
- Terrain files are added to the existing offline pack (`tools/pwa/build-pack.mjs`) **only after** `accepted`. Raw DTM archives and `docs/` evidence are never deployed.
- **Replacement:** a new `packageId` is cached alongside the old one. The active pointer switches only after the new package is `verified`. On failure the old package stays active. Two package versions are never mixed. Old package removed only after a successful switch.
- A missing/corrupt package yields an honest unavailable state. No fallback to the AI relief GLB, image brightness or synthetic terrain.

## 8. Route acceptance adapter (Patrick, `src/app/core/`)

- Input: Emma 1's `TerrainPreviewAcceptPayload { requestId, imageRef, packageId }` for the current non-stale `preview-ready` result.
- Effect: one call `MissionService.replaceRouteFromSuggestion(path, provenance)` that pushes the current route onto undo history, then sets `Route { start, destination, waypoints }` from the path. **Does not save**; "Save route" stays manual.
- Provenance: mission envelope gains an **optional** `terrainSuggestion` field `{ contractVersion, packageId, requestId, maxSegmentGradeDeg, acceptedAtUtc }`. `schemaVersion` stays 1 (current `validEnvelope` ignores unknown keys, so older builds still import). Any manual edit after acceptance clears `terrainSuggestion`.
- Route assessment (`assessRoute`) continues to report planar distance; terrain metrics are shown only from the engine result alongside its provenance.

## 9. Ownership after freeze

| Area | Owner | Consumes |
|---|---|---|
| Source dossier, acceptance record | Gaddielle → Patrick | §3 fields |
| Extraction into §2/§3 files | Enzo 1 | §1.3, §2, §3 |
| Worker + routing tests | Enzo 2 | §5, §6 |
| Map overlay (coverage, path preview) | Willy 1 | §1, §6 results |
| Alignment checks | Willy 2 | §1.4 |
| Planner controls | Emma 1 | §5, §6 |
| Evidence view | Emma 2 | §3, §4, §7 |
| Loader, cache, adapter, integration | Patrick | §3, §4, §7, §8 |
| Offline/recovery QA | Royce | §7 |

## 10. Open questions for reviewers

1. **Enzo 2:** search cap and cancel granularity (§6) — propose numbers after a benchmark on a 2048² synthetic grid (tests only).
2. **Enzo 1:** confirm GDAL can emit §2 files with NaN + mask from the candidate DTM, and report native spacing.
3. **Willy 2:** confirm the §1.4 tolerance method and control-point count.
4. **Willy 1:** is a downsampled coverage/validity overlay needed, or is the footprint outline enough for v1?
5. **Royce:** byte budget for the terrain addition to the offline pack (current pack also carries the ~6.8 MB AI relief GLB).
6. **Emma 1/2:** accept the renames (`terrain-v1`, `maxSegmentGradeDeg`, single 15° default) before integration.

Reply using the runbook §9 handoff format. After all six are answered, Patrick changes the status line to **frozen** and records the commit SHA here.

## Implementation status (coordinator branch `claude/magical-volta-1c76ak`, 20 Nov)

| Section | Implemented in | Tests |
|---|---|---|
| §1–§4 types, transforms, manifest validation, gate | `src/app/core/terrain.ts` | `terrain.spec.ts` |
| §3/§4/§7 loader: pointer → manifest → byte/hash verification → gate; buffers for the worker | `src/app/core/terrain.service.ts` (started on demand, not at app startup) | `terrain.service.spec.ts` (6) |
| §7 offline pack: pointer always packed; package only when accepted with reviewer/date/evidence and hash-valid; build fails on anything else under `data/terrain/` | `tools/pwa/build-pack.mjs`, `angular.json` (ignore narrowed to the README) | `tools/pwa/terrain-pack.test.mjs` (6) |
| §8 acceptance adapter and `terrainSuggestion` provenance | `MissionService.replaceRouteFromSuggestion` | `mission.service.spec.ts` (5) |
| §5/§6 engine and worker | `feature/enzo-routing-worker-v2` (awaiting Enzo 2's review) | on that branch |

Not yet wired: no UI calls `TerrainService` or the adapter. With `activePackageId: null` the runtime is unchanged apart from one extra 50-byte packed file.

