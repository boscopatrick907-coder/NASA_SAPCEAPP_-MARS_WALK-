# Royce / Longla — mission recovery and release QA

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/science/planning-v2` and create your own feature branch from that development line. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. Main does not contain this plan yet.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** `feature/royce-planning-v2-acceptance`.

- [ ] **Do now:** create `docs/qa/PLANNING_V2_RELEASE.md` and reproduce the existing save/close/reopen/export baseline in an isolated profile. Preserve personal site data. Record the actual candidate revision/origin, not an assumed deployed branch.
- [ ] Agree automation wiring with Patrick; add end-to-end tests under `tests/planning-v2/`. Cover route plus note recovery, bad imports, denied/failed storage and saved data after a failed read. Do not replace core storage yourself.
- [ ] Once preview integration lands, test that suggest/reject/cancel/stale results leave the mission unchanged; only accepted routes enter normal save/recovery. Verify notes survive each case.
- [ ] Test the **compact terrain offline package**: online preparation completes and hashes verify; fully close, disconnect, reopen; imagery/terrain/accepted mission load and routing works only if all required assets are present. Record source/package/pack IDs and actual bytes. Partial/failed downloads must never claim offline ready; preserve any previous usable package according to the agreed update contract.
- [ ] Ask Patrick to provide package-specific failure/update scenarios before testing them; he owns cache/worker integration. Include missing/corrupt grid, wrong package hash, offline first visit and interrupted preparation.
- [ ] Run actual available Android installed-PWA recovery and coordinate map/device coverage with Willy 2. Keep iOS or other unavailable hardware pending, never certified by emulation.
- [ ] **Done:** exact-candidate report with pass/fail/pending per scenario, reproducible blockers and evidence. Release remains blocked by unresolved data loss, map alignment or false offline-readiness claims.

**Send to Patrick:** tests/report branch/full SHA, URL/source/pack/device, redacted exports/screenshots and blocker reproductions. No independent deployment.


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. `science/planning-v2` is the development branch; main and public deployments remain unchanged by these assignments. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own `tests/planning-v2/` end-to-end tests and `docs/qa/PLANNING_V2_RELEASE.md`; agree test-runner integration with Patrick. Preserve existing Notebook corrections and report unpublished branches first. Do not independently replace persistence or the service worker.

1. Establish a baseline on a named revision: route, observation, save, close/restart, offline restore and export/import. Use isolated test profiles and preserve real user data.
2. Extend scenarios when terrain integration lands: suggestion alone does not overwrite a route; acceptance preserves observations; save/reopen retains the accepted path; rejection/cancellation/stale results do not mutate it.
3. Cover malformed import, wrong imageRef, unreadable storage, failed writes, unavailable terrain and offline missing terrain assets. Missing assets must produce an honest unavailable state, not fabricated results.
4. Verify worker cancellation, 3D open/close and phone map visibility remain functional. The AI relief stays illustrative; do not derive measured slopes from it.
5. Run actual available Android installed-PWA close/disconnect/reopen checks. Record origin/source/pack, device/OS/browser and evidence. Coordinate phone checks with Willy 2; mark unavailable hardware untested.

First handoff: automated baseline/reproduction evidence. Second: candidate acceptance matrix. Report blockers with minimal steps and expected/actual output; no deployment or unsupported release certification.

---

## Historical assignments and review records — superseded queue

# Royce / Longla — Remaining 3D, VR, QA and deployment work

## Latest submission decision — read before resuming

Exact branch 334bc7f still fails compilation; do not merge it or its old core auto-load. Coordinator completed the readiness-guard intent safely in current Notebook and tested real initialization/missing-data cases. Next: physical Android note/route recovery and attachment-toggle verification; preserve current core/native form.


## ACTIVE — final 90-minute survival-planning release

Reconcile corrected Notebook 334bc7f only. Preserve current coordinator recovery; no MissionService edits. Verify loading guard, reversible checkbox and physical Android note persistence with exact candidate/pack.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## Uploaded AI relief integrated

Runtime 2bfbd8d at https://marswalk-review-boys-band.vercel.app/. Existing 3D section now offers AI-generated relief and model-only inclination metrics alongside the flat mission view. [Evidence and measurement limits](../qa/AI_RELIEF_VIEWER.md). Verify physical device orbit/pinch/tap and offline reopening; do not represent generated heights as measured terrain or project mission pins onto an unverified transform.


## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## Exact 6a5e351 handoff — fix compilation before requesting preview

Coordinator reproduced `npm test` and `npm run build` failures in an unmodified isolated copy of your requested SHA. [Errors/corrections](../reviews/LONGLA.md#exact-commit-6a5e351--compilation-fails-preview-blocked): malformed notebook @if/@else at HTML line 50, incompatible mock cast at spec line 142, plus existing checkbox set(true) regression. Restore conditional structure, use a typed mock reference and true toggling; preserve draft/current-main native notebook behavior. Push a new SHA after both commands pass. A corrected build cannot honestly be called exact 6a5e351. No merge or preview deployment occurred; use current public candidate for existing device tests and identify its revision correctly.

> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Current priority — persistence blocker before terrain/VR

Latest branch 498ee2e adds initialization auto-restore, notebook changes and tests; it is unreviewed and unmerged. Preliminary diff shows toggleAttachStart now set(true), preventing the checkbox from being unticked. Restore true toggle behavior and its user-event regression; preserve other work. Separate core auto-restore from notebook fixes for coordinator review, rather than treating it as an accepted device fix. Auto-restore must not overwrite newer in-memory/imported work during delayed initialization; failures need observable guidance and tests. Shared core belongs to coordinator; do not add further persistence changes without concrete handoff.

Provide the actual Samsung save/success/export/reopen/Load Route/Notebook/export evidence on current public candidate, with exact source/pack and original report correction. After persistence acceptance, help verify a genuinely aligned terrain tile if coordinator provides one; do not invent elevations from image brightness or integrate a paper clipping estimate. Pause VR expansion until core route/data/phone acceptance is ready. Existing flat viewer remains accepted.

## Current PUBLIC candidate — 38516f8

Use **https://marswalk-pfoqdsf41-boys-band.vercel.app/**. No Vercel login or access-request approval needed. [Exact capabilities, tests and data caveats](../qa/PUBLIC_SCIENCE_PREVIEW.md). Includes Emma UI, accepted science navigation and limited contributor-supplied REMS excerpt summaries; do not call them independently authenticated NASA data or full-day weather. Supersedes older preview URLs for new assigned testing/screenshots. Preserve personal exports before changing origins; saved missions are origin-specific. Existing production URL remains older. Physical/user acceptance and submission still need actual evidence.

## Current deployed UI candidate — 4b8b6f6

Use **https://marswalk-lhw5a1lgq-boys-band.vercel.app/** for the next assigned candidate checks. [Deployment/evidence/access](../qa/VERCEL_PREVIEW_4B8B6F6.md). Emma Phase 2 is now present; previous cf0ffb7 preview is historical. Vercel authentication required, production unchanged. Record actual source/pack/device and use isolated missions; preview origins have separate storage. This removes the old “Emma UI not yet deployed to preview” dependency but does not claim physical or user acceptance.

## Current task — reconcile 3af60d1 and reproduce the missing note

Your QA-only 3af60d1 is received and preserved. No new 3D code is submitted. Reported Samsung installation/offline opening is useful, but final acceptance remains pending exact revision and mission-recovery evidence. Do this follow-up before VR or redesign:

1. Record exact Samsung model, OS/browser version, actual URL, test time/timezone, served source/pack version, and installed standalone status. State which connection modes were disabled; “LTE” alone does not establish offline operation.
2. Use an isolated test mission/profile, preserving existing mission exports. Prepare online and wait for verified full-pack readiness. Create a route and a uniquely identifiable note; click Save observation and record the actual success/error. Export before closing and inspect whether observations contains that text. Never share personal notes or overwrite someone's real mission.
3. Disconnect, fully close and reopen the installed app. Before saving or editing anything, explicitly click Load Route and capture its feedback. Inspect Notebook and export again; compare route/imageRef/observations. Startup alone does not automatically restore the saved envelope. Do not save an empty reopened mission over the one being investigated.
4. If the note is still absent after successful load, report exact ordered actions, screenshots, before/after redacted JSON and whether route recovery worked. Coordinator owns shared persistence investigation; Emma owns notebook UI. If it reappears after load, document a recovery-discoverability issue rather than data loss. An unsaved draft is not a persisted observation.
5. Record pass/fail per step in docs/qa/PWA_ACCEPTANCE.md and push your existing feature/longla-3d branch. Keep unrun iOS, updates, graphics and outside-user tests pending. Coordinate actual device coverage with Willy Agent 2; do not duplicate his assets/build task.

Do not repeat already accepted viewer implementation. This follow-up is the next handoff; final device QA and the reported note defect remain open until evidence resolves them.

> Current work piece: [W5](../../TEAM_TASKS.md#w5).

Updated **15 November 2026**. This is your **single remaining-work checklist through deployment and final handoff**. The current tested application is `b744b0b`, published with documentation at `27b1171`: 131 Angular tests, 28 data tests/build/browser checks passed. Those are historical baseline results, not checks of the future work below. [Integration evidence](../qa/FINAL_BRANCH_INTEGRATION.md).

All unchecked items below are **planned**, not claims of implementation. Keep completed work and unseen local progress. Finish or hand off your current slice before switching. Read [the team plan](../../TEAM_TASKS.md), [shared contracts](CODING_AGENTS.md) and [product charter](../../SOUL.MD). This personal file contains the full sequence; earlier files under `tasks/` remain detailed reference specifications for their named slices.

Royce is the original-plan name for the role documented as Longla.

## Screenshot blocker checklist — prerequisites supplied

Checked **15 November 2026 (Africa/Douala)**. Both published `feature/longla-3d` and `feature/longla-3d-rehearsal` currently point to `23d5180`, already included in main. A new branch name does not mean new code awaits merge. Preserve any unpublished local work.

| Requested prerequisite | Actual location/status |
| --- | --- |
| Install manifest | `public/manifest.webmanifest`, linked in `src/index.html` |
| Install icons | `public/icons/marswalk-192.png`, `marswalk-512.png`, `marswalk-maskable-512.png` |
| Worker | Source `tools/pwa/worker.js`; generated `dist/marswalk/browser/service-worker.js` |
| Complete pack inventory | Generated `dist/marswalk/browser/offline-pack.json`; custom implementation, no `ngsw.json` or Workbox requirement |
| Production build | **`npm run build`**, which builds Angular and generates the worker/pack; output `dist/marswalk/browser` |
| Device-test URL | **https://marswalk-jet.vercel.app/**, deployed source `b6669fb` |
| Mission payload | Create a temporary route/note through actual UI, save and Export JSON; no invented science-pin fixture needed |
| Outside-user protocol | Existing `docs/USABILITY.md`, originally prepared by Emma, now maintained by Enzo; coordinator arranges sessions |
| Runtime environment/API keys | **None required**. Vercel CLI/OIDC credentials are deployment-only, not app QA requirements |

The old missing-assets checklist is superseded. Install prompting depends on browser support; missing icons alone are not an app rule that always disables an install button. Installation and verified offline preparation are separate. Background synchronization is not implemented or required by the current mission-transfer workflow.

**Do now:** preserve local work and safely incorporate published main into the QA branch already in use (`feature/longla-3d` or `feature/longla-3d-rehearsal`). Read this brief and test the live URL on the actual device. Record exact device/OS/browser/build and observations in `docs/qa/PWA_ACCEPTANCE.md`: prepare online, save route/note, install if supported, disconnect, close, reopen from icon, explicitly Load saved route, inspect image/science and export. Check optional 3D separately. Prerequisites existing is not a physical-device pass.

Do not open a duplicate PR for already-merged `23d5180`; identify genuinely new/unpublished commits separately. Reconcile the prior report's message/browser/FPS differences. Phase 2 VR feasibility follows this QA handoff; no fabricated headset support or terrain data.

## Public host is ready for your acceptance checks

Use **https://marswalk-jet.vercel.app/**, deployed source `b6669fb`. Actual public browser preparation, offline full-process restart, route/note recovery/export and deferred flat 3D pass. [Evidence](../qa/VERCEL_PRODUCTION.md), [runbook](../VERCEL_SETUP.md). Target-device home-screen/standalone acceptance still needs actual observations; do not copy the browser pass as physical evidence. Automatic GitHub deployment is not connected, so a new main commit is not necessarily live until the coordinator deploys it.

## Coordinator PWA delivery — current handoff

**`8a4dadc`** supplies production worker/full-pack verification, real PwaService state/actions, root lifecycle controls, manifest/icons and update handling. **136 Angular tests, 11 worker tests, 28 data tests/build/browser offline restart/update checks pass**. [Evidence](../qa/PWA_FOUNDATION.md), [deployment runbook](../DEPLOYMENT.md), [actual lifecycle API](CODING_AGENTS.md#implemented-pwa-lifecycle--available-now). Physical home-screen installation and public hosting still need validation. Existing 131-test statements below are historical baseline counts.

The former implementation blocker for installed/offline/update testing is removed. Reconcile your prior report, then run the actual target-device/home-screen and HTTPS host sequence; record unrun hardware checks as pending rather than blocked by absent worker code.

## Already complete — preserve

Corrected optional flat viewer is integrated through branch tip `23d5180`. It is lazy/opt-in, frames the raster in narrow panels and destroys resources on leaving the tab. No measured terrain or immersive VR is currently implemented. Do not repeat viewer corrections or root/package reconciliation.

## Phase 1 — Clarify report and run integrated device QA

Continue the existing QA branch (`feature/longla-3d` or `feature/longla-3d-rehearsal`) and report its actual name. Own `docs/qa/PWA_ACCEPTANCE.md` and actual defect/retest records. Do not rewrite teammate implementation.

- [ ] Reconcile [preserved report](../qa/submissions/LONGLA_23d5180.md): actual controls are Open 3D viewer / Close 3D viewer; canonical import error is “Invalid mission or a different image version. Current work is unchanged.” Explain differing quotes/served build, exact browser version and whether FPS was actually measured. Preserve original evidence as contributor-reported history.
- [ ] On the actual available device record served commit/URL, device/OS/browser/version/input and observation date. Check real image/science, route edits, note save/recovery/draft failure, matching transfer and wrong-image rejection using isolated work.
- [ ] Check optional 3D activation, camera presets/portrait framing, alignment, close/reopen, touch/keyboard and local failure fallback without breaking 2D. No terrain, north/geographic-heading or safety claims.
- [ ] Record expected/actual outcome, repro steps, screenshot/log where useful and retest revision. Headless software graphics is not a physical-device pass. No FPS number without method and measurement evidence.

## Phase 2 — VR feasibility, then isolated prototype

Only after Phase 1 handoff and a protected working release candidate. Use proposed **`feature/longla-webxr-prototype`** if no experiment exists. Own proposed `src/app/xr/` and `docs/qa/WEBXR_PROTOTYPE.md`; existing viewer rendering adapters may change only within agreed viewer ownership. Coordinator handles packages/root/build and any shared API.

- [ ] First check actual headset/browser, HTTPS secure context and `navigator.xr.isSessionSupported('immersive-vr')`. Record real supported/unsupported result and device. Without testable hardware, document the blocker; an emulator or button is not a headset acceptance pass.
- [ ] Present proposed controls/render integration to coordinator before dependency/root changes. Reuse image/route coordinates; opt-in lazy loading, no startup headset request or duplicate mission store.
- [ ] If supported and time remains, implement real user-initiated immersive session with clear exit, denied/unsupported/session-ended states, resize/render lifecycle and resource disposal. Preserve working 2D/flat viewer on every failure. Do not fake support/presenting toggles.
- [ ] Show a flat image rehearsal in VR unless actual validated terrain exists. Do not infer elevation from brightness, promise astronaut safety or claim immersive implementation from a screen recording.
- [ ] Test actual enter/exit/reenter, denied session, device/browser behavior and frame/resource issues. Hand off measured results for review; keep prototype separate if it does not pass. VR is an enhancement, not a dependency of the essential offline mission.

## Phase 3 — Preview and production acceptance

- [ ] Coordinator supplies exact HTTPS preview/build. Verify clean-profile first load, case/base paths, actual installed launcher/standalone behavior on supported device and meaningful unsupported guidance.
- [ ] With the delivered preparation implementation: prepare online, verify full pack, install, disconnect, close, reopen from icon; inspect imagery and local science/environment, draw route, save/recover note and export. Record every step and actual build/device. Do not mark ready from registration/image-only checks.
- [ ] Exercise safe interrupted preparation, missing/stale asset, insufficient storage and new-version/update scenarios with coordinator using isolated data. Verify draft/mission and last usable version remain protected; record blocked prerequisites honestly.
- [ ] Test optional 3D/VR according to explicit cache policy: if excluded from essentials, its unavailability must be clear/local and must not break offline 2D. Do not claim all optional models/assets are cached unless checked.
- [ ] Verify production release URL again after promotion; report only actual regressions for urgent fixes. Preserve local data and exact release evidence.

## Phase 4 — Usability and demonstration evidence

- [ ] Support coordinator-arranged outside-user observations using Emma's existing protocol; Enzo consolidates anonymized results. No unauthorized participant messaging or fabricated outcomes.
- [ ] Supply actual device screenshots/video and supported VR demonstration, with build and labels, for Enzo's presentation. Record remaining defects/unsupported hardware and the final retest status.

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
