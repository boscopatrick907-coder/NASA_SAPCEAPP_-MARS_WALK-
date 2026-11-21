import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { MissionService } from './mission.service';
import { testImage } from './fixtures.spec-helper';

describe('MissionService', () => {
  let service: MissionService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MissionService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });
  async function load(markers: object[] = []) {
    const promise = service.initialize();
    http.expectOne((r) => r.url.endsWith('/data/manifest.json')).flush(testImage());
    await Promise.resolve();
    http.expectOne((r) => r.url.endsWith('/data/markers.json')).flush(markers);
    await promise;
  }
  it('loads once and exposes readonly immutable mission records', async () => {
    await load();
    await service.initialize();
    expect(service.dataStatus()).toBe('ready');
    expect(Object.isFrozen(service.image())).toBe(true);
    expect(service.assessment().planarDistanceMeters).toBeNull();
  });
  it('handles missing image data without crashing or fabricating a manifest', async () => {
    const p = service.initialize();
    http
      .expectOne((r) => r.url.endsWith('/data/manifest.json'))
      .flush('', { status: 404, statusText: 'Not Found' });
    await p;
    expect(service.dataStatus()).toBe('unavailable');
    expect(service.image()).toBeNull();
    expect(service.saveRoute().ok).toBe(false);
  });
  it('rejects an invalid manifest', async () => {
    const p = service.initialize();
    http
      .expectOne((r) => r.url.endsWith('/data/manifest.json'))
      .flush({ ...testImage(), width: -1 });
    await p;
    expect(service.dataStatus()).toBe('error');
    expect(service.image()).toBeNull();
  });
  it('keeps usable imagery when science records fail validation', async () => {
    await load([{ id: 'bad' }]);
    expect(service.dataStatus()).toBe('ready');
    expect(service.markers()).toEqual([]);
    expect(service.dataError()).toContain('validated');
  });
  it('ignores inspect mode and invalid points, replaces endpoints and supports undo/clear', async () => {
    await load();
    service.applyMapPoint({ x: 1, y: 2 });
    expect(service.route().start).toBeNull();
    service.setMode('start');
    service.applyMapPoint({ x: Infinity, y: 0 });
    service.applyMapPoint({ x: 101, y: 0 });
    expect(service.canUndo()).toBe(false);
    service.applyMapPoint({ x: 1, y: 2 });
    service.applyMapPoint({ x: 3, y: 4 });
    service.undoRoute();
    expect(service.route().start).toEqual({ x: 1, y: 2 });
    service.setMode('waypoint');
    service.applyMapPoint({ x: 5, y: 6 });
    service.setMode('destination');
    service.applyMapPoint({ x: 10, y: 20 });
    service.clearRoute();
    expect(service.route().start).toBeNull();
    service.undoRoute();
    expect(service.route().waypoints).toEqual([{ x: 5, y: 6 }]);
    expect(service.route().destination).toEqual({ x: 10, y: 20 });
  });
  it('round trips valid route and notes and resets undo on load', async () => {
    await load();
    service.setMode('start');
    service.applyMapPoint({ x: 1, y: 2 });
    expect(service.addObservation(' A note ', null).ok).toBe(true);
    service.clearRoute();
    expect(service.loadRoute().ok).toBe(true);
    expect(service.route().start).toEqual({ x: 1, y: 2 });
    expect(service.observations()[0].text).toBe('A note');
    expect(service.canUndo()).toBe(false);
  });
  it('rejects malformed, mismatched and out-of-bounds stored records without changing state', async () => {
    await load();
    const key = 'marswalk:v1:synthetic-test-only';
    for (const raw of [
      '{',
      JSON.stringify({ schemaVersion: 1, imageRef: 'other' }),
      JSON.stringify({
        schemaVersion: 1,
        imageRef: testImage().imageRef,
        route: { start: { x: 999, y: 0 }, destination: null, waypoints: [] },
        observations: [],
      }),
    ]) {
      localStorage.setItem(key, raw);
      expect(service.loadRoute().ok).toBe(false);
      expect(service.route().start).toBeNull();
    }
  });
  it('reports failed storage and does not publish an unsaved observation', async () => {
    await load();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(service.saveRoute().ok).toBe(false);
    expect(service.addObservation('draft', null).ok).toBe(false);
    expect(service.observations()).toEqual([]);
  });
  it('rejects blank observations and invalid positions', async () => {
    await load();
    expect(service.addObservation('  ', null).ok).toBe(false);
    expect(service.addObservation('text', { x: -1, y: 0 }).ok).toBe(false);
  });
  it('rejects malformed, mismatched and invalid imported missions without changing current work', async () => {
    await load();
    service.setMode('start');
    service.applyMapPoint({ x: 2, y: 3 });
    expect(service.addObservation('Keep this observation', null).ok).toBe(true);
    const beforeRoute = service.route(),
      beforeNotes = service.observations();
    const saved = localStorage.getItem('marswalk:v1:synthetic-test-only');
    const valid = {
      schemaVersion: 1,
      imageRef: testImage().imageRef,
      route: { start: null, destination: null, waypoints: [] },
      observations: [],
    };
    const invalid = [
      '{',
      JSON.stringify({ ...valid, schemaVersion: 2 }),
      JSON.stringify({ ...valid, imageRef: 'another-raster' }),
      JSON.stringify({ ...valid, route: { ...valid.route, start: { x: 101, y: 0 } } }),
      JSON.stringify({
        ...valid,
        observations: [
          {
            id: 'bad',
            imageRef: testImage().imageRef,
            createdAt: 'not-a-date',
            text: 'Invalid date',
            position: null,
          },
        ],
      }),
      JSON.stringify({ ...valid, observations: [...beforeNotes, ...beforeNotes] }),
    ];
    for (const raw of invalid) {
      expect(service.importMission(raw).ok).toBe(false);
      expect(service.route()).toBe(beforeRoute);
      expect(service.observations()).toBe(beforeNotes);
      expect(service.canUndo()).toBe(true);
      expect(localStorage.getItem('marswalk:v1:synthetic-test-only')).toBe(saved);
    }
  });
  it('imports only route and notes, never scientific claims from a file', async () => {
    await load();
    const image = service.image(),
      markers = service.markers();
    service.setMode('waypoint');
    service.applyMapPoint({ x: 1, y: 1 });
    const result = service.importMission(
      JSON.stringify({
        schemaVersion: 1,
        imageRef: testImage().imageRef,
        route: { start: { x: 3, y: 4 }, destination: { x: 6, y: 8 }, waypoints: [] },
        observations: [
          {
            id: 'imported-note',
            imageRef: testImage().imageRef,
            createdAt: '2026-11-14T00:00:00Z',
            text: '<b>Plain note</b>',
            position: null,
          },
        ],
        image: { calibration: { verified: true, metersPerPixel: 999 } },
        markers: [{ id: 'invented' }],
        assessment: { planarDistanceMeters: 1000, terrainStatus: 'safe' },
      }),
    );
    expect(result.ok).toBe(true);
    expect(service.canUndo()).toBe(false);
    expect(service.route().start).toEqual({ x: 3, y: 4 });
    expect(service.observations()[0].text).toBe('<b>Plain note</b>');
    expect(service.image()).toBe(image);
    expect(service.markers()).toBe(markers);
    expect(service.assessment().planarDistanceMeters).toBeNull();
    expect(service.mode()).toBe('waypoint');
    expect(Object.isFrozen(service.route())).toBe(true);
  });
  it('leaves the active mission unchanged when imported records cannot be saved', async () => {
    await load();
    service.setMode('start');
    service.applyMapPoint({ x: 1, y: 2 });
    const route = service.route(),
      notes = service.observations();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const result = service.importMission(
      JSON.stringify({
        schemaVersion: 1,
        imageRef: testImage().imageRef,
        route: { start: { x: 9, y: 9 }, destination: null, waypoints: [] },
        observations: [],
      }),
    );
    expect(result.ok).toBe(false);
    expect(service.route()).toBe(route);
    expect(service.observations()).toBe(notes);
    expect(service.canUndo()).toBe(true);
  });
  it('requires an active image and rejects oversized mission files', async () => {
    expect(service.importMission('{}').ok).toBe(false);
    await load();
    expect(service.importMission(' '.repeat(1024 * 1024 + 1)).ok).toBe(false);
  });
  it('exports versioned mission JSON with provenance and limitations', async () => {
    await load();
    service.setMode('start');
    service.applyMapPoint({ x: 1, y: 2 });
    expect(service.addObservation('Exported note', null).ok).toBe(true);
    let blob: Blob | undefined;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
      blob = value as Blob;
      return 'blob:test';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    service.exportMission();
    const result = JSON.parse(await blob!.text());
    expect(result.schemaVersion).toBe(1);
    expect(result.imageRef).toBe(testImage().imageRef);
    expect(result.image.source).toEqual(testImage().source);
    expect(result.assessment.terrainStatus).toBe('unavailable');
    expect(result.type).toBeUndefined();
    service.clearRoute();
    expect(service.importMission(JSON.stringify(result)).ok).toBe(true);
    expect(service.route().start).toEqual({ x: 1, y: 2 });
    expect(service.observations()[0].text).toBe('Exported note');
    service.clearRoute();
    expect(service.loadRoute().ok).toBe(true);
    expect(service.route().start).toEqual({ x: 1, y: 2 });
  });

  describe('terrain suggestion adapter (contract §8)', () => {
    const path = [
      { x: 1, y: 1 },
      { x: 10, y: 5 },
      { x: 20, y: 30 },
    ];
    const prov = { packageId: 'terrain-x-v1', requestId: 'req-1', maxSegmentGradeDeg: 15 };

    it('replaces the route, records provenance, pushes undo and does not save', async () => {
      await load();
      service.setMode('start');
      service.applyMapPoint({ x: 2, y: 2 });
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      expect(service.replaceRouteFromSuggestion(path, prov).ok).toBe(true);
      expect(service.route()).toEqual({
        start: path[0],
        destination: path[2],
        waypoints: [path[1]],
      });
      expect(service.terrainSuggestion()).toMatchObject({ ...prov, contractVersion: 'terrain-v1' });
      expect(setItem).not.toHaveBeenCalled();
      expect(service.canUndo()).toBe(true);
      service.undoRoute();
      expect(service.route().start).toEqual({ x: 2, y: 2 });
      expect(service.terrainSuggestion()).toBeNull();
    });

    it('rejects bad paths and provenance without changing the route', async () => {
      await load();
      const before = service.route();
      for (const [p, v] of [
        [[path[0]], prov],
        [[...path, { x: 101, y: 1 }], prov],
        [[{ x: NaN, y: 1 }, path[1]], prov],
        [path, { ...prov, packageId: '' }],
        [path, { ...prov, maxSegmentGradeDeg: 90 }],
      ] as const) {
        expect(service.replaceRouteFromSuggestion(p, v).ok).toBe(false);
      }
      expect(service.route()).toBe(before);
      expect(service.terrainSuggestion()).toBeNull();
    });

    it('a manual edit or clear drops the provenance', async () => {
      await load();
      service.replaceRouteFromSuggestion(path, prov);
      service.setMode('waypoint');
      service.applyMapPoint({ x: 50, y: 50 });
      expect(service.terrainSuggestion()).toBeNull();
      service.replaceRouteFromSuggestion(path, prov);
      service.clearRoute();
      expect(service.terrainSuggestion()).toBeNull();
    });

    it('saves, reloads and imports provenance; ordinary saves keep the old envelope shape', async () => {
      await load();
      service.setMode('start');
      service.applyMapPoint({ x: 3, y: 3 });
      expect(service.saveRoute().ok).toBe(true);
      const key = Object.keys(localStorage)[0];
      expect(Object.keys(JSON.parse(localStorage.getItem(key)!))).toEqual([
        'schemaVersion',
        'imageRef',
        'route',
        'observations',
      ]);
      service.replaceRouteFromSuggestion(path, prov);
      expect(service.saveRoute().ok).toBe(true);
      const saved = JSON.parse(localStorage.getItem(key)!);
      expect(saved.terrainSuggestion.packageId).toBe('terrain-x-v1');
      service.clearRoute();
      expect(service.loadRoute().ok).toBe(true);
      expect(service.terrainSuggestion()?.requestId).toBe('req-1');
      expect(service.importMission(JSON.stringify(saved)).ok).toBe(true);
      expect(service.terrainSuggestion()?.requestId).toBe('req-1');
    });

    it('drops forged or malformed provenance on import but keeps the valid route', async () => {
      await load();
      const mission = {
        schemaVersion: 1,
        imageRef: 'synthetic-test-only',
        route: { start: { x: 1, y: 1 }, destination: { x: 2, y: 2 }, waypoints: [] },
        observations: [],
        terrainSuggestion: { contractVersion: 'v1-proposal', packageId: 'p', verified: true },
      };
      expect(service.importMission(JSON.stringify(mission)).ok).toBe(true);
      expect(service.route().destination).toEqual({ x: 2, y: 2 });
      expect(service.terrainSuggestion()).toBeNull();
    });
  });

  describe('map editing (drag and remove)', () => {
    it('drag moves a point with one undo step and clears suggestion provenance', async () => {
      await load();
      service.setMode('start');
      service.applyMapPoint({ x: 1, y: 1 });
      service.setMode('waypoint');
      service.applyMapPoint({ x: 5, y: 5 });
      service.replaceRouteFromSuggestion(
        [
          { x: 1, y: 1 },
          { x: 5, y: 5 },
          { x: 9, y: 9 },
        ],
        { packageId: 'terrain-x-v1', requestId: 'r', maxSegmentGradeDeg: 15 },
      );
      expect(service.moveRoutePoint('waypoint-0', { x: 6, y: 6 }, true)).toBe(true);
      expect(service.moveRoutePoint('waypoint-0', { x: 7, y: 7 }, false)).toBe(true);
      expect(service.route().waypoints[0]).toEqual({ x: 7, y: 7 });
      expect(service.terrainSuggestion()).toBeNull();
      service.undoRoute();
      expect(service.route().waypoints[0]).toEqual({ x: 5, y: 5 });
    });
    it('rejects unknown keys, missing endpoints and points outside the image', async () => {
      await load();
      expect(service.moveRoutePoint('start', { x: 1, y: 1 }, true)).toBe(false);
      service.setMode('start');
      service.applyMapPoint({ x: 1, y: 1 });
      expect(service.moveRoutePoint('start', { x: 1000, y: 1 }, true)).toBe(false);
      expect(service.moveRoutePoint('waypoint-3', { x: 2, y: 2 }, true)).toBe(false);
      expect(service.moveRoutePoint('bogus', { x: 2, y: 2 }, true)).toBe(false);
    });
    it('removes a waypoint with undo', async () => {
      await load();
      service.setMode('waypoint');
      service.applyMapPoint({ x: 3, y: 3 });
      service.applyMapPoint({ x: 4, y: 4 });
      expect(service.removeWaypoint(0)).toBe(true);
      expect(service.route().waypoints).toEqual([{ x: 4, y: 4 }]);
      expect(service.removeWaypoint(5)).toBe(false);
      service.undoRoute();
      expect(service.route().waypoints).toHaveLength(2);
    });
  });
});
