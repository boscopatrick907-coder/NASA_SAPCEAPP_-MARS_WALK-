# MARSWALK — Shared Coding-Agent Contract

> **18 November 2026 — active post-submission assignments:** [Planning V2](../planning/TEAM_PLANNING_V2.md). Follow the START HERE checklist in your personal brief. This supersedes old ownership/deadline queues below; existing v1 APIs and accepted work remain valid until explicitly changed by the reviewed V2 contract. No terrain API is accepted yet.

<!-- CURRENT_WORK_PLAN -->
> **Current work and status:** [canonical team plan](../../TEAM_TASKS.md). Distinguish main capabilities, verified feature branches and pending assignments; preserve completed work.
<!-- /CURRENT_WORK_PLAN -->

Read [SOUL.MD](../../SOUL.MD) before your role brief. It defines the real users, product scope and acceptance criteria. This document defines implementation ownership and shared APIs; it does not prove that future PWA or feature APIs already exist.

Read [REVIEW.md](../../REVIEW.md), [TEAM_TASKS.md](../../TEAM_TASKS.md) and the named person's brief before work. All eight published feature tips are integrated in **`b744b0b`**: **131 Angular tests, 28 data tests, production build and browser checks pass**. [Exact evidence](../qa/FINAL_BRANCH_INTEGRATION.md). Build warning overruns remain. Do not repeat accepted implementations or discard unseen local work.

## Status and ownership

**Remaining-work swap:** Enzo owns W3 verifier/science/environment/AI/presentation; Emma owns W4 shell/planner/notebook design/accessibility/deployment UI. Accepted authorship/history stays unchanged. Preserve and hand off any previous-task local progress before overlapping edits.

One shell-owned Leaflet image map, science discovery, confidence/passport, planner, draft-preserving notebook and guarded transfer are integrated. The optional flat viewer is lazy and destroyed on leaving its tab. R3 encoded/whitespace path validation is closed. Longla's submitted hardware report needs clarification; the PWA foundation now passes browser offline preparation/restart/update checks; physical launcher installation and public-host acceptance remain pending.

Use Angular standalone, strict TypeScript, plain SCSS/CSS and the existing MissionService. Leaflet uses `CRS.Simple` with bottom-left image pixels. Three.js stays exclusive to the optional viewer. No competing store, scaffold, backend or UI framework. Keep source imageRef, unavailable scale/terrain/positions and existing validation/persistence guards.

| Person | Current owned follow-up | Boundary |
| --- | --- | --- |
| Coordinator / YOU — W6 | Root/core/shared models, build/packages, worker/install/cache/update lifecycle and main integration | Define real API before consumers use it; verify complete required asset set |
| Willy — W1 | `public/manifest.webmanifest`, declared `public/icons/` assets, named QA handoff | Install assets only; root/index/worker wiring belongs to coordinator |
| Gaddielle — W2 | Source audit/small fixtures; after contract agreement `tools/data/prepare_environment.py`, tests and `public/data/environment.json` | R1–R3/release handoff complete; coordinator owns shared schema/loader/worker; Enzo owns UI |
| Enzo — W3 | Planned `src/app/offline/image-payload-verifier.ts`, its spec and named QA handoff | Pure read-only image-byte verification; no storage/network/worker/readiness UI |
| Emma — W4 | Shell/header/planner/notebook UI/tests/styles | Keyboard/ARIA/focus and size cleanup; preserve shared components/drafts/viewer teardown; no root/core/package rewrite |
| Longla — W5 | `docs/qa/PWA_ACCEPTANCE.md` and actual defect/evidence records | Clarify submitted report, test exact integrated build on real device; no teammate code edits |

Personal briefs authorize normal commits/pushes to their named feature branches; preserve existing progress/history. Proposed new branch names apply only when a follow-up has not started. Main integration follows the user's authorized coordinator workflow. Deployment, environment publication, submission and external messaging are separate.

## Emma Phase 2 styling exception

W4 Phase 1 `cdd2417` is integrated in `be4ac2b` with 144 tests/build/offline browser checks. Coordinator removed unused router bootstrap; initial 433.80 kB and style budgets pass. Emma may consume the existing PwaService contract now; its delivery is no longer a blocker.

Emma owns theme-only edits in `src/app/science/science-context.component.scss`, `src/app/evidence/exploration-confidence.component.scss` and `src/app/evidence/image-passport.component.scss`. Enzo retains their logic/templates/tests/data contracts. No root/core/worker/model ownership transfer. Coordinate any relocation of root PWA controls to keep one action surface. Environmental mounting awaits an accepted panel/data contract; other Phase 2 work can proceed independently.

## Full remaining-work plans and later ownership

Each named personal file now contains the complete ordered plan through deployment. The table above describes the current first slices; later ownership expands only at the explicit phase gates below. Preserve unfinished local work and do not run every phase at once.

- Gaddielle now investigates actual source samples/schema proposal, then after agreement owns proposed `tools/data/prepare_environment.py`, its data tests and `public/data/environment.json`, plus data provenance/release documentation. Source samples and coordinator-approved schema precede generated runtime data. No environmental schema/API currently exists.
- Coordinator owns new shared environmental types/loading/validation and all root/package/worker/hosting changes. Enzo later owns proposed `src/app/environment/` and science/evidence presentation, consuming the agreed implemented contract. No duplicate fetch/state store or invented service API.
- Enzo owns presentation/reference/AI-use/usability documents and optional proposed `public/data/science-explanations.json` after schema/content review. Gaddielle owns the underlying environmental data. Prepared AI-assisted explanations are labeled static/prepared; no claim of runtime inference or secret-bearing browser integration.
- Willy later owns map-release usability and deployed map/install asset checks. Emma owns professional shell/header/planner/notebook design and lifecycle presentation only through real coordinator APIs. Agree visual tokens; global/root changes stay coordinated.
- Longla's later optional WebXR experiment owns proposed `src/app/xr/`, agreed viewer adapters and QA; root/dependencies stay coordinator-owned. Unsupported hardware or failed actual session tests block an immersive-VR completion claim. Existing flat viewer stays lazy and functional.
- Coordinator owns deployment preparation, actual authorized deployment/rollback and submission coordination. Other owners verify their area on the exact deployed artifact. Documenting this plan does not publish/deploy/submit anything.

Consult [the release sequence](../../TEAM_TASKS.md#one-complete-remaining-work-file-per-person) and the personal file for exact files/checks/handoffs. Earlier task files describe individual slices and do not override the later explicitly gated personal phases.

## Accepted components and planned PWA contract

Willy's map/navigation/retry (`21cf6f0`, `02134f1`) and Emma's science/research/protocol/presentation/evidence workspace (`947ff1a`, `4efcb5a`, `3b7b1c1`) are complete. Enzo `16a2e66` is reconciled with main. Root initializes once; shell uses one each of `app-science-context`, `app-exploration-confidence` and `app-image-passport`. Do not duplicate these or reopen old root conflicts. Longla's corrected viewer is already merged.

W3's pure module is **planned, not yet implemented**: follow [ENZO_IMAGE_PAYLOAD_VERIFIER.md](tasks/ENZO_IMAGE_PAYLOAD_VERIFIER.md). It uses ImageManifest/runtime validation and an injected read-only cache reader, with an image-only result. No caller may assume it exists yet. W6 owns the remaining shell/science/cache/install checks and lifecycle API. MissionService has no install/cache/preparation/update API; use the separately implemented PwaService contract below. Do not invent signals or simulated readiness/progress.

The existing [image index](../data/IMAGE_PACK_INDEX.md) inventories manifest + prepared image only: **524,472 bytes**, excluding the index itself, science and built shell. It is not full PWA readiness. Its R3 closure and real `--check` pass are recorded with 28 data tests; source image/manifest/index bytes remain unchanged. W2 has completed the factual release-data handoff and now sources numerical environmental samples; W1 reviews coordinator-provided install assets; W6 has implemented the generated full-build worker contract. Future teammate deliveries still require review.

Next release gate: the complete prepared installed mission reopens disconnected on a real device, retaining route/observations and supporting essential image/science/export operations. Outside-user sessions use Emma's existing protocol after prerequisites; Enzo now maintains outcomes and presentation. No measured terrain, route-safety score, invented science pins or immersive VR is supplied.

## Implemented PWA lifecycle — available now

Coordinator implementation **`8a4dadc`** adds `src/app/core/pwa.service.ts` and root-owned `PwaPanelComponent`. MissionService remains unchanged. Import `PwaService` from core; consume signals read-only and use its actions, never set them from presentation:

```ts
type OfflineState = 'checking' | 'unsupported' | 'not-prepared' | 'preparing' | 'ready' | 'error';
// Signals: state(), online(), message(), progress() -> {completed,total}|null,
// version() -> string|null, totalBytes() -> number|null,
// updateAvailable(), canInstall().
// Async actions: initialize(), check(), prepare(), checkForUpdate(),
// applyUpdate(), install(); all return Promise<void>.
```

Initialization is idempotent; the root panel already calls it. It registers only in production on HTTPS/localhost. Connection is a separate hint, not readiness. `check()` verifies cache-only bytes, `prepare()` downloads/verifies the complete generated pack. Failure revokes ready; mission/drafts stay untouched. Actual install prompting is browser-dependent. Updates are fully prepared during installation before waiting; explicit apply asks to save/export and refuses multiple open app windows. No automatic reload while tabs remain open; normal activation after all close is safe because the pack already exists.

Emma may present these existing states in owned UI after coordinating removal/movement of the existing root panel to avoid duplicate controls; no root/worker rewrite. Enzo's pure `verifyImagePayload` remains planned and is not consumed yet: the worker already verifies the generated full-build byte contract, while his assigned API adds the separately specified browser image/manifest identity checks. Do not duplicate a worker or assume that future module exists. Future data/AI/VR assets need deliberate pack inclusion. [Architecture/evidence](../qa/PWA_FOUNDATION.md), [deployment](../DEPLOYMENT.md).

## Version 1 models

These interfaces are implemented in `src/app/core/models.ts`. The service is implemented in `src/app/core/mission.service.ts`. Extend them centrally when evidence requires it. The root calls the additional idempotent `initialize(): Promise<void>` method once. See [image handoff](../data/IMAGE_CONTRACT.md) for current data-loading behavior.

```ts
export interface Point { x: number; y: number }
export type Mode = 'inspect' | 'start' | 'destination' | 'waypoint';
export type LayerId = 'imagery' | 'markers' | 'grid' | 'coverage';
export interface Route {
  start: Point | null;
  destination: Point | null;
  waypoints: Point[];
}
export interface Source {
  title: string;
  url: string; // validated HTTPS URL
  credit: string;
}
export interface ImageManifest {
  schemaVersion: 1;
  imageRef: string; // changes when raster or coordinate interpretation changes
  assetPath: string; // local path relative to the deployed app base
  width: number;
  height: number;
  coordinateSystem: 'image-pixels-bottom-left';
  source: Source;
  observationDate: string | null;
  coverageStatus: 'regional-context' | 'verified-aoi';
  limitations: string[];
  calibration: {
    verified: boolean;
    metersPerPixel: number | null;
    sourceUrl: string | null;
    method: string | null;
  };
}
export interface ScienceMarker {
  id: string;
  name: string;
  imageRef: string;
  position: Point | null;
  positionStatus: 'verified' | 'illustrative' | 'unavailable';
  instrument: string | null;
  date: string | null;
  finding: string;
  evidenceType: 'measured' | 'derived' | 'interpreted' | 'simulated';
  source: Source;
  limitations: string[];
}
export interface Observation {
  id: string;
  imageRef: string;
  createdAt: string; // ISO timestamp
  text: string;
  position: Point | null;
}
export interface Assessment {
  planarDistanceMeters: number | null;
  distanceStatus: 'unavailable' | 'derived';
  terrainStatus: 'unavailable'; // v1 has no validated DEM contract
  warnings: string[];
}
```

`manifest.json` contains one `ImageManifest`; `markers.json` contains a `ScienceMarker[]`. If no verified source asset exists, do not fabricate a manifest or source. The application must show a data-unavailable state. Explicitly named test fixtures may be used in tests; they must not be presented as mission data.

## Coordinates and route behavior

- Origin is bottom-left of the prepared raster; x increases right and y increases up. Bounds are `0 <= x <= width`, `0 <= y <= height`.
- Leaflet conversion occurs only at the map boundary: `{x, y}` ↔ `[y, x]`. Bounds are `[[0, 0], [height, width]]`.
- A point in inspect mode makes no route change. Other modes replace start, replace destination, or append one waypoint.
- Ordered polyline points are the available start, ordered waypoints, then available destination. Distance is unavailable until both endpoints exist.
- Undo restores the previous route snapshot, including replaced endpoints; clear resets the route and can itself be undone. Loading a valid route resets undo history.
- Reject nonfinite/out-of-bounds points. Do not silently reinterpret saved positions for another image.
- Pixel distance is not meters. Enable derived planar distance only with a verified positive finite scale, HTTPS calibration source and nonempty documented method for the active raster. Sum Euclidean segment lengths and multiply by the scale. This does not enable slope or terrain distance.

## Shared MissionService API

Coordinator implements `src/app/core/mission.service.ts`. Expose readonly Angular signals with these names:

```ts
image: Signal<ImageManifest | null>;
markers: Signal<readonly ScienceMarker[]>;
route: Signal<Route>;
mode: Signal<Mode>;
layers: Signal<Readonly<Record<LayerId, boolean>>>;
selectedMarkerId: Signal<string | null>;
observations: Signal<readonly Observation[]>;
assessment: Signal<Assessment>;
canUndo: Signal<boolean>;
dataStatus: Signal<'loading' | 'ready' | 'unavailable' | 'error'>;
dataError: Signal<string | null>;

setMode(mode: Mode): void;
setLayer(id: LayerId, visible: boolean): void;
selectMarker(id: string | null): void;
applyMapPoint(point: Point): void;
undoRoute(): void;
clearRoute(): void;
saveRoute(): { ok: boolean; error?: string };
loadRoute(): { ok: boolean; error?: string };
addObservation(text: string, position: Point | null):
  { ok: boolean; error?: string };
exportMission(): void; // downloads versioned JSON, never pixel GeoJSON
importMission(raw: string): { ok: boolean; error?: string };
```

Use `inject(MissionService)` in components. Features must not mutate signal values, create competing state stores or read/write browser storage independently. Handle asynchronous data loading centrally and validate JSON before publishing state. Show loading/errors without crashing. Root assembly loads data once; rendering effects must not refetch it.

Mission transfer is now implemented in the root and shared service. `MAX_MISSION_IMPORT_BYTES` is exported from `mission.service.ts` (1 MiB of UTF-8 JSON). Import validates schema, exact imageRef, bounded coordinates and notes, then saves before publishing the replacement route/observations and clearing history. Failed validation or storage leaves current and saved work unchanged. Only route/notes are imported; trusted imagery/science/calibration and derived assessment stay local. Preserve the warning that import replaces current work and the explicit file-selection/import action when integrating Enzo's shell. See [guide improvements](../GUIDE_IMPROVEMENTS.md) and [transfer checks](../qa/MISSION_TRANSFER.md). This API does not prepare an offline cache.

## Storage, assessment and offline acceptance

- Persist versioned records with `imageRef`; validate type, coordinates and active reference before loading. Catch storage failures and expose actionable feedback.
- Whitespace-only notes fail validation; preserve user-entered text if saving fails. Render text through Angular interpolation.
- Every assessment includes missing terrain/coverage limitations. Never return a SAFE classification.
- Offline caching is production-only and follows the core workflow. Readiness means all required build/data assets are cached and verified, not simply worker registration.
- External citation links are not promised to work offline. Export includes schema version, active image reference, route, observations, provenance and assessment limitations.

## Required verification and report

Coordinator documents real commands after creating the app: frozen-lockfile install, noninteractive unit tests, production build and production serving/offline test. Never report nonexistent scripts as executed. Every feature agent runs the relevant existing checks and reports commands, outcomes, files changed, remaining blockers and one manual acceptance scenario. No tests are expected for documentation-only edits.

For learner sessions: inspect first, explain at most three unfamiliar concepts, propose one small slice and ask the learner to predict its behavior before the first substantive feature edit. Continue read-only investigation while waiting. Do not invent the learner's answer. After implementation, explain the data flow and ask for a small variation the learner can make.

## Environmental context — coordinator implementation available

src/app/core/environment.ts exports EnvironmentalContext/EnvironmentalReading/validEnvironmentalContext. EnvironmentService (environment.service.ts) exposes readonly context/status and initialize()/reload(). Root projects EnvironmentContextComponent once. [Exact admission/quality/source contract](../data/ENVIRONMENT_RUNTIME_CONTRACT.md). Current public/data/environment.json is pending metadata with zero readings, cached as a full-pack essential; no numerical source dataset accepted. Do not reuse mission metadata or internet signals as environmental review status. Enzo must not create a duplicate consumer/API while on navigation work. Original raw extraction and scientific admission remain Gaddielle/coordinator review gates.
