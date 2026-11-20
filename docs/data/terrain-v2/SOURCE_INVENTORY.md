# Terrain V2 — source inventory (dossier)

Gaddielle's dossier, filled by the coordinator's coding agent on 20 Nov 2026 after network access to the provider was approved. **Gaddielle reviews these values against the files; Patrick owns acceptance** ([ACCEPTANCE.md](ACCEPTANCE.md)). Every value cites its source. Files and hashes: [files.json](files.json). Retrieval: [retrieval-log.md](retrieval-log.md). Original labels: [metadata/](metadata/).

Status: `stated` (copied from a cited source) · `inspected` (checked on the actual file) · `unknown`.

## Candidate 1 — HiRISE DTM `DTEEC_001488_1750_001752_1750_U02`

| Field | Value | Evidence | Status |
|---|---|---|---|
| Product ID / version | DTEEC_001488_1750_001752_1750_U02, `PRODUCT_VERSION_ID` 2.0, data set MRO-M-HIRISE-5-DTM-V1.0 | label `PRODUCT_ID`, `PRODUCT_VERSION_ID`, `DATA_SET_ID` | inspected |
| Producer | University of Arizona (`PRODUCER_ID` UA). Technical contact USGS Astrogeology. ISIS + SOCET SET 5.5.0 (NGATE) | label `PRODUCER_*`, `SOFTWARE_NAME`; Extras README | stated |
| Source stereo images | PSP_001488_1750 (left), PSP_001752_1750 (right) | label `SOURCE_PRODUCT_ID`; catalogue page | inspected |
| Acquisition date | PSP_001752_1750: 2006-12-10 (active manifest). PSP_001488_1750: not stated in the files retrieved | manifest `observationDate` | partly stated |
| Credit / terms | **Public domain**, no copyright restriction; credit requested: "Image: NASA/JPL/University of Arizona" | https://www.uahirise.org/media/usage.php, read 2026-11-20T21:24:33Z | stated |
| Final source URLs | see files.json (provider links followed from the catalogue page) | retrieval-log | inspected |
| Sizes and SHA-256 | IMG 360 402 944 B, `9359ca71…80bb`; label portion 4 275 B, `fca0e7b9…de1e` | files.json | inspected |
| Horizontal CRS | Equirectangular, planetocentric, east-positive, sphere R = 3396.19 km (local radius), `CENTER_LATITUDE` 0.0°, `CENTER_LONGITUDE` 137.3° | label `IMAGE_MAP_PROJECTION` | inspected |
| Same CRS as the current crop? | **No:** centre longitude 137.3° vs 180°. On this sphere with standard parallel 0 that is an exact x-translation, so the frame difference itself is not the problem (see REGISTRATION.md) | label vs CALIBRATED_CROP.json | inspected |
| Grid | 13 375 lines × 6 736 samples, PC_REAL 32-bit, `MAP_SCALE` 1.0117467945795 m, offsets line −276559.5 / sample 3577.5 px, no rotation | label | inspected |
| Footprint | lat −4.9488° to −4.7206°, lon 137.2390°E to 137.3539°E | label `MIN/MAX_LATITUDE`, `WESTERN/EASTERNMOST_LONGITUDE` | stated |
| Coverage of the study area | Full; no nodata in the study window | `prepare_terrain.py inspect` | inspected |
| Elevation units / reference | "Pixel values … represent elevations in meters above the martian equipotential surface (Mars 2000 Datum) defined by Smith, et al. (2001)". `SCALING_FACTOR` 1.0, `OFFSET` 0.0. "Products are tied to MOLA elevations." | label `IMAGE.NOTE`; Extras README | stated |
| Valid range | −4485.57 to −2977.08 m (whole DTM). Study window −4028.8 to −3809.6 m | label; inspect | inspected |
| Nodata | `MISSING_CONSTANT` 16#FF7FFFFB# (float ≈ −3.4028e38) | label | inspected |
| Vertical/horizontal accuracy | **Not stated** in the label or Extras README. Known artifacts listed: processing "boxes" (~0.5–1 m steps), CCD seams, faceted low-contrast areas | Extras README | unknown (accuracy); artifacts stated |
| Processing history | SOCET SET NGATE extraction, 1 m post spacing, tied to MOLA; method per Kirk et al. (2008) | label NOTE; Extras README | stated |

## Proposed display image — `PSP_001752_1750_RED_A_01_ORTHO`

The provider's 0.2529 m orthoimage made from this DTM. Same projection and centre longitude as the DTM (label). 53 499 × 26 943 px, 8-bit. JP2 371 396 220 B. Proposed crop: 2048 × 2048 px from column 12 565, row 27 349; centre −4.8416°, 137.2969°E. See `data/terrain-v2/staging/ortho-pair-v1/image/IMAGE_EVIDENCE.json`.

## Active image (current, for comparison)

PSP_001752_1750_RED (RDR, map-projected onto MOLA, not orthorectified), centre longitude 180°, crop 2048² at 0.25 m. Label: `data/imagery/calibrated-source/PSP_001752_1750_RED.label.txt`.

## Geology context table

| Source | Scale / resolution | CRS | Footprint | Units | Permitted use |
|---|---|---|---|---|---|
| USGS SIM 3292 Geologic Map of Mars (Tanaka et al., 2014) | 1:5 000 000 drafted, 1:20 000 000 published; 5 km vertex spacing | `GCS_Mars_2000_Sphere` | Global; study area 100 % in unit `Htu` | Chronostratigraphic units | **Regional context only** ([evaluation](../USGS_SIM3292_GEOLOGY_EVALUATION.md)) |

## Still open (Gaddielle / Patrick)

1. ~~Usage terms~~ done 20 Nov: public domain, credit line used in the app.
2. Acquisition date of PSP_001488_1750 (from its RDR label if needed).
3. No stated accuracy: show "not stated by the provider" in the evidence view; never invent one.
