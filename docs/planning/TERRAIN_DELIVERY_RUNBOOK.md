# Terrain V2 — source to offline map, without guesswork

Updated 18 November 2026. These are assignments and acceptance requirements, not completed work. Start with your personal **START HERE** checklist. Existing submitted/public application behavior stays unchanged until reviewed integration.

## 1. Everyone: start safely

1. Commit/preserve current unpublished work and report its branch/full SHA. Do not discard it or begin a duplicate implementation.
2. Use a separate checkout for each simultaneous agent. From a clean checkout: `git fetch origin`, then create your own suggested feature branch from `origin/science/planning-v2`. If you already started the slice, preserve that branch and agree integration with Patrick instead of replacing it.
   If using a fork, fetch the main repository as `upstream` and branch from `upstream/science/planning-v2` instead. Push your feature branch to your own fork and send its URL/SHA. Never assume your fork already contains the development branch.
3. Read your personal checklist and this runbook. Never treat old final-submission deadlines or old public URLs as current acceptance instructions.
4. Complete your **Do now** artifact even if real-data access is pending. Runtime synthetic terrain is prohibited; synthetic fixtures stay in tests.
5. Submit work using the exact handoff template at the end. Only Patrick integrates shared root/core/cache changes and accepts scientific data.

## 2. Gaddielle: retrieve metadata before large rasters

1. Open the official candidate catalogue: https://www.uahirise.org/dtm/PSP_001488_1750 . The identifier `DTEEC_001488_1750_001752_1750_U02` is a lead, not a confirmed product/version.
2. Follow the provider's actual links to the product label, terrain raster and matching imagery. Copy exact final URLs; never construct filenames from a naming guess.
3. Save original labels/provider metadata under `docs/data/terrain-v2/metadata/`. Do not rewrite labels. Record the retrieval UTC time, URL, HTTP result and saved filename in `retrieval-log.md`.
4. Create `SOURCE_INVENTORY.md` with a field/evidence/status table. For each value, cite the exact label field or provider passage. Include product/version, producer, source stereo image IDs, dates, citation/credit/use terms, horizontal CRS and units, footprint/bounds, native spacing, elevation units and vertical datum/reference, nodata and stated uncertainty/accuracy. Unknown or unstated fields stay unknown and are escalated to Patrick.
5. Create `files.json` as an array of records with `productId`, `role`, `url`, `retrievedAtUtc`, `localPath`, `bytes`, `sha256`, `status`, `notes`. Use null for fields not available yet; never hash an HTML error response and call it a raster. Roles distinguish label, metadata, imagery and elevation. Status is retrieved, inspected, proposed or accepted; only Patrick records scientific acceptance with evidence.
6. Submit the dossier before waiting for every large download. No wholesale weather hunt is needed for this milestone.

## 3. Network blocked? Use the local-download fallback

**Owner: Gaddielle; Patrick can perform the same steps if she cannot access a file.**

1. Record the blocked URL and exact error. Do not bypass the environment proxy or disable TLS verification. Ask Patrick to verify approved host access if needed.
2. On a normal local browser, open the official catalogue and download the small original label/metadata first. Keep the provider filename. Record the actual final download URL and time. Do not save only a screenshot or paste a shortened label.
3. Put downloads outside the repository, e.g. `~/Marsdata/terrain-v2/` on Linux or a separate `Marsdata\terrain-v2` folder on Windows. Do not overwrite the existing image/label.
4. Calculate sizes/hashes. Linux examples, after replacing the quoted placeholder with the actual file path:

   ```bash
   sha256sum '/actual/path/to/downloaded-file'
   wc -c < '/actual/path/to/downloaded-file'
   ```

   Windows PowerShell equivalents:

   ```powershell
   Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\actual\path\downloaded-file'
   (Get-Item -LiteralPath 'C:\actual\path\downloaded-file').Length
   ```

5. Hand Patrick the original small label/metadata files, exact URLs and inventory through this chat upload or an agreed file handoff. A local path alone is not remotely accessible. Check upload limits before transferring rasters; never try to push a huge source archive into Git to get around a transfer limit.
6. Patrick inspects the metadata first. Download/transfer the large raster only if it is a viable candidate. If the raster cannot be transferred, send the inventory and blocked status; Patrick arranges an approved download/storage location. Do not claim inspection or source acceptance until the actual raster is available and validated.

## 4. Patrick: decide current crop or alternative area

Current image evidence: [CALIBRATED_CROP.json](../data/evidence/CALIBRATED_CROP.json).

- Image reference: `hirise-psp001752-red-center-2048-025m-v2`.
- Source image: `PSP_001752_1750_RED`; crop 2048 × 2048 at 0.25 projected metres/pixel.
- Projected bounds: xmin −2531487, ymin −287315.75, xmax −2530975, ymax −286803.75 metres **in the crop's documented Mars CRS**. Do not compare these numbers directly with another CRS.

Patrick inspects the original raster/label, checks source identity, units/datum, native resolution, missing data, overlap and actual image registration. A shared stereo image ID or similar appearance is insufficient. Record findings in `docs/data/terrain-v2/ACCEPTANCE.md`, with a date, exact product/hash, evidence and status: pending, rejected or accepted.

If the DEM does not cover the crop or cannot support a defensible transformation, Gaddielle proposes one official compatible imagery–DTM study area. Patrick records the choice, reason and new imageRef. Keep the original area and saved missions intact; do not silently move or reinterpret existing observations/routes. Broader/coarser data must be described at its real resolution, never presented as newly detailed terrain.

## 5. Patrick + implementers: freeze contract v1 before wiring

Patrick creates `docs/planning/TERRAIN_CONTRACT_V1.md` after reviewing proposals from Enzo/Willy/Emma. Required decisions:

- Grid layout, array type, dimensions and hard size limit; cell-centre convention, row direction, affine transform and exact image-to-grid conversion.
- Horizontal and vertical units/reference, native versus prepared spacing, nodata mask rules and uncertainty handling. No interpolation/extrapolation across missing terrain without an explicitly reviewed method.
- Source/derivative hashes, image/package identity and evidence-backed admission states. A client-provided `verified: true` is not acceptance.
- Routing objective and segment-grade semantics, request/data IDs, worker cancellation, success and failure/reason codes, stale-response behavior and route acceptance adapter.
- Package file list/version, atomic update/recovery behavior, download/hash validation and offline readiness API.

The current local engine is experimental and may change. File paths in the assignments are ownership allocations, not proof an API already exists. If the contract is missing, submit your proposal and tests; do not invent a conflicting shared service.

## 6. Enzo 1: compact reproducible package

After source and contract approval:

1. Inspect source files using GDAL. Preserve CRS, units, datum and nodata in the extraction report. Stop if required evidence remains unresolved.
2. Run a reproducible extraction into a staging folder supplied by Patrick, not directly into public assets. Save exact command, tool versions, source hashes, crop/extent, transformation/resampling and output hashes.
3. Supply the matching display image, terrain grid, validity mask (embedded or separate per contract), package manifest and provenance. Do not ship the original large archive merely to support a small area.
4. Report each file's compressed/uncompressed bytes, expected runtime memory, native/output spacing and coverage. Patrick sets explicit byte/memory/performance budgets after consultation with Enzo 2, Willy and Royce. There is no established budget yet; do not invent a “pass” threshold.
5. Demonstrate valid/invalid input and interrupted-output behavior in tests. Fail nonzero on invalid data and preserve existing outputs; only replace files after successful validation.
6. Hand off staged artifacts and the reproducible command. Patrick independently reproduces extraction and reviews Willy 2's alignment checks before approval for runtime use.

## 7. Patrick + Royce: make the package actually work offline

**Patrick owns code/configuration integration; Royce owns independent end-to-end evidence.** Enzo 1 supplies staged assets; Willy 2 assists map/device coverage. No extra unassigned cache implementation is needed.

1. Patrick includes only approved runtime assets in the existing build/pack integrity and cache lifecycle. Raw archives and research evidence stay out of deployed assets.
2. Implement the agreed complete/partial/failed preparation states. Manifest presence, network connectivity or a successful build alone must never display “offline ready.” All required assets must be downloaded, hash-valid and confirmed available.
3. Define and test package replacement before release. Interrupted/corrupt updates must not discard the previous usable package or saved missions. Do not combine two package versions or reuse incompatible coordinates.
4. Royce prepares the package online in an isolated profile, records image/package/pack/source IDs, saves a route and note, then closes the browser/app fully, disconnects and reopens. Verify imagery, terrain, routing availability, route/note recovery and export. Match exports to expected content.
5. Test missing/corrupt grid, interrupted preparation, wrong hash/package identity, offline first visit and stale cache. An incomplete package yields an honest unavailable state; it cannot silently fall back to AI elevation or fabricate a route.
6. Run available installed-device tests and distinguish them from desktop browser tests/emulation. Record actual device/OS/browser and pending hardware. A study-area package can support V2 without all-Mars coverage.

## 8. Completion gates — all currently pending for real terrain V2

| Gate | Owner | Evidence needed to close |
|---|---|---|
| Official source suitable | Patrick, dossier from Gaddielle | Actual inspected raster/label, units/datum, coverage and source decision |
| Reproducible compact extraction | Enzo 1, reviewed by Patrick | Commands, tests, source/output hashes and package inventory |
| Independent alignment | Willy 2, reviewed by Patrick | CRS/transform controls, residuals/tolerances, actual map evidence |
| Routing and cancellation | Enzo 2 | Reference checks, lifecycle tests, measured benchmark |
| Map and user decisions | Willy 1 + Emma 1/2 | Preview/accept/reject behavior, limitations and preserved drafts |
| Recovery and offline package | Patrick + Royce | Full closed-process disconnected reopen plus failure/update checks |
| Usability | Charles with Emma | Agreed styling, viewport/theme/accessibility evidence |
| Release | Patrick | Integrated tests/build, reviewed blockers, identified candidate revision |

A pushed task, a completed metadata form or synthetic test is not a closed scientific gate. AI/VR is not a prerequisite. No safest-path or operational astronaut-survival claim.

## 9. Copy this handoff format

```text
Contributor / agent:
Task and phase:
Repository or fork:
Branch:
Full commit SHA:
Base revision:
Changed files:
Implemented behavior / supplied artifacts:
Exact reproduction commands:
Tests/checks actually run and results:
Image / terrain package / offline pack IDs (if relevant):
URL / browser / device (if actually tested):
Evidence paths and file hashes:
Pending inputs / blockers:
Next owner and exact requested decision:
```
