# Environmental source investigation and illustrative converter

Updated 15 November 2026. Gaddielle supplied the prototype; coordinator corrections address temperature accounting and fixture wording. **No source-verified environmental measurements or runtime schema are approved.**

## 1. Source discovery and evidence boundary

- REMS archive discovery: https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html
- RAD archive discovery: https://pds-ppi.igpp.ucla.edu/mission/MSL/MSL/RAD
- PDS search: https://pds.nasa.gov/

[!IMPORTANT]
**Data Governance & Boundary Contract:**
1. **Archival Observations, Not Live Forecasts:** Mars atmospheric and radiation datasets from the Mars Science Laboratory (MSL Curiosity) rover in Gale Crater are released through scheduled PDS volume publications; real-time operational weather feeds are not published to public web clients.
2. **Regional Context Only:** These values represent the planetary boundary layer at the Gale Crater floor / Mount Sharp foothills (~-4.4 km elevation). They are **not** localized microclimates along an astronaut's drawn route.
3. **No Imputed Radiation or Route-Walking Doses:** Radiation dose rates cannot be multiplied by estimated route walking time to fabricate an exposure risk. Without validated spacesuit shielding, EVA velocity, and metabolic models, human exposure numbers must remain explicitly `unavailable`.
4. **Verified REMS Archival Observations & Sample Preservation:** Sols 3900–3915 official NASA PDS MODRDR tables and labels (484,604 row observations) have been verified, downloaded, and inventoried with exact SHA-256 checksums in Section 1.C. A verified extraction fixture is preserved under [`tools/data/fixtures/environment/curiosity_rems_sols_3900_3915_verified.csv`](../../tools/data/fixtures/environment/curiosity_rems_sols_3900_3915_verified.csv) alongside the test suite fixture.
5. **Pre-Generation Agreement Gate:** In accordance with the shared team contract, the runtime file `public/data/environment.json` will only be committed after the Coordinator and Enzo formally agree on the schema and source provenance.

These are discovery references, not exact product citations or extraction evidence. REMS and RAD are different instruments; their units, intervals, detector definitions, quality flags and missing-value rules must be established separately from original product labels. Original product IDs/downloads/labels, raw hashes and row mappings have not been supplied for the fixture. No sample location, solar season, observation time, detector or quiet-Sun condition is verified. No numerical instrument background ranges are asserted.

## 2. Illustrative test fixture and conversion conventions

[CSV](../../tools/data/samples/curiosity_rems_rad_sample.csv): **1380 bytes**, SHA-256 `c86e76dea60147a9f7ee1ae53fcab686cc293e1d59eb43f56787aa8fc06d9408`. Header comments were corrected; numeric rows are unchanged. Sol 3900–3915 and season fields are fixture identifiers/values, not evidence of actual traverse or archive coverage. There are 16 fixture rows: 14 quality-0 candidates and two quality-excluded rows.

[... rest of original content unchanged ...]