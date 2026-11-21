import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve('dist/marswalk/browser');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const index = JSON.parse(await readFile('public/data/image-pack.json', 'utf8'));
const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8'));
if (index.imageRef !== manifest.imageRef) throw new Error('Image index/reference mismatch');
for (const file of index.files) {
  if (!/^data\/[A-Za-z0-9_./-]+$/.test(file.path) || file.path.split('/').some(p => p === '..' || p === '.')) throw new Error('Unsafe image path');
  const bytes = await readFile(resolve(root, file.path));
  if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`Image pack mismatch: ${file.path}`);
}
const paths = new Set(['index.html', 'favicon.ico', 'manifest.webmanifest', 'icons/marswalk-192.png', 'icons/marswalk-512.png', 'icons/marswalk-maskable-512.png', 'data/manifest.json', manifest.assetPath, 'data/markers.json', 'data/image-pack.json', 'data/environment.json', 'data/geology.json', 'data/mineralogy/mineralogy.json', 'data/mineralogy/sulfate-crop.png', 'data/mineralogy/context.png', 'data/models/marswalk-ai-relief.glb']);
// Terrain (contract v1 §7): the pointer is always packed; a package only when accepted and hash-valid.
paths.add('data/terrain/index.json');
const terrainIndex = JSON.parse(await readFile(resolve(root, 'data/terrain/index.json'), 'utf8'));
if (terrainIndex.schemaVersion !== 1) throw new Error('Terrain index schema mismatch');
if (terrainIndex.activePackageId !== null) {
  const id = terrainIndex.activePackageId;
  if (!/^terrain-[a-z0-9][a-z0-9._-]*$/.test(id)) throw new Error('Unsafe terrain package id');
  const base = `data/terrain/${id}`;
  const tm = JSON.parse(await readFile(resolve(root, base, 'terrain-manifest.json'), 'utf8'));
  if (tm.packageId !== id) throw new Error('Terrain manifest/index package mismatch');
  if (tm.imageRef !== manifest.imageRef) throw new Error('Terrain package is for a different image');
  const a = tm.admission ?? {};
  if (a.status !== 'accepted' || !a.reviewer || !a.decidedAtUtc || !a.evidenceRef)
    throw new Error('Terrain package is not accepted with reviewer/date/evidence; set activePackageId to null');
  paths.add(`${base}/terrain-manifest.json`);
  for (const file of tm.files ?? []) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(file.path)) throw new Error('Unsafe terrain file path');
    const bytes = await readFile(resolve(root, base, file.path));
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`Terrain pack mismatch: ${file.path}`);
    paths.add(`${base}/${file.path}`);
  }
}
// Nothing else may be deployed under data/terrain: no staging, raw archives or unaccepted packages.
for (const entry of await readdir(resolve(root, 'data/terrain'), { withFileTypes: true })) {
  const ok = entry.name === 'index.json' || (entry.isDirectory() && entry.name === terrainIndex.activePackageId);
  if (!ok) throw new Error(`Unexpected deployed terrain entry: data/terrain/${entry.name}`);
}
if (terrainIndex.activePackageId !== null) {
  const base = `data/terrain/${terrainIndex.activePackageId}`;
  for (const name of await readdir(resolve(root, base)))
    if (!paths.has(`${base}/${name}`)) throw new Error(`Unlisted terrain file deployed: ${base}/${name}`);
}
// All generated application chunks (including deferred viewer) are deliberately
// prepared. Raw/archive files and arbitrary public documents are excluded.
for (const entry of await readdir(root)) if (/\.(?:js|css)$/.test(entry)) paths.add(entry);
async function media(dir) {
  for (const entry of await readdir(resolve(root, dir), { withFileTypes: true }).catch(() => [])) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await media(path); else paths.add(path);
  }
}
await media('media');
const files = [];
for (const path of [...paths].sort()) {
  const bytes = await readFile(resolve(root, path));
  files.push({ path, bytes: bytes.length, sha256: hash(bytes) });
}
const version = hash(JSON.stringify(files));
const pack = { schemaVersion: 1, version, imageRef: manifest.imageRef, totalBytes: files.reduce((n, f) => n + f.bytes, 0), files };
const worker = await readFile('tools/pwa/worker.js', 'utf8');
await writeFile(resolve(root, 'service-worker.js'), worker.replace('/* BUILD_PACK */ null', JSON.stringify(pack)));
await writeFile(resolve(root, 'offline-pack.json'), JSON.stringify(pack, null, 2) + '\n');
console.log(`Offline pack ${version.slice(0, 12)}: ${files.length} assets, ${pack.totalBytes} bytes. Archive excluded.`);
