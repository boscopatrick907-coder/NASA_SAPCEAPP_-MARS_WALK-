# Willy 2 — Windows install and release verification

## Run identity

| Field | Value |
| --- | --- |
| Tested commit | `d6801a417a5a32375bf6453deadcc024d1460919` |
| Branch | `feature/willy-pwa-install-assets` |
| Platform | Windows 11 |
| Node | `v24.21.0` |
| npm | `11.19.0` |
| Git | `2.51.0.windows.1` |

The branch was fast-forwarded to the tested commit before verification. The existing staged `docs/qa/PWA_INSTALL_ASSETS.md` and original `stash@{0}` were preserved.

## Verification results

| Check | Tested revision | Platform | Command/action | Actual result | Evidence / remaining blocker |
| --- | --- | --- | --- | --- | --- |
| Locked install | `d6801a4` | Windows 11 | `npm.cmd ci` | **PASS**; 303 packages installed | npm warned that install scripts for `@parcel/watcher`, `esbuild`, `lmdb` and `msgpackr-extract` were not approved. No package manifest or lockfile changed. |
| Canonical data-manifest bytes | `d6801a4` | Windows 11 | Inspect byte count, SHA-256 and `git ls-files --eol` | **PASS after clean-file refresh**; 1,200 bytes; SHA-256 `40381b96e243b6876c4aa796d4cfcb5b222592982a5c1726101f467622418f82`; `i/lf w/lf attr/text eol=lf` | The documented `git restore` command exited successfully but did not rewrite the clean CRLF worktree file. It initially remained 1,228 bytes (`e3c33a304ae01e657d5e282fa07ca7143f8ed9a76a359419e5320238e750d53a`). After backing it up, the exact raw `HEAD` blob bytes were written to the worktree file and verified. The Git blob and scientific content were unchanged. |
| Other LF-pinned assets | `d6801a4` | Windows 11 | Check worktree bytes and `git ls-files --eol` | **PASS after the same clean-file refresh**; webmanifest 603 bytes, SVG 361 bytes; both `i/lf w/lf attr/text eol=lf` | Webmanifest SHA-256 `12c50a0f0033fbc0a890be2d56ddf3594d217db58d45eaa5a0b71eafa3513490`; SVG SHA-256 `edd13d0e30c646395eef13a844e3d87d15a5a32ad91bcc4999dfa3deca0f0afc`. Worktree backups were saved before refresh. |
| PNG decode and opacity | `d6801a4` | Windows 11 | Decode with `System.Drawing`; read every pixel | **PASS**; 192×192 and two 512×512 PNGs fully decoded as `Format24bppRgb`, minimum alpha 255 | Source fingerprints match the documented inventory: 192px SHA-256 `137194e041be8e171dfa40bbd5b333f69cb6c268957c49fa4e2525b464394faa`; both 512px files SHA-256 `3ad6eab9da3faa9dfcb2415f979d2fca89d89e7f8a9a1c084ca17481c3b72ad9`. |
| Root production build | `d6801a4` | Windows 11 | `npm.cmd run build` | **PASS**; Angular compilation and full pack generation; 18 assets, 1,655,461 bytes; pack version prefix `2821c139b35b` | `offline-pack.json` and `service-worker.js` generated. Leaflet CommonJS warning remains. The first sandboxed attempt could not read source directories; the same command passed with workspace access. |
| `/marswalk/` production build | `d6801a4` | Windows 11 | `npm.cmd run build -- --base-href /marswalk/` | **PASS**; Angular compilation and full pack generation; 18 assets, 1,655,470 bytes; pack version prefix `70091eb3af62` | `offline-pack.json` and `service-worker.js` generated. The built index uses `<base href="/marswalk/">`; the service worker contains the generated pack version. Manifest, icon and required data entries were present in the pack and built bytes matched source bytes. |
| Local root HTTP assets | `d6801a4` | Windows 11 | Serve root build locally; GET page, manifest, icons, data manifest, pack and worker | **PASS**; all requested root URLs returned HTTP 200 | `/` 2,317 bytes; manifest 603; PNGs 9,600 / 19,227 / 19,227; data manifest 1,200; offline pack 3,023; service worker 7,830. Content types were HTML, `application/manifest+json`, PNG, JSON and JavaScript as expected. |
| Local `/marswalk/` HTTP assets | `d6801a4` | Windows 11 | Serve build under `/marswalk/`; GET corresponding subpath URLs | **PASS**; `/marswalk/` and manifest, icons, data, pack and worker URLs returned HTTP 200 | A root-level `/manifest.webmanifest` request returned 404, confirming the output was served under the actual subpath. |
| Deployed-host HTTP assets | Deployed revision identified in project notes as `b6669fb` (not exposed by HTTP response) | HTTPS | GET `https://marswalk-jet.vercel.app/` and manifest, icons, worker and pack | **PARTIAL**; all requested URLs returned HTTP 200 | Served response sizes: page 2,272; manifest 603; icons 9,600 / 19,227 / 19,227; worker 7,603; offline pack 2,871 bytes. The served page had a root base, manifest link and theme-color, but no `apple-touch-icon` link. The host is older than the local candidate containing the coordinator's iOS discovery link. |
| Physical Android/iOS installation | Not tested | Physical device required | Add to Home Screen; inspect launcher and standalone app | **NOT PERFORMED / PENDING** | No physical target device was available for this run. No installation or launcher appearance is claimed. |
| Installed offline recovery | Not tested | Physical device and current deployment required | Disconnect, close/reopen installed app, recover saved mission and verify route/note/export | **NOT PERFORMED / PENDING** | Requires a current deployed candidate and target-device access. |
| Browser install/offline workflow | Not tested | Browser required | Isolated-profile preparation, install and disconnected restart | **NOT PERFORMED** | HTTP checks do not establish browser installation, service-worker activation or offline mission recovery. `npm test` was not run; this verification task was focused on Windows builds, assets and HTTP serving. |

## Manifest and icon declarations

The webmanifest parsed successfully. It declares MARSWALK name and short name, English language, `./` start URL and scope, standalone display, matching `#0b0e14` theme/background colors, and relative PNG icon paths with the declared sizes, MIME types and purposes. The local root and subpath index links resolve to the correct manifest and icon URLs.

## Blockers and next steps

1. Deploy a current reviewed candidate so the hosted page exposes the relative `apple-touch-icon` link already present in the merged source; repeat the hosted URL checks against that exact deployed revision.
2. Run Add to Home Screen and launcher/standalone checks on an available physical Android Chrome or iOS Safari device.
3. On the installed app, complete disconnected close/reopen and saved route/note recovery, including export. Record the device model, OS, browser and actual outcomes.
4. Keep the unapproved npm install-script warnings and Leaflet CommonJS warning visible for coordinator review; they did not block either production build.

No physical-device acceptance, current-host iOS launcher discovery, or installed offline mission recovery is claimed by this report.

## Follow-up verification — Willy 2 assignment

Run on 15 November 2026 in the original PWA worktree, branch `feature/willy-pwa-install-assets`, at commit `9b4093daf2f32b7b2ad9412d0ac4601dac5208e6`. Existing staged `docs/qa/PWA_INSTALL_ASSETS.md` and the existing stash were preserved. No application source, generated asset, worker, build, or hosting configuration was changed for this follow-up; the only intended file change is this QA report.

| Check | Revision / platform | Command or action | Actual result | Remaining limitation |
|---|---|---|---|---|
| Root production build | `9b4093d`, Windows, Node 24.21.0 / npm 11.19.0 | `npm.cmd run build` | **PASS**; Angular build and full offline pack generated; 18 files, 1,655,461 bytes, pack version prefix `2821c139b35b`. | Existing Leaflet CommonJS optimization warning. |
| `/marswalk/` production build | `9b4093d`, Windows | `npm.cmd run build -- --base-href /marswalk/` | **PASS**; full offline pack generated; 18 files, 1,655,470 bytes, pack version prefix `70091eb3af62`. | Existing Leaflet CommonJS optimization warning. |
| Root-served production app | `9b4093d`, local Edge isolated profile | Served root build at `http://127.0.0.1:4173/`; loaded app, prepared offline pack, then disconnected in the browser. | **PASS**; service worker controlled the app, real raster/science content loaded, offline pack reported 18/18 verified. | Browser workflow evidence only; not a physical installed app. |
| Offline mission workflow | Same local root build and browser session | While offline, created start/waypoint/destination, saved route, saved a note, exported JSON; closed browser and stopped local server; reopened the same profile and recovered route/note. | **PASS**; route and note persisted in local mission storage and appeared after reopening while the app origin/server was unavailable. Exported `marswalk-mission.json` contained the same image reference, route and note. | Export verified as a browser download; no physical-device transfer/recovery test. |
| Root build assets | `9b4093d`, local HTTP | GET `/`, manifest, each PNG icon, data manifest, offline pack, worker and raster path on `127.0.0.1:4173`. | **PASS**; all requested resources returned HTTP 200 with expected content types. | No archived network trace. |
| Subpath build assets | `9b4093d`, local HTTP under `/marswalk/` | `npm.cmd run build -- --base-href /marswalk/`; serve output only under `/marswalk/`; GET page, manifest, all icons, data manifest, pack, worker and the `assetPath` read from that manifest. | **PASS**; every subpath URL returned HTTP 200, including raster `data/imagery/PIA26306_derived_2048.jpg`; root `/manifest.webmanifest` returned 404. No root fallback was used. | No archived network trace. |
| Service-worker tests | `9b4093d`, Windows | `npm.cmd run test:pwa` | **PASS**; 11 tests passed, 0 failed. | — |
| Angular application tests | `9b4093d`, Windows | `npm.cmd test` (first sandbox attempt was denied workspace reads; rerun with workspace access) | **PASS**; 16 test files and 144 tests passed, 0 failed. The jsdom run printed two `HTMLCanvasElement.getContext()` not implemented warnings; they did not fail tests. | Canvas-dependent rendering is not exercised by those jsdom tests. |
| Public HTTPS asset check | Deployed host `https://marswalk-jet.vercel.app/`; project notes identify served revision as `b6669fb` (host response does not expose a commit) | HTTP GET page, manifest, all three icons, worker, offline pack and data manifests. | **PASS for requested HTTP resources**; all returned HTTP 200 with expected response types. The served HTML is an older deployment without `apple-touch-icon`. | No public-browser interaction completed in this run; this is not evidence of current candidate deployment or installation. |
| Browser installation prompt / physical install | Public deployment / physical Android or iOS | No physical device available; headless Edge's initial public-profile tab remained on Edge sync setup, so no actual public-origin install flow was verified in this follow-up. | **NOT VERIFIED**; no installation, launcher appearance, or standalone launch is claimed. | Repeat on the current reviewed HTTPS candidate and an actual Android Chrome or iOS Safari device. |

### Follow-up workflow details

The offline workflow used a fresh isolated Edge profile and the actual production root build. The application showed `Data Ready`; after explicit offline-pack preparation it showed `Offline pack verified` and `18 / 18 files verified`. With the browser network disabled, mission route creation, `Save Route`, `Save Observation`, and the JSON export controls all completed. The browser was closed and the local server stopped before reopening the same profile; the service worker served the app and the saved route and note were recoverable. This verifies browser storage and worker recovery against an unavailable origin, not physical-device installation.

The live HTTPS deployment's asset endpoints were reachable, but its revision is older than this worktree and its HTML lacks the `apple-touch-icon` link. This is an observed release gap; Patrick owns deployment. No hosting changes or deployment were made. The earlier historical table's pending physical-device items remain pending.

## Execution details added after independent review

### Initial Git state

Before fetching main, the branch was `feature/willy-pwa-install-assets` at `ac79be5876f80ce3c728c17756fa86f7873f2af0`; it was three commits behind `origin/main`. `git status --short --branch` showed only the existing staged modification to `docs/qa/PWA_INSTALL_ASSETS.md`. `stash@{0}` was `90e027034e605698f5981d2553c31519462ac33c`.

After the fast-forward to tested commit `d6801a417a5a32375bf6453deadcc024d1460919` and before `npm.cmd ci`, the only tracked worktree change was that same QA document, reapplied by Git's autostash as an **unstaged** modification. The stash remained unchanged. No clean-working-tree state is claimed for this run.

### Local HTTP server commands and requested URLs

Both temporary servers listened on `127.0.0.1:4173`. The root server mapped `/` to `dist/marswalk/browser/index.html`; the subpath server only served requests prefixed by `/marswalk/` from the same build directory. These are the inline Node commands used:

Root build:

```powershell
node.exe --% -e "const http=require('http'),fs=require('fs'),path=require('path');const root=path.resolve('dist/marswalk/browser');http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost').pathname;let rel=url.startsWith('/')?url.slice(1):url;if(!rel||rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}fs.readFile(file,(err,b)=>{if(err){res.writeHead(404);return res.end('not found')}const ext=path.extname(file);const types={'.html':'text/html','.webmanifest':'application/manifest+json','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon'};res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Content-Length':b.length});res.end(b)})}).listen(4173,'127.0.0.1',()=>console.log('ROOT-READY'))"
```

Subpath build:

```powershell
node.exe --% -e "const http=require('http'),fs=require('fs'),path=require('path');const root=path.resolve('dist/marswalk/browser');http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost').pathname;const prefix='/marswalk/';if(!url.startsWith(prefix)){res.writeHead(404);return res.end('outside subpath')}let rel=url.slice(prefix.length);if(!rel||rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}fs.readFile(file,(err,b)=>{if(err){res.writeHead(404);return res.end('not found')}const ext=path.extname(file);const types={'.html':'text/html','.webmanifest':'application/manifest+json','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon'};res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Content-Length':b.length});res.end(b)})}).listen(4173,'127.0.0.1',()=>console.log('MARSWALK-READY'))"
```

The root request loop used `Invoke-WebRequest` against `http://127.0.0.1:4173/`, `/manifest.webmanifest`, `/icons/marswalk-192.png`, `/icons/marswalk-512.png`, `/icons/marswalk-maskable-512.png`, `/data/manifest.json`, `/offline-pack.json` and `/service-worker.js`. The subpath loop used the same paths prefixed with `/marswalk/`; `curl.exe` also checked that the root-level `/manifest.webmanifest` returned 404 on the subpath-only server.

**Raster image HTTP request: NOT PERFORMED.** The local request loops did not request the raster path from `manifest.assetPath`; the hosted URL checks also did not request it. No raster HTTP status or response size is claimed.

### Archived logs

Build and HTTP results were observed in the interactive command output and summarized in this report. Earlier runs did not archive artifacts.

## Designated Public Candidate Acceptance Verification — 15 November 2026

**Target Origin:** `https://marswalk-m3n37k8ne-boys-band.vercel.app/` (Designated candidate from `PROJECT_HANDOFF.md`, source revision `cf0ffb7`)  
**Pack Version:** `4bb8ec987ae0320abd399e40660e75194763ed1622d4df7a4268902faafc2e81` (1,656,553 bytes, 19 cached entries)  
**Test Platform:** Windows 11 Pro 64-bit · Microsoft Edge 140.0.3485.81 (headless, dedicated profile `scratch/preview-acceptance-profile`, CDP automation)  
**Physical Device Status:** **UNVERIFIED** (tested on desktop Chromium persistent profile with emulated hard offline and full process restart; no physical Android or iOS device claimed).

### End-to-End Acceptance Results

| Step | Action / Workflow | Result | Evidence / Observed State |
|---|---|---|---|
| 1. Raster Load | Navigate to candidate URL online; await metadata and raster decode. | **PASS** | Title `Marswalk`, `mapState: null`, raster layer complete (`PIA26306_derived_2048.jpg`). Screenshot: `preview-acceptance-1-raster-ready.png`. |
| 2. Draw Route | Route Planner: place Start `(141, 571)`, Waypoint `(340, 642)`, Destination `(561, 747)`. | **PASS** | `tableRows: 3`, sequence table populated, Start, Waypoint and Destination points visually confirmed. Screenshot: `preview-acceptance-2-route-drawn.png`. |
| 3. Unique Observation | Notebook: enter unique note text with attached start position and submit. | **PASS** | Note recorded: `"REHEARSAL-ACCEPTANCE-NOTE-ALPHA: Detailed boxwork ridge sample observed at Gale Crater lower slope. Unique hash verification test."` at `(140.6, 571.0)`. |
| 4. Save Route | Route Planner: click "Save Route". | **PASS** | Status alert: `"Route saved locally for active raster."` Written to `localStorage` key `marswalk:v1:hirise-mro-pia26306-boxwork-2048x1042-v1` (613 bytes). |
| 5. Online Export | Mission Transfer: click "Export mission". | **PASS** | Downloaded `marswalk-mission.json` (3,803 bytes); contains active `imageRef`, 3 route points, and 1 observation. Archived: `scratch/preview-export-online.json`. |
| 6. Prepare Offline Pack | PWA Panel: click "Prepare offline" and await ready state. | **PASS** | Panel status: `"Install & offline · Connection available · Pack verified"`. CacheStorage key `marswalk-pack:...:4bb8ec987ae0...` verified with 19 assets. Screenshot: `preview-acceptance-3-pack-ready.png`. |
| 7. Terminate Browser | Cleanly close browser session via CDP `Browser.close()`. | **PASS** | Process terminated cleanly; profile database buffers flushed to disk; profile preserved in `scratch/preview-acceptance-profile`. |
| 8. Disconnected Reopen | Re-launch Edge with same profile, set `Network.emulateNetworkConditions({ offline: true })`, reload. | **PASS** | Application loaded disconnected from service worker cache; status `"Install & offline · Disconnected · Pack verified"`; `navigator.onLine = false`. Screenshot: `preview-acceptance-4-offline-recovered.png`. |
| 9. Explicit Load Route | Route Planner: click "Load Route" while offline. | **PASS** | Feedback: `"Route loaded successfully."` Recovered Start `(141, 571)`, Waypoints `1`, Destination `(561, 747)`. Route sequence restored. |
| 10. Verify Notebook & Offline Export | Notebook: verify saved note. Mission Transfer: export mission while offline. | **PASS** | Notebook displayed unique note `"REHEARSAL-ACCEPTANCE-NOTE-ALPHA..."` with exact coordinates. Offline export downloaded; `notesMatch = true`, `routeMatch = true`. Screenshot: `preview-acceptance-5-offline-completed.png`. |

### Export Comparison & Data Loss Verification

- **Online Export (`preview-export-online.json`):**
  ```json
  {
    "schemaVersion": 1,
    "imageRef": "hirise-mro-pia26306-boxwork-2048x1042-v1",
    "route": {
      "start": { "x": 140.56, "y": 571.04 },
      "destination": { "x": 561.40, "y": 747.04 },
      "waypoints": [{ "x": 340.23, "y": 642.04 }]
    },
    "observations": [{
      "id": "e20b3f8b-c73e-462f-981c-8e8113bc30f6",
      "imageRef": "hirise-mro-pia26306-boxwork-2048x1042-v1",
      "createdAt": "2026-11-15T14:44:03.112Z",
      "text": "REHEARSAL-ACCEPTANCE-NOTE-ALPHA: Detailed boxwork ridge sample observed at Gale Crater lower slope. Unique hash verification test.",
      "position": { "x": 140.56, "y": 571.04 }
    }]
  }
  ```
- **Offline Recovered Export (`preview-export-offline.json`):**
  Matches online export byte-for-byte in route points and observations array (`notesMatch: true`, `routeMatch: true`).
- **Data Loss Assessment:** **ZERO DATA LOSS.** All route points and scientific field notes persisted across complete browser shutdown and offline recovery.

### Final Verification Verdict

- **Automated Workflow Acceptance:** **PASS**
- **Physical Device Standalone Installation:** **UNVERIFIED / PENDING** (requires physical Android Chrome or iOS Safari device).

