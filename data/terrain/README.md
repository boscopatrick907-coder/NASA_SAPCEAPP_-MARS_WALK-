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
* **Runtime Deployment Evaluation:**
  * *Constraint:* MARSWALK is an offline-first Progressive Web App targeting mobile device field usage with a strict client asset budget (< 2.0 MB offline bundle).
  * *Technical Limitation:* Ingesting the uncompressed 360 MB `.IMG` raster directly into browser memory exceeds client device RAM budgets and crashes WebGL / Three.js context initializations on mobile targets.
  * *Status for v1:* **Unavailable — Documented Gap** (`terrainStatus: 'unavailable'`). The 3D viewer renders a flat topological plane ($Y = 0$) with explicit warnings.
  * *V2 Roadmap Recommendation:* A future release can extract a focused 256×256 tiled sub-raster or Quantized-Mesh terrain tile centered strictly on the active traverse waypoint corridor.

---

## 2. Coarse Regional Elevation Candidates (Rejected)

| Product / Dataset | Sensor / Platform | Spatial Resolution | Evaluation & Rejection Reason |
| :--- | :--- | :---: | :--- |
| **HRSC Gale Crater Regional DTM (`DA4`)** | High Resolution Stereo Camera (Mars Express) | 50 m/pixel | **Rejected for local EVA navigation.** Boxwork ridges are 1–2 m tall and 5–10 m wide; a 50 m grid averages entire ridge-hollow complexes into flat slope facets. |
| **MOLA Global Topographic Grid (`megt_s_4_128`)** | Mars Orbiter Laser Altimeter (MGS) | 463 m/pixel (128 px/deg) | **Rejected.** Regional elevation context only (~-4.4 km). Completely incapable of resolving traversal obstacles, steep step-offs, or route slopes. |

---

## 3. Topographic Slope Derivation Contract

* **Scientific Constraint:** Surface slope and terrain hazard classifications **must never** be inferred from visual raster brightness, shading, or contrast.
* In accordance with mission rules, slope-dependent traversal speed penalties remain disabled in v1 until an approved, georeferenced sub-meter DTM tile is integrated by the coordinator.
