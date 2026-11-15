# MARSWALK — Geological Data Specification & Boxwork Formation Context

> **Target Region:** Mount Sharp (Aeolis Mons) Boxwork Ridges & Hollows, Gale Crater, Mars  
> **Regional Coordinates:** -4.83°N to -4.85°N, 137.28°E to 137.32°E  
> **Component:** Gaddielle (Data Engineering & Planetary Science Specialist, [W2](../../docs/team/GADDIELLE.md))  

---

## 1. Regional Geological Framework & Stratigraphy

The Mount Sharp boxwork formations lie within the layered sedimentary sequence of Aeolis Mons inside Gale Crater. The established stratigraphic context (Anderson & Bell 2010; Grotzinger et al. 2014, 2015; Siebach & Grotzinger 2014; NASA MSL Science Team) consists of:

1. **Bradbury Group (Crater Floor):** Fluvial-lacustrine sandstones and conglomerates deposited in ancient stream and delta systems (Yellowknife Bay, Peace Vallis fan).
2. **Mount Sharp Group (Basal Sediments):**
   * *Murray Formation:* Finely laminated mudstones representing ancient, long-lived lake environments.
   * *Glen Torridon (Clay-Bearing Unit):** Smectite clay-rich strata reflecting neutral-pH, habitable aqueous deposition.
   * *Vera Rubin Ridge:* Hematite-bearing erosion-resistant ridge formed by late-stage diagenetic fluid flow.
3. **Layered Sulfate-Bearing Unit:** Transition into magnesium- and calcium-sulfate-rich strata, recording global Martian drying and increasing aridity during the Hesperian-Amazonian transition.
4. **Boxwork Fracture Network (Diagenetic Mineralization):** Extensive intersecting ridge networks cutting across bedrock units on the lower slopes of Mount Sharp, situated ~1 km above the crater floor within the layered sulfate sequence.

---

## 2. Geological Nature of Boxwork Formations

* **Morphology:** Intersecting polygonal ridges standing approximately 1 to 2 meters above intervening hollows, spanning continuous networks 10 to 20 kilometers across the lower mountain slope.
* **Formation Mechanism (Siebach & Grotzinger 2014; NASA JPL 2024–2026):**
  * Post-depositional tectonic, structural, or compaction fracturing created deep subterranean joint systems in the host sedimentary bedrock.
  * Ancient mineralizing groundwater circulated through the fractures during late-stage aqueous activity, precipitating hard, erosion-resistant cements (principally sulfates, silica, and iron-bearing phases) along the joint margins (isopachous fracture halos).
  * Billions of years of subsequent wind erosion (aeolian deflation) stripped away the softer, unmineralized bedrock, leaving the cemented fracture walls standing in relief as a prominent boxwork grid.
* **Scientific Significance:** Represents one of the youngest recorded subsurface groundwater circulation systems in Gale Crater, establishing habitable subterranean conditions long after surface lakes vanished.

---

## 3. Curiosity In-Situ Geological Observations (Ground Truth Verification)

During late 2025 and early 2026, NASA's Curiosity rover directly traversed into and sampled the boxwork ridge corridor:

| Target Name | Sol / Date | Instrument Suite | Observation & Physical Nature | Geographic Scope & Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **Nevado Sajama** | Sol 4718 (2025-11-13) | Drill, CheMin, SAM, MAHLI | Ridgetop bedrock drill sample; confirmed cemented, dense mineralized matrix. Smooth drill-hole walls imaged at night with MAHLI LEDs. Sols 4714–4741 Mastcam 360° stereo mosaic. | Discrete drill point. Provides ground truth for ridge-forming cementation; **does not imply identical mineral chemistry across the entire 20 km regional network.** |
| **Valle de la Luna** | Sols 4725–4740 | APXS, ChemCam, MAHLI | Low-elevation hollow target between boxwork ridges; analyzed softer sedimentary floor rock to assess chemical and erosional contrast with ridges. | Discrete target within hollow. |
| **Nevado Sajama 2** | Sols 4803–4811 (2026-02-09) | Drill, SAM (TMAH wet chemistry), APXS | Re-drill of ridgetop target for specialized organic molecule detection experiments. | Discrete drill point. |
| **Mollecita / Monte Cielo** | Sols 4804–4811 | APXS, MAHLI | Characterized bedrock blocks along boxwork ridges. | Discrete contact targets. |

> [!IMPORTANT]
> **Scientific Integrity & Boundary Note:**
> Rover drilling at Nevado Sajama proves that the sampled ridge was cemented by groundwater mineral precipitation. It **must not** be extrapolated as proof that every ridge in the boxwork region shares identical mineralogy or mechanical strength. The rover's measurements are discrete ground-truth anchor points within a diverse regional formation.

---

## 4. Authoritative Datasets & Mapped Literature

| Dataset / Publication | Source / Reference | Format & CRS | Coverage & Overlap | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Siebach & Grotzinger (2014) Boxwork Study** | *J. Geophys. Res. Planets*, 119(1), 189–198, doi:10.1002/2013JE004508 | Peer-reviewed orbital mapping & volumetric estimates | Direct focus on Mount Sharp boxwork based on HiRISE `PSP_001752_1750` | **Verified Scientific Foundation** |
| **Gale Crater Geologic Map** (Anderson & Bell 2010) | *The Mars Journal*, 5, 76–128, doi:10.1555/mars.2010.0004 | High-res raster / map figures | Regional crater-wide map (96-mile diameter). Covers Mount Sharp base, but does not provide vectorized GIS shapefiles for local meter-scale boxwork ridges. | **Available but Unprocessed** (Regional reference) |
| **USGS Mars MSL Gale Merged DEM 1m** (Parker & Calef 2016) | USGS Astrogeology Astropedia | GeoTIFF / DEM (1 m/px), Equirectangular clat=-4.5° | Regional MSL Gale Crater mosaic | **Authoritative Regional Alternative** |
| **HiRISE Stereo Observation `PSP_001752_1750`** | NASA PDS Imaging Node / Univ. of Arizona | PDS RDR / JP2 (0.25 m/px) | Direct high-resolution orbital mapping of the boxwork ridge network. | **Verified and Ready for Review** (Primary context) |
| **Curiosity Rover Traverse & Science Logs** | NASA Science Mission Updates (Sols 4718–4811) | Text / telemetry logs | Ground-truth in-situ drilling and spectral confirmation of boxwork diagenesis. | **Verified Ground Truth** |

---

## 5. Integration Boundaries & Guidelines

* **No Fictitious Vector Boundaries:** In accordance with MARSWALK scientific ethics, arbitrary polygonal shapefiles have not been fabricated for the runtime UI. Mapped contacts in published literature (Anderson & Bell 2010; Siebach & Grotzinger 2014) are regional morphological classifications, not GIS vector polygons designed for sub-meter pathfinding.
* **Separation of Evidence:**
  * *Measured Ground Truth:* Curiosity drilling and rover telemetry (discrete points at Nevado Sajama / Valle de la Luna).
  * *Orbital Morphology:* HiRISE visual and structural ridge tracings.
  * *Interpretations:* Subsurface groundwater mineralization vs present-day dryness (explicitly labeled as `interpreted`).
