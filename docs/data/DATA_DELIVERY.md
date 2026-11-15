# MARSWALK — Integrated Data Delivery & Provenance Specification

> **Deliverable**: Environmental Data, Image Calibration, Elevation Evaluation & Integration Handoff  
> **Prepared by**: Gaddielle (Data Engineering & Imagery, [W2](../../TEAM_TASKS.md#w2))  
> **Audience**: Coordinator (Patrick, [W6](../../TEAM_TASKS.md#w6)) and Enzo ([W3](../../TEAM_TASKS.md#w3))  
> **Branch**: `feature/gaddielle-environment-data`  

---

## Dataset Classification

| Dataset | Classification | Status |
| :--- | :---: | :--- |
| **REMS Environmental Observations** (`observations.csv`) | **Verified and Ready for Review** | 208 records (13 quantities × 16 sols), per-quantity-per-interval schema. Pressure, air temp, ground temp, humidity, UV extracted from official PDS MODRDR. |
| **Source Catalog** (`sources.csv`) | **Verified and Ready for Review** | 32 PDS products with product IDs, SHA-256 hashes, byte sizes, download/label URLs. |
| **Primary Map Texture** (`PIA26306_derived_2048.jpg`) | **Verified and Ready for Review** | Active 2D/3D texture. Coordinate convention: `image-pixels-bottom-left`. |
| **Image Ground Calibration** | **Unverified — Excluded from Runtime** | No pixel-to-ground transformation chain. `calibration.verified: false`, `metersPerPixel: null`. |
| **Digital Elevation Model** | **Unavailable — Documented Gap** | HiRISE DTM identified (1.01 m/px, 360 MB) but excluded from v1 PWA. |
| **Runtime Environment JSON** (`environment.json`) | **Unverified — Excluded from Runtime** | Awaiting Coordinator schema agreement before generation. |
| **Wind speed/direction** | **Unavailable — Documented Gap** | Wind sensor inactive during Sols 3900-3915 (all records sentinel, confidence `XXXXXX`). |
| **Radiation dose (RAD)** | **Unavailable — Documented Gap** | RAD is a separate instrument; not included in REMS MODRDR products. Requires separate PDS archive investigation. |

---

## 1. Environmental Dataset

### Delivered Quantities

| Quantity | Unit | Instrument | Sols with Data | Quality Status |
| :--- | :--- | :--- | :---: | :--- |
| Atmospheric pressure (mean/min/max) | Pa | REMS | 16/16 | All records nominal (PS_CONFIDENCE byte 1 = no shadow) |
| Air temperature (mean/min/max) | K | REMS | 16/16 | All records reliable (AMB_CONF byte 8 = reliable) |
| Ground temperature (mean/min/max) | K | REMS | 16/16 | All valid records nominal (GTS_CONF byte 1 = high quality) |
| Relative humidity | % | REMS | 16/16 | **Preliminary** (HS_CONF byte 0 = '0' for all records) |
| UV irradiance (ABC band, daytime) | W/m² | REMS | 16/16 | Variable confidence per record |
| Wind speed | m/s | REMS | **0/16** | Sensor inactive — all sentinel |
| Wind direction | degrees CW from N | REMS | **0/16** | Sensor inactive — all sentinel |
| Radiation dose/rate | — | RAD | **Not in MODRDR** | Separate instrument, separate archive |

### Schema (`observations.csv`)

One row per quantity per observation interval:

```
record_id,source_id,source_row_or_record,sol,utc_start,utc_end,quantity,
original_value,original_unit,value,unit,quality_flag,quality_explanation,missing_reason
```

### Aggregation Method

- **Interval**: 1 Mars sol (~24h 37min), defined by MODRDR `START_TIME` / `STOP_TIME` from PDS label.
- **Mean**: Arithmetic mean of all valid individual measurements for that sol.
- **Min/Max**: Extreme values among valid measurements.
- **Valid count**: Non-sentinel (`!= -999.00`), non-inactive measurements only.
- **Quality**: Independent per-sensor PDS confidence bitmasks applied; legitimate `0.0` values preserved.

### Unavailable Quantities

- **Wind**: Wind sensor was inactive for the entire Sols 3900-3915 period. All records show `-999.00` with `WS_CONFIDENCE_LEVEL = 'XXXXXX'` (unknown). Documented as `instrument_inactive`.
- **Radiation (RAD)**: The RAD instrument is separate from REMS. Its products (`mslrad_1001`) are in a different PDS archive and follow a different table format. Not included in REMS MODRDR products. Documented as unavailable.
- **Humidity quality**: All humidity readings during this period are **preliminary** (`HS_CONFIDENCE_LEVEL byte 0 = '0'`). Values are reported with this qualification but should not be treated as calibrated measurements.

---

## 2. Image Calibration

### Provenance
- **Catalog ID**: `PIA26306` (NASA JPL Photojournal)
- **Parent Observation**: `PSP_001752_1750` (HiRISE, MRO)
- **Acquisition Date**: 2006-12-10
- **Target**: Lower Mount Sharp boxwork formations, Gale Crater
- **Center**: -4.843°N, 137.298°E (Areocentric, Mars 2000)

### Status: UNVERIFIED

The active `PIA26306_derived_2048.jpg` (2048 × 1042 px, SHA-256: `7b814497...`) is a resampled crop from the JPL Photojournal public JPEG. The crop offsets, resampling kernel, and rotational alignment relative to the parent PDS EDR/RDR frame were never published. A defensible pixel-to-ground transformation cannot be reproduced.

**Bottom-left coordinate convention preserved** (`image-pixels-bottom-left`).

### Recommendation

To establish calibration: obtain the parent `PSP_001752_1750_RED.JP2` from HiRISE PDS, identify the exact crop region, and derive a world file. This requires ~2 GB download and GIS processing.

---

## 3. Elevation Data

### Best Candidate
- **Product**: `DTEEC_001488_1750_001752_1750_U02` (HiRISE DTM)
- **Resolution**: 1.01 m/pixel horizontal, ~0.25 m vertical precision
- **Format**: PDS .IMG (360 MB)
- **Status**: **Unavailable for v1** — exceeds PWA budget (~2 MB)

### Rejected Candidates
| Product | Resolution | Reason |
| :--- | :--- | :--- |
| HRSC DA4 | 50 m/px | Too coarse for local obstacles |
| MOLA MEGDR | 463 m/px | Regional context only |

---

## 4. Source Catalog (`sources.csv`)

Schema per Patrick's specification:

```
source_id,instrument,product_id,product_version,
landing_url,download_url,label_url,retrieved_utc,
filename,bytes,sha256,attribution
```

32 entries covering 16 sols × 2 files (TAB + LBL). All SHA-256 hashes verified against local files.

---

## 5. Integration Handoff

### For Coordinator (Patrick)

1. **Review** `observations.csv` and `sources.csv` schemas.
2. **Agree** `EnvironmentContext` TypeScript interface with Enzo.
3. **Create** JSON loader in `MissionService`.
4. **Generate** `public/data/environment.json` from `observations.csv` once schema is approved.
5. **Register** in PWA cache via `build-pack.mjs`.

### For Enzo

1. **Consume** environmental data via the agreed TypeScript interface.
2. **Display**: Pressure (738–809 Pa), Air temp (190–252 K), Ground temp (84–268 K).
3. **Badge**: "Preliminary" for humidity, "Unavailable" for wind and RAD.
4. **Label**: Historical rover observations (Curiosity, Gale Crater), not current conditions.

### Known Limitations

- Humidity is preliminary quality only.
- Wind sensor inactive for selected period.
- RAD not in REMS MODRDR — requires separate investigation.
- Image calibration unverified — no metric scale.
- Elevation excluded from v1 runtime.
- These are historical Curiosity rover observations, not current or forecasted conditions.
