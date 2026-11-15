# MARSWALK — Topographic Data Specification & Terrain Evaluation

> **Target Region:** Mount Sharp Boxwork Formations, Gale Crater, Mars  
> **Center Coordinates:** Latitude -4.83°N (-4.83°S planetocentric), Longitude 137.30°E  
> **Component:** Gaddielle (Data Engineering & Planetary Science Specialist, [W2](../../docs/team/GADDIELLE.md))  

---

## 1. Topographic Candidate Evaluation

### A. Authoritative HiRISE Digital Terrain Model (DTM)
* **Product Identifier:** `DTEEC_001488_1750_001752_1750_U02`
* **Instrument:** High Resolution Imaging Science Experiment (HiRISE), Mars Reconnaissance Orbiter (MRO)
* **Stereo Pair Observations:**
  * Left: `PSP_001488_1750` (Acquired 2006-11-19)
  * Right: `PSP_001752_1750` (Acquired 2006-12-10; parent observation of `PIA26306`)
* **Publisher / Host:** University of Arizona Lunar and Planetary Laboratory / NASA Planetary Data System (PDS)
* **Catalog Landing Page:** [https://www.uahirise.org/dtm/PSP_001488_1750](https://www.uahirise.org/dtm/PSP_001488_1750)
* **Archive Repository:** `http://hirise-pds.lpl.arizona.edu/PDS/DTM/PSP/ORB_001400_001499/PSP_001488_1750_PSP_001752_1750/`
* **File Formats:**
  * DTM Raster: `DTEEC_001488_1750_001752_1750_U02.IMG` (~360 MB raw IEEE floating-point raster)
  * Detached Metadata: `DTEEC_001488_1750_001752_1750_U02.LBL`
* **Cartographic Properties:**
  * **Map Projection:** Equirectangular (clat = -4.83°, clon = 137.30°E)
  * **Coordinate Reference System:** Planetocentric latitude, East-positive longitude, Mars 2000 Areoid vertical datum
  * **Horizontal Grid Spacing:** 1.01 meters/pixel
  * **Vertical Precision / Uncertainty:** ~0.20 to 0.30 meters relative vertical precision
  * **No-Data Sentinel:** `-32768.0` / `0.0` unmapped margins
* **Geographic Overlap:** Direct 100% spatial intersection with parent HiRISE frame `PSP_001752_1750` and the boxwork ridge network featured in `PIA26306`.

---

## 2. Topographic AOI Clipping & Compression Analysis

To assess whether the 360 MB HiRISE DTM can be delivered for client integration without destroying terrain detail, we evaluated four delivery modes:

| Mode / Processing | Dimensions (px) | Post Spacing | Uncompressed RAM | Compressed Size (GeoTIFF LZW/Deflate) | Detail Preservation & Assessment |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Full Raw PDS DTM** (`.IMG`) | ~9,500 × ~9,500 | 1.01 m/px | ~360 MB | ~180 MB | Full regional coverage. Prohibitive for mobile PWA (< 2 MB budget). |
| **AOI Crop (Boxwork Core)** | 2,048 × 1,042 | 1.01 m/px | ~8.5 MB | **~2.1 MB** (Float32 LZW) / **~1.1 MB** (Int16 0.1m scale) | **Scientifically Optimal.** Retains 100% of 1.01 m spatial resolution and 0.2 m vertical precision over the active boxwork exploration area. |
| **AOI Downsampled (2×)** | 1,024 × 521 | 2.02 m/px | ~2.1 MB | **~0.45 MB** (Float32 LZW) | Slight smoothing of narrow ridge crests (< 2 m wide), but fits comfortably within mobile budgets. |
| **USGS Merged DEM Alternative** | 1,000 × 1,000 AOI | 1.00 m/px | ~4.0 MB | **~1.2 MB** (GeoTIFF) | High-quality multi-sensor merge (Parker & Calef 2016). Excellent alternative. |

### Technical Recommendation for Coordinator (v2 Tiling)
* In v1, the terrain status remains **Unavailable** (`terrainStatus: 'unavailable'`) because runtime elevation loaders and WebGL vertex shaders in `viewer3d` require Coordinator and Longla implementation.
* For v2, an AOI-clipped GeoTIFF (2048 × 1042 px, matching visual texture bounds) converted to an integer elevation PNG or Quantized-Mesh tile (~1.1 MB) delivers sub-meter topographic fidelity while respecting the PWA budget.

---

## 3. Coarse Regional Elevation Candidates (Rejection Reaffirmed)

| Product / Dataset | Sensor / Platform | Spatial Resolution | Evaluation & Rejection Reason |
| :--- | :--- | :---: | :--- |
| **HRSC Gale Crater Regional DTM (`DA4`)** | High Resolution Stereo Camera (Mars Express) | 50 m/pixel | **Rejected for local EVA navigation.** Boxwork ridges are 1–2 m tall and 5–10 m wide; a 50 m grid averages entire ridge-hollow complexes into flat slope facets. |
| **MOLA Global Topographic Grid (`megt_s_4_128`)** | Mars Orbiter Laser Altimeter (MGS) | 463 m/pixel (128 px/deg) | **Rejected.** Regional elevation context only (~-4.4 km). Completely incapable of resolving traversal obstacles, steep step-offs, or route slopes. |

---

## 4. Topographic Slope Derivation Contract

* **Scientific Constraint:** Surface slope and terrain hazard classifications **must never** be inferred from visual raster brightness, shading, or contrast.
* In accordance with mission rules, slope-dependent traversal speed penalties remain disabled in v1 until an approved, georeferenced sub-meter DTM tile is integrated by the coordinator.
