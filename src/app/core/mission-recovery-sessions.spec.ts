import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { MissionService } from './mission.service';
import { testImage } from './fixtures.spec-helper';
import { ImageManifest } from './models';

/*
 * Multi-session mission recovery (Takou release QA, Package 2). Complements the
 * coordinator's mission-recovery.spec.ts (startup restore) with save-after-restart,
 * export equality, failed-save and storage-failure paths.
 *
 * Every "session" below is a brand-new TestBed and MissionService that shares only
 * localStorage with the previous one. That models closing the whole browser/app process
 * and reopening the same origin and profile. Data is the synthetic test fixture only.
 *
 * B1 (saving before Load Route erased saved notes) was reproduced on 2626a6b/842ad3d and is
 * fixed by the startup restore in b28f6ad; the tests marked "B1 fixed" guard that fix.
 * B2 (a save after a failed restore overwrote the unreadable record) is fixed by the
 * persistence guard in 38ad299; the "B2 fixed" test guards that fix.
 * See docs/qa/TAKOU_RELEASE_BLOCKERS.md.
 */

const KEY = `marswalk:v1:${testImage().imageRef}`;
const START = { x: 10, y: 20 };
const WAYPOINT = { x: 30, y: 40 };
const DESTINATION = { x: 90, y: 70 };

async function openSession(image: ImageManifest = testImage()): Promise<MissionService> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const service = TestBed.inject(MissionService);
  const http = TestBed.inject(HttpTestingController);
  const ready = service.initialize();
  http.expectOne((r) => r.url.endsWith('/data/manifest.json')).flush(image);
  await Promise.resolve();
  http.expectOne((r) => r.url.endsWith('/data/markers.json')).flush([]);
  await ready;
  http.verify();
  return service;
}

function drawRoute(service: MissionService): void {
  service.setMode('start');
  service.applyMapPoint(START);
  service.setMode('waypoint');
  service.applyMapPoint(WAYPOINT);
  service.setMode('destination');
  service.applyMapPoint(DESTINATION);
  service.setMode('inspect');
}

function stored(): { imageRef: string; route: unknown; observations: { text: string }[] } {
  return JSON.parse(localStorage.getItem(KEY) ?? 'null');
}

async function exportPayload(service: MissionService) {
  let blob: Blob | undefined;
  vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
    blob = value as Blob;
    return 'blob:mission-recovery-test';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  service.exportMission();
  return JSON.parse(await blob!.text());
}

const texts = (service: MissionService) => service.observations().map((n) => n.text);

describe('Mission recovery across fresh app sessions', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('restores the exact saved mission at startup and exports it identically', async () => {
    const first = await openSession();
    drawRoute(first);
    const note = `TAKOU-RECOVERY-${crypto.randomUUID()}`;
    expect(first.addObservation(note, START)).toEqual({ ok: true });
    expect(first.saveRoute()).toEqual({ ok: true });
    const before = await exportPayload(first);
    const raw = localStorage.getItem(KEY);

    const second = await openSession();
    expect(second).not.toBe(first);
    expect(second.route()).toEqual(first.route());
    expect(second.observations()).toEqual(first.observations());
    expect(second.canUndo()).toBe(false);
    expect(localStorage.getItem(KEY)).toBe(raw);

    const after = await exportPayload(second);
    expect(after.imageRef).toBe(before.imageRef);
    expect(after.route).toEqual(before.route);
    expect(after.observations).toEqual(before.observations);
    // An explicit Load Route afterwards is harmless and returns the same mission.
    expect(second.loadRoute()).toEqual({ ok: true });
    expect(second.observations()).toEqual(first.observations());
  });

  it('persists a successfully saved note (and the current route) without pressing Save Route', async () => {
    const first = await openSession();
    first.setMode('start');
    first.applyMapPoint(START);
    expect(first.addObservation('Saved without Save Route', null).ok).toBe(true);

    const second = await openSession();
    expect(texts(second)).toEqual(['Saved without Save Route']);
    expect(second.route().start).toEqual(START);
  });

  it('keeps the previously saved mission when a later note save fails', async () => {
    const first = await openSession();
    expect(first.addObservation('Saved before failure', null).ok).toBe(true);
    const raw = localStorage.getItem(KEY);
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const failed = first.addObservation('Not saved', null);
    expect(failed.ok).toBe(false);
    expect(failed.error).toMatch(/Keep your draft|not replaced/);
    expect(texts(first)).toEqual(['Saved before failure']);
    setItem.mockRestore();
    expect(localStorage.getItem(KEY)).toBe(raw);

    const second = await openSession();
    expect(texts(second)).toEqual(['Saved before failure']);
  });

  it('B1 fixed: a note saved right after restart keeps the earlier notes and route', async () => {
    const first = await openSession();
    drawRoute(first);
    expect(first.addObservation('Earlier note A', null).ok).toBe(true);
    expect(first.saveRoute().ok).toBe(true);
    const savedRoute = first.route();

    const second = await openSession();
    // No Load Route pressed: the user writes a new note straight away.
    expect(second.addObservation('New note B', null)).toEqual({ ok: true });

    const third = await openSession();
    expect(texts(third)).toEqual(['Earlier note A', 'New note B']);
    expect(third.route()).toEqual(savedRoute);
  });

  it('B1 fixed: Save Route right after restart keeps the saved notes', async () => {
    const first = await openSession();
    drawRoute(first);
    expect(first.addObservation('Earlier note A', null).ok).toBe(true);

    const second = await openSession();
    second.setMode('start');
    second.applyMapPoint({ x: 5, y: 5 });
    expect(second.saveRoute()).toEqual({ ok: true });

    const third = await openSession();
    expect(texts(third)).toEqual(['Earlier note A']);
    expect(third.route().start).toEqual({ x: 5, y: 5 });
    expect(third.route().destination).toEqual(DESTINATION);
  });

  it('reports a corrupt saved record without changing state or deleting the stored bytes', async () => {
    localStorage.setItem(KEY, '{"schemaVersion":1,"imageRef":');
    const session = await openSession();
    expect(session.recoveryMessage()).toContain('not deleted');
    session.setMode('start');
    session.applyMapPoint(START);
    const route = session.route();
    const result = session.loadRoute();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('could not be read');
    expect(session.route()).toBe(route);
    expect(session.observations()).toEqual([]);
    expect(localStorage.getItem(KEY)).toBe('{"schemaVersion":1,"imageRef":');
  });

  it('B2 fixed: saves after a failed restore cannot overwrite the unreadable record', async () => {
    const unreadable = JSON.stringify({
      schemaVersion: 1,
      imageRef: testImage().imageRef,
      route: { start: { x: 999, y: 0 }, destination: null, waypoints: [] },
      observations: [
        {
          id: 'kept-for-manual-recovery',
          imageRef: testImage().imageRef,
          createdAt: '2026-11-15T00:00:00Z',
          text: 'Hand-recoverable note',
          position: null,
        },
      ],
    });
    localStorage.setItem(KEY, unreadable);
    const session = await openSession();
    // Startup restore fails and says the saved data was not deleted...
    expect(session.recoveryMessage()).toContain('not deleted');
    expect(localStorage.getItem(KEY)).toBe(unreadable);

    // B2 fixed in 38ad299: saves are refused while an unreadable record exists.
    expect(session.addObservation('New note', null).ok).toBe(false);
    session.setMode('start');
    session.applyMapPoint(START);
    expect(session.saveRoute().ok).toBe(false);
    expect(stored().observations.map((n) => n.text)).toEqual(['Hand-recoverable note']);
    expect(localStorage.getItem(KEY)).toBe(unreadable);
  });

  it('reports unavailable storage on load and save without publishing unsaved notes', async () => {
    const session = await openSession();
    drawRoute(session);
    const route = session.route();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const load = session.loadRoute();
    expect(load.ok).toBe(false);
    expect(load.error).toContain('Existing state is unchanged');
    expect(session.route()).toBe(route);
    const save = session.saveRoute();
    expect(save.ok).toBe(false);
    expect(save.error).toContain('Export your mission');
    expect(session.addObservation('Unsaved note', null).ok).toBe(false);
    expect(session.observations()).toEqual([]);
  });

  it('keeps missions for a different image reference separate and untouched', async () => {
    const first = await openSession();
    expect(first.addObservation('Belongs to the synthetic image', null).ok).toBe(true);
    const raw = localStorage.getItem(KEY);

    const other = await openSession({ ...testImage(), imageRef: 'synthetic-test-only-v2' });
    expect(other.observations()).toEqual([]);
    expect(other.recoveryMessage()).toBeNull();
    const result = other.loadRoute();
    expect(result).toEqual({ ok: false, error: 'No saved mission for this image.' });
    expect(localStorage.getItem(KEY)).toBe(raw);
  });
});
