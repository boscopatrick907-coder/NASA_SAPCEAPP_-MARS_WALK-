# Planning V2 — independent alignment checks

Branch `feature/willy-terrain-alignment-qa-v2`. Prepared by the coordinator's coding agent for **Willy 2's slice; Willy 2 owns review, devices and later real-package checks.** These tests check `src/app/core/terrain.ts` and the map's Leaflet conversion. They don't implement the transform. Expected values come from `docs/data/evidence/CALIBRATED_CROP.json`, hand arithmetic and Leaflet itself.

**Scope:** synthetic grids only. **A synthetic pass does not establish real alignment.** Real control-point residuals stay pending until an accepted package exists.

## Runner

`tests/terrain-map/` uses its own Vitest config (jsdom, Angular JIT setup), separate from `ng test`:

```bash
npm run test:terrain-map
```

Result on 20 Nov 2026 (evening, after the image switch): **29 passed**. Earlier: after the A5-1/A5-2 core fix (before the fix: 22 passed, 2 expected-fail). `npm test` is unchanged at 325 passing (the new folder isn't included).

## Cases

| ID | Case | Expected | Observed | Tolerance | Evidence | Status |
|---|---|---|---|---|---|---|
| A0 | Evidence self-consistency: UL + 2048 × 0.25 = bounds; runtime manifest = evidence | equal | equal | exact | alignment.test.ts | pass |
| A1 | Image corners and centre ↔ projected | BL (−2531487, −287315.75), TR (−2530975, −286803.75), centre (−2531231, −287059.75) | equal, round-trip exact | exact | alignment.test.ts | pass |
| A2 | Cell centres: 4 image pixels per 1 m cell; cell (10,20) centre → image (42, 1966) | as stated | as stated | exact | alignment.test.ts | pass |
| A3 | Row inversion: image top-left → grid row 0; bottom-left → row 511 | as stated | as stated | exact | alignment.test.ts | pass |
| A4 | Crop offsets: DEM 10 m W / 20 m N → NW corner in cell (10,20); 2 m half-cell offset; partial 0.5; disjoint none | as stated | as stated | 1e-12 | alignment.test.ts | pass |
| A5 | Borders: interior boundaries go to the east/south cell; top edge y = H inside | as stated | as stated | exact | alignment.test.ts | pass (A5-2 fixed) |
| A5-1 | Right edge x = W and bottom edge y = 0 with an exactly covering grid | inside (last col/row) | inside after fix (was outside → `endpoint-outside-coverage`) | exact | alignment.test.ts | **pass (fixed)** |
| A6 | Mask index for a cell = row × cols + col, row 0 north | NW = 0, SW = 511·512 | equal | exact | alignment.test.ts | pass |
| A7 | Terrain for another imageRef, or no active image | `image-ref-mismatch` | equal | — | alignment.test.ts | pass |
| A8 | Legacy mission (old `hirise-mro-pia26306…` imageRef) rejected; current accepted; optional `terrainSuggestion` still imports | false / true / true | equal | — | alignment.test.ts | pass |
| A9 | Map chain: Leaflet `CRS.Simple` with `imageBounds` puts y = H at screen top; a click near the screen NW corner lands in grid row 0, col 0 | as stated | as stated | exact | alignment.test.ts | pass |
| A10 | Active ortho image + accepted package: valid/accepted, corners from evidence, full coverage, every image corner/edge on a valid cell, spacing ≈ 4 px, margin < 10 m | as stated | as stated | 1e-6 | alignment.test.ts | pass |
| R1a | Ortho-crop vs provider 1 m orthoimage (16 tiles) | RMS ≤ 1 cell, max ≤ 2 cells | 0.59 m / 0.73 m | draft §1.4 | REGISTRATION.md, evidence JSON | pass |
| R1b | ≥ 8 independent control points | RMS ≤ 1 cell (1.01 m), max ≤ 2 cells | **36 points, 0.20 m RMS, 0.36 m max** (stereo parallax between the two provider orthoimages); shaded-relief method inconclusive (7 and 2 points) | draft §1.4 | REGISTRATION.md §4, evidence/R1B_*.json | **pass** (done by the coordinator's agent because Willy 2 was unavailable) |
| D1 | Map pan/zoom/touch, endpoint selection, suggested vs accepted route on devices | — | — | — | — | **pending: no preview UI integrated** |

## Findings for Patrick / Willy 1

- **A5-1 (fixed on `claude/magical-volta-1c76ak`, merged here):** `validPoint` accepts `x = width` and `y = 0`, and the map clamps clicks to those edges. `containingCell` uses half-open cells, so with a grid that exactly covers the image those edge points fall outside. Suggested fix (contract §5, Patrick): if a point lies exactly on the grid's closing east or south edge, assign it to the last column/row. Applied as suggested; the two tests are now ordinary passing tests.
- **A5-2 (minor, fixed):** `containingCell` returned `row: -0` on the north edge. Now normalised with `+ 0`.
- **A10 (information):** the crop centre is at 4.84°S, 137.30°E (from the equirectangular inverse with R = 3 396 190 m, centre longitude 180°). With standard parallel 0°, east-west planar distances overstate ground distance by about 0.36 % at this latitude. That's within the "planar distance" caveat the app already shows, but the terrain UI shouldn't present metres to more precision than that.

## Next (Willy 2)

1. After a package is accepted: pick ≥ 8 independent control features, measure image vs hillshade positions, record residuals in metres and cells (R1).
2. Device runs with Royce: record exact source/pack/origin/device, and keep emulation separate from physical installs (D1).
