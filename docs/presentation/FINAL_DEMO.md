# MARSWALK — 90-second demo script (Takou/Charles)

Record on the public review URL **https://marswalk-review-boys-band.vercel.app/** (or the final
URL Patrick publishes). Show only what that URL actually does. Write the URL, date and source
SHA (shown in the commit list) under the video when uploading.

## Before you press record (2 minutes)

1. Open the URL in Chrome, normal window, 1440 × 900 or full screen. Dark theme reads best on video.
2. Expand **Install & offline** and press **Prepare offline**; wait for **Pack verified**.
3. Close the panel. Do not save anything yet (the demo creates the mission live).
4. Windows recording: press **Win + Alt + R** (Xbox Game Bar records the active window; press
   again to stop). The file lands in `Videos\Captures`. Microphone: Win + Alt + M.

## Script (≈ 90 s)

| Time | Do on screen | Say (short, factual) |
| --- | --- | --- |
| 0:00–0:10 | Whole screen, map visible. Point to the mission question in the briefing card. | "MARSWALK helps a crew plan one Mars field traverse with NASA data, and keep that plan offline. Today's question: what evidence supports ancient groundwater forming Mount Sharp's boxwork?" |
| 0:10–0:22 | **Confidence & Data** tab: open one science record, then the image source details. | "The map is a HiRISE image from Mars Reconnaissance Orbiter, at 0.25 metres per pixel. The Curiosity rover records are regional context: they are not pinned on this exact image, and the app says so." |
| 0:22–0:38 | **Route Planner**: Start → click map; Waypoint → click; Destination → click. Point to the distance. | "I sketch a route: start, waypoint, destination. Distance is calculated on the calibrated image: a planar length, not terrain-following. Slope and hazards are not available, and we never label a route safe." |
| 0:38–0:55 | Scroll to **Plan the return, not just the destination**. Press **Use illustrative example**. Point to round-trip travel and **Margin after protected reserve**. | "Survival planning is about the return. With the crew's own assumptions (walking speed, time available, task time and a protected reserve) MARSWALK checks whether the round trip still leaves the reserve intact. These are user assumptions, not life-support data." |
| 0:55–1:07 | **Notebook**: type "Pale veins along ridge crest; sample candidate"; **Save Observation**. | "In the field the crew records observations; the draft is kept even if saving fails." |
| 1:07–1:20 | Header **Export** (JSON downloads). Then turn Wi-Fi off, close the tab, reopen the URL. Show "Restored saved route and 1 observation(s) on this device." | "Everything exports as a mission file. And with no connection, I close and reopen: the map, evidence, route and note come back from the prepared offline pack." |
| 1:20–1:30 | Optional: **3D Rehearsal** → open the viewer for 3 seconds. End on the map. | "An optional 3D view uses an AI-generated relief model, labelled as a model, not measured terrain. MARSWALK: plan the traverse, plan the return, keep the evidence honest." |

## Words to avoid

"Safe route", "real terrain", "measured slope", "live weather", "NASA-approved/endorsed",
"works on every phone" (physical-device acceptance is still pending), "AI analyses the
terrain". Say "planar distance", "user assumptions", "regional context", "AI-generated model".

## If something fails while recording

- Offline reopen shows a different message: stop, export first, and record the offline part
  again; never clear site data (it can erase the saved mission).
- Map slow to appear: wait; do not refresh repeatedly on a slow connection.
- Keep the take under 95 s; cut the 3D step first.

## Portal assets checklist (fill in from official sources only)

| Item | Status |
| --- | --- |
| Demo video (≤ 90 s, mp4) | Record with this script |
| Public app URL | Final URL from Patrick |
| Code repository URL | https://github.com/boscopatrick907-coder/NASA_SAPCEAPP_-MARS_WALK- |
| Screenshots (desktop + phone) | `docs/design/takou-polish/after-*.png` (after Patrick merges the styling) |
| Data/resources used | From `docs/REFERENCES.md` and the in-app source library |
| AI-use disclosure | `docs/AI_USE.md`; add Claude Code for Takou's QA and styling work (blocker list C5) |
| Official field names, file limits, deadline timezone | **Unverified**: take them from the Space Apps portal, not from this file |
