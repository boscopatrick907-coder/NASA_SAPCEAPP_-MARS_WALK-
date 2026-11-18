# Enzo — Agent 2: routing engine and worker

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/main` and create your own feature branch from current main, unless Patrick specifies a newer reviewed development base. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. These instructions are published on main; implementation stays on your feature branch.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** `feature/enzo-routing-worker-v2`.

- [ ] **Do now:** write `docs/qa/TERRAIN_ROUTING.md` with proposed result/reason codes and a test matrix. Ask Patrick to publish/hand off the local routing foundation before modifying `src/app/terrain/`; do not create a second engine while it is unpublished.
- [ ] Review the handed-off engine against a small independent reference solver. Cover flat/ramp/barrier/nodata, coincident endpoints, no route, bad dimensions, invalid endpoints/constraints and no diagonal corner cutting.
- [ ] Agree a versioned request/result contract with Patrick, Emma 1 and Willy 1. Include image/package IDs, request ID, endpoints, experimental grade constraint, objective, path, distance, grade and explicit failure/cancel reasons. Do not invent existing services.
- [ ] Implement a worker with bounded inputs, cancellation/termination, stale-response rejection and resource cleanup. Keep pure tests separate from worker lifecycle tests.
- [ ] Benchmark realistic grid sizes; record device/browser, elapsed time and measured memory where available. State unmeasured metrics. Coordinate package memory limits with Enzo 1 and Patrick.
- [ ] **Done:** tests/build pass, the same accepted grid gives deterministic results, cancellation/stale responses preserve the mission, and Patrick accepts the worker/API. Real-image integration waits for approved terrain.

**Send to Patrick, Emma 1 and Willy 1:** contract proposal first, then implementation branch/full SHA, tests, benchmark report and remaining limits. Never call this “safest path.”


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. The assignments are published on main; `science/planning-v2` remains a development branch. Publishing instructions does not enable terrain features or establish a deployed revision. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own `src/app/terrain/` routing algorithms, tests and worker implementation after Patrick hands off the existing local foundation. Until that handoff, review the intended contract and propose cases without creating a competing engine. Own `docs/qa/TERRAIN_ROUTING.md`.

1. Review shortest-sampled-distance semantics, absolute segment-grade limit, endpoint validation, no-route handling, missing cells, deterministic tie handling and no diagonal corner cutting.
2. Agree structured result/reason codes and worker messages with Emma/Willy. Distinguish invalid input, missing terrain, out-of-coverage endpoints, cancellation and disconnected search.
3. Move expensive searches into a cancellable worker. Ignore stale responses using request/data IDs; bound memory/input size and clean up worker resources. Keep pure algorithms testable.
4. Test flat/ramp/barrier/nodata grids, coincident endpoints, disconnected regions, steep alternatives and deterministic outputs. Compare small cases to an independent exhaustive/reference solution, not only implementation-shaped assertions.
5. Benchmark representative sizes with recorded browser/hardware, timing and memory where measurable. Device checks remain pending if unavailable. Run integrated tests/build.

No safe-route score, guessed traversability, AI-derived elevation, runtime test data or unsupported energy model. Source review and registration are prerequisites to real-map use.

---

## Historical assignments and review records — superseded queue

# Enzo 2 — Release story, demonstration and submission evidence

## ACTIVE — final 90-minute survival-planning release

**Coordinator takeover completed at Patrick's request. Do not start a competing survival-budget component.** The return-time card is implemented and mounted in Route Planner, with saved assumptions and downloadable brief; 266 tests/build and full-process offline browser checks pass. [Implementation evidence](../qa/SURVIVAL_BUDGET.md). If you resume, review current main first and focus on truthful release/submission material rather than duplicating this component.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## New crop calibration — current implementation

User-supplied 2048² Mars GeoTIFF inspected: 0.25 m projected pixels, 512 m square. New imageRef hirise-psp001752-red-center-2048-025m-v2; shared assessment derives planar distance, old-image imports rejected and old storage untouched. [Evidence and exact limits](../data/CALIBRATED_CROP_RELEASE.md). This supersedes “active image uncalibrated” in older task text, but does not supply terrain, safety or located science. Keep current ownership; update actual screenshots/claims only after candidate deployment, and never reuse old routes on the new crop.

## Active substantial package — mission evidence and submission readiness

User explicitly requested a larger assignment. Complete these deliverables in order on existing feature/enzo-release-story, preserving unpublished work. This expands your source/story package, not runtime AI or another owner's map work. Coordinator/user are handling raster calibration; do not wait idle for it or invent its outcome.

### A. Correct the actual science content

Resolve 38cd2b3/e161e41 findings in the explanation text itself. For all three marker IDs, provide a sentence-to-source table with exact source URL, passage/section, observed/planned/derived/interpreted classification and what it does not establish. Preserve planned MAHLI/APXS versus completed imaging. Remove unsupported mineral-result/evaporation/co-location claims unless exact cited text supports them. Do not claim an exact acquisition date from a webpage update date. Tool/model may be unknown; human review stays pending until performed.

Deliver in docs/qa/ENZO_2_RELEASE_STORY.md. This is the first reviewable commit; do not hold it until all presentation work is finished. No runtime science-explanations.json, public data edit, model/backend or secret key.

### B. Build the science-location dossier

Create docs/science/SCIENCE_TARGET_DOSSIER.md for the same three records. For each: scientific question, actual target/site, mission/instruments, observation time/sol evidence, supported finding, source passages, any published coordinate value with original reference frame/convention/precision and source, and geographic relationship to our active image.

If coordinate/footprint evidence is absent, explicitly mark unlocated/regional and list the exact missing input. A matching place name or the fact that Curiosity visited Gale Crater is not pixel registration. Do not turn target names into coordinates via guesses, a generic geocoder or image appearance. Any coordinates are proposals for coordinator review, never ready-to-render pins. Keep rover science locations separate from the REMS Sol 3900 excerpt. No file changes under public/data or src/app.

### C. Produce a mission-objective and layer-evidence matrix

Create docs/science/MISSION_EVIDENCE_MATRIX.md. Start with the boxwork question and compare each implemented/proposed input: MRO optical raster, Curiosity chemical/geological context, limited REMS pressure/temperature excerpt, proposed DTM and unimplemented orbital thermal candidates. Include mission/instrument, physical quantity/unit versus interpretation, spatial/temporal footprint, raw/derived status, processing/source evidence, actual runtime availability and the planning decision it can support.

Explicitly identify which are aligned map layers, regional context, user-generated route/notes, or unverified future candidates; do not imply they are equivalent. Explain why pressure is not terrain, optical brightness is not elevation, a quoted chemical finding is not a quantitative raster, and multiple quantities from one instrument do not equal multiple missions. Use official supplied Details wording: multiple-mission integration central, three data kinds suggested, historical observations allowed, AI/VR optional. Unfetched external data stays unverified.

### D. Finish the release story and demonstration assets

Update your existing PRESENTATION.md, DEMO_SCRIPT.md, JUDGES_QA.md, SCIENCE.md, REFERENCES.md and AI_USE.md around one end-to-end mission, preserving original authorship. Describe current visual planning honestly and give a separate conditional section for calibrated distance only if coordinator actually delivers/accepts it. No claim that terrain/safety/navigation is operationally validated.

Prepare a polished two-minute rehearsal and 45-second fallback with pre-demo preparation, actual button names, source/image/pack revision, a unique test note, successful save/export, full disconnected restart, explicit Load Route and second export. Capture actual screenshots from current public candidate only, under docs/demo/ with a caption manifest recording URL/source/date/browser/viewport and actual state. Do not label screenshots as new calibrated features before they exist. If you cannot run a browser, deliver the capture checklist and mark captures blocked; do not fabricate images or timings. Match public source to docs/qa/PUBLIC_SCIENCE_PREVIEW.md, not latest Git main.

Judges' answers must cover use case, scientific contribution, multiple NASA missions, spatial limitations, data quality, offline recovery, unresolved device issue, AI assistance, and exactly what remains future work. No unsupported competitor claims, invented validation users, sponsor relationships or customers.

### E. Prepare submission readiness without inventing rules

Create docs/submission/SUBMISSION_READINESS.md. List project title, short and longer truthful summary drafts, source/code/public candidate links, NASA/data/software/AI credits, team-name/person fields pending owner confirmation, presentation/demo paths, official challenge URL and a checklist of portal inputs still unverified. Draft a clear distinction between implemented capability and future work. The user reports 10 pm; timezone and official portal deadline still need confirmation.

Resources-tab/rules text is not yet supplied: no invented video length, required executable format, required number of slides, upload limit or judging rubric. Do not register accounts, send messages, submit forms or publish/deploy. Preserve actual usability protocol; include only real observations supplied by coordinator/Royce.

### Delivery order and ownership

First commit A/source corrections, second B/C dossiers, third D/E release package. Push reviewable increments; send branch/SHA/files/actual checks/blockers at each handoff. Prioritize a source-correct first handoff within one focused hour and the remaining bounded package within the next two hours, adjusting to coordinator's release freeze. These are internal effort limits, not official deadlines. If interrupted by a critical submission need, deliver current state and prioritize that over optional AI.

You additionally own ONLY the three new dossier/submission files above and captioned screenshots under docs/demo, plus your previously assigned documentation. Agent 1 owns science component TS/HTML/tests; Emma 2 owns mission-briefing component; coordinator owns calibration/root/core/contracts and deployment. Separate checkout/branch; no duplicate map processing or invented future API. Validate citations/relative links/JSON examples and consistency with actual runtime; no application tests for docs-only edits. Conclude with a concrete “ready for review” handoff, not merely another status note.


## Latest push 38cd2b3 — incomplete correction handoff

Coordinator checked your new push: only the presentation status note changed; the three explanation texts did not. [Exact remaining corrections](../reviews/ENZO.md#agent-2-38cd2b3--status-note-only-source-corrections-still-open). Edit the explanation sentences themselves and supply sentence-to-source passages, not another proposal banner. Stay within your existing branch/files and the mission-map priority; no runtime AI/public JSON. Agent 1 navigation is already accepted. Send the correcting commit when ready for source review.

> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Current priority — source-backed mission evidence, AI optional

Your latest e161e41 drafts remain pending source corrections; no new accepted runtime explanation exists. Pause AI expansion and spend this slice on exact source-supported claims for the boxwork science objective. For each record, give the source passage, observed versus planned work, interpretation, observation time and spatial status/footprint. Do not turn mineral interpretation into a measured result, conflate separate drill sites or assert exact route overlap.

Correct your existing three drafts and map every sentence to evidence; remove unsupported causal/time claims instead of adding polished prose. Align presentation/demo to MRO imagery + Curiosity contextual science + proposed route + limited-provenance environmental excerpt + observations/offline recovery. State that calibrated route/terrain work is conditional on verified alignment. Gather actual candidate screenshots and rehearsal results; no fabricated user/hardware outcomes. Same assigned documentation files/branch, no runtime data/core/UI edits. Mission integration and submission materials outrank more AI examples.

## Current PUBLIC candidate — 38516f8

Use **https://marswalk-pfoqdsf41-boys-band.vercel.app/**. No Vercel login or access-request approval needed. [Exact capabilities, tests and data caveats](../qa/PUBLIC_SCIENCE_PREVIEW.md). Includes Emma UI, accepted science navigation and limited contributor-supplied REMS excerpt summaries; do not call them independently authenticated NASA data or full-day weather. Supersedes older preview URLs for new assigned testing/screenshots. Preserve personal exports before changing origins; saved missions are origin-specific. Existing production URL remains older. Physical/user acceptance and submission still need actual evidence.

## Current deployed UI candidate — 4b8b6f6

Use **https://marswalk-lhw5a1lgq-boys-band.vercel.app/** for the next assigned candidate checks. [Deployment/evidence/access](../qa/VERCEL_PREVIEW_4B8B6F6.md). Emma Phase 2 is now present; previous cf0ffb7 preview is historical. Vercel authentication required, production unchanged. Record actual source/pack/device and use isolated missions; preview origins have separate storage. This removes the old “Emma UI not yet deployed to preview” dependency but does not claim physical or user acceptance.

## Expanded available-agent package — source-grounded science and final story

This current package supersedes any suggestion that your AI proposal or official Details wording is still absent. e161e41 was reviewed: three drafts exist but require the source corrections in docs/reviews/ENZO.md. Official Details are now supplied in [requirements assessment](../challenge/REQUIREMENTS.md); Resources/submission fields/deadline timezone remain pending. Work independently of Enzo Agent 1 and Emma Agent 2.

1. **Correct and substantiate all three explanations.** Preserve planned versus completed observations. Remove unsupported mineralization-result, target-location, chronology and evaporation/drying claims unless exact cited passages support them. For each sentence record marker ID, source URL, exact supporting passage/section, observation/interpretation classification and limitation. Existing SCIENCE_EVIDENCE.md is evidence to consult, not permission to invent missing source text. If a source is inaccessible, narrow to the preserved passage and mark access limitations.
2. **Deliver the review package** in docs/qa/ENZO_2_RELEASE_STORY.md, using a short explanation (roughly 60–100 words), non-conclusions, known tool/model/date (unknown when unknown), actual review status and source mapping. Keep human/coordinator approval pending until performed. Original findings remain unchanged. Do not imply live inference or scientific peer review. One example JSON may illustrate proposed fields but is not a shared runtime API.
3. **Align the mission story** in your existing PRESENTATION/DEMO_SCRIPT/JUDGES_QA/SCIENCE/REFERENCES/AI_USE documents with the boxwork question in EMMA 2.md: identify what MRO imagery contributes, what Curiosity context contributes, what users propose/record and what remains unverified. Historical data is allowed; three kinds suggested; AI/VR are optional, not the objective. Do not describe a regional sidebar as a georeferenced overlay. Preserve Emma's authorship.
4. **Prepare a candidate-specific demo package.** Cover the two-minute mission sequence and short fallback, exact revision/URL/pack, screenshot checklist, source credits and honest known limitations. Capture only actually served candidate features. Label current protected preview cf0ffb7 as older than accepted Emma UI until coordinator updates it. Screenshots, rehearsal timings, users and device outcomes remain unrun until actually observed.
5. **Coordinate without file overlap.** Emma Agent 2 builds briefing UI in a new folder; you supply reviewed explanation text and presentation copy from your assigned documents. You own no component/root/core/worker or runtime data changes. Coordinator agrees versioned static explanation schema/loader and mounts content only after review; do not block your content handoff waiting for that API or invent it.

Deliver a reviewable correction/source package within two hours of starting, then finish presentation assets using actual inputs. Validate claims/links/JSON examples; no application tests for docs-only work. Continue feature/enzo-release-story, preserve unpublished progress and merge main safely. No new branch, deployment, public explanation file, API/backend/key, message to outsiders or speculative live AI. Keep usability protocol and actual results honest. This substantial package replaces optional feature expansion until sources and release workflow are dependable.

## Latest proposal e161e41 — revise source support

Your three AI-assisted entries are received as QA-only drafts. [Specific source corrections](../reviews/ENZO.md#agent-2-ai-proposal-e161e41--received-source-corrections-before-runtime-approval): preserve planned-versus-observed work, remove unsupported mineral-result/evaporation claims or supply exact passages, map each sentence to source evidence, and mark model unknown if not established. No runtime approval yet. Continue same branch; do not generate public JSON or edit Agent 1 files. Designated protected preview cf0ffb7 is available per VERCEL_PREVIEW_CF0FFB7.md; screenshot/rehearsal checks still need actual observations and may await the next accepted UI candidate.

## Current slice — checklist accepted; bounded AI explanation proposal

cbddb0e checklist accepted with coordinator technical corrections. Do not repeat it. Candidate screenshots/rehearsal remain pending actual coordinator deployment. [Review](../reviews/ENZO.md#agent-2-checklist-cbddb0e--accepted-with-technical-corrections).

The user approved a time-limited AI/VR schedule. While candidate/device inputs are unavailable, prepare **three offline-ready AI-assisted explanations** for the three existing science records, as a proposal only in docs/qa/ENZO_2_RELEASE_STORY.md. Use current source findings and SCIENCE_EVIDENCE.md; no new unverified source claims. Each entry should identify its existing marker ID, a plain-language explanation (about 60–100 words), what cannot be concluded, exact source URL(s), known tool/model/date, and review status. Example fields are proposed, not a shared runtime contract. Clearly mark human/source review pending until actually performed; keep original findings separate and unchanged. Do not use the imagery to infer elevation, safety, weather, water or marker locations. No personalized route advice or live AI claim.

Use available AI assistance, then compare each sentence against repository-supported source passages; flag unsupported content instead of filling gaps. Record reviewer/date only when actual. No public/data file, root/core loader, API call, model download, backend or keys. Submit a reviewable proposal on existing feature/enzo-release-story within two hours of starting; official schedule timezone/deadline remains user-supplied and should not be invented. Stop for schema/source review before integration. Agent 1 navigation remains independent. If official submission preparation needs attention, prioritize it over optional AI. Preserve local work and incorporate accepted main safely.

## Current handoff — release-story corrections accepted

0731a49 passes documentation review with minor coordinator example/label corrections. [Acceptance](../reviews/ENZO.md#agent-2-release-story-0731a49--accepted-with-minor-coordinator-corrections). Do not repeat the closed 25634e2 correction request. Preserve local work and safely incorporate published main.

Next: maintain a screenshot/rehearsal checklist in your existing QA handoff: exact candidate URL/commit/pack, device/browser/viewport, required scenes, expected saved/recovered note and actual versus unrun steps. Capture only an actually served release candidate designated by coordinator; new main is not automatically live. Once supplied, reconcile screenshots and rehearse the accepted primary/fallback script, recording actual failures and timing rather than a planned duration as a result. Consolidate real user observations only when coordinator/Longla provides them. Official page text/deadline, candidate deployment and device/session access remain dependencies, not reasons to invent outcomes. No independent deployment, external messages or runtime AI assigned.


Assigned 15 November 2026. You are Enzo's second coding agent. Your assignment runs independently of Agent 1's confidence/evidence UI work. Read [project handoff](../../PROJECT_HANDOFF.md), [Enzo's plan](ENZO.md), [product charter](../../SOUL.MD) and [release plan](../RELEASE_PLAN.md).

## Independent checkout and file ownership

Use a separate clone or existing independent checkout. Never switch branches, install dependencies or generate build output concurrently in Agent 1's checkout. Preserve local/unpublished work. Continue an existing presentation branch if it contains progress; otherwise use `feature/enzo-release-story` from published main. No reset or force push.

Own only:

- `docs/PRESENTATION.md`
- `docs/DEMO_SCRIPT.md`
- `docs/JUDGES_QA.md`
- `docs/SCIENCE.md`
- `docs/REFERENCES.md`
- `docs/AI_USE.md`
- `docs/USABILITY.md`
- Your new handoff `docs/qa/ENZO_2_RELEASE_STORY.md`
- Optional actual screenshots under `docs/demo/`, with no personal data and with attribution/revision recorded.

Preserve Emma's original authorship and completed research. These files are assigned to you so Agent 1 must not edit them concurrently. Do not edit application source, data/fixtures, worker, root/core, packages, deployment config, other agents' briefs or scientific evidence audits. Suggest corrections outside ownership through your handoff, not direct edits.

## Current factual baseline

Enzo verifier correction fc79cf8 is accepted in main 7896e8b: 193 Angular tests and both production build paths pass. Pure image verification is not mounted into the UI and is not itself complete offline readiness. Gaddielle's illustrative converter is accepted as tooling only; 52 data tests pass. No verified environmental runtime dataset/schema is accepted.

Map route drawing, contextual science, notes, local save/recover/export, guarded import and custom full-pack offline preparation exist. Flat opt-in 3D exists. Metric distance, elevation/slope, hazard/safety assessment, runtime AI and immersive VR are unavailable. Science records have no verified positions on the active image. Public deployment is older than main; obtain the exact source from the coordinator's deployment record before recording a live demonstration.

## Slice 1 — Reconcile the existing story with evidence

1. Read the existing seven owned documents and identify stale statements without deleting historical evidence/authorship. Seven slides and demo durations are internal choices, not official rules.
2. Update the current summary to distinguish implemented, tested locally, publicly deployed, physical-device tested and planned. Link each meaningful claim to existing revision-scoped review/QA evidence.
3. State the user problem plainly: rehearsing and documenting an exploration plan with contextual evidence and honest unknowns. Do not claim validated astronaut navigation, operational mission readiness, safety, customers or comparative superiority without evidence.
4. Update PRESENTATION.md into a coherent editable outline: user/problem; NASA data and provenance; actual workflow; offline recovery evidence; distinguishing contribution; limitations/next work. Keep slide count flexible until official requirements are verified.
5. Update SCIENCE.md and REFERENCES.md with the actual imagery/record sources already supported by repository evidence. Distinguish science findings, interpretations, user notes and fixture values. External source links may require internet even when the app is prepared offline.

## Slice 2 — Prepare a reproducible demonstration and fallback

Write a primary two-minute rehearsal plus a short fallback in DEMO_SCRIPT.md. These are internal targets, not submission requirements.

Sequence: load the specified release; prepare the full offline pack; draw start/waypoint/destination; inspect a contextual science record; save an observation; save route/export; disconnect and fully close/reopen; explicitly load the saved route; show note recovery/export. Explain null distance/terrain briefly instead of reading every warning. Optional flat 3D only if time remains and it works on the demonstrated device.

List prerequisites, actual control labels, expected visible outcomes, revision and preparation steps. Clearly separate pre-demo setup from actions shown live. If offline/installation cannot be observed, use a clearly labeled recorded demonstration from a verified revision or show the online workflow and state the missing proof. Never stage a fake offline connection, green readiness badge or recovered record.

Capture screenshots only from an actually served build; record commit, URL, viewport/browser and scene. Do not capture new features from main and label them as currently public. Do not deploy to obtain screenshots yourself; coordinate the candidate URL. Keep existing evidence as historical if the new build is unavailable.

## Slice 3 — Judging questions and attribution

Update JUDGES_QA.md with concise evidence-grounded answers to: why this user needs it; which NASA data; what is original; what works offline; why science has zero located pins; why distance/slope are unavailable; why the viewer is flat; how data is validated; what remains to finish. Do not claim 3D terrain, live AI, live Mars weather or radiation safety.

Update AI_USE.md from actual records: tools/models only where known, assistance performed, human/source review and remaining limitations. Separate AI-assisted development/prepared text from runtime inference. No API keys, tokens or invented model/version attribution. This task does not add an AI feature.

## Slice 4 — Real usability evidence and final reconciliation

Preserve the existing USABILITY.md protocol. Prepare a blank results table for three coordinator-arranged unfamiliar users: anonymous participant ID, device/browser, revision, task outcome, observed confusion, fix owner and retest. If sessions have not happened, mark them pending. Do not contact people or invent participants, quotations or timings. Incorporate observations provided by coordinator/Longla and reconcile conflicting reports with their actual revision.

Once Agent 1's UI changes are accepted and a candidate is deployed, update screenshots/control wording and repeat only affected demonstration steps. Record unresolved blockers, then freeze presentation claims to that exact release.

## Official challenge gate

User supplied https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/?tab=details . Current recorded retrieval is blocked by proxy CONNECT 403. This does not verify challenge wording or deadline. Use actual official text when provided or accessible; record source/section/date. If unavailable, continue factual internal preparation and mark compliance mapping/submission fields blocked. Never invent mandatory datasets, executable format, video length, local deadline or upload limits. Coordinator owns final requirements verification/submission.

## Validation and delivery

For documentation-only changes verify relative links/anchors, source claims, revision consistency, actual paths/control labels and Markdown formatting. Do not add artificial unit tests or rerun application tests without a code change or relevant concern. Assets require inspection and provenance, not invented test counts. Report failed external access honestly.

Create docs/qa/ENZO_2_RELEASE_STORY.md with branch/commit, edited files, evidence references, current served versus planned revision, observed demo steps, screenshots, checks performed, pending devices/users/official rules and final coordinator inputs. Push your feature branch for review. Do not merge main, deploy, submit the entry or send external messages.

## Paste into Agent 2

```text
Read docs/team/ENZO 2.md and PROJECT_HANDOFF.md. Work in an independent
checkout on the release-story slice only. Preserve original authorship,
existing progress and evidence. Update the assigned presentation/demo/QA
and attribution documents from actual implemented and deployed behavior.
Do not edit Agent 1's UI, runtime data or coordinator configuration.
Record unsupported claims and blocked official/device/user inputs honestly.
Validate links and claims, push your feature branch, and provide the handoff.
```
