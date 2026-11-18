# Enzo — Agent 1: reproducible terrain preparation

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/main` and create your own feature branch from current main, unless Patrick specifies a newer reviewed development base. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. These instructions are published on main; implementation stays on your feature branch.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** `feature/enzo-terrain-preparation-v2`.

- [ ] **Do now:** propose the input/output contract in `docs/data/TERRAIN_PREPARATION.md` and implement synthetic-data inspection tests under `tools/terrain/`. Agree with Patrick on affine, cell-centre convention, spacing, grid format and vertical reference before generating a runtime package.
- [ ] Consume Gaddielle's exact source inventory after Patrick approves it. Inspect with GDAL; stop scientific export if elevation units/datum, CRS, coverage or registration evidence are unresolved. Produce a diagnostic report instead of inventing missing values.
- [ ] Implement a reproducible crop/extraction command. Preserve nodata; explicitly record resampling and native/output resolution. Reject bad input with nonzero exit and preserve existing output files.
- [ ] Produce a **compact study-area package** in a staging directory supplied by Patrick: display imagery, elevation grid, validity mask (embedded or separate per contract), package manifest, hashes and provenance. Original large DEM/JP2 archives stay outside deployed assets. No arbitrary downsampling to hit a size target; document lost detail and get it reviewed.
- [ ] Report compressed/uncompressed bytes, native/prepared spacing, coverage and expected runtime memory. Patrick sets the package size/performance budget with Willy/Royce before final preparation. Do not place staged data in `public/` until accepted.
- [ ] Test flat/ramp/nodata grids, partial coverage, bad units/CRS, malformed dimensions, interrupted output and reproducibility. First submit tooling with labelled synthetic tests; then a separate real-data extraction handoff.
- [ ] **Done:** Patrick reproduces the extraction, validates alignment and accepts package contents; Royce receives exact files for offline checks. A successful script run alone is not source acceptance.

**Send to Patrick:** commands, GDAL/tool versions, source and output hashes, staging paths, sizes, tests, branch/full SHA. Offline cache/worker integration belongs to Patrick; do not edit that implementation.


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. The assignments are published on main; `science/planning-v2` remains a development branch. Publishing instructions does not enable terrain features or establish a deployed revision. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own new `tools/terrain/` preparation scripts/tests and `docs/data/TERRAIN_PREPARATION.md`. Gaddielle owns source inventory; Patrick owns scientific acceptance and shared contracts. Do not overwrite existing scientific source files or expected hashes.

1. Propose the extraction interface with Patrick: source path, exact crop/extent, target grid, output folder and explicit vertical/horizontal units. Document pixel-centre and row-direction conventions, CRS/affine and imageRef.
2. Implement reproducible inspection/extraction using installed GDAL where practical. Preserve nodata; never fill unknown elevation or derive it from brightness/AI meshes. Resampling choice and native versus output spacing must be recorded.
3. Emit prepared grid plus provenance: source/derivative hashes, exact commands/tool versions, CRS, bounds, vertical reference, masks, spacing and transformation evidence. Unknown vertical reference blocks acceptance.
4. Validate bounds, data size, finite values, overlap and expected output dimensions. Invalid input must return nonzero and preserve any existing output; use temporary outputs and atomic replacement only after validation.
5. Test synthetic flat/ramp/nodata fixtures, incompatible CRS/units, partial coverage and output failures. Label fixtures as synthetic. Run actual-source extraction only after Patrick accepts the source and contract.

Start now on tooling/tests; no runtime DEM delivery is accepted yet. Hand off an inspection/tooling commit before the real-data package.

---

## Historical assignments and review records — superseded queue

# Enzo — Remaining verification, science, AI and presentation work

## Latest submission decision — read before resuming

REMS 99dc2d5 is now retained in main as an archived, reproducible source delivery (1a59251); sample/label/hash checks pass. It does not replace limited runtime weather or establish map positions/quality approval. Comparison already accepted. Do not duplicate either; next review should document confidence-code interpretation and qualification before any runtime adapter.


## ACTIVE — final 90-minute survival-planning release

Hand off 99dc2d5 REMS source/extractor/tests/quality and spatial limits. No unreviewed runtime integration. Comparison e68e734 is now accepted and integrated as 73be9d1; do not reimplement it. Its checks and remaining source-review boundary are recorded in docs/qa/SOURCE_LIBRARY_AND_COMPARISON.md. Do not start another data search.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## NEXT ACTIVE SLICE — source evidence comparison (location clarity complete)

Your 8855a2e and navigation 2b2a708 are accepted in b721269. Do not repeat navigation or location-label cleanup. Preserve local progress and safely incorporate main on your existing science branch.

**Outcome:** help users compare NASA science evidence relevant to their mission question without claiming the records are co-located. In your owned science component TS/HTML/tests, add an optional Compare evidence mode with at most two locally chosen record IDs. This is view state only, not a new mission store or route selection. Provide native add/remove comparison buttons with explicit accessible names; choosing comparison must not call selectMarker, set route points or change existing active selection. Keep full original finding text, evidence classification, instrument/date, source/credit, limitations and position status for each record in a readable stacked layout. Do not generate an AI synopsis, mineral measurements, proximity ranking or a recommendation about a safe route.

Show clearly when evidence is regional/unlocated, illustrative or verified on the current raster. A comparison means scientific context, not two route destinations. If filters hide a compared record retain it with an explanation; if the underlying record is removed, remove its comparison entry safely and announce it. Never silently replace it with another. Disable further additions at two entries, keep remove/clear actions obvious and preserve current search/navigation. Use existing classes; Emma retains SCSS theme ownership. If spacing needs a new class, send a concrete small style handoff rather than editing another owner's file.

Tests: first/second/third additions and bounds, duplicate add, remove/clear, filter-hidden versus source-removed records, source URL/text safety, keyboard/native controls, unchanged route/notes/mode/layers/selected marker and no storage calls. Run integrated npm test/build and actual comparison/filter workflow on a local served production build; identify public versus local revision honestly. Record checks in a response/branch handoff; Agent 2 presentation/QA files remain exclusive. Push same branch for review. No new data model, pins, environment loader, clipboard or Notebook mutation. Limit to one focused two-hour slice, then stop for review.

## Latest team integration check

Your 8855a2e location-clarity change is accepted; no repeat navigation/copy task. Preserve work and safely incorporate main. Next verify actual selected-record provenance/location labels with the mission briefing on the next candidate; any spatial mapping requires reviewed raster identity/coordinates. Agent 2 source explanations remain a different review. [Checks and limits](../qa/TEAM_SUBMISSION_CHECK.md).

> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Agent 1 priority now — location-aware science presentation

Navigation 2b2a708 is accepted/integrated/public; do not repeat it. Next audit science details for the actual map decision: distinguish measured/derived/interpreted claims and verified/illustrative/unavailable positions, and explain regional records cannot be treated as route stops. Own science TS/HTML/tests; Emma owns its SCSS. Use current models/signals; do not invent target coordinates, add unverified pins or mutate notes/routes to represent a visit.

If a supported point is delivered later, require exact raster imageRef/position provenance and coordinator acceptance before map linking. Until then improve only concrete confusing copy/accessibility states found in the candidate; coordinate briefing text with Emma 2 without duplicating the mission guide. Test filter/navigation/selection and unchanged mission state. No duplicate environment loader/component, new map distance service or speculative API. Agent 2 owns scientific explanations/presentation and its source mapping.

## Current PUBLIC candidate — 38516f8

Use **https://marswalk-pfoqdsf41-boys-band.vercel.app/**. No Vercel login or access-request approval needed. [Exact capabilities, tests and data caveats](../qa/PUBLIC_SCIENCE_PREVIEW.md). Includes Emma UI, accepted science navigation and limited contributor-supplied REMS excerpt summaries; do not call them independently authenticated NASA data or full-day weather. Supersedes older preview URLs for new assigned testing/screenshots. Preserve personal exports before changing origins; saved missions are origin-specific. Existing production URL remains older. Physical/user acceptance and submission still need actual evidence.

## Science navigation accepted — 2b2a708

Your Previous/Next submission passes review and combined checks (223 Angular tests/build). No repeat implementation needed. Safely incorporate main preserving work; next verify keyboard/bounded/filtered navigation on the designated public candidate and report exact revision/results. Coordinator supplies the environment loader/panel; do not create a duplicate. Agent 2 source-explanation corrections remain separate.

## Two-agent split — current ownership

**Agent 1 (this file):** confidence/evidence content simplification, existing science/environment UI tasks only when agreed data APIs exist. Preserve the accepted verifier. Emma owns the three shared SCSS theme fixes. Do not edit the presentation/usability documents assigned below while Agent 2 works.

**Agent 2:** follow [ENZO 2.md](<ENZO 2.md>) for presentation, demonstration, judges' answers, references/AI attribution and actual usability results. Those named Phase 3/4 documentation files are exclusively delegated to Agent 2 for this slice; Agent 1's later checklist does not authorize overlapping edits. Use separate checkouts/branches, preserve unpublished work and reconcile only through coordinator review. No runtime AI, speculative environmental API or independent deployment is assigned.

## Current task — evidence clarity completed centrally; science navigation next

The user authorized coordinator completion of your evidence-content slice. Confidence now shows route guidance first, rounds only displayed coordinates, and collapses detailed warnings; passport keeps source visible and technical details expandable. Emma's SCSS is untouched. **194 integrated tests/build and local production-browser/offline recovery pass**; [handoff](../qa/COORDINATOR_EVIDENCE_CLARITY.md). Do not repeat this implementation or the accepted verifier correction. Preserve unpublished work and safely incorporate published main before new edits; report any overlapping local changes instead of discarding them.

### Agent 1 next slice — contextual-science record navigation

Own only `src/app/science/science-context.component.ts`, `.html` and `.spec.ts` for this slice. Emma retains its SCSS; Agent 2 retains presentation/usability documents. Continue an existing branch containing your work; if none exists for this new slice, use `feature/enzo-science-navigation` from current main. Do not reset/force-push or change another agent's checkout.

Add clearly labeled native **Previous science record** / **Next science record** controls beside the selected detail, using the current filtered order and existing MissionService.selectMarker. Compute index/availability from signals; no stored duplicate counter or new core API. Disable at the first/last item (no wrap). Before a record is selected, keep the existing selection prompt. If filters hide the selected record, retain its details and existing explanation; disable navigation until it belongs to the filtered list again. Never automatically choose another record when filters/records change. A single matching record disables both directions. Existing removed-selection behavior remains safe.

Use native buttons with accessible names and existing style classes/tokens; no custom global shortcuts or interference with search/input typing. Add a concise accessible position indication, e.g. “Record 2 of 3 matching records”, distinguishing filtered navigation position from the existing total/located badge. Preserve full findings/source links, zero located positions and safe text rendering. Do not invent coordinates, shorten scientific content or create observations automatically.

Test actual navigation order, first/last/single bounds, changing filters/hidden selection, record removal, and unchanged mission route/notes/mode/layers. Verify keyboard activation and narrow layout in a browser when your installation works. Run full npm test and npm run build; record local dependency blockers honestly rather than changing lockfile versions. If Windows stays blocked, push reviewed source/tests with exact unrun checks for coordinator verification. Final handoff: branch/commit, files, actual results and remaining blockers. No new assignment MD or edits to Agent 2 documents needed; keep the handoff in your response for coordinator reconciliation.

## Byte-verification compatibility handoff

Coordinator added repository-controlled LF attributes for scientific JSON without changing canonical data or hashes. Root and `/marswalk/` builds, including pack verification, pass. See [Windows LF instructions and evidence](../qa/PWA_INSTALL_ASSETS.md#windows-lf-compatibility--coordinator-fix-15-november-2026). Preserve local work and refresh only clean affected files after incorporating main; no global Git changes or data regeneration. Enzo/Willy should rerun their own Windows build verification before claiming that handoff complete. Gaddielle should retain canonical LF in future scientific JSON deliveries; her environmental-data corrections remain a separate pending task.

> Current work piece: [W3](../../TEAM_TASKS.md#w3).

Updated **15 November 2026**. This is your **single remaining-work checklist through deployment and final handoff**. The current tested application is `b744b0b`, published with documentation at `27b1171`: 131 Angular tests, 28 data tests/build/browser checks passed. Those are historical baseline results, not checks of the future work below. [Integration evidence](../qa/FINAL_BRANCH_INTEGRATION.md).

All unchecked items below are **planned**, not claims of implementation. Keep completed work and unseen local progress. Finish or hand off your current slice before switching. Read [the team plan](../../TEAM_TASKS.md), [shared contracts](CODING_AGENTS.md) and [product charter](../../SOUL.MD). This personal file contains the full sequence; earlier files under `tasks/` remain detailed reference specifications for their named slices.

## Styling ownership clarification

Emma now owns **styling only** in `science-context.component.scss`, `exploration-confidence.component.scss` and `image-passport.component.scss` to resolve fixed dark cards in light mode. You retain those components' TS/HTML/tests/scientific logic and the environment UI contract. Coordinate shared tokens; avoid concurrent edits to those three SCSS files. Your assigned verifier/environment/source-dependent work is unchanged.

## Public host is ready for your acceptance checks

Use **https://marswalk-jet.vercel.app/**, deployed source `b6669fb`. Actual public browser preparation, offline full-process restart, route/note recovery/export and deferred flat 3D pass. [Evidence](../qa/VERCEL_PRODUCTION.md), [runbook](../VERCEL_SETUP.md). Target-device home-screen/standalone acceptance still needs actual observations; do not copy the browser pass as physical evidence. Automatic GitHub deployment is not connected, so a new main commit is not necessarily live until the coordinator deploys it.

## Coordinator PWA delivery — current handoff

**`8a4dadc`** supplies production worker/full-pack verification, real PwaService state/actions, root lifecycle controls, manifest/icons and update handling. **136 Angular tests, 11 worker tests, 28 data tests/build/browser offline restart/update checks pass**. [Evidence](../qa/PWA_FOUNDATION.md), [deployment runbook](../DEPLOYMENT.md), [actual lifecycle API](CODING_AGENTS.md#implemented-pwa-lifecycle--available-now). Physical home-screen installation and public hosting still need validation. Existing 131-test statements below are historical baseline counts.

Your pure image verifier remains an assigned new module; do not recreate the worker. Preserve the exact planned API/identity checks. Environmental/science/AI/presentation follow-ups and the assignment swap remain in force.

## Assignment swap and handoff

The user swapped **remaining** Emma/Enzo assignments on 15 November 2026. Completed work, original authorship and accepted branch names stay unchanged. Preserve any unpublished progress on the previous assignment and hand off its actual commit/files/blockers through the coordinator before overlapping edits. Keep existing task branches/history if work already exists; new branch defaults below apply only when starting fresh. This assignment changes ownership, not application code or deployment status.

## Already complete — preserve

Your shell/planner/notebook `16a2e66` remains accepted and credited to you; root conflicts are resolved. Emma's research/records/citations, usability protocol, presentation draft, science UI `4efcb5a` and evidence workspace `3b7b1c1` remain accepted and credited to him. You now take the remaining verifier, environmental/science/evidence UI, AI explanation and presentation work. Emma takes shell/planner/notebook accessibility, professional design and deployment UI verification. Preserve existing components; no rebuilding the science audit, shell or foundation.

## Phase 1 — Pure image-payload verifier, current task first

Use **`feature/enzo-image-payload-verifier`** if no task exists. Own only `src/app/offline/image-payload-verifier.ts`, its spec and `docs/qa/IMAGE_PAYLOAD_VERIFIER.md` for this slice. Implement this planned API:

```ts
export type ReadAssetBytes = (path: string) => Promise<Uint8Array | null>;
export interface ImagePayloadResult {
  readonly scope: 'image-payload'; readonly ok: boolean;
  readonly imageRef: string | null;
  readonly verifiedPaths: readonly string[];
  readonly totalBytes: number | null;
  readonly errors: readonly string[];
}
export function verifyImagePayload(
  index: unknown, activeImage: ImageManifest, readBytes: ReadAssetBytes,
): Promise<ImagePayloadResult>;
```

- [ ] Validate active manifest with existing `validManifest`, then index **before reader calls**. Exact v1 root keys: schemaVersion/imageRef/files/totalBytes; schemaVersion integer 1, matching reference. Exactly two ordered entries: `data/manifest.json`, then active assetPath; only path/bytes/sha256 keys, positive safe-integer sizes/sum, lowercase 64-hex digests. Reject unsafe/extra/missing/wrong-type/reference/path entries.
- [ ] Injected reader is cache-only. No fetch, stores, worker, MissionService initialization/mutation or root mounting. Verify byte lengths and actual WebCrypto SHA-256; missing/read/crypto/size/digest failures return useful failure, never silent fallback.
- [ ] Strict UTF-8/JSON manifest bytes must satisfy runtime validation and match active reference/path/coordinate system/width/height. Do not mutate inputs or decode pixels in this module.
- [ ] Success: true, two paths in order, actual summed bytes, empty errors. Failure: false, no verified paths, null totalBytes, nonempty errors; expose imageRef only if active manifest is valid. Catch operational failures.
- [ ] Meaningful success/invalid index/pre-read rejection/missing/corrupt/read/crypto/identity tests and actual browser WebCrypto proof. No package/core/source/Python changes. Explain that this verifies image bytes against the supplied index, not scientific validity, signature or full PWA readiness.

## Phase 2 — Numerical science UI and clearer evidence

After handoff use **`feature/enzo-environment-evidence`** if no task exists. Own proposed `src/app/environment/`, science/evidence UI and tests plus `docs/qa/ENVIRONMENT_CONTEXT.md`. Coordinator owns shared environmental model/loading and root/shell integration; Gaddielle owns source/generated data.

- [ ] While waiting for agreed data contract, prepare display examples and factual presentation text. Do not import imaginary service APIs or populate public data with placeholder measurements.
- [ ] After contract/data acceptance, show quantity value/unit, measured/derived/assumed classification, instrument, observation interval/sol/location when supported, source and quality/missing state. Label historical regional context clearly. Charts/statistics require actual samples and stated aggregation; no fabricated smooth series.
- [ ] Observation age uses verified observation time, separately from publication/download. Invalid/unknown/future dates have explicit states; no NaN labels or invented dates. Derived and assumed values describe their basis rather than a fake measurement age. Use an injectable/reference clock for meaningful date tests.
- [ ] Shorten the default assessment to distinct, actionable limits. Move source metadata to passport and endpoint instructions to route summary. Keep detailed evidence accessible; changing presentation must not remove uncertainty or alter shared calculations.
- [ ] Check zero/missing/invalid values, units, source-link safety, date boundaries, keyboard/mobile layout and no route/draft mutation. Supply exact component selector/integration handoff to coordinator/Emma.

## Phase 3 — Presentation, usability and bounded AI

- [ ] Update existing `docs/PRESENTATION.md`, `DEMO_SCRIPT.md`, `JUDGES_QA.md`, `SCIENCE.md`, `REFERENCES.md` and `AI_USE.md` from the actual release revision. Preserve prior work. Coordinator verifies official format/deadline; do not assume seven slides, a video duration or a particular local deadline is mandatory.
- [ ] Tell one complete mission story using actual screenshots: prepare, inspect source, sketch route, understand unknowns, save note, reopen offline and export. Only demonstrate the offline step after it actually passes. Show AI/VR as prototype or future work when appropriate.
- [ ] With coordinator-arranged participants and Longla's observations, consolidate actual anonymized outcomes in `docs/USABILITY.md`; identify/fix/retest the main misunderstanding. No invented users, times or external messages.
- [ ] Optional AI slice, **after core deliverables and a working release candidate**: prepare source-grounded explanations of existing records using an actual AI tool, review every assertion/citation and propose a small versioned `public/data/science-explanations.json` to coordinator. Mark these as **prepared AI-assisted explanations**, with source IDs, tool/model/date where available and review status. Never imply live personalized inference.
- [ ] Runtime explanation display/loading uses a coordinator-agreed schema/consumer; no browser API keys, secret storage, unapproved backend or silent network dependency. Runtime model inference or image segmentation is a separate experiment requiring model/license/performance/validation evidence; not a claimed feature merely because code was AI-assisted.

## Phase 4 — Deployment and final submission handoff

- [ ] Verify actual HTTPS app renders the accepted records/quantities/dates/sources; no stale-build screenshots, missing source links or invented location pins.
- [ ] With Longla confirm local evidence summaries remain readable in the prepared installed offline app; explain that external citations may need internet.
- [ ] Finalize slides/demo script, captions/text and scientific/AI credits against the served commit and official rules. Give coordinator final artifact paths, evidence and remaining limitations; coordinator handles submission.

## Agent execution and final handoff

Preserve local changes; fetch published main and reconcile safely before starting a slice. Use the proposed branch only if no task branch already exists. No reset, force push or competing application/state store. Work on one slice at a time; hand it off for integration before starting the next dependent slice. A future contract is not an existing API.

For code changes run the relevant behavioral tests, the integrated `npm test` and `npm run build`, plus the actual affected browser workflow. Use data tests for Python/data changes. For static documents/assets, check real facts, paths/links, JSON and decoding/build output as applicable; do not add tests that merely repeat formatting. Record actual results and warnings, not baseline counts copied as new passes. Current build has initial/style warning overruns; do not raise budgets to hide them.

Each handoff includes actual **branch/commit, changed files, dependencies, commands/results, one observed workflow, remaining failures and deployment implications**. A blocked item includes the missing input/device/contract and next action. Do not fabricate numbers, coordinates, participant outcomes, timing, AI inference or hardware passes.

Normal commit/push to your assigned feature branch is authorized. Main merges belong to the coordinator. This plan prepares deployment; it does not itself publish an environment, deploy a site, submit the competition entry or authorize external messages. Preserve NASA/data/library/AI attribution.

Paste this into your coding agent:

```text
Read my personal docs/team file, TEAM_TASKS.md and CODING_AGENTS.md.
Inspect the actual branch and preserve existing work. Identify the first
unfinished, unblocked phase in my checklist and implement that slice only.
Use the listed owned files, real inputs and existing/agreed contracts.
Do not consume future APIs or modify another owner's files speculatively.
Keep all accepted behavior. Check important failure cases and the actual
user workflow; run relevant checks and review the diff before handoff.
Push only my feature branch. Report the actual commit/files/checks,
blockers and deployment effects. Do not start an unrelated redesign,
deployment or main merge. Mark completion only when supported by evidence.
```
