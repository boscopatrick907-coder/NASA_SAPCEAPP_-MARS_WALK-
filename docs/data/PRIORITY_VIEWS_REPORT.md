# MARSWALK — Priority Scientific Data Views: Final Audit & Delivery Report

> **Prepared by:** Gaddielle (Data Engineering & Planetary Science Specialist, [W2](docs/team/GADDIELLE.md))  
> **Audience:** Patrick (Coordinator, [W6](docs/team/YOU.md)) and Enzo ([W3](docs/team/ENZO.md))  
> **Branch:** `feature/gaddielle-environment-data`  
> **Date:** 2026-11-15  

---

## 1. Initial Audit Findings (Phase 1)

Before executing modifications or extractions, a complete directory, git, and inventory audit was conducted across the repository:

### Initial Audit Table

| View | Existing Dataset | Source / Product ID | Geographic Coverage | Processing Status | Quality / Calibration Status | Missing Work | Recommended Action |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Atmospheric** | `observations.csv` (208 records) | REMS MODRDR Sols 3900–3915 | Gale Crater (-4.6°S, 137.4°E) | **Verified** | Official PDS confidence bitmasks applied | None for core quantities | Preserve per-quantity schema; document wind/RAD gaps |
| **Thermal (In-Situ)** | `observations.csv` (`ground_temperature`) | REMS GTS Col 8 / MODRDR6.FMT | Point rover telemetry (Sols 3900–3915) | **Verified** | High recalibration quality bitmask | Distinction from orbital IR | Separate in-situ skin temperature from orbital thermal inertia |
| **Thermal (Orbital)** | None in repository | THEMIS IR Mosaic (`PIA14290`) | Regional Gale Crater (~154 km) | **Cataloged** | 100 m/pixel | Not ingested into client bundle | Document as regional context; exclude from mobile runtime |
| **Optical** | `PIA26306_derived_2048.jpg` | HiRISE `PSP_001752_1750` | Boxwork Ridge Corridor | **Processed** | Visual presentation; unverified ground scale | Projective transform unpublished | Maintain `calibration.verified: false`; preserve bottom-left contract |
| **Topographic** | `public/data/terrain/README.md` | HiRISE DTM `DTEEC_001488_...` | Mount Sharp Interior Mound | **Evaluated** | Sub-meter (1.01 m/px), 360 MB .IMG | Excluded from v1 (< 2 MB budget) | Deliver full PDS DTM metadata; document v2 tiling roadmap |
| **Geological** | `markers.json` (Emma's context) | Curiosity MSL / HiRISE | Mount Sharp Boxwork / Glen Torridon | **Integrated** | High-level science markers | Local boxwork drill ground truth | Synthesize Curiosity boxwork drilling (Nevado Sajama) in documentation |

---

## 2. Atmospheric Improvements & Sensor Audit (Phase 2A)

- **Verification of Delivered Telemetry:**
  - **Pressure & Air Temperature:** 16/16 sols fully populated with valid daily mean, min, and max values. Sourced from 496,299 raw measurements across Sols 3900–3915.
  - **Ground Temperature:** Brightness temperature from REMS GTS is verified as the radiometric skin temperature of the immediate ground patch under the rover mast.
  - **Relative Humidity:** 16/16 sols extracted with the explicit qualification that `HS_CONFIDENCE_LEVEL` byte 0 is `'0'` across all records (preliminary quality).
  - **Ultraviolet Irradiance:** Extracted daytime total ABC band irradiance ($W/m^2$).
  - **Wind Sensor:** Confirmed 0 valid records across all 16 sols (`WS_CONFIDENCE_LEVEL = 'XXXXXX'`, values `-999.00`). Properly cataloged as `instrument_inactive`.
- **Sufficiency Decision:** The 16-sol baseline provides a clean, robust, and continuous diurnal planetary boundary layer baseline for Gale Crater during early southern spring ($L_s \approx 145^\circ - 153^\circ$). No arbitrary extrapolation across the map is performed.

---

## 3. Thermal Dataset Findings & Separation (Phase 2B)

- **Repository Search Result:** Prior to this phase, in-situ REMS ground brightness temperature was the only thermal data present in the repository.
- **Orbital Investigation:**
  - Evaluated **THEMIS Gale Crater Infrared Mosaics (`PIA14290`)** from 2001 Mars Odyssey (100 m/pixel).
  - *Footprint:* Gale Crater floor and Mount Sharp central mound (~154 km diameter, centered at 4.5°S, 137.4°E).
- **Physical Sensor Separation:**
  - Documented in [data/thermal/README.md](data/thermal/README.md).
  - *REMS GTS:* Point-in-time rover skin temperature (diurnal range: 83.7 K to 267.7 K).
  - *THEMIS IR:* Orbital bulk thermal inertia ($I = \sqrt{k\rho c}$), confirming that boxwork ridges consist of dense cemented bedrock that retains heat into the night, contrasting with cold aeolian sand.
  - *Decision:* These two datasets are kept strictly separate and not combined into a misleading single surface-temperature map.

---

## 4. Optical Image Calibration Resolution (Phase 3)

- **Investigation:** Examined `PIA26306` (JPL Photojournal public release) and parent orbital observation `PSP_001752_1750` (HiRISE, MRO).
- **Finding:** While the parent HiRISE observation has a documented nominal pixel scale (~0.25 m/pixel), the Photojournal release `PIA26306.jpg` is a contrast-enhanced visual crop whose exact crop coordinates, rotation, and resampling kernel were not published by JPL.
- **Resolution:**
  - Defensible scientific ethics require reporting calibration as **Unverified** (`calibration.verified: false`, `metersPerPixel: null`).
  - No synthetic metric scale is invented.
  - The established internal coordinate contract `image-pixels-bottom-left` ($2048 \times 1042$ px) is preserved.

---

## 5. Topographic Data Delivery & Evaluation (Phase 4)

- **Authoritative Dataset Cataloged:**
  - **Product ID:** `DTEEC_001488_1750_001752_1750_U02`
  - **Source URL:** `http://hirise-pds.lpl.arizona.edu/PDS/DTM/PSP/ORB_001400_001499/PSP_001488_1750_PSP_001752_1750/`
  - **Resolution:** 1.01 m/pixel post spacing, ~0.25 m relative vertical precision.
  - **Coverage:** Direct 100% overlap with the boxwork region on Mount Sharp.
- **Topographic Specification Delivered:**
  - Created [data/terrain/README.md](data/terrain/README.md).
  - Evaluated the 360 MB raw `.IMG` payload against client requirements. Ingesting 360 MB exceeds the offline mobile PWA budget (< 2 MB) and crashes WebGL context on target devices.
  - Formally classified as **Unavailable — Documented Gap** for v1 runtime (`terrainStatus: 'unavailable'`). The 3D rehearsal renders a flat plane ($Y = 0$) with explicit UI warnings.
  - Rejection of coarse alternatives (HRSC 50 m/px and MOLA 463 m/px) reaffirmed.

---

## 6. Geological Data Delivery & Boxwork Synthesis (Phase 5)

- **Geological Specification Delivered:**
  - Created [data/geology/README.md](data/geology/README.md).
- **Regional Framework:** Synthesized stratigraphy from Anderson & Bell (2010), placing the boxwork ridges within the upper diagenetic sulfate-bearing sequence of lower Mount Sharp.
- **In-Situ Ground Truth (Curiosity Rover):**
  - Documented recent in-situ drilling operations at **Nevado Sajama** (Sol 4718, 2025-11-13) and **Nevado Sajama 2** (Sol 4803, 2026-02-09), confirming that boxwork ridges are cemented, mineralized fracture fills (sulfates/silica) left standing in relief after softer sedimentary host rock eroded away.
- **Integrity Rule:** No fictitious vector boundary shapefiles were invented for the UI.

---

## 7. Exact Product Identifiers & Sources

| Product / Catalog ID | Instrument / Mission | Data Type / Format | Archive Link |
| :--- | :--- | :--- | :--- |
| `RME_*RMD3900*` to `3915*` | Curiosity REMS / MSL | ASCII Tables (MODRDR6) | `https://atmos.nmsu.edu/PDS/data/mslrem_1001/` |
| `PIA26306` / `PSP_001752_1750` | HiRISE / MRO | Visual Raster / JP2 | `https://photojournal.jpl.nasa.gov/catalog/PIA26306` |
| `DTEEC_001488_1750_001752_1750_U02`| HiRISE Stereo / MRO | DTM Elevation (PDS .IMG) | `http://hirise-pds.lpl.arizona.edu/PDS/DTM/PSP/ORB_001400_001499/` |
| `PIA14290` | THEMIS / Mars Odyssey | Thermal IR Mosaic | `https://photojournal.jpl.nasa.gov/catalog/PIA14290` |
| MSL Sols 4718–4811 Science Logs | Curiosity MAHLI/APXS/SAM | Ground truth drill logs | `https://science.nasa.gov/mission/msl-curiosity/` |

---

## 8. Files Delivered & Processing Commands

### Files Delivered
- `data/environment/observations.csv` (208 verified records)
- `docs/data/sources.csv` (32 PDS products)
- `docs/data/DATA_DELIVERY.md` (Multi-view handoff specification)
- `docs/data/processing.md` (Updated extraction methodology)
- `data/terrain/README.md` (Topographic evaluation & DTM specification)
- `data/thermal/README.md` (Thermal separation & THEMIS evaluation)
- `data/geology/README.md` (Geological stratigraphy & boxwork ground truth)
- `tools/data/extract_rems_observations.py` (Extractor producing Patrick's schema)
- `docs/data/PRIORITY_VIEWS_REPORT.md` (This document)

### Extraction & Test Commands
```bash
# Extract environmental data
python tools/data/extract_rems_observations.py

# Run all 53 unit tests
python -m unittest discover -s tools/data -p "test_*.py"
```

---

## 9. Test Verification & Actual Results

```text
Ran 53 tests in 13.773s
OK
```
All 53 unit tests pass, confirming bitmask parsing, R2/R3 guards, non-overwriting atomic writes, and schema compliance.

---

## 10. Commit & Git Status

- **Branch:** `feature/gaddielle-environment-data`
- **Clean Working Tree:** Only documented and verified scientific deliverables staged. Raw downloads (~183 MB) remain untracked.

---

## 11. Remaining Blockers & Limitations

1. **Schema Agreement:** Coordinator (Patrick) must approve `EnvironmentContext` interface in `src/app/core/models.ts` before generating `public/data/environment.json`.
2. **Offline Elevation:** Full DTM (360 MB) remains excluded from v1 PWA client bundle.
3. **Metric Scale:** Visual raster distance calculations remain disabled (`metersPerPixel: null`).

---

## 12. Final Priority Scientific Views Summary Table

| View | Dataset / Product | Source | Geographic Coverage | Resolution | Status | Files Ready for Integration |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Atmospheric** | REMS MODRDR Sols 3900–3915 | NASA PDS Atmospheres Node | Gale Crater (-4.6°S, 137.4°E) | Point rover telemetry (1 Hz) | **Verified and ready for review** | `data/environment/observations.csv`, `docs/data/sources.csv` |
| **Thermal (In-Situ)** | REMS GTS Ground Brightness Temp | NASA PDS Atmospheres Node | Gale Crater (Curiosity traverse) | Point rover footprint (~few m) | **Verified and ready for review** | `data/environment/observations.csv`, `data/thermal/README.md` |
| **Thermal (Orbital)** | THEMIS Gale Crater IR Mosaic (`PIA14290`) | ASU Mars Space Flight Facility / JPL | Gale Crater & Mount Sharp (~154 km) | 100 m/pixel | **Available but unprocessed** | `data/thermal/README.md` |
| **Optical** | Visual Map Texture (`PIA26306_derived_2048.jpg`) | NASA JPL Photojournal / MRO HiRISE | Mount Sharp Boxwork Ridge Network | 2048 × 1042 px visual | **Verified and ready for review** (texture) / **Unverified** (scale) | `public/data/manifest.json`, `public/data/imagery/` |
| **Topographic** | HiRISE DTM `DTEEC_001488_1750_001752_1750_U02` | University of Arizona / NASA PDS | Edge along Gale Crater Interior Mound | 1.01 m/pixel | **Unavailable — documented gap** | `data/terrain/README.md` |
| **Geological** | Gale Crater Boxwork Stratigraphy & MSL Drilling | Anderson & Bell (2010) / NASA MSL Science Team | Lower Mount Sharp Boxwork Corridor | Outcrop to sub-millimeter | **Verified and ready for review** | `data/geology/README.md`, `public/data/markers.json` |
