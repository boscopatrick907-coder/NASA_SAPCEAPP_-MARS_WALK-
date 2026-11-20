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

The proxy was not bypassed and TLS checks were not disabled. **Next:** Gaddielle follows the runbook §3 local-download fallback from a normal browser: open the catalogue page, follow the provider's own links, download the small label first, record the final URL and time here, then compute size and SHA-256. Alternatively Patrick allows these hosts for the cloud environment.
