# Terrain V2 — source acceptance record

Owner: Patrick (coordinator). Only entries in this file admit terrain for runtime use ([contract §4](../../planning/TERRAIN_CONTRACT_V1.md#4-admission-states)). Dossier input from Gaddielle under this folder (`SOURCE_INVENTORY.md`, `files.json`, `metadata/`, `retrieval-log.md`).

## Current decision

| Candidate | For image | Status | Decided | Reviewer |
|---|---|---|---|---|
| `DTEEC_001488_1750_001752_1750_U02` (v2.0, sha256 `9359ca71…80bb`) | current crop `hirise-psp001752-red-center-2048-025m-v2` | **rejected for this image**: about 79 m offset and about 6 m RMS non-rigid residual; fails the draft tolerance ([REGISTRATION.md §1](REGISTRATION.md)) | 2026-11-20 | coordinator agent (evidence only; Patrick to confirm) |
| Same DTM + ortho crop `hirise-psp001752-red-ortho-2048-0253m-v3` | **active image from 20 Nov 2026** | **accepted** for experimental terrain preview. Source fields evidenced ([SOURCE_INVENTORY.md](SOURCE_INVENTORY.md)); accuracy not stated by the provider (shown as such); ortho registration 0.59 m RMS / 0.73 m max. **Conditions:** R1b independent control points **passed 21 Nov** (stereo parallax, 36 points, 0.20 m RMS / 0.36 m max; shading method inconclusive). See REGISTRATION.md §4. Usage terms read 20 Nov: public domain, credit line applied | 2026-11-20T19:25:18Z | Patrick (coordinator), decision given in the coordination session |

Package `terrain-dteec_001488_1750_001752_1750_u02-hirise-psp001752-red-ortho-2048-0253m-v3-v1` is now in `public/data/terrain/` and the index points at it. Acceptance applied:

1. New active image (new imageRef, new display JPEG, new manifest/evidence). Missions saved under the current imageRef stay untouched in storage and in exports but don't load on the new image (no coordinate migration).
2. Science marker records get the new imageRef (their positions are unlocated, so nothing moves).
3. Admission block set to accepted with reviewer/date/evidence. `data/terrain/index.json` points at the package. The offline pack then includes it.

Revoking: set `activePackageId` to null in `public/data/terrain/index.json` and record why here. The build then drops the package from the offline pack, and the gate reports `no-terrain-package`.

## Target image (fixed for this decision)

From [CALIBRATED_CROP.json](../evidence/CALIBRATED_CROP.json):

- imageRef `hirise-psp001752-red-center-2048-025m-v2`, source `PSP_001752_1750_RED`, crop 2048 × 2048 at 0.25 m/pixel.
- Bounds (Equirectangular MARS, radius 3 396 190 m, centre lon 180°): xmin −2531487, ymin −287315.75, xmax −2530975, ymax −286803.75 m.
- Display JPEG SHA-256 `c6cd79381c22c7ae5289ed236165b8f0047cd4489c6b0f2b7417371c5a9a8d23`; GeoTIFF crop SHA-256 `f2e6fda899f945b1cf315bc6f63389ee8098ef05c6a94bfeb1c503d3097b3123`.

## Source gate checklist — candidate 1

**Filled on 20 Nov 2026 in [SOURCE_INVENTORY.md](SOURCE_INVENTORY.md)** with label citations. The empty table below is kept as the original template.

Each row needs the exact label field or provider passage as evidence. Unknown stays unknown.

| Field | Value | Evidence | Status |
|---|---|---|---|
| Product ID and version | | | pending |
| Producer | | | pending |
| Source stereo image IDs (expect PSP_001488_1750 + PSP_001752_1750) | | | pending |
| Acquisition dates | | | pending |
| Citation / credit / use terms | | | pending |
| Authentic source URL (final, not constructed) | | | pending |
| Label/raster SHA-256 and bytes | | | pending |
| Horizontal CRS and units | | | pending |
| Same CRS as image crop, or reprojection needed | | | pending |
| Native spacing (m) | | | pending |
| Footprint/bounds | | | pending |
| Covers the crop bounds above (full / partial / none) | | | pending |
| Elevation units | | | pending |
| Vertical datum / reference | | | pending |
| Nodata value and missing fraction inside crop | | | pending |
| Stated vertical/horizontal accuracy | | | pending |
| Processing history | | | pending |
| Independent registration to the image (Willy 2) | | | pending |

Decision rule: accept only when every row has evidence, coverage is full (or partial with an explicit reduced study area), and registration meets contract §1.4. Otherwise reject and propose one alternative imagery–DTM pair with a new imageRef; existing missions are not moved.

## Retrieval log (coordinator)

| UTC | URL | Result | Note |
|---|---|---|---|
| 2026-11-20 | https://www.uahirise.org/dtm/PSP_001488_1750 | Blocked: proxy `CONNECT 403` from the cloud container | Not bypassed |
| 2026-11-20 | provider hosts | Allowlisted by Patrick; full retrieval done | See [retrieval-log.md](retrieval-log.md) and [files.json](files.json) |
