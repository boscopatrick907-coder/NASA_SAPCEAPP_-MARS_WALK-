# Patrick — coordinator and scientific acceptance

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/science/planning-v2` and create your own feature branch from that development line. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. Main does not contain this plan yet.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** continue `science/planning-v2` for coordination; integrate contributor work only after review.

- [ ] **Do now:** track the source gate in `docs/data/terrain-v2/ACCEPTANCE.md`, using the runbook fields. Confirm archive access. If cloud access fails, inspect locally downloaded labels first and arrange original-file transfer without exposing secrets or forcing large Git commits.
- [ ] Independently inspect Gaddielle's candidate and record accept/reject/pending, with source evidence, coverage and missing fields. If incompatible, select one alternative imagery–DTM pair. New area means a new imageRef; preserve original missions/exports without coordinate migration guesses.
- [ ] Publish contract v1 in `docs/planning/TERRAIN_CONTRACT_V1.md` before dependent integration: grid/layout/affine, image transform and tolerances, vertical reference, provenance/admission states, worker request/result/reason codes and route acceptance adapter. Review then hand off local routing to Enzo 2.
- [ ] Reproduce Enzo 1's extraction and review Willy 2's independent alignment evidence. Agree package bytes/memory/performance limits with Enzo 1/2 and Royce, then approve a compact deployment package containing the actual required imagery/grid/mask/metadata.
- [ ] **Own offline integration:** add approved package assets to the existing pack/integrity/cache lifecycle, using current build conventions. Agree replacement/rollback behavior before implementation. Do not mark ready on manifest presence: require verified complete downloads, valid hashes and confirmed availability. Preserve saved missions and previous usable assets on failure.
- [ ] Integrate engine → map preview → planner/evidence → explicit acceptance → normal persistence. No user-visible scientific feature is enabled by an unreviewed JSON flag.
- [ ] Review Royce's full disconnected restart and package-failure evidence, plus actual device results. Run integrated tests/build/PWA checks, document exact revision and choose a separately identified candidate deployment. Main/production publication is separate from assigning tasks.
- [ ] **Done:** every gate in the runbook is passed with evidence; no unresolved alignment/data-loss/readiness blocker. Report the remaining uncertainty honestly even after release.

**Next immediate handoff:** source decision + contract v1 to all implementers. Do not let teammates wait for undefined APIs; accept their interface proposals or provide concrete corrections.


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. `science/planning-v2` is the development branch; main and public deployments remain unchanged by these assignments. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own the verified source decision, image/grid contract, shared mission adapters and integration. Keep submitted main/public artifacts unchanged until a separately reviewed release.

1. Confirm archive access and independently inspect candidate DEM metadata/raster. Require Mars horizontal CRS, metre units, known vertical reference, actual coverage, nodata and documented uncertainty. Reject AI relief as measured terrain.
2. Publish contract v1 for prepared grids, provenance, affine/pixel-centre transform, admission states, routing request/result/reason codes and cancellation. Review existing experimental routing with Enzo 2 before transferring ownership.
3. Independently check imagery/DEM alignment and geology scale. If the current crop lacks usable terrain, choose and document a compatible study area; do not silently move existing missions or remap legacy coordinates.
4. Integrate reviewed tooling, data, worker, map and UI in dependency order. Own shared mission/store changes and recovery compatibility. Source presence or a boolean flag is not scientific verification.
5. Run integrated tests/build/PWA checks and review actual device findings before any deployment. Name the exact revision and retain recovery/export capability. Publish a candidate only when explicitly intended, preserving the submitted baseline.

Current local development has a tested routing prototype, not accepted terrain or enabled terrain routing. Track source blockers honestly. Coordinate handoffs rather than editing files actively owned by others.

---

## Historical assignments and review records — superseded queue

# YOU / Dinang — Remaining integration, PWA, deployment and submission work

## ACTIVE — final 90-minute survival-planning release

Protect failed-recovery records from overwrite; review and integrate accepted branch slices, mount survival components, test combined workflow, deploy accepted candidate, reserve final submission time and capture portal confirmation.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## Uploaded AI relief integrated

Runtime 2bfbd8d at https://marswalk-review-boys-band.vercel.app/. Existing 3D section now offers AI-generated relief and model-only inclination metrics alongside the flat mission view. [Evidence and measurement limits](../qa/AI_RELIEF_VIEWER.md). Verify physical device orbit/pinch/tap and offline reopening; do not represent generated heights as measured terrain or project mission pins onto an unverified transform.


## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## New crop calibration — current implementation

User-supplied 2048² Mars GeoTIFF inspected: 0.25 m projected pixels, 512 m square. New imageRef hirise-psp001752-red-center-2048-025m-v2; shared assessment derives planar distance, old-image imports rejected and old storage untouched. [Evidence and exact limits](../data/CALIBRATED_CROP_RELEASE.md). This supersedes “active image uncalibrated” in older task text, but does not supply terrain, safety or located science. Keep current ownership; update actual screenshots/claims only after candidate deployment, and never reuse old routes on the new crop.

## Active takeover — calibration/terrain evidence

User requested taking Gaddielle's slice while she is unavailable. [Audit/go-no-go/source inputs](../data/CALIBRATION_TAKEOVER.md) records successful image integrity/similarity checks and HTTP 403 original catalog access. No metric/terrain admission with present files. Need small original labels/georeferenced raster and exact processing chain; preserve her branch and current image identities. Tool tools/data/audit_spatial_inputs.py is read-only and produces the durable evidence JSON. Do not call nominal source resolution a calibrated derivative. No deployment in this slice.

> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Coordinator priority now — deliver one geographically meaningful map

Read [critical path and checked branch status](../MISSION_MAP_FINISH_PLAN.md). Within one focused hour, pair Gaddielle's actual labels/raster processing with an exact displayed-image transform go/no-go. Product metadata/parent-image association alone is insufficient. If verified, implement one shared tested image-to-ground/planar-distance contract with image/version compatibility; terrain stays unavailable until aligned samples/units/nodata verified. Protect saved missions when any image changes. If blocked, preserve truthful visual scope and finish submission rather than inventing measurements.

Review Royce 498ee2e separately (checkbox regression and async auto-restore overwrite/error behavior); no silent core merge. Coordinate Willy map consumer only after real shared API, Emma 2 briefing mount only after review, and Enzo source/location claims without fake pins. Existing limited REMS excerpt remains explicitly limited; no whole-dataset promotion. Run affected tests/build/public offline recovery on each actual candidate, then production promotion only through authorized release workflow. Keep final submission resources/portal/timezone verification and upload buffer active. Freeze new VR/live AI/cosmetic work; preserve all contributors' unpublished progress.

## Current PUBLIC candidate — 38516f8

Use **https://marswalk-pfoqdsf41-boys-band.vercel.app/**. No Vercel login or access-request approval needed. [Exact capabilities, tests and data caveats](../qa/PUBLIC_SCIENCE_PREVIEW.md). Includes Emma UI, accepted science navigation and limited contributor-supplied REMS excerpt summaries; do not call them independently authenticated NASA data or full-day weather. Supersedes older preview URLs for new assigned testing/screenshots. Preserve personal exports before changing origins; saved missions are origin-specific. Existing production URL remains older. Physical/user acceptance and submission still need actual evidence.

## Current deployed UI candidate — 4b8b6f6

Use **https://marswalk-lhw5a1lgq-boys-band.vercel.app/** for the next assigned candidate checks. [Deployment/evidence/access](../qa/VERCEL_PREVIEW_4B8B6F6.md). Emma Phase 2 is now present; previous cf0ffb7 preview is historical. Vercel authentication required, production unchanged. Record actual source/pack/device and use isolated missions; preview origins have separate storage. This removes the old “Emma UI not yet deployed to preview” dependency but does not claim physical or user acceptance.

## Available-work package — user and coordinator

User authorized this next implementation sequence; keep teammate ownership intact:

1. **Persistence first:** reproduce Royce's save-note/save-route/full-process-reopen/explicit-Load-Route/export sequence. Add a real fresh-service persistence regression and isolate any loss versus discoverability issue. Protect saved missions; do not add user notes to offline-pack.json. Confirm served revision; physical Android remains Royce's observation, not desktop proof.
2. **Environmental integration contract:** define/version units, quantity-specific quality/counts, time/sol/location, original source identity, processing provenance, missingness and derived-versus-observed values before dependent UI. Review Gaddielle's extractor fixes (synthetic Ls/nonfinite/quality/integrity); never mount illustrative/unreviewed CSV values as verified. A proposed schema is not a delivered API. Implement typed validator/loader only after accepted source semantics; include approved runtime files in full-pack essentials deliberately.
3. **Explanation contract:** after Enzo Agent 2's three drafts pass sentence/source review, agree a small versioned static content contract keyed to existing markers. Preserve original findings; explicit AI-assisted/prepared label, source/review metadata and missing/mismatch fallback. No runtime model/secret/network requirement. Coordinator loader/root/shared files only; delegate component consumer only with a concrete contract.
4. **Integration:** review Emma Agent 2's standalone read-only briefing, mount once using its real selector and retain map/tab/drafts/PWA controls. Preserve Emma Agent 1 styles and Enzo Agent 1 science navigation. Test imports, empty/missing/error states and unchanged mission data.
5. **Release:** produce updated preview containing accepted Emma Phase 2 and any reviewed new components; run test/build/full-pack plus actual served-origin mission/offline recovery, then arrange physical tests. Do not silently promote production or submit the competition entry. User requested a preview; promotion remains a separate release step.

[Emma Agent 2 assignment](<EMMA 2.md>), [Enzo Agent 2 package](<ENZO 2.md>), [official Details alignment](../challenge/REQUIREMENTS.md). User reports 10 pm submission; confirm timezone/portal rules. Protect a review gate and feature freeze rather than extending optional AI/VR indefinitely. This checklist assigns work, not completion or deployment evidence.

## Challenge product alignment — Details received

User supplied official Details extract; [assessment and preserved wording](../challenge/REQUIREMENTS.md) now guide priorities. Multiple-mission integrated science/route context is central; three data kinds suggested; historical observations allowed; AI/VR/DEM/live feeds are not mandatory in the supplied text. Product wording is available, while official Resources, portal rules and deadline timezone remain pending. Prioritize tested mission recovery and one traceable useful data integration over optional effects. Do not mark the entire official-submission checklist complete from Details alone.

## Designated preview ready — cf0ffb7

User-authorized preview deployed: https://marswalk-m3n37k8ne-boys-band.vercel.app/ (Vercel authentication required). [Artifact/browser evidence](../qa/VERCEL_PREVIEW_CF0FFB7.md). Fresh 194 Angular/11 worker tests and build pass; authenticated full-process offline route/note recovery passes. Production remains unchanged. Next coordinate Royce device missing-note reproduction and Willy installation/icon checks, then review Emma's new work and deploy a revised candidate if needed. No promotion/submission performed.

## Current continuation task — 15 November 2026

Start with [PROJECT_HANDOFF.md](../../PROJECT_HANDOFF.md). Fresh clean-main d6801a4 checks pass: 144 Angular tests, 11 worker tests, 33 data tests and production build (433.80 kB). [Durable evidence](../qa/CONTINUITY_BASELINE.md). This supersedes earlier “current” baseline counts below without relabeling historical results.

Gaddielle 0f6bd95 illustrative prototype plus coordinator C1/C2 fixes are accepted as tooling only, with 52 integrated data tests passing. Await original product/label/extraction evidence; no runtime environmental data/schema accepted. Enzo fc79cf8 closes the verifier failures: 193 integrated tests and root/subpath builds pass. Pure verifier is accepted; lifecycle composition remains coordinator-owned. The challenge URL is now recorded in RELEASE_PLAN.md; environment proxy CONNECT 403 prevents reading it. Obtain page text/PDF and separately verify deadline/timezone; requirement wording remains unverified. Current main is ahead of the documented public deployment b6669fb. Prepare the release candidate while physical device checks remain pending. This task does not authorize site/environment publication or competition submission.


> Current work piece: [W6](../../TEAM_TASKS.md#w6).

Updated **15 November 2026**. This is your **single remaining-work checklist through deployment and final handoff**. The current tested application is `b744b0b`, published with documentation at `27b1171`: 131 Angular tests, 28 data tests/build/browser checks passed. Those are historical baseline results, not checks of the future work below. [Integration evidence](../qa/FINAL_BRANCH_INTEGRATION.md).

All unchecked items below are **planned**, not claims of implementation. Keep completed work and unseen local progress. Finish or hand off your current slice before switching. Read [the team plan](../../TEAM_TASKS.md), [shared contracts](CODING_AGENTS.md) and [product charter](../../SOUL.MD). This personal file contains the full sequence; earlier files under `tasks/` remain detailed reference specifications for their named slices.

## Public host is ready for your acceptance checks

Use **https://marswalk-jet.vercel.app/**, deployed source `b6669fb`. Actual public browser preparation, offline full-process restart, route/note recovery/export and deferred flat 3D pass. [Evidence](../qa/VERCEL_PRODUCTION.md), [runbook](../VERCEL_SETUP.md). Target-device home-screen/standalone acceptance still needs actual observations; do not copy the browser pass as physical evidence. Automatic GitHub deployment is not connected, so a new main commit is not necessarily live until the coordinator deploys it.

## Coordinator PWA delivery — current handoff

**`8a4dadc`** supplies production worker/full-pack verification, real PwaService state/actions, root lifecycle controls, manifest/icons and update handling. **136 Angular tests, 11 worker tests, 28 data tests/build/browser offline restart/update checks pass**. [Evidence](../qa/PWA_FOUNDATION.md), [deployment runbook](../DEPLOYMENT.md), [actual lifecycle API](CODING_AGENTS.md#implemented-pwa-lifecycle--available-now). Physical home-screen installation remains pending; public hosting has recorded acceptance evidence. Existing 131-test statements below are historical baseline counts.

Core foundation is implemented. Next: actual hosting/target-device acceptance, official requirements verification, and shared environmental contract once real samples arrive. Enzo’s future pure verifier is not yet integrated; current complete-pack byte checks are already real. The Vercel host is now live; use its exact deployment/source record above. Optional agent plugin/MCP profile installation and automatic GitHub connection remain incomplete.

## Already complete — preserve

All eight submitted feature tips are integrated. Keep the actual map/retry/evidence, shell/planner/notebook/transfer and optional lazy viewer. R3 is closed. Do not restart the app, repeat merges or introduce a competing state store. PWA implementation and browser offline restart/update evidence are now supplied in `8a4dadc`; actual physical launcher/host acceptance remains pending.

## Phase 1 — Release coordination and shared contracts

Own root/bootstrap, `src/app/core/`, shared contracts/loading, package/lock/build config, worker/PWA lifecycle, main integration and hosting/release configuration. Teammates own their listed implementation folders. Use latest published main, preserve branch history and pending local work.

- [ ] Verify exact challenge wording, official deadline/timezone, submission fields/formats/team rules and required data/resources. Record source URL and verified requirements in `docs/RELEASE_PLAN.md`; do not adopt unverified slide/video/deadline claims from prior advice.
- [ ] Record protected working baseline and release candidate commit; tags are created deliberately and never moved silently. Establish actual available time and release freeze. Reserve final third for integration/device test/artifacts/submission; reduce optional experiments before consuming that reserve.
- [ ] Review W1 manifest/icons, W2 release-data handoff, W3 pure byte verifier and W4 accessibility/size cleanup as independent slices. Run checks appropriate to actual changes; preserve canonical tests/guards and each contributor's Git history.
- [ ] Agree Gaddielle's versioned environmental JSON and shared typed loader/validation **before** Enzo depends on it. Inputs include quantity/unit/time/location/instrument/quality/source and documented uncertainty; unknowns explicit, zero valid where supported. Separate metadata, numerical records, derived metrics and assumptions.
- [x] Define implemented PWA lifecycle state/actions before Emma builds status UI. Separate connectivity, metadata, displayed image, persistence and full-pack readiness; no invented service signals. Document actual exported APIs in CODING_AGENTS.md after implementation.

## Phase 2 — Complete installable offline PWA

- [x] Implement the documented production browser service-worker/cache strategy; add dependencies/config centrally. Wire reviewed manifest/icons, base-aware discovery/start/scope/standalone behavior and accurate install guidance. No promise that every browser emits an install prompt.
- [x] Define current versioned essentials: shell/all chunks/styles, required manifest/image/index/science and install assets. Future accepted environment/AI/VR files still require explicit inclusion and a new build. Image index is only 524,472 image-payload bytes; exclude archival master/unused references deliberately. State optional 3D/VR cache policy.
- [ ] Compose Enzo's image-only verifier with verification of the remaining required assets and build/data compatibility. Use cache-only reads to prove prepared state; missing/mismatched assets fail readiness rather than silently falling back to network.
- [x] Implement truthful preparation/progress/ready/failure/retry and update states. Handle interrupted work, storage limits, stale/missing files and unavailable crypto without destroying last usable data or current mission/drafts. Never force an update reload over unsaved notes.
- [ ] Integrate accepted environmental component/data and prepared AI explanation content if delivered, preserving missing-data states. Accept calibration only with evidence for exact raster and deliberate persistence/version handling; no fabricated slope/terrain/safety.
- [ ] Review optional VR separately; new model/backend/credentials must have agreed architecture. Never expose API keys in frontend. Essential offline mission remains usable without experimental AI/VR.

## Phase 3 — Deployment preparation and release execution

- [x] Produce `docs/DEPLOYMENT.md` with build/base-path/header/preview/rollback instructions.
- [x] Choose the actual host/account/base path and provide its specific configuration; Vercel root hosting is configured and published as documented above. App is a static Angular build at `dist/marswalk/browser`; no backend is currently required.
- [ ] Document reproducible Node/npm setup, `npm ci`, `npm test`, `npm run build`, data verification, build output, environment/base path and preview/production steps. Inspect licenses/secrets; do not deploy archival/raw-source files indiscriminately.
- [x] Configure HTTPS, root hosting, case-sensitive assets, MIME types, filesystem/404 handling, service-worker scope and cache/update headers; see VERCEL_PRODUCTION.md for actual observed headers. Avoid immutable caching for entry HTML/worker/control files; use versioned/fingerprinted asset caching deliberately.
- [ ] Prepare an isolated preview and record exact commit/artifact/URL when deployment is explicitly requested in the release workflow. This documentation update itself does not publish/deploy. Confirm provider setup/credentials through available authorized tools when needed; never commit tokens.
- [ ] Validate clean/private-window first load, installed scope/icons, real full preparation/disconnected close-reopen and safe updates with Longla/Willy/Emma/Enzo/Gaddielle. Record errors and fix/retest blockers. Build success alone is insufficient.
- [ ] Promote the tested artifact through the authorized release workflow; preserve known-good build and rollback procedure. Recheck actual production URL, no login requirement if required by event, source/data versions and supported-device mission. Git merges and environment publication are separate operations.

## Phase 4 — Presentation, submission and support

- [ ] Give Enzo the actual served commit, URL, verified capabilities/limits and official format. Consolidate screenshots/demo, NASA/data/library/AI credits and references; no false live-data, safe-route, terrain, VR or installation claims.
- [ ] Arrange actual outside-user sessions using Emma's existing protocol when feasible; Longla observes, Enzo consolidates. Fix/retest observed confusion. If unrun, mark pending; do not invent participants or send messages without authorization.
- [ ] Verify all actual portal fields/team registration/links/artifacts/AI disclosures against official rules. Submit through an explicitly requested submission action and retain confirmation; deployment alone does not submit the entry. Do not assume portal edits remain possible.
- [ ] Final freeze: documented known issues and release commit; only reproducible release-blocker fixes with regression checks. Keep rollback available and verify any changed public link afterward.
- [ ] Final handoff: production URL, release commit/tag, deployment/runbook, accepted data versions/credits, device/offline evidence, AI/VR status, submission confirmation or explicit pending status and remaining maintenance work.

## Agent execution and final handoff

Preserve local changes; fetch published main and reconcile safely before starting a slice. Use the proposed branch only if no task branch already exists. No reset, force push or competing application/state store. Work on one slice at a time; hand it off for integration before starting the next dependent slice. A future contract is not an existing API.

For code changes run the relevant behavioral tests, the integrated `npm test` and `npm run build`, plus the actual affected browser workflow. Use data tests for Python/data changes. For static documents/assets, check real facts, paths/links, JSON and decoding/build output as applicable; do not add tests that merely repeat formatting. Record actual results and warnings, not baseline counts copied as new passes. Current reviewed build is within initial/style warning budgets; preserve those budgets.

Each handoff includes actual **branch/commit, changed files, dependencies, commands/results, one observed workflow, remaining failures and deployment implications**. A blocked item includes the missing input/device/contract and next action. Do not fabricate numbers, coordinates, participant outcomes, timing, AI inference or hardware passes.

Use the user-authorized coordinator Git workflow: review feature slices, preserve history and integrate/push main when required. Contributors push their own feature branches. This plan prepares deployment; it does not itself publish an environment, deploy a site, submit the competition entry or authorize external messages. Preserve NASA/data/library/AI attribution.

Paste this into your coding agent:

```text
Read my personal docs/team file, TEAM_TASKS.md and CODING_AGENTS.md.
Inspect the actual branch and preserve existing work. Identify the first
unfinished, unblocked phase in my checklist and implement that slice only.
Use the listed owned files, real inputs and existing/agreed contracts.
Do not consume future APIs or modify another owner's files speculatively.
Keep all accepted behavior. Check important failure cases and the actual
user workflow; run relevant checks and review the diff before handoff.
Use my authorized coordinator Git workflow. Report actual commit/files/checks,
blockers and deployment effects. Do not start an unrelated redesign,
deployment. Mark completion only when supported by evidence.
```
