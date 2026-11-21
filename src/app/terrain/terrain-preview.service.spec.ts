// Integration of TerrainService → worker → preview → map store → accept adapter.
// Synthetic grid for tests only. The real worker host runs in-process via a fake Worker.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MissionService } from '../core/mission.service';
import { TerrainService } from '../core/terrain.service';
import { TerrainSuggestionStore } from '../core/terrain-suggestion.store';
import type { ImageManifest, Route } from '../core/models';
import type { TerrainManifest } from '../core/terrain';
import { TerrainWorkerRequest } from './protocol';
import { WorkerLike } from './terrain-routing.client';
import { TERRAIN_WORKER_FACTORY, TerrainPreviewService } from './terrain-preview.service';
import { TerrainWorkerHost } from './worker-host';

const N = 10;
const image = {
  imageRef: 'img',
  width: 40,
  height: 40,
  calibration: { verified: true, metersPerPixel: 0.25, sourceUrl: null, method: null },
  georeference: {
    crs: { radiusMeters: 1, centerLongitude: 0, centerLatitude: 0, units: 'meters' },
    pixelSizeMeters: 0.25,
    xminMeters: 0,
    yminMeters: 0,
  },
} as unknown as ImageManifest;
const manifest = {
  packageId: 'terrain-synthetic-v1',
  imageRef: 'img',
  grid: { cols: N, rows: N, geotransform: [0, 1, 0, 10, 0, -1] },
  admission: { status: 'accepted' },
} as unknown as TerrainManifest;

class FakeWorker implements WorkerLike {
  onmessage: WorkerLike['onmessage'] = null;
  onerror: WorkerLike['onerror'] = null;
  readonly host = new TerrainWorkerHost(
    (m) => queueMicrotask(() => this.onmessage?.({ data: m } as MessageEvent)),
    {
      chunk: 5,
    },
  );
  postMessage(m: TerrainWorkerRequest) {
    void this.host.handle(m);
  }
  terminate() {}
}

describe('TerrainPreviewService', () => {
  let service: TerrainPreviewService;
  let route: ReturnType<typeof signal<Route>>;
  let replace: ReturnType<typeof vi.fn>;
  const settle = () => new Promise((r) => setTimeout(r, 30));
  const payload = (requestId: string, over: object = {}) => ({
    requestId,
    imageRef: 'img',
    packageId: 'terrain-synthetic-v1',
    start: { x: 2, y: 2 },
    destination: { x: 38, y: 38 },
    maxSegmentGrade: 15,
    gradeUnit: 'deg' as const,
    maxSegmentGradeDeg: 15,
    ...over,
  });

  beforeEach(() => {
    route = signal<Route>({ start: { x: 2, y: 2 }, destination: { x: 38, y: 38 }, waypoints: [] });
    replace = vi.fn(() => ({ ok: true }));
    const grid = new Float32Array(N * N);
    const mask = new Uint8Array(N * N).fill(1);
    TestBed.configureTestingModule({
      providers: [
        { provide: TERRAIN_WORKER_FACTORY, useValue: () => new FakeWorker() },
        {
          provide: MissionService,
          useValue: { image: signal(image), route, replaceRouteFromSuggestion: replace },
        },
        {
          provide: TerrainService,
          useValue: {
            initialize: () => Promise.resolve(),
            manifest: signal(manifest),
            gate: signal(null),
            message: signal(null),
            packageBuffers: () => ({ grid: grid.slice().buffer, mask: mask.slice().buffer }),
          },
        },
      ],
    });
    service = TestBed.inject(TerrainPreviewService);
  });

  it('runs a preview, exposes engine metrics in degrees and publishes the path to the map', async () => {
    await service.requestPreview(payload('r1'));
    await settle();
    const p = service.preview();
    expect(p.status).toBe('preview-ready');
    expect(p.engineResult?.gradeUnit).toBe('deg');
    expect(p.engineResult?.sampledDistanceMeters).toBeGreaterThan(0);
    TestBed.tick();
    expect(TestBed.inject(TerrainSuggestionStore).path()?.length).toBeGreaterThanOrEqual(2);
  });

  it('hides the map suggestion as soon as an endpoint moves', async () => {
    await service.requestPreview(payload('r1'));
    await settle();
    expect(service.mapSuggestion()).not.toBeNull();
    route.set({ ...route(), destination: { x: 30, y: 30 } });
    expect(service.mapSuggestion()).toBeNull();
    expect(
      service.accept({ requestId: 'r1', imageRef: 'img', packageId: 'terrain-synthetic-v1' }).ok,
    ).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('accept goes through the mission adapter with provenance, then clears the preview', async () => {
    await service.requestPreview(payload('r1'));
    await settle();
    const r = service.accept({
      requestId: 'r1',
      imageRef: 'img',
      packageId: 'terrain-synthetic-v1',
    });
    expect(r.ok).toBe(true);
    expect(replace).toHaveBeenCalledWith(expect.any(Array), {
      packageId: 'terrain-synthetic-v1',
      requestId: 'r1',
      maxSegmentGradeDeg: 15,
    });
    expect(service.preview().status).toBe('idle');
    expect(service.mapSuggestion()).toBeNull();
  });

  it('only the latest request produces the preview; reject clears it', async () => {
    void service.requestPreview(payload('r1'));
    await service.requestPreview(payload('r2', { maxSegmentGrade: 20, maxSegmentGradeDeg: 20 }));
    await settle();
    expect(service.preview().requestId).toBe('r2');
    expect(service.preview().status).toBe('preview-ready');
    service.reject();
    expect(service.preview().status).toBe('idle');
  });

  it('reports engine failures with contract codes', async () => {
    await service.requestPreview(payload('r1', { destination: { x: 2, y: 2 } }));
    await settle();
    expect(service.preview()).toMatchObject({
      status: 'no-route',
      reasonCode: 'invalid-endpoints',
    });
  });
});
