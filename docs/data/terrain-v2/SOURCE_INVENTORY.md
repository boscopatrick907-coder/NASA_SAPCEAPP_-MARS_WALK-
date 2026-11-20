# Terrain V2 — source inventory (dossier)

Branch `feature/gaddielle-terrain-sources-v2`. Skeleton prepared by the coordinator's coding agent for **Gaddielle's "Do now" item. Gaddielle owns retrieval and every value below**, and Patrick owns acceptance ([ACCEPTANCE.md](ACCEPTANCE.md)). **No terrain file has been retrieved**: every official host was blocked from the cloud container ([retrieval-log.md](retrieval-log.md)). Nothing here is verified. Unknown stays unknown.

Status values: `unknown` (no evidence yet) · `stated` (copied from a cited source) · `inspected` (checked on the actual file).

## Candidate 1 — HiRISE DTM lead

| Field | Value | Evidence (exact label field or provider passage) | Status |
|---|---|---|---|
| Product ID / version | `DTEEC_001488_1750_001752_1750_U02` is a **lead only** (from the runbook). Not confirmed | — | unknown |
| Producer | | | unknown |
| Source stereo image IDs | The lead's name suggests PSP_001488_1750 + PSP_001752_1750. **Must be confirmed from the label**, not the name | — | unknown |
| Acquisition dates | PSP_001752_1750: 2006-12-10 is the active image's observation date (`public/data/manifest.json`). The other image's date is unknown | manifest `observationDate` | partly stated (image only) |
| Citation / credit / use terms | | | unknown |
| Final source URL(s) | | | unknown |
| Label / raster bytes and SHA-256 | | | unknown |
| Horizontal CRS and units | | | unknown |
| Standard parallel / centre latitude | **Critical.** The image crop uses standard parallel 0°. A DTM with another value needs a reviewed reprojection (see `docs/data/TERRAIN_PREPARATION.md` on `feature/enzo-terrain-preparation-v2`) | — | unknown |
| Native spacing (m) | | | unknown |
| Footprint / bounds | | | unknown |
| Coverage of the crop | Crop bounds (Equirectangular MARS, R = 3 396 190 m, centre lon 180°): xmin −2531487, ymin −287315.75, xmax −2530975, ymax −286803.75 m. Centre ≈ 4.84°S, 137.30°E | [CALIBRATED_CROP.json](../evidence/CALIBRATED_CROP.json) | target stated; overlap unknown |
| Elevation units | | | unknown |
| Vertical datum / reference | | | unknown |
| Nodata value | | | unknown |
| Stated vertical / horizontal accuracy | | | unknown |
| Processing history | | | unknown |

### Active image (for comparison; already in the repository)

| Field | Value | Evidence | Status |
|---|---|---|---|
| Product ID | PSP_001752_1750_RED | `PRODUCT_ID` in `data/imagery/calibrated-source/PSP_001752_1750_RED.label.txt` | stated |
| Map projection | EQUIRECTANGULAR | `MAP_PROJECTION_TYPE`, same label | stated |
| Centre latitude | 0.000° | `CENTER_LATITUDE`, same label | stated |
| A-axis radius | 3396.19 km | `A_AXIS_RADIUS`, same label | stated |
| Crop GeoTIFF | 2048 × 2048 at 0.25 m, SHA-256 `f2e6fda8…3123` | CALIBRATED_CROP.json; re-read with `tools/terrain/prepare_terrain.py inspect` on 20 Nov 2026 (transform and CRS match, no problems) | inspected |

## Geology context table

| Source | Scale / resolution | CRS | Footprint | Units | Permitted use |
|---|---|---|---|---|---|
| USGS SIM 3292 Geologic Map of Mars (Tanaka et al., 2014) | Drafted 1:5 000 000, published 1:20 000 000. MOLA 463 m/px and THEMIS IR 100 m/px basemaps. 5 km vertex spacing | `GCS_Mars_2000_Sphere` (per evaluation) | Global. Gale study area falls 100 % inside unit `Htu` | Chronostratigraphic map units | **Regional context only.** Not a local obstacle or alignment layer. Per [USGS_SIM3292_GEOLOGY_EVALUATION.md](../USGS_SIM3292_GEOLOGY_EVALUATION.md): `usefulForLocalBoxworkFeatureMapping: false` |

Cross-check: that evaluation's study area (137.292–137.301°E, 4.839–4.847°S) agrees with the crop centre calculated from the image evidence (4.84°S, 137.30°E).

## To complete (Gaddielle)

1. Local-download fallback (runbook §3): catalogue page → provider links → label first. Log each step in `retrieval-log.md`.
2. Save original labels/metadata unchanged in `metadata/`. Add records to `files.json` (null where unknown, no hashes of HTML pages).
3. Fill every `unknown` row with a cited value, or leave it unknown and list it for Patrick.
4. If the footprint doesn't cover the crop, or the CRS can't be reconciled: propose **one** alternative official imagery–DTM pair with its evidence.
