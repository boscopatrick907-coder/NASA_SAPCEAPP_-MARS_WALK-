# Vercel production

## 21 Nov 2026 (redesign) — mission-control layout, demo walk, mission HUD

| Item | Value |
|---|---|
| Source | `main` @ `acfa752` (PR #15), built by Vercel from GitHub |
| Deployment | `dpl_FKnQifatpMB2c8DWwdb2b2DDRDq7`, https://marswalk-ki7zmhztc-boys-band.vercel.app |
| Aliases | https://marswalk-jet.vercel.app/, https://marswalk-boys-band.vercel.app/, https://marswalk-review-boys-band.vercel.app/ |
| Offline pack | `6402a884b955…`, 42 assets, 10 789 657 bytes. **Identical** to the locally tested build; served `offline-pack.json` checked on the live alias |
| Rollback | `dpl_D5zJrUvC7EjvaHTcS7RaMczaKSco` (`c0c8344`) |

## 21 Nov 2026 (latest) — CRISM mineralogy layer, R1b terrain check

| Item | Value |
|---|---|
| Source | `main` @ `c0c8344` (PR #13), built by Vercel from GitHub |
| Deployment | `dpl_D5zJrUvC7EjvaHTcS7RaMczaKSco`, https://marswalk-1myp2meo8-boys-band.vercel.app |
| Aliases | https://marswalk-jet.vercel.app/, https://marswalk-boys-band.vercel.app/, https://marswalk-review-boys-band.vercel.app/ |
| Offline pack | `f5a5b255d5de…`, 39 assets, 10 763 980 bytes. **Identical** to the locally tested build |
| Checked on the live alias | `data/mineralogy/mineralogy.json` served (imageRef matches, SINDEX2 mapped) |
| Rollback | `dpl_4zVDPdWhQxtvB2FyNz11ieyJLHdH` (`d737129`) |

## 21 Nov 2026 (later) — terrain-aware survival, interactive map, geology

| Item | Value |
|---|---|
| Source | `main` @ `d737129` (PR #11), built by Vercel from GitHub |
| Deployment | `dpl_4zVDPdWhQxtvB2FyNz11ieyJLHdH`, https://marswalk-8ozbvjk2j-boys-band.vercel.app |
| Aliases | https://marswalk-jet.vercel.app/, https://marswalk-boys-band.vercel.app/, https://marswalk-review-boys-band.vercel.app/ (review alias moved too) |
| Offline pack | `2a527b25144a…`, 35 files, 10 532 244 bytes. **Identical** to the locally tested build |
| Checked on the live alias | `data/geology.json` served |
| Rollback | `dpl_4GjSzRqkt6WZWXgRDTMYvSUsq7h3` (earlier on 21 Nov, `ab5c3c7`) |

## 21 Nov 2026 — Planning V2 terrain preview live

| Item | Value |
|---|---|
| Source | `main` @ `ab5c3c7` (PR #8 + PR #9), built by Vercel from GitHub through the Vercel connector |
| Deployment | `dpl_4GjSzRqkt6WZWXgRDTMYvSUsq7h3`, https://marswalk-l6vd8wklu-boys-band.vercel.app |
| Aliases | https://marswalk-jet.vercel.app/ (assigned explicitly), https://marswalk-boys-band.vercel.app/ |
| Offline pack | `16c6b0d7998edac5127ebdd4f5618efe6405673d310d0addcf77f57b92b1c2ad`, 31 files, 10 497 180 bytes. **Identical** to the locally tested build and to preview `dpl_GKNTRsJyzj61aZG7TJRjo1QgGuDU` |
| Checked on the live alias | `offline-pack.json`, `data/terrain/index.json`, accepted `terrain-manifest.json`, new `data/manifest.json` (imageRef `hirise-psp001752-red-ortho-2048-0253m-v3`), 404 for unlisted paths |
| Rollback | Previous production `dpl_3dGqArmwGYzMkxMQHwWuvaj7BVWU` (source `b6669fb`, 15 Nov); reassign the two aliases to it |

Notes:
- Promoting a preview directly returned 422 on this Hobby team, so production was rebuilt from the identical `main` commit and the pack hash compared.
- The project is still not Git-linked; deployments are created on request.
- The `headers` in `vercel.json` are not applied (Vercel ignores `headers` when `routes` is used). This was already the case before this deploy. The served `cache-control` is Vercel's default `public, max-age=0, must-revalidate`, and `X-Content-Type-Options: nosniff` is missing. Follow-up: move the 404 rule to a form that allows `headers`.
- Not checked here: a full browser session against the live origin (this container can't open `*.vercel.app` in a browser), or installation on physical phones.
- `marswalk-review-boys-band.vercel.app` still points to the 15 Nov review build.

## Earlier record

Date **15 November 2026**. Source **`b6669fb`**. Public app **https://marswalk-jet.vercel.app/**, deployment `dpl_3dGqArmwGYzMkxMQHwWuvaj7BVWU`. [Setup/runbook](../VERCEL_SETUP.md), [prior PWA implementation checks](PWA_FOUNDATION.md).

## Actual provider and HTTP checks

- User-approved Vercel CLI login verifies the correct account; project created in its default `boys-band` team. Explicit Node `24.x`, custom PWA build and static output settings are applied. Provider build completes successfully; initial/style/CommonJS warning overruns remain, budgets unchanged.
- All 17 runtime files match the tested pack by actual byte lengths and SHA-256, first on protected staging through the authenticated CLI, then on the production alias through **ordinary anonymous curl with TLS verification**. Total **1,789,610 bytes**, pack `95d8b5f6ee7aba0a38e8e7758ada62be20a3f0ca61efd04adce0fc4cabb7a827`.
- Root returns actual Angular HTML, not a login screen. Worker and install manifest return 200; manifest MIME and no-store/revalidation settings are configured. Archive master is excluded; missing archive/data/worker URLs now return **404**, after explicit filesystem/404 routing fixed the provider fallback. No Docker/backend is needed.
- Staged immutable deployment URLs may have Vercel Authentication. That is distinct from the public production aliases, independently tested without authentication/bypass/cookies.
- Post-link source audit excludes local `.env*`, `.vercel/`, Git data, dependencies/build cache and archival image. Required PWA generator/worker/manifest remain included. No scientific source asset was changed.

## Actual public-browser checks

Playwright with Chromium **156.0.8078.79** on Linux, persistent isolated profile. Outbound requests use the inherited cloud proxy. The browser does not trust the cloud proxy CA through its default profile; tests pin **only the provided environment-proxy CA public key** in that isolated process. Curl uses the normal managed CA trust with full verification. This test configuration is not a requirement for visitors on normal devices. No general ignore-HTTPS-errors mode, login cookie or Vercel protection bypass was used for public-browser acceptance.

1. Clean production load displays real 2048×1042 imagery, one map, existing science/evidence panels and opt-in viewer. Explicit Prepare offline verifies all required files at the correct root worker scope.
2. Actual map clicks create start, waypoint and destination. Save route; save notebook observation; export matching mission. Metric distance remains null for unverified calibration.
3. Wrong-image mission import is rejected and the existing route is unchanged.
4. Close the complete browser process. Relaunch with the same profile, set disconnected **before navigation**, then reopen the production origin. Real image/science load, pack is verified, explicit Load saved route recovers exact route/notes and JSON export works. `navigator.onLine` is false.
5. Deferred flat 3D opens from the prepared cache while disconnected and tears down on Close. It supplies no validated terrain or immersive VR.
6. At 390px there is no horizontal document overflow. Normal online mission check has no uncaught page errors.

Temporary execution/results: `/tmp/vercel-public-browser.mjs`, `/tmp/vercel-production-browser-results.json`; screenshot `/workspace/artifacts/marswalk-live-offline.png`. These are session artifacts; this record preserves method/source/outcomes.

## Test scope and remaining work

Gaddielle branch `42a0dd2` passes **30 isolated** and **33 integrated Python tests**, with actual index check unchanged at 524,472 image-payload bytes. Application/worker logic is unchanged from the previously checked 136-Angular/11-worker PWA foundation; those counts are retained historical checks, not invented reruns for tools/hosting-only changes. Public browser and actual Vercel builds were newly run for deployment.

Physical installation/launcher/standalone behavior and real-device graphics/storage/airplane-mode testing remain **pending**. No outside users were contacted/tested. Automatic GitHub connection failed and is not claimed active. Current source is deployed through CLI; [next owner checklist](../../TEAM_TASKS.md) remains in force.


Observed final anonymous response headers: entry HTML, worker and install manifest return `Cache-Control: public, max-age=0, must-revalidate` from Vercel; worker MIME is `application/javascript` and manifest MIME is `application/manifest+json`. This is the actual provider response, distinct from the config’s requested no-store values. Revalidation satisfies the current host requirement; worker registration also uses `updateViaCache: none` and preparation downloads use `cache: no-store`. No positive-TTL immutable caching of these control files was observed.
