# MARSWALK — Current team work plan

> **18 November 2026 — active post-submission assignments:** [Planning V2](docs/planning/TEAM_PLANNING_V2.md). Follow the START HERE checklist in your personal brief. This supersedes old ownership/deadline queues below; existing v1 APIs and accepted work remain valid until explicitly changed by the reviewed V2 contract. No terrain API is accepted yet.

> **Current priority override:** [MISSION_MAP_FINISH_PLAN.md](docs/MISSION_MAP_FINISH_PLAN.md). Exact-raster alignment/calibrated route context, science/location clarity and real mission recovery take precedence over optional AI/VR or broad data collection. See updated personal briefs for non-overlapping assignments.

> **Live deployment update — 15 November:** https://marswalk-jet.vercel.app/ is public and passes production-origin browser offline restart/mission recovery checks. Source `b6669fb`; [deployment evidence](docs/qa/VERCEL_PRODUCTION.md), [Vercel runbook](docs/VERCEL_SETUP.md). Physical home-screen acceptance remains pending; automatic GitHub deployment is not connected. Earlier revision-scoped statements below retain their historical scope.


Updated **15 November 2026 (Africa/Douala)**. Latest PWA application code: **`8a4dadc`** (all feature integration retained). All eight advertised feature tips are integrated, preserving history. [REVIEW.md](REVIEW.md) records verdicts; [final integration evidence](docs/qa/FINAL_BRANCH_INTEGRATION.md) records exact revisions and checks. This is the canonical assignment plan; preserve any later local work.

Product: **Angular PWA for Mars exploration rehearsal**, focused on the prepared Mount Sharp/Gale image. Read [SOUL.MD](SOUL.MD). The Willy/Gaddielle role swap remains in force. Emma uses he/him; Royce is the original-plan name for the role documented as Longla.

<a id="current-state"></a>
## Delivered work and current state

Main includes the real 2048 × 1042 image; map/navigation and explicit image retry; science discovery, confidence and image-passport panels; shell, route controls and notebook; shared assessment/persistence and guarded mission transfer; and the opt-in lazy flat viewer. **136 Angular tests, 11 worker tests, 28 Python tests, production build and recorded browser offline restart/update checks pass.** Build size warnings remain below error thresholds.

Gaddielle's R3 encoded/whitespace path gap is closed by the coordinator. Longla's latest device report is preserved as contributor-reported, pending clarification of source/message/browser/FPS discrepancies. Production PWA caching/preparation/updates and browser offline restart now pass. Physical home-screen installation, public HTTPS hosting and actual outside-user outcomes remain pending. [PWA evidence](docs/qa/PWA_FOUNDATION.md). Science positions, metric calibration, terrain and exact AOI overlap remain unavailable/unverified.

| Published contribution | Latest integrated tips | Verdict |
| --- | --- | --- |
| Willy map/navigation/retry | `21cf6f0`, `02134f1` | Accepted, merged |
| Emma research/science/evidence workspace | `947ff1a`, `4efcb5a`, `3b7b1c1` | Accepted, merged; three shared UI components mounted once |
| Gaddielle environmental prototype | `286374b` | Changes required R1–R4; not merged. Prior R3/release handoff remain accepted |
| Enzo shell/planner/notebook | `16a2e66` | Accepted, merged; root conflicts resolved, transfer/drafts retained |
| Longla optional viewer and QA submission | `23d5180` | Viewer merged; submitted hardware claims need clarification |

## One complete remaining-work file per person

**User-requested swap, 15 November:** Enzo now owns W3 verifier/science/environment/AI/presentation follow-ups; Emma owns W4 professional shell/UI/accessibility/deployment UI follow-ups. Completed authorship is unchanged. Preserve and hand off unpublished progress before overlapping edits.

Each personal file now contains that person's **entire ordered checklist through deployment and final handoff**, including a coding-agent prompt. The W1–W6 slices below remain the first tasks; subsequent phases start after their stated handoffs/dependencies. Scope restrictions in earlier task specifications apply to those slices, not to unrelated later phases explicitly assigned here. Preserve already-started local work; do not start every phase simultaneously.

| Person / complete file | Start now | Later implementation | Deployment / final responsibility |
| --- | --- | --- | --- |
| [Willy](docs/team/WILLY.md) | Review/refine supplied install assets | Owned map usability, agreed calibration integration checks | Actual hosted paths/icons/map/installed offline validation; final map screenshots |
| [Gaddielle](docs/team/GADDIELLE.md) | Correct provenance, source protection and numerical validation in environmental prototype | Reproducible numerical converter after agreement; scale investigation later | Deployed data/hash/unit/version audit, essential-cache inclusion and credits |
| [Enzo](docs/team/ENZO.md) | Pure image-payload verifier | Environmental quantity/date UI after contract; clearer evidence; bounded prepared AI-assisted explanations | Presentation/scientific claims, deployed/offline evidence UI and real usability outcomes |
| [Emma — he/him](docs/team/EMMA.md) | Phase 2 design/readiness and delegated three-file theme fixes; Phase 1 accepted | Professional consistent shell/planner/notebook; consume real lifecycle UI contract | Responsive/keyboard/standalone deployed UI checks and final screenshots |
| [Royce / Longla](docs/team/LONGLA.md) | Clarify device report; integrated hardware QA | Real WebXR feasibility/prototype on supported hardware, separately reviewed | HTTPS/install/full offline/update acceptance and actual device/demo evidence |
| [YOU / coordinator](docs/team/YOU.md) | Shared contracts, official requirements, reviewed integration | Full PWA lifecycle, shared data loading, guarded AI/VR integration | Hosting/runbook, preview/production verification/rollback and final submission coordination |

### Release sequence and dependency gates

1. Verify actual official requirements/deadline/timezone and available time; preserve a known-good release candidate. No invented midnight deadline or mandatory slide/video limit.
2. Complete current W1–W4 slices in parallel; W5 verifies integrated online behavior. Presentation text and design specification can progress while inputs arrive.
3. Gaddielle supplies source samples/schema proposal; coordinator agrees/implements shared types/loading; Gaddielle generates validated data and Enzo consumes the actual API. No guessed measurements or premature runtime contract.
4. Coordinator has integrated real PWA preparation; Emma can consume the implemented lifecycle signals; all owners validate their area on the exact HTTPS preview. Numerical data and AI content are added deliberately to the required-cache/version strategy.
5. Keep AI and VR experiments isolated. Prepared AI-assisted text is labeled prepared, not live inference. Real immersive VR requires supported hardware/session testing; existing flat 3D is already integrated. Failed/unverified experiments stay out of the stable release.
6. Reserve the final third of the actual remaining time for integration, device testing, final presentation and submission. Freeze additions before consuming that reserve; prioritize observed release blockers.
7. Coordinator executes deployment/submission when separately requested in the release workflow; this documentation change publishes no app or competition entry. Host/account/URL remain to be chosen. All owners recheck the actual production revision and hand off evidence.

No numerical environment dataset, AI feature or immersive VR is implemented by this plan. The subsequent coordinator PWA foundation is implemented and tested as recorded above. These are planned work with explicit completion checks in each personal file.

## Six consistent pieces of work

| Piece | Owner | Next deliverable | Branch | Exact scope |
| --- | --- | --- | --- | --- |
| [W1](#w1) | Willy | Review/refine supplied install assets | Proposed `feature/willy-pwa-install-assets` | Public assets/QA only; starter discovery/worker already supplied |
| [W2](#w2) | Gaddielle | Environmental R1–R4 corrections and source evidence | Existing `feature/gaddielle-environment-data` | Preserve prototype; source traceability/alias guard/finite values/quantity audit; no runtime approval yet |
| [W3](#w3) | Enzo | Read-only image-payload verifier | Proposed `feature/enzo-image-payload-verifier` | Pure module/spec/QA; exact planned byte-check contract |
| [W4](#w4) | Emma | Phase 3 deployed interface verification and device testing | Existing `feature/emma-release-ui` | Phases 1 & 2 accepted; awaiting coordinator Vercel deployment of merged main |
| [W5](#w5) | Longla | Device report clarification and actual-device QA | Existing `feature/longla-3d-rehearsal` | QA records only; exact integrated build/device/outcomes |
| [W6](#w6) | Coordinator / YOU | Real PWA install/cache/update lifecycle | Main integration workflow | Shared root/core/packages/worker and complete installed offline mission |

<a id="w1"></a>
## W1 — Willy: PWA install assets

Map/navigation/retry are complete. Coordinator `8a4dadc` has supplied the initial manifest/icons and root discovery; review/refine existing assets and continue deployed-device checks. Preserve any local work. The asset contract remains: `public/manifest.webmanifest`, the three specified launcher/maskable PNGs under `public/icons/`, optional original icon source and `docs/qa/PWA_INSTALL_ASSETS.md`. Verify relative URLs at root/subpath, JSON, actual PNG decoding/dimensions, readable original artwork/maskable safe area and built serving. No root/index/package/worker/data edits or new dependency. Assets alone do not prove installation/readiness. [Prompt](docs/team/WILLY.md), [exact spec](docs/team/tasks/WILLY_PWA_INSTALL_ASSETS.md).

<a id="w2"></a>
## W2 — Gaddielle: numerical environmental data

**Current gate:** `286374b` is reviewed with changes required; 42 tests pass but temporary probes expose source overwrite/non-finite/range/zero issues, and original-product provenance is missing. Complete [R1–R4](docs/reviews/GADDIELLE.md#latest-environmental-submission--changes-required-before-merge) on the same branch before proceeding. No environmental code/data has been merged.

R1–R3 and release-data handoff `0514da1` are complete. Coordinator corrected CRLF/LF hash/byte differences and pack membership in the accepted handoff; no scientific assets changed. Do not reassign completed work.

Start with actual documented REMS pressure/temperature samples and RAD feasibility, `docs/data/ENVIRONMENT_SOURCE_AUDIT.md`, small reviewable fixtures and a proposed schema for coordinator/Enzo. Then, after shared contract agreement, implement owned `tools/data/prepare_environment.py`, meaningful tests and `public/data/environment.json`. Source units, times, quality/sentinels and uncertainty; deterministic UTF-8/LF and output preservation on failure. Coordinator owns shared loader/validation/full-pack/deployment; Enzo owns UI. Scale research follows numerical handoff. [Full single-file plan/prompt](docs/team/GADDIELLE.md), [accepted inventory](docs/data/RELEASE_DATA_HANDOFF.md).

<a id="w3"></a>
## W3 — Enzo: read-only image-payload verification

Science discovery and both evidence panels are complete. Implement the **planned** pure `verifyImagePayload(index, activeImage, readBytes)` module under `src/app/offline/`, its tests and `docs/qa/IMAGE_PAYLOAD_VERIFIER.md`. Validate unknown v1 index/active manifest before reads; verify exact bytes, SHA-256 and manifest identity using an injected cache-only reader and the specified result/failures. No network fallback, storage writes, shared/root/model/source/Python/package/worker changes or readiness UI. W6 composes this with all other shell/science/install checks. [Prompt](docs/team/ENZO.md), [exact contract](docs/team/tasks/ENZO_IMAGE_PAYLOAD_VERIFIER.md).

<a id="w4"></a>
## W4 — Emma: release UI accessibility, professional design, and deployed verification

**Phases 1 & 2 accepted:** `cdd2417` (Phase 1) and `59e00e1` (Phase 2) integrated on `main`; **158 tests across 16 files, 11 PWA worker tests, and production build (441.64 kB, 0 style warnings)** pass. Truthful header readiness consuming real `PwaService` read-only, integration slots for coordinator PWA status and Enzo's environmental component, shell storage guards, planner/notebook reactive banners, WCAG 2.5.3 button fixes, and delegated SCSS theme repairs are merged. Next is Phase 3 deployed UI validation following coordinator Vercel deployment, and physical device/outside-user testing. Older Phase 1 and 2 specs below are completed scope.

The complete shell and root integration are done. Improve tab/tabpanel ARIA relationships, keyboard navigation/focus and current initial/style warning sizes without raising budgets or deleting capabilities. Preserve notebook drafts, shared components, transfer and viewer teardown. Own shell/header/planner/notebook UI/tests/styles only; root/core/packages/worker remain coordinator-owned. Record actual before/after checks in `docs/qa/RELEASE_UI.md`. PwaService now supplies the real contract in CODING_AGENTS.md; coordinate movement of existing root controls rather than duplicating them. [Prompt](docs/team/EMMA.md), [exact spec](docs/team/tasks/EMMA_RELEASE_UI.md).

<a id="w5"></a>
## W5 — Longla: clarify device report and verify integrated build

Viewer corrections/integration are done. Reconcile the quoted strings, served commit, exact browser version and unsupported FPS statement in [your preserved submission](docs/qa/submissions/LONGLA_23d5180.md). Record actual physical-device observations separately from coordinator headless checks; label paraphrases and unmeasured performance honestly.

Test current integrated main online: route/science/note/save/recovery/transfer, retry and optional viewer together. Record device/OS/browser/input/build/URL, actual outcomes and reproducible defects in `docs/qa/PWA_ACCEPTANCE.md`. No teammate code changes or invented pass. Worker/install assets/cache/update implementation is now available; run target-device and actual-host acceptance. Browser passes do not certify hardware installation. [Prompt](docs/team/LONGLA.md), [acceptance record](docs/qa/PWA_ACCEPTANCE.md).

<a id="w6"></a>
## W6 — Coordinator: real installable offline release

All current submissions are integrated. Review future W1–W4 deliveries without repeating completed code. The PwaService lifecycle contract is now implemented/documented; MissionService stays unchanged. Review future contributions against it.

Wire reviewed manifest/icons and implement production caching, complete-pack verification, separate connection/readiness states, preparation/storage/update failures and mission-safe recovery. Deliberately include required shell/data/index/science assets; 524,472 image-payload bytes exclude the rest of the app. Keep the optional viewer lazy and its cache policy explicit. Perform actual install/preparation/disconnected closing/reopening with W5; then arrange three outside-user sessions using Emma's existing protocol, now maintained by Enzo, and record real outcomes. [Coordinator prompt](docs/team/YOU.md).

## Dependencies and finish rules

W1–W4 can progress independently from published main; W5 can verify the complete online mission now. W6 has implemented the lifecycle/full-pack verification; review future assets/verifier/data guidance and perform host/device acceptance next. W5's installed/offline pass follows W6. Current build/test/browser evidence does not establish installation, physical hardware, scientific certification or outside-user success.

Preserve local work. Proposed branch names apply only when no follow-up exists. Keep W5's existing branch and all accepted history; W2 uses the proposed environmental branch only if no follow-up work already exists. Personal briefs authorize normal pushes to assigned feature branches. Coordinator integration follows the user's authorized workflow; deployment, environment publication, competition submission and external messages are separate.

Hand off **commit, files/selectors, actual checks, one observed workflow and blockers**. Official competition requirements/deadline must be verified separately; internal rehearsal timing is not an official rule.


**Latest data review:** Gaddielle `42a0dd2` is approved/merged; 30 isolated and 33 integrated Python tests pass, real image index unchanged. Her next work remains the release-data handoff followed by real environmental source samples. Application/PWA implementation and its recorded browser checks are unchanged by this tools-only merge.
