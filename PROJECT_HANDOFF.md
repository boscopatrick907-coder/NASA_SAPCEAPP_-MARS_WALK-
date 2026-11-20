# MARSWALK — start here when continuing

Updated 15 November 2026 UTC. This file is the cross-chat handoff, not an assertion that every remote feature is accepted. Verify Git and deployment state before acting. Never include credentials here.


## Planning V2 terrain preview — integrated (20 Nov 2026)

Branch `claude/magical-volta-1c76ak` (PR to main). **Active image is now `hirise-psp001752-red-ortho-2048-0253m-v3`** (HiRISE orthoimage crop) with the accepted 1 m DTM package `DTEEC_001488_1750_001752_1750_U02`. The earlier RDR crop failed registration against the DTM (~79 m offset, ~6 m RMS residual); missions saved on it stay in storage/exports but don't load on the new image. Route Planner has an experimental terrain preview (worker routing, dashed map suggestion, undo-able Accept, provenance on save), working offline. Evidence: [ACCEPTANCE](docs/data/terrain-v2/ACCEPTANCE.md), [REGISTRATION](docs/data/terrain-v2/REGISTRATION.md), [integration QA](docs/qa/TERRAIN_PREVIEW_INTEGRATION.md), [review](docs/reviews/PLANNING_V2_REVIEW.md). Checks: 413 unit, 18 PWA, 29 alignment, 3 recovery e2e, terrain browser run; initial bundle 481 kB. **Open:** independent control points (Willy 2; can revoke acceptance), physical devices, deployment, map below the fold on laptops (audit #1).

## Takou visual polish integrated

Exact source 4b8658a + 2af5fed fetched and applied as b325575 + 6403b99, preserving authorship. Eight SCSS files and attributed design artifacts; 308 tests/build pass on the current combined app. [Current evidence](docs/qa/TAKOU_POLISH_INTEGRATION.md). Older “Takou branch unreachable” sections below are historical and superseded. Shell style warning resolved; initial/map size and Leaflet warnings remain, budgets unchanged.

## Outstanding-submission review completed

[Decision matrix](docs/qa/OUTSTANDING_SUBMISSIONS_REVIEW.md). Willy map 8fbc341 cherry-picked as e97b2d9; coordinate details collapsed. Royce 334bc7f exact source still fails compilation; current Notebook readiness guard added independently. REMS 99dc2d5 archived reproducible delivery (1a59251), geology 5cef4d7 research artifacts (aefaec4); neither adds unqualified runtime weather/local hazards. 308 Angular/60 Python/4 REMS/11 worker tests and phone-size offline mission browser checks pass. Takou styling still not retrievable.

## Source library and evidence comparison

Source links/long limitations are collapsed by default; a central Sources, data & methods disclosure indexes image, science, historical environmental and model provenance. Findings and critical location/review/planning boundaries remain visible. Enzo e68e734 cherry-picked as 73be9d1 for optional two-record comparison. [Evidence](docs/qa/SOURCE_LIBRARY_AND_COMPARISON.md); 278 tests/build pass. Takou-owned styles untouched; source-branch integration is not blanket acceptance of data deliveries.

## Mission preparation and combined brief implemented

Coordinator took over Emma 1’s unclaimed slice. Route Planner’s survival card now has collapsed objective/user-declaration editor, separate explicit save/automatic restoration and a combined downloadable TXT including route, time assumptions, selected science finding/source/limits and saved observation text. [Evidence](docs/qa/SURVIVAL_BRIEF.md). 274 tests/build and phone-size full-process offline recovery pass. Checks are user declarations, never operational clearance; Emma should not duplicate this component. No Takou styles touched.

## Survival return budget implemented

Coordinator took over Enzo 2’s slice by user request. Route Planner now includes a reactive out-and-back time/reserve card, explicit user assumptions, separate saved scenario and downloadable TXT brief. [Evidence](docs/qa/SURVIVAL_BUDGET.md). 266 Angular tests/build and phone-size full-process offline scenario/route/note recovery pass. No operational safety rating, oxygen model or automatic optimal path. Enzo 2 should not duplicate this component; Takou CSS ownership is unchanged.

## Final 90-minute release ownership

See [exact team assignments](docs/FINAL_90_MINUTES.md). Personal task files have ACTIVE overrides; Emma 1 owns new survival-brief, Enzo 2 new survival-budget, coordinator core/root/release, other owners source/review/device/demo work. Takou's older local baseline is superseded; his unpushed QA work must be handed off before acceptance. Current runtime 38ad299 adds guards against unreadable/unrestored/changed saved records; 251 tests and build pass. Stable public review URL unchanged. No raw-data or outstanding feature branch is accepted merely by this plan.

## AI-generated relief in the existing 3D section

[Model and verification](docs/qa/AI_RELIEF_VIEWER.md). Runtime source 2bfbd8d is deployed on the stable review alias. Uploaded Pixal3D GLB is selectable alongside the flat view. Model-only inclination/range/area and triangle taps are implemented; they never populate real terrain/slope/safety or route assessments. Full offline pack now includes the model. Stable review URL remains https://marswalk-review-boys-band.vercel.app/. Production alias unchanged.

## Current mobile recovery fix

See [mobile fix evidence](docs/qa/MOBILE_MAP_RECOVERY_FIX.md). Phone map clipping and fresh-session recovery are fixed; 241 tests/build and full-process offline browser checks pass. Physical device acceptance remains pending. Stable public review URL: https://marswalk-review-boys-band.vercel.app/ (runtime b28f6ad). Production stays unchanged.

## Goal and product boundary

Angular PWA for Mars visual mission planning: image map, route, contextual science, notes, local save/export and prepared offline recovery. The active crop has calibrated projected pixel spacing and derived planar distance. Real elevation, slope and safety remain unavailable. Optional AI-generated relief has model-only metrics; immersive VR and runtime AI inference are absent. Historical environmental excerpt is limited context. Route Planner includes saved objective/user declarations, time-budget scenario and combined text brief. Current public runtime 1fdb32e; later baseline sections retain historical evidence.

## Repository and baseline

Repository: boscopatrick907-coder/NASA_SAPCEAPP_-MARS_WALK-, main. Local checkout currently `/workspace/NASA_SAPCEAPP_-MARS_WALK-`; rediscover if the environment changes. Reviewed source baseline **d6801a4**, including Emma integration be4ac2b, scientific LF fix ac79be5 and iOS icon discovery d32453f. This handoff's later documentation commits do not change runtime behavior. [Fresh checks](docs/qa/CONTINUITY_BASELINE.md).

Public URL: https://marswalk-jet.vercel.app/. Last documented deployed source b6669fb; anonymous inventory fetched this turn still reports pack `95d8b5f6ee7aba0a38e8e7758ada62be20a3f0ca61efd04adce0fc4cabb7a827`. Current local build pack differs: `2d175fcf490efe85d3d75ff3d7114bd814ef0b96edbb2808330511371c46e1e6`. Main is ahead of production. No deployment in this handoff task. Automatic GitHub deployment is not connected. Follow [Vercel runbook](docs/VERCEL_SETUP.md) and [deployment evidence](docs/qa/VERCEL_PRODUCTION.md); authenticate through supported tools, never copy secrets into chat/Git.

## Current designated PUBLIC preview — mobile recovery b28f6ad

https://marswalk-review-boys-band.vercel.app/ (no login). [Exact evidence/limits](docs/qa/CALIBRATED_PUBLIC_PREVIEW.md). New 2048² Mars crop, 0.25 m projected spacing, planar distance enabled; terrain/slope/safety and exact science/boxwork overlap still unavailable. New imageRef hirise-psp001752-red-center-2048-025m-v2 protects old missions; old-image imports rejected and old storage untouched. 237 Angular/54 data tests/build, all 19 asset hashes, public full-process offline route/note recovery pass. Includes latest Emma mission workspace/briefing and Enzo location/nav work. Production alias not promoted. Supersedes previous preview URLs for new tests/screenshots.

## Official Details text supplied — alignment now available

Read [challenge assessment](docs/challenge/REQUIREMENTS.md) and preserved user-supplied text. Central goal is a layered integrated location/route using multiple NASA science missions. Three data kinds are suggested, historical data is allowed, AI/VR/DEM/live feeds are not mandatory in supplied Details. Prioritize science-goal/location integration, reproducible data and reliable mission recovery. Independent webpage retrieval still blocked; Resources tab/submission fields/deadline timezone remain unverified. Do not treat all Details wording as missing now.

## People and current review states

| Owner | State and next step |
| --- | --- |
| Coordinator/user | [YOU.md](docs/team/YOU.md): verify official event requirements, review pending submissions, prepare candidate, then authorized deployment/device acceptance |
| Emma (he/him) | Phase 1 cdd2417 accepted in be4ac2b. Phase 2 59e00e1 accepted: 208 tests/build/browser pass, initial 442.83 kB. Deployed UI verification next; existing preview is older. [Plan](docs/team/EMMA.md) |
| Willy Agent 1 | Existing map/navigation/retry accepted. Map usability/release workflow. [Plan](docs/team/WILLY.md) |
| Willy Agent 2 | Windows report 9b4093d accepted as contributor evidence; missing raster HTTP, browser offline and physical-device checks next, separate QA. [Plan](<docs/team/WILLY 2.md>) |
| Enzo | fc79cf8 verifier correction accepted: 193 integrated Angular tests and root/subpath builds pass. Pure verifier remains unmounted; Coordinator completed Agent 1 evidence clarity with 194 tests/build/browser checks; Agent 1 next is bounded science-record navigation, Agent 2 release-story 0731a49 accepted with minor coordinator wording fixes; cbddb0e checklist accepted with technical corrections; candidate screenshots/rehearsal remain pending. Agent 2 e161e41 three-record AI proposal received; planned/observed and source-overreach corrections pending, no runtime approval; see docs/team/ENZO 2.md. [Correction](docs/reviews/ENZO.md) |
| Gaddielle (she/her) | Earlier imagery/tooling accepted. Environmental prototype 0f6bd95 plus coordinator C1/C2 corrections accepted as illustrative tooling only; 52 integrated data tests pass. Latest REMS cdd5b45 received; 53 isolated tests pass, but extractor synthetic Ls/nonfinite/quality/integrity issues remain. Not merged; collection ongoing. No runtime environment dataset/schema accepted. [Review](docs/reviews/GADDIELLE.md) |
| Royce/Longla | Existing 3D accepted; QA report 3af60d1 integrated as contributor-reported only. Samsung installation reported; missing-note reproduction/build identity needed before physical acceptance. [Plan](docs/team/LONGLA.md) |

Emma owns shell/planner/notebook; Willy map; Enzo evidence/environment logic. Emma has a styling-only exception for science-context, exploration-confidence and image-passport SCSS. Coordinator owns root/core/build/worker. Original completed work retains its authorship. Use independent checkouts for Willy's two agents; never change the same checkout's branch/build concurrently.

## Available-agent split — current user instruction

Emma Agent 2: new standalone read-only boxwork mission briefing, computed structural checklist and QA in a new folder; [EMMA 2.md](<docs/team/EMMA 2.md>). Emma Agent 1 remains on accepted UI/deployed checks. Enzo Agent 2: source-corrected explanations, sentence-to-source mapping and complete mission-story/demo package in existing documentation; [ENZO 2.md](<docs/team/ENZO 2.md>). Enzo Agent 1 navigation and Gaddielle collection continue independently. User/coordinator: persistence regression, accepted environmental/explanation contracts, reviewed component integration and updated preview, ordered in YOU.md. Separate checkouts and file ownership; no invented future API or runtime dataset approval. No new product code implemented by this assignment update.

## Environmental integration state

Coordinator implemented src/app/core/environment.ts, EnvironmentService and projected environmental panel with runtime review-status metadata (readings empty). [Contract](docs/data/ENVIRONMENT_RUNTIME_CONTRACT.md). Gaddielle 437a777 remains unmerged with unresolved finite-value/quality/source guards; its 53 data tests pass but no numeric dataset accepted. Latest extractor removed synthetic Ls. This is functional loader/UI/offline infrastructure, not verified atmospheric measurements. Never claim environmental values are deployed or approved from this status record.

## Latest limited scientific context and navigation

Enzo Agent 1 2b2a708 navigation accepted. User-authorized numerical subset is limited to Gaddielle's supplied 25-row Sol 3900 pressure/air-temperature excerpt (800.335 Pa / 204.700 K means), reproducibly processed, explicitly **not independently archive-authenticated or full-day**. See ENVIRONMENT_RUNTIME_CONTRACT.md. Other submitted data/extractor remain unmerged. 223 Angular tests, 54 data tests/build/local offline browser pass. Public preview access enabled for MARSWALK at user request; no tokens need sharing. Production promotion remains separate.

## Mission-map priority reset — current user instruction

[MISSION_MAP_FINISH_PLAN.md](docs/MISSION_MAP_FINISH_PLAN.md) overrides older optional work. Exact raster alignment/calibration → supported metric route context → aligned terrain if available; source/location clarity and actual recovery remain release-critical. All nine personal briefs updated with distinct tasks; pause VR/live AI/extra environmental breadth. Latest branches: Emma 59e00e1/Enzo navigation 2b2a708/Willy 9b4093d accepted; Enzo 2 e161e41 source corrections pending; Gaddielle d6ab8aa candidate spatial metadata unverified; Royce 498ee2e auto-restore/notebook changes unreviewed with checkbox toggle regression visible in diff. No new runtime feature or acceptance from this assignment update. One-hour evidence go/no-go, then honest fallback/release rather than unbounded data search.

## User/coordinator took over Gaddielle calibration task

[CALIBRATION_TAKEOVER.md](docs/data/CALIBRATION_TAKEOVER.md): actual JPEG hashes/decode/resize similarity audited, no embedded georeferencing. Original HiRISE/DTM/Photojournal catalogs blocked HTTP 403. Metric/terrain go-no-go remains **no-go with available evidence**; need original image/DTM labels and georeferenced source/processing chain. Read-only audit tool and JSON saved; existing terrain README overclaims corrected. Gaddielle branch/raw work untouched. No calibration values, imageRef or deployment changed.

## Latest Enzo Agent 2 review

38cd2b3 adds only a presentation proposal-status note; source-overreach sentences in three explanations are unchanged from e161e41. Not merged; source mapping/text corrections remain open. Agent 1 2b2a708 remains accepted with no new push. See docs/reviews/ENZO.md; do not mark AI package complete based on the new commit title.

## Enzo Agent 2 expanded package

User requested substantial additional work. ENZO 2.md now assigns ordered commits for actual source-text corrections, science-target location dossier, mission/layer evidence matrix, candidate-specific demo/screenshots/judges answers and submission readiness drafts. Three new documentation files allowed; no runtime/core/calibration edits. Coordinator/user retain raster task, Agent 1 retains science code. Unsupported coordinates and official portal rules stay pending; no deployment/submission authorization. First source-correction handoff is the priority, not new optional AI expansion.

## Emma next implementation package

User requested substantial objective-focused work. Published UI tip still 59e00e1 accepted, no newer mission-briefing branch visible. EMMA.md now assigns Agent 1 an owned mission decision summary plus typed shell navigation to route/science/notebook/transfer, no automatic state mutations or invented readiness. EMMA 2.md retains separate briefing/science-purpose component. Preserve unpublished progress; request actual commit before treating it complete. Tests must cover focus/collapse/draft/state preservation and scientific unavailable states. No new runtime implementation in this brief update.

## Royce exact-SHA review

6a5e351 requested for preview, but unmodified isolated test/build both fail NG5002 notebook HTML unmatched @else; test compilation also TS2352 mock cast. Checkbox regression remains. No working preview or merge of that SHA. LONGLA.md lists corrections and requires a new SHA. Public candidate 38516f8 stays available; main runtime unchanged by this review.

## Latest team submission check

Emma Agent 2 d4b335a briefing accepted/mounted once (both briefing branch names same tip), coordinator theme-token/collapsed-details adjustment. Enzo Agent 1 8855a2e location clarity accepted. 229 Angular tests/build and local full-process offline recovery pass; initial 464.82 kB. See docs/qa/TEAM_SUBMISSION_CHECK.md. No redeployment: public source 38516f8 is older. Royce 6a5e351 still fails compilation; Enzo 2 38cd2b3 source corrections open; no new Willy/Gaddielle/Takou submission. Emma Agent 1 workspace not advertised. Preserve unpublished work.

## Next tasks for completed slices

User requested objective-related work in personal MDs. Emma 2: field observation template/copy-with-fallback in owned briefing folder, no Notebook mutation. Enzo 1: optional readonly two-record science evidence comparison in science TS/HTML/tests, no route/pin/store changes. Willy 1: route-geometry/mode/edge-case map interaction if current unpublished slice complete. Willy 2: real installed mission save/offline/load/export evidence. Existing incomplete corrections remain unchanged. All bounded to current APIs/ownership and no fake science/safety; see personal NEXT ACTIVE SLICE sections. No runtime implementation in this assignment update.

## Emma mission workspace dbef815 accepted

Both mission-workspace/release-ui branches point to dbef815. Signal-based mission summary + typed workflow tab actions accepted, expands sidebar/focuses tabs without save/mode/mission mutation. 235 Angular tests/build/local browser/offline recovery pass, initial 472.63 kB. See docs/reviews/EMMA.md. No redeployment: public 38516f8 remains older; Emma's next is actual candidate acceptance, not repeat implementation. Agent 2 briefing/observation guide separate. Calibration/terrain still unavailable.

## Calibrated crop integration

User uploaded marswalk_crop.tif; inspected Mars GeoTIFF transform matches source window/label: 2048², 0.25 m projected pixels, 512 m extent. Active imageRef becomes hirise-psp001752-red-center-2048-025m-v2 with admitted planar scale. No resampling in display conversion; preserved crop/label/hash/transform under data/imagery and docs/data/evidence. Read CALIBRATED_CROP_RELEASE.md. 237 Angular/54 data tests and build pass. Old storage retained; legacy image imports rejected. Region/target tie-points, DEM/slope/safety still unavailable. Do not repeat old claims that active scale cannot be established after this new source admission.

## Latest Gaddielle reconciliation review

65141b7 reviewed, not merged. Isolated branch suite runs 55 tests with 3 reported failures from unreconciled temperature fixes/subtests. Audit truncated with literal omitted-content placeholder/contradictory source claims; pending-empty environment JSON would regress current runtime. Original extractor unchanged, prior source-quality blockers remain. GADDIELLE.md updated with narrow reconciliation instructions. Calibrated crop and limited excerpt on main unaffected; no deployment from this review.

## Ordered next work

1. User supplied [official challenge URL](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/?tab=details). User supplied Details text; see docs/challenge/REQUIREMENTS.md. Proxy retrieval remains blocked. Obtain Resources/submission rules and exact deadline/timezone; do not call supplied Details requirements unknown. Do not invent them.
2. Review Gaddielle original-source acquisition when submitted. Coordinator completed C1/C2 prototype fixes with 52 data tests passing; do not repeat corrections. Verify products/labels/extraction before accepting runtime data. See docs/reviews/GADDIELLE.md.
3. Enzo fc79cf8 correction is accepted with 193 tests and both builds passing. Evidence clarity completed centrally; preserve his new science-navigation slice; coordinator owns future cache-lifecycle composition. Do not repeat the closed correction.
4. Agree environmental schema/loader only from accepted evidence. Keep measurements historical, time/location/units/quality explicit. Calibration and compatible elevation are separate scientific priorities.
5. Reconcile approved UI/map work, run checks and create a release candidate. Do not repeat accepted merges or alter canonical data hashes for CRLF.
6. Deploy only when instructed through the release workflow. Record source/artifact/URL and test actual public-origin offline recovery. Physical Android/iOS standalone/touch and three outside-user sessions are still pending; desktop automation cannot substitute.
7. Complete actual presentation/credits and official submission fields. No competition submission has been made by this work.

## How to resume in another chat or agent

Attach/select the same repository and send:

> Continue MARSWALK. Read PROJECT_HANDOFF.md, docs/team/YOU.md, TEAM_TASKS.md and repository instructions. Inspect local changes and fetch remote branches before editing. Preserve unpublished work. Distinguish pushed, reviewed, merged and deployed. Start the first unblocked coordinator task and update the handoff after meaningful progress. Do not deploy, publish the cloud environment or submit the entry without my instruction.

For a teammate agent, replace YOU.md with that person's MD and obey its ownership/branch boundaries. Before resetting this chat, commit/push authorized work and record remaining local files; uncommitted files and `/tmp` artifacts may not survive. Fresh environments need repository setup/dependencies again. Chat context and billing/usage allowances are separate: this file preserves knowledge, not extra allowance or authentication.

## Verification and durable evidence

Use lockfile-installed dependencies (`npm ci`), `npm test`, `npm run test:pwa`, `npm run build` and `python3 -m unittest discover -s tools/data -p 'test_*.py'` as appropriate. Build output is `dist/marswalk/browser`; `npm run build` includes pack verification while bare Angular compilation does not. Root/subpath output overwrite the same build directory: test one before building the other. Keep scientific JSON LF per .gitattributes.

[Current baseline](docs/qa/CONTINUITY_BASELINE.md), [team plan](TEAM_TASKS.md), [release plan](docs/RELEASE_PLAN.md), [product charter](SOUL.MD), [contracts](docs/team/CODING_AGENTS.md), [usability protocol](docs/USABILITY.md). Historical evidence counts are revision-specific. Do not rely on `/tmp` scripts, installed tools, existing credentials or old chat claims without checking them.
