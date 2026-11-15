# Environmental source investigation and illustrative converter

Updated 15 November 2026. Gaddielle supplied the earlier prototype; coordinator corrections address its temperature accounting and fixture wording. Enzo has now added one source-traceable REMS product and reproducible excerpt. **This source contribution is not runtime-approved, and no change to the coordinator-owned environmental schema or runtime JSON is made here.**

## Enzo source-verified REMS product — Sol 4803

One real Curiosity REMS MODRDR product was retrieved from the official PDS Atmospheres PDS4 bundle on 2026-11-15, with its original PDS3 label and converted PDS4 label. The source metadata, six retained files, exact download URLs, byte sizes and locally calculated SHA-256 fingerprints are recorded in [the dataset manifest](../../data/environment/rems-sol-4803/manifest.json); the extraction and field meanings are documented in [the dataset README](../../data/environment/rems-sol-4803/README.md).

- Dataset/product: `MSL-M-REMS-5-MODRDR-V1.0`, Release `0042`, Sol `4803`, `RME_823829944RMD48030000000_______P1`, product version `V1.0`.
- Label bounds: `2026-02-08T14:49:47.371Z`–`2026-02-09T13:30:33.153Z`. The source table declares 30,801 records × 372 bytes (including CRLF), matching the downloaded 11,457,972-byte TAB exactly.
- The output `observations.csv` contains 33 sampled source rows. It preserves the original timestamp/LMST/LTST, ambient temperature (K), pressure (Pa), raw confidence/configuration codes, source row numbers and direct source URLs. A same-sol ADR product supplies exact-timestamp-joined rover position X/Y/Z in meters relative to the landing site in the MSL_TOPO frame; these local coordinates were not transformed to latitude/longitude.
- The extraction selects the first valid source row in each occupied 1,800-second elapsed timestamp bin. It performs no interpolation, unit conversion, averaging or confidence-code filtering. Tests compare each CSV value to its original MODRDR or ADR row and check product identity, table dimensions, field mappings, byte sizes and local hashes.
- The PDS labels show upstream source/calibration IDs. The PDS release detail says Release 0042 covers Sols 4710–4843; the PDS dataset description identifies MODRDR as corrected/modeled rover environmental data. See the [official archive](https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html), [Sol 4803 product directory](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_04710_04843/SOL04803/), [PDS dataset record](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=MSL-M-REMS-5-MODRDR-V1.0), and [Release 0042 detail](https://pds.nasa.gov/datasearch/subscription-service/data_product_information.cfm?dsid=MSL-M-REMS-5-MODRDR-V1.0&releaseid=0042).
- The archive directory publishes the source files and sizes but no checksums; the recorded SHA-256 values are local post-download fingerprints, not NASA-published checksum assertions.
- This is a historical rover-local sol with sparse measurement windows. The full table has 30,801 rows over about 22 hours 41 minutes, with long gaps; the 33-row excerpt itself has gaps up to about 81 minutes. The rover positions have not been transformed to the user's approximate boxwork coordinate (4.843° S, 137.298° E), so no co-location is claimed. This is not live weather, forecast, continuous site coverage, a ground-temperature product, or a safety/terrain assessment.
- No application interface, runtime schema or `public/data/environment.json` was changed. Source acceptance, scientific quality review and any mapping into the coordinator-owned runtime contract remain separate gates.

## 1. Source discovery and evidence boundary

- REMS archive discovery: https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html
- RAD archive discovery: https://pds-ppi.igpp.ucla.edu/mission/MSL/MSL/RAD
- PDS search: https://pds.nasa.gov/

These are discovery references, not exact product citations or extraction evidence for the earlier illustrative fixture. REMS and RAD are different instruments; their units, intervals, detector definitions, quality flags and missing-value rules must be established separately from original product labels. Original product IDs/downloads/labels, raw hashes and row mappings have not been supplied for that fixture. No sample location, solar season, observation time, detector or quiet-Sun condition is verified there. No numerical instrument background ranges are asserted by that prototype.

Next review: independently review the Sol 4803 source/product semantics and agree any mapping to the existing coordinator-owned runtime contract before anyone publishes derived runtime data. Additional REMS sols and RAD products are separate bounded deliveries requiring their own original sources and extraction verification. Keep historical rover context distinct from conditions on a drawn route. Do not infer human dose, terrain, safety or real-time conditions.

## 2. Illustrative test fixture and conversion conventions

[CSV](../../tools/data/samples/curiosity_rems_rad_sample.csv): **1380 bytes**, SHA-256 `c86e76dea60147a9f7ee1ae53fcab686cc293e1d59eb43f56787aa8fc06d9408`. Header comments were corrected; numeric rows are unchanged. Sol 3900–3915 and season fields are fixture identifiers/values, not evidence of actual traverse or archive coverage. There are 16 fixture rows: 14 quality-0 candidates and two quality-excluded rows.

The converter's shared quality flag (0 include; 1/2 exclude) and -9999 sentinel are **fixture conventions**, not verified REMS/RAD archive semantics. Per-quantity counts reflect these conventions only. Finite, ordered temperature intervals are retained without the previous undocumented -200 degC cutoff; intervals below absolute zero (-273.15 degC) are rejected as physically invalid. This basic physical bound is not an instrument calibration range. Complete missing intervals are excluded per quantity; partial missing intervals are rejected. Valid zero radiation is retained. Derived summaries use equal-weight means of supplied daily means and extrema from the same accepted intervals; duplicate sols and observation weighting need a source-specific contract before scientific use.

Generated output is always `illustrative-sample` / `illustrative`. The schema below is a **prototype proposal only**, not an approved shared interface. Do not generate or commit public runtime environmental data or implement a dependent UI from it. Original source verification and coordinator/Enzo schema agreement are separate gates.

## 3. Version 1 Environmental Data Schema Proposal

### A. TypeScript Interface Proposal (for `src/app/core/models.ts`)

```ts
export interface EnvironmentPerQuantityAudit {
  includedSolCount: number;
  sentinelExcluded: number;
  qualityExcluded: number;
}

export interface EnvironmentSource {
  title: string;
  url: string; // validated HTTPS URL
  credit: string;
}

export interface EnvironmentQuantity {
  id: 'atmospheric-pressure' | 'ambient-air-temperature' | 'surface-radiation-dose-rate';
  name: string;
  instrument: 'REMS' | 'RAD';
  unit: 'Pa' | 'degC' | 'uGy/day';
  mean: number | null;
  min: number | null;
  max: number | null;
  sampleCount: number;
  qualityStatus: 'illustrative-sample' | 'verified-archival' | 'unavailable';
  evidenceType: 'illustrative' | 'measured';
  aggregationMethod: string;
  observationInterval: string;
  perQuantityAudit: EnvironmentPerQuantityAudit;
  source: EnvironmentSource;
  limitations: string[];
}

export interface EnvironmentContext {
  schemaVersion: 1;
  region: string;
  dataStatus: 'illustrative-sample' | 'verified-archival';
  dataStatusNote: string;
  provenance: {
    mission: string;
    instruments: string[];
    pdsNodes: string[];
    disclaimer: string;
  };
  solRange: {
    startSol: number;
    endSol: number;
  };
  sampleAudit: {
    totalInputRows: number;
    includedRows: number;
    excludedRows: number;
  };
  quantities: EnvironmentQuantity[];
}
```

### B. Serialized JSON Example (`public/data/environment.json`)

```json
{
  "schemaVersion": 1,
  "region": "Mount Sharp foothills, Gale Crater, Mars",
  "dataStatus": "illustrative-sample",
  "dataStatusNote": "Values are from an illustrative fixture CSV. Exact original PDS product IDs, label files, raw-file hashes and row extraction have not been verified. Do not display these as confirmed NASA measurements.",
  "provenance": {
    "mission": "Mars Science Laboratory (Curiosity Rover)",
    "instruments": [
      "REMS",
      "RAD"
    ],
    "pdsNodes": [
      "Planetary Data System Atmospheres Node",
      "Planetary Data System Planetary Plasma Interactions Node"
    ],
    "disclaimer": "Illustrative fixture; archive landing pages are discovery references only. Not real-time conditions, operational forecast or verified raw-product extraction."
  },
  "solRange": {
    "startSol": 3900,
    "endSol": 3915
  },
  "sampleAudit": {
    "totalInputRows": 16,
    "includedRows": 14,
    "excludedRows": 2
  },
  "quantities": [
    {
      "id": "atmospheric-pressure",
      "name": "Surface Atmospheric Pressure",
      "instrument": "REMS",
      "unit": "Pa",
      "mean": 806.1,
      "min": 767.9,
      "max": 843.5,
      "sampleCount": 14,
      "qualityStatus": "illustrative-sample",
      "evidenceType": "illustrative",
      "aggregationMethod": "mean of daily mean values; min/max span daily column minima/maxima across included sols",
      "observationInterval": "Sol 3900 to Sol 3915 (illustrative Gale Crater sample)",
      "perQuantityAudit": {
        "includedSolCount": 14,
        "sentinelExcluded": 0,
        "qualityExcluded": 2
      },
      "source": {
        "title": "NASA PDS MSL REMS Archive (illustrative sample; exact product/extraction unverified)",
        "url": "https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html",
        "credit": "NASA/JPL-Caltech/CAB (illustrative fixture only)"
      },
      "limitations": [
        "Values are ILLUSTRATIVE ONLY. Exact product/label/extraction has not been verified against a specific PDS download.",
        "Diurnal barometric amplitude reflects regional atmospheric tidal dynamics, not terrain microrelief.",
        "Illustrative fixture only; no rover observation, location or acquisition interval is verified."
      ]
    },
    {
      "id": "ambient-air-temperature",
      "name": "Illustrative Air Temperature",
      "instrument": "REMS",
      "unit": "degC",
      "mean": -47.6,
      "min": -78.7,
      "max": -17.2,
      "sampleCount": 14,
      "qualityStatus": "illustrative-sample",
      "evidenceType": "illustrative",
      "aggregationMethod": "mean of daily mean values; min/max span daily column minima/maxima across included sols",
      "observationInterval": "Sol 3900 to Sol 3915 (illustrative sample)",
      "perQuantityAudit": {
        "includedSolCount": 14,
        "sentinelExcluded": 0,
        "qualityExcluded": 2
      },
      "source": {
        "title": "NASA PDS MSL REMS Archive (illustrative sample; exact product/extraction unverified)",
        "url": "https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html",
        "credit": "NASA/JPL-Caltech/CAB (illustrative fixture only)"
      },
      "limitations": [
        "Values are ILLUSTRATIVE ONLY. Exact product/label/extraction has not been verified against a specific PDS download.",
        "No sensor position or rover location has been verified for these fixture values.",
        "Fixture extrema are not verified Martian observations or climatological bounds."
      ]
    },
    {
      "id": "surface-radiation-dose-rate",
      "name": "Illustrative Absorbed Dose Rate",
      "instrument": "RAD",
      "unit": "uGy/day",
      "mean": 211.7,
      "min": 208.7,
      "max": 215.0,
      "sampleCount": 14,
      "qualityStatus": "illustrative-sample",
      "evidenceType": "illustrative",
      "aggregationMethod": "mean/min/max of daily absorbed dose rate values across included sols",
      "observationInterval": "Sol 3900 to Sol 3915 (illustrative sample)",
      "perQuantityAudit": {
        "includedSolCount": 14,
        "sentinelExcluded": 0,
        "qualityExcluded": 2
      },
      "source": {
        "title": "NASA PDS MSL RAD Archive (illustrative sample; exact product/extraction unverified)",
        "url": "https://pds-ppi.igpp.ucla.edu/mission/MSL/MSL/RAD",
        "credit": "NASA/JPL-Caltech/SwRI/CAU (illustrative fixture only)"
      },
      "limitations": [
        "Values are ILLUSTRATIVE ONLY. Exact product/label/extraction has not been verified against a specific PDS download.",
        "Detector, shielding, solar activity and geographic context are unverified for this fixture.",
        "Does not imply human safety or operational exploration limits without dedicated habitat shielding.",
        "Route transit time cannot be multiplied into dose without verified shielding and velocity models."
      ]
    }
  ]
}
```

---

## 4. Extraction Tooling & Test Coverage

To ensure reproducible, defensive, non-speculative data extraction addressing review items R1–R4:

1. **Extraction Tool ([`tools/data/prepare_environment.py`](../../tools/data/prepare_environment.py)):**
   - **R1 (Provenance):** Labels output `illustrative-sample` and `evidenceType: illustrative`, removing false verified claims while exact product downloads remain unverified.
   - **R2 (Source Protection):** Rejects source/output aliases (`paths_alias`) before any write operation; exits with code 1, leaving source and destination bytes and timestamps completely untouched.
   - **R3 (Finite Data & Consistency):** Validates all floating-point fields are finite (`math.isfinite`), rejecting `NaN`, `±Infinity`, and overflow values. Validates interval consistency (`min <= mean <= max`) for quality-0 non-sentinel rows. Uses strict JSON serialization (`allow_nan=False`).
   - **R4 (Independent Auditing & Legitimate Zeros):** Conducts independent per-quantity sentinel filtering (`perQuantityAudit`), ensuring missing values in one sensor do not discard valid readings in another. Preserves legitimate zero values (e.g. 0.0 radiation dose rate).
   - Generates deterministic JSON atomically (using temporary file, `os.fsync`, and `os.replace`).
   - Supports read-only validation (`--check`) mode without touching files or altering `mtime`.
2. **Automated Unit Tests ([`tools/data/test_prepare_environment.py`](../../tools/data/test_prepare_environment.py)):**
   - 16 test cases covering:
     - `test_successful_generation_from_sample`: Verifies parsing, schema keys, per-quantity audit, and aggregate values.
     - `test_deterministic_output`: Confirms repeated executions produce byte-identical JSON.
     - `test_check_mode_passes_on_matching_file`: Confirms `--check` returns exit `0` without altering `mtime`.
     - `test_check_mode_fails_on_tampered_value`: Confirms altered metrics trigger exit `1`.
     - `test_check_mode_fails_on_missing_file`: Confirms missing output triggers exit `1`.
     - `test_sentinel_and_quality_filtering`: Confirms `-9999.0` and `quality_flag > 0` rows are excluded.
     - `test_missing_source_fails_cleanly`: Confirms nonexistent CSV exits `1` without traceback.
     - `test_malformed_csv_fails_cleanly`: Confirms bad headers exit `1` without traceback.
     - `test_atomic_write_preserves_existing_file_on_failure`: Confirms existing output file bytes and timestamps are preserved if extraction fails.
     - `test_output_aliasing_source_fails_and_preserves_source` (R2): Confirms passing identical source and output exits 1 and preserves source.
     - `test_output_aliasing_source_relative_path_fails` (R2): Confirms relative alias paths are caught and rejected.
     - `test_nan_input_rejected_and_preserves_destination` (R3): Confirms NaN is rejected with exit 1 and preserves destination.
     - `test_infinity_input_rejected_and_preserves_destination` (R3): Confirms Inf is rejected with exit 1 and preserves destination.
     - `test_overflow_input_rejected_and_preserves_destination` (R3): Confirms 1e309 overflow is rejected with exit 1.
     - `test_inconsistent_min_mean_max_rejected_and_preserves_destination` (R3): Confirms min > mean or mean > max is rejected with exit 1.
     - `test_legitimate_zero_radiation_preserved` (R4): Confirms 0.0 radiation is preserved as a valid measurement.
     - `test_per_quantity_independent_sentinel_handling` (R4): Confirms sentinel in one instrument does not discard valid data in another.

---

## 5. Handoff Protocol & Verification

| Role | Responsibility | Action Required |
| :--- | :--- | :--- |
| **Gaddielle (Data Owner)** | Source audit, sample compilation, converter tool, test coverage. | Prototype correction delivery only; actual source acquisition and scientific schema approval remain pending. See the latest coordinator review for tested totals. |
| **Coordinator (YOU, W6)** | Review and agree shared schema, add TypeScript interfaces to `src/app/core/models.ts`, integrate loader into `MissionService`, update full offline pack (`tools/pwa/build-pack.mjs`). | Require verified sources and agree versioned fields before any runtime file or loader implementation. |
| **Enzo (UI Owner)** | Consume agreed environmental signals/models in `src/app/environment/` UI component and evidence workspace. | Review actual verified-data needs; do not mount illustrative fixture output or import unagreed APIs. |
