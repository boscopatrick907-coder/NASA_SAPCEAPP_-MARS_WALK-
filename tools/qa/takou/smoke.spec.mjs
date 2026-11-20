// MARSWALK release smoke test (Takou release QA, Package 3).
// Drives the real production build in an isolated, temporary browser profile with a unique
// synthetic mission. Never points at a personal profile or imports over real missions.
// Browser automation is not physical Android/iOS acceptance.
import { test, expect, chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO = resolve(HERE, '../../..');
const BUILD = join(REPO, 'dist/marswalk/browser');
const PORT = Number(process.env.MARSWALK_QA_PORT ?? 4310);
const CHANNEL = process.env.MARSWALK_BROWSER_CHANNEL ?? 'chrome';
const HEADLESS = process.env.HEADED !== '1';
const SHOTS = join(REPO, 'docs/design/takou-screens');
const RESULTS = join(HERE, 'results');
const RUN_ID = `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
const NOTE = `TAKOU-SMOKE-${RUN_ID}`;
const DESKTOP = { width: 1366, height: 768 };
const PHONE = { width: 390, height: 844 };

const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
const state = {
  runId: RUN_ID,
  source: { sha: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain') !== '' },
  channel: CHANNEL,
  headless: HEADLESS,
  steps: [],
  consoleErrors: [],
  pageErrors: [],
  failedResponses: [],
};
let server, context, page, profileDir, manifest, pack, imageKey, firstExport, savedRoute;

function watch(p) {
  p.on(
    'console',
    (m) =>
      m.type() === 'error' && state.consoleErrors.push({ text: m.text(), at: state.steps.length }),
  );
  p.on('pageerror', (e) => state.pageErrors.push({ text: String(e), at: state.steps.length }));
  p.on(
    'response',
    (r) => r.status() >= 400 && state.failedResponses.push({ url: r.url(), status: r.status() }),
  );
  p.on('requestfailed', (r) =>
    state.failedResponses.push({ url: r.url(), status: r.failure()?.errorText ?? 'failed' }),
  );
}
async function launch(offline = false) {
  context = await chromium.launchPersistentContext(profileDir, {
    channel: CHANNEL === 'chromium' ? undefined : CHANNEL,
    headless: HEADLESS,
    viewport: DESKTOP,
    acceptDownloads: true,
    offline,
  });
  context.setDefaultTimeout(20_000);
  page = context.pages()[0] ?? (await context.newPage());
  watch(page);
}
const record = (name, details = {}) => state.steps.push({ name, ...details });
const mapArea = () => page.locator('.map-panel [role="application"]');
async function clickMap(fx, fy) {
  const box = await mapArea().boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
}
async function waitForRaster() {
  const img = page.locator('img.leaflet-image-layer');
  await expect(img).toHaveCount(1, { timeout: 60_000 });
  await expect(page.getByText('Loading Mars imagery…')).toHaveCount(0, { timeout: 60_000 });
  return img.evaluate((el) => ({
    w: el.naturalWidth,
    h: el.naturalHeight,
    src: el.getAttribute('src'),
  }));
}
// Cell text, not innerText: innerText drops the tab separators when the table is not laid out.
const routeRows = () =>
  page
    .locator('app-route-planner .points-table tbody tr')
    .evaluateAll((rows) =>
      rows.map((r) => [...r.cells].map((c) => c.textContent.trim()).join(' | ')),
    );
const notebookCount = async () =>
  Number((await page.locator('#tab-notebook').innerText()).match(/\((\d+)\)/)[1]);
const storedRaw = () => page.evaluate((key) => localStorage.getItem(key), imageKey);
async function exportMission(label) {
  await page.locator('#tab-transfer').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export mission', exact: true }).click(),
  ]);
  const json = JSON.parse(await readFile(await download.path(), 'utf8'));
  await writeFile(join(RESULTS, `export-${label}.json`), JSON.stringify(json, null, 2));
  return json;
}
async function shot(name, fullPage = false) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  manifest = JSON.parse(await readFile(join(BUILD, 'data/manifest.json'), 'utf8'));
  pack = JSON.parse(await readFile(join(BUILD, 'offline-pack.json'), 'utf8'));
  imageKey = `marswalk:v1:${manifest.imageRef}`;
  await mkdir(SHOTS, { recursive: true });
  await mkdir(RESULTS, { recursive: true });
  profileDir = await mkdtemp(join(tmpdir(), 'marswalk-takou-profile-'));
  server = await startServer({ root: BUILD, port: PORT });
  state.url = server.url;
  state.pack = { version: pack.version, files: pack.files.length, totalBytes: pack.totalBytes };
  await launch(false);
  state.userAgent = await page.evaluate(() => navigator.userAgent);
  state.browserVersion = await page.evaluate(async () => {
    const data = await navigator.userAgentData?.getHighEntropyValues?.(['fullVersionList']);
    return data?.fullVersionList?.map((b) => `${b.brand} ${b.version}`).join(', ') ?? null;
  });
});

test.afterAll(async () => {
  await context?.close().catch(() => {});
  await server?.close().catch(() => {});
  state.serverRequests404 = server?.requests.filter((r) => r.status === 404) ?? [];
  state.finishedAt = new Date().toISOString();
  await writeFile(join(RESULTS, 'latest.json'), JSON.stringify(state, null, 2));
  if (process.env.KEEP_PROFILE !== '1')
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
});

test('1. real raster loads at the manifest dimensions with no page errors', async () => {
  await page.goto(server.url);
  const raster = await waitForRaster();
  expect(raster.w).toBe(manifest.width);
  expect(raster.h).toBe(manifest.height);
  expect(raster.src).toContain(manifest.assetPath);
  const sw = await page.evaluate(async () => {
    const r = await navigator.serviceWorker?.getRegistration();
    return { registered: !!r, scope: r?.scope ?? null };
  });
  const webmanifest = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return null;
    const res = await fetch(link.href);
    return {
      href: link.href,
      status: res.status,
      type: res.headers.get('content-type'),
      body: await res.json(),
    };
  });
  expect(webmanifest?.status).toBe(200);
  const icons = await page.evaluate(
    async ({ list, base }) => {
      const out = [];
      for (const icon of list) {
        const res = await fetch(new URL(icon.src, base));
        out.push({
          src: icon.src,
          sizes: icon.sizes,
          status: res.status,
          type: res.headers.get('content-type'),
        });
      }
      return out;
    },
    { list: webmanifest.body.icons ?? [], base: webmanifest.href },
  );
  expect(icons.every((i) => i.status === 200)).toBe(true);
  record('raster', { ...raster, serviceWorker: sw, manifestType: webmanifest.type, icons });
  await shot('desktop-1366-initial');
  expect(state.pageErrors).toEqual([]);
});

test('2. science selection, previous/next and filters keep the selected context', async () => {
  await page.locator('#tab-confidence').click();
  const records = page.locator('.science-record-button');
  const count = await records.count();
  expect(count).toBeGreaterThan(1);
  await records.first().click();
  const details = page.getByRole('article', { name: 'Selected science record details' });
  const firstName = await details.locator('h3').innerText();
  const position1 = await page.locator('.record-navigation-position').innerText();
  await expect(page.getByRole('button', { name: 'Previous science record' })).toBeDisabled();
  await page.getByRole('button', { name: 'Next science record' }).click();
  await expect(details.locator('h3')).not.toHaveText(firstName);
  const secondName = await details.locator('h3').innerText();
  const position2 = await page.locator('.record-navigation-position').innerText();
  await page.getByRole('button', { name: 'Previous science record' }).click();
  await expect(details.locator('h3')).toHaveText(firstName);
  // Read the evidence type from the first record's list pill; the details markup changed
  // across revisions (label rename, then the evidence comparison), the list pill did not.
  const types = ['measured', 'derived', 'interpreted', 'simulated'];
  const evidenceText = (await records.first().locator('.record-evidence').innerText())
    .trim()
    .toLowerCase();
  const evidence = types.find((v) => evidenceText.startsWith(v));
  expect(evidence).toBeTruthy();
  const other = types.find((v) => v !== evidence);
  await page.getByLabel('Evidence type', { exact: true }).selectOption(other);
  await expect(details.locator('h3')).toHaveText(firstName);
  await expect(page.locator('.hidden-notice')).toBeVisible();
  const hiddenPosition = await page.locator('.record-navigation-position').innerText();
  await page.locator('.hidden-notice').getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.hidden-notice')).toHaveCount(0);
  await expect(details.locator('h3')).toHaveText(firstName);
  record('science', {
    count,
    firstName,
    secondName,
    position1,
    position2,
    filteredTo: other,
    hiddenPosition,
  });
  await page.getByRole('button', { name: 'Clear selection of science record' }).click();
});

test('3. route drawing survives Reset View and Focus Route; Save Route succeeds', async () => {
  await page.locator('#tab-planner').click();
  await page.getByRole('button', { name: 'Set Start Point Mode' }).click();
  await clickMap(0.35, 0.5);
  await page.getByRole('button', { name: 'Add Waypoint Mode' }).click();
  await clickMap(0.5, 0.45);
  await page.getByRole('button', { name: 'Set Destination Point Mode' }).click();
  await clickMap(0.65, 0.55);
  await page.getByRole('button', { name: 'Inspect Mode' }).click();
  const before = await routeRows();
  expect(before).toHaveLength(3);
  await page.getByRole('button', { name: 'Reset View' }).click();
  await page.getByRole('button', { name: 'Focus Route' }).click();
  await clickMap(0.2, 0.2); // inspect mode: must not change the route
  expect(await routeRows()).toEqual(before);
  await expect(page.getByRole('button', { name: 'Inspect Mode' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Save route to local browser storage' }).click();
  await expect(page.locator('app-route-planner .feedback-alert')).toContainText(
    'Route saved locally',
  );
  savedRoute = before;
  record('route', { rows: before });
  await shot('desktop-1366-route');
});

test('4. note save, failed-save draft retention and export', async () => {
  await page.locator('#tab-notebook').click();
  const textarea = page.locator('#obs-input');
  await textarea.fill(NOTE);
  await page.getByRole('button', { name: 'Save observation to mission log' }).click();
  await expect(page.locator('app-notebook .feedback-alert')).toContainText('Observation saved');
  await expect(textarea).toHaveValue('');
  expect(await notebookCount()).toBe(1);
  const savedRaw = await storedRaw();
  expect(JSON.parse(savedRaw).observations.map((n) => n.text)).toEqual([NOTE]);

  await page.evaluate(() => {
    window.__takouSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new DOMException('Simulated full storage (Takou QA)', 'QuotaExceededError');
    };
  });
  const draft = `${NOTE}-UNSAVED-DRAFT`;
  await textarea.fill(draft);
  await page.getByRole('button', { name: 'Save observation to mission log' }).click();
  await expect(page.locator('app-notebook .feedback-alert')).toContainText(
    /not saved|not replaced/,
  );
  await expect(textarea).toHaveValue(draft);
  expect(await notebookCount()).toBe(1);
  await page.evaluate(() => (Storage.prototype.setItem = window.__takouSetItem));
  expect(await storedRaw()).toBe(savedRaw);
  await shot('desktop-1366-notebook-failed-save');
  await textarea.fill('');

  firstExport = await exportMission('before-close');
  expect(firstExport.imageRef).toBe(manifest.imageRef);
  expect(firstExport.observations.map((n) => n.text)).toEqual([NOTE]);
  expect(firstExport.route.waypoints).toHaveLength(1);
  record('note-and-export', {
    note: NOTE,
    draftRetained: true,
    exportedObservations: firstExport.observations.length,
  });
});

test('5. invalid and mismatched-image imports keep current work', async () => {
  const before = { raw: await storedRaw(), count: await notebookCount() };
  const cases = {
    'invalid-json': '{ not json',
    'mismatched-image': JSON.stringify({ ...firstExport, imageRef: 'takou-qa-not-this-image' }),
  };
  const messages = {};
  await page.locator('#tab-transfer').click();
  for (const [name, body] of Object.entries(cases)) {
    await page.locator('#mission-file').setInputFiles({
      name: `${name}.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(body),
    });
    await page.getByRole('button', { name: 'Import selected mission' }).click();
    const status = page.locator('app-shell [mission-transfer] p[role="status"]').last();
    await expect(status).not.toHaveText(/Reading mission file/);
    messages[name] = await status.innerText();
    expect(messages[name]).not.toMatch(/imported|replaced/i);
    expect(await storedRaw()).toBe(before.raw);
    expect(await notebookCount()).toBe(before.count);
  }
  await page.locator('#tab-planner').click();
  expect(await routeRows()).toEqual(savedRoute);
  record('import-guards', { messages });
});

test('6. complete offline pack prepares and verifies', async () => {
  const panel = page.locator('details.pwa-panel');
  await panel.locator('summary').click();
  await panel.getByRole('button', { name: 'Prepare offline' }).click();
  await expect(panel.locator('summary')).toContainText('Pack verified', { timeout: 180_000 });
  await panel.getByRole('button', { name: 'Verify saved pack' }).click();
  await expect(panel.locator('summary')).toContainText('Pack verified', { timeout: 60_000 });
  const text = await panel.innerText();
  expect(text).toContain(pack.version.slice(0, 12));
  const cacheEntries = await page.evaluate(async () => {
    const out = {};
    for (const n of await self.caches.keys())
      out[n] = (await (await self.caches.open(n)).keys()).length;
    return out;
  });
  record('offline-pack', { panel: text.split('\n').slice(0, 4), cacheEntries });
  await panel.locator('summary').click();
});

test('7. disconnected full-process restart restores the exact mission at startup', async () => {
  await context.close(); // whole browser process for this persistent profile
  await server.close(); // origin is now unreachable
  await launch(true); // relaunch same profile with network emulated offline
  await page.goto(server.url);
  const raster = await waitForRaster();
  expect(raster.w).toBe(manifest.width);
  await expect(page.locator('details.pwa-panel summary')).toContainText('Disconnected');
  // Since b28f6ad the saved mission is restored automatically, before any Load Route.
  const message = page.locator('p.mission-recovery');
  await expect(message).toContainText('Restored saved route and 1');
  const recoveryMessage = await message.innerText();
  const startupCount = await notebookCount();
  expect(startupCount).toBe(1);
  await page.locator('#tab-planner').click();
  // The planner is lazy-loaded on first open; wait for its rows before reading them.
  await expect(page.locator('app-route-planner .points-table tbody tr')).toHaveCount(
    savedRoute.length,
  );
  const startupRows = await routeRows();
  expect(startupRows).toEqual(savedRoute);
  await page.locator('#tab-notebook').click();
  await expect(page.locator('app-notebook .entry-body')).toHaveText([NOTE]);
  await shot('desktop-1366-offline-startup-restored');
  const secondExport = await exportMission('after-offline-restart');
  expect(secondExport.imageRef).toBe(firstExport.imageRef);
  expect(secondExport.route).toEqual(firstExport.route);
  expect(secondExport.observations).toEqual(firstExport.observations);

  // Explicit Load Route still works and changes nothing.
  await page.locator('#tab-planner').click();
  await page.getByRole('button', { name: 'Load route from local browser storage' }).click();
  await expect(page.locator('app-route-planner .feedback-alert')).toContainText('Route loaded');
  expect(await routeRows()).toEqual(savedRoute);
  expect(await notebookCount()).toBe(1);
  record('offline-recovery', { recoveryMessage, startupCount, startupRows, exportsEqual: true });
});

test('8. optional flat viewer opens offline and is removed when closed or left', async () => {
  await page.locator('#tab-rehearsal').click();
  await page.getByRole('button', { name: 'Open 3D viewer' }).click();
  // Since 2bfbd8d the tab opens the uploaded AI-generated relief by default; the flat viewer
  // remains the fallback. Either viewport counts as opened.
  const viewport = page
    .locator('app-viewer3d .canvas-viewport, app-viewer3d .relief-viewport')
    .first();
  await expect(viewport).toBeVisible({ timeout: 30_000 });
  const opened = {
    canvases: await page.locator('app-viewer3d canvas').count(),
    fallback: await page.locator('app-viewer3d .webgl-fallback').count(),
  };
  expect(opened.canvases + opened.fallback).toBeGreaterThan(0);
  await shot('desktop-1366-viewer');
  await page.getByRole('button', { name: 'Close 3D viewer' }).click();
  await expect(page.locator('app-viewer3d')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open 3D viewer' }).click();
  await expect(viewport).toBeVisible({ timeout: 30_000 });
  await page.locator('#tab-planner').click();
  await expect(page.locator('app-viewer3d')).toHaveCount(0);
  record('viewer', { opened, removedOnClose: true, removedOnTabChange: true });
});

// Height of the map that is actually on screen: clipped by the viewport and by every
// ancestor that hides or scrolls overflow. The element's own box can be much taller.
const visibleMapHeight = () =>
  page.evaluate(() => {
    const el = document.querySelector('.map-panel [role="application"]');
    const box = el.getBoundingClientRect();
    let top = Math.max(box.top, 0);
    let bottom = Math.min(box.bottom, window.innerHeight);
    for (let a = el.parentElement; a; a = a.parentElement) {
      if (/hidden|auto|scroll|clip/.test(getComputedStyle(a).overflowY)) {
        const r = a.getBoundingClientRect();
        top = Math.max(top, r.top);
        bottom = Math.min(bottom, r.bottom);
      }
    }
    return Math.max(0, Math.round(bottom - top));
  });

test('9. narrow 390px screen: no document overflow; visible map measured', async () => {
  await page.setViewportSize(PHONE);
  await page.locator('#tab-confidence').click();
  await page.evaluate(() => window.scrollTo(0, 0));
  const metrics = await page.evaluate(() => ({
    docScroll: document.documentElement.scrollWidth,
    docClient: document.documentElement.clientWidth,
    bodyScroll: document.body.scrollWidth,
  }));
  const map = await mapArea().boundingBox();
  const visibleDefault = await visibleMapHeight();
  await shot('phone-390-offline', false);
  expect(metrics.docScroll).toBeLessThanOrEqual(metrics.docClient);
  expect(metrics.bodyScroll).toBeLessThanOrEqual(metrics.docClient);
  expect(map.width).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Collapse panel sidebar' }).click();
  // Clicking the button scrolls the page; measure from the top like a fresh view.
  await page.evaluate(() => window.scrollTo(0, 0));
  const visibleCollapsed = await visibleMapHeight();
  await shot('phone-390-panel-collapsed', false);
  await page.getByRole('button', { name: 'Show panel sidebar' }).click();
  // Since b28f6ad the phone page scrolls; measure the map once scrolled into view.
  await page.evaluate(() => window.scrollTo(0, 0));
  await mapArea().scrollIntoViewIfNeeded();
  const visibleAfterScroll = await visibleMapHeight();
  const scrollY = await page.evaluate(() => Math.round(window.scrollY));
  await shot('phone-390-map-scrolled-into-view', false);
  expect(visibleAfterScroll).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('#tab-notebook').click();
  await expect(page.locator('app-notebook .entry-body')).toHaveText([NOTE]);
  const afterTab = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(afterTab).toBeLessThanOrEqual(metrics.docClient);
  // Heights are observations reported in TAKOU_RELEASE_BLOCKERS.md (B3), not a size gate.
  record('narrow', {
    ...metrics,
    mapElement: map,
    visibleDefault,
    visibleCollapsed,
    visibleAfterScroll,
    scrollY,
  });
  expect(state.pageErrors).toEqual([]);
});
