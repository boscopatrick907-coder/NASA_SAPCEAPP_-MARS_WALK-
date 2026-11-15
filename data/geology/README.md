# MARSWALK — Geological Data Specification & Boxwork Formation Context

> **Target Region:** Mount Sharp (Aeolis Mons) Boxwork Ridges & Hollows, Gale Crater, Mars  
> **Regional Coordinates:** -4.83°N to -4.85°N, 137.28°E to 137.32°E  
> **Component:** Gaddielle (Data Engineering & Planetary Science Specialist, [W2](../../docs/team/GADDIELLE.md))  

---

## 1. Regional Geological Framework & Stratigraphy

The Mount Sharp boxwork formations lie within the layered sedimentary sequence of Aeolis Mons inside Gale Crater. The established stratigraphic context (Anderson & Bell 2010; Grotzinger et al. 2014; NASA MSL Science Team) consists of:

1. **Bradbury Group (Crater Floor):** Fluvial-lacustrine sandstones and conglomerates deposited in ancient stream and delta systems.
2. **Mount Sharp Group (Basal Sediments):**
   * *Murray Formation:* Finely laminated mudstones representing ancient, long-lived lake environments.
   * *Glen Torridon (Clay-Bearing Unit):** Smectite clay-rich strata reflecting neutral-pH, habitable aqueous deposition.
   * *Vera Rubin Ridge:* Hematite-bearing erosion-resistant ridge formed by diagenetic fluid flow.
3. **Layered Sulfate-Bearing Unit:** Transition into magnesium- and calcium-sulfate-rich strata, recording global Martian drying and increasing aridity during the Hesperian-Amazonian transition.
4. **Boxwork Fracture Network (Diagenetic Mineralization):** Extensive intersecting ridge networks cutting across bedrock units on the lower slopes of Mount Sharp.

---

## 2. Geological Nature of Boxwork Formations

* **Morphology:** Intersecting polygonal ridges standing approximately 1 to 2 meters above intervening hollows, spanning continuous networks 10 to 20 kilometers across the lower mountain slope.
* **Formation Mechanism:**
  * Post-depositional tectonic or compaction fracturing created deep subterranean joints in the host rock.
  * Ancient mineralizing groundwater circulated through the fractures during late-stage aqueous activity, precipitating hard, erosion-resistant cements (principally sulfates and silica).
  * Billions of years of subsequent wind erosion (aeolian deflation) stripped away the softer, unmineralized bedrock, leaving the cemented fracture walls standing in relief as a prominent boxwork grid.
* **Scientific Significance:** Represents one of the youngest recorded subsurface groundwater circulation systems in Gale Crater, establishing habitable subterranean conditions long after surface lakes vanished.

---

## 3. Curiosity In-Situ Geological Observations (Ground Truth)

During late 2025 and early 2026, NASA's Curiosity rover directly climbed and sampled the boxwork terrain:

| Target Name | Sol / Date | Instrument Suite | Observation & Physical Nature | Evidence Type |
| :--- | :--- | :--- | :--- | :--- |
| **Nevado Sajama** | Sol 4718 (2025-11-13) | Drill, CheMin, SAM, MAHLI | Ridgetop bedrock drill sample; confirmed cemented, dense mineralized matrix. Smooth drill-hole walls imaged at night with MAHLI LEDs. | Measured / Ground Truth |
| **Valle de la Luna** | Sols 4725–4740 | APXS, ChemCam, MAHLI | Low-elevation hollow target between boxwork ridges; analyzed softer sedimentary floor rock to assess chemical contrast with ridges. | Measured / Ground Truth |
| **Nevado Sajama 2** | Sols 4803–4811 (2026-02-09) | Drill, SAM (TMAH wet chemistry), APXS | Re-drill of ridgetop target for organic molecule detection experiments. | Measured / Ground Truth |
| **Mollecita / Monte Cielo** | Sols 4804–4811 | APXS, MAHLI | Characterized bedrock blocks along boxwork ridges. | Measured / Ground Truth |

---

## 4. Authoritative Datasets & Mapped Literature

| Dataset / Publication | Source / Reference | Format | Coverage & Overlap | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Gale Crater Geologic Map** (Anderson & Bell 2010) | *The Mars Journal*, doi:10.1555/mars.2010.0004 | High-res raster / map figures | Regional crater-wide map (96-mile diameter). Covers Mount Sharp base, but does not provide vectorized GIS shapefiles for local meter-scale boxwork ridges. | **Available but Unprocessed** (Reference publication) |
| **HiRISE Stereo Observation `PSP_001752_1750`** | NASA PDS Imaging Node / Univ. of Arizona | PDS RDR / JP2 (0.25 m/px) | Direct high-resolution orbital mapping of the boxwork ridge network. | **Verified and Ready for Review** (Primary context) |
| **Curiosity Rover Traverse & Science Logs** | NASA Science Mission Updates (Sols 4718–4811) | Text / telemetry logs | Ground-truth in-situ drilling and spectral confirmation of boxwork diagenesis. | **Verified and Ready for Review** (Documented ground truth) |

---

## 5. Integration Boundaries & Guidelines

* **No Fictitious Vector Boundaries:** In accordance with MARSWALK scientific ethics, arbitrary polygonal shapefiles have not been fabricated for the runtime UI.
* **Separation of Evidence:**
  * *Measured Ground Truth:* Curiosity drilling and rover telemetry (discrete points at Nevado Sajama / Valle de la Luna).
  * *Orbital Morphology:* HiRISE visual and structural ridge tracings.
  * *Interpretations:* Subsurface groundwater mineralization vs present-day dryness (explicitly labeled as `interpreted`).
