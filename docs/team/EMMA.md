# Emma — Agent 1: planning controls

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/science/planning-v2` and create your own feature branch from that development line. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. Main does not contain this plan yet.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** `feature/emma-terrain-planner-v2`.

- [ ] **Do now:** create the planning state/interaction specification in `docs/qa/PLANNING_V2_UI.md` and implement the new `src/app/terrain-planner/` component shell with tests. Send proposed inputs/actions to Patrick, Enzo 2 and Willy 1. Do not modify core/root integration.
- [ ] Build endpoint status, explicitly labelled experimental grade constraint, request/cancel, preview result and accept/reject controls. Until a real contract lands, use synthetic values in tests only, not a visible “working” Mars demo.
- [ ] Consume engine values rather than computing distance/grade yourself. Distinguish missing terrain, pending source review, invalid input, no route, cancelled request and error. No route does not automatically mean impassable.
- [ ] Navigation, cancel/reject/error and stale results must preserve manual routes and Notebook drafts. Only explicit acceptance delegates a route change to Patrick's adapter. No automatic save.
- [ ] Coordinate SCSS file ownership with Charles before styling. Test keyboard/focus, phone/tablet/desktop, both themes and 200% zoom.
- [ ] **Done:** component tests/build and actual navigation/draft-preservation checks pass; Patrick integrates it with the real engine/map. Own controls; Emma 2 owns evidence details.

**Send to Patrick:** state/API proposal first, then branch/full SHA, changed files, actual checks/screenshots and blockers. Do not wait idle for the raster to finish the UI state/tests.


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. `science/planning-v2` is the development branch; main and public deployments remain unchanged by these assignments. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own new `src/app/terrain-planner/` controls, templates, styles and tests. Coordinate shell placement with Patrick; do not edit map, shared mission persistence, scientific calculations or Agent 2's evidence folder.

1. First deliver a compact interaction specification covering endpoints, constraint input, request/cancel, result, no route, error and acceptance. Use existing tokens and native accessible controls.
2. After contract v1 lands, connect real endpoint state and a validated experimental maximum-segment-grade input. Show units and explain that the chosen constraint is not an established human/rover capability.
3. Display objective, sampled distance, maximum sampled segment grade, terrain resolution and relevant missing information from engine results. Do not calculate a competing distance or call the result safe.
4. Keep suggestions separate from the saved route. Accept/reject must be explicit; cancel, failure or navigation must preserve routes and Notebook drafts. Patrick owns any required shared-store adapter.
5. Cover invalid input, unavailable terrain, stale results after endpoint/data changes, cancellation and keyboard/phone layouts. Run tests/build and record actual viewport/theme checks in `docs/qa/PLANNING_V2_UI.md`.

Start now with UI structure and synthetic test fixtures confined to tests. Do not expose mock terrain as real Mars data. First handoff is the component and state specification; second is connected implementation after dependency acceptance.

---

## Historical assignments and review records — superseded queue

# Emma — Remaining professional UI and deployment work

## Latest submission decision — read before resuming

Your SIM3292 branch 5cef4d7 is retained as research/reference artifacts (aefaec4): 6 artifact tests pass; coarse Htu context is not a local obstacle or geology overlay. Mission brief takeover is already completed. No duplicate implementation; review source/coverage claims and help final demo/acceptance if available.


## ACTIVE — final 90-minute survival-planning release

**Coordinator takeover completed. Do not create a competing SurvivalBriefComponent.** Mission objective, reversible user-declared checks, reactive mission/evidence summary, saved preparation and combined downloadable brief are implemented in src/app/survival-brief and integrated with the survival time card. [Evidence](../qa/SURVIVAL_BRIEF.md): 274 tests/build plus full-process offline browser restoration pass. If resuming, review current main first and report exact reproducible integration issues instead of duplicating this slice.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## New crop calibration — current implementation

User-supplied 2048² Mars GeoTIFF inspected: 0.25 m projected pixels, 512 m square. New imageRef hirise-psp001752-red-center-2048-025m-v2; shared assessment derives planar distance, old-image imports rejected and old storage untouched. [Evidence and exact limits](../data/CALIBRATED_CROP_RELEASE.md). This supersedes “active image uncalibrated” in older task text, but does not supply terrain, safety or located science. Keep current ownership; update actual screenshots/claims only after candidate deployment, and never reuse old routes on the new crop.

## CURRENT — mission workspace accepted; candidate verification next

Your dbef815 assignment is complete and accepted. Both mission-workspace/release-ui branch names refer to that same commit. **235 combined tests/build/local production-browser workflow and full-process offline recovery pass**; [review/evidence](../reviews/EMMA.md#mission-decision-workspace-dbef815--accepted). Do not repeat the substantial package below; it is retained as the completed specification.

Next perform revision-specific acceptance after coordinator deploys this UI: new workflow buttons expand panels/focus correctly, draft/route state retained, source/location/limited REMS boundaries readable, both themes/phone layout and actual save/load/export. Supply actual screenshots and reproducible blockers for Enzo's presentation; no invented users/physical checks. Public candidate remains older until separately deployed. Preserve unpublished work and safely incorporate main; no new design expansion or core/calibration edits. Agent 2 observation guide stays independent.

## Latest team integration check

Agent 2 briefing d4b335a is accepted/mounted centrally. Agent 1 UI remains accepted at 59e00e1; no newer mission workspace advertised. Preserve unpublished summary/navigation work and send actual branch/SHA for review. Do not duplicate or overwrite Agent 2 briefing. Both agents share acceptance evidence below. [Checks and limits](../qa/TEAM_SUBMISSION_CHECK.md).

## Active substantial implementation — mission decision workspace

User requested work directly focused on the Marswalk objective. Published release-ui remains 59e00e1 (accepted); no newer UI or mission-briefing tip is advertised as of this check. Do not assume unpublished work is absent. Preserve it and send its branch/SHA before overlapping changes. The following is Agent 1's next CODE slice, not another presentation document or decorative redesign.

### Outcome

A first-time user should move through **inspect evidence → sketch route → record observation → save/recover/export**, understanding what location/terrain/environment evidence supports the plan. The map remains the main workspace. Do not call this an operational survival or safe-route planner when calibration/hazards remain unavailable.

### A. Implement a compact mission decision summary

Within your owned src/app/ui/ folder, create a small standalone MissionReviewComponent if useful, or a similarly bounded shell section. Own new UI TS/HTML/SCSS/tests, existing shell/planner/notebook changes and docs/qa/RELEASE_UI.md only. Agent 2 owns src/app/mission-briefing and its QA; do not edit or duplicate it. Map/core/data/evidence/science logic and coordinator root remain outside your slice.

Derive the summary with computed() from current MissionService signals: endpoint state, waypoint count, existing assessment planar distance/status, selected marker looked up in actual records, and observation count. Display a concise distinction between route geometry, science context and remaining evidence. Selected record is selection, not proof of reading/visiting. Observation count is current mission state, not proof of a newly completed or saved session. No duplicate counter/store or custom distance formula.

Keep data unavailable until existing assessment says otherwise. If derived planar distance later arrives, show it with its existing basis and separate terrain unavailable status; do not infer slopes, north, safety, current weather or located science from the route. Imported/preexisting state must not manufacture a mission-success flag. No invented saved/exported/installed states. PWA status already has a real API and one action surface; do not duplicate it.

### B. Make the next action executable

Have MissionReviewComponent emit a typed navigation request for existing tabs (planner/confidence/notebook/transfer), handled inside the shell using its current active-tab state. Verify real tab IDs/types before implementing; do not change root/core APIs or invent an external workflow service. Buttons such as Review science evidence, Edit route, Record observation and Save or export should open the relevant existing panel, expand the collapsed sidebar when necessary and move focus to its tab or heading predictably.

Do not place points, alter map drawing mode, save/clear a mission, select a record, create a note or export automatically when navigating. Retain notebook draft and selected science across steps. Opening/closing panels must not silently mark tasks complete. Use concise native controls and a narrow-layout arrangement; not another large tab or competing dashboard. Explain Load Route recovers route AND notes and that previews have origin-specific storage. Do not promise automatic recovery until coordinator accepts that behavior.

### C. Clarify the scientific decision boundary in the workspace

Default view should make three things easy to find: proposed route status, selected science's actual position availability, and measurement limits. “Regional contextual record — not located on this image” is preferable to implying a target was visited. Use existing marker positionStatus and image identity; never compare record names to guess spatial overlap. An available limited REMS excerpt is historical rover context, not a route hazard layer; show a pointer to the existing environmental panel rather than duplicate numerical cards or make new requests.

Coordinate labels/layout only through your owned summary/shell and the assigned theme files; do not rewrite Enzo's science component or coordinator evidence content. Agent 2 briefing supplies question/background separately. Provide its proposed mount slot to coordinator only after reviewing the actual selector; no root mount in your commit.

### D. Validate real behavior

Add tests for missing/partial/complete endpoints, derived zero distance versus unavailable metrics, selected record removal/unlocated status, preexisting/imported observations and no safety/completion claims. Test each navigation action opens the correct tab, restores a collapsed sidebar, has appropriate focus and retains exact unsaved notebook text and unchanged route/mode/layers/selection. Test that summary navigation makes no storage write, save, delete, export or initialization call.

In a browser verify keyboard activation/roving tabs, 390px light/dark readability and map area usability. Re-run the actual save-note/failure draft/save-route/export/reopen/Load Route workflow on your served production build; distinguish local from public deployed evidence. Run full npm test and npm run build without raising budgets or adding dependencies. No physical-device pass without hardware.

### E. Review handoff and time boundary

Continue existing feature/emma-release-ui if it contains progress; otherwise use feature/emma-mission-workspace from published main in an independent checkout. Do not reset, force push or interfere with Agent 2. First deliver the reviewable summary/navigation implementation within one focused slice (about two hours maximum); stop expanding for coordinator integration/release. No new AI/VR, onboarding framework, global font, model, geospatial transform or decorative redesign.

Update RELEASE_UI.md with branch/commit/files, exact state/navigation behavior, tests/build/size results, actual screenshots, accessibility observations and remaining blockers. Push and explicitly say ready for review. Coordinator merges/mounts/deploys; normal feature push does not deploy automatically.


> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Agent 1 priority now — mission flow, not another redesign

Phase 2 59e00e1 is accepted and public. Focus deployed acceptance on map-first decision flow: visible science purpose, location/data confidence and next action without crowding the map. Verify phone widths, keyboard, both themes, disclosures and saved-note recovery against the exact public candidate. Report reproducible blockers before changing styles; no new decorative dashboard work.

Agent 2 owns standalone mission briefing; coordinate copy/slot through coordinator and avoid its files. Preserve unreviewed local UI work, show before/after actual mission evidence and do not duplicate the briefing or invent environmental APIs. Spatial labels/metric states must consume accepted shared data only. Current measurements are a limited excerpt, not route weather or terrain. Physical/user checks need actual observations, not predicted passes.

## Current PUBLIC candidate — 38516f8

Use **https://marswalk-pfoqdsf41-boys-band.vercel.app/**. No Vercel login or access-request approval needed. [Exact capabilities, tests and data caveats](../qa/PUBLIC_SCIENCE_PREVIEW.md). Includes Emma UI, accepted science navigation and limited contributor-supplied REMS excerpt summaries; do not call them independently authenticated NASA data or full-day weather. Supersedes older preview URLs for new assigned testing/screenshots. Preserve personal exports before changing origins; saved missions are origin-specific. Existing production URL remains older. Physical/user acceptance and submission still need actual evidence.

## Current deployed UI candidate — 4b8b6f6

Use **https://marswalk-lhw5a1lgq-boys-band.vercel.app/** for the next assigned candidate checks. [Deployment/evidence/access](../qa/VERCEL_PREVIEW_4B8B6F6.md). Emma Phase 2 is now present; previous cf0ffb7 preview is historical. Vercel authentication required, production unchanged. Record actual source/pack/device and use isolated missions; preview origins have separate storage. This removes the old “Emma UI not yet deployed to preview” dependency but does not claim physical or user acceptance.

## Two-agent ownership

Agent 1 follows this existing release UI/deployed verification plan; accepted Phase 2 is complete. Agent 2 follows [EMMA 2.md](<EMMA 2.md>): new standalone mission-briefing folder and own QA only. Keep separate checkouts/branches and preserve unpublished work. Agent 2 must not modify your shell/styles or mount root; coordinator integrates the reviewed briefing. Coordinate copy with Enzo Agent 2 without overlapping his files.

> Current work piece: [W4](../../TEAM_TASKS.md#w4).

Updated **15 November 2026**. This is your **single remaining-work checklist through deployment and final handoff**. Current reviewed UI integration is `be4ac2b`: 144 Angular tests, production build and local production-browser checks pass. The earlier `b744b0b`/`27b1171` results are historical baseline evidence, not checks of future work. [Integration evidence](../qa/FINAL_BRANCH_INTEGRATION.md).

All unchecked items below are **planned**, not claims of implementation. Keep completed work and unseen local progress. Finish or hand off your current slice before switching. Read [the team plan](../../TEAM_TASKS.md), [shared contracts](CODING_AGENTS.md) and [product charter](../../SOUL.MD). This personal file contains the full sequence; earlier files under `tasks/` remain detailed reference specifications for their named slices.

## Current W4 handoff — Phase 2 accepted; deployed verification next

Your 59e00e1 is accepted: **208 integrated Angular tests**, production build (initial **442.83 kB**) and local production-browser/full-process offline route/note recovery pass. Coordinator evidence simplification is preserved, header uses real read-only PWA states, theme styles stay within delegated ownership. [Review](../reviews/EMMA.md#phase-2-59e00e1--accepted-and-integrated). Do not repeat Phase 1/2 or start a new redesign.

Preserve unpublished work and safely incorporate main on feature/emma-release-ui. Next Phase 3: verify exact served UI candidate after coordinator updates deployment; current designated preview cf0ffb7 is older than this UI. Record source/URL/browser/viewport, both-theme desktop/phone screenshots, keyboard/scroll/focus, readability and recovered mission. Candidate is Vercel-authenticated; no automation secrets may be shared. Physical Android/iOS/standalone/outside-user results require actual observations; keep unavailable checks pending. Enzo Agent 2 owns presentation screenshot consolidation, so provide UI evidence/handoff without editing his documents. Environmental mounting remains pending accepted dataset/schema/component.

## Public host is ready for your acceptance checks

Use **https://marswalk-jet.vercel.app/**, deployed source `b6669fb`. Actual public browser preparation, offline full-process restart, route/note recovery/export and deferred flat 3D pass. [Evidence](../qa/VERCEL_PRODUCTION.md), [runbook](../VERCEL_SETUP.md). Target-device home-screen/standalone acceptance still needs actual observations; do not copy the browser pass as physical evidence. Automatic GitHub deployment is not connected, so a new main commit is not necessarily live until the coordinator deploys it.

## Coordinator PWA delivery — current handoff

**`8a4dadc`** supplies production worker/full-pack verification, real PwaService state/actions, root lifecycle controls, manifest/icons and update handling. **136 Angular tests, 11 worker tests, 28 data tests/build/browser offline restart/update checks pass**. [Evidence](../qa/PWA_FOUNDATION.md), [deployment runbook](../DEPLOYMENT.md), [actual lifecycle API](CODING_AGENTS.md#implemented-pwa-lifecycle--available-now). Physical home-screen installation still needs validation; public hosting is documented above. Existing 131-test statements below are historical baseline counts.

Your real PWA presentation API is now available; root already mounts one PwaPanelComponent. Continue accessibility/design and coordinate any relocation of these controls rather than duplicating them or inventing readiness.

## Assignment swap and handoff

The user swapped **remaining** Emma/Enzo assignments on 15 November 2026. Completed work, original authorship and accepted branch names stay unchanged. Preserve any unpublished progress on the previous assignment and hand off its actual commit/files/blockers through the coordinator before overlapping edits. Keep existing task branches/history if work already exists; new branch defaults below apply only when starting fresh. This assignment changes ownership, not application code or deployment status.

## Already complete — preserve

Emma uses **he/him**. Your research/records/citations, usability protocol, presentation draft, science UI `4efcb5a` and evidence workspace `3b7b1c1` remain accepted and credited to you. Enzo's shell/planner/notebook `16a2e66` is also integrated. Your remaining assignment is now shell/planner/notebook accessibility, professional design and deployment UI verification. Enzo takes the remaining verifier, environmental/science/evidence UI, AI explanation and presentation work. Preserve all accepted components and guard behavior; do not repeat foundation or root reconciliation.

## Phase 1 — Release accessibility and size cleanup

Use **`feature/emma-release-ui`** if no task exists. Own `src/app/ui/`, `src/app/planner/`, `src/app/notebook/` and their tests/styles; named QA `docs/qa/RELEASE_UI.md`. No root/core/package/worker/data/evidence-component rewrite. The three named SCSS-only Phase 2 theme fixes above are the explicit exception; component logic remains Enzo-owned.

- [x] Implement coherent tab/tabpanel IDs and ARIA relationships, selected state, roving focus, Left/Right/Home/End behavior. Only handle keys originating in tab controls; do not intercept notebook typing.
- [x] Ensure hidden/collapsed content cannot trap focus. Keep visible focus, readable contrast and usable keyboard/touch layout.
- [x] Reduce initial/planner/notebook style warning overruns without raising budgets or deleting features. Measure actual before/after. Any lazy splitting must preserve notebook state after first creation, retain errors/drafts and list essential chunks for offline preparation.
- [x] Recheck exact unsaved note across tabs/failed save, successful save, sidebar restored/keyboard clamp, mobile overflow and 3D teardown. Record actual integrated tests/build/browser results.

## Phase 2 — Consistent professional design

- [x] Agree a small visual specification with Willy/Enzo: existing palette/tokens, typography scale, spacing, action hierarchy, badges, panel density and responsive behavior. Record in `docs/qa/RELEASE_UI.md`; use original branding/icons, no new UI framework/external fonts.
- [x] Polish owned shell/header/route/notebook using that specification. One clear next action and relevant empty/loading/error states per panel; reduce duplicated controls/content through agreed handoffs rather than editing others' files.
- [x] Clarify header readiness labels: metadata loaded, image displayed, persistence available, connectivity and complete offline readiness are different states. Consume only existing/agreed coordinator signals; never manufacture a green ready status from internet access or registration.
- [x] Reserve integration space for Enzo's environmental component and actual PWA status/install/update UI. Wait for exported components and tested coordinator APIs; report exact mounting needs. Root assembly remains coordinator-owned.
- [x] Present update/install/preparation actions only when their real states exist. Failed preparation has recovery guidance; do not auto-reload over unsaved work. Keep unsupported grid/terrain unavailable and regional records accessible.

## Phase 3 — Deployed interface verification

- [ ] Check actual HTTPS preview in a clean browser plus existing-storage profile at desktop, tablet and narrow phone widths. Verify controls/tab/focus/scroll, no overflow, source/quantity text readability and manifest standalone viewport.
- [ ] With coordinator/Longla test installed offline route → evidence → note → save/recover/export, failed-save draft retention and supported update behavior. Use isolated storage; do not delete someone's mission.
- [ ] Record browser/device/build and actual defects. Hosting base-path/deep-link/cache fixes belong to coordinator; agree root/global style changes before touching those files.
- [ ] Retest affected UI after fixes and capture final consistent screenshots for Enzo. Keep logs free of uncaught normal-flow errors and explain unresolved warnings honestly.

## Phase 4 — Release freeze and support

- [ ] Deliver final component selectors/chunks, before/after size results, accessibility evidence and commit to coordinator.
- [ ] During release freeze fix only reproducible UI blockers. Verify public entry URL/private-window behavior after release and provide a concise known-issues list. No last-minute redesign or deployment-config ownership expansion.

## Agent execution and final handoff

Preserve local changes; fetch published main and reconcile safely before starting a slice. Use the proposed branch only if no task branch already exists. No reset, force push or competing application/state store. Work on one slice at a time; hand it off for integration before starting the next dependent slice. A future contract is not an existing API.

For code changes run the relevant behavioral tests, the integrated `npm test` and `npm run build`, plus the actual affected browser workflow. Use data tests for Python/data changes. For static documents/assets, check real facts, paths/links, JSON and decoding/build output as applicable; do not add tests that merely repeat formatting. Record actual results and warnings, not baseline counts copied as new passes. The reviewed integration is within initial/style warning budgets; preserve those budgets.

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
