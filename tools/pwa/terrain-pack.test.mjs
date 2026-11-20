// Contract v1 §7 offline-pack rules for terrain. Runs the real build-pack.mjs in a temp copy
// of the built app with a synthetic package (test fixture only). Requires `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO = resolve(new URL('../..', import.meta.url).pathname);
const DIST = join(REPO, 'dist/marswalk/browser');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const ID = 'terrain-synthetic-v1';

async function workspace() {
  assert.ok(existsSync(join(DIST, 'index.html')), 'run `npm run build` first');
  const dir = await mkdtemp(join(tmpdir(), 'mw-pack-'));
  await cp(DIST, join(dir, 'dist/marswalk/browser'), { recursive: true });
  await mkdir(join(dir, 'public/data'), { recursive: true });
  await mkdir(join(dir, 'tools/pwa'), { recursive: true });
  for (const f of ['public/data/image-pack.json', 'public/data/manifest.json', 'tools/pwa/worker.js'])
    await cp(join(REPO, f), join(dir, f));
  return dir;
}

async function addPackage(dir, { admission = 'accepted', corrupt = false, extra = false } = {}) {
  const root = join(dir, 'dist/marswalk/browser/data/terrain');
  const imageRef = JSON.parse(await readFile(join(REPO, 'public/data/manifest.json'), 'utf8')).imageRef;
  await mkdir(join(root, ID), { recursive: true });
  const grid = Buffer.from(new Float32Array([0, 1, 2, 3]).buffer);
  const mask = Buffer.from([1, 1, 1, 1]);
  await writeFile(join(root, ID, 'grid.f32'), corrupt ? Buffer.alloc(16) : grid);
  await writeFile(join(root, ID, 'mask.u8'), mask);
  if (extra) await writeFile(join(root, ID, 'raw.IMG'), 'x');
  const manifest = {
    schemaVersion: 1, contractVersion: 'terrain-v1', packageId: ID, imageRef,
    files: [
      { path: 'grid.f32', bytes: 16, sha256: sha(grid) },
      { path: 'mask.u8', bytes: 4, sha256: sha(mask) },
    ],
    admission: admission === 'accepted'
      ? { status: 'accepted', reviewer: 'P', decidedAtUtc: '2026-11-20T00:00:00Z', evidenceRef: 'ACCEPTANCE.md' }
      : { status: admission, reviewer: null, decidedAtUtc: null, evidenceRef: null },
  };
  await writeFile(join(root, ID, 'terrain-manifest.json'), JSON.stringify(manifest));
  await writeFile(join(root, 'index.json'), JSON.stringify({ schemaVersion: 1, activePackageId: ID }));
}

function pack(dir) {
  const r = spawnSync(process.execPath, [join(REPO, 'tools/pwa/build-pack.mjs')], { cwd: dir, encoding: 'utf8' });
  return { ok: r.status === 0, out: r.stdout + r.stderr };
}
const packed = async (dir) =>
  JSON.parse(await readFile(join(dir, 'dist/marswalk/browser/offline-pack.json'), 'utf8')).files.map((f) => f.path);

test('default build: only the null pointer is packed', async () => {
  const dir = await workspace();
  try {
    const r = pack(dir);
    assert.ok(r.ok, r.out);
    assert.deepEqual((await packed(dir)).filter((p) => p.startsWith('data/terrain')), ['data/terrain/index.json']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('accepted, hash-valid package is packed in full', async () => {
  const dir = await workspace();
  try {
    await addPackage(dir);
    const r = pack(dir);
    assert.ok(r.ok, r.out);
    assert.deepEqual((await packed(dir)).filter((p) => p.startsWith('data/terrain')), [
      'data/terrain/index.json',
      `data/terrain/${ID}/grid.f32`,
      `data/terrain/${ID}/mask.u8`,
      `data/terrain/${ID}/terrain-manifest.json`,
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

for (const [name, opts, message] of [
  ['pending package', { admission: 'pending-review' }, /not accepted/],
  ['hash mismatch', { corrupt: true }, /Terrain pack mismatch/],
  ['unlisted file in package', { extra: true }, /Unlisted terrain file/],
]) {
  test(`build fails: ${name}`, async () => {
    const dir = await workspace();
    try {
      await addPackage(dir, opts);
      const r = pack(dir);
      assert.equal(r.ok, false);
      assert.match(r.out, message);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

test('build fails: stray staging folder under data/terrain', async () => {
  const dir = await workspace();
  try {
    await mkdir(join(dir, 'dist/marswalk/browser/data/terrain/staging'), { recursive: true });
    const r = pack(dir);
    assert.equal(r.ok, false);
    assert.match(r.out, /Unexpected deployed terrain entry/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
