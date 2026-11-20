// Synthetic package fixtures for tests only — never runtime terrain.
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TerrainService } from './terrain.service';
import { MissionService } from './mission.service';
import { testImage } from './fixtures.spec-helper';

const sha = async (b: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', b.slice().buffer))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');

const ID = 'terrain-synthetic-v1';
const grid = new Uint8Array(new Float32Array([0, 1, 2, 3]).buffer);
const mask = new Uint8Array([1, 1, 1, 1]);

async function manifest(over: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    contractVersion: 'terrain-v1',
    packageId: ID,
    imageRef: 'synthetic-test-only',
    productId: 'SYNTHETIC',
    source: { title: 'Synthetic', url: 'https://example.org/s', credit: 'test' },
    grid: { cols: 2, rows: 2, geotransform: [0, 1, 0, 2, 0, -1] },
    horizontal: { units: 'meters', nativeSpacingMeters: 1, preparedSpacingMeters: 1 },
    vertical: { units: 'meters', datumOrReference: 'synthetic' },
    files: [
      { path: 'grid.f32', bytes: 16, sha256: await sha(grid) },
      { path: 'mask.u8', bytes: 4, sha256: await sha(mask) },
    ],
    admission: {
      status: 'accepted',
      reviewer: 'P',
      decidedAtUtc: '2026-11-20T00:00:00Z',
      evidenceRef: 'ACCEPTANCE.md',
    },
    ...over,
  };
}

describe('TerrainService', () => {
  let service: TerrainService;
  let http: HttpTestingController;
  const flush = (suffix: string, body: unknown, status = 200) =>
    http
      .expectOne((r) => r.url.endsWith(suffix))
      .flush(body as never, status === 200 ? {} : { status, statusText: 'x' });
  const tick = () => new Promise((r) => setTimeout(r, 0));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TerrainService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
    const mission = TestBed.inject(MissionService);
    const p = mission.initialize();
    flush('/data/manifest.json', testImage());
    await Promise.resolve();
    flush('/data/markers.json', []);
    await p;
  });
  afterEach(() => http.verify());

  /** Starts loading; returns the pending promise wrapped so `await start()` doesn't wait for it. */
  async function start() {
    const done = service.initialize();
    await tick();
    return { done };
  }

  it('missing index or null pointer: no package, nothing else fetched', async () => {
    const { done: p } = await start();
    flush('/data/terrain/index.json', '', 404);
    await p;
    expect(service.gate()).toBe('no-terrain-package');
    expect(service.packageBuffers()).toBeNull();
  });

  it('null activePackageId is the shipped default', async () => {
    const { done: p } = await start();
    flush('/data/terrain/index.json', { schemaVersion: 1, activePackageId: null });
    await p;
    expect(service.status()).toBe('ready');
    expect(service.gate()).toBe('no-terrain-package');
  });

  it('accepted, matching, hash-valid package passes the gate and hands out buffer copies', async () => {
    const { done: p } = await start();
    flush('/data/terrain/index.json', { schemaVersion: 1, activePackageId: ID });
    await tick();
    flush(`/data/terrain/${ID}/terrain-manifest.json`, await manifest());
    await tick();
    flush(`/data/terrain/${ID}/grid.f32`, grid.slice().buffer);
    await tick();
    flush(`/data/terrain/${ID}/mask.u8`, mask.slice().buffer);
    await p;
    expect(service.readiness()).toBe('verified');
    expect(service.gate()).toBeNull();
    const a = service.packageBuffers()!;
    const b = service.packageBuffers()!;
    expect(a.grid).not.toBe(b.grid);
    expect(new Float32Array(a.grid)[3]).toBe(3);
  });

  it('corrupt bytes keep terrain unavailable', async () => {
    const { done: p } = await start();
    flush('/data/terrain/index.json', { schemaVersion: 1, activePackageId: ID });
    await tick();
    flush(`/data/terrain/${ID}/terrain-manifest.json`, await manifest());
    await tick();
    flush(`/data/terrain/${ID}/grid.f32`, new Uint8Array(16).buffer);
    await p;
    expect(service.readiness()).toBe('corrupt');
    expect(service.gate()).toBe('offline-pack-incomplete');
    expect(service.packageBuffers()).toBeNull();
  });

  it('pending admission or another image: no bytes fetched, gate explains why', async () => {
    const { done: p } = await start();
    flush('/data/terrain/index.json', { schemaVersion: 1, activePackageId: ID });
    await tick();
    flush(
      `/data/terrain/${ID}/terrain-manifest.json`,
      await manifest({
        admission: {
          status: 'pending-review',
          reviewer: null,
          decidedAtUtc: null,
          evidenceRef: null,
        },
      }),
    );
    await p;
    expect(service.gate()).toBe('terrain-not-accepted');
  });

  it('invalid index or a manifest for another package is an error, not a guess', async () => {
    const { done: p } = await start();
    flush('/data/terrain/index.json', { schemaVersion: 1, activePackageId: ID });
    await tick();
    flush(
      `/data/terrain/${ID}/terrain-manifest.json`,
      await manifest({ packageId: 'terrain-other-v1' }),
    );
    await p;
    expect(service.status()).toBe('error');
    expect(service.gate()).toBe('no-terrain-package');
  });
});
