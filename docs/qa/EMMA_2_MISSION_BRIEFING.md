# EMMA 2 — Mission Briefing & Field Observation Guide QA & Integration Handoff

## 1. Branch & Commit
- **Branches**: `feature/emma-2-mission-briefing` and `feature/emma-mission-briefing` (merged cleanly with `origin/main` `a9ecc75`, preserving coordinator mount `b721269` and collapsed `<details>` / theme-token adjustments)
- **Owned Files**:
  - `src/app/mission-briefing/mission-briefing.component.ts`
  - `src/app/mission-briefing/mission-briefing.component.html`
  - `src/app/mission-briefing/mission-briefing.component.scss`
  - `src/app/mission-briefing/mission-briefing.component.spec.ts`
  - `docs/qa/EMMA_2_MISSION_BRIEFING.md`
- **Boundary Compliance**: Zero edits to `src/app/app.*`, `src/app/core/`, `src/app/ui/`, `src/app/map/`, `src/app/science/`, `src/app/evidence/`, `src/app/notebook/`, `public/data/`, or package dependencies.

## 2. Selector & Coordinator Mount Status
- **Component Class**: `MissionBriefingComponent` (standalone, `imports: []`)
- **Selector**: `<app-mission-briefing />`
- **Import Path**: `src/app/mission-briefing/mission-briefing.component`
- **Mount Status**: Already mounted once by coordinator in `ConfidencePanelComponent` (`b721269`). All three `<details class="briefing-disclosure">` sections default to collapsed so the map and confidence panels remain uncluttered on phone, tablet, and desktop layouts.

## 3. Source-Backed Copy, Checklist & Field Observation Guide
1. **Mission Question & Evidence**:
   - *"What evidence supports the interpretation that ancient groundwater helped form Mount Sharp's boxwork?"*
   - Displays active MRO / HiRISE image title, credit, `imageRef`, and validated HTTPS `source.url` from `mission.image()`, plus Curiosity / MSL contextual records from `mission.markers()`.
   - Keeps unlocated regional status (`positionStatus: unavailable`), missing metric scale/DEM/slope/weather/safety, and primary finding vs. interpretation boundaries explicit.
2. **Truthful Reactive Checklist**:
   - Computed over read-only signals (`startAndDestination`, `markerSelected` with active `imageRef` match check, `observationPresent`) with explicit disclaimer that structural presence does not imply saved, exported, recovered, offline-verified, or safe status.
3. **Field Observation Guide (Next Active Slice)**:
   - Native expandable `<details class="briefing-disclosure">` offering a deterministic plain-text template (`observationTemplate()`) with the five required headings:
     - `Mission question:`
     - `What I can see in this image:`
     - `What the selected source reports:`
     - `My interpretation/question:`
     - `What remains uncertain:`
   - Prefills only the active `imageRef` and valid selected record name/ID/HTTPS source URL (with fallback text if no selection, stale `imageRef`, missing image, or non-HTTPS URL), keeping all observation/interpretation sections as prompts without generating geological claims or implying a source record lies at a route point.
   - Provides an explicit `Copy observation template` button (`copyObservationTemplate()`) that writes to `navigator.clipboard.writeText()` only on user click, reports `copied` only after the promise resolves, provides actionable fallback guidance if clipboard is unavailable or permission is denied, and includes a read-only selectable `<textarea readonly>` fallback that works offline without clipboard permissions.

## 4. Verification & Build Results
- **Unit & Integration Tests (`npm test -- --watch=false`)**: **22 test files passed, 237 tests passed (`0` failures)**.
  - `src/app/mission-briefing/mission-briefing.component.spec.ts` (**8/8 passing**) covers mission question and MRO/Curiosity sources, partial vs. complete route transitions, marker selection/removal and stale `imageRef` guard, preexisting/imported observation disclaimer, `loading`/`error`/`unavailable`/empty states, `https:` URL sanitization, deterministic `observationTemplate()` generation across no-selection/selected/unsafe-URL/missing-image states, and clipboard success/denied/unavailable handling with zero mission or storage mutations.
- **Production Build & Offline Pack (`npm run build`)**: **Succeeded with `0` budget warnings**.
  - `main-WYUSQVYB.js`: `463.88 kB` raw / `117.08 kB` transfer
  - `styles-2WTUZKL3.css`: `13.85 kB` raw / `3.19 kB` transfer
  - **Initial Total**: **`477.73 kB` raw / `120.27 kB` transfer** (within the `500 kB` initial warning budget and `4 kB` component style budget).
  - **Offline Pack**: `35bbbbda914d` (**19 assets, 1,705,851 bytes**).
