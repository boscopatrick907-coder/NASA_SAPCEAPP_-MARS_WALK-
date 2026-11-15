import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionService } from '../core/mission.service';
import type { ImageManifest, Observation, Route, ScienceMarker } from '../core/models';
import { MissionBriefingComponent } from './mission-briefing.component';

const makeImage = (overrides: Partial<ImageManifest> = {}): ImageManifest => ({
  schemaVersion: 1,
  imageRef: 'hirise-mro-pia26306-boxwork-2048x1042-v1',
  assetPath: 'data/imagery/pia26306.jpg',
  width: 2048,
  height: 1042,
  coordinateSystem: 'image-pixels-bottom-left',
  source: {
    title: 'PIA26306: Boxwork on Mount Sharp',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA26306',
    credit: 'NASA/JPL-Caltech/University of Arizona',
  },
  observationDate: '2006-12-10',
  coverageStatus: 'regional-context',
  limitations: ['No metric scale verified.'],
  calibration: {
    verified: false,
    metersPerPixel: null,
    sourceUrl: null,
    method: null,
  },
  ...overrides,
});

const makeMarker = (overrides: Partial<ScienceMarker> = {}): ScienceMarker => ({
  id: 'curiosity-mount-sharp-boxwork',
  name: 'Mount Sharp Boxwork Campaign',
  imageRef: 'hirise-mro-pia26306-boxwork-2048x1042-v1',
  position: null,
  positionStatus: 'unavailable',
  instrument: 'MAHLI / APXS / HiRISE',
  date: '2026-02-09',
  finding: 'Scientists interpret boxwork ridges as ancient groundwater-deposited minerals.',
  evidenceType: 'interpreted',
  source: {
    title: 'Curiosity Blog Sols 4804-4811',
    url: 'https://science.nasa.gov/blog/curiosity-blog-sols-4804-4811-kicking-off-the-final-phase-of-boxwork-exploration/',
    credit: 'NASA/JPL-Caltech',
  },
  limitations: ['Exact pixel tie-points are unavailable.'],
  ...overrides,
});

describe('MissionBriefingComponent', () => {
  let fixture: ComponentFixture<MissionBriefingComponent>;
  let component: MissionBriefingComponent;

  let imageSig = signal<ImageManifest | null>(makeImage());
  let markersSig = signal<readonly ScienceMarker[]>([makeMarker()]);
  let routeSig = signal<Route>({ start: null, destination: null, waypoints: [] });
  let selectedMarkerIdSig = signal<string | null>(null);
  let observationsSig = signal<readonly Observation[]>([]);
  let dataStatusSig = signal<'loading' | 'ready' | 'unavailable' | 'error'>('ready');
  let dataErrorSig = signal<string | null>(null);

  let mockMission: Record<string, unknown>;
  const originalClipboard = navigator.clipboard;

  beforeEach(async () => {
    imageSig = signal<ImageManifest | null>(makeImage());
    markersSig = signal<readonly ScienceMarker[]>([
      makeMarker(),
      makeMarker({
        id: 'curiosity-vera-rubin-ridge-hematite',
        name: 'Vera Rubin Ridge Hematite Context',
        evidenceType: 'derived',
      }),
    ]);
    routeSig = signal<Route>({ start: null, destination: null, waypoints: [] });
    selectedMarkerIdSig = signal<string | null>(null);
    observationsSig = signal<readonly Observation[]>([]);
    dataStatusSig = signal<'loading' | 'ready' | 'unavailable' | 'error'>('ready');
    dataErrorSig = signal<string | null>(null);

    mockMission = {
      image: imageSig.asReadonly(),
      markers: markersSig.asReadonly(),
      route: routeSig.asReadonly(),
      selectedMarkerId: selectedMarkerIdSig.asReadonly(),
      observations: observationsSig.asReadonly(),
      dataStatus: dataStatusSig.asReadonly(),
      dataError: dataErrorSig.asReadonly(),
      setMode: vi.fn(),
      setLayer: vi.fn(),
      selectMarker: vi.fn(),
      applyMapPoint: vi.fn(),
      undoRoute: vi.fn(),
      clearRoute: vi.fn(),
      saveRoute: vi.fn(),
      loadRoute: vi.fn(),
      addObservation: vi.fn(),
      exportMission: vi.fn(),
      importMission: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MissionBriefingComponent],
      providers: [{ provide: MissionService, useValue: mockMission }],
    }).compileComponents();

    fixture = TestBed.createComponent(MissionBriefingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
  });

  it('renders the boxwork mission question, MRO/Curiosity sources, and explicit spatial limits', () => {
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain(
      "What evidence supports the interpretation that ancient groundwater helped form Mount Sharp's boxwork?",
    );
    expect(text).toContain('PIA26306: Boxwork on Mount Sharp');
    expect(text).toContain('curiosity-mount-sharp-boxwork');
    expect(text).toContain('Vera Rubin Ridge');
    expect(text).toContain('No verified metric scale');
  });

  it('tracks route transitions truthfully only when both start and destination exist', () => {
    expect(component.checklist().startAndDestination).toBe(false);

    routeSig.set({ start: { x: 100, y: 120 }, destination: null, waypoints: [] });
    fixture.detectChanges();
    expect(component.checklist().startAndDestination).toBe(false);

    routeSig.set({
      start: { x: 100, y: 120 },
      destination: { x: 400, y: 500 },
      waypoints: [{ x: 250, y: 300 }],
    });
    fixture.detectChanges();
    expect(component.checklist().startAndDestination).toBe(true);
  });

  it('reflects record selection and resets if the selected record is removed or belongs to a stale imageRef', () => {
    expect(component.checklist().markerSelected).toBe(false);

    selectedMarkerIdSig.set('curiosity-mount-sharp-boxwork');
    fixture.detectChanges();
    expect(component.checklist().markerSelected).toBe(true);

    // Stale imageRef mismatch
    imageSig.set(makeImage({ imageRef: 'different-image-ref-v2' }));
    fixture.detectChanges();
    expect(component.checklist().markerSelected).toBe(false);
    expect(component.selectedRecord()).toBeNull();

    // Restore matching imageRef, then remove record from markers()
    imageSig.set(makeImage());
    fixture.detectChanges();
    expect(component.checklist().markerSelected).toBe(true);

    markersSig.set([makeMarker({ id: 'other-record' })]);
    fixture.detectChanges();
    expect(component.checklist().markerSelected).toBe(false);
  });

  it('reports observation presence without claiming scientific verification or completion', () => {
    expect(component.checklist().observationPresent).toBe(false);

    observationsSig.set([
      {
        id: 'obs-1',
        imageRef: 'hirise-mro-pia26306-boxwork-2048x1042-v1',
        createdAt: '2026-11-15T12:00:00.000Z',
        text: 'Imported or existing observation note',
        position: null,
      },
    ]);
    fixture.detectChanges();
    expect(component.checklist().observationPresent).toBe(true);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('may include preexisting or imported notes');
    expect(text).toContain('do not confirm that a mission has been saved');
  });

  it('explains loading, error, missing-image, and empty-record states without inventing readiness', () => {
    dataStatusSig.set('loading');
    imageSig.set(null);
    markersSig.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading mission imagery metadata');
    expect(fixture.nativeElement.textContent).toContain('No active MRO/HiRISE image source');
    expect(fixture.nativeElement.textContent).toContain('No contextual science records');

    dataStatusSig.set('error');
    dataErrorSig.set('Manifest HTTP 500');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Manifest HTTP 500');
  });

  it('permits only safe HTTPS source links and performs zero mission or storage mutations', () => {
    imageSig.set(
      makeImage({
        source: {
          title: 'Unsafe Link',
          url: 'javascript:alert(1)',
          credit: 'Test',
        },
      }),
    );
    fixture.detectChanges();
    expect(component.imageInfo()?.safeUrl).toBeNull();
    const anchors = fixture.nativeElement.querySelectorAll('a');
    for (const a of Array.from(anchors) as HTMLAnchorElement[]) {
      expect(a.getAttribute('href')?.startsWith('https://')).toBe(true);
    }

    expect(mockMission['setMode']).not.toHaveBeenCalled();
    expect(mockMission['selectMarker']).not.toHaveBeenCalled();
    expect(mockMission['saveRoute']).not.toHaveBeenCalled();
    expect(mockMission['addObservation']).not.toHaveBeenCalled();
  });

  it('generates deterministic field observation template with required headings, honest placeholders, and safe URL fallback', () => {
    // 1. No selection, active image
    let tpl = component.observationTemplate();
    expect(tpl).toContain('Mission question:');
    expect(tpl).toContain('What I can see in this image:');
    expect(tpl).toContain('What the selected source reports:');
    expect(tpl).toContain('My interpretation/question:');
    expect(tpl).toContain('What remains uncertain:');
    expect(tpl).toContain('Active imageRef: hirise-mro-pia26306-boxwork-2048x1042-v1');
    expect(tpl).toContain(
      'Selected contextual record: [None selected — choose a record in Confidence & Data]',
    );

    // 2. Valid selection with HTTPS URL
    selectedMarkerIdSig.set('curiosity-mount-sharp-boxwork');
    fixture.detectChanges();
    tpl = component.observationTemplate();
    expect(tpl).toContain(
      'Selected contextual record: Mount Sharp Boxwork Campaign (curiosity-mount-sharp-boxwork) — https://science.nasa.gov/blog/curiosity-blog-sols-4804-4811-kicking-off-the-final-phase-of-boxwork-exploration/ [Regional context; position: unavailable — not tied to a route coordinate]',
    );

    // 3. Unsafe source URL rendered as safe fallback text
    markersSig.set([
      makeMarker({
        source: {
          title: 'Unsafe Source',
          url: 'http://insecure.example.com/blog',
          credit: 'Test',
        },
      }),
    ]);
    fixture.detectChanges();
    tpl = component.observationTemplate();
    expect(tpl).toContain('Source URL unavailable or non-HTTPS');
    expect(tpl).not.toContain('http://insecure.example.com/blog');

    // 4. Missing image state
    imageSig.set(null);
    fixture.detectChanges();
    tpl = component.observationTemplate();
    expect(tpl).toContain('Active imageRef: [No verified image loaded]');
  });

  it('copies observation template on user click and handles unavailable or rejected clipboard without mutating state', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    const readTextMock = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock, readText: readTextMock },
    });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const copyBtn = fixture.nativeElement.querySelector('.copy-template-btn') as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();

    await component.copyObservationTemplate();
    fixture.detectChanges();

    expect(writeTextMock).toHaveBeenCalledWith(component.observationTemplate());
    expect(readTextMock).not.toHaveBeenCalled();
    expect(component.copyStatus()).toBe('copied');
    expect(component.copyMessage()).toContain('Template copied to clipboard');

    // Simulate permission denied
    writeTextMock.mockRejectedValueOnce(new Error('NotAllowedError'));
    await component.copyObservationTemplate();
    fixture.detectChanges();
    expect(component.copyStatus()).toBe('error');
    expect(component.copyMessage()).toContain('Clipboard permission was denied');

    // Simulate unavailable clipboard
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    await component.copyObservationTemplate();
    fixture.detectChanges();
    expect(component.copyStatus()).toBe('error');
    expect(component.copyMessage()).toContain('Clipboard access is unavailable');

    // Readonly textarea remains intact and selectable in all states
    const textarea = fixture.nativeElement.querySelector(
      '#briefing-observation-template',
    ) as HTMLTextAreaElement;
    expect(textarea.readOnly).toBe(true);
    expect(textarea.value).toBe(component.observationTemplate());

    // Zero mission or storage mutations
    expect(mockMission['addObservation']).not.toHaveBeenCalled();
    expect(mockMission['saveRoute']).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
