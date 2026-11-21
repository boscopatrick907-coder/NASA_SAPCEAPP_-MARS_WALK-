# Geology sources for the study area (21 Nov 2026)

Study area: 2048² HiRISE orthoimage crop centred near 4.842°S, 137.297°E, lower Mount Sharp, Gale crater.

## In the app now

| Layer | Source | Resolution | How it's used |
|---|---|---|---|
| Local landforms | Accepted HiRISE DTM `DTEEC_001488_1750_001752_1750_U02` | 1 m | Shaded relief and slope-class map layers; cursor elevation/slope/aspect; route profile; landform statistics (relief, slope classes, dominant facing). Shape, not rock type. |
| Regional unit | USGS SIM 3292, Geologic Map of Mars (Tanaka et al., 2014), [doi:10.3133/sim3292](https://doi.org/10.3133/sim3292) | 1:20,000,000 (5 km vertices) | Context card: unit `Htu` (Hesperian transition undivided); nearest contact about 5.8 km north-west. **Not drawn on the map**: the crop is a tenth of one vertex interval. Evidence: [evaluation](../USGS_SIM3292_GEOLOGY_EVALUATION.md). |
| CRISM mineralogy | MRO CRISM MTRDR summary parameters, FRT0001BBA1 (2010-11-06) and FRT0001CA91 (2010-12-31), PDS Geosciences Node | 18 m pixels; mapped at 162 m | Each observation registered locally to the HiRISE orthoimage (shifts about −192/+57 m and −219/+64 m, NCC 0.85–0.91, stable within 3 m across window sizes). Only the hydrated-sulfate index (SINDEX2) reproduces between the two observations at a mappable scale (r = 0.62 at 162 m), so only it is drawn. Area results: sulfate absorption above the noise floor in both; no Fe/Mg-clay or crystalline-hematite absorption; H2O and Al-OH indistinguishable from noise. Built by `tools/mineralogy/prepare_mineral_layers.py`; full record in `public/data/mineralogy/mineralogy.json`. |
| Science records | Curiosity mission updates (three records) | — | Regional context. Positions on this crop are **unverified**, so they're shown as unlocated. |

## Researched, not yet integrated

| Candidate | What it adds | Status / next step |
|---|---|---|
| Published CRISM unit interpretations: [Fraeman et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5101845), [Fraeman et al. 2013](https://authors.library.caltech.edu/records/05bm4-2ke51), Rice et al. 2015 ([AGU abstract](https://ui.adsabs.harvard.edu/abs/2015AGUFM.P43D2144R)) | Clay, sulfate and hematite units, the mineral story behind our science records | Our own CRISM layer is now in the app (above). These papers remain the reference for unit-level interpretation; full-spectrum confirmation of the sulfate signature (e.g. from the I/F cubes, downloaded but not yet analysed) is the next step. |
| 1:60,000 geologic map of western Aeolis Mons ([GSA 2023 abstract](https://gsa.confex.com/gsa/2023AM/webprogram/Paper394643.html)) | Intermediate-scale units | Reported as in preparation for USGS review. Publication not confirmed; check the USGS publications catalogue before using it. |
| Curiosity site coordinates (Vera Rubin Ridge, Glen Torridon, boxwork drill sites) | Real pins for the science records | No coordinates found in this search. Use the mission's published traverse/localization products, and only place a pin if the site falls inside the crop. |

## Rules kept

- Brightness and slope are never presented as rock type.
- Regional units are not drawn as local boundaries.
- Every value cites its source and resolution; anything unverified stays labelled as such.
