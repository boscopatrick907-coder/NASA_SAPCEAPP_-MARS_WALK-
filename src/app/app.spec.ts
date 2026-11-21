import { EnvironmentService } from './core/environment.service';
import environment from '../../public/data/environment.json';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import manifest from '../../public/data/manifest.json';
import markers from '../../public/data/markers.json';
import { MAX_MISSION_IMPORT_BYTES, MissionService } from './core/mission.service';
import { MapComponent } from './map/map.component';
import { App } from './app';
import { ShellComponent } from './ui/shell/shell.component';

// Isolate Leaflet's renderer in unit tests; the production shell owns the one real map mount.
@Component({ selector: 'app-map', template: '<p>Waiting for a verified local image.</p>' })
class MapMountStub {}

async function loadMission(http: HttpTestingController): Promise<void> {
  http.expectOne((request) => request.url.endsWith('/data/manifest.json')).flush(manifest);
  await Promise.resolve();
  http.expectOne((request) => request.url.endsWith('/data/markers.json')).flush(markers);
}

describe('App integration', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: EnvironmentService,
          useValue: {
            initialize: () => {},
            reload: () => {},
            status: signal('pending'),
            context: signal({ ...environment, reviewStatus: 'pending', readings: [] }),
          },
        },
      ],
    }).overrideComponent(ShellComponent, {
      remove: { imports: [MapComponent] },
      add: { imports: [MapMountStub] },
    });
    await TestBed.compileComponents();
  });

  it('initializes shared data once and mounts one shell-owned map and science component', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    const mission = TestBed.inject(MissionService);
    await loadMission(http);
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0)); // let @defer (on idle) blocks load
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mission.dataStatus()).toBe('ready');
    expect(mission.image()?.imageRef).toBe(manifest.imageRef);
    expect(mission.markers()).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('app-shell')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('app-pwa-panel')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('app-map')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('app-science-context')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('app-exploration-confidence')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('app-image-passport')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('app-environment-context')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('app-mission-briefing')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('measurements withheld');

    const buttons = fixture.nativeElement.querySelectorAll(
      'app-science-context .science-record-button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons).toHaveLength(3);
    expect(mission.markers().every((marker) => marker.position === null)).toBe(true);

    const route = mission.route();
    const mode = mission.mode();
    const notes = mission.observations();
    const image = mission.image();
    buttons.forEach((button, index) => {
      button.click();
      fixture.detectChanges();
      expect(mission.selectedMarkerId()).toBe(markers[index].id);
      expect(mission.markers()[index].position).toBeNull();
      expect(fixture.nativeElement.textContent).toContain(markers[index].name);
      expect(fixture.nativeElement.textContent).toContain(markers[index].finding);
      expect(fixture.nativeElement.textContent).toContain('Unavailable on this image');
      expect(mission.route()).toBe(route);
      expect(mission.mode()).toBe(mode);
      expect(mission.observations()).toBe(notes);
      expect(mission.image()).toBe(image);
    });
    // The idle terrain bootstrap asks for the package index; answer "no package".
    for (const r of http.match((q) => q.url.endsWith('/data/terrain/index.json')))
      r.flush({ schemaVersion: 1, activePackageId: null });
    for (const r of http.match((q) => q.url.endsWith('/data/geology.json'))) r.flush({});
    for (const r of http.match((q) => q.url.endsWith('/data/mineralogy/mineralogy.json')))
      r.flush({});
    http.verify();
  });

  it('keeps the missing-data shell usable and still mounts the map only once', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((request) => request.url.endsWith('/data/manifest.json'))
      .flush('', {
        status: 404,
        statusText: 'Not Found',
      });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-map')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('unavailable');
    expect(fixture.nativeElement.textContent).toContain('Waiting for a verified local image');
    // The idle terrain bootstrap asks for the package index; answer "no package".
    for (const r of http.match((q) => q.url.endsWith('/data/terrain/index.json')))
      r.flush({ schemaVersion: 1, activePackageId: null });
    for (const r of http.match((q) => q.url.endsWith('/data/geology.json'))) r.flush({});
    for (const r of http.match((q) => q.url.endsWith('/data/mineralogy/mineralogy.json')))
      r.flush({});
    http.verify();
  });

  it('makes mission import and export reachable and warns before replacement', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    await loadMission(http);
    await fixture.whenStable();
    fixture.detectChanges();

    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>,
    );
    const transferTab = tabs.find((tab) => tab.textContent?.includes('Share'));
    expect(transferTab).toBeTruthy();
    transferTab!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Import replaces the current route and saved notes',
    );
    expect(fixture.nativeElement.querySelector('#mission-file')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Export mission');
    expect(fixture.nativeElement.textContent).toContain('Import selected mission');
    // The idle terrain bootstrap asks for the package index; answer "no package".
    for (const r of http.match((q) => q.url.endsWith('/data/terrain/index.json')))
      r.flush({ schemaVersion: 1, activePackageId: null });
    for (const r of http.match((q) => q.url.endsWith('/data/geology.json'))) r.flush({});
    for (const r of http.match((q) => q.url.endsWith('/data/mineralogy/mineralogy.json')))
      r.flush({});
    http.verify();
  });

  it('reads a selected mission and shows the canonical import result', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    await loadMission(http);
    await fixture.whenStable();

    const raw = JSON.stringify({
      schemaVersion: 1,
      imageRef: manifest.imageRef,
      route: { start: { x: 30, y: 40 }, destination: null, waypoints: [] },
      observations: [],
    });
    await fixture.componentInstance.selectMissionFile({
      target: { files: [{ name: 'mission.json', size: raw.length, text: async () => raw }] },
    } as unknown as Event);
    fixture.componentInstance.importSelectedMission();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Mission imported and saved on this device.',
    );
    expect(TestBed.inject(MissionService).route().start).toEqual({ x: 30, y: 40 });
    // The idle terrain bootstrap asks for the package index; answer "no package".
    for (const r of http.match((q) => q.url.endsWith('/data/terrain/index.json')))
      r.flush({ schemaVersion: 1, activePackageId: null });
    for (const r of http.match((q) => q.url.endsWith('/data/geology.json'))) r.flush({});
    for (const r of http.match((q) => q.url.endsWith('/data/mineralogy/mineralogy.json')))
      r.flush({});
    http.verify();
  });

  it('rejects a mismatched image file with the actual service feedback', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    await loadMission(http);
    await fixture.whenStable();
    const mission = TestBed.inject(MissionService);
    const routeBefore = mission.route();
    const raw = JSON.stringify({
      schemaVersion: 1,
      imageRef: 'another-image-version',
      route: { start: null, destination: null, waypoints: [] },
      observations: [],
    });

    await fixture.componentInstance.selectMissionFile({
      target: {
        files: [{ name: 'different-image.json', size: raw.length, text: async () => raw }],
      },
    } as unknown as Event);
    fixture.componentInstance.importSelectedMission();

    expect(fixture.componentInstance.transferMessage()).toContain('image');
    expect(mission.route()).toBe(routeBefore);
    // The idle terrain bootstrap asks for the package index; answer "no package".
    for (const r of http.match((q) => q.url.endsWith('/data/terrain/index.json')))
      r.flush({ schemaVersion: 1, activePackageId: null });
    for (const r of http.match((q) => q.url.endsWith('/data/geology.json'))) r.flush({});
    for (const r of http.match((q) => q.url.endsWith('/data/mineralogy/mineralogy.json')))
      r.flush({});
    http.verify();
  });

  it('enforces the 1 MiB file limit before reading', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((request) => request.url.endsWith('/data/manifest.json'))
      .flush('', {
        status: 404,
        statusText: 'Not Found',
      });
    const text = async () => {
      throw new Error('Oversized file should not be read');
    };
    await fixture.componentInstance.selectMissionFile({
      target: {
        files: [{ name: 'oversized.json', size: MAX_MISSION_IMPORT_BYTES + 1, text }],
      },
    } as unknown as Event);
    expect(fixture.componentInstance.transferMessage()).toBe(
      'Mission files must be 1 MiB or smaller.',
    );
    expect(fixture.componentInstance.readingMission()).toBe(false);
    // The idle terrain bootstrap asks for the package index; answer "no package".
    for (const r of http.match((q) => q.url.endsWith('/data/terrain/index.json')))
      r.flush({ schemaVersion: 1, activePackageId: null });
    for (const r of http.match((q) => q.url.endsWith('/data/geology.json'))) r.flush({});
    for (const r of http.match((q) => q.url.endsWith('/data/mineralogy/mineralogy.json')))
      r.flush({});
    http.verify();
  });

  it('keeps a newer file selection when an older file finishes reading later', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((request) => request.url.endsWith('/data/manifest.json'))
      .flush('', {
        status: 404,
        statusText: 'Not Found',
      });
    let finishOld!: (raw: string) => void;
    const old = app.selectMissionFile({
      target: {
        files: [
          {
            name: 'old.json',
            size: 2,
            text: () => new Promise<string>((resolve) => (finishOld = resolve)),
          },
        ],
      },
    } as unknown as Event);
    await app.selectMissionFile({
      target: { files: [{ name: 'new.json', size: 2, text: async () => '{}' }] },
    } as unknown as Event);
    finishOld('old');
    await old;

    expect(app.missionFileName()).toBe('new.json');
    expect(app.readingMission()).toBe(false);
    // The idle terrain bootstrap asks for the package index; answer "no package".
    for (const r of http.match((q) => q.url.endsWith('/data/terrain/index.json')))
      r.flush({ schemaVersion: 1, activePackageId: null });
    for (const r of http.match((q) => q.url.endsWith('/data/geology.json'))) r.flush({});
    for (const r of http.match((q) => q.url.endsWith('/data/mineralogy/mineralogy.json')))
      r.flush({});
    http.verify();
  });
});
