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
| **8** | `BRIGHTNESS_TEMP` | Kelvin | Ground surface brightness temperature (GTS) | Reject `-999.00` sentinels; filtered by GTS confidence |
| **12** | `BOOM1_LOCAL_AIR_TEMP`| Kelvin | Air temperature measured at Boom 1 mast | Diagnostic reference |
| **14** | `BOOM2_LOCAL_AIR_TEMP`| Kelvin | Air temperature measured at Boom 2 mast | Diagnostic reference |
| **16** | `AMBIENT_TEMP` | Kelvin | Model-corrected ambient air temperature (mast height ~1.5 m) | Reject `-999.00` sentinels; filtered by ambient confidence |
| **17** | `AMBIENT_TEMP_CONFIDENCE_LEVEL` | Text | Air temperature confidence bitmask | Quality verification |
| **38** | `PRESSURE` | Pascal | Barometric surface pressure (transducer inside warm rover chassis) | Reject `-999.00` sentinels; filtered by PS confidence |
| **39** | `PRESSURE_UNCERTAINTY` | Pascal | Pressure absolute calibration accuracy (~8.3 Pa) | Systematic uncertainty boundary |
| **40** | `PS_CONFIDENCE_LEVEL` | Text | Pressure sensor confidence bitmask | Quality verification |

---

## 3. Extraction Methodology

1. **Record Parsing**:
   - Each sol's `.TAB` table is parsed row by row. Total observations evaluated across Sols 3900–3915: **484,604 row records** (averaging ~30,287 readings per sol at 1 Hz intervals during active sensor sessions).
2. **Sentinel Filtering**:
   - Missing, uncalibrated, or degraded sensor readings represented by `-999.00` (or `0.00` when sensor inactive) are strictly filtered out before computing statistics.
3. **Daily Aggregations**:
   - For each sol, the following statistics are computed deterministically:
     - `pressure_min_pa`, `pressure_max_pa`, `pressure_mean_pa`
     - `air_temp_min_k`, `air_temp_max_k`, `air_temp_mean_k`
     - `ground_temp_min_k`, `ground_temp_max_k`, `ground_temp_mean_k`
     - Observation counts for each quantity (`pressure_obs_count`, `air_temp_obs_count`, `ground_temp_obs_count`).
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
