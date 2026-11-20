# Terrain routing — engine, worker and test matrix (Planning V2)

Branch `feature/enzo-routing-worker-v2`, based on the draft [terrain contract v1](../planning/TERRAIN_CONTRACT_V1.md) and the shared module `src/app/core/terrain.ts`. Prepared by the coordinator's coding agent for Enzo 2's slice; **Enzo 2 owns review and further changes** and may replace any part. Not wired into the app; no real terrain exists, so nothing is visible to users.

> If Enzo 2 already has unpublished routing work, compare it with this branch before choosing one. Don't merge both.

## Files

| File | Role |
|---|---|
| `src/app/terrain/routing.ts` | Pure A\* engine (§5), chunked generator for cancellation, `planRoute` sync wrapper |
| `src/app/terrain/protocol.ts` | Worker request/response types (§6) |
| `src/app/terrain/worker-host.ts` | Worker-side handling: load validation, implicit supersede, cooperative cancel between chunks |
| `src/app/terrain/terrain-routing.worker.ts` | 6-line Worker entry that wraps the host |
| `src/app/terrain/terrain-routing.client.ts` | Main-thread client: one active request, cancel, stale guard, crash handling |
| `src/app/terrain/routing.spec.ts` | Engine tests, including an independent O(n²) Dijkstra reference solver |
| `src/app/terrain/worker-lifecycle.spec.ts` | Host + client lifecycle tests through an in-process fake worker |

## Semantics implemented (contract §5)

- 8-connected valid cells; diagonals need both orthogonal neighbours valid (no corner cutting).
- Edge allowed only if `atan(|Δz|/run) ≤ maxSegmentGradeDeg`. Cost `√(run² + Δz²)`. Octile heuristic (admissible because every cost ≥ its planar run).
- Heap tie-break on `(f, cellIndex)`, so equal-cost choices favour lower row, then lower col. Same input gives the same output.
- Endpoints snap to their containing cell. No nearest-valid search. Snap distances are returned.
- Path = exact start, interior cell centres with exactly collinear vertices dropped, exact destination.
- Metrics come from the engine only: sampled distance, max sampled segment grade, vertex count, cells visited, spacing, snap distances, `missingInformation[]`.

## Result and reason codes

All 13 contract codes are in `TerrainFailureCode`. The engine and worker emit these:

| Situation | status | reasonCode |
|---|---|---|
| Missing/non-finite/out-of-image/identical endpoints; cap ≤ 0 or ≥ 90 | `no-route` | `invalid-endpoints` |
| Endpoint outside the grid | `no-route` | `endpoint-outside-coverage` |
| Endpoint cell invalid | `no-route` | `endpoint-on-nodata` |
| Start/destination has no edge within the cap | `no-route` | `grade-limit-exceeded` |
| Search exhausted | `no-route` | `no-path-within-constraints` |
| Cancel or superseded | `cancelled` | `cancelled` |
| Bad grid, exception, search cap, contract mismatch | `error` | `worker-error` |
| Route for a package that isn't loaded | `error` | `no-terrain-package` |
| Route `imageRef` ≠ loaded image | `error` | `image-ref-mismatch` |
| Result no longer matches client state | client event `stale` | (`stale-response`, never shown as a route) |

`terrain-not-accepted` and `offline-pack-incomplete` are raised before the worker, by `terrainGate()` in core.

**Contract amendment proposed:** the `load` message carries `image: ImageGeoref`, because the worker must convert image `Point`s to cells. Patrick should add it to §6 when freezing.

## Test matrix (all automated, synthetic grids in specs only)

| Case | Test |
|---|---|
| Flat grid, straight diagonal, collinear removal, exact endpoints | routing.spec |
| Ramp: terrain-following length and grade | routing.spec |
| Steep wall with a gap: detour, cap respected, equals reference solver | routing.spec |
| Nodata barrier, no gap | routing.spec |
| No diagonal corner cutting | routing.spec |
| Identical / NaN / out-of-image endpoints, cap 0 and 90 | routing.spec |
| Outside coverage, endpoint on nodata, bad grid dimensions | routing.spec |
| Isolated endpoint at the chosen cap | routing.spec |
| Both endpoints in one cell | routing.spec |
| 25 random grids with holes vs independent Dijkstra | routing.spec |
| Determinism | routing.spec |
| Chunk yields and search-limit abort | routing.spec |
| Load/route/preview; bad loads (size, contract, NaN/mask disagreement) | worker-lifecycle.spec |
| Unloaded package, wrong image | worker-lifecycle.spec |
| Cancel between chunks; newer request supersedes | worker-lifecycle.spec |
| Client: single result; stale on endpoint or grade change; latest of two wins; worker crash terminates | worker-lifecycle.spec |

Run: `npm test` → 32 files / 346 tests pass (21 new) on this branch, 20 Nov 2026. `npm run build` unchanged (module not imported).

## Benchmark (measured)

Node 22.23.5, Intel Xeon 2.10 GHz (4 vCPU cloud container), single thread, `planRoute` on 2048 × 2048 (4.19 M cells, the parser cap), corner to corner, 15° cap:

| Grid | Outcome | Cells expanded | Time |
|---|---|---|---|
| Flat | preview-ready | 2 048 | 55 ms |
| Random relief, 15 % nodata holes | preview-ready | 969 532 | 1 470 ms |
| Full-height nodata wall (unreachable) | no-path-within-constraints | all reachable (~2.1 M) | 3 107 ms |

**Memory (computed, not measured):** search arrays are 13 bytes/cell (Float64 cost + Int32 parent + Uint8 closed) ≈ 52 MiB at 2048², plus 20 MiB for grid + mask, plus heap growth. JS heap deltas don't capture typed-array memory, so that figure isn't reported. **Not measured:** phone/browser timings and real memory peaks. Those need Royce/Willy 2 on actual devices.

Suggested search cap for the contract: no cap is needed for correctness at 2048². A cap of ~4.2 M expansions (one full grid) only guards against bugs. Patrick sets the real budget with Enzo 1 and Royce once the package size is known.

## Not done here (needs others)

- Wiring `new Worker(new URL('./terrain-routing.worker', import.meta.url))` and a `tsconfig.worker.json` / `webWorkerTsConfig` in `angular.json`: coordinator integration. The worker file typechecks standalone with `lib: webworker`.
- Real-grid tests: need an accepted package.
- Device benchmarks.
