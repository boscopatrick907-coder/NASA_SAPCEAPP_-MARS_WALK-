# MARSWALK — Environmental Data Processing & Extraction Methodology

> **Author**: Gaddielle (Environmental & Numerical Data Specialist)  
> **Target Scope**: Curiosity REMS Sols 3900–3915 (Mount Sharp Foothills, Gale Crater)  
> **Deliverable**: Raw PDS extraction, daily observation aggregation, and uncertainty handling  

---

## 1. NASA PDS Archive Architecture & Provenance

Curiosity's **Rover Environmental Monitoring Station (REMS)** was provided by Spain's Centro de Astrobiología (CAB / INTA-CSIC). Operational telemetry and calibrated observations are published to NASA's Planetary Data System (PDS) Atmospheres Node under archive collection `mslrem_1001`.

### Data Products Used
- **Product Type**: MODRDR (Modified Reduced Data Record)
- **Data Structure**: `MODRDR6.FMT` (ASCII fixed-length table, 40 columns, `RECORD_BYTES = 372`)
- **Release ID**: `0034`
- **Software**: `REMS_QRS` v3.0.4
- **Time Window**: Sols 3900 to 3915 (Earth dates: 26 July 2023 to 12 August 2023, Solar Longitude $L_s \approx 145^\circ - 153^\circ$, Mars Year 37)
- **Location**: Lower Mount Sharp foothills / Gediz Vallis exploration corridor, Gale Crater (-4.6°S, 137.4°E, elevation ~ -4.4 km)

Each sol's dataset is archived as a pair:
1. `RME_<SCLK>RMD<SOL>0000000_______P2.LBL`: PDS3 label metadata including observation start/stop UTC, spacecraft clock intervals, record counts, and column pointer `^STRUCTURE = "MODRDR6.FMT"`.
2. `RME_<SCLK>RMD<SOL>0000000_______P2.TAB`: Comma-separated fixed-width observation table.

---

## 2. Column Mapping & Instrument Variables

Per `MODRDR6.FMT`, the verified variables are extracted as follows:

| Column # | Field Name | Unit | Sensor Description | Filtering & Quality Rules |
| :---: | :---| :---: | :---| :---|
| **1** | `TIMESTAMP` | Second | Spacecraft clock seconds since noon 1-Jan-2000 | Sequence integrity check |
| **2** | `LMST` | Text | Local Mean Solar Time (`SSSSSМHH:MM:SS.sss`) | Diurnal cycle synchronization |
| **3** | `LTST` | Text | Local True Solar Time (`SSSSS HH:MM:SS.sss`) | Solar position alignment |
| **8** | `BRIGHTNESS_TEMP` | Kelvin | Ground surface brightness temperature (GTS) | Reject `-999.00` uncalibrated/inactive sentinel; preserve valid `0.00` measurements |
| **11** | `GTS_CONFIDENCE_LEVEL` | Text | 4-character bitmask for ground temperature quality | Documented in Section 2.1 |
| **12** | `BOOM1_LOCAL_AIR_TEMP`| Kelvin | Air temperature measured at Boom 1 mast | Diagnostic reference |
| **14** | `BOOM2_LOCAL_AIR_TEMP`| Kelvin | Air temperature measured at Boom 2 mast | Diagnostic reference |
| **16** | `AMBIENT_TEMP` | Kelvin | Model-corrected ambient air temperature (mast height ~1.5 m) | Reject `-999.00` sentinel; preserve valid `0.00` measurements |
| **17** | `AMBIENT_TEMP_CONFIDENCE_LEVEL` | Text | 9-character bitmask for ambient temperature quality | Documented in Section 2.1 |
| **38** | `PRESSURE` | Pascal | Barometric surface pressure (transducer inside warm rover chassis) | Reject `-999.00` sentinel; preserve valid `0.00` measurements |
| **39** | `PRESSURE_UNCERTAINTY` | Pascal | Pressure absolute calibration accuracy (~8.3 Pa) | Systematic uncertainty boundary |
| **40** | `PS_CONFIDENCE_LEVEL` | Text | 2-character bitmask for pressure sensor configuration | Documented in Section 2.1 |

---

### 2.1 NASA PDS Official Confidence Bitmask Interpretation

Per `MODRDR6.FMT` (PDS Atmospheres Node), quality flags in Curiosity REMS products are **multi-bit character bitmasks** specific to each sensor, NOT an arbitrary global integer like `quality_flag = 0`:

#### 1. `PS_CONFIDENCE_LEVEL` (Pressure Sensor Confidence, Column 40)
String representing the confidence level for the barometric pressure transducer (`0 = bad; 1 = good; X = unknown`, byte 0 on left):
- **Byte 0 (Oscillator)**: `0` = oscillator 1 active; `1` = oscillator 2 active.
- **Byte 1 (Shadow effect)**: `0` = sensor affected by shadow; `1` = no shadow effect.
*(In Sols 3900–3915, all valid pressure records show `'11'`, indicating oscillator 2 in high-resolution mode with no shadow degradation).*

#### 2. `AMBIENT_TEMP_CONFIDENCE_LEVEL` (Ambient Air Temperature Confidence, Column 17)
String representing the ambient air temperature model confidence (`0 = bad; 1 = good; X = unknown`, byte 0 on left):
- **Byte 0**: ASIC temperature (`0` = less than -50°C; `1` = greater than -50°C).
- **Byte 1**: Wind Sensor status (`0` = WS off; `1` = WS on).
- **Byte 2**: ASIC power supply range (`0` = out of range; `1` = in range `[4.71-4.79]`, `[4.82-4.98]`, `[5.11-5.19]`).
- **Byte 3**: Wind speed condition (`0` = above threshold; `1` = below threshold).
- **Byte 4**: Wind direction w.r.t. boom (`0` = from RTG/rover deck perturbation; `1` = undisturbed).
- **Byte 5**: Sensor shadow condition (`0` = partial/no shadow; `1` = total shadow or nighttime).
- **Byte 6**: Mast boom shadow condition (`0` = partial/no shadow; `1` = total shadow or nighttime).
- **Byte 7**: Operational temperature range (`0` = error > 5 K; `1` = error within operational range).
- **Byte 8 (Reliability)**: Observation reliability (`0` = unreliable; `1` = reliable).

#### 3. `GTS_CONFIDENCE_LEVEL` (Ground Temperature Sensor Confidence, Column 11)
String representing the Ground Temperature Sensor confidence (`0 = bad; 1 = good; X = unknown`, byte 0 on left):
- **Byte 0**: ASIC power supply range (`0` = out of range; `1` = in range `[4.87-4.97]`).
- **Byte 1**: GTS recalibration quality (`0` = low quality; `1` = high quality).
- **Byte 2**: Rover movement state (`0` = moving; `1` = stationary).
- **Byte 3**: Field of View shadow condition (`0` = full or partial shadow in FoV; `1` = no shadow).
*(When GTS sensor is inactive or during thermal recalibration, bytes evaluate to `'XXXX'` or sentinel `-999.00`).*

---

## 3. Extraction Methodology

1. **Record Parsing**:
   - Each sol's `.TAB` table is parsed row by row. Total observations evaluated across Sols 3900–3915: **484,604 row records** (averaging ~30,287 readings per sol at 1 Hz intervals during active sensor sessions).
2. **Sentinel Filtering vs Legitimate Zero Preservation (R4)**:
   - In accordance with `MODRDR6.FMT`, missing, uncalibrated, or inactive sensor records are designated exclusively by the IEEE real sentinel `-999.00`.
   - **Legitimate Zeros**: Measurements evaluating to `0.0` or `0.00` are **not** discarded as missing data. A physical zero (e.g. 0.0°C or 0.0 W/m² irradiance) is preserved as a valid numerical observation. Only the documented sentinel value `-999.00` (and `XXXX` bitmasks) indicates missing or uncalibrated data.
3. **Daily Aggregations & Independent Accounting**:
   - For each sol, independent valid observation counts and nominal quality counts are tracked separately for pressure, ambient air temperature, and ground temperature in `data/environment/observations.csv`:
     - `pressure_valid_count` and `pressure_nominal_quality_count`
     - `air_temp_valid_count` and `air_temp_nominal_quality_count`
     - `ground_temp_valid_count` and `ground_temp_nominal_quality_count`
   - Daily statistical intervals (`min`, `max`, `mean`) are computed strictly from the valid non-sentinel records of that specific sensor.
4. **Outputs**:
   - Primary observations table: [`data/environment/observations.csv`](../../data/environment/observations.csv)
   - Archive sources table: [`docs/data/sources.csv`](../../docs/data/sources.csv)

---

## 4. Observed Planetary Patterns (Sols 3900–3915)

- **Atmospheric Pressure**:
  - Daily minimums: ~738.4 to 759.2 Pa (occurring in late morning/midday as thermal tides reduce local column density).
  - Daily maximums: ~791.1 to 809.4 Pa (occurring in late evening/night).
  - Mean barometric pressure: ~768.4 to 798.7 Pa.
  - Overall trend: Slight seasonal decrease over the 16-sol window as Mars progresses towards Southern Spring ($L_s \approx 145^\circ \rightarrow 153^\circ$).
- **Ambient Air Temperature (1.5 m)**:
  - Nighttime minimums: 190.0 K to 193.9 K (~-83°C to -79°C).
  - Afternoon maximums: 240.9 K to 252.1 K (~-32°C to -21°C).
  - Mean diurnal temperatures: 206.3 K to 216.5 K (~-67°C to -57°C).
- **Ground Brightness Temperature**:
  - Demonstrates much higher diurnal variance than air temperature: dropping below 140 K at dawn and peaking at 257 K to 267 K (~-16°C to -6°C) around local solar noon.

---

## 5. Scientific Limitations & Boundaries

1. **Regional Context Only**:
   - These measurements represent the planetary boundary layer at Curiosity's immediate rover location at the foot of Mount Sharp. They do not represent microclimates along arbitrary astronaut traversal vectors across steep crater walls or distant rim peaks.
2. **Radiation Handling**:
   - Surface radiation dose rate from RAD is cataloged separately in the source audit. Radiation cannot be multiplied by traverse durations to manufacture fictitious EVA exposure figures without validated spacesuit shielding thicknesses, metabolic paces, and horizon shielding geometry.
3. **PWA Runtime Governance**:
   - Per project instructions, `public/data/environment.json` is not generated until the Coordinator and Enzo formally agree on the shared TypeScript contract and runtime loader.
