# MARSWALK — Internal Presentation Outline (Flexible 7 Slides)

<!-- Updated per ENZO 2.md slice 1: added clarification of AI‑assisted explanation proposal and revision separation -->

> **Note:** The AI‑assisted science explanations are documented in `docs/qa/ENZO_2_RELEASE_STORY.md` as a proposal only. No runtime AI is added.


<!-- CURRENT_WORK_PLAN -->
> **Current work and status:** [canonical team plan](../TEAM_TASKS.md). Distinguish main capabilities, verified feature branches and pending assignments; preserve completed work.
<!-- /CURRENT_WORK_PLAN -->

Original author: Emma (he/him). Enzo now maintains remaining presentation, demo, and release-story documentation following the user's assignment swap; original authorship and credit are retained. These seven slides and the demonstration scripts ([DEMO_SCRIPT.md](DEMO_SCRIPT.md)) are internal team choices, not verified official competition constraints.

> [!IMPORTANT]
> **Revision Separation for Presenters:**
> - **Public Live Deployment:** [https://marswalk-jet.vercel.app/](https://marswalk-jet.vercel.app/) serves commit **`b6669fb`** (pack `95d8b5f6ee7aba0a38e8e7758ada62be20a3f0ca61efd04adce0fc4cabb7a827`). When presenting the public live host, cite commit **`b6669fb`**.
> - **Repository Main:** Main commit is currently ahead of production (baseline `f6567ca` with 144 Angular / 11 worker / 33 data tests, advancing to `7896e8b` with 193 Angular / 11 worker tests and 52 data tests). Main is not automatically deployed. Do not cite main commit numbers when presenting the live public URL.
> - **Verification Evidence:** HTTP 200 responses on build inventories prove asset reachability, not client cache readiness or offline process restart.

---

## Slide Outline

| Slide | Message and evidence | Actual stage / remaining artifact |
| --- | --- | --- |
| 1 — User and purpose | Planetary-science learning, analogue exploration rehearsal, and human reasoning under incomplete evidence; [SOUL.MD](../SOUL.MD) | Target users: students, educators, and analogue exploration teams. Not operational astronaut navigation or rover teleoperation. |
| 2 — The real data boundary | Gale Crater / Mount Sharp HiRISE regional image (`PIA26306`) and three primary Curiosity mission records; no verified metric scale, geodetic tie-points, or DEM | Contextual image and records active. Exact AOI-scale geological map and terrain elevation remain unavailable; [science audit](SCIENCE_EVIDENCE.md) |
| 3 — What we contribute | A bounded exploration planning workflow, portable notes/routes, and transparent provenance/uncertainty | Does not claim Mars Trek/JMARS lacks capabilities; provides a focused educational rehearsal tool with portable JSON export; [references](REFERENCES.md) |
| 4 — Show the current app | Single image map (Leaflet `CRS.Simple`), layer controls, contextual science filters, exploration confidence panel, and data passport | Live on Vercel at `b6669fb` ([VERCEL_PRODUCTION.md](qa/VERCEL_PRODUCTION.md)); integrated in main baseline `f6567ca` ([CONTINUITY_BASELINE.md](qa/CONTINUITY_BASELINE.md)). Initial bundle: 433.80 kB (Leaflet CommonJS warning remains). |
| 5 — Complete the mission workflow | Sketch route (start, intermediate waypoints, destination), save/load route, field note entry with draft retention, versioned mission JSON export | Enzo shell, planner, and notebook integrated with Emma panels. Explicit "Load Route" action required to restore saved mission state from local storage. |
| 6 — Optional 3D rehearsal | Integrated opt-in lazy flat viewer (Three.js); explicitly presents no measured terrain elevation or immersive VR; WebGL resources released on exit | Browser WebGL checks pass; physical hardware frame rates and mobile browser validation remain under device QA. |
| 7 — Offline PWA & release gates | Service worker caching, full pack verification, offline restart checks, and update notifications | Service worker and full pack verification active in build. Physical standalone installation, outside-user sessions, and official challenge rules remain pending; [acceptance](qa/PWA_ACCEPTANCE.md), [usability](USABILITY.md). |

---

## Speaker Guidance

1. **Cite the Active Served Revision:** When demonstrating `https://marswalk-jet.vercel.app/`, state that the public host serves build `b6669fb`. If demonstrating a local production build, state the exact local commit and its specific test scope.
2. **Explicit Data Limits:** Explain why Curiosity science records remain readable without fabricated map pins (`position: null`). Distinguish verified observations, derived geological interpretations, and user-sketched routes.
3. **No False Safety Metrics:** State clearly that distance is unavailable without verified calibration, and that neither flat imagery nor the 2D viewer supplies slope, elevation, or rover trafficability certification ("Visual Review Only").
4. **Resilient Field Workflow:** Demonstrate note taking and highlight that typed drafts are preserved in the editor even if browser storage fails. Show explicit save, mission export, and explicit "Load Route" upon reopening.
5. **Honest Limitations:** Keep NASA/JPL/USGS provenance visible. Acknowledge that physical device standalone testing, outside-user usability sessions, and official Space Apps submission confirmation are pending.

---

## Pending Evidence to Capture

- Capture fresh high-resolution screenshots from an actually served build (recording commit, URL, browser, and viewport) once the next candidate is deployed.
- Reconcile physical mobile device observations (W5 / Royce report on note recovery after process restart).
- Record actual anonymized outcomes from the three outside-user sessions in [docs/USABILITY.md](USABILITY.md) once arranged by the coordinator.
- Confirm official competition submission URL, form fields, and exact deadline with the coordinator.
