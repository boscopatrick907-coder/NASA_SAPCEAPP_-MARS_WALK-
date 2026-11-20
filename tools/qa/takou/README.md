# Takou release smoke harness

Isolated Playwright check of the **production build** (`dist/marswalk/browser`). It has its
own `package.json`/lockfile here, so the app's root `package.json` and `package-lock.json`
are untouched. It drives an already-installed Google Chrome (`channel: 'chrome'`), so no
Playwright browser download is needed.

## What it does

One serial run with a fresh temporary browser profile and a unique synthetic note
(`TAKOU-SMOKE-<timestamp>`). It never opens your normal browser profile and never imports
over real missions.

1. Real raster loads at the manifest dimensions; worker, web manifest and icons answer.
2. Science record selection, Previous/Next, and a filter that hides the selected record.
3. Start/waypoint/destination drawing; Reset View, Focus Route and an inspect-mode click keep the route; Save Route.
4. Note save; simulated full storage keeps the unsaved draft; export JSON.
5. Invalid JSON and mismatched-image imports leave stored and visible work unchanged.
6. Prepare offline → "Pack verified" → Verify saved pack.
7. Close the whole browser process, stop the server, relaunch the same profile offline,
   record the startup display, then **Load Route** and compare the second export with the first.
8. Optional flat viewer opens offline and is removed on close and on tab change.
9. 390 px width: no horizontal document overflow, map still has size.

Results: `results/latest.json` (environment, steps, console/page errors, 4xx/failed requests).
Screenshots: `docs/design/takou-screens/`. Exports (ignored by Git): `results/export-*.json`.

## Run it

From the repository root (Node 24 LTS):

```sh
npm ci
npm run build
cd tools/qa/takou
npm ci
npx playwright test -c playwright.config.mjs
```

Options (environment variables):

- `HEADED=1` shows the browser window.
- `MARSWALK_QA_PORT=4311` changes the local port (default 4310).
- `MARSWALK_BROWSER_CHANNEL=chromium` uses Playwright's own Chromium instead of Chrome
  (run `npx playwright install chromium` first). `msedge` also works on Windows.
- `KEEP_PROFILE=1` keeps the temporary profile folder for inspection.

To serve the build by hand with the same headers as `vercel.json`:

```sh
node tools/qa/takou/serve.mjs --root dist/marswalk/browser --port 4310
```

## Limits

- Local `http://127.0.0.1` origin, not the Vercel origin. Storage does not carry over
  between origins.
- "Offline" means the server is stopped and the browser context is in offline emulation.
- Desktop Chrome automation is not physical Android/iOS or installed-launcher acceptance.
- The viewer check proves DOM removal only; GPU memory release is not measured.
