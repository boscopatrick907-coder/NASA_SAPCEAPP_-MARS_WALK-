# MARSWALK — Priority Scientific Data Views: Follow-up Geological & Topographic Audit

> **Prepared by:** Gaddielle (Data Engineering & Planetary Science Specialist, [W2](docs/team/GADDIELLE.md))  
> **Audience:** Patrick (Coordinator, [W6](docs/team/YOU.md)) and Enzo ([W3](docs/team/ENZO.md))  
> **Branch:** `feature/gaddielle-environment-data`  
> **Date:** 2026-11-15  

---

## 1. Geological Verification & Rover In-Situ Observations

### A. Verification of Curiosity Observations
- **Nevado Sajama:**
  - *Drill Execution:* Sol 4718 (November 13, 2025). Bedrock ridgetop target in the Mount Sharp boxwork corridor. Smooth drill hole walls imaged at night with MAHLI LEDs (Sol 4740). 1.5-billion-pixel 360° stereo Mastcam panorama acquired (Sols 4714–4741). Sample delivered to SAM for GCMS pyrolysis analysis.
  - *Valle de la Luna:* Sols 4725–4740. Lower-elevation hollow target between boxwork ridges characterized by APXS and ChemCam to assess chemical contrast between cemented ridges and softer hollow floor rock.
  - *Nevado Sajama 2:* Sols 4803–4811 (February 9, 2026). Re-drill for wet-chemistry organic molecule extraction using TMAH.
- **Geographic Relevance:**
  - These in-situ observations occurred directly within the Mount Sharp boxwork ridge network.
- **Scientific Boundary Guard (Crucial Correction):**
  - Rover drilling at Nevado Sajama provides discrete ground truth confirming that the sampled ridge was cemented by groundwater mineral precipitation (sulfates/silica).
  - **It must not be extrapolated as proof that every ridge across the 20-kilometer boxwork formation has identical mineral composition or mechanical cohesion.** In MARSWALK, these rover observations are treated as discrete ground-truth anchors, not homogeneous regional values.
- **Marker Audit:**
  - Science markers in `public/data/markers.json` (Emma's deliverable) carry `position: null` and `positionStatus: "unavailable"`. They are contextual scientific narrative points, not geodetically verified pixel anchors on the visual map raster.

---

## 2. Actual Geological Datasets Covering Mount Sharp Boxwork

| Dataset / Study | Citation / DOI | Data Format & Source | Footprint & Overlap | Represented Features | Scientific Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Siebach & Grotzinger (2014) Boxwork Study** | *J. Geophys. Res. Planets*, 119(1), 189–198, doi:10.1002/2013JE004508 | Peer-reviewed orbital mapping & volumetric estimates; AGU / Wiley | Direct focus on Mount Sharp boxwork based on HiRISE `PSP_001752_1750` | Mapped fracture networks, ridge widths, hollow depths, and diagenetic groundwater fluid volumes | **Primary Scientific Foundation.** Direct orbital investigation of our exact boxwork region. |
| **Gale Crater Geologic Map** (Anderson & Bell 2010) | *The Mars Journal*, 5, 76–128, doi:10.1555/mars.2010.0004 | High-res geomorphic map figures; PDS / Mars Journal | Full 154 km Gale Crater; Mount Sharp basal units | Bradbury Group, Murray Formation, clay-bearing and sulfate-bearing units | **Regional Stratigraphic Context.** Authoritative pre-landing geological units. |
| **USGS Mars MSL Gale Merged DEM 1m** (Parker & Calef 2016) | USGS Astrogeology Astropedia | GeoTIFF (1 m/px), Equirectangular clat=-4.5° | MSL Gale Crater exploration quadrangle | Multi-sensor elevation and topographic contact boundaries | **Authoritative Spatial Reference.** Stitch of HRSC, CTX, and HiRISE stereo pairs tied to MOLA. |

> [!NOTE]
> **No Fictitious Vector GIS Polygons:**
> A standardized downloadable vector shapefile containing discrete polygon contacts for individual boxwork ridges does not exist in PDS archives. Mapped boundaries in published literature (Anderson & Bell 2010; Siebach & Grotzinger 2014) are interpretive morphological figures. In adherence to MARSWALK scientific ethics, synthetic vector shapefiles have **not** been fabricated.

---

## 3. Topographic Clipping & Compression Feasibility

We evaluated the clipping and compression feasibility of the authoritative HiRISE DTM `DTEEC_001488_1750_001752_1750_U02` (1.01 m/pixel post spacing, ~0.25 m vertical precision):

| Processing Pipeline | Dimensions | RAM Footprint | Compressed Storage | Terrain Detail Preservation |
| :--- | :---: | :---: | :---: | :--- |
| **Original Full PDS DTM** (`.IMG`) | ~9,500 × ~9,500 px | ~360 MB | ~180 MB | Full regional coverage; exceeds mobile PWA bundle budget (< 2 MB). |
| **AOI Clip (Boxwork Core)** | 2,048 × 1,042 px | ~8.5 MB | **~2.1 MB** (Float32 LZW) / **~1.1 MB** (Int16 0.1m) | **100% detail preserved.** Retains 1.01 m spatial resolution and 0.2 m vertical precision over the active boxwork exploration area. |
| **AOI Downsampled (2×)** | 1,024 × 521 px | ~2.1 MB | **~0.45 MB** (Float32 LZW) | Slight ridge crest smoothing (< 2 m), but fits comfortably within strict budgets. |

- **Integration Status:**
  - For v1, `terrainStatus: 'unavailable'` is maintained until the Coordinator and Longla implement runtime elevation vertex displacement in `viewer3d`.
  - For v2, an AOI-clipped Int16 GeoTIFF or Quantized-Mesh tile (~1.1 MB) provides a ready pathway for full 3D elevation integration without exceeding storage budgets.

---

## 4. THEMIS Thermal Clarification (`PIA14290`)

- **Product Identity:** `PIA14290` (NASA Planetary Photojournal) is a **visible-light mosaic presentation** of Gale Crater released in 2011 to illustrate the MSL landing ellipse.
- **Thermal Nature:** It is **not** a quantitative thermal inertia or calibrated brightness temperature raster.
- **Authoritative Thermal Data for Gale Crater:**
  - Standard THEMIS calibrated products are the *THEMIS Night IR 100m Global Mosaic* (`thm_nightir_100m`) and *THEMIS Quantitative Thermal Inertia Mosaic* (Fergason et al. 2006, 2012; USGS Astropedia).
  - *Physical Meaning:* Bulk thermal inertia ($I \approx 350-500 \, \text{tiu}$ for consolidated boxwork bedrock; $I \approx 150-250 \, \text{tiu}$ for loose sand dunes).
  - *Separation:* This orbital bulk property is kept separate from REMS GTS in-situ skin temperature (83.7 K to 267.7 K).

---

## 5. Summary Table: Scientific Views & Integration Readiness

| View | Dataset / Product | Source | Coverage | Resolution | Status | Ready for Integration |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Atmospheric** | REMS MODRDR Sols 3900–3915 | NASA PDS Atmospheres Node | Gale Crater (-4.6°S, 137.4°E) | Point telemetry (1 Hz) | **Verified** | `data/environment/observations.csv`, `docs/data/sources.csv` |
| **Thermal (In-Situ)** | REMS GTS Ground Brightness Temp | NASA PDS Atmospheres Node | Gale Crater (Curiosity traverse) | Point rover footprint | **Verified** | `data/environment/observations.csv`, `data/thermal/README.md` |
| **Thermal (Orbital)** | THEMIS Night IR & Thermal Inertia | ASU / USGS Astrogeology | Gale Crater & Mount Sharp | 100 m/pixel | **Available but unprocessed** | `data/thermal/README.md` |
| **Optical** | Visual Map Texture (`PIA26306_derived_2048.jpg`) | NASA JPL Photojournal / MRO HiRISE | Mount Sharp Boxwork Ridge Network | 2048 × 1042 px | **Verified** (texture) / **Unverified** (scale) | `public/data/manifest.json`, `public/data/imagery/` |
| **Topographic** | HiRISE DTM `DTEEC_001488_1750_...` | Univ. of Arizona / NASA PDS | Edge along Gale Crater Interior Mound | 1.01 m/pixel | **Unavailable — documented gap** | `data/terrain/README.md` (AOI clip spec: 1.1 MB) |
| **Geological** | Boxwork Diagenesis (Siebach & Grotzinger 2014) | JGR Planets / NASA MSL Science Team | Lower Mount Sharp Boxwork Corridor | Outcrop to sub-millimeter | **Verified** | `data/geology/README.md`, `public/data/markers.json` |
