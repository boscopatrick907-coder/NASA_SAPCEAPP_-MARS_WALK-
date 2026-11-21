# Terrain V2 — retrieval log

Each attempt: UTC time, exact URL, HTTP outcome, saved filename. No HTML error page is ever hashed and recorded as a raster. Filenames are never constructed from a naming guess.

| UTC | URL | Outcome | Saved as | By |
|---|---|---|---|---|
| 2026-11-20 (~15:5x) | https://www.uahirise.org/dtm/PSP_001488_1750 | Blocked before reaching the host: cloud proxy `CONNECT tunnel failed, response 403` | — | coordinator agent |
| 2026-11-20T16:26:32Z | https://www.uahirise.org/dtm/PSP_001488_1750 | Same proxy 403 | — | coordinator agent |
| 2026-11-20T16:26:32Z | https://hirise-pds.lpl.arizona.edu/PDS/DTM/ | Same proxy 403 | — | coordinator agent |
| 2026-11-20T16:26:32Z | https://hirise-pds.lpl.arizona.edu/download/PDS/DTM/ | Same proxy 403 | — | coordinator agent |
| 2026-11-20T16:26:32Z | https://pds-geosciences.wustl.edu/ | Same proxy 403 | — | coordinator agent |
| 2026-11-20T16:26:32Z | https://astrogeology.usgs.gov/search | Same proxy 403 | — | coordinator agent |
| 2026-11-20T16:26:32Z | https://pds-imaging.jpl.nasa.gov/ | Same proxy 403 | — | coordinator agent |
| 2026-11-20 | — | Coordinator approved adding `www.uahirise.org` and `hirise-pds.lpl.arizona.edu` to the cloud environment's network allowlist | — | coordinator |
| 2026-11-20T18:57:26Z | https://www.uahirise.org/dtm/PSP_001488_1750 | 200, catalogue HTML (19 123 B). Links followed from this page only | — | coordinator agent |
| 2026-11-20T18:57:42Z | https://www.uahirise.org/PDS/DTM/PSP/ORB_001400_001499/PSP_001488_1750_PSP_001752_1750/ | 200, directory listing | — | coordinator agent |
| 2026-11-20T18:57:42Z | …/DTEEC_001488_1750_001752_1750_U02.IMG (Range 0–65535) | 206, PDS3 label read first | metadata/DTEEC_…_U02.label.txt | coordinator agent |
| 2026-11-20T18:58Z | …/DTEEC_001488_1750_001752_1750_U02.IMG | 200, 360 402 944 B (matches listing) | not in Git; hash in files.json | coordinator agent |
| 2026-11-20T18:58Z | https://www.uahirise.org/PDS/EXTRAS/DTM/…/README.TXT | 200, 1 427 B | metadata/EXTRAS_README.TXT | coordinator agent |
| 2026-11-20T18:59:26Z | …/PSP_001752_1750_RED_C_01_ORTHO.LBL and .JP2 | 200, 5 341 B / 33 256 997 B | metadata/…RED_C…LBL; JP2 not in Git | coordinator agent |
| 2026-11-20T19:02:43Z–19:03Z | …/PSP_001752_1750_RED_A_01_ORTHO.LBL and .JP2 | 200, 5 335 B / 371 396 220 B | metadata/…RED_A…LBL; JP2 not in Git | coordinator agent |
| 2026-11-21T03:09:04Z | …/PSP_001488_1750_RED_C_01_ORTHO.LBL and .JP2 | 200, 5 341 B / 34 577 732 B | metadata/…1488…LBL; JP2 not in Git | coordinator agent (R1b) |

The proxy was not bypassed and TLS checks were not disabled. Retrieval is complete for candidate 1 and both orthoimages. `…` stands for `https://www.uahirise.org/PDS/DTM/PSP/ORB_001400_001499/PSP_001488_1750_PSP_001752_1750`.
