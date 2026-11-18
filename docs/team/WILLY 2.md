# Willy — Agent 2: independent spatial and map verification

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/main` and create your own feature branch from current main, unless Patrick specifies a newer reviewed development base. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. These instructions are published on main; implementation stays on your feature branch.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** `feature/willy-terrain-alignment-qa-v2`.

- [ ] **Do now:** create `docs/qa/PLANNING_V2_ALIGNMENT.md` with expected/observed/tolerance/evidence columns. Design independent cases for image corners, cell centres, row inversion, crop offsets, borders, nodata, wrong imageRef and legacy imports.
- [ ] Agree runner wiring with Patrick; put independent tests under `tests/terrain-map/`. Do not implement the transform you are meant to verify or edit Willy 1's map files.
- [ ] After real package approval, verify source-to-grid and grid-to-image control locations using independent evidence, not visual similarity. Record IDs/CRS/resolution and actual residuals. A synthetic pass does not establish real alignment.
- [ ] Test map pan/zoom/touch, endpoint selection, suggested versus accepted routes, cancellation and stale results. Send reproducible blockers to Willy 1/Patrick rather than fixing another owner's files.
- [ ] Coordinate physical device runs with Royce. Record exact source/pack/origin/device and distinguish browser emulation from physical installation.
- [ ] **Done:** every check is pass/fail/pending with evidence; any unresolved spatial failure blocks terrain acceptance. Old missions must remain intact and never be silently moved to a new study area.

**Send to Patrick and Willy 1:** report, test branch/full SHA, exact candidate IDs and evidence. Do not repeat completed icon-generation work.


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. The assignments are published on main; `science/planning-v2` remains a development branch. Publishing instructions does not enable terrain features or establish a deployed revision. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own new `docs/qa/PLANNING_V2_ALIGNMENT.md` and independent integration tests under `tests/terrain-map/`; agree the test runner with Patrick before adding dependencies. Do not edit Agent 1 map files, data or shared transforms.

1. Write an independent test matrix for image corners, sample centres, row inversion, crop offsets, grid borders, partial coverage, nodata and wrong imageRef. Synthetic checks prove mathematics only; real alignment requires actual source/control evidence.
2. Once accepted terrain is supplied, compare recorded control locations against the rendered overlay. Record CRS, source/grid/image identifiers, expected/observed positions, tolerances and screenshots. Report misalignment; never adjust coordinates to make the picture look right.
3. Check zoom/pan, endpoint interaction, route preview/accept/reject, unknown regions, keyboard/touch and small screens. Coordinate device coverage with Royce.
4. Verify legacy mission imports and manual routing still work; changing imageRef must not silently reinterpret old coordinates.
5. Report exact branch/SHA/URL/browser/device and separate automation, desktop emulation and physical tests. Do not claim live or device acceptance from a local build.

Start now with the matrix and independent synthetic test design. Actual-source acceptance waits for the package; no duplicate installation-asset work.

---

## Historical assignments and review records — superseded queue

# Willy 2 — Installation and release verification agent

## ACTIVE — final 90-minute survival-planning release

Physical installed-device note/route recovery on exact final candidate, before pressing Load or Save. Preserve old site data. Own WILLY_2_INSTALL_VERIFICATION.md, coordinate device scenarios with Royce.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## NEXT ACTIVE SLICE — reproducible installed mission acceptance

Your Windows/root/subpath report 9b4093d is accepted. Do not repeat asset generation/build-only checks as the next deliverable. Test the currently designated PUBLIC candidate from PROJECT_HANDOFF.md with a unique isolated test note and route: raster load, route drawing, successful note save, route save, export observations, prepare verified pack, full app close, disconnected reopen, explicit Load Route, Notebook and export comparison. Confirm no Vercel login needed and record exact source/pack/origin, device model/OS/browser and each pass/failure. Changing preview origin does not transfer local storage.

Coordinate device coverage with Royce, whose branch fix is still unmerged; do not test an asserted SHA unless actually served. If no phone is available, perform an isolated persistent-browser check and mark physical installation unrun. Save redacted before/after JSON and actual screenshots/logs with the report in your own WILLY_2_INSTALL_VERIFICATION.md. Add one short regression/bug matrix for image failure, no saved mission, storage denied and invalid import only where safely reproducible; preserve real mission data. No runtime/core/worker changes or independent deployment. Stop and hand off any actual data-loss blocker immediately.

> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Agent 2 priority now — actual mission acceptance

Accepted Windows report stays complete. On the current public candidate, run real raster HTTP/decode and map/route/notebook/save/export checks, then actual available-device installation/disconnected reopen. Record URL/source/pack/device and explicit Load Route before inspecting notes. Coordinate with Royce to avoid duplicate device runs; do not interpret a blank startup Notebook as confirmed loss before load/export evidence. New image/calibration candidate requires case-sensitive asset, pack and origin/storage compatibility retest. Keep unrun hardware pending; no new icons/framework/worker changes or speculative data collection.

## Current PUBLIC candidate — 38516f8

Use **https://marswalk-pfoqdsf41-boys-band.vercel.app/**. No Vercel login or access-request approval needed. [Exact capabilities, tests and data caveats](../qa/PUBLIC_SCIENCE_PREVIEW.md). Includes Emma UI, accepted science navigation and limited contributor-supplied REMS excerpt summaries; do not call them independently authenticated NASA data or full-day weather. Supersedes older preview URLs for new assigned testing/screenshots. Preserve personal exports before changing origins; saved missions are origin-specific. Existing production URL remains older. Physical/user acceptance and submission still need actual evidence.

## Current deployed UI candidate — 4b8b6f6

Use **https://marswalk-lhw5a1lgq-boys-band.vercel.app/** for the next assigned candidate checks. [Deployment/evidence/access](../qa/VERCEL_PREVIEW_4B8B6F6.md). Emma Phase 2 is now present; previous cf0ffb7 preview is historical. Vercel authentication required, production unchanged. Record actual source/pack/device and use isolated missions; preview origins have separate storage. This removes the old “Emma UI not yet deployed to preview” dependency but does not claim physical or user acceptance.

## Current review — Windows report accepted; remaining checks next

Your 9b4093d report is accepted as scoped contributor evidence: locked Windows install, LF/source fingerprints, both production builds and named static HTTP paths. [Review](../reviews/WILLY.md#agent-2-windows-report-9b4093d--accepted-as-scoped-contributor-evidence). Do not repeat asset generation. Preserve stash/local work and continue existing feature/willy-pwa-install-assets; no new branch needed.

Next complete the omitted raster HTTP check using the actual manifest.assetPath at root and /marswalk/, plus decoded dimensions. Then run isolated-profile full preparation/disconnected close-reopen, explicit saved mission load, notes and export; do not equate HTTP 200 with offline acceptance. Record logs/evidence for new checks in your own QA report. Use the exact coordinator-deployed candidate when available to verify hosted apple-touch-icon; main is not automatically live. Coordinate physical device coverage with Royce and keep unrun Android/iOS checks pending. Agent 1 map work remains independent; do not edit its files or deploy.

Assigned 15 November 2026. You are Willy's second coding agent. Your independent assignment is installation-asset and production-path verification, leaving map development to his first agent. Read [Willy's main plan](WILLY.md), [shared contracts](CODING_AGENTS.md) and [installation evidence](../qa/PWA_INSTALL_ASSETS.md).

## Workspace and ownership

Use a separate clone or existing independent checkout from Agent 1. Do not switch branches, install dependencies or write build output concurrently in the same checkout. Preserve unpublished work. Continue your existing installation-task branch if present; otherwise start `feature/willy-install-verification` from current published main. Never reset or force-push.

Own `docs/qa/WILLY_2_INSTALL_VERIFICATION.md` and necessary, justified fixes under `public/icons/` or `public/manifest.webmanifest`. Do not recreate or redesign already accepted assets. The shared PWA_INSTALL_ASSETS.md is read-only for this agent; report proposed corrections in your own QA file for coordinator reconciliation. Do not edit WILLY.md, this assignment, map files, root/index, core/models, scientific data, package/lock files, build scripts, hosting or worker configuration. Report defects outside ownership with reproduction steps.

## Starting point — already delivered

Main `ac79be5` pins scientific JSON checkout to LF. Main `d32453f` adds relative apple-touch-icon discovery using the existing 192px PNG, asset fingerprint documentation and LF rules for webmanifest/SVG. These are completed coordinator changes; do not reimplement them. Three.js and declarations are already locked. No Pillow installation is necessary unless you actually run image-processing tools that require it.

## Slice 1 — Reproduce Windows production builds

1. Record branch/commit, OS, Node/npm/Git versions and clean/modified state. Preserve local changes before incorporating current main.
2. Install locked dependencies with `npm ci` in your own checkout. If registry access fails, record the actual error and stop claiming build success; do not change dependency versions or delete the lockfile.
3. Confirm manifest size 1,200 bytes and SHA-256 `40381b96e243b6876c4aa796d4cfcb5b222592982a5c1726101f467622418f82`. Use the documented clean-file checkout refresh if Windows retained CRLF; protect edits first. Do not rewrite hashes or scientific data.
4. Run `npm run build`. Record compilation and full offline-pack generation independently; compilation alone is insufficient.
5. Serve this root build before overwriting it. Verify actual HTTP responses for image, manifest, all icon paths, worker and offline-pack inventory. Confirm apple-touch-icon/manifest links resolve against the page base.
6. Run `npm run build -- --base-href /marswalk/`. Serve its output under the actual `/marswalk/` URL path, not simply the server root. Repeat HTTP/link checks and verify no accidental root-relative requests. Record your serving command and URLs.
7. Independently decode existing PNGs, confirm declared dimensions/opacity, and compare all documented sizes/hashes. Use available tools; dependency installation is not the task. Identify every asset change because it requires a fresh complete pack.

## Slice 2 — Installation and offline lifecycle evidence

Use the coordinator-designated HTTPS deployment and record its exact deployed source revision. GitHub main is not automatically deployed. If the public app is older, label results with that version and list checks that need repeating on the candidate release.

- Start with a clean isolated browser profile. Verify real imagery/science load and prepare the full offline pack; wait for verified completion.
- Create start/waypoint/destination, add a note, save and export. Record separate preparation/save outcomes.
- Install on an available physical Android Chrome device or iOS Safari using its supported Add to Home Screen flow. Record actual model, OS/browser version, launcher appearance and standalone behavior. Do not call a desktop emulator a physical-device pass.
- Disconnect, close the installed app and reopen while still disconnected. Recover the saved route using the existing load action; check image/science, note recovery and export. Do not clear someone's mission or device data.
- Record unsupported install prompts, failures, stale versions and recovery steps accurately. Coordinate with Royce to avoid duplicating his device matrix; contribute installation evidence he can reference.
- If no device is available, complete browser/build work and explicitly mark physical checks blocked. Do not invent screenshots, installations, timings or participants.

## Slice 3 — Safe integration follow-up

Once Agent 1's map changes are reviewed and merged, repeat only affected map/install/offline smoke checks on the coordinator's release candidate. Report regressions to their owners. Do not merge Agent 1's unreviewed branch yourself, independently deploy, change worker update behavior or force reload unsaved missions.

## Evidence format and completion

Create `docs/qa/WILLY_2_INSTALL_VERIFICATION.md` with a table: check, tested revision, platform, command/action, actual result, evidence location, remaining blocker. Include root and subpath results separately, asset fingerprints, tested deployment URL/revision, and physical-device versus browser-only results.

For actual asset changes run both production builds and relevant asset checks. For documentation-only results do not add artificial tests. Preserve current size budgets. End your handoff with branch/commit, changed files, commands/results, one observed workflow, failures, pending hardware and deployment implications.

Push your feature branch and send the coordinator the handoff. This assignment is complete when reproducible checks and honest remaining device blockers are documented and any owned fixes pass review; it does not itself establish final release acceptance.

## Prompt for Agent 2

```text
Read docs/team/WILLY 2.md and its linked contracts. You are Agent 2:
installation/release verification only. Preserve existing work, use an
independent checkout, and follow Slice 1 before dependent device checks.
Own your separate QA file and justified install-asset fixes only.
Do not touch Agent 1's map code or coordinator configuration/data.
Use locked dependencies and actual production packs. Record real results,
platform/revision and blockers; push only your feature branch for review.
```
