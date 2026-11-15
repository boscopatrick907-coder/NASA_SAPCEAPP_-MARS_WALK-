# Curiosity REMS Sol 4803 observation sample

This directory contains a bounded, reproducible sample from a real NASA Planetary Data System (PDS) REMS MODRDR product and its same-sol rover-geometry companion. The raw tables and both PDS3/PDS4 labels are retained under `source/`; [manifest.json](manifest.json) records the product IDs, release, exact URLs, file sizes, local SHA-256 fingerprints, original table fields, and coordinate frame.

## Source and identity

- Mission/instrument: Mars Science Laboratory / Curiosity Rover Environmental Monitoring Station (REMS).
- Data set: `MSL-M-REMS-5-MODRDR-V1.0`, Release `0042`.
- Atmospheric product: `RME_823829944RMD48030000000_______P1`, Sol 4803, product version `V1.0`.
- Same-sol location product: `RME_823829944ADR48030000000_______P1`.
- PDS MODRDR label bounds: `2026-02-08T14:49:47.371Z` through `2026-02-09T13:30:33.153Z`. The table's first and last source `TIMESTAMP` values are also kept; no row-level UTC conversion was performed.
- The MODRDR source table contains 30,801 rows, 40 fields, and 372-byte records including CRLF. The downloaded `.TAB` is 11,457,972 bytes, exactly 30,801 × 372. The original PDS3 `.LBL` declares the same identity and dimensions; the accompanying PDS4 XML label supplies field names, units, and descriptions.
- The source labels list the upstream acquisition, engineering, gain, and calibration product IDs. They are reproduced in the manifest.
- Source URL: [official PDS Sol 4803 MODRDR directory](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_04710_04843/SOL04803/). Product table and label URLs are also embedded per record in `observations.csv` and listed individually in the manifest.
- Retrieved 2026-11-15. SHA-256 values are local fingerprints of the downloaded files; the PDS directory listing did not publish checksums, so these are not called NASA checksums.

The official PDS Atmospheres archive describes the MODRDR volume as corrected/modelled REMS environmental data and lists products through Sol 4843. PDS documents maximum 1 Hz resolution, typically five minutes each hour plus extra sessions. Product values are rover-local, historical observations, not a forecast or continuous record for a region. See the [REMS data archive](https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html), [PDS MODRDR data-set record](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=MSL-M-REMS-5-MODRDR-V1.0), and [Release 0042 product information](https://pds.nasa.gov/datasearch/subscription-service/data_product_information.cfm?dsid=MSL-M-REMS-5-MODRDR-V1.0&releaseid=0042).

## Extracted CSV

`observations.csv` has 33 rows. The extraction selects the first source record with finite, non-sentinel ambient temperature and pressure in each occupied 1,800-second bin, measured from the first MODRDR table timestamp. It does not interpolate, convert units, average values, or filter by confidence code. It then joins the ADR position only where its original `TIMESTAMP` exactly equals the MODRDR timestamp. The source row numbers and both product IDs/URLs remain in every row.

| CSV column | Source field and meaning |
| --- | --- |
| `product_id`, `release_id`, `planet_day_number` | Product label identity: MODRDR product, PDS release, and Mars sol. |
| `source_row_number` | One-based row number in the original MODRDR table. |
| `source_timestamp_seconds_since_2000_noon` | Original `TIMESTAMP`, seconds since noon on 2000-01-01 per PDS label; not converted to UTC. |
| `source_lmst`, `source_ltst` | Original local mean solar time and local true solar time strings. |
| `ambient_temperature_k` | Original `AMBIENT_TEMP`, kelvin; a rover ambient estimate derived by the REMS processing from filtered local boom air-temperature readings. |
| `ambient_temperature_confidence_code` | Original `AMBIENT_TEMP_CONFIDENCE_LEVEL` string. `0`, `1`, and `X` retain their source meanings; no quality threshold was imposed. |
| `pressure_pa` | Original `PRESSURE`, pascals. |
| `pressure_absolute_accuracy_pa` | Original `PRESSURE_UNCERTAINTY`, pascals; the PDS4 field description calls it “Pressure absolute accuracy.” The source value is copied without reinterpretation. |
| `pressure_confidence_code` | Original `PS_CONFIDENCE_LEVEL` string, retained without filtering or reinterpretation. |
| `pressure_sensor_configuration` | Original `PS_CONFIGURATION` code (pressure oscillator and resolution mode). |
| `source_product_url` | Direct archive URL for the MODRDR `.TAB` source. |
| `location_product_id`, `location_product_url` | Same-sol ADR geometry product identity and direct `.TAB` URL. |
| `location_source_row_number`, `location_timestamp_seconds_since_2000_noon` | One-based row in the ADR geometry table and its original timestamp. A record is emitted only on an exact timestamp match. |
| `rover_position_x_m`, `rover_position_y_m`, `rover_position_z_m` | Original ADR rover position components in meters, relative to the landing site in the MSL_TOPO frame. These are not latitude/longitude. |

The REMS MODRDR label identifies its source products and calibration files. The ADR label describes the geometry table as rover and sun positions; its PDS4 field definitions identify the X/Y/Z axes in the local topographic frame. The user's approximate boxwork coordinate (4.843° S, 137.298° E) remains regional context only: these ADR values were not transformed to geographic coordinates, so this contribution does not claim that rover measurements are co-located with that point.

## Reproduction and evidence checks

From the repository root:

```powershell
node tools/data/extract_rems_sol_4803.js
node tools/data/extract_rems_sol_4803.js --check
node --test tools/data/test_extract_rems_sol_4803.js
```

The extractor verifies local SHA-256 and byte sizes for all six retained source files; product IDs, release, sol, source/calibration IDs, product bounds, field names/units and table dimensions against the labels; fixed-width/CRLF records; exact MODRDR-to-ADR timestamp joins; and the selected row count. The tests compare every extracted timestamp, time string, pressure, temperature, confidence code, configuration, and X/Y/Z value directly to its referenced source row. Failure tests cover malformed rows, missing position matches, and source missing-value sentinels.

## Scientific limits

- This is one historical sol product, not live conditions, a forecast, a climatology, or continuous coverage of Gale Crater or Mount Sharp.
- It is reasonable only as historical, rover-local Gale Crater atmospheric context for the prototype. It cannot represent current weather or certify conditions at the selected boxwork coordinate.
- Its label interval spans about 22 hours 41 minutes, but the source rows are burst-like: among 30,800 successive timestamp intervals, 15 exceed one second and the largest gap is 3,403 seconds (56 minutes 43 seconds). The extracted 33-row sample has gaps up to about 81 minutes between selected records. Absent intervals remain absent.
- Pressure and ambient-temperature fields have values in all 30,801 rows of this product, but that does not remove temporal gaps or certify all confidence factors. The raw confidence codes and pressure configuration are retained; they are not collapsed into an invented quality score.
- The reported air temperature is a processed rover-ambient estimate, not ground/brightness temperature. Pressure is a separate atmospheric quantity in Pa. Neither is a terrain or safety measurement.
- MODRDR applies corrections/models. Sensor location is on Curiosity, and local rover conditions do not establish exact conditions at the user's approximate boxwork coordinate.
- The ADR local coordinate frame has not been transformed into the map's latitude/longitude or image-pixel system. Do not use these coordinates as map pins or route destinations.
- This source contribution does not modify the application runtime schema or `public/data/environment.json`; coordinator review and schema approval remain separate.
