# Terrain V2 — source acceptance record

Owner: Patrick (coordinator). Only entries in this file admit terrain for runtime use ([contract §4](../../planning/TERRAIN_CONTRACT_V1.md#4-admission-states)). Dossier input from Gaddielle under this folder (`SOURCE_INVENTORY.md`, `files.json`, `metadata/`, `retrieval-log.md`).

## Current decision

| Candidate | Status | Decided | Reviewer |
|---|---|---|---|
| `DTEEC_001488_1750_001752_1750_U02` (lead only, unconfirmed identity/version) | **pending** | — | — |

No terrain product is accepted. The application still reports `terrainStatus: 'unavailable'`.

## Target image (fixed for this decision)

From [CALIBRATED_CROP.json](../evidence/CALIBRATED_CROP.json):

- imageRef `hirise-psp001752-red-center-2048-025m-v2`, source `PSP_001752_1750_RED`, crop 2048 × 2048 at 0.25 m/pixel.
- Bounds (Equirectangular MARS, radius 3 396 190 m, centre lon 180°): xmin −2531487, ymin −287315.75, xmax −2530975, ymax −286803.75 m.
- Display JPEG SHA-256 `c6cd79381c22c7ae5289ed236165b8f0047cd4489c6b0f2b7417371c5a9a8d23`; GeoTIFF crop SHA-256 `f2e6fda899f945b1cf315bc6f63389ee8098ef05c6a94bfeb1c503d3097b3123`.

## Source gate checklist — candidate 1

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
| 2026-11-20 | https://www.uahirise.org/dtm/PSP_001488_1750 | Blocked: proxy `CONNECT 403` from the cloud container | Not bypassed. Use runbook §3 local-download fallback (Gaddielle), or approve the host for the environment |
