# Release blockers and submission checklist — Takou

Started 15 November 2026 by Takou (Charles) with a coding agent, on branch
`feature/takou-release-integration`. First tested on `main` **2626a6b** (runtime = public
candidate 38516f8), then rebased onto `main` **842ad3d** (runtime = calibrated public candidate
3d47a7b apart from CRLF in `index.html`) and every check re-run, then merged with `main` **7798074** (coordinator fixes for B1 and B3,
source b28f6ad) and re-run again. Evidence and commands:
[TAKOU_RELEASE.md](TAKOU_RELEASE.md).

Priority order: lost mission data → failed offline recovery → broken loading → unusable
controls → inaccessible links → cosmetics. "Pending" means not run. Nothing here changes product
behaviour; fixes are proposals for the named owner.

| ID | Severity | Summary | Owner | State |
| --- | --- | --- | --- | --- |
| B1 | Data loss | Saving before Load Route after reopening overwrote saved notes | Coordinator | **Fixed in b28f6ad**, retested (unit + browser) |
| B2 | Data loss | Saving after a failed restore overwrites the unreadable record | Coordinator | **Open**, still reproduced on 7798074 |
| B3 | Unusable control | Phone 390 × 844: 0 px of map visible on 842ad3d (89 px on 2626a6b) | Coordinator | **Fixed in b28f6ad**: page scrolls, full 488 px map reachable |
| B4 | Low | Windows checkout changes the pack version (CRLF `index.html`) | Coordinator | Open |

**Demo rule:** on builds before b28f6ad, press **Load Route** before saving anything after
reopening. From b28f6ad on, the app restores automatically and shows "Restored saved route and
N observation(s) on this device."; check that message before saving.

## B1 — Saved notes are overwritten when saving before Load Route (DATA LOSS, fixed in b28f6ad)

**Retest on merge e30a3fe (main 7798074):** unit tests "B1 fixed: …" in
`mission-recovery-sessions.spec.ts` pass, and the browser run restored the exact route and note
at startup, offline, before any button press (TAKOU_RELEASE.md, last section). Record of the
original finding below.

| Field | Detail |
| --- | --- |
| Tested revision | Source 2626a6b (runtime = 38516f8). Unit level: Vitest/jsdom. Browser level: see [TAKOU_RELEASE.md](TAKOU_RELEASE.md) Package 3. |
| Reproduction | 1. Draw a route, save a note (success message), Save Route. 2. Close the whole app/browser. 3. Reopen the same origin. Notebook shows **"No observations recorded yet for this mission session."** 4. Without pressing Load Route, either press **Save Route** after drawing, or save a new note. 5. Press Load Route. |
| Expected | The earlier saved note is still recoverable. |
| Observed | Step 4 rewrites the stored record from the empty in-memory state. After **Save Route**: route comes back, notes list is empty. After a new note: only the new note remains, and the old route is gone. |
| Evidence | `src/app/core/mission-recovery.spec.ts`, tests named `REPRODUCES DATA LOSS`. |
| Cause | `MissionService.initialize()` (`src/app/core/mission.service.ts:62`) never restores the saved mission. `saveRoute()` (`:140`) and `addObservation()` (`:183`) write `envelope(this.route(), this.observations())` over the stored key without checking whether a stored record exists that was not loaded this session. The only restore path is the planner's **Load Route** button (`route-planner.component.html:316-328`), which also restores notes although its label says "route". |
| User impact | Matches Royce's Samsung report: "Load Route successfully retrieved the saved route" but the note was gone. A field user who reopens the app, sees an empty Notebook and keeps working silently erases earlier observations. |
| Proposed owner / fix | **Coordinator** (owns `mission.service.ts`). Track whether this session has loaded the stored record. If a readable record exists and was not loaded, load it automatically after data is ready and say so, or refuse to overwrite and ask the user to load first. Never overwrite an unreadable record without first copying it to a side key such as `marswalk:v1:<imageRef>:unreadable:<timestamp>` (see B2). Royce's unreviewed `8bf5fad` auto-loads on init; it covers the main path but ignores the result and does not cover B2. **Emma** (notebook/planner UI): rename Load Route to "Load saved mission (route + notes)" and, when a saved mission exists but is not loaded, show that in the Notebook instead of "No observations recorded yet". |
| Retest | Pending the fix. After it, the `REPRODUCES DATA LOSS` tests must be inverted to the expected behaviour written in their comments, then the Package 3 smoke run repeated. |

## B2 — A note saved after a failed load overwrites the unreadable record (DATA LOSS, open)

**Still open on 7798074.** Startup restore now fails visibly ("…Saved data was not deleted.
Export current work before replacing it.") and leaves the bytes, but the next successful note
or route save still replaces them. Test: "REPRODUCES DATA LOSS (B2)" in
`mission-recovery-sessions.spec.ts`.

| Field | Detail |
| --- | --- |
| Reproduction | Stored record exists but fails validation (for example, one out-of-bounds point) while still holding readable notes. Load Route reports "Saved mission is invalid…". Save a new note. |
| Expected | Unreadable bytes are kept aside for manual recovery or the save is refused with a clear message. |
| Observed | The record is replaced; its notes are gone. Corrupt JSON is correctly left untouched by Load Route itself. |
| Evidence | `mission-recovery.spec.ts`: "REPRODUCES DATA LOSS: a note saved after a failed load overwrites the unreadable record". |
| Owner / fix | Coordinator, same change as B1. |
| Retest | Pending. |

## B3 — On a phone the map is off-screen or nearly so (UNUSABLE CONTROL, fixed in b28f6ad)

**Retest on merge e30a3fe:** the phone page scrolls; map at y = 666 px, 178 px visible on first
view, the full 488 px visible when scrolled into view; no horizontal overflow
(`phone-390-offline.png`, `phone-390-map-scrolled-into-view.png`). The map-first layout in the
design review remains an improvement, not a blocker. Record of the finding below.

| Field | Detail |
| --- | --- |
| Tested revision | Production builds of 842ad3d (run `2026-11-15T15-18-08-462Z-vcdn2y`) and 2626a6b (run `…r0noe4`), `http://127.0.0.1:4310/`, Chrome 157 headless at 390 × 844 (Package 3 check 9) |
| Reproduction | Open the app at 390 × 844 (or any phone in portrait). Do not collapse the panel. |
| Expected | The map is the main surface and can be tapped to place route points. |
| Observed | **842ad3d:** the new Mission Decision Summary sits above the map; the map starts at y = 898 px, so **0 px is visible** without scrolling, with or without Collapse Panel. **2626a6b:** 89 px visible, 347 px with Collapse Panel. Both: status pills, two sets of layer toggles and the map toolbar take the top; no horizontal overflow. Desktop 1366 × 768 on 842ad3d: about 270 px of map. |
| Evidence | `docs/design/takou-screens/phone-390-offline.png`, `phone-390-panel-collapsed.png`, `tools/qa/takou/results/latest.json` (`visibleDefault`, `visibleCollapsed`) |
| User impact | Route drawing on a phone is close to impossible without first finding Collapse Panel. Browser emulation only; confirm on Royce's Samsung. |
| Proposed owner / fix | Emma 1 (shell/header layout and the decision summary) with Willy (map toolbar). Design review problem 2: compact phone header, map first at ≥ 55 % height, decision summary collapsed by default on phones, one layer-toggle set. |
| Retest | Pending. Rerun the harness; target `visibleDefault` ≥ 460 at 390 × 844. |

## B4 — Windows builds produce a different offline-pack version (LOW, open)

| Field | Detail |
| --- | --- |
| Observed | Windows checkout vs public candidates: 2626a6b pack `ce81d3668c27…` vs `a80ff718c27e…`; 842ad3d pack `f3ac6a3865bf…` vs 3d47a7b `e490cf570d50…`. In both cases only `index.html` differs, by 16 CR bytes. `src/index.html` is checked out with CRLF (`git ls-files --eol`: `i/lf w/crlf`). |
| Impact | Deploying from a Windows machine changes the pack version, so installed users get an "update" that changes nothing; build identity checks across team machines disagree. No functional change. |
| Proposed owner / fix | Coordinator: add `src/index.html text eol=lf` (or `src/** text eol=lf`) to `.gitattributes`, then renormalise. |
| Retest | Pending. Windows build pack hash should then equal the Linux build's. |

## Presentation claims vs deployed capability

Checked `README.md`, `docs/PRESENTATION.md`, `docs/DEMO_SCRIPT.md`, `docs/JUDGES_QA.md`,
`docs/AI_USE.md` and `SOUL.MD` for terrain, calibrated distance, safety, AI, VR and
physical-device statements. No document claims measured terrain, metric distance, a safety
rating, runtime AI or immersive VR; those boundaries are stated correctly. Items to correct
before judging (owner: Enzo Agent 2 for presentation documents, coordinator for AI disclosure):

| # | Where | Problem | Proposed wording / action |
| --- | --- | --- | --- |
| C1 | `docs/JUDGES_QA.md:47` | Says official challenge requirements are unverified because of a 403. The Details text is now in `docs/challenge/` (REQUIREMENTS.md says not to keep claiming it is unknown). | "Details text supplied and assessed in docs/challenge/REQUIREMENTS.md; Resources tab, submission fields and deadline timezone still unverified." |
| C2 | `docs/JUDGES_QA.md:46` (after b28f6ad: say startup restores automatically) | Calls Royce's issue "note persistence across device standby". His report says app close/reopen, and B1 now explains a real loss path. | "Saving before Load Route after reopening overwrites saved notes (B1, fix pending); browser restart recovery passes when Load Route is pressed first." |
| C3 | `docs/DEMO_SCRIPT.md:55` (after b28f6ad: show the restore message instead) | Correctly says to press Load Route, but does not warn presenters against saving first. | Add: "Do not press Save Route or save a note before Load Route" until B1 is fixed. |
| C4 | `docs/PRESENTATION.md:26` | "WebGL resources released on exit" is stronger than the evidence. The code disposes geometries, materials and textures and the smoke test shows the viewer DOM is removed; GPU memory release is not measured. | "Viewer is removed and its Three.js objects disposed when closed." |
| C5 | `docs/AI_USE.md:24`, `docs/JUDGES_QA.md:59` | AI disclosure names OpenAI Codex and Google Antigravity only. Takou's QA branch (tests, harness, these documents) was produced with Anthropic Claude Code under his supervision. | Add Claude Code to the tool list with the scope above. Development tooling only; no runtime AI. |
| C6 | `docs/DEMO_SCRIPT.md:31` | Says distance is "reported as unavailable: pixel scale is uncalibrated". Since 3d47a7b the app shows a derived planar distance (observed "Derived planar: 400.4 m (0.25 m/px …)"). The script now contradicts the screen. | "Planar distance in the projected map plane from the verified 0.25 m crop; not terrain-following; slope and safety unavailable." |
| C7 | `docs/JUDGES_QA.md:29` | States the raster has unverified calibration and metric distance is unavailable. Outdated for the v2 image. | Same correction as C6; keep "science records are not located on this image" (still true). |
| C8 | Physical device | `PWA_ACCEPTANCE.md` on Royce's branch records Samsung install/offline as passed, but that branch is unreviewed and its note test failed. | Keep physical-device acceptance **pending** in all presentation material until a reviewed report on one exact deployed revision exists. |

## Checklist status

Rows are filled from actual runs in [TAKOU_RELEASE.md](TAKOU_RELEASE.md); see that file for
commands and raw results.

| Area | State |
| --- | --- |
| Lockfile install | **Pass** on Node 24.22.1 (system Node 24.11.1 is below `engines` and is refused by the Angular CLI) |
| Unit tests | **Pass** 232/232 (21 files), including the 9 new recovery tests |
| Worker tests | **Pass** 11/11 |
| Python data tests | **Pass** 54/54 with Pillow 13.0.0; 15 fail without Pillow (dependency missing, not data) |
| Production build | **Pass**, initial 450.97 kB, Leaflet CommonJS warning only |
| Production serve, console/network, manifest/icons/worker/pack | **Pass** locally: 0 page/console errors, 0 failed requests, 0 404s; 3 icons 200; worker registered; 19-file pack verified |
| Disconnected full-process recovery (desktop Chrome) | **Pass**, restored automatically at startup on 7798074 (B1 fixed); B2 still open for unreadable records |
| Phone-width usability | **Pass** on 7798074 (map reachable by scrolling, 488 px); was 0 px on 842ad3d |
| Public candidate link | **Reachable** anonymously (HTTP 200 for `/`, manifest, worker, pack); pack `a80ff718…` matches its record. Production `marswalk-jet.vercel.app` also 200 but older. |
| Physical Android/iOS installed recovery | **Pending** (Royce / Willy 2). Browser emulation is not device acceptance. |
| Official submission portal fields, upload limits, deadline timezone | **Unverified.** Only the Details text is in `docs/challenge/`. The 10 pm deadline is user-reported; timezone unconfirmed. Owner: coordinator/user. |
| Final submission | Not made by this work. |
