# PWA install assets — Phase 1 review and handoff

## Willy audit follow-up — 15 November 2026

Willy reports an independent Antigravity read-only audit passed manifest/icons/relative-path/maskable checks. This is contributor-reported evidence, not a new coordinator physical-device pass. No new Willy feature branch or asset commit is published at review time.

Coordinator added a relative `apple-touch-icon` link in `src/index.html` to the existing opaque 192×192 PNG, declared at its actual size. This reuses an existing prepared-pack asset, supports root/subpath resolution and does not claim iOS launcher validation. No Pillow installation is required for Willy or Emma to use the assets. PNG files were independently decoded at their declared dimensions as RGB.

Coordinator checks: root and `/marswalk/` production builds both pass, including full pack verification. Parsed icon links resolve under both bases; built PNG matches the source bytes. These checks do not establish physical iOS installation.

### Current source asset fingerprints

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/manifest.webmanifest` | 603 | `12c50a0f0033fbc0a890be2d56ddf3594d217db58d45eaa5a0b71eafa3513490` |
| `public/icons/marswalk-192.png` | 9600 | `137194e041be8e171dfa40bbd5b333f69cb6c268957c49fa4e2525b464394faa` |
| `public/icons/marswalk-512.png` | 19227 | `3ad6eab9da3faa9dfcb2415f979d2fca89d89e7f8a9a1c084ca17481c3b72ad9` |
| `public/icons/marswalk-maskable-512.png` | 19227 | `3ad6eab9da3faa9dfcb2415f979d2fca89d89e7f8a9a1c084ca17481c3b72ad9` |
| `public/icons/marswalk.svg` | 361 | `edd13d0e30c646395eef13a844e3d87d15a5a32ad91bcc4999dfa3deca0f0afc` |

Manifest/SVG checkout bytes are pinned to LF by `.gitattributes`; scientific JSON LF rules are already on main (`ac79be5`). Existing Windows working copies may still need the clean-file refresh documented below. Do not change scientific hashes or regenerate data. Browser-specific installed appearance remains pending actual Android/iOS checks.


## Windows LF compatibility — coordinator fix, 15 November 2026

Repository `.gitattributes` now enforces `text eol=lf` for public scientific JSON, including the byte-verified manifest. No canonical data, expected hash, build script or worker was changed. A fresh indexed checkout with `core.autocrlf=true` preserves manifest size **1,200 bytes** and SHA-256 `40381b96e243b6876c4aa796d4cfcb5b222592982a5c1726101f467622418f82`.

Coordinator verified `npm run build` and `npm run build -- --base-href /marswalk/`: both Angular compilation **and full pack verification pass**, each with 18 assets. This is Linux build evidence plus Git checkout simulation, not a native Windows or installed-device pass.

**Enzo/Willy handoff:** preserve local changes, fetch and merge published main into your existing branch. Existing CRLF working files may need refreshing after attributes arrive: inspect `git status` and back up any edits first. Only if `public/data/manifest.json` has no work to preserve, run `git restore --source=HEAD --worktree -- public/data/manifest.json` to re-check it out using the new attributes. Do not reset the repository, change global autocrlf settings, regenerate scientific data or change expected hashes to accommodate CRLF. Rerun both commands above and record your actual commit/platform/results in this QA file. Enzo's reported documentation-only submission is awaiting those checks; do not mark all Phase 1/device acceptance complete. Willy can use the same fix for his install-assets verification; this does not transfer his map work to Enzo.


## Existing asset review

Coordinator-supplied assets from `8a4dadc`, reviewed on `feature/willy-pwa-install-assets` at `339a676` on 15 November 2026. The manifest, all three PNGs, and the SVG source were preserved unchanged. No artwork was regenerated. Willy retains visual review/refinement and deployed-device validation; do not recreate already-provided assets blindly.

## Manifest and coordinator handoff

`public/manifest.webmanifest` parses as UTF-8 JSON and has the required values: `name` and `short_name` are `MARSWALK`; `lang` is `en`; the description is `Mars exploration rehearsal with visible evidence limits.`; `start_url` and `scope` are `./`; `display` is `standalone`; and both colors are `#0b0e14`.

The three icon declarations use relative paths, `image/png`, the correct declared sizes, and purposes matching the files:

| File | Declared size | Purpose | Actual size |
| --- | --- | --- | ---: |
| `icons/marswalk-192.png` | `192x192` | `any` | 9,600 bytes |
| `icons/marswalk-512.png` | `512x512` | `any` | 19,227 bytes |
| `icons/marswalk-maskable-512.png` | `512x512` | `maskable` | 19,227 bytes |

The coordinator handoff is the manifest discovery link and matching theme color below. Both are already present in `src/index.html`; Willy did not edit that coordinator-owned file.

```html
<link rel="manifest" href="manifest.webmanifest" />
<meta name="theme-color" content="#0b0e14" />
```

Relative URL resolution was checked against both manifest locations:

| Manifest URL | `start_url` / `scope` | Icon URL prefix |
| --- | --- | --- |
| `/manifest.webmanifest` | `/` | `/icons/` |
| `/marswalk/manifest.webmanifest` | `/marswalk/` | `/marswalk/icons/` |

The subpath production output also contains `<base href="/marswalk/">`. The source index retains its root base; base-path selection is a build option and was not changed here.

## PNG and artwork inspection

All three files have the PNG signature and fully decoded during inspection as 24-bit RGB images at their declared dimensions. None has an alpha channel; every pixel is opaque. The maskable image's corner/background color is `#0b0e14`, matching the manifest colors.

The maskable canvas is 512x512. Pixel inspection measured the farthest non-background artwork pixel at a **177.2 px radius** from center. The required centered safe circle has a **204.8 px radius** (80% diameter), leaving a **27.6 px margin**. The mark remains well within the safe area.

The regular and maskable 512x512 files are byte-identical (SHA-256 `3AD6EAB9DA3FAA9DFCB2415F979D2FCA89D89E7F8A9A1C084CA17481C3B72AD9`). Both named deliverables are intentionally retained with their separate manifest purposes, as required by the asset contract.

`public/icons/marswalk.svg` is the scalable 512x512-viewBox source for the simple geometric Mars/mountain mark. The design was coordinator/Codex-assisted and is not NASA branding. The PNGs were drawn from that geometry with Pillow at 1024px and downsampled using Lanczos. No external illustration or licensed artwork source was used.

## Build and serving checks

### Earlier review at `339a676` (before the coordinator LF fix)

The root and subpath Angular compilations emitted the manifest and icons, and temporary HTTP checks verified the relative asset paths. The `/marswalk/` output had `<base href="/marswalk/">` and icon URLs under `/marswalk/icons/`. Those checks did not establish a successful full production build.

- Root output: manifest returned `200 application/manifest+json`; all three icons returned `200 image/png` at `/icons/...` with byte sizes shown above.
- `/marswalk/` output: index, manifest, and all three icons returned `200`; the index base was `/marswalk/`, and icon paths resolved under `/marswalk/icons/...`.

At that revision, both full build commands stopped after Angular compilation with `Image pack mismatch: data/manifest.json`. The pack index expected 1,200 bytes and SHA-256 `40381b96e243b6876c4aa796d4cfcb5b222592982a5c1726101f467622418f82`; the Windows source/copy had 1,228 bytes and SHA-256 `E3C33A304AE01E657D5E282FA07CA7143F8ED9A76A359419E5320238E750D53A`. No scientific content or expected hash was changed. The offline-pack step stopped before generating `offline-pack.json` or `service-worker.js`.

Previously run commands:

```text
npm run build
npm run build -- --base-href /marswalk/
```

Those earlier builds also reported Leaflet's CommonJS warning. No Angular tests were run for that static asset/documentation review.

### Windows revalidation after `ac79be5`

Branch `feature/willy-pwa-install-assets` fast-forwarded from `339a676` to coordinator commit `ac79be5`. Before refresh, `git status` and `git diff` confirmed there were no local changes to `public/data/manifest.json` or `public/data/image-pack.json`; the QA document edit was backed up in a Git stash and reapplied after the fast-forward.

Ran the documented refresh command exactly:

```text
git restore --source=HEAD --worktree -- public/data/manifest.json
```

The command completed, and `git check-attr --all -- public/data/manifest.json` reports `text` set and `eol: lf`. However, on this Windows checkout with system `core.autocrlf=true`, Git considered the CRLF worktree file clean and did not rewrite it: the file remained **1,228 bytes**, SHA-256 `e3c33a304ae01e657d5e282fa07ca7143f8ed9a76a359419e5320238e750d53a` (28 CRLF line endings). The committed blob and pack index remain **1,200 bytes**, SHA-256 `40381b96e243b6876c4aa796d4cfcb5b222592982a5c1726101f467622418f82` (28 LF line endings). No scientific JSON or pack-index content was edited. The documented restore procedure did not refresh the Windows worktree; no alternate refresh or manual data rewrite was attempted.

Executed the Windows npm command shims for the two required production builds:

```text
npm.cmd run build
npm.cmd run build -- --base-href /marswalk/
```

Both Angular production compilations completed, then exited with `Image pack mismatch: data/manifest.json`. Consequently, neither run generated a current `offline-pack.json` or `service-worker.js`; both are absent from the output. Leaflet's existing CommonJS warning appeared; no budget warning appeared in these build logs.

The root build output had `<base href="/">`; local HTTP requests returned `200` for `/`, `/manifest.webmanifest` (`application/manifest+json`) and all three `/icons/...` paths (`image/png`, 9,600 / 19,227 / 19,227 bytes). The subpath build output had `<base href="/marswalk/">`; its relative manifest link, `./` start/scope and three relative icon files resolve under `/marswalk/`. The subpath output files were inspected on disk; HTTP serving was not run for that build. Since pack verification stopped, full root and subpath production builds remain **failed** on this Windows checkout.

The installed tree initially lacked the already-declared, lockfile-pinned `three@0.187.0` package. It was restored with `npm install --no-save --package-lock=false three@0.187.0` for build verification; `package.json` and `package-lock.json` were not changed.

These local HTTP checks do not constitute a deployed-host or physical-device installation test. Prior Chromium manifest diagnostics are recorded revision-scoped in [PWA_FOUNDATION.md](PWA_FOUNDATION.md); they were not rerun in this review. Actual target-device installation and launcher appearance remain pending.

## Windows and hosted revalidation — 15 November 2026

This follow-up records the later Windows run on `feature/willy-pwa-install-assets` after fast-forwarding to `d6801a417a5a32375bf6453deadcc024d1460919`. The coordinator's main changes and the pre-existing QA edits were preserved. The original `stash@{0}` (`90e027034e605698f5981d2553c31519462ac33c`) remains present and unchanged.

### Windows checkout and source assets

`npm.cmd ci` completed successfully and installed 303 packages. npm reported that install scripts for `@parcel/watcher`, `esbuild`, `lmdb` and `msgpackr-extract` were not approved. No package manifest or lockfile was changed.

After main was incorporated, the documented `git restore --source=HEAD --worktree -- ...` refresh exited successfully but left the clean Windows worktree files as CRLF. The data manifest was 1,228 bytes with SHA-256 `e3c33a304ae01e657d5e282fa07ca7143f8ed9a76a359419e5320238e750d53a`; the webmanifest and SVG were 619 and 362 bytes. `git ls-files --eol` reported `i/lf w/crlf attr/text eol=lf` for all three. To complete the documented clean-file refresh without touching their Git blobs, I backed up each worktree file and wrote the verified raw `HEAD` blob bytes to that file. The resulting files are now `i/lf w/lf attr/text eol=lf`; no scientific content, pack index, expected hash or Git object was changed.

Verified fingerprints after refresh:

| File | Bytes | SHA-256 | Additional check |
| --- | ---: | --- | --- |
| `public/data/manifest.json` | 1,200 | `40381b96e243b6876c4aa796d4cfcb5b222592982a5c1726101f467622418f82` | Exact expected pack manifest; LF |
| `public/manifest.webmanifest` | 603 | `12c50a0f0033fbc0a890be2d56ddf3594d217db58d45eaa5a0b71eafa3513490` | Parsed successfully; LF |
| `public/icons/marswalk-192.png` | 9,600 | `137194e041be8e171dfa40bbd5b333f69cb6c268957c49fa4e2525b464394faa` | Fully decoded, 192×192, RGB/opaque |
| `public/icons/marswalk-512.png` | 19,227 | `3ad6eab9da3faa9dfcb2415f979d2fca89d89e7f8a9a1c084ca17481c3b72ad9` | Fully decoded, 512×512, RGB/opaque |
| `public/icons/marswalk-maskable-512.png` | 19,227 | `3ad6eab9da3faa9dfcb2415f979d2fca89d89e7f8a9a1c084ca17481c3b72ad9` | Fully decoded, 512×512, RGB/opaque |
| `public/icons/marswalk.svg` | 361 | `edd13d0e30c646395eef13a844e3d87d15a5a32ad91bcc4999dfa3deca0f0afc` | LF |

PNG decoding used Windows `System.Drawing`; every pixel was read. All three files reported `Format24bppRgb` and minimum alpha 255. The manifest parsed with MARSWALK name/short name, `lang: en`, relative `./` start/scope, standalone display, matching `#0b0e14` theme/background colors, and the three declared relative PNG icon paths with their expected sizes, types and purposes.

### Production builds and local HTTP serving

The final root build and subpath build both passed Angular compilation and the full image-pack build step. The initial root attempt inside the restricted command sandbox failed with source-directory access-denied errors; rerunning the same command with workspace access succeeded. Leaflet's existing CommonJS warning remained.

| Build | Command | Result |
| --- | --- | --- |
| Root | `npm.cmd run build` | Pass; offline pack `2821c139b35b…`, 18 assets, 1,655,461 bytes; `offline-pack.json` and `service-worker.js` generated |
| `/marswalk/` | `npm.cmd run build -- --base-href /marswalk/` | Pass; offline pack `70091eb3af62…`, 18 assets, 1,655,470 bytes; `offline-pack.json` and `service-worker.js` generated |

Both outputs were served locally over HTTP before the next build overwrote them. The root server returned 200 for `/`, `/manifest.webmanifest` (603 bytes), all three icon URLs (9,600 / 19,227 / 19,227 bytes), `/data/manifest.json` (1,200 bytes), `/offline-pack.json` and `/service-worker.js`. The subpath server returned 200 for `/marswalk/` and the same relative manifest, icon, data, pack and worker paths; `/manifest.webmanifest` at the server root returned 404, confirming that the subpath output was mounted under `/marswalk/`. The built subpath index had `<base href="/marswalk/">`; its generated worker contained the offline-pack version, and the pack included the manifest, icons and required data entries.

### Deployed-host and device checks

Read-only HTTP requests to the documented deployment `https://marswalk-jet.vercel.app/` returned 200 for the app page, manifest, all three icon paths, `service-worker.js` and `offline-pack.json`. Reported response sizes were 2,272; 603; 9,600; 19,227; 19,227; 7,603; and 2,871 bytes respectively. The served HTML had a root base, manifest link and theme-color. It did **not** contain an `apple-touch-icon` link, although the 192px PNG URL itself returned 200. The project deployment record labels this host as source `b6669fb`; the HTTP response did not independently expose a Git commit. Therefore these host checks describe that deployed response, not the newer local build or the merged main revision containing the relative iOS link.

No physical Android or iOS device was available for this run. I did not perform Add to Home Screen, launcher appearance, standalone launch, disconnect/reopen, or saved-mission recovery checks; no physical-device pass is claimed. I also did not run a browser-based install/offline workflow or `npm test`. These remain pending a current deployment with the iOS discovery link and access to a target device. The local Windows production builds and HTTP asset checks are complete; they do not establish physical installation or offline mission recovery.
