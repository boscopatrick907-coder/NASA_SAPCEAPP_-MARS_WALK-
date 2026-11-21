# Terrain V2 — registration evidence (20 Nov 2026)

Prepared by the coordinator's coding agent. Reproducible with the scripts in `tools/terrain/`; raw JSON in [evidence/](evidence/). Willy 2 owns the independent control-point check (R1) that should confirm or overturn this.

## 1. Current crop vs the DTM frame: fails the draft tolerance

The current crop (`hirise-psp001752-red-center-2048-025m-v2`) comes from the **RDR** PSP_001752_1750_RED, which is map-projected onto smooth MOLA terrain. The DTM's companion orthoimage PSP_001752_1750_RED_C (1 m, on the DTM grid) is orthorectified on this DTM.

Method (`tools/terrain/register_crop_to_ortho.py`): average the crop to 1 m cells, apply the exact 137.3°→180° x-translation, resample the 1 m orthoimage onto those cells, then normalised cross-correlation. Global template 384², plus 16 independent 96² tiles.

| Pixel convention tested | Global offset (E, N) | Peak NCC | Tile residual after global shift (RMS / max) |
|---|---|---|---|
| corner = label offset | **+16.9 m, +76.9 m** | 0.837 | 5.9 m / 12.0 m (14 tiles) |
| corner = offset − ½ px | +17.2 m, +77.2 m | 0.836 | 6.0 m / 12.2 m |
| corner = offset + ½ px | +16.2 m, +76.2 m | 0.836 | 6.0 m / 12.2 m |

- The crop's georeference sits about **79 m** from the DTM frame. The half-pixel convention changes this by under 1 m, so it isn't the cause.
- Even after removing the global shift, local residuals are about 6 m RMS (12 m max). That's consistent with relief displacement in a non-orthorectified image over terrain with about 280 m of relief.
- Draft contract §1.4 tolerance: RMS ≤ 1 cell (≈ 1 m), max ≤ 2 cells. **Fails.** A single shift can't fix it, and a non-rigid warp of the image would be a new, unreviewed product.

## 2. Proposed pair: ortho crop + DTM window passes

Proposed image `hirise-psp001752-red-ortho-2048-0253m-v3` = a 2048² crop of PSP_001752_1750_RED_A_01_ORTHO (0.2529 m, orthorectified on this DTM, same frame). Built by `tools/terrain/prepare_ortho_pair.py`; checked by `tools/terrain/check_registration.py`.

| Check | Result |
|---|---|
| Ortho crop (averaged ×4 to 1.0117 m) vs provider 1 m orthoimage: global | offset (−0.43, +0.51) m, NCC **0.982** |
| Same, 16 independent tiles | RMS **0.59 m**, max **0.73 m** (all 16 used) |
| DTM shaded relief vs ortho crop (approximate; best sun azimuth 150°) | peak 0.53 at (−3.2, +0.4) m |
| Draft tolerance (1 cell RMS, 2 cells max) on the ortho check | **within** |

Caveats, stated rather than explained away:

- The shaded-relief check shows about 3 m east-west. Comparing shading with albedo is biased toward the illumination direction, and the full-DTM comparison earlier gave a similar small shift (2 columns). This is the open item for Willy 2: measure ≥ 8 control points on DTM-derived features (crests, crater rims) against the ortho crop.
- The ±½-pixel label convention moves the pair by at most about 0.4 m relative to each other.
- The provider states no accuracy figure for this DTM.

## 3. Routing on the proposed package (engine from `feature/enzo-routing-worker-v2`)

Package `terrain-dteec_001488_1750_001752_1750_u02-hirise-psp001752-red-ortho-2048-0253m-v3-v1`: 513 × 513 cells at 1.0117 m, all valid, grid 1 052 676 B + mask 263 169 B. Passes `validTerrainManifest`, `checkGridMask`, `terrainReadiness` → verified. Gate stays closed while admission is `proposed`.

Start (200, 1850) → destination (1850, 200) image px:

| Grade cap | Result | Sampled distance | Max sampled grade | Time |
|---|---|---|---|---|
| 10° | no-path-within-constraints | — | — | 38 ms |
| 15° | preview-ready | 1 042.6 m | 15.0° | 239 ms |
| 20° | preview-ready | 793.7 m | 20.0° | 199 ms |
| 30° | preview-ready | 654.7 m | 29.9° | 69 ms |

Node 22, 4-vCPU cloud container. These are sampled grid-segment grades, not safety ratings.
