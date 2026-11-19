# Planning V2 — Terrain Evidence View (`Emma Agent 2`)

**Branch:** `feature/emma-terrain-evidence-v2`  
**Base revision:** `origin/main` @ `78b7c69280ed9f1c87c00aedbf7e40456b2c408a` (`78b7c69`)  
**Worktree isolation:** Built in a separate clean checkout (`MARSWALK_emma2_terrain_evidence`); shared workspace untouched.  
**Contract proposal version:** `v1-proposal` (awaiting Patrick's `docs/planning/TERRAIN_CONTRACT_V1.md` freeze and Enzo 2's worker failure codes).

---

## 1. Proposed Metadata, Admission & Routing Failure Interfaces (for Patrick & Enzo 2)

Owned TypeScript definitions live in [`src/app/terrain-evidence/terrain-evidence.models.ts`](../../src/app/terrain-evidence/terrain-evidence.models.ts) and pure presenters in [`src/app/terrain-evidence/terrain-evidence.presenters.ts`](../../src/app/terrain-evidence/terrain-evidence.presenters.ts). No synthetic fixtures are shipped in production runtime bundles (all fixtures live strictly inside `terrain-evidence.component.spec.ts`).

### 1.1 Coordinator Admission Gate (`TerrainEvidenceState`)

| Raw `admission.status` | Coordinator fields required | Target `imageRef` check | Effective UI state | Anti-spoofing rule |
|---|---|---|---|---|
| `null` / `none` | — | Any | `No terrain package` (`none`) | Populated hashes, metadata fields, or `claimedVerified: true` **never** promote to accepted; shows explicit hash-is-not-acceptance notice. |
| `proposed` | Optional | Warn if != `activeImageRef` | `Proposed candidate (unreviewed)` | Cannot enable DEM preview; hash caveat shown if hashes/`claimedVerified` present. |
| `pending-review` | Optional | Warn if != `activeImageRef` | `Pending coordinator review` | Cannot enable DEM preview; hash caveat shown if hashes/`claimedVerified` present. |
| `rejected` | Reviewer/reason shown | Any | `Rejected package (not usable)` (`role="alert"`) | Surfaces coordinator rejection reason if supplied. |
| `accepted` | `reviewer`, `decidedAtUtc`, `evidenceRef` all non-empty | Missing any audit field | Downgraded to `Pending review (incomplete admission record)` | Prevents unsigned/spoofed acceptance flags from showing an accepted badge. |
| `accepted` | All 3 audit fields present | Matches `activeImageRef` (or unset) | `Accepted terrain package` | Explicitly states acceptance is for **experimental path preview only**, not EVA safety/trafficability. |
| `accepted` | All 3 audit fields present | Mismatch vs. `activeImageRef` | `Image mismatch (unaligned)` (`role="alert"`) | Refuses to claim alignment with the active orbital image. |

### 1.2 Proposed Product Metadata (`TerrainProductMetadata`)

Inputs rendered in collapsible native `<details>` disclosures (every `null`, blank, or `NaN` value renders `Unavailable (not supplied)`):

- **Identity & Source:** `packageId`, `productId`, `productVersion`, `imageRef`, `source.{title, url, credit, producer, licenseOrTerms}` (links validated strictly as credential-free `https:`; unsafe/credentialed URLs neutralized to plain text).
- **Acquisition:** `acquisition.{sourceStereoImageIds, acquisitionDates, processingHistory}`.
- **Horizontal Grid & Vertical Datum:** `horizontal.{crs, units, nativeSpacingMeters, preparedSpacingMeters, resamplingMethod}`, `vertical.{units, datumOrReference, accuracyNote}`.
- **Coverage & Registration:** `coverage.{summary, overlapWithActiveImage, boundsSummary}`, `registration.{status, method, residualSummary, toleranceSummary, evidenceRef}`.
- **Nodata, Uncertainty & Integrity:** `nodata.{nodataValue, missingPercent, policy}`, `uncertainty.{summary, verticalUncertaintyMeters, horizontalUncertaintyMeters, limitations}`, `integrity.{sourceSha256, preparedSha256, byteLength, offlinePackStatus, claimedVerified}`.

### 1.3 Provisional Routing Failure Reasons (`TerrainRoutingOutcome`)

Pending Enzo 2's contract, [`explainRoutingFailure`](../../src/app/terrain-evidence/terrain-evidence.presenters.ts) handles 13 reason codes (`no-terrain-package`, `terrain-not-accepted`, `image-ref-mismatch`, `offline-pack-incomplete`, `invalid-endpoints`, `endpoint-outside-coverage`, `endpoint-on-nodata`, `grade-limit-exceeded`, `no-path-within-constraints`, `cancelled`, `stale-response`, `worker-error`, `unknown`). Every unavailable outcome explains its specific cause and **explicitly states it does not prove Martian terrain is physically impassable**.

### 1.4 Separation from Non-Terrain Context (`TerrainContextSource`)

The third disclosure explicitly separates coarse USGS `SIM 3292` geology (`1:20M`), historical REMS rover measurements (not live weather), and illustrative `Pixal3D` 3D relief (not a measured DEM) from aligned terrain, and renders supplied `contextSources` without dropping any source title, credit, or limitation.

---

## 2. Selector & Coordinator Integration Suggestion

- **Component class:** `TerrainEvidenceComponent` (`ChangeDetectionStrategy.OnPush`)
- **Selector:** `<app-terrain-evidence />`
- **Import path:** `src/app/terrain-evidence/terrain-evidence.component`
- **Component inputs:** `[evidence]`, `[routingOutcome]`, `[activeImageRef]`, `[contextSources]`
- **Suggested mount location:** Coordinator (`Patrick`) mounts inside `Confidence & Data` panel (`app-confidence-panel` / `app.html` content slot alongside `app-exploration-confidence` and `app-image-passport`) once `TERRAIN_CONTRACT_V1.md` lands. Performs zero `MissionService`, `localStorage`, or network writes.

---

## 3. Unresolved Copy & Contract Questions

1. **For Patrick:** Should `TerrainAdmissionDecision` include a source manifest SHA-256 lock (`admittedPackageSha256`) so the UI can also detect post-admission grid drift? Should missing/incomplete coordinator audit fields downgrade `accepted` -> `pending-review` as implemented here?
2. **For Enzo 2:** Do the 13 `TerrainRoutingFailureCode` keys match your proposed worker failure enum, or should we alias specific solver error codes (e.g. timeout vs. memory cap)?
3. **For Emma 1 & Charles:** Do you prefer keeping `TerrainEvidenceComponent` disclosures collapsed by default inside `Confidence & Data` (consistent with `ImagePassportComponent`) or auto-expanding routing failure details only inside Emma 1's `terrain-planner` slot? Are existing `src/tokens.scss` tokens sufficient or do you want a shared badge utility class in Charles's Phase 2 polish pass?

---

## 4. Verification Results (Clean Tree)

### Automated Tests & Production Build

- **`npm test` (`ng test --watch=false`):** **30 / 30 files passed, 330 / 330 tests passed** (includes 22 new tests in `terrain-evidence.component.spec.ts` covering all admission states, anti-spoofing, image mismatch, `NaN`/missing metadata, HTTPS URL sanitization, all 13 routing failure codes, preserved non-terrain context sources, 128-char unbroken strings, keyboard `<details>` toggles, and zero `localStorage` calls).
- **`npm run build` (`node tools/pwa/build.mjs`):** **Passed** (`exit 0`, initial bundle `509.85 kB`, identical to baseline `origin/main`; **`terrain-evidence.component.scss` = `3,682 bytes`**, below the `4 kB` warning limit).
- **`npm run test:pwa` (`node --test tools/pwa/worker.test.mjs`):** **11 / 11 tests passed**.

### Browser Accessibility, Theme, Phone & 200% Zoom Checks (Temporary Local Harness)

Tested via headless Chrome (`playwright-core` on `http://127.0.0.1:4179/` serving temporary uncommitted mount in `app.html`, subsequently reverted before final commit):
- **Console / page errors:** `0` console errors, `0` page errors.
- **Horizontal overflow (`scrollWidth <= innerWidth`):**
  - `1280×800` Light (collapsed & expanded): `1280 / 1280` (`0` overflow)
  - `1280×800` Dark (expanded): `1280 / 1280` (`0` overflow)
  - `390×844` Phone Dark & Light (expanded, with 64-char unbroken SHA-256 & URLs): `390 / 390` (`0` overflow)
  - `640×400` (`200%` zoom simulation on 1280px): `640 / 640` (`0` overflow)
- **Keyboard disclosure & focus:** `Tab` focused `<summary>` (`:focus-visible` = `3px solid`), `Enter` opened `<details>` (`open === true`), `Space` closed `<details>` (`open === false`).
- **Measured text contrast (`135` rendered text elements per view, WCAG 4.5:1 normal / 3.0:1 large):** **`0` failures** across all 6 theme/viewport checks.
- *Note:* Headless Chrome viewport checks are not physical smartphone/tablet device certification or outside-user testing.

---

## 5. Runbook Section 9 Handoff Template

```text
Contributor / agent: Emma — Agent 2 (Terrain Evidence View)
Task and phase: Planning V2 — START HERE Do now checklist + UI component & QA contract proposal
Repository or fork: https://github.com/boscopatrick907-coder/NASA_SAPCEAPP_-MARS_WALK-.git
Branch: feature/emma-terrain-evidence-v2
Full commit SHA: <see git rev-parse HEAD / handoff summary>
Base revision: 78b7c69280ed9f1c87c00aedbf7e40456b2c408a
Changed files:
  - src/app/terrain-evidence/terrain-evidence.models.ts
  - src/app/terrain-evidence/terrain-evidence.presenters.ts
  - src/app/terrain-evidence/terrain-evidence.component.ts
  - src/app/terrain-evidence/terrain-evidence.component.html
  - src/app/terrain-evidence/terrain-evidence.component.scss
  - src/app/terrain-evidence/terrain-evidence.component.spec.ts
  - docs/qa/PLANNING_V2_EVIDENCE_UI.md
Implemented behavior / supplied artifacts:
  Standalone, read-only TerrainEvidenceComponent (app-terrain-evidence), proposed v1 metadata/admission/failure-code interfaces, anti-spoofing admission gate (hashes/claimedVerified/missing audit fields never promote to accepted), active imageRef alignment mismatch check, 13 provisional routing failure explanations with non-impassability disclaimers, HTTPS URL sanitization, preserved context sources separated from aligned DEM, and 22 unit tests.
Exact reproduction commands:
  npm ci
  npm test
  npm run build
  npm run test:pwa
Tests/checks actually run and results:
  - npm test: 30/30 files, 330/330 tests passed (including 22 new tests)
  - npm run build: passed (Initial 509.85 kB; terrain-evidence.component.scss 3,682 bytes < 4 kB)
  - npm run test:pwa: 11/11 passed
  - Temporary headless Chrome harness (1280x800, 390x844, 640x400/200% zoom, Dark/Light): 0 overflow, 0 contrast failures (135 elements), keyboard focus/Enter/Space verified, 0 console/page errors
Image / terrain package / offline pack IDs (if relevant):
  Synthetic test fixtures only (activeImageRef: hirise-psp001752-red-center-2048-025m-v2); no real DEM accepted yet
URL / browser / device (if actually tested):
  Local build http://127.0.0.1:4179/ in headless Chrome (not deployed; not physical device tested)
Evidence paths and file hashes:
  docs/qa/PLANNING_V2_EVIDENCE_UI.md and unit suite src/app/terrain-evidence/terrain-evidence.component.spec.ts
Pending inputs / blockers:
  - Coordinator freeze of docs/planning/TERRAIN_CONTRACT_V1.md (Patrick)
  - Worker failure code agreement (Enzo 2)
  - Styling/placement coordination with Emma 1 (terrain-planner) and Charles
  - Real DEM source inspection & acceptance dossier (Gaddielle -> Patrick)
Next owner and exact requested decision:
  Patrick: review and approve/adjust proposed TerrainEvidenceState / TerrainProductMetadata contract and admission rules;
  Enzo 2: confirm TerrainRoutingFailureCode enum;
  Emma 1 & Charles: confirm disclosure density and mount placement inside Confidence & Data.
```
