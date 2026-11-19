# Planning V2 — Experimental Terrain Path Planner UI (`Emma Agent 1`)

**Branch:** `feature/emma-terrain-planner-v2`  
**Base revision:** `origin/main` @ `78b7c69280ed9f1c87c00aedbf7e40456b2c408a` (`78b7c69`)  
**Worktree isolation:** Built in a separate clean checkout (`MARSWALK_emma1_terrain_planner`); shared `main` checkout and Emma 2's worktree untouched.  
**Contract proposal version:** `v1-proposal` (awaiting Patrick's `docs/planning/TERRAIN_CONTRACT_V1.md` freeze and Enzo 2's failure codes).

---

## 1. Interaction & State Specification (`src/app/terrain-planner/`)

### 1.1 State & Gate Matrix

| Component Area | Inputs / Conditions | Displayed State & Control Behavior | Boundary / Preservation Rule |
|---|---|---|---|
| **Terrain availability gate** | `terrain.status`: `'none'`, `'proposed'`, `'pending-review'`, `'rejected'`, `imageRef !== activeImageRef`, `offlineReady === false`, or missing `packageId`/`imageRef` | Disables **Request terrain preview**; displays distinct non-color badge (`No terrain package`, `Pending source review`, `Rejected terrain`, `Image mismatch`, `Offline pack incomplete`) | Only `status === 'accepted'` with matching `imageRef` and verified offline readiness enables requests |
| **Endpoints status** | `endpoints.start`, `endpoints.destination`, finite check | `Endpoints incomplete`, `Start missing`, `Destination missing`, `Identical endpoints`, or `Endpoints set` (`(x, y) px`) | Identical or missing endpoints keep **Request terrain preview** disabled |
| **Grade constraint** | `gradeUnit`: `'deg'` (`1–45°`, step `0.5`, default `15°`) default, or `'percent'` (`1–100%`, step `1`, default `25%`), overridable via `constraintConfig` | Native number `<input>` with unit label, **Reset default** button, `aria-invalid="true"` + `role="alert"` on empty/`NaN`/out-of-range | Explicitly states threshold is an **experimental grid-cell segment grade cap — not an established astronaut, suit, or rover capability** |
| **Request / Cancel** | `canRequest()` vs `preview.status === 'running'` | **Request terrain preview** emits `TerrainRouteRequestPayload`; during `'running'`, Request disables and **Cancel preview** emits `cancelPreview` | Emitting request or cancel never mutates manual routes or Notebook drafts |
| **Preview result** | `preview.status === 'preview-ready'` consuming `engineResult` only | **`Preview suggestion (not saved)`** badge; displays objective, sampled distance (`m`), max sampled segment grade, terrain resolution (`m/pixel`), suggested waypoints, and `missingInformation` list | Never computes competing distance/grade; missing/`NaN` renders `Unavailable (not supplied by engine)`; never labels routes "Safe" |
| **Stale guard** | Endpoints moved, `activeImageRef` changed, `packageId` changed, `terrain.status !== 'accepted'`, newer `requestId`, or grade/unit edited after preview | Switches badge to **`Stale preview — re-run required`**, lists exact staleness reasons (`role="alert"`), and disables **Accept preview route** | User can still click **Reject preview** to dismiss cleanly |
| **No route / Cancelled / Error** | `preview.status` in `{'no-route', 'cancelled', 'error'}` across 13 failure codes | Shows `reasonCode` badge, explanation, engine message, explicit non-impassability disclaimer | Explicit notice: **no route or failure never proves Martian terrain is physically impassable**; manual routes and Notebook drafts stay intact |
| **Accept / Reject** | Non-stale accepted preview vs dismiss | **Accept preview route** emits `TerrainPreviewAcceptPayload` to Patrick's adapter; **Reject preview** emits `TerrainPreviewActionPayload` | Explicit note that acceptance delegates replacement and **never saves automatically** (`Save Route` remains manual) |

---

## 2. Proposed API Inputs & Action Outputs (for Patrick, Enzo 2 & Willy 1)

Defined in [`src/app/terrain-planner/terrain-planner.models.ts`](../../src/app/terrain-planner/terrain-planner.models.ts) and [`src/app/terrain-planner/terrain-planner.helpers.ts`](../../src/app/terrain-planner/terrain-planner.helpers.ts):

- **Selector & Class:** `<app-terrain-planner />` (`TerrainPlannerComponent`, `ChangeDetectionStrategy.OnPush`, standalone)
- **Inputs:**
  - `terrain: TerrainAvailabilityInput | null`
  - `endpoints: TerrainEndpointsInput | null` (`start`, `destination`, `activeImageRef`, `manualRoutePointCount`)
  - `preview: TerrainPreviewState | null` (carries `status`, `requestId`, snapshot keys `resultForImageRef` / `resultForPackageId` / `resultForEndpoints` / `resultForMaxGrade` / `resultForGradeUnit`, `engineResult`, `reasonCode`, `engineMessage`)
  - `gradeUnit: TerrainGradeUnit` (`'deg'` default | `'percent'`)
  - `constraintConfig: Partial<TerrainConstraintConfig> | null`
- **Outputs:**
  - `requestPreview: TerrainRouteRequestPayload`
  - `cancelPreview: TerrainPreviewActionPayload`
  - `acceptPreview: TerrainPreviewAcceptPayload`
  - `rejectPreview: TerrainPreviewActionPayload`
- **Coordinator Mount Recommendation (Patrick):** Mount inside `Route Planner` tab (`app-route-planner` or sibling projection slot controlled by Patrick once `TERRAIN_CONTRACT_V1.md` lands), wired through Patrick's adapter to `MissionService`. Keep completely separate from `src/app/terrain-evidence/` (Emma 2).

---

## 3. SCSS File Ownership & Token Coordination (for Charles / Takou)

- **Exclusive Emma 1 stylesheet:** `src/app/terrain-planner/terrain-planner.component.scss` (**`3,862 bytes`**, below Angular's `4 kB` warning limit).
- **Zero shared edits:** Did not modify `src/tokens.scss`, `src/styles.scss`, `src/app/planner/route-planner.component.scss`, or any other owner's stylesheet. Reuses existing `src/tokens.scss` custom properties (`--bg-card`, `--bg-surface`, `--border-subtle`, `--border-control`, `--border-focus`, `--mars-accent`, `--on-accent`, `--font-sans`, `--font-heading`, `--font-numeric`, `--touch-target-min`). Local `:host` badge foreground variables (`--tp-caution-fg`, `--tp-ok-fg`, `--tp-err-fg`) mirror `exploration-confidence` / `terrain-evidence` patterns so both themes maintain WCAG AA contrast.

---

## 4. Verification Results (Clean Tree)

### Automated Tests & Production Build

- **`npm test` (`ng test --watch=false`):** **30 / 30 files passed, 321 / 321 tests passed** (includes `13` tests in `terrain-planner.component.spec.ts`, covering parameterized terrain gates and failure codes, grade constraint bounds, `requestPreview`/`cancelPreview`/`acceptPreview`/`rejectPreview`, engine metrics & `NaN` fallback, staleness guards, host sibling Notebook draft & route preservation, and zero `localStorage` calls).
- **`npm run build` (`node tools/pwa/build.mjs`):** **Passed** (`exit 0`, initial bundle `509.85 kB`, matching `origin/main`; **`terrain-planner.component.scss` = `3,862 bytes`**, zero new `anyComponentStyle` warnings).
- **`npm run test:pwa` (`node --test tools/pwa/worker.test.mjs`):** **11 / 11 tests passed**.

### Browser Accessibility, Responsive, Theme & Draft-Preservation Checks (Temporary Local Harness)

Tested via headless Chrome (`playwright-core` against `http://127.0.0.1:4181/` serving a temporary uncommitted mount in `app.ts`/`app.html`, cleanly reverted prior to commit):
- **Console / page errors:** `0` console errors, `0` page errors.
- **Horizontal overflow (`scrollWidth <= innerWidth`):** `0` overflow at **`1280×800`** (Dark & Light), **`820×1180`** (Tablet Light), **`390×844`** (Phone Dark & Light), and **`640×400`** (`200%` zoom simulation).
- **WCAG contrast (`34` rendered text elements in component):** **`0` failures** across all 6 viewport/theme runs (`>= 4.5:1` normal, `>= 3.0:1` large).
- **Keyboard & ARIA validation:** Entering `99` set `aria-invalid="true"`; pressing `Tab` from `#tp-grade-input` onto `Request terrain preview` matched `:focus-visible` with `outlineStyle: solid`, `outlineWidth: 3px`.
- **Workflow & draft preservation:** Typed an unsaved observation into the real **Notebook** tab, switched to the tab hosting `<app-terrain-planner>`, ran invalid-grade / request / reject / preview transitions, switched back to **Notebook**, and confirmed the exact unsaved draft text remained preserved.
- *Note:* Headless Chrome viewport checks are not physical smartphone/tablet device certification or outside-user testing.

---

## 5. Runbook Section 9 Handoff Template

```text
Contributor / agent: Emma — Agent 1 (Terrain Planning Controls)
Task and phase: Planning V2 — START HERE Do now checklist + interaction spec + component shell
Repository or fork: https://github.com/boscopatrick907-coder/NASA_SAPCEAPP_-MARS_WALK-.git
Branch: feature/emma-terrain-planner-v2
Full commit SHA: <see git rev-parse HEAD / handoff summary>
Base revision: 78b7c69280ed9f1c87c00aedbf7e40456b2c408a
Changed files:
  - src/app/terrain-planner/terrain-planner.models.ts
  - src/app/terrain-planner/terrain-planner.helpers.ts
  - src/app/terrain-planner/terrain-planner.component.ts
  - src/app/terrain-planner/terrain-planner.component.html
  - src/app/terrain-planner/terrain-planner.component.scss
  - src/app/terrain-planner/terrain-planner.component.spec.ts
  - docs/qa/PLANNING_V2_UI.md
Implemented behavior / supplied artifacts:
  Standalone experimental TerrainPlannerComponent (app-terrain-planner), proposed Contract v1 inputs/outputs, endpoint & experimental grade constraint validation (degrees default + configurable percent), Request/Cancel/Accept/Reject actions, staleness invalidation guard, engine-only metric display without safety/impassability claims, 13 provisional failure explanations preserving manual routes and Notebook drafts, and 13 comprehensive unit tests using synthetic fixtures confined to specs.
Exact reproduction commands:
  git fetch origin && git checkout feature/emma-terrain-planner-v2
  npm ci && npm test && npm run build && npm run test:pwa
Tests/checks actually run and results:
  - npm test: 30/30 files, 321/321 tests passed (13 new)
  - npm run build: passed (Initial 509.85 kB; terrain-planner.component.scss = 3,862 bytes < 4 kB)
  - npm run test:pwa: 11/11 passed
  - Temporary headless Chrome harness (1280x800, 820x1180, 390x844, 640x400/200% zoom, Dark/Light): 0 overflow, 0 contrast failures (34 elements), Tab focus-visible 3px solid verified, aria-invalid verified, live Notebook draft preservation verified, 0 console/page errors
Image / terrain package / offline pack IDs (if relevant):
  Synthetic test fixtures only (activeImageRef: hirise-psp001752-red-center-2048-025m-v2); no real DEM accepted yet
URL / browser / device (if actually tested):
  Local build http://127.0.0.1:4181/ in headless Chrome (not deployed; physical device testing pending)
Evidence paths and file hashes:
  docs/qa/PLANNING_V2_UI.md and src/app/terrain-planner/terrain-planner.component.spec.ts
Pending inputs / blockers:
  - Freeze of docs/planning/TERRAIN_CONTRACT_V1.md and Coordinator route acceptance adapter (Patrick)
  - Confirmation of TerrainRoutingFailureCode & request/cancel engine types (Enzo 2)
  - Preview overlay coordination when preview-ready / rejected / stale (Willy 1)
  - Shared SCSS polish agreement before final Phase 2 styling (Charles)
Next owner and exact requested decision:
  Patrick: review/approve proposed TerrainAvailabilityInput, TerrainEndpointsInput, TerrainPreviewState, and output action payloads in docs/qa/PLANNING_V2_UI.md;
  Enzo 2: confirm failure enum + engineResult fields (including whether gradeUnit prefers 'deg' or 'percent');
  Willy 1 & Charles: confirm overlay trigger alignment and shared CSS token conventions.
```
