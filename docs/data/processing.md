# MARSWALK — Environmental Data Processing & Extraction Methodology

> **Author**: Gaddielle (Environmental & Numerical Data Specialist)  
> **Target Scope**: Curiosity REMS Sols 3900–3915 (Mount Sharp Foothills, Gale Crater)  
> **Deliverable**: Raw PDS extraction, per-quantity-per-interval observations, and uncertainty handling  

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
- **Archive Mirror**: `https://atmos.nmsu.edu/PDS/data/mslrem_1001/` (active). Note: `pds-atmospheres.nmsu.edu` returns connection reset.

---

## 2. Column Mapping & Extracted Quantities

Per `MODRDR6.FMT`, the following quantities are extracted:

| Column # | Field Name | Unit | Extracted Quantity | Availability (Sols 3900-3915) |
| :---: | :--- | :---: | :--- | :--- |
| **38** | `PRESSURE` | Pa | Atmospheric pressure | ✅ 16/16 sols |
| **40** | `PS_CONFIDENCE_LEVEL` | Text | Pressure confidence (2 chars) | ✅ All nominal |
| **16** | `AMBIENT_TEMP` | K | Air temperature | ✅ 16/16 sols |
| **17** | `AMBIENT_TEMP_CONFIDENCE_LEVEL` | Text | Air temp confidence (9 chars) | ✅ All reliable |
| **8** | `BRIGHTNESS_TEMP` | K | Ground surface temperature | ✅ 16/16 sols |
| **11** | `GTS_CONFIDENCE_LEVEL` | Text | Ground temp confidence (4 chars) | ✅ Valid records nominal |
| **31** | `LOCAL_RELATIVE_HUMIDITY` | % | Relative humidity | ✅ 16/16 sols, **preliminary** |
| **36** | `HS_CONFIDENCE_LEVEL` | Text | Humidity confidence (3 chars) | ⚠️ All byte 0 = '0' (preliminary) |
| **21** | `UV_ABC` | W/m² | UV irradiance (ABC band total) | ✅ Daytime records only |
| **30** | `UVS_CONFIDENCE_LEVEL` | Text | UV confidence (5 chars) | Variable |
| **4** | `HORIZONTAL_WIND_SPEED` | m/s | Wind speed | ❌ Sensor inactive |
| **6** | `WIND_DIRECTION` | degrees | Wind direction | ❌ Sensor inactive |
| **7** | `WS_CONFIDENCE_LEVEL` | Text | Wind confidence (6 chars) | `XXXXXX` — all unknown |

### Not in REMS MODRDR
- **Radiation dose/dose rate (RAD)**: Separate instrument (`mslrad_1001` archive), different table format. Not extracted.

---

### 2.1 NASA PDS Official Confidence Bitmask Interpretation

Per `MODRDR6.FMT` (PDS Atmospheres Node), quality flags are **multi-bit character bitmasks** specific to each sensor:

#### PS_CONFIDENCE_LEVEL (Pressure, Column 40, 2 chars)
- **Byte 0**: Oscillator (`0` = osc 1; `1` = osc 2)
- **Byte 1**: Shadow effect (`0` = shadow; `1` = no shadow)

#### AMBIENT_TEMP_CONFIDENCE_LEVEL (Air Temperature, Column 17, 9 chars)
- **Byte 0**: ASIC temperature (`0` = < -50°C; `1` = ≥ -50°C)
- **Byte 1**: Wind Sensor (`0` = off; `1` = on)
- **Byte 2**: ASIC power supply (`0` = out of range; `1` = in range)
- **Byte 3**: Wind speed condition
- **Byte 4**: Wind direction (rover perturbation)
- **Byte 5**: Shadow condition
- **Byte 6**: Boom shadow
- **Byte 7**: Operational range (error < 5 K)
- **Byte 8**: Observation reliability (`0` = unreliable; `1` = reliable)

#### GTS_CONFIDENCE_LEVEL (Ground Temperature, Column 11, 4 chars)
- **Byte 0**: ASIC power supply (`0` = out of range; `1` = in range)
- **Byte 1**: Recalibration quality (`0` = low; `1` = high)
- **Byte 2**: Rover movement (`0` = moving; `1` = still)
- **Byte 3**: FoV shadow (`0` = shadow; `1` = no shadow)
- `XXXX` = GTS sensor inactive/recalibrating

#### HS_CONFIDENCE_LEVEL (Humidity, Column 36, 3 chars)
- **Byte 0**: Reliability (`0` = preliminary; `1` = reliable)
- **Byte 1**: RH quality (`0` = bad; `1` = good)
- **Byte 2**: VMR in range (`0` = out; `1` = in, ppm < 400)

#### UVS_CONFIDENCE_LEVEL (UV Sensor, Column 30, 5 chars)
- **Byte 0**: Global irradiance (SZA 0-30°)
- **Byte 1**: Diffuse irradiance (SZA > 30°)
- **Byte 2**: Arm position (`0` = unstowed; `1` = stowed)
- **Byte 3**: Shadow (`0` = shadow; `1` = no shadow)
- **Byte 4**: Dust degradation (`0` = attenuation ≥ 10%; `1` = < 10%)

#### WS_CONFIDENCE_LEVEL (Wind Sensor, Column 7, 6 chars)
- **Byte 0**: ASIC temperature
- **Byte 1**: ASIC noise
- **Byte 2**: Rover movement
- **Byte 3**: WS configuration
- **Byte 4**: Wind direction (rear/front)
- **Byte 5**: Observation reliability

---

## 3. Extraction Methodology

### Script
`tools/data/extract_rems_observations.py`

### Process
1. **Record Parsing**: Each sol's `.TAB` table parsed row by row (~496,299 total individual measurements across 16 sols).
2. **Sentinel Filtering**: `-999.00` values excluded. Legitimate `0.0` values preserved.
3. **Inactive Sensor Detection**: `XXXX` confidence bitmasks → sensor was inactive for that record.
4. **Per-Quantity Aggregation**: Each quantity's mean/min/max computed independently from its valid records only.
5. **Quality Tracking**: Per-sensor confidence bitmask counts tracked independently.

### Output Schema

Per Patrick's specification, `observations.csv` uses one row per quantity per observation interval:

```
record_id,source_id,source_row_or_record,sol,utc_start,utc_end,quantity,
original_value,original_unit,value,unit,quality_flag,quality_explanation,missing_reason
```

- `record_id`: `REMS_MODRDR_SOL{sol}_Q{nn}`
- `source_id`: `REMS_MODRDR_SOL{sol}` (links to `sources.csv`)
- `original_value` = `value` (units already in PDS native units)
- `missing_reason`: Empty when data present; documented reason when unavailable

---

## 4. Observed Planetary Patterns (Sols 3900–3915)

- **Atmospheric Pressure**: Daily range ~738–809 Pa. Slight seasonal decrease as $L_s$ progresses.
- **Air Temperature**: Nighttime ~190 K, afternoon ~252 K. Mean diurnal ~206–220 K.
- **Ground Temperature**: Higher variance: dawn ~84 K, noon peak ~268 K.
- **Humidity**: Preliminary readings ~5–28% RH. All classified as preliminary quality.
- **UV (ABC)**: Daytime irradiance varies with solar zenith angle and dust opacity.

---

## 5. Scientific Limitations

1. These are **historical Curiosity rover observations**, not current conditions or forecasts.
2. Wind sensor was inactive — no wind data available for this period.
3. Humidity readings are **preliminary** quality per PDS confidence bitmasks.
4. RAD (radiation) is a separate instrument not included in REMS products.
5. UV measurements are daytime-only and subject to dust attenuation.
6. `public/data/environment.json` not generated until Coordinator schema agreement.
