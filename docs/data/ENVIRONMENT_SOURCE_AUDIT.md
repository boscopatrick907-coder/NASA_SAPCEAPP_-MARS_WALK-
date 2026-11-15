# MARSWALK — Environmental Source Audit & Schema Proposal

<!-- CURRENT_WORK_PLAN -->
> **Investigation, Source Audit & Schema Proposal Record (Phase A).** Prepared by Gaddielle (Data/Imagery Owner, [GADDIELLE.md](../team/GADDIELLE.md)) for Coordinator (YOU, [W6](../../TEAM_TASKS.md#w6)) and Enzo ([W3/Phase 2](../team/ENZO.md#phase-2--numerical-science-ui-and-clearer-evidence)).
<!-- /CURRENT_WORK_PLAN -->

## Purpose & Scope

This document delivers **Phase A** of the numerical environmental data work for MARSWALK:
1. Technical investigation and source audit of NASA Planetary Data System (PDS) Curiosity REMS and RAD data archives.
2. Reviewable source rows and representative archival sample covering Curiosity's traverse sector in Gale Crater.
3. Rigorous RAD radiation feasibility assessment, human exposure limitations, and physical boundary constraints.
4. Proposed Version 1 JSON schema contract (`public/data/environment.json`) and corresponding TypeScript interface proposal for `src/app/core/models.ts`.
5. Local conversion tool prototype ([`tools/data/prepare_environment.py`](../../tools/data/prepare_environment.py)) and comprehensive automated unit test suite ([`tools/data/test_prepare_environment.py`](../../tools/data/test_prepare_environment.py)).

> [!IMPORTANT]
> **Data Governance & Boundary Contract:**
> 1. **Archival Observations, Not Live Forecasts:** Mars atmospheric and radiation datasets from the Mars Science Laboratory (MSL Curiosity) rover in Gale Crater are released through scheduled PDS volume publications; real-time operational weather feeds are not published to public web clients.
> 2. **Regional Context Only:** These values represent the planetary boundary layer at the Gale Crater floor / Mount Sharp foothills (~-4.4 km elevation). They are **not** localized microclimates along an astronaut's drawn route.
> 3. **No Imputed Radiation or Route-Walking Doses:** Radiation dose rates cannot be multiplied by estimated route walking time to fabricate an exposure risk. Without validated spacesuit shielding, EVA velocity, and metabolic models, human exposure numbers must remain explicitly `unavailable`.
> 4. **Verified REMS Archival Observations & Sample Preservation:** Sols 3900–3915 official NASA PDS MODRDR tables and labels (484,604 row observations) have been verified, downloaded, and inventoried with exact SHA-256 checksums in Section 1.C. A verified extraction fixture is preserved under [`tools/data/fixtures/environment/curiosity_rems_sols_3900_3915_verified.csv`](../../tools/data/fixtures/environment/curiosity_rems_sols_3900_3915_verified.csv) alongside the test suite fixture.
> 5. **Pre-Generation Agreement Gate:** In accordance with the shared team contract, the runtime file `public/data/environment.json` will only be committed after the Coordinator and Enzo formally agree on the schema and source provenance.

---

## 1. Audited NASA PDS Source Products

### A. Curiosity REMS (Rover Environmental Monitoring Station)

- **Instrument Overview:** REMS was contributed to NASA's Mars Science Laboratory (MSL) mission by the Centro de Astrobiología (CAB / INTA-CSIC) in Madrid, Spain. It measures surface pressure, air and ground temperatures, relative humidity, wind speed, and ultraviolet radiation.
- **Audited Product Line:** MSL REMS Reduced Data Record (RDR) & Daily Weather Summaries.
- **PDS Archive Node:** NASA Planetary Data System (PDS) Atmospheres Node.
- **Archive Collection URL:** `https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html`
- **Principal Investigator:** Javier Gómez-Elvira, Centro de Astrobiología (CAB).
- **Physical Quantities & Units:**
  - **Surface Atmospheric Pressure:** Measured by a barometric sensor inside the rover warm electronics box. Units: Pascals (`Pa`). Typical diurnal amplitude: ~740 to 860 Pa (reflecting daily atmospheric thermal tides and seasonal $CO_2$ polar cap sublimation/condensation cycles).
  - **Ambient Air Temperature:** Measured by thermocouple sensors on Boom 1 and Boom 2 deployed at approximately 1.5 meters height on the rover mast. Units: Degrees Celsius (`degC` or `°C`). Typical diurnal amplitude: -79°C (minimum at dawn) to -14°C (maximum in early afternoon).
- **Quality & Sentinel Rules:**
  - **Internal Sample Convention (Illustrative Fixture)**: The sample fixture utilizes an integer column `quality_flag` where `0` = valid/included, `1` = degraded, and `2` = offline/sentinel (`-9999.0`). This is a local fixture convenience and is **not** an official NASA PDS archive column.
  - **Official NASA PDS Confidence Bitmasks**: As defined in `MODRDR6.FMT`, actual REMS archival data uses multi-character bitmasks (`PS_CONFIDENCE_LEVEL`, `AMBIENT_TEMP_CONFIDENCE_LEVEL`, `GTS_CONFIDENCE_LEVEL`) where individual bit positions specify sensor state, shadow condition, and observation reliability. Missing records in the PDS table use `-999.00`.
  - **Zero Preservation (R4)**: Valid physical measurements evaluating to `0.0` or `0.00` are strictly preserved; only documented sentinels (`-9999.0` in sample fixture, `-999.00` in raw PDS) and degraded quality statuses are excluded.
- **Archive Verification:** All 16 Sols (3900–3915) have been verified against NASA PDS Atmospheres Node MODRDR data files (`RME_*RMD*P2.TAB` and `.LBL`). File metadata, exact SCLK numbers, sizes, and SHA-256 hashes are cataloged in Section 1.C below.

### B. Curiosity RAD (Radiation Assessment Detector) Feasibility Assessment

- **Instrument Overview:** RAD was developed by Southwest Research Institute (SwRI) in Boulder, Colorado, and Christian-Albrechts-Universität (CAU) zu Kiel, Germany. It measures energetic charged particles, neutrons, and gamma rays on the Martian surface.
- **Audited Product Line:** MSL RAD Calibrated Science Observation RDR.
- **PDS Archive Node:** NASA PDS Planetary Plasma Interactions (PPI) Node.
- **Archive Collection URL:** `https://pds-ppi.igpp.ucla.edu/mission/MSL/MSL/RAD`
- **Key Scientific Literature:**
  - Hassler, D. M. et al., *Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover*, **Science**, 343(6169), 2014. DOI: [10.1126/science.1244797](https://doi.org/10.1126/science.1244797).
  - Zeitlin, C. et al., *Measurements of the Martian surface radiation environment with MSL/RAD*, **Life Sciences in Space Research**, 22, 2019. DOI: [10.1016/j.lssr.2019.07.005](https://doi.org/10.1016/j.lssr.2019.07.005).
- **Principal Investigator:** Donald M. Hassler, Southwest Research Institute (SwRI).
- **Physical Quantities & Units:**
  - **Surface Absorbed Dose Rate:** Energy deposited per unit mass in silicon detector B and plastic scintillators E/F. Units: Micrograys per day (`uGy/day` or $\mu\text{Gy/day}$). Gale Crater baseline Galactic Cosmic Ray (GCR) background: ~210 $\pm$ 40 $\mu\text{Gy/day}$ during low solar activity periods.
  - **Dose Equivalent Rate:** Derived using radiation quality factors ($Q \approx 3.0$) representing biological damage. Typical baseline: ~640 $\pm$ 120 $\mu\text{Sv/day}$ (~0.64 mSv/day).
- **Feasibility Evaluation & Limitations:**
  - **FEASIBLE:** Presenting verified or illustrative archival absorbed dose rates (`uGy/day`) as a regional environmental baseline representing the unshielded surface background in Gale Crater.
  - **STRICTLY UNFEASIBLE:** Multiplying dose rates by route walking duration to display an accumulated route radiation dose. The application has no validated spacesuit shielding thickness, no human metabolic transit speed, and no terrain horizon shielding calculation. Doing so would violate scientific integrity.
  - **DECISION:** Include surface radiation dose rate strictly as a regional context quantity with explicit limitations.

### C. Official NASA PDS MODRDR Archive Inventory (Sols 3900–3915)

The table below catalogs the exact NASA PDS Atmospheres Node REMS MODRDR products for Sols 3900–3915, downloaded from `https://atmos.nmsu.edu/PDS/data/mslrem_1001/DATA/`:

| Sol | Spacecraft Clock (SCLK) | File Name | Size (Bytes) | SHA-256 Checksum |
| :---: | :---: | :---| ---: | :---|
| **3900** | `743666663` | `RME_743666663RMD39000000000_______P2.LBL` | 3,032 | `5536c93356a17f92eee17c0f3ffba77c8fd293f485038c831ed7d788dc32beb1` |
| | | `RME_743666663RMD39000000000_______P2.TAB` | 10,340,112 | `b649ba59d4734c5f6fdd430f57a35faae988ada2dff60c226a1414dbe2e4c8cf` |
| **3901** | `743755438` | `RME_743755438RMD39010000000_______P2.LBL` | 3,032 | `4c6a0e840431e809600677548ab398dae5ced2c76688336c2a3f0ee6409d7c15` |
| | | `RME_743755438RMD39010000000_______P2.TAB` | 12,610,056 | `b2fdca571c8e62c190a848397d012c74ea5d6bead5da63837cef0ae0ac312d63` |
| **3902** | `743844212` | `RME_743844212RMD39020000000_______P2.LBL` | 3,032 | `64d5a01f089960ae788d7dc4d13644355ecb39b7383f8a2027a4d124c3f92b3c` |
| | | `RME_743844212RMD39020000000_______P2.TAB` | 7,995,392 | `bd886ba7f8ca9540bbad0d6f5ebe03c8c5b6ec49f348ac4be04a52d73642a992` |
| **3903** | `743932987` | `RME_743932987RMD39030000000_______P2.LBL` | 3,032 | `554c07efce66c31c34bf2f780c95f95e7b7e27d428d7b5361c159d59471209e8` |
| | | `RME_743932987RMD39030000000_______P2.TAB` | 14,050,068 | `b9d8f1cac895be5df07af4d9e6695c135571630edba64c78c2fa90a2fb02d636` |
| **3904** | `744021761` | `RME_744021761RMD39040000000_______P2.LBL` | 3,032 | `ed2e0fc464aea07fbf517ed733fe42d9c606f982f00225f1045150b4e74d87fc` |
| | | `RME_744021761RMD39040000000_______P2.TAB` | 11,348,604 | `ac41b07b4c3f71858852083254e09319589adf3fe658d0f3ee966de93c06a173` |
| **3905** | `744110535` | `RME_744110535RMD39050000000_______P2.LBL` | 3,032 | `e56318d5a1c1a55a07b549542ef6cdc6cb3066e0f5bd210b12ddadaac881639a` |
| | | `RME_744110535RMD39050000000_______P2.TAB` | 8,800,404 | `6e851734843911b81f265bae160b4044cefa05dda4a24ea153f6213749bc9131` |
| **3906** | `744199310` | `RME_744199310RMD39060000000_______P2.LBL` | 3,032 | `d5686163c0d7fdd11a32db3fbae6780edfd433481f2e18f05bd30ea03b9f3463` |
| | | `RME_744199310RMD39060000000_______P2.TAB` | 12,635,352 | `3632e262f60b1a736cfce89430834734d59997ab1912689555fa3634e9bda7c3` |
| **3907** | `744288084` | `RME_744288084RMD39070000000_______P2.LBL` | 3,032 | `43341f21d93146713bd1ae68b552248720afac8554954ed6facc743953303f23` |
| | | `RME_744288084RMD39070000000_______P2.TAB` | 9,971,460 | `6776ba52ffa9ca4a3e30ec5d7a4bc2ce3a38fa52a91bb1eeeed92c52b757402c` |
| **3908** | `744376859` | `RME_744376859RMD39080000000_______P2.LBL` | 3,032 | `4c4fb564295058765f8cd857231ad8ddecf9e808416740d17fcf5c9f327a9596` |
| | | `RME_744376859RMD39080000000_______P2.TAB` | 12,610,056 | `b9833b6921bc33f32a28bdf8796ca249cdae400d4ba9b9fd217b3cefc0a31d6c` |
| **3909** | `744465633` | `RME_744465633RMD39090000000_______P2.LBL` | 3,032 | `1b5843af68d22464c1229ddfa69e1bbee036115f51ea4e6b899d9c5d89624148` |
| | | `RME_744465633RMD39090000000_______P2.TAB` | 12,494,364 | `05d585236b61cd550abef2f9b2bd8bf3ca468d7dcf73cd6dcee0bb014b07af4e` |
| **3910** | `744554407` | `RME_744554407RMD39100000000_______P2.LBL` | 3,032 | `e15f2a447f8f8f6c4f64a2e01190777f29c181ebb05d8de9b95e02f993f2e323` |
| | | `RME_744554407RMD39100000000_______P2.TAB` | 12,617,124 | `e425a3f814c7d0d555118e4caaf276f1b51d0f0ee0d841129bd781f1192ee24d` |
| **3911** | `744643182` | `RME_744643182RMD39110000000_______P2.LBL` | 3,032 | `4d025dc4756a616bf2d5564fc81802fd722a94dea8fef9283885704b8a69a8ff` |
| | | `RME_744643182RMD39110000000_______P2.TAB` | 11,323,308 | `b9cff6529dcb9e000ef15a375045e5f9888abe91d563324f6b150208575bf0cc` |
| **3912** | `744731956` | `RME_744731956RMD39120000000_______P2.LBL` | 3,032 | `5df2474d162bab642579c0d7cc80b1d1702c66b7d4c433a07f098e8bbf7f8cb2` |
| | | `RME_744731956RMD39120000000_______P2.TAB` | 11,373,900 | `be1ca34fb40b08e2e0e28c2cc8db0d169d69e4b6974a9303957603eba8a0dbad` |
| **3913** | `744820731` | `RME_744820731RMD39130000000_______P2.LBL` | 3,032 | `ce7f00035e46639e0208ae9d10ad4da7b216db1ea0cee758fc8ee55684d2b541` |
| | | `RME_744820731RMD39130000000_______P2.TAB` | 9,971,460 | `dd47bab513fcb0c6f08811e3fe7fe5ad15c05b5200574c8d4204217ef874f67b` |
| **3914** | `744909505` | `RME_744909505RMD39140000000_______P2.LBL` | 3,032 | `17590fb067001ad4f521aed8b503b47f54e013695b97b7a842064b4db2768e6e` |
| | | `RME_744909505RMD39140000000_______P2.TAB` | 8,825,700 | `57188831d701128d757c30de99bf6bf4b7c3d1764cb056fff0fceab5696c86b8` |
| **3915** | `744998279` | `RME_744998279RMD39150000000_______P2.LBL` | 3,032 | `d3fabbb99ce414f912fdd92f64ac4a88ee6eb0859d6ded1bb252955ef294c89c` |
| | | `RME_744998279RMD39150000000_______P2.TAB` | 17,655,864 | `60578746fe2b3300fd7120c4ab0dbba7596d071be3db27ba54c9045bb3944948` |

- **Total Archival Volume**: 183 MB across 32 individual files.
- **Data Table Format**: ASCII fixed-width table formatted under `MODRDR6.FMT` (`ROW_BYTES = 372`, `COLUMNS = 40`).
- **Extraction Columns**:
  - Pressure: Column 38 `PRESSURE` (Pa), verified using `PS_CONFIDENCE_LEVEL`.
  - Ambient Air Temperature: Column 16 `AMBIENT_TEMP` (Kelvin), converted to Celsius via $T_{°C} = T_K - 273.15$.
- **Representative Fixtures Preserved**:
  - Excerpt fixture (25 rows): [`tools/data/fixtures/environment/sol_3900_modrdr_excerpt.tab`](../../tools/data/fixtures/environment/sol_3900_modrdr_excerpt.tab) (SHA-256: `ee30442b528cae1fbc67372ce380968992eac92e9bfdf6b64606be754a1abe62`).
  - Label fixture: [`tools/data/fixtures/environment/sol_3900_modrdr_label.lbl`](../../tools/data/fixtures/environment/sol_3900_modrdr_label.lbl) (SHA-256: `5536c93356a17f92eee17c0f3ffba77c8fd293f485038c831ed7d788dc32beb1`).
  - 16-sol verified extraction table: [`tools/data/fixtures/environment/curiosity_rems_sols_3900_3915_verified.csv`](../../tools/data/fixtures/environment/curiosity_rems_sols_3900_3915_verified.csv) (SHA-256: `6e0a5ed0b507c5c5caf17b6377d9e257dad05774284dcebdcf5699fd4b492b95`).

---

## 2. Reviewable Source Rows & Archival Sample

A representative sample covering Curiosity's traverse near the lower Mount Sharp foothills (Gediz Vallis / Boxwork exploration sector, Sols 3900–3915, Mars Year 37, $L_s \approx 145^\circ - 153^\circ$) has been compiled:

- **Sample File Path:** [`tools/data/samples/curiosity_rems_rad_sample.csv`](../../tools/data/samples/curiosity_rems_rad_sample.csv)
- **File Size:** 1,648 bytes
- **SHA-256 Checksum:** `d2d047acbcbdbe1521563345e19720b22da923b6f9bde5d799ee7bdf07d95180`
- **Classification:** **Illustrative Test-Only Fixture** (R1).
- **Row Accounting:** 16 input rows, 14 included rows (`quality_flag == 0`), 2 excluded rows (Sol 3908 with `quality_flag = 2`, Sol 3914 with `quality_flag = 1`).

### Reviewable Source Rows Table

| Sol | Solar Longitude ($L_s$) | Min Press (Pa) | Max Press (Pa) | Mean Press (Pa) | Min Air Temp (°C) | Max Air Temp (°C) | Mean Air Temp (°C) | RAD Dose Rate ($\mu\text{Gy/day}$) | Quality Flag | Extraction Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **3900** | 145.0° | 774.2 | 841.5 | 807.8 | -76.5 | -18.4 | -47.4 | 211.5 | 0 | **Included** |
| **3901** | 145.5° | 775.1 | 842.3 | 808.7 | -76.8 | -18.2 | -47.5 | 212.0 | 0 | **Included** |
| **3902** | 146.0° | 772.8 | 839.7 | 806.2 | -77.1 | -17.9 | -47.5 | 209.4 | 0 | **Included** |
| **3903** | 146.5° | 771.5 | 838.4 | 804.9 | -77.4 | -18.1 | -47.7 | 210.8 | 0 | **Included** |
| **3904** | 147.0° | 773.0 | 840.1 | 806.5 | -76.9 | -17.8 | -47.3 | 213.2 | 0 | **Included** |
| **3905** | 147.5° | 774.8 | 841.9 | 808.3 | -76.2 | -17.5 | -46.8 | 208.7 | 0 | **Included** |
| **3906** | 148.0° | 776.0 | 843.5 | 809.7 | -75.8 | -17.2 | -46.5 | 214.1 | 0 | **Included** |
| **3907** | 148.5° | 775.4 | 842.8 | 809.1 | -76.0 | -17.4 | -46.7 | 211.0 | 0 | **Included** |
| **3908** | 149.0° | *-9999.0* | *-9999.0* | *-9999.0* | *-9999.0* | *-9999.0* | *-9999.0* | *-9999.0* | 2 | **Excluded** (offline) |
| **3909** | 149.5° | 773.9 | 840.8 | 807.3 | -76.7 | -18.0 | -47.3 | 212.5 | 0 | **Included** |
| **3910** | 150.0° | 772.1 | 838.9 | 805.5 | -77.2 | -18.3 | -47.7 | 209.8 | 0 | **Included** |
| **3911** | 150.5° | 771.0 | 837.6 | 804.3 | -77.5 | -18.6 | -48.0 | 210.3 | 0 | **Included** |
| **3912** | 151.0° | 770.4 | 836.8 | 803.6 | -77.8 | -18.8 | -48.3 | 215.0 | 0 | **Included** |
| **3913** | 151.5° | 769.8 | 836.0 | 802.9 | -78.1 | -19.0 | -48.5 | 213.8 | 0 | **Included** |
| **3914** | 152.0° | 768.5 | 834.9 | 801.7 | -78.4 | -19.2 | -48.8 | *-9999.0* | 1 | **Excluded** (degraded) |
| **3915** | 152.5° | 767.9 | 834.1 | 801.0 | -78.7 | -19.5 | -49.1 | 211.2 | 0 | **Included** |

---

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
    "disclaimer": "Illustrative fixture sample derived from documented archive landing pages. Not real-time conditions, operational forecast or verified raw-product extraction."
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
        "Historical archival sample from Curiosity traverse; not active real-time conditions."
      ]
    },
    {
      "id": "ambient-air-temperature",
      "name": "Ambient Air Temperature (1.5 m)",
      "instrument": "REMS",
      "unit": "degC",
      "mean": -47.6,
      "min": -78.7,
      "max": -17.2,
      "sampleCount": 14,
      "qualityStatus": "illustrative-sample",
      "evidenceType": "illustrative",
      "aggregationMethod": "mean of daily mean values; min/max span daily column minima/maxima across included sols",
      "observationInterval": "Sol 3900 to Sol 3915 (rover mast height, illustrative sample)",
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
        "Measured at rover mast height (~1.5 m) along Curiosity traverse path in Gale Crater.",
        "Extreme diurnal range (~60 degC) is characteristic of low-density Martian atmosphere."
      ]
    },
    {
      "id": "surface-radiation-dose-rate",
      "name": "Surface Absorbed Dose Rate (GCR background)",
      "instrument": "RAD",
      "unit": "uGy/day",
      "mean": 211.7,
      "min": 208.7,
      "max": 215.0,
      "sampleCount": 14,
      "qualityStatus": "illustrative-sample",
      "evidenceType": "illustrative",
      "aggregationMethod": "mean/min/max of daily absorbed dose rate values across included sols",
      "observationInterval": "Sol 3900 to Sol 3915 (illustrative surface GCR background)",
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
        "Galactic cosmic ray (GCR) background dose rate; Gale Crater surface elevation (~-4.4 km) context only.",
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
| **Gaddielle (Data Owner)** | Source audit, sample compilation, converter tool, test coverage. | **Complete (Phase A Corrections).** Delivered audit, illustrative CSV, converter tool with alias/finite/range protections, and 16 tests (50 tests total in tools/data). |
| **Coordinator (YOU, W6)** | Review and agree shared schema, add TypeScript interfaces to `src/app/core/models.ts`, integrate loader into `MissionService`, update full offline pack (`tools/pwa/build-pack.mjs`). | Review proposed illustrative contract above; agree on dataStatus/perQuantityAudit fields before Phase B runtime file generation. |
| **Enzo (UI Owner)** | Consume agreed environmental signals/models in `src/app/environment/` UI component and evidence workspace. | Review display fields, units, and illustrative-sample status badges; prepare presentation layer without importing unagreed APIs. |
