# Terrain preparation — input/output contract and tool (Planning V2)

Branch `feature/enzo-terrain-preparation-v2`. Prepared by the coordinator's coding agent for **Enzo 1's slice; Enzo 1 owns review and changes.** It implements the draft [terrain contract v1](../planning/TERRAIN_CONTRACT_V1.md) §2–§3 package format. Synthetic tests only. **No real DEM has been processed and nothing is accepted.**

> If you (Enzo 1) already have unpublished preparation tooling, compare before choosing. Don't keep two.

## Tool

`tools/terrain/prepare_terrain.py` uses numpy + tifffile (`tools/data/requirements-spatial.txt`), the same stack as `prepare_calibrated_crop.py`. GDAL isn't required to run it.

```bash
python -m pip install -r tools/data/requirements-spatial.txt
```

```bash
python tools/terrain/prepare_terrain.py inspect path/to/DTEEC_….LBL
```

```bash
python tools/terrain/prepare_terrain.py inspect path/to/dem.tif --image-evidence docs/data/evidence/CALIBRATED_CROP.json
```

```bash
python tools/terrain/prepare_terrain.py extract --source path/to/dem.tif --image-evidence docs/data/evidence/CALIBRATED_CROP.json --out STAGING/terrain-<product>-<imageRef>-v1 --package-id terrain-<product>-<imageRef>-v1 --product-id <PRODUCT_ID> --title "<title>" --source-url https://… --credit "<credit>" --vertical-reference "<verbatim datum/reference from the inventory>"
```

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tools/terrain -p 'test_*.py' -v
```

Exit codes: `0` ok · `2` refused (evidence, CRS, coverage, existing output) · `3` bad input (unreadable, HTML instead of a raster, integer or multi-band data, missing georeference).

## Inputs

| Input | Rule |
|---|---|
| HiRISE PDS3 `.IMG`/`.LBL` | `inspect` only. Label keywords are copied **verbatim** (product, source IDs, lines/samples, sample type, missing constant, projection, scale, offsets, bounds). The tool doesn't interpret PDS pixel-offset conventions. |
| GeoTIFF DEM | `inspect` and `extract`. Single band, floating point, tiepoint at raster (0,0), no rotation. PixelIsPoint tiepoints are shifted to the corner. |
| PDS3 → GeoTIFF | Convert on a GDAL machine, e.g. `gdal_translate -of GTiff DTEEC_….IMG dem.tif`. Record the exact command, `gdalinfo --version` and both hashes in the retrieval log. This is the only step that interprets PDS geometry, and Patrick reviews it. |
| Image evidence | `docs/data/evidence/CALIBRATED_CROP.json`: bounds, pixel size and CRS of the active image. |
| Vertical reference, title, credit, URL, product ID | Must come from the reviewed `SOURCE_INVENTORY.md`. The tool refuses to run without them and never guesses. |

## Checks that stop extraction (exit 2)

- **CRS mismatch:** the DEM must be equirectangular (GeoTIFF code 17), in metres, on a sphere with the same radius, centre longitude, centre latitude, **standard parallel** and false easting/northing as the image. HiRISE DTMs often use a non-zero standard parallel, so expect this to fire. Reproject in a separate reviewed GDAL step (record command and resampling). This tool never reprojects.
- **Coverage:** the DEM must cover the whole image footprint. Otherwise propose a reduced area or an alternative imagery–DTM pair.
- **Grid:** north-up square cells. DEM spacing finer than the 0.25 m image pixel is flagged for review.
- Over 2048² cells (contract parser cap), no valid cells, vertical units not metres, missing inventory fields.

## Output (staging only, never `public/` until accepted)

```
<out>/terrain-manifest.json   contract v1 manifest, admission "proposed"
<out>/grid.f32                Float32 LE, row-major, row 0 = north, NaN = nodata
<out>/mask.u8                 1 valid / 0 invalid, agrees exactly with NaN
<out>/provenance.json         command, tool versions, source hash/size/transform/nodata, window, valid fraction
```

- **Window:** the smallest whole-cell window covering the image bounds. **No resampling**: prepared spacing = native spacing. Cells partly outside the image are kept.
- **Nodata:** NaN, values ≤ −1e30 (HiRISE's float sentinel is about −3.4028e38) and the GeoTIFF `GDAL_NODATA` value all become NaN with mask 0.
- **Output safety:** written to a hidden temp folder next to `<out>`, hash-verified, then moved into place. An existing `<out>` is kept unless `--replace` is given, and with `--replace` the old package is restored if the swap fails. An interrupted or failed run leaves no partial package.
- **Cross-check:** a package produced by this tool passes `validTerrainManifest`, `checkGridMask` and `terrainReadiness` → `verified` in `src/app/core/terrain.ts` (checked on 20 Nov 2026 with a synthetic 520×530 DEM).

## Sizes for the current crop (computed)

At 1 m native spacing: 512 × 512 cells → `grid.f32` 1 048 576 B + `mask.u8` 262 144 B ≈ **1.25 MiB** uncompressed. At 2 m: 257 × 257 → about 0.31 MiB. Routing working memory is about 13 B/cell (see [TERRAIN_ROUTING.md](../qa/TERRAIN_ROUTING.md)). Real compressed transfer size depends on the actual product and isn't measured. Patrick sets the budget.

## Tests (`tools/terrain/test_prepare_terrain.py`, 18, all synthetic)

Ramp round-trip with exact cover · larger DEM windowed without resampling · non-aligned 2 m cells take the covering window · PixelIsPoint shift · nodata sentinel/tag/NaN → mask · partial coverage refused · five CRS mismatches refused (standard parallel, centre longitude, radius, projection, units) · all-nodata refused · missing vertical reference refused with no output · integer and multi-band input → bad input · HTML error page saved as `.tif` → bad input · existing output kept without `--replace` and after a failed replace · successful replace · interrupted run leaves nothing · byte-reproducible output · PDS3 label fields verbatim, missing fields listed · non-label rejected · coverage fraction report.

Also checked: `inspect` on the real calibrated image crop `marswalk_crop.tif` reproduces the documented transform `[-2531487, 0.25, 0, -286803.75, 0, -0.25]`, no CRS problems and coverage 1.0.

## Still needed (other owners)

1. Gaddielle's reviewed source inventory and the actual label/raster (HiRISE is blocked from the cloud container; use the runbook §3 fallback).
2. A GDAL step (PDS3 → GeoTIFF, reprojection if needed) on a machine with GDAL, recorded and reviewed.
3. Patrick reproduces the extraction. Willy 2 checks alignment. Then the package goes to Royce for offline tests.
