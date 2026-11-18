# Emma — Agent 2: terrain evidence view

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/main` and create your own feature branch from current main, unless Patrick specifies a newer reviewed development base. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. These instructions are published on main; implementation stays on your feature branch.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** `feature/emma-terrain-evidence-v2`.

- [ ] **Do now:** specify evidence states and implement `src/app/terrain-evidence/` with synthetic test fixtures. Document inputs in `docs/qa/PLANNING_V2_EVIDENCE_UI.md`; ask Patrick to approve the metadata interface.
- [ ] Show a concise availability summary and expandable product/source/credit, native/prepared spacing, elevation units/datum, coverage, registration, uncertainty and missing-data details. Missing metadata stays explicit.
- [ ] Distinguish proposed, pending review, rejected and accepted data. A hash or completed metadata form must not trigger an accepted/verified badge. Consume Patrick's admission decision.
- [ ] Explain actual routing failure reasons after Enzo 2's contract lands. Preserve all limitations and separate coarse geology/historical REMS from aligned terrain.
- [ ] Coordinate with Emma 1/Charles; test source links, long text, empty states, keyboard disclosures, both themes, 200% zoom and phone widths. Do not edit planner controls or scientific data.
- [ ] **Done:** component tests/build and accessibility/browser checks pass, and displayed metadata matches Patrick's accepted package. No source or credit disappears from the app.

**Send to Patrick and Emma 1:** proposed metadata interface first, then branch/full SHA, checks/screenshots and unresolved copy questions.


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. The assignments are published on main; `science/planning-v2` remains a development branch. Publishing instructions does not enable terrain features or establish a deployed revision. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own new `src/app/terrain-evidence/` components and `docs/qa/PLANNING_V2_EVIDENCE_UI.md`. Agent 1 owns planner controls; coordinate styling conventions without overlapping edits.

1. Design a concise terrain-availability summary with expandable product, source/credit, acquisition metadata where supplied, native/prepared spacing, vertical units/reference, coverage, registration evidence, nodata and uncertainty.
2. Clearly distinguish no terrain, pending review, rejected package and accepted package. A hash or populated metadata is not proof of authenticity, alignment or scientific acceptance.
3. Explain unavailable route results using actual engine reason codes once agreed. Do not claim every failure means terrain is impassable.
4. Keep provenance accessible on demand, preserve every existing source/limitation, and distinguish regional geology and historical REMS context from aligned terrain.
5. Test missing/long metadata, source-link handling, keyboard disclosure/focus, both themes, phone layout and 200% zoom. No edits to runtime scientific data, engine or shared persistence.

Start with the component and state contract; integrate only coordinator-approved metadata. Deliver code, tests, screenshots and a branch/SHA.

---

## Historical assignments and review records — superseded queue

# Emma 2 — Guided boxwork mission briefing

## ACTIVE — final 90-minute survival-planning release

Reconcile c170878 observation-guide delivery with current main; review actual imagery/locations and clipboard fallback. Existing mission-briefing folder only. Emma 1 owns a separate new survival-brief folder.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## NEXT ACTIVE SLICE — field observation guide (briefing complete)

Your d4b335a briefing is accepted and mounted in b721269. This replaces old instructions to implement the same briefing. Preserve local progress and merge published main safely into the briefing branch you actually use; the two advertised briefing names point to the same accepted tip. No reset/new competing branch.

**Outcome:** help the explorer record a useful, source-aware observation, not merely type an arbitrary note. In your owned src/app/mission-briefing folder add a compact, native expandable Field observation guide to the existing component. Offer a plain-text template with distinct headings: Mission question; What I can see in this image; What the selected source reports; My interpretation/question; What remains uncertain. Prefill only active imageRef and existing selected record name/source URL where valid; all observation/interpretation fields must remain prompts, not generated geological claims. If no selection/image exists, use honest placeholders. Do not imply a source record lies at the route point.

Provide an explicit Copy observation template button using browser clipboard only on user action. Include a readonly selectable text fallback; handle unavailable clipboard/denied permission with guidance and no lost content. Show copied success only after the write resolves. Do not read clipboard, change tabs, fill/save Notebook, mutate mission state, store drafts or export automatically. Clipboard support must not become a runtime dependency; the guide works offline without it. Reuse existing tokens/accessibility, keep detail collapsed and avoid crowding the map. Agent 1 owns operational workspace/navigation, Enzo owns record comparison.

Test no-selection/removed-selection/stale image states, unsafe source URLs rendered as text, exact template content and clipboard success/failure without data mutation, and original briefing structural checklist. Keep local text generation deterministic from supported fields; no new AI/geographic/quantity APIs. Check keyboard, narrow both-theme layout and no secret/HTML injection. Run full tests/build; update your own QA with branch/SHA/files/results and push a reviewable slice. Coordinator integrates/deploys; no root/core/Notebook/styles outside your folder. Aim one focused reviewable slice within two hours, stop for review before more features.

## Latest team integration check

Your d4b335a briefing is accepted and mounted once, with coordinator theme-token/collapsed-detail adjustments. No repeat component needed. Safely incorporate main preserving work, then check question/source/structural-checklist readability and keyboard disclosure on the next actual deployed revision; current public candidate is older. No new coordinates/calibration or mission-success claims. [Checks and limits](../qa/TEAM_SUBMISSION_CHECK.md).

## Historical pre-acceptance coordination — superseded by next active slice

Your original standalone briefing remains your assignment; preserve any completed/unpublished work and send its actual branch/SHA. No new briefing branch is advertised in the latest check, so completion cannot yet be reviewed. Agent 1 now implements a compact operational summary and shell tab-navigation actions in src/app/ui only. You keep scientific question/background, evidence-location explanation and readonly structural checklist under src/app/mission-briefing only. Avoid duplicated route/quantity dashboards or shell edits; coordinator reconciles mounting. Deliver a small reviewable component promptly, not additional documentation in place of code. Existing no-fake-position/scale/mission-success boundaries apply.

> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Current priority — mission question linked to actual map evidence

Continue the already assigned standalone briefing; no branch is advertised, so unpublished progress must be preserved and reported rather than assumed absent. Deliver a small reviewable component now instead of expanding onboarding. Explain the boxwork science question and what MRO versus Curiosity contributes. Make location status unmistakable: our records are regional and unlocated on this raster, not destinations an astronaut can currently navigate to.

Checklist represents existing structural state only (endpoints/selected record/observation), never completed science, saved/recovered mission or safe route. Provide a concise pre-route evidence/location explanation and explicit unavailable distance/terrain. Use only your new folder and QA; no root/core/shell/Agent 1 styles. Coordinator mounts once. Include exact controls/integration selector, important state-transition tests and actual narrow/keyboard evidence; no requirement to wait for georeferencing to finish this informational slice.

Assigned 15 November 2026 by the user. This is a new bounded implementation slice for Emma's second agent, independent of Agent 1's accepted shell/theme work. Read [challenge requirements](../challenge/REQUIREMENTS.md), [project handoff](../../PROJECT_HANDOFF.md), [shared contracts](CODING_AGENTS.md) and [science evidence](../SCIENCE_EVIDENCE.md). Emma uses he/him.

## Outcome

Help a first-time user understand the science objective, evidence and mission steps before drawing a route. Mission question: **What evidence supports the interpretation that ancient groundwater helped form Mount Sharp's boxwork?** This is an educational exploration rehearsal, not operational astronaut navigation or confirmation of a scientific discovery.

## Ownership and branch

Use an independent clone/checkout, never switch Agent 1's branch or run concurrent installs/builds in his directory. Preserve unpublished work. Continue an existing briefing branch if present; otherwise use feature/emma-mission-briefing from published main. No reset/force push.

Own only new files under src/app/mission-briefing/ and docs/qa/EMMA_2_MISSION_BRIEFING.md. Create standalone MissionBriefingComponent (selector app-mission-briefing) with TS, HTML, SCSS and meaningful component tests. Use existing Angular/core dependencies, theme tokens and MissionService. Do not edit root/shell/header, science/evidence components, core/models, packages, worker, runtime data, Agent 1 styles or presentation documents. Coordinator mounts it after review. Keep it small; no new onboarding framework, router, API or persistence store.

## Slice 1 — Briefing content and science boundaries

Provide a concise visible title/question and native expandable briefing with:

- Purpose: examine contextual NASA evidence for the boxwork interpretation and document a proposed exploration.
- Evidence: active MRO/HiRISE image source/credit from mission.image(), and existing Curiosity/MSL contextual records. Use actual marker IDs/names and safe source links, not copied new data or an invented additional dataset.
- Limits: science records have no verified image positions; exact overlap is unverified. Do not imply Vera Rubin Ridge or Glen Torridon lies on this frame. No verified metric scale, DEM, slope, current route weather, obstacle clearance or safety rating.
- Workflow: choose start/destination and optional waypoints, inspect a science record in Confidence & Data, add an observation in Notebook, save route, prepare offline using existing PWA controls, reopen and explicitly Load Route, export.

Keep original findings distinct from guidance and user interpretations. No groundwater presence today, detected mineral percentage or completed measurement that source evidence only calls planned. Reference the existing source audit; do not generate new geological summaries independently of Enzo Agent 2's review.

## Slice 2 — Truthful reactive checklist

Use computed() over existing readonly signals. Suggested directly observable labels:

- Start and destination selected: route().start and route().destination.
- Contextual science record selected: selectedMarkerId matches an existing markers() record. This proves selection only, not that someone read or understood it.
- Observation present: observations().length > 0. Do not call a preexisting/imported observation newly created or independently scientifically verified.

Do not infer successful save, export, recovery, install or complete offline preparation from those three items. List those as instructions unless a reliable existing operation-specific state is explicitly supplied by coordinator. Do not create fake completion ticks, stored duplicate counters or a “mission successful/safe” badge. No automatic route/marker selection, note creation, initialization, navigation or storage calls. Imported state may satisfy structural checks but never proves this session completed the workflow.

Keep controls informational for this slice: no custom tab-switch events or core API request. Tell users the actual tabs to open. Root assembly and any future workflow-event contract are coordinator-owned.

## Slice 3 — Accessible, small interface

Use native details/summary, semantic headings/list, visible keyboard focus and existing theme tokens. Both themes and a 390px layout must remain readable. No remote font/media dependency or large assets. Do not trap focus, intercept text-input keys or present state by color alone. Loading/error/missing-image/empty-record states explain unavailable evidence without invented readiness.

Test route transitions, record selection/removal, preexisting observations, loading/errors, source URL safety and readonly behavior. Demonstrate no mission route/notes/mode/layers mutation or storage access. Check keyboard disclosure and both-theme narrow rendering in a local harness without committing root changes. Existing complete Angular suite and npm run build must pass; record actual results or local dependency blockers honestly. Do not raise budgets or install arbitrary package versions.

## Review handoff

Update docs/qa/EMMA_2_MISSION_BRIEFING.md with branch/commit, owned files, selector/import/mount suggestion, source-backed copy, commands/results, actual keyboard/theme/browser evidence, unrun checks and size impact. Tell coordinator the suggested placement; do not mount it yourself. Push feature branch, say ready for review and stop for integration before expanding. Prefer a first reviewable slice within two hours of starting; official deadline timezone remains unverified. No deployment, external messages, submission or other agent's edits.

## Agent prompt

```text
Read docs/team/EMMA 2.md and linked requirements/contracts. Preserve work
and use an independent checkout. Implement the standalone read-only mission
briefing and truthful computed checklist in your new folder only. Keep
scientific limits and original sources explicit. No root/core/store/data
changes, invented readiness or duplicated content framework. Test actual
state transitions/accessibility, push the feature branch and provide the
QA/mount handoff for coordinator review.
```
