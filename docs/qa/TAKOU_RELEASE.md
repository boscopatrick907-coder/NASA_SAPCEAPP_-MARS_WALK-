# Takou release QA — baseline, persistence and smoke results

Takou (Charles) with a coding agent, 15 November 2026. Branch
`feature/takou-release-integration` from `main` **2626a6b016d0f40385ff3c3f1b4adbb19ccf1605**
(2026-11-15 13:35 UTC), then rebased onto `main` **842ad3d**, then merged with `main` **7798074** (B1/B3 fixes) and
re-verified (last two sections).
Every number below was produced in this environment on this date;
no historical count is copied. Blockers: [TAKOU_RELEASE_BLOCKERS.md](TAKOU_RELEASE_BLOCKERS.md).

## Environment

| Item | Value |
| --- | --- |
| OS | Windows 10 Pro 10.0.19045, Intel i5-6200U, 11.9 GB RAM (not the Linux setup in the brief) |
| Node / npm | v24.11.1 / 11.6.2. **Below** the repository `engines` range (`^24.15.0`) and the documented 24.22.1 / 11.9.0. |
| Git | 2.54.0.windows.1, `core.autocrlf=true`; `.gitattributes` keeps scientific JSON LF (checked: `i/lf w/lf`). |
| Python | 3.14.6 (`python`; `python3` is not available on this Windows install) |
| Browser | Google Chrome 157.0.8103.51 (installed, used by the Playwright harness) |
| Network | Unstable and slow: DNS `EAI_AGAIN`, repeated `ECONNRESET`, about 57 KB/s measured on a 924 KB tarball |
| Runtime vs public candidate | `git diff 38516f8 2626a6b -- src public tools/pwa angular.json package*.json vercel.json` changes only `public/data/terrain/README.md` (not in the offline pack). |

## Package 1 — reproducible release baseline

| Step | Command | Actual result |
| --- | --- | --- |
| Install (system Node) | `npm ci` on Node 24.11.1 / npm 11.6.2 | Two attempts failed on the network (`Exit handler never called!` after `ECONNRESET`, then `ECONNRESET` after 804 s). Third attempt with `--prefer-offline --maxsockets=3 --fetch-retries=10`: **added 303 packages in 22 min, 0 vulnerabilities**, 46 `EBADENGINE` warnings. |
| Angular CLI on system Node | `ng version` | **Refused**: "The Angular CLI requires a minimum Node.js version of v22.22.3 or v24.15.0 or v26.0.0." System Node 24.11.1 cannot run `npm test` or `npm run build`. |
| Supported Node | Official `node-v24.22.1-win-x64.zip` from nodejs.org, SHA-256 `d2046d28…b95fa5` matched `SHASUMS256.txt`; extracted outside the repo, put first on `PATH` | Node **v24.22.1**, npm **11.19.1** (system install unchanged) |
| Install (supported Node) | `npm ci --prefer-offline` | **exit 0 in 371 s**, 0 engine warnings. npm 11.19 printed that install scripts were not run for `@parcel/watcher`, `esbuild`, `lmdb`, `msgpackr-extract`; tests and build below still pass. |
| Unit tests | `npm test` | **21 files, 232 tests passed**, 55.5 s (223 existing + 9 new in `mission-recovery.spec.ts`; the new file alone: 9/9 passed with the verbose reporter) |
| Worker tests | `npm run test:pwa` | **11 passed, 0 failed** (Node 24.22.1; also 11/11 on 24.11.1) |
| Production build | `npm run build` | **exit 0 in 35 s.** Initial 450.97 kB raw / 114.62 kB transfer; lazy viewer 597.05 kB, planner 15.54 kB, notebook 13.68 kB. Existing warning: Leaflet is CommonJS. "Offline pack ce81d3668c27: 19 assets, 1678092 bytes. Archive excluded." |
| Data tests, no Pillow | `python -m unittest discover -s tools/data -p "test_*.py"` | 54 run, **8 failures + 7 errors**; every one says "Pillow is required for full image verification" |
| Data tests, with Pillow | Same command using a venv outside the repo with `pip install -r tools/data/requirements.txt` (Pillow 13.0.0) | **54 passed** in 37.8 s; no tracked file changed |
| Production serve | `node tools/qa/takou/serve.mjs --root dist/marswalk/browser` (mirrors `vercel.json`: no SPA fallback, `no-store`/`no-cache`/`nosniff`) | Served at `http://127.0.0.1:4310/`; self-test: webmanifest `application/manifest+json`, missing file 404, encoded `../` traversal 404 |

### Build identity vs public candidate

Local pack `ce81d3668c27…` (1,678,092 bytes) differs from the public candidate's
`a80ff718c27e…` (1,678,076 bytes, fetched anonymously today, HTTP 200). Per-file hash comparison:
**only `index.html` differs**, and only by 16 carriage returns. `src/index.html` is checked out
with CRLF on Windows (`git ls-files --eol`: `i/lf w/crlf`) because `.gitattributes` pins only
JSON, the webmanifest and SVG icons to LF. Same app, different pack version. Blocker **B4** (low).

### Production checks in the browser (from the Package 3 run)

Clean profile, Chrome 157.0.8103.51 headless: raster `PIA26306_derived_2048.jpg` decoded at
2048 × 1042 (manifest values); worker registered with scope `http://127.0.0.1:4310/`;
webmanifest served as `application/manifest+json`; all three manifest icons HTTP 200
`image/png`; offline pack prepared and verified (pack `ce81d366…`; one Cache Storage cache named
`marswalk-pack:<origin>:<version>:<id>` holding 20 entries for the 19 pack files; the extra
entry was not itemised). **0 page errors, 0 console errors, 0 failed requests,
0 server 404s** across the whole run.

Offline-pack contents (19): three lazy chunks, `main-*.js`, `styles-*.css`, `index.html`,
`favicon.ico`, `manifest.webmanifest`, three Leaflet media images, three icons, and
`data/environment.json`, `data/image-pack.json`, `data/imagery/PIA26306_derived_2048.jpg`,
`data/manifest.json`, `data/markers.json`. The 2.6 MB archival `PIA26306.jpg` is excluded.

## Package 2 — mission persistence investigation

### Finding

Saved notes are never lost by closing and reopening on their own. They **are** lost if, after
reopening, the user saves anything before pressing **Load Route**. Details, file/line and
proposed fix: blocker **B1** (and **B2** for unreadable records).

| Question from the brief | Answer from code and tests |
| --- | --- |
| Unsaved draft vs saved observation | The Notebook draft lives only in component memory (`notebook.component.ts` `draftText`). It is never written to storage, so a draft typed but not saved is gone after a restart by design. A note is saved only when the green success message appears; `addObservation()` then writes route + notes to `localStorage` key `marswalk:v1:<imageRef>`. |
| Startup display vs explicit recovery | Startup never restores (`mission.service.ts:62`). The Notebook shows "No observations recorded yet for this mission session." even when a saved mission exists. Only **Load Route** restores, and it restores notes too. |
| Data loss vs confusing instructions | Both. Confusing: the empty Notebook and the route-only button label. Real loss: `saveRoute()` (`:140`) and `addObservation()` (`:183`) overwrite the stored record with the in-memory state; after a restart that state is empty. |
| Different preview origins | Each Vercel preview URL is a separate origin with separate `localStorage`. A note saved on one preview URL (or in a browser tab) is not visible in an app installed from another URL. Royce's report must state the exact origin used for saving and for the installed app. |

### Regression tests added

`src/app/core/mission-recovery.spec.ts` (new file; `mission.service.ts` untouched). Each
"session" is a new TestBed + MissionService sharing only `localStorage`.

| Test | What it proves |
| --- | --- |
| restores the exact saved route and observation only after explicit Load Route | Startup shows nothing and does not touch storage; Load Route restores identical route, note ids and timestamps; second export equals first in imageRef, route and observations |
| persists a successfully saved note (and the current route) without pressing Save Route | A note save also saves the current route |
| keeps the previously saved mission when a later note save fails | Failed save leaves stored bytes and visible notes unchanged |
| REPRODUCES DATA LOSS: a note saved after restart but before Load Route replaces earlier notes | B1, note path |
| REPRODUCES DATA LOSS: Save Route after restart but before Load Route erases saved notes | B1, route path (matches Royce's report) |
| reports a corrupt saved record without changing state or deleting the stored bytes | Corrupt JSON is kept for recovery |
| REPRODUCES DATA LOSS: a note saved after a failed load overwrites the unreadable record | B2 |
| reports unavailable storage on load and save without publishing unsaved notes | `SecurityError` on get/set handled; state unchanged |
| keeps missions for a different image reference separate and untouched | imageRef isolation |

The three `REPRODUCES DATA LOSS` tests assert today's behaviour so the reproduction runs in CI.
They will fail when the coordinator fixes B1/B2; that is intended. Invert them to the expected
behaviour written in their comments.

**Run:** `npx ng test --watch=false --include src/app/core/mission-recovery.spec.ts
--reporters=verbose` on Node 24.22.1 → **9/9 passed**, including the three reproductions. The
full suite (`npm test`) passes 232/232 with this file included.

The Package 3 browser run confirms the same picture end to end: after a full browser-process
restart offline, the Notebook showed "No observations recorded yet for this mission session."
and the planner had no points, while the saved record was still in storage. Load Route then
restored the exact route and note, and the second export matched the first.

### Manual device reproduction for Royce (isolated test data)

1. Use one exact origin and write it down (preferably the public candidate URL).
2. Draw start, waypoint, destination. Save a note `ROYCE-<time>`; wait for "Observation saved".
3. Save Route. Export. Check the note text is in `observations` of the JSON.
4. Prepare offline; wait for "Pack verified".
5. Close the app fully (recent-apps swipe). Turn on airplane mode. Reopen from the launcher.
6. **Before touching anything else**, Route Planner → Load Route. Open Notebook. Export again.
7. Compare `imageRef`, `route`, `observations` of both exports.
8. Separately, to confirm B1 on the device: repeat 1–5, then at step 6 press Save Route first,
   then Load Route. The note should be missing; that is B1, not a device storage fault.

## Package 3 — end-to-end release smoke test

Harness: [`tools/qa/takou/`](../../tools/qa/takou/README.md). Its own `package.json` and
lockfile pin `@playwright/test` 1.64.1 (released 14 Oct 2026); the app's `package.json` and
`package-lock.json` are untouched. It drives the installed Google Chrome (no Playwright browser
download), a new temporary profile per run, and a unique note `TAKOU-SMOKE-<timestamp>`.

**Reproduce:** from the repository root, `npm ci`, `npm run build`, then
`cd tools/qa/takou && npm ci && npx playwright test -c playwright.config.mjs`.

**Recorded run** (`tools/qa/takou/results/latest.json`, run `2026-11-15T15-06-12-055Z-r0noe4`):
runtime source 2626a6b (working tree had only the untracked QA files), production build
`dist/marswalk/browser`, origin `http://127.0.0.1:4310/`, Google Chrome 157.0.8103.51 headless
(UA `HeadlessChrome/157.0.0.0`), Windows 10, Node 24.22.1. **9 passed in 21.8 s.**
0 page errors, 0 console errors, 0 failed requests, 0 server 404s.

| # | Check | Observed |
| --- | --- | --- |
| 1 | Real raster, manifest, icons, worker | `PIA26306_derived_2048.jpg` decoded at **2048 × 1042** = manifest; worker scope `http://127.0.0.1:4310/`; webmanifest and 3 icons HTTP 200 |
| 2 | Science selection, Previous/Next, filters | 3 records. "Record 1 of 3 matching records" → Next → Vera Rubin Ridge, "Record 2 of 3…" → Previous back to Mount Sharp Boxwork. Filtering to *measured* kept the selected record open with the notice "Selected record is outside the current filter results."; Clear filters removed the notice and kept the selection |
| 3 | Route drawing, Reset View, Focus Route | Start (680.3, 409.6), waypoint (1022.7, 583.2), destination (1365.1, 459.6). Reset View, Focus Route and an inspect-mode map click left all three rows identical; mode stayed Inspect. Save Route: "Route saved locally" |
| 4 | Note save, failed-save draft, export | Note saved, draft cleared, Notebook (1). With `Storage.prototype.setItem` made to throw in the page: error "…not saved…", the draft stayed in the text box, count stayed 1, stored bytes unchanged. Export JSON contained the note and 1 waypoint |
| 5 | Invalid and mismatched imports | "The selected file is not valid mission JSON." and "Invalid mission or a different image version. Current work is unchanged."; stored bytes, note count and route rows unchanged |
| 6 | Full offline pack | "Install & offline · Connection available · **Pack verified**"; Verify saved pack still verified; panel shows the local pack prefix |
| 7 | Disconnected full-process recovery | Browser process closed, server stopped, same profile relaunched with offline emulation. App and raster loaded (2048 wide), panel said **Disconnected**. **Before Load Route:** Notebook (0), "No observations recorded yet for this mission session.", no route rows, saved record present in storage. **After Load Route:** "Route loaded", identical route rows, Notebook (1) with the exact note; second export equal to the first in `imageRef`, `route` and `observations` |
| 8 | Optional flat viewer (offline) | Opened with 1 canvas (no WebGL fallback); `app-viewer3d` removed from the DOM on Close and on switching tab. GPU memory not measured |
| 9 | 390 × 844 | No horizontal overflow (scrollWidth 390 = clientWidth 390), also after switching tab; note visible in Notebook. **Visible map height: 89 px by default, 347 px with the side panel collapsed** (map element box 487 px, mostly clipped). Reported as blocker **B3** |

Harness fixes during this session (not product changes): run 1 failed at check 2 because the
test read the heading before Angular re-rendered; replaced with an auto-waiting assertion. The
first version of check 9 measured the map element box and would have hidden B3; it now
measures the on-screen height.

**Limits:** local `http://127.0.0.1` origin, not the Vercel origin (storage does not transfer
between origins). Offline = stopped server + browser offline emulation. Desktop Chrome
automation is **not** physical Android/iOS or installed-launcher acceptance; Royce's device
retest is still needed.

## One observed workflow (handoff)

Draw start → waypoint → destination, save note `TAKOU-SMOKE-…`, Save Route, export, prepare
the full pack, close the browser, stop the server, reopen offline: map and science load, the
Notebook looks empty, Load Route brings back the exact route and note, and the second export
matches the first.

## Re-verification after rebase onto main 842ad3d

While this work ran, `main` gained 13 commits, including `3d47a7b` (new 2048 × 2048 HiRISE
crop `hirise-psp001752-red-center-2048-025m-v2`, verified 0.25 m/px, planar route distance)
and Emma's mission decision workspace and briefing. `mission.service.ts`, `package.json` and
the lockfile did not change. The three unpushed QA commits were rebased onto `842ad3d`
(new files only, no conflicts) and everything was run again on Node 24.22.1:

| Check | Result on 842ad3d + QA commits |
| --- | --- |
| `npm test` | **24 files, 246 tests passed** (237 on main + 9 recovery tests) |
| `npm run test:pwa` | **11 passed** |
| `npm run build` | **exit 0**; initial 473.01 kB raw / 119.16 kB transfer; Leaflet CommonJS warning only; pack `f3ac6a3865bf…`, 19 assets, 2,609,930 bytes |
| Python data tests (Pillow 13.0.0) | **54 passed** in 43.3 s |
| Smoke harness | **9 passed in 36.3 s**, run `2026-11-15T15-18-08-462Z-vcdn2y`; 0 page/console errors, 0 failed requests, 0 server 404s |
| Public candidate `https://marswalk-9dtnpllyx-boys-band.vercel.app/` (source 3d47a7b) | HTTP 200 anonymously; pack `e490cf570d50…` (2,609,914 bytes) differs from the local build **only in `index.html`** (CRLF, B4) |

Observed on this revision:

- Raster `PSP_001752_1750_RED_crop_2048.jpg` decoded at **2048 × 2048** = manifest.
- After drawing a route the summary shows "Derived planar: 400.4 m (0.25 m/px …)", with the
  manifest limitation that it is a projected planar length, not terrain-following or a safety
  assessment. The three science records are still `positionStatus: unavailable`.
- **B1 unchanged:** after the offline full-process restart the Notebook again showed
  "No observations recorded yet for this mission session." until Load Route; then the exact
  route and note came back and the second export matched the first.
- **B3 worse:** at 390 × 844 the new Mission Decision Summary sits above the map, which now
  starts at y = 898 px, below the screen: **0 px of map visible without scrolling**, also
  with the panel collapsed. At 1366 × 768 about 270 px of map shows.
- In check 1 the worker had not finished registering yet (`getRegistration()` empty); the
  full pack still prepared and verified in check 6. Not treated as a defect.
- Harness change for this revision: the science details label is now "Record-level evidence
  category", so check 2 reads the value instead of the old label; a 20 s default timeout was
  added so a missing element fails fast instead of waiting for the 4-minute test timeout.

Screenshots in `docs/design/takou-screens/` and `tools/qa/takou/results/latest.json` are now
from this run. The 2626a6b sections above remain the record for that revision.

## Re-verification after merging main 7798074 (B1 and B3 fixes)

After the push, `main` gained `b28f6ad` "Fix mobile map layout and restore saved missions on
startup" (coordinator) and `7798074`. `b28f6ad` also added the coordinator's own
`src/app/core/mission-recovery.spec.ts`, the path used by my first commit. Merge `e30a3fe`
(main merged into this branch, no force push) keeps the coordinator's file unchanged, moves my
tests to `src/app/core/mission-recovery-sessions.spec.ts` and inverts the two B1 reproductions
into "B1 fixed: …" guards. Test names in the Package 2 table above refer to the earlier file.

| Check | Result on merge e30a3fe (main 7798074 + QA) |
| --- | --- |
| Recovery specs (verbose) | **13 passed**: coordinator's 4 + my 9, including both "B1 fixed" tests; "REPRODUCES DATA LOSS (B2)" still passes, so **B2 is still open** |
| `npm test` | **25 files, 250 tests passed** (241 on main + 9) |
| `npm run test:pwa` | **11 passed** |
| `npm run build` | **exit 0**; initial 474.97 kB raw / 119.62 kB transfer; pack `3653cf784ff4…`, 19 assets, 2,611,959 bytes. New warning from `b28f6ad`: `shell.component.scss` exceeds its 4.00 kB budget by 324 bytes (4.32 kB). Leaflet CommonJS warning as before. |
| Python data tests | Not re-run: `public/data` and `tools/data` are unchanged since 842ad3d (54/54 there) |
| Smoke harness | **9 passed in 22.2 s**, run `2026-11-15T15-49-52-598Z-3u6xee`; 0 page/console errors, 0 failed requests, 0 server 404s |
| Public review URL `https://marswalk-review-boys-band.vercel.app/` (source b28f6ad) | HTTP 200; pack `41a3ae779880…` differs from the local build **only in `index.html`** (CRLF, B4) |

Observed in the browser:

- **B1 fixed.** After the full browser-process restart with the server stopped and offline
  emulation, the page showed "Restored saved route and 1 observation(s) on this device."
  **before any button was pressed**; Notebook (1) with the exact note, the same three route
  rows, and the export equal to the first in `imageRef`, `route` and `observations`. An
  explicit Load Route afterwards changes nothing.
- **B3 fixed (map reachable).** At 390 × 844 the phone page now scrolls: the map starts at
  y = 666 px, 178 px is visible on first view, and the whole 488 px map is visible once
  scrolled into view (scrollY 310). No horizontal overflow. The design proposal (map first)
  would still improve the first view.
- Harness changes for this revision: check 7 now expects automatic restore; the planner is
  lazy-loaded, so the test waits for its rows; route rows are read cell by cell (innerText
  dropped the separators while the table was not laid out); check 9 also measures the map
  after scrolling and measures the collapsed state from the top of the page.
