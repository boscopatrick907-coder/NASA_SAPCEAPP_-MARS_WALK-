# Planning V2 — recovery and release QA

Branch `feature/royce-planning-v2-acceptance`. Prepared by the coordinator's coding agent for **Royce's "Do now" item; Royce owns the report, device runs and all later scenarios.** This records the save → close → reopen → export baseline **before** any terrain feature lands.

## Update — re-run on the switched image (20 Nov 2026, evening)

Re-run on `claude/magical-volta-1c76ak` after the switch to `hirise-psp001752-red-ortho-2048-0253m-v3` with the accepted DTM package. Offline pack `16c6b0d7998edac5127ebdd4f5618efe6405673d310d0addcf77f57b92b1c2ad`, 31 files, 10,497,180 bytes (now includes the terrain package and the routing worker). `npm run test:e2e`: **S1–S5 pass**. The terrain flow (preview → accept → save → offline restart → offline preview) is covered by `tests/planning-v2/terrain-preview.e2e.cjs`; see [TERRAIN_PREVIEW_INTEGRATION.md](TERRAIN_PREVIEW_INTEGRATION.md). The table below is the earlier baseline run.

## Candidate tested

| Item | Value |
|---|---|
| Source revision | `a81c15745e7e514547072860ebaaa851a2c63774` (`claude/magical-volta-1c76ak`; runtime identical to `main` 78b7c69 — the added `core/terrain.ts` isn't imported) |
| Build | `npm run build` → `dist/marswalk/browser` |
| Offline pack | `40828fdb29fff88c6aab70f33b5a6bbc2c00bd0b4fda8e55b7b3bb49be268d2b`, 22 files, 9 818 650 bytes |
| imageRef | `hirise-psp001752-red-center-2048-025m-v2` |
| Origin | local Node static server, `http://localhost:<random port>/` (secure context for the service worker). **Not a deployed URL** |
| Browser | Playwright 1.63.0, Chromium 157.0.8103.78, headless, 1280×800, fresh isolated persistent profile per run |
| Date | 20 Nov 2026 |

## Automated end-to-end (`tests/planning-v2/recovery.e2e.mjs`)

```bash
npm run build
```

```bash
npm run test:e2e
```

Playwright is not a project dependency here: the test loads a global install via `NODE_PATH`. On another machine either install Playwright globally, or agree with Patrick to add it as a devDependency.

| ID | Scenario | Result |
|---|---|---|
| S1 | Prepare offline in the UI → "Pack verified" (22/22 files) | **pass** |
| S2 | Set start + destination on the map, Save Route; write and save a Notebook observation; export | **pass** |
| S3 | **Full browser process exit**, relaunch the same profile **offline**: app and imagery load from the service worker, route + observation restored automatically, export matches imageRef/route/observations exactly, no page errors | **pass** |
| S4 | Import (a) the same mission with the old image's imageRef, (b) truncated JSON, (c) a point with x = −5: each shows a rejection message and the exported mission is unchanged | **pass** |
| S5 | Replace the saved record with unreadable bytes, restart offline, try Save Route and Save Observation: the corrupt bytes stay byte-for-byte, the note draft is kept, Save Route is disabled | **pass** |

Run twice in a row: 3/3 pass both times, about 5 s each.

## Not covered yet (pending, with owner)

| Scenario | Why pending | Owner |
|---|---|---|
| Denied/full storage (quota, storage blocked) | Needs a reliable way to simulate quota in Chromium; agree the approach with Patrick | Royce + Patrick |
| Suggest / reject / cancel / stale leave the mission unchanged | Covered by unit tests (`terrain-preview.service.spec.ts`, planner spec 9) and the terrain browser run; a manual cancel/stale pass on a device is still Royce's | Royce |
| Compact terrain package offline: prepare, verify hashes, restart offline, routing only when complete | **Pass** (terrain browser run) | — |
| Missing/corrupt grid, wrong hash, interrupted preparation, offline first visit, stale cache | Unit level covered (`terrain.service.spec.ts`, `terrain-pack.test.mjs`); browser-level failure injection still to do | Royce |
| Installed PWA on a physical Android device | Needs hardware. Headless browser and emulation aren't device certification | Royce, with Willy 2 |
| iOS | Hardware unavailable; stays pending | — |

## Observation for Charles (layout)

At 1280×800 the map container starts at y ≈ 419 px and is 590 px tall, so its lower part is below the fold on first load. The first version of S2 clicked off-screen and placed no destination. The test now scrolls the map into view, but on a laptop-sized window a user also has to scroll to see the whole map. This is included in the usability audit.
