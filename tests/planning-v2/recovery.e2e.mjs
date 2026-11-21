// Planning V2 recovery baseline (Royce). Real production build in Chromium via Playwright.
// Run: npm run build && npm run test:e2e
// Browser-process restart and offline are real; this is NOT a physical-device result.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { createRequire } from 'node:module';

// Playwright is not a project dependency (agree before adding one). Uses a global/NODE_PATH install.
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = resolve(new URL('../../dist/marswalk/browser', import.meta.url).pathname);
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.glb': 'model/gltf-binary',
};
const KEY_PREFIX = 'marswalk:v1:';

let server;
let origin;
let profile;
let work;

before(async () => {
  assert.ok(existsSync(join(ROOT, 'index.html')), 'run `npm run build` first');
  server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(
      /^([/\\])+/,
      '',
    );
    const file = join(ROOT, path || 'index.html');
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://localhost:${server.address().port}/`; // localhost = secure context for the service worker
  profile = await mkdtemp(join(tmpdir(), 'mw-profile-'));
  work = await mkdtemp(join(tmpdir(), 'mw-work-'));
});

after(async () => {
  server?.closeAllConnections();
  server?.close();
  await rm(profile, { recursive: true, force: true });
  await rm(work, { recursive: true, force: true });
});

async function open({ offline = false } = {}, track = []) {
  const ctx = await chromium.launchPersistentContext(profile, {
    viewport: { width: 1280, height: 800 },
    offline,
    acceptDownloads: true,
  });
  track.push(ctx);
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  page.setDefaultTimeout(20_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await ctx.addInitScript(() => localStorage.setItem('marswalk:welcome-seen:v1', '1'));
  await page.goto(origin);
  await page.getByRole('tab', { name: 'Plan route' }).waitFor();
  await page.waitForFunction(() => document.querySelector('.leaflet-container') !== null);
  return { ctx, page, errors };
}

async function exportMission(page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export mission record JSON' }).click(),
  ]);
  const out = join(work, `export-${Date.now()}.json`);
  await download.saveAs(out);
  return JSON.parse(await readFile(out, 'utf8'));
}
const content = (m) => ({ imageRef: m.imageRef, route: m.route, observations: m.observations });

async function mapClick(page, fx, fy) {
  const map = page.locator('.leaflet-container');
  const box = await map.boundingBox();
  // locator.click scrolls the map into view first (at 1280x800 the map extends below the fold).
  await map.click({ position: { x: box.width * fx, y: box.height * fy } });
}

/** Close every browser this test opened, even when an assertion fails. */
function guarded(fn) {
  return async () => {
    const open = [];
    try {
      await fn(open);
    } finally {
      for (const ctx of open) await ctx.close().catch(() => {});
    }
  };
}

test(
  'S1–S3: prepare offline, save route + note, full restart disconnected, exact recovery',
  { timeout: 120_000 },
  guarded(async (track) => {
    let { ctx, page, errors } = await open({}, track);
    await page.locator('.status-menu > summary').click();
    await page.getByRole('button', { name: 'Prepare offline' }).click();
    await page.locator('summary .pack', { hasText: 'Pack verified' }).waitFor({ timeout: 60_000 });
    await page.locator('.status-menu > summary').click();

    await page.getByRole('tab', { name: 'Plan route' }).click();
    await page.getByRole('button', { name: 'Set Start Point Mode' }).click();
    await mapClick(page, 0.35, 0.4);
    await page.getByRole('button', { name: 'Set Destination Point Mode' }).click();
    await mapClick(page, 0.6, 0.65);
    await page.getByRole('button', { name: 'Save route to local browser storage' }).click();

    await page.getByRole('tab', { name: /Notebook/ }).click();
    const note = `Planning V2 baseline note ${Date.now()}`;
    await page.locator('#obs-input').fill(note);
    await page.getByRole('button', { name: 'Save Observation' }).click();
    await page.getByRole('tab', { name: 'Notebook (1)' }).waitFor();

    const before = await exportMission(page);
    assert.ok(before.route.start && before.route.destination, 'route endpoints placed');
    assert.equal(before.observations.length, 1);
    assert.equal(before.observations[0].text, note);
    assert.deepEqual(errors, []);
    await ctx.close(); // full browser process exit

    ({ ctx, page, errors } = await open({ offline: true }, track));
    await page.locator('.status-menu > summary', { hasText: 'No connection' }).waitFor();
    await page.getByRole('tab', { name: 'Notebook (1)' }).waitFor({ timeout: 15_000 });
    const imageOk = await page
      .locator('img.mars-map-image')
      .evaluate((img) => img.complete && img.naturalWidth > 0);
    assert.ok(imageOk, 'imagery served offline');
    const after = await exportMission(page);
    assert.deepEqual(after.route, before.route);
    assert.deepEqual(after.observations, before.observations);
    assert.equal(after.imageRef, before.imageRef);
    assert.deepEqual(errors, []);
    await ctx.close();
  }),
);

test(
  'S4: wrong-image and malformed imports are rejected without changing the mission',
  { timeout: 120_000 },
  guarded(async (track) => {
    const { ctx, page } = await open({ offline: true }, track);
    const before = await exportMission(page);
    await page.getByRole('tab', { name: 'Share' }).click();
    for (const [name, body] of [
      [
        'wrong-image.json',
        JSON.stringify({ ...before, imageRef: 'hirise-mro-pia26306-boxwork-2048x1042-v1' }),
      ],
      ['not-json.json', '{"schemaVersion": 1, '],
      [
        'bad-point.json',
        JSON.stringify({ ...before, route: { ...before.route, start: { x: -5, y: 1 } } }),
      ],
    ]) {
      const file = join(work, name);
      await writeFile(file, body);
      await page.locator('#mission-file').setInputFiles(file);
      await page.getByRole('button', { name: 'Import selected mission' }).click();
      await page.waitForTimeout(300);
      const message = await page.locator('[role=status]').allTextContents();
      assert.ok(
        message.some((t) => /not valid|invalid|unchanged|could not|rejected/i.test(t)),
        `${name}: rejection shown (${message.join(' | ')})`,
      );
      assert.deepEqual(
        content(await exportMission(page)),
        content(before),
        `${name} must not change the mission`,
      );
    }
    await ctx.close();
  }),
);

test(
  'S5: unreadable saved record is preserved byte-for-byte after restart and save attempts',
  { timeout: 120_000 },
  guarded(async (track) => {
    let { ctx, page } = await open({ offline: true }, track);
    const key = await page.evaluate(
      (p) => Object.keys(localStorage).find((k) => k.startsWith(p)),
      KEY_PREFIX,
    );
    assert.ok(key, 'saved record exists');
    const corrupt = '{"schemaVersion":1,"truncated';
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, corrupt]);
    await ctx.close();

    ({ ctx, page } = await open({ offline: true }, track));
    await page.getByRole('tab', { name: 'Plan route' }).click();
    const saveRoute = page.getByRole('button', { name: 'Save route to local browser storage' });
    if (await saveRoute.isEnabled()) await saveRoute.click();
    await page.getByRole('tab', { name: /Notebook/ }).click();
    await page.locator('#obs-input').fill('should not overwrite');
    const saveNote = page.getByRole('button', { name: 'Save Observation' });
    if (await saveNote.isEnabled()) await saveNote.click();
    await page.waitForTimeout(300);
    assert.equal(
      await page.evaluate((k) => localStorage.getItem(k), key),
      corrupt,
      'corrupt record preserved',
    );
    assert.equal(
      await page.locator('#obs-input').inputValue(),
      'should not overwrite',
      'draft kept after blocked save',
    );
    await ctx.close();
  }),
);
