# Gaddielle — source and geology package

## START HERE — your executable checklist

Read only this checklist and the active assignment immediately below it for current work. Everything under **Historical assignments** is reference, not another assignment. Do not wait for all teammates: complete the **Do now** item first.

**Before editing:** preserve/commit your current work, report its branch/SHA, then use a separate clean checkout for this agent. Fetch `origin/science/planning-v2` and create your own feature branch from that development line. Never reset existing work or switch a teammate's checkout. Branch names below are suggestions only if you have not started this slice. Main does not contain this plan yet.

Read [the exact source-to-offline runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for the shared steps, fallback and handoff format. No real terrain product or versioned terrain API is accepted yet. Do not guess missing API names; send your interface proposal to Patrick and continue tests/audit while waiting.

**Suggested branch:** `feature/gaddielle-terrain-sources-v2`.

- [ ] **Do now:** create `docs/data/terrain-v2/SOURCE_INVENTORY.md`, `files.json` and `retrieval-log.md`. Start with the official [candidate catalogue](https://www.uahirise.org/dtm/PSP_001488_1750); record the actual HTTP outcome and discovered links, never guessed raster filenames.
- [ ] Save original provider labels/metadata in `docs/data/terrain-v2/metadata/`. Record product/version, source images, CRS, footprint, elevation units/datum, native spacing, nodata and uncertainty, each with its original field/passage. Missing evidence stays `unknown`, not “verified.” Use the inventory fields in the runbook.
- [ ] Compare the footprint to [the existing crop evidence](../data/evidence/CALIBRATED_CROP.json). Ask Patrick for an independently checked result. If incompatible, deliver **one alternative official imagery–DTM pair** and its evidence; do not continue trying to force the original crop.
- [ ] If cloud download is blocked, follow the runbook's local-download fallback. Hand over metadata first, then exact verified download URLs, sizes/hashes and local file locations. Keep large binaries out of Git until Patrick agrees storage.
- [ ] Add a geology table in the inventory: source, scale/resolution, CRS, footprint, units and permitted use as regional context versus aligned layer. SIM3292 remains regional context. Do not delay the DEM dossier for extra weather/geology collection.
- [ ] **First submission:** metadata dossier + retrieval log + inventory; identify every missing field. **Done:** Patrick can reproduce retrieval and decide accept/reject/alternative. Scientific acceptance itself belongs to Patrick, not you.

**Send to Patrick and Enzo 1:** source folder, exact URLs, file paths/hashes, missing inputs, branch/full SHA. After source approval, supply any missing labels; do not change runtime data yourself.


## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. `science/planning-v2` is the development branch; main and public deployments remain unchanged by these assignments. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Own `docs/data/terrain-v2/` source inventory and evidence. Coordinate raw archive placement with Patrick before committing large files; do not deploy raw archives or change `public/data` directly.

1. Retrieve official catalogue/label information for candidate `DTEEC_001488_1750_001752_1750_U02`, starting at `https://www.uahirise.org/dtm/PSP_001488_1750`. This is an unverified lead, not an accepted product. Record exact final URLs, product/version, stereo images, dates, producer, citation/credit and use terms.
2. Obtain the actual DTM label and raster or documented retrieval instructions. Inventory file sizes and SHA-256 hashes. Extract CRS, footprint/bounds, native spacing, nodata, elevation units and vertical reference with the exact supporting label fields. Unknown fields stay unknown.
3. Compare documented footprint with the current calibrated crop using its existing evidence. A shared product name or place name is not alignment. Ask Patrick to verify the spatial test; if coverage fails, propose an alternative study area with compatible imagery/DEM instead of forcing a match.
4. Inventory useful local geology from official USGS/NASA sources: scale/resolution, geometry CRS, mapped units, footprint and limitations. Existing SIM3292 is coarse regional context and does not justify metre-scale boundaries in this crop.
5. Deliver `SOURCE_INVENTORY.md`, machine-readable file inventory/hashes and retained original metadata under your folder. Separate retrieved, inspected, proposed and accepted states. Network-blocked files remain pending; do not fabricate metadata.

Useful official entry points: https://www.uahirise.org/ ; https://hirise-pds.lpl.arizona.edu/ ; https://astrogeology.usgs.gov/ ; https://planetarymaps.usgs.gov/ . Patrick owns final source/registration acceptance. First deliver the metadata dossier; no need to wait for every large download.

---

## Historical assignments and review records — superseded queue

# Gaddielle — Numerical environmental data and remaining release work

## Latest submission decision — read before resuming

Outstanding-source review is complete: Enzo REMS source bundle and Emmanuel SIM3292 reference artifacts are retained with explicit limits. No new local hazard/geology overlay or runtime weather approval. Preserve accepted files; no broad new retrieval. See docs/qa/OUTSTANDING_SUBMISSIONS_REVIEW.md.


## ACTIVE — final 90-minute survival-planning release

Freeze broad data retrieval; hand off geology 5cef4d7 and a concise accepted/proposed source table in docs/data/SURVIVAL_SOURCE_HANDOFF.md. Preserve runtime data and clearly state local-coverage/quality limits.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.


## Latest submission 65141b7 — correct reconciliation before more delivery

Review finds 55 isolated tests run with 3 reported failures: accepted temperature fixes were not reconciled with the new tests. Source audit contains a literal omitted-content placeholder and conflicting source claims. Old pending runtime JSON must not replace current limited excerpt. [Exact review](../reviews/GADDIELLE.md#latest-65141b7--reconciliation-incomplete-not-merged). Preserve source downloads and local work, safely incorporate main, restore real evidence sections and run all tests. No branch code/data merged from this push. Coordinator's new calibrated crop and limited 25-row subset remain current; no new terrain/measurement delivery is inferred.

## CURRENT PUBLIC MAP — mobile layout and automatic recovery

Use **https://marswalk-review-boys-band.vercel.app/** (source 38ad299, no login). [Mobile recovery evidence](../qa/MOBILE_MAP_RECOVERY_FIX.md). Mobile map now retains height; saved routes and observations restore automatically on startup. Physical device acceptance remains pending. Use this stable origin for subsequent tests; older preview storage remains on its original origin. User-supplied 512 m square crop now supports **derived planar meters at 0.25 m/pixel**. Terrain/slope/safety and exact science/boxwork-target overlap remain unverified. Emma mission workspace/briefing and Enzo navigation/location clarity included. New imageRef; do not reuse old image coordinates or change legacy import IDs. Preserve old exports/origin storage. Update actual screenshots/tests against this candidate; older “active image uncalibrated” instructions are superseded. No change to ownership or new optional feature assignment.

## New crop calibration — current implementation

User-supplied 2048² Mars GeoTIFF inspected: 0.25 m projected pixels, 512 m square. New imageRef hirise-psp001752-red-center-2048-025m-v2; shared assessment derives planar distance, old-image imports rejected and old storage untouched. [Evidence and exact limits](../data/CALIBRATED_CROP_RELEASE.md). This supersedes “active image uncalibrated” in older task text, but does not supply terrain, safety or located science. Keep current ownership; update actual screenshots/claims only after candidate deployment, and never reuse old routes on the new crop.

## Coordinator takeover while unavailable

User and coordinator are handling the calibration/terrain slice now; preserve your branch/raw downloads and do not duplicate edits when you return. [Actual checks and smallest source handoff](../data/CALIBRATION_TAKEOVER.md). Local imagery is readable but not georeferenced; original catalogs are HTTP 403 here. Candidate DTM overlap/scale claims remain unverified. If you already have original image/DTM labels or a georeferenced small crop, hand off exact files/hashes/commands rather than another catalog summary. No reset or overwrite of your collection work.

> **Current priority override:** [Finish the integrated mission map](../MISSION_MAP_FINISH_PLAN.md). The assignment below takes precedence over older unchecked optional phases; preserve completed/unpublished work.

## Priority now — exact-raster calibration and terrain evidence

Pause expansion into more REMS quantities; preserve current downloads and existing extractor corrections. Latest d6ab8aa includes a promising DTM identifier and corrected THEMIS discussion, not a delivered aligned raster. Your full dataset remains unmerged; limited 25-row context is already integrated, so do not redo it.

Within one focused hour, obtain the actual original image/DTM labels and report product IDs, exact footprint/CRS/scale/vertical units/nodata and reproducible crop/resize/reprojection chain for the displayed raster. Verify or withdraw “100% overlap”, 1.01 m/px, 0.2 m precision and proposed compressed-size assertions unless source metadata/output measurements support them. Matching parent stereo image or dimensions does not establish alignment. Deliver source URLs/raw hashes/processing commands and a small traceable AOI or exact missing input; do not invent tie-points. If this visual derivative cannot be calibrated, propose a georeferenced replacement with an explicit new imageRef plan for coordinator review. Keep raw archives out of public assets. Original data collection/source integrity findings remain open but secondary to this bounded map-location decision; no discard/reset of work.

## Current PUBLIC candidate — 38516f8

Use **https://marswalk-pfoqdsf41-boys-band.vercel.app/**. No Vercel login or access-request approval needed. [Exact capabilities, tests and data caveats](../qa/PUBLIC_SCIENCE_PREVIEW.md). Includes Emma UI, accepted science navigation and limited contributor-supplied REMS excerpt summaries; do not call them independently authenticated NASA data or full-day weather. Supersedes older preview URLs for new assigned testing/screenshots. Preserve personal exports before changing origins; saved missions are origin-specific. Existing production URL remains older. Physical/user acceptance and submission still need actual evidence.

## Integration handoff — existing environmental loader/panel now available

Coordinator reviewed 437a777 and added [runtime contract and review-status UI](../data/ENVIRONMENT_RUNTIME_CONTRACT.md). Numerical values are withheld pending source/quality/integrity acceptance; no unreviewed data merged. Latest extractor no longer invents Ls, but finite-value/quality population/original hash/record matching and safe regeneration remain. Your 53 branch tests pass; add real extractor failure/reproduction coverage rather than only helper tests. Continue your bounded original-source retrieval, preserving local work. Once accepted, coordinator converts a reviewed small subset; do not create a competing loader/component or change runtime reviewStatus yourself.

## In-progress delivery cdd5b45 — continue collection and extractor validation

New source catalog/FMT/extractor/observations received; 53 isolated branch tests pass but scientific/runtime approval is pending. Keep retrieving original products. Before final review resolve [latest extractor findings](../reviews/GADDIELLE.md#latest-data-delivery-cdd5b45--received-extractor-not-ready-for-scientificruntime-approval): synthetic Ls, NaN/Infinity, confidence population semantics, input/hash/record matching and safe output. These refine your existing task, not a reset/new branch. Preserve all source evidence and incorporate accepted main corrections safely. No runtime environment file/API authorized yet.

## Latest REMS handoff fe69663 — source corrections next

New product inventory/label/excerpt/summary reviewed; not merged or accepted as verified data yet. Address [S1–S4](../reviews/GADDIELLE.md#rems-source-submission-fe69663--corrections-required-before-acceptance): reproducible extraction plus original format/quality documentation, inconsistent row totals/record sizes, raw-versus-LF label hashes, and safe reconciliation with accepted main C1/C2 corrections. Start with one bounded original product if needed. Preserve ongoing work and keep RAD/runtime schema unavailable; no invented replacement values. Earlier accepted converter fixes remain complete.

## Current handoff — coordinator completed C1/C2; collect original sources next

The user authorized coordinator help. Your 0f6bd95 prototype and coordinator fixes are accepted as **illustrative test-only tooling**, with 52 integrated Python tests passing. Numeric fixture rows are unchanged; header wording and generated descriptions are corrected. See [acceptance scope](../reviews/GADDIELLE.md#coordinator-assisted-c1c2-fixes--tooling-accepted-data-still-pending). Do not repeat these corrections. Preserve all ongoing source-collection work and safely merge published main into your current branch; no reset or competing converter.

Your next slice: deliver a small original REMS pressure/temperature product plus label/documentation, exact product/version/download, raw bytes/hash, units/time/quality semantics and reproducible row extraction. Record unavailable fields explicitly; do not use illustrative values as NASA observations. RAD is separate if traceable. No public environment.json, shared loader/API or Enzo integration before source/schema review. After a useful verified handoff, prioritize exact-raster calibration and compatible elevation evidence.

## Byte-verification compatibility handoff

Coordinator added repository-controlled LF attributes for scientific JSON without changing canonical data or hashes. Root and `/marswalk/` builds, including pack verification, pass. See [Windows LF instructions and evidence](../qa/PWA_INSTALL_ASSETS.md#windows-lf-compatibility--coordinator-fix-15-november-2026). Preserve local work and refresh only clean affected files after incorporating main; no global Git changes or data regeneration. Enzo/Willy should rerun their own Windows build verification before claiming that handoff complete. Gaddielle should retain canonical LF in future scientific JSON deliveries; her environmental-data corrections remain a separate pending task.

> Current piece: [W2](../../TEAM_TASKS.md#w2). Updated **15 November 2026**. This is your single remaining-work file and coding-agent prompt.

## Active review corrections — complete before later phases

Latest branch **`feature/gaddielle-environment-data`**, tip **`286374b`**, is reviewed but **not approved/merged**. All **42 isolated data tests pass**, including your nine new cases; manual temporary-input probes found failures outside that coverage. [Exact findings/evidence](../reviews/GADDIELLE.md#latest-environmental-submission--changes-required-before-merge).

Preserve the audit/sample/converter prototype and work on this same branch. Safely merge published main for the corrected accepted release-data handoff. No reset/force-push, duplicate branch or new UI task. Complete these corrections before claiming Phase A verified or requesting runtime generation:

1. **R1 — source evidence:** exact original REMS/RAD products/labels/download URLs, raw-file hashes and extraction/row mapping for the displayed values; documented units/detector/time/quality/sentinels. The current CSV is unverified. If illustrative/untraceable, label it test-only and remove verified-NASA claims. Do not emit verified status from any arbitrary numerically valid CSV.
2. **R2 — source protection:** reject output aliases of source (including relevant samefile/symlink/hardlink cases) before writes; clean exit 1, no source/destination byte/mtime changes. Add regressions.
3. **R3 — finite/consistent data:** reject NaN/±Infinity/overflow and inconsistent min/mean/max before write; strict JSON serialization, actual invalid-input tests and unchanged existing output on failure.
4. **R4 — per-quantity audit:** preserve legitimate zero per documented product rules; independently count usable/missing/rejected measurements and explain aggregation. Distinguish computed summaries from raw measurements. Fix local Windows links/stale anchors and substantiate period/location/quality claims.

Hand off actual source evidence, changed files, commands/results and commit for re-review. Keep `public/data/environment.json` absent until provenance and shared schema are agreed. Core/models/loader/worker/deployment remain coordinator-owned; Enzo owns UI. Previously accepted imagery/R3/release handoff stays complete.

## Completed — do not repeat

- Image package, Data Passport and image-only index are accepted. R3 `42a0dd2` is integrated at `c7ac053`, retaining all 33 data regressions.
- Release-data handoff **`0514da1`** is delivered and accepted with coordinator documentation corrections. [Accepted handoff](../data/RELEASE_DATA_HANDOFF.md), [review](../reviews/GADDIELLE.md).
- The coordinator corrected CRLF-versus-LF byte/hash figures and the full-pack membership description. Current runtime data is **529,376 bytes**; image-only payload **524,472 bytes**; deployed full runtime pack **1,789,610 bytes / 17 files**. Worker and control inventory are outside those 17 entries. No scientific assets were regenerated.
- The PWA is live at **https://marswalk-jet.vercel.app/**. [Actual production checks](../qa/VERCEL_PRODUCTION.md). Home-screen/physical-device acceptance remains Longla/Willy's work. Automatic GitHub deployments are not connected; coordinator must deploy reviewed source changes.

Preserve local progress and original source credits. Do not repeat R1–R3, image acquisition, passport/index creation or the completed release-data handoff.

## Remaining assignment after correction review — numerical environmental data

**Goal:** supply a small, reproducible numerical dataset Enzo can explain in the app, with enough source evidence for the coordinator to agree a shared typed contract. These are historical Curiosity/Gale regional measurements, not current weather or hazards along a drawn route.

The unresolved first milestone is **traceable original source samples plus an evidence/schema proposal**; the current prototype does not establish that evidence yet. You can complete this while the runtime API is pending. Do not wait for UI work or invent fields on MissionService.

Continue your existing branch if this work has already started. Otherwise merge published main safely and use proposed **`feature/gaddielle-environment-data`**. Keep the accepted data-preparation branch/history. Do not reset/force-push or duplicate an unpublished implementation.

## Phase A — source evidence, start now

Own `docs/data/ENVIRONMENT_SOURCE_AUDIT.md` and small actual source fixtures under `tools/data/fixtures/environment/`. Locate collections through NASA PDS and the instruments' official archive documentation; verify collection/product URLs rather than guessing filenames.

- [ ] Find an interpretable **REMS reduced/processed** product containing atmospheric pressure and air temperature. Prefer a bounded, documented time window with quality information. Record original field names, units, observation timestamps/sols, location context, quality flags, missing sentinels and product/release/version.
- [ ] Independently investigate **RAD** dose-rate products. Distinguish absorbed dose from dose equivalent; confirm units and averaging interval from actual documentation. Do not hardcode a dose unit, conversion factor or uncertainty from prior conversational suggestions.
- [ ] Save a few genuine representative rows plus the relevant label/column definitions for review. Preserve original evidence; synthetic fixtures must be labeled test-only and never presented as NASA measurements. Keep source URL, exact source bytes/hash and extraction method traceable.
- [ ] Write an audit table: quantity, product/collection URL, measured field, unit, time interval, instrument/location, quality/sentinel rules, uncertainty when documented and redistribution/credit requirements. Include actual download/parse commands and observations.
- [ ] If access or interpretation is blocked, record exact URL/HTTP error or missing documentation and hand off the usable material. Do not bypass network policy, scrape random dashboard values or consume the whole release window searching one missing product.
- [ ] Hand coordinator and Enzo the real samples, audit and proposed JSON shape. Aim for pressure, temperature and radiation; if one is unavailable, make that gap explicit. Walking time is derived from assumptions, not an independent NASA measurement substitute.

## Phase B — contract agreement, before runtime generation

Coordinator owns shared models/validation/loading and worker integration; Enzo owns environmental/science/evidence UI and presentation. No environmental runtime API is implemented merely by this plan.

- [ ] Propose a versioned schema with stable quantity ID, value or explicit unavailable state, source unit, observation interval, instrument/location/sol where verified, quality/aggregation method, source/product and documented uncertainty or null.
- [ ] Separate measurement time from publication/download. Do not convert a sol to an Earth date using an invented mission epoch. Unknown observation dates stay unknown. Different REMS/RAD windows remain separately identified.
- [ ] Agree the schema/field semantics through the coordinator before producing `public/data/environment.json` or expecting Enzo to consume it. Put proposals/examples in the audit document meanwhile; do not fabricate an application service or claim a proposed contract already exists.

## Phase C — reproducible converter and numerical output

After agreement, own `tools/data/prepare_environment.py`, `tools/data/test_prepare_environment.py`, agreed small fixtures and **`public/data/environment.json`**, plus the audit/reference documentation. Use existing tooling and standard library where practical; coordinate any new dependency centrally.

- [ ] Parse the documented formats/labels and quality rules. Preserve legitimate zeros. Filter explicit invalid/sentinel samples; do not silently repair malformed records or substitute believable values.
- [ ] Report sample count/time coverage and excluded counts/reasons. Mean/min/max need real samples and a stated aggregation method; handle irregular sampling as documented. Do not pool incompatible instruments/units/locations or invent a time series from one summary.
- [ ] Preserve source units/precision unless a documented conversion is required. Label computed summaries as derived from actual observations and state their interval. Uncertainty is sourced, not guessed; no unsupported route-safety/radiation alerts.
- [ ] Emit deterministic UTF-8/LF bytes. Validate before atomic output replacement; invalid/missing inputs, wrong units/schema or truncated records return nonzero without changing an existing destination's bytes/mtime. Never overwrite source inputs.
- [ ] Test extraction against actual representative rows, valid zero, sentinels/quality rejection, invalid units/time/format, missing inputs, deterministic output and preserved destination on failure. Keep synthetic edge fixtures test-only.
- [ ] Run relevant data tests and index `--check`. Run production build for the new asset and record actual outcomes. Do not claim the live PWA includes/caches the file until coordinator integrates it and deploys a new verified pack.
- [ ] Handoff actual branch/commit, file sizes/hashes, quantity values/units/intervals, source evidence, commands/results and blockers to coordinator/Enzo through your report/MD. Push only your feature branch; no main merge, live deployment or external messages.

## Phase D — deployment data acceptance

- [ ] Update `docs/data/RELEASE_DATA_HANDOFF.md` for accepted environment data: exact committed/built bytes, hashes and runtime paths. Do not add environment/science/control files to the two-file image-only index.
- [ ] Coordinator explicitly includes the new runtime file in the full PWA pack, adds shared loading/validation, integrates Enzo's UI and deploys. Verify the actual deployed version/URL and served bytes with the coordinator.
- [ ] Check displayed units, source/quality/time labels and honest unavailable states with Enzo; confirm local summaries remain readable after preparation/disconnection with Longla. External citations can need internet.
- [ ] Supply final dataset/product/instrument credits and exact limits for Enzo's presentation. No current-condition, precise-route-location or safety claim from regional archive data.

## Conditional later work — exact-raster scale

After the numerical-data handoff, investigate whether a documented scale bar/product mapping applies to the exact 2048×1042 raster, preserving crop/resize/source evidence. Deliver evidence and uncertainty to coordinator; leave calibration unverified if insufficient. No brightness-derived elevation, guessed terrain, source image geometry/imageRef change or shared model mutation. This investigation must not block the numerical samples or already-working offline mission.

## Agent prompt — copy this

```text
You are Gaddielle's MARSWALK environmental-data correction agent.
Read docs/team/GADDIELLE.md and the latest docs/reviews/GADDIELLE.md.
Stay on existing feature/gaddielle-environment-data; preserve the prototype
and unpublished work. Merge current main safely, no reset or force push.
286374b is NOT approved: 42 tests pass but manual probes reveal blockers.

R1: provide original REMS/RAD products/labels, product IDs/URLs/hashes and
exact row extraction/quality/unit/time mapping. Current CSV is unverified;
if illustrative, make it test-only and remove verified-NASA claims.
R2: reject source/output aliases before writes, preserve bytes/mtime.
R3: reject non-finite/overflow/inconsistent input and serialize strict JSON;
fail without replacing a valid destination. Add meaningful regressions.
R4: independent quantity quality/counts, legitimate zeros, honest derived
aggregation, valid repository links and evidence-backed metadata.

No public environment.json until source/schema agreement. No shared
core/model/worker/UI/package edits or deployment. Preserve prior accepted
image/R3/release handoff. Run actual relevant tests, review diff, push only
this feature branch and report source evidence, commit/files/results/limits.
Do not start a new speculative dataset or claim tests certify NASA origin.
```
