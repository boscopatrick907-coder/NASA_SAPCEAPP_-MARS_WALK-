// Planning V2 terrain preview, real production build in Chromium (global Playwright).
// Serve dist/marswalk/browser on ORIGIN (default http://localhost:8125/), then: node tests/planning-v2/terrain-preview.e2e.cjs
// Prepares offline, sets endpoints, previews, accepts, saves, restarts offline and previews again.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.env.OUT || require('os').tmpdir(); const PROFILE = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'mw-terrain-'));
const log = (...a) => console.log(...a);
async function open(offline) {
  const ctx = await chromium.launchPersistentContext(PROFILE, { viewport: { width: 1280, height: 900 }, offline, acceptDownloads: true, deviceScaleFactor: 1 });
  const page = ctx.pages()[0] ?? await ctx.newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto('' + (process.env.ORIGIN || 'http://localhost:8125/') + '');
  await page.waitForFunction(() => document.querySelector('img.mars-map-image')?.complete);
  return { ctx, page, errors };
}
async function mapClick(page, fx, fy) { const m = page.locator('.leaflet-container'); const b = await m.boundingBox(); await m.click({ position: { x: b.width * fx, y: b.height * fy } }); }
async function preview(page, label) {
  await page.getByRole('tab', { name: 'Route Planner' }).click();
  const req = page.getByRole('button', { name: 'Request terrain preview' });
  await req.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Request terrain preview') && !b.disabled), null, { timeout: 30000 });
  await req.click();
  await page.getByText('Preview suggestion (not saved)').first().waitFor();
  const box = await page.locator('app-terrain-planner').innerText();
  const dashed = await page.locator('path.mw-suggested-route').getAttribute('d');
  log(label, '| suggestion path drawn:', !!dashed && dashed.length > 20);
  log(label, '| metrics:', box.split('\n').filter(l => /m$|°|Resolution|waypoint|Objective/i.test(l)).slice(0, 8).join(' | '));
}
(async () => {
  let { ctx, page, errors } = await open(false);
  await page.locator('summary', { hasText: 'Install & offline' }).click();
  await page.getByRole('button', { name: 'Prepare offline' }).click();
  await page.locator('summary .pack', { hasText: 'Pack verified' }).waitFor({ timeout: 60000 });
  log('offline pack verified');
  await page.getByRole('tab', { name: 'Route Planner' }).click();
  await page.getByRole('button', { name: 'Set Start Point Mode' }).click(); await mapClick(page, 0.3, 0.7);
  await page.getByRole('button', { name: 'Set Destination Point Mode' }).click(); await mapClick(page, 0.7, 0.3);
  await preview(page, 'online');
  await page.locator('app-terrain-planner').screenshot({ path: OUT + '/planner-preview.png' });
  await page.locator('.leaflet-container').scrollIntoViewIfNeeded(); await page.locator('.leaflet-container').screenshot({ path: OUT + '/map-preview.png' });
  await page.getByRole('button', { name: 'Accept preview route' }).click();
  await page.getByText('Suggested route applied').waitFor();
  const wp = await page.evaluate(() => document.querySelectorAll('.leaflet-interactive').length);
  log('accepted; interactive map layers now:', wp, '| dashed path after accept:', await page.locator('path.mw-suggested-route').getAttribute('d'));
  await page.getByRole('button', { name: 'Save route to local browser storage' }).click();
  const saved = await page.evaluate(() => { const k = Object.keys(localStorage).find(k => k.startsWith('marswalk:v1:')); return JSON.parse(localStorage.getItem(k)); });
  log('saved imageRef', saved.imageRef, '| waypoints', saved.route.waypoints.length, '| provenance', JSON.stringify(saved.terrainSuggestion));
  log('page errors online:', errors.length ? errors : 'none');
  await ctx.close();
  ({ ctx, page, errors } = await open(true));
  log('offline restart: status', await page.locator('summary').first().innerText());
  const restored = await page.evaluate(() => { const k = Object.keys(localStorage).find(k => k.startsWith('marswalk:v1:')); return JSON.parse(localStorage.getItem(k)).route.waypoints.length; });
  log('offline: saved waypoints still', restored);
  await page.getByRole('tab', { name: 'Route Planner' }).click();
  // move destination slightly to request a fresh preview offline
  await page.getByRole('button', { name: 'Set Destination Point Mode' }).click(); await mapClick(page, 0.65, 0.35);
  await preview(page, 'offline');
  log('page errors offline:', errors.length ? errors : 'none');
  await ctx.close();
})().catch(e => { console.log('FAIL', e.message.split('\n').slice(0, 4).join(' ')); process.exit(1); });
