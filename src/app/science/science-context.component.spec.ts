import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Mock, vi } from 'vitest';
import { MissionService } from '../core/mission.service';
import type {
  ImageManifest,
  LayerId,
  Mode,
  Observation,
  Route,
  ScienceMarker,
} from '../core/models';
import { ScienceContextComponent } from './science-context.component';

const imageFixture = (): ImageManifest => ({
  schemaVersion: 1,
  imageRef: 'synthetic-image-v1',
  assetPath: 'data/imagery/synthetic.jpg',
  width: 2048,
  height: 1042,
  coordinateSystem: 'image-pixels-bottom-left',
  source: {
    title: 'Synthetic context mosaic',
    url: 'https://example.test/mosaic',
    credit: 'Synthetic Test Credit',
  },
  observationDate: null,
  coverageStatus: 'regional-context',
  limitations: ['Synthetic test fixture only.'],
  calibration: { verified: false, metersPerPixel: null, sourceUrl: null, method: null },
});

const makeRecord = (overrides: Partial<ScienceMarker> = {}): ScienceMarker => ({
  id: 'synthetic-rec-1',
  name: 'Synthetic Mineral Ridge',
  imageRef: 'synthetic-image-v1',
  position: null,
  positionStatus: 'unavailable',
  instrument: 'ChemCam',
  date: '2025-01-15',
  finding: 'Synthetic contextual finding describing mineral fractures.',
  evidenceType: 'measured',
  source: {
    title: 'Synthetic Science Note',
    url: 'https://example.test/science/rec-1',
    credit: 'Synthetic Science Team',
  },
  limitations: ['Contextual regional record without local pixel coordinates.'],
  ...overrides,
});

const threeUnlocatedRecords = (): ScienceMarker[] => [
  makeRecord({
    id: 'synthetic-rec-1',
    name: 'Synthetic Sulfate Zone',
    evidenceType: 'measured',
    instrument: 'APXS',
    date: '2024-06-01',
    finding: 'Synthetic elevated sulfate signature detected across fracture fill.',
    source: {
      title: 'Synthetic APXS Report',
      url: 'https://example.test/apxs',
      credit: 'Synthetic Lab A',
    },
    limitations: ['Point measurement outside high-res AOI.', 'No DEM elevation tie.'],
  }),
  makeRecord({
    id: 'synthetic-rec-2',
    name: 'Synthetic Boxwork Fracture Pattern',
    evidenceType: 'interpreted',
    instrument: 'HiRISE',
    date: '2023-11-20',
    finding: 'Synthetic polygonal ridge network interpreted as mineral-filled fractures.',
    source: {
      title: 'Synthetic Orbital Survey',
      url: 'https://example.test/orbital',
      credit: 'Synthetic Lab B',
    },
    limitations: ['Orbital resolution limits small-scale obstacle inference.'],
  }),
  makeRecord({
    id: 'synthetic-rec-3',
    name: 'Synthetic Clay Transition',
    evidenceType: 'derived',
    instrument: 'CRISM',
    date: '2022-08-10',
    finding: 'Synthetic spectral trend consistent with hydrated clay-bearing strata.',
    source: {
      title: 'Synthetic Spectral Summary',
      url: 'https://example.test/spectral',
      credit: 'Synthetic Lab C',
    },
    limitations: ['Derived regional average.'],
  }),
];

describe('ScienceContextComponent', () => {
  let component: ScienceContextComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ScienceContextComponent>>;
  let state: {
    image: ReturnType<typeof signal<ImageManifest | null>>;
    markers: ReturnType<typeof signal<readonly ScienceMarker[]>>;
    selectedMarkerId: ReturnType<typeof signal<string | null>>;
    dataStatus: ReturnType<typeof signal<'loading' | 'ready' | 'unavailable' | 'error'>>;
    dataError: ReturnType<typeof signal<string | null>>;
    route: ReturnType<typeof signal<Route>>;
    mode: ReturnType<typeof signal<Mode>>;
    layers: ReturnType<typeof signal<Readonly<Record<LayerId, boolean>>>>;
    observations: ReturnType<typeof signal<readonly Observation[]>>;
  };
  let selectMarker: Mock<(id: string | null) => void>;
  let initialize: Mock<() => Promise<void>>;
  let missionMock: Partial<MissionService>;

  beforeEach(() => {
    state = {
      image: signal<ImageManifest | null>(imageFixture()),
      markers: signal<readonly ScienceMarker[]>(threeUnlocatedRecords()),
      selectedMarkerId: signal<string | null>(null),
      dataStatus: signal<'loading' | 'ready' | 'unavailable' | 'error'>('ready'),
      dataError: signal<string | null>(null),
      route: signal<Route>({
        start: { x: 10, y: 20 },
        destination: { x: 200, y: 300 },
        waypoints: [{ x: 100, y: 150 }],
      }),
      mode: signal<Mode>('waypoint'),
      layers: signal<Readonly<Record<LayerId, boolean>>>({
        imagery: true,
        markers: true,
        grid: false,
        coverage: true,
      }),
      observations: signal<readonly Observation[]>([
        {
          id: 'obs-1',
          imageRef: 'synthetic-image-v1',
          createdAt: '2026-01-01T00:00:00.000Z',
          text: 'Synthetic field note.',
          position: null,
        },
      ]),
    };

    selectMarker = vi.fn<(id: string | null) => void>((id) => state.selectedMarkerId.set(id));
    initialize = vi.fn<() => Promise<void>>(async () => undefined);

    missionMock = {
      image: state.image.asReadonly(),
      markers: state.markers.asReadonly(),
      selectedMarkerId: state.selectedMarkerId.asReadonly(),
      dataStatus: state.dataStatus.asReadonly(),
      dataError: state.dataError.asReadonly(),
      route: state.route.asReadonly(),
      mode: state.mode.asReadonly(),
      layers: state.layers.asReadonly(),
      observations: state.observations.asReadonly(),
      selectMarker,
      initialize,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: MissionService, useValue: missionMock }],
    });

    fixture = TestBed.createComponent(ScienceContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the three contextual records with distinct evidence and image-location labels', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      'ul.science-record-list button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons).toHaveLength(3);
    expect(initialize).not.toHaveBeenCalled();

    buttons.forEach((button) => {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.textContent).toContain('Regional context');
    });

    expect(buttons[0].textContent).toContain('Synthetic Sulfate Zone');
    expect(buttons[0].textContent).toContain('measured');
    expect(buttons[1].textContent).toContain('Synthetic Boxwork Fracture Pattern');
    expect(buttons[1].textContent).toContain('interpreted');
    expect(buttons[2].textContent).toContain('Synthetic Clay Transition');
    expect(buttons[2].textContent).toContain('derived');

    const contextNote = fixture.nativeElement.querySelector('.science-context-note') as HTMLElement;
    expect(contextNote.textContent).toContain('Evidence category describes the record');
    expect(contextNote.textContent).toContain('position status says whether it is located');
    expect(contextNote.textContent).toContain('it is not a route stop');
    expect(contextNote.textContent).toContain('place route points separately on the map');
  });

  it('selects a record, displays complete details and limitations, and clears selection', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[0].click();
    fixture.detectChanges();

    expect(selectMarker).toHaveBeenCalledWith('synthetic-rec-1');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].classList.contains('selected')).toBe(true);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');

    const details = fixture.nativeElement.querySelector(
      'article.science-record-details',
    ) as HTMLElement;
    expect(details).not.toBeNull();
    expect(details.getAttribute('aria-live')).toBe('polite');
    expect(details.textContent).toContain('Synthetic Sulfate Zone');
    expect(details.textContent).toContain(
      'Synthetic elevated sulfate signature detected across fracture fill.',
    );
    expect(details.textContent).toContain('measured');
    expect(details.textContent).toContain('Record-level evidence category');
    expect(details.textContent).toContain(
      'Read the finding for any source-specific observations, derivations, and interpretations.',
    );
    expect(details.textContent).toContain('APXS');
    expect(details.textContent).toContain('2024-06-01');
    expect(details.textContent).toContain(
      'Unavailable on this image — regional context only, with no point to use as a route stop. Choose a route point on the map separately.',
    );
    expect(details.textContent).toContain('Synthetic Lab A');
    expect(details.textContent).toContain('External source link requires network connectivity.');
    expect(details.textContent).toContain('Point measurement outside high-res AOI.');
    expect(details.textContent).toContain('No DEM elevation tie.');

    const link = details.querySelector('a') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://example.test/apxs');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.textContent?.trim()).toBe('Synthetic APXS Report');

    const clearBtn = details.querySelector('button.clear-selection-button') as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.getAttribute('type')).toBe('button');

    clearBtn.click();
    fixture.detectChanges();

    expect(selectMarker).toHaveBeenLastCalledWith(null);
    expect(fixture.nativeElement.querySelector('article.science-record-details')).toBeNull();

    const noSelection = fixture.nativeElement.querySelector(
      'p.science-no-selection',
    ) as HTMLElement;
    expect(noSelection).not.toBeNull();
    expect(noSelection.getAttribute('role')).toBe('status');
    expect(noSelection.textContent).toContain(
      'Select a science record to view its finding, source, instrument attribution, and limitations.',
    );
  });

  it('navigates records in filtered order, disables at both ends, and leaves mission state unchanged', () => {
    const root = fixture.nativeElement as HTMLElement;
    const initialRoute = structuredClone(missionMock.route!());
    const initialMode = missionMock.mode!();
    const initialLayers = structuredClone(missionMock.layers!());
    const initialObservations = structuredClone(missionMock.observations!());
    const recordButtons = root.querySelectorAll(
      'button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(root.querySelector('.record-navigation')).toBeNull();
    expect(root.querySelector('.science-no-selection')?.textContent).toContain(
      'Select a science record to view its finding',
    );

    recordButtons[0].click();
    fixture.detectChanges();

    let previous = root.querySelector(
      'button[aria-label="Previous science record"]',
    ) as HTMLButtonElement;
    let next = root.querySelector('button[aria-label="Next science record"]') as HTMLButtonElement;
    let position = root.querySelector('.record-navigation-position') as HTMLElement;

    expect(previous.tagName).toBe('BUTTON');
    expect(previous.type).toBe('button');
    expect(next.type).toBe('button');
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    expect(position.getAttribute('role')).toBe('status');
    expect(position.textContent?.trim()).toBe('Record 1 of 3 matching records');

    next.click();
    fixture.detectChanges();
    expect(state.selectedMarkerId()).toBe('synthetic-rec-2');
    expect(root.querySelector('.record-navigation-position')?.textContent?.trim()).toBe(
      'Record 2 of 3 matching records',
    );

    previous = root.querySelector('button[aria-label="Previous science record"]')!;
    next = root.querySelector('button[aria-label="Next science record"]')!;
    expect(previous.disabled).toBe(false);
    expect(next.disabled).toBe(false);

    next.click();
    fixture.detectChanges();
    expect(state.selectedMarkerId()).toBe('synthetic-rec-3');
    expect(root.querySelector('.record-navigation-position')?.textContent?.trim()).toBe(
      'Record 3 of 3 matching records',
    );

    next = root.querySelector('button[aria-label="Next science record"]')!;
    previous = root.querySelector('button[aria-label="Previous science record"]')!;
    expect(next.disabled).toBe(true);
    expect(previous.disabled).toBe(false);
    next.click();
    fixture.detectChanges();
    expect(state.selectedMarkerId()).toBe('synthetic-rec-3');

    previous.click();
    fixture.detectChanges();
    expect(state.selectedMarkerId()).toBe('synthetic-rec-2');
    expect(missionMock.route!()).toEqual(initialRoute);
    expect(missionMock.mode!()).toBe(initialMode);
    expect(missionMock.layers!()).toEqual(initialLayers);
    expect(missionMock.observations!()).toEqual(initialObservations);
  });

  it('navigates only within matching records and keeps a hidden selection until filters include it again', () => {
    const root = fixture.nativeElement as HTMLElement;
    const recordButtons = root.querySelectorAll(
      'button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;
    recordButtons[0].click();
    fixture.detectChanges();
    selectMarker.mockClear();

    setSelectValue('Evidence type', 'interpreted');

    const previous = root.querySelector(
      'button[aria-label="Previous science record"]',
    ) as HTMLButtonElement;
    const next = root.querySelector(
      'button[aria-label="Next science record"]',
    ) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);
    expect(root.querySelector('.record-navigation-position')?.textContent?.trim()).toBe(
      'Selected record is outside the current filter results.',
    );
    expect(root.querySelector('.hidden-notice')?.textContent).toContain(
      'outside the current filter results',
    );
    next.click();
    expect(selectMarker).not.toHaveBeenCalled();
    expect(state.selectedMarkerId()).toBe('synthetic-rec-1');

    setSelectValue('Evidence type', 'all');
    expect(state.selectedMarkerId()).toBe('synthetic-rec-1');
    expect(root.querySelector('.record-navigation-position')?.textContent?.trim()).toBe(
      'Record 1 of 3 matching records',
    );
    const restoredNext = root.querySelector(
      'button[aria-label="Next science record"]',
    ) as HTMLButtonElement;
    expect(restoredNext.disabled).toBe(false);
  });

  it('disables both controls for one matching record and removes navigation if the selected record disappears', () => {
    const root = fixture.nativeElement as HTMLElement;
    const searchInput = setSearchInput('boxwork');
    const onlyRecord = root.querySelector('button.science-record-button') as HTMLButtonElement;
    onlyRecord.click();
    fixture.detectChanges();

    expect(root.querySelector('.record-navigation-position')?.textContent?.trim()).toBe(
      'Record 1 of 1 matching records',
    );
    const previous = root.querySelector(
      'button[aria-label="Previous science record"]',
    ) as HTMLButtonElement;
    const next = root.querySelector(
      'button[aria-label="Next science record"]',
    ) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);

    state.markers.set(threeUnlocatedRecords().filter((record) => record.id !== 'synthetic-rec-2'));
    fixture.detectChanges();
    expect(root.querySelector('article.science-record-details')).toBeNull();
    expect(root.querySelector('.record-navigation')).toBeNull();
    expect(root.querySelector('.science-no-selection')?.textContent).toContain(
      'Select a science record to view its finding',
    );
    expect(searchInput.value).toBe('boxwork');
    component.navigateToPreviousRecord();
    component.navigateToNextRecord();
    expect(selectMarker).toHaveBeenCalledTimes(1);
  });

  it('leaves route(), mode(), observations(), and image() untouched when selecting and clearing', () => {
    const initialRoute = structuredClone(missionMock.route!());
    const initialMode = missionMock.mode!();
    const initialObservations = structuredClone(missionMock.observations!());
    const initialImageRef = missionMock.image!()?.imageRef;

    const buttons = fixture.nativeElement.querySelectorAll(
      'button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector(
      'button.clear-selection-button',
    ) as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(missionMock.route!()).toEqual(initialRoute);
    expect(missionMock.mode!()).toBe(initialMode);
    expect(missionMock.observations!()).toEqual(initialObservations);
    expect(missionMock.image!()?.imageRef).toBe(initialImageRef);
  });

  it('adds at most two records to a comparison without selecting records or changing mission state', () => {
    state.selectedMarkerId.set('synthetic-rec-2');
    fixture.detectChanges();
    const initialRoute = structuredClone(state.route());
    const initialMode = state.mode();
    const initialLayers = structuredClone(state.layers());
    const initialObservations = structuredClone(state.observations());
    const initialSelectedId = state.selectedMarkerId();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    const root = fixture.nativeElement as HTMLElement;

    const modeButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Compare evidence'),
    ) as HTMLButtonElement;
    expect(modeButton.type).toBe('button');
    expect(modeButton.getAttribute('aria-pressed')).toBe('false');
    modeButton.click();
    fixture.detectChanges();
    expect(modeButton.getAttribute('aria-pressed')).toBe('true');

    const addFirst = root.querySelector(
      'button[aria-label="Add Synthetic Sulfate Zone to evidence comparison"]',
    ) as HTMLButtonElement;
    expect(addFirst.type).toBe('button');
    addFirst.focus();
    expect(document.activeElement).toBe(addFirst);
    addFirst.click();
    fixture.detectChanges();

    const addSecond = root.querySelector(
      'button[aria-label="Add Synthetic Boxwork Fracture Pattern to evidence comparison"]',
    ) as HTMLButtonElement;
    addSecond.click();
    fixture.detectChanges();

    expect(component.comparisonIds()).toEqual(['synthetic-rec-1', 'synthetic-rec-2']);
    const compared = root.querySelectorAll(
      'article[aria-label^="Compared science record:"]',
    ) as NodeListOf<HTMLElement>;
    expect(compared).toHaveLength(2);
    expect(compared[0].textContent).toContain(
      'Synthetic elevated sulfate signature detected across fracture fill.',
    );
    expect(compared[0].textContent).toContain('measured');
    expect(compared[0].textContent).toContain('APXS');
    expect(compared[0].textContent).toContain('2024-06-01');
    expect(compared[0].textContent).toContain('Synthetic APXS Report');
    expect(compared[0].textContent).toContain('Synthetic Lab A');
    expect(compared[0].textContent).toContain('Point measurement outside high-res AOI.');
    expect(compared[0].textContent).toContain('No DEM elevation tie.');
    expect(compared[0].textContent).toContain('regional context only');
    const sourceLink = compared[0].querySelector('a') as HTMLAnchorElement;
    expect(sourceLink.getAttribute('href')).toBe('https://example.test/apxs');
    expect(sourceLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(compared[1].textContent).toContain(
      'Synthetic polygonal ridge network interpreted as mineral-filled fractures.',
    );
    expect(compared[1].textContent).toContain('interpreted');
    expect(compared[1].textContent).toContain('HiRISE');
    expect(compared[1].textContent).toContain('2023-11-20');
    expect(compared[1].textContent).toContain('Synthetic Orbital Survey');
    expect(compared[1].textContent).toContain('Synthetic Lab B');
    expect(compared[1].textContent).toContain(
      'Orbital resolution limits small-scale obstacle inference.',
    );
    expect(root.textContent).toContain('not two route destinations');

    const addThird = root.querySelector(
      'button[aria-label="Add Synthetic Clay Transition to evidence comparison"]',
    ) as HTMLButtonElement;
    expect(addThird.disabled).toBe(true);
    component.addToComparison('synthetic-rec-3');
    expect(component.comparisonIds()).toEqual(['synthetic-rec-1', 'synthetic-rec-2']);
    expect(component.comparisonAnnouncement()).toContain('already has two records');

    component.addToComparison('synthetic-rec-1');
    expect(component.comparisonIds()).toEqual(['synthetic-rec-1', 'synthetic-rec-2']);
    expect(component.comparisonAnnouncement()).toContain('already in the evidence comparison');
    expect(selectMarker).not.toHaveBeenCalled();
    expect(state.selectedMarkerId()).toBe(initialSelectedId);
    expect(state.route()).toEqual(initialRoute);
    expect(state.mode()).toBe(initialMode);
    expect(state.layers()).toEqual(initialLayers);
    expect(state.observations()).toEqual(initialObservations);
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    setItem.mockRestore();
    getItem.mockRestore();
    removeItem.mockRestore();
  });

  it('retains filtered-out comparisons, supports remove and clear, and preserves current filters', () => {
    const root = fixture.nativeElement as HTMLElement;
    component.toggleCompareMode();
    component.addToComparison('synthetic-rec-1');
    component.addToComparison('synthetic-rec-2');
    fixture.detectChanges();

    const searchInput = setSearchInput('boxwork');
    const compared = root.querySelectorAll(
      'article[aria-label^="Compared science record:"]',
    ) as NodeListOf<HTMLElement>;
    expect(compared).toHaveLength(2);
    expect(compared[0].textContent).toContain('hidden by the current search or filters');
    expect(compared[0].textContent).toContain('Synthetic Sulfate Zone');
    expect(compared[1].textContent).toContain('Synthetic Boxwork Fracture Pattern');
    expect(component.comparisonIds()).toEqual(['synthetic-rec-1', 'synthetic-rec-2']);

    const removeFirst = root.querySelector(
      'button[aria-label="Remove Synthetic Sulfate Zone from evidence comparison"]',
    ) as HTMLButtonElement;
    expect(removeFirst.type).toBe('button');
    removeFirst.click();
    fixture.detectChanges();
    expect(component.comparisonIds()).toEqual(['synthetic-rec-2']);

    component.addToComparison('synthetic-rec-3');
    fixture.detectChanges();
    expect(component.comparisonIds()).toEqual(['synthetic-rec-2', 'synthetic-rec-3']);
    const clear = root.querySelector(
      'button[aria-label="Clear evidence comparison"]',
    ) as HTMLButtonElement;
    expect(clear.disabled).toBe(false);
    clear.click();
    fixture.detectChanges();
    expect(component.comparisonIds()).toEqual([]);
    expect(component.comparedRecords()).toEqual([]);
    expect(component.comparisonAnnouncement()).toBe('Evidence comparison cleared.');
    expect(searchInput.value).toBe('boxwork');
    expect(component.searchQuery()).toBe('boxwork');
  });

  it('removes source-deleted comparison entries and announces removal without replacing them', () => {
    component.toggleCompareMode();
    component.addToComparison('synthetic-rec-1');
    component.addToComparison('synthetic-rec-2');
    fixture.detectChanges();

    state.markers.set([
      ...threeUnlocatedRecords().filter((record) => record.id !== 'synthetic-rec-1'),
    ]);
    fixture.detectChanges();

    expect(component.comparisonIds()).toEqual(['synthetic-rec-2']);
    expect(component.comparedRecords().map((record) => record.id)).toEqual(['synthetic-rec-2']);
    expect(component.comparisonAnnouncement()).toContain(
      'A compared science record was removed because it is no longer present in the loaded source.',
    );
    expect(component.comparisonIds()).not.toContain('synthetic-rec-3');
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        'article[aria-label^="Compared science record:"]',
      ),
    ).toHaveLength(1);

    state.markers.set([]);
    fixture.detectChanges();
    expect(component.comparisonIds()).toEqual([]);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.comparison-announcement')?.textContent,
    ).toContain('A compared science record was removed because it is no longer present');
  });

  it('renders comparison text literally and rejects unsafe source URLs', () => {
    const xssPayload = '<script>alert("xss")</script><b>untrusted</b>';
    const record = makeRecord({
      id: 'xss-comparison',
      name: `Name ${xssPayload}`,
      finding: `Finding ${xssPayload}`,
      source: {
        title: `Source ${xssPayload}`,
        url: 'javascript:alert("xss")',
        credit: `Credit ${xssPayload}`,
      },
      limitations: [`Limitation ${xssPayload}`],
    });
    state.markers.set([record]);
    fixture.detectChanges();
    component.toggleCompareMode();
    component.addToComparison(record.id);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const compared = root.querySelector(
      'article[aria-label^="Compared science record:"]',
    ) as HTMLElement;
    expect(compared).not.toBeNull();
    expect(compared.querySelectorAll('script, b')).toHaveLength(0);
    expect(compared.querySelector('a')).toBeNull();
    expect(compared.textContent).toContain(`Finding ${xssPayload}`);
    expect(compared.textContent).toContain(`Source ${xssPayload}`);
    expect(compared.textContent).toContain(`Credit ${xssPayload}`);
    expect(compared.textContent).toContain(`Limitation ${xssPayload}`);

    const controls = Array.from(root.querySelectorAll('button')) as HTMLButtonElement[];
    expect(controls.length).toBeGreaterThan(0);
    controls.forEach((button) => expect(button.type).toBe('button'));
    expect(
      controls.find(
        (button) =>
          button.getAttribute('aria-label') ===
          `Remove Name ${xssPayload} from evidence comparison`,
      ),
    ).toBeDefined();
  });

  it('displays "Unavailable" when instrument and date are null', () => {
    state.markers.set([
      makeRecord({
        id: 'synthetic-nulls',
        instrument: null,
        date: null,
      }),
    ]);
    state.selectedMarkerId.set('synthetic-nulls');
    fixture.detectChanges();

    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('.metadata-row') as NodeListOf<HTMLElement>,
    );
    const instrumentRow = rows.find(
      (r) => r.querySelector('dt')?.textContent?.trim() === 'Instrument',
    );
    const dateRow = rows.find(
      (r) => r.querySelector('dt')?.textContent?.trim() === 'Observation date',
    );

    expect(instrumentRow?.querySelector('dd')?.textContent?.trim()).toBe('Unavailable');
    expect(dateRow?.querySelector('dd')?.textContent?.trim()).toBe('Unavailable');
  });

  it('renders safely across loading, unavailable, error, ready+dataError, empty list, and removed selected ID states', () => {
    state.dataStatus.set('loading');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.science-state')?.getAttribute('role')).toBe(
      'status',
    );
    expect(fixture.nativeElement.querySelector('ul.science-record-list')).toBeNull();

    state.dataStatus.set('unavailable');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.science-state')?.textContent).toContain(
      'unavailable',
    );

    state.dataStatus.set('error');
    state.dataError.set('Synthetic manifest validation failure.');
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('.science-state-error') as HTMLElement;
    expect(errorEl.getAttribute('role')).toBe('alert');
    expect(errorEl.textContent).toContain('Synthetic manifest validation failure.');

    state.dataStatus.set('ready');
    state.dataError.set('Synthetic science records warning.');
    state.markers.set([]);
    fixture.detectChanges();
    const readyBanner = fixture.nativeElement.querySelector('.science-banner-error') as HTMLElement;
    expect(readyBanner.getAttribute('role')).toBe('alert');
    expect(readyBanner.textContent).toContain('Synthetic science records warning.');
    expect(fixture.nativeElement.querySelector('.science-empty')?.getAttribute('role')).toBe(
      'status',
    );

    state.dataError.set(null);
    state.markers.set(threeUnlocatedRecords());
    state.selectedMarkerId.set('non-existent-id');
    fixture.detectChanges();
    expect(component.selectedRecord()).toBeNull();
    expect(fixture.nativeElement.querySelector('article.science-record-details')).toBeNull();
    expect(fixture.nativeElement.querySelector('p.science-no-selection')?.textContent).toContain(
      'Select a science record to view its finding',
    );
  });

  it('renders long strings and HTML-like payloads as literal plain text without injected elements, and verifies button attributes', () => {
    const xssPayload = '<script>alert("xss")</script><b>tag</b>';
    const longText = `LongUnbreakableTitle_${'A'.repeat(160)}_${xssPayload}`;

    state.markers.set([
      makeRecord({
        id: 'xss-rec',
        name: longText,
        finding: `Finding_${'B'.repeat(180)}_${xssPayload}`,
        limitations: [`Limitation_${xssPayload}`],
        source: {
          title: `Source_${xssPayload}`,
          url: 'javascript:alert("xss")',
          credit: `Credit_${xssPayload}`,
        },
      }),
    ]);
    state.selectedMarkerId.set('xss-rec');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('script')).toHaveLength(0);
    expect(root.querySelectorAll('b')).toHaveLength(0);
    expect(root.querySelector('a')).toBeNull();

    expect(root.textContent).toContain(longText);
    expect(root.textContent).toContain(`Finding_${'B'.repeat(180)}_${xssPayload}`);
    expect(root.textContent).toContain(`Limitation_${xssPayload}`);
    expect(root.textContent).toContain(`Source_${xssPayload}`);
    expect(root.textContent).toContain(`Credit_${xssPayload}`);

    const allButtons = Array.from(root.querySelectorAll('button')) as HTMLButtonElement[];
    expect(allButtons.length).toBeGreaterThan(0);
    allButtons.forEach((btn) => {
      expect(btn.getAttribute('type')).toBe('button');
    });

    const recordButtons = Array.from(
      root.querySelectorAll('button.science-record-button'),
    ) as HTMLButtonElement[];
    recordButtons.forEach((btn) => {
      expect(btn.hasAttribute('aria-pressed')).toBe(true);
    });
  });

  it('formats illustrative, verified, and fallback position statuses and filters non-https URLs', () => {
    const illustrative = makeRecord({
      positionStatus: 'illustrative',
      position: { x: 120, y: 340 },
    });
    const verified = makeRecord({
      positionStatus: 'verified',
      position: { x: 45, y: 90 },
    });
    const unavailable = makeRecord({
      positionStatus: 'unavailable',
      position: null,
    });
    const unknownStatus = {
      ...makeRecord({ position: { x: 1, y: 2 } }),
      positionStatus: 'unknown' as unknown as ScienceMarker['positionStatus'],
    };

    expect(component.formatPositionBadge(illustrative)).toBe('Illustrative image point');
    expect(component.formatPositionBadge(verified)).toBe('Verified image point');
    expect(component.formatPositionBadge(unavailable)).toBe('Regional context');
    expect(component.formatPositionStatus(illustrative)).toBe(
      'Illustrative image position (120, 340 px; bottom-left origin); not a verified location. Selecting this record does not set a route point.',
    );
    expect(component.formatPositionStatus(verified)).toBe(
      'Verified image position (45, 90 px; bottom-left origin). Selecting this record highlights its map point but does not set a route point.',
    );
    expect(component.formatPositionStatus(unavailable)).toBe(
      'Unavailable on this image — regional context only, with no point to use as a route stop. Choose a route point on the map separately.',
    );
    expect(component.formatPositionBadge(unknownStatus)).toBe('Position status unavailable');
    expect(component.formatPositionStatus(unknownStatus)).toBe(
      'Unavailable on this image — position status is missing or unsupported; do not use as a route stop.',
    );

    expect(component.safeExternalUrl('https://mars.nasa.gov/example')).toBe(
      'https://mars.nasa.gov/example',
    );
    expect(component.safeExternalUrl('http://mars.nasa.gov/example')).toBeNull();
    expect(component.safeExternalUrl('javascript:alert(1)')).toBeNull();
  });

  const setSearchInput = (value: string): HTMLInputElement => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return input;
  };

  const setSelectValue = (labelText: string, value: string): HTMLSelectElement => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>,
    );
    const label = labels.find((el) => el.textContent?.includes(labelText));
    expect(label).toBeDefined();
    const id = label!.getAttribute('for');
    expect(id).toBeTruthy();
    const select = fixture.nativeElement.querySelector(`#${id}`) as HTMLSelectElement;
    expect(select).not.toBeNull();
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return select;
  };

  const mixedPositionRecords = (): ScienceMarker[] => [
    makeRecord({
      id: 'mix-verified',
      name: 'Synthetic Verified Vein',
      evidenceType: 'measured',
      positionStatus: 'verified',
      position: { x: 0, y: 0 },
      instrument: 'ChemCam',
      finding: 'Synthetic calcium sulfate vein located at bottom-left pixel origin.',
      source: {
        title: 'Synthetic Origin Tie',
        url: 'https://example.test/origin',
        credit: 'Synthetic Team',
      },
    }),
    makeRecord({
      id: 'mix-illustrative',
      name: 'Synthetic Illustrative Ridge',
      evidenceType: 'simulated',
      positionStatus: 'illustrative',
      position: { x: 420, y: 180 },
      instrument: null,
      finding: 'Synthetic simulated rover traverse ridge placement.',
      source: {
        title: 'Synthetic Traverse Simulation',
        url: 'https://example.test/sim',
        credit: 'Synthetic Team',
      },
    }),
    makeRecord({
      id: 'mix-unlocated',
      name: 'Synthetic Regional Basin',
      evidenceType: 'derived',
      positionStatus: 'unavailable',
      position: null,
      instrument: 'CRISM',
      finding: 'Synthetic orbital hydration map.',
      source: {
        title: 'Synthetic Basin Survey',
        url: 'https://example.test/basin',
        credit: 'Synthetic Team',
      },
    }),
    makeRecord({
      id: 'mix-null-coords',
      name: 'Synthetic Missing Coords With Verified Tag',
      evidenceType: 'interpreted',
      positionStatus: 'verified',
      position: null,
      instrument: 'HiRISE',
      finding: 'Synthetic edge case with null position.',
      source: {
        title: 'Synthetic Null Coords',
        url: 'https://example.test/null-coords',
        credit: 'Synthetic Team',
      },
    }),
  ];

  it('computes live recordBadge and distinguishes verified vs illustrative counts from located', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(component.recordBadge()).toBe('3 records (0 located on image)');
    expect(root.textContent).toContain('3 records (0 located on image)');
    expect(root.querySelector('.pos-breakdown')).toBeNull();

    state.markers.set(mixedPositionRecords());
    fixture.detectChanges();

    expect(component.recordBadge()).toBe('4 records (2 located on image)');
    expect(root.textContent).toContain('4 records (2 located on image)');
    const breakdown = root.querySelector('.pos-breakdown') as HTMLElement;
    expect(breakdown).not.toBeNull();
    expect(breakdown.textContent).toContain('1 verified');
    expect(breakdown.textContent).toContain('1 illustrative');
    expect(breakdown.textContent).toContain('does not mean verified');

    state.markers.set([
      makeRecord({
        id: 'ill-1',
        positionStatus: 'illustrative',
        position: { x: 50, y: 60 },
      }),
      makeRecord({
        id: 'ill-2',
        positionStatus: 'illustrative',
        position: { x: 100, y: 120 },
      }),
    ]);
    fixture.detectChanges();
    expect(component.recordBadge()).toBe('2 records (2 located on image)');
    expect(root.querySelector('.pos-breakdown')?.textContent).toContain('0 verified');
    expect(root.querySelector('.pos-breakdown')?.textContent).toContain('2 illustrative');

    state.markers.set([]);
    fixture.detectChanges();
    expect(component.recordBadge()).toBe('0 records (0 located on image)');
    expect(root.textContent).toContain('0 records (0 located on image)');
    expect(root.querySelector('.pos-breakdown')).toBeNull();
  });

  it('filters case-insensitively across name, finding, instrument, and source title with trimmed search', () => {
    const root = fixture.nativeElement as HTMLElement;

    const searchInput = setSearchInput('  boxwork  ');
    const searchLabel = root.querySelector(`label[for="${searchInput.id}"]`);
    expect(searchLabel?.textContent).toContain('Search records');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Boxwork Fracture Pattern']);
    expect(root.textContent).toContain('Showing 1 of 3');

    setSearchInput('HYDRATED CLAY');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Clay Transition']);

    setSearchInput('apxs');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Sulfate Zone']);

    setSearchInput('orbital survey');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Boxwork Fracture Pattern']);

    // Null instrument record does not crash search and matches by source title.
    state.markers.set(mixedPositionRecords());
    fixture.detectChanges();
    setSearchInput('traverse simulation');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Illustrative Ridge']);
    expect(root.textContent).toContain('Showing 1 of 4');
  });

  it('composes evidenceType and positionStatus filters and shows Showing N of M without mutating markers', () => {
    const records = mixedPositionRecords();
    const snapshot = structuredClone(records);
    state.markers.set(records);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Showing 4 of 4');

    setSelectValue('Position availability', 'located');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Verified Vein', 'Synthetic Illustrative Ridge']);
    expect(root.textContent).toContain('Showing 2 of 4');

    setSelectValue('Evidence type', 'simulated');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Illustrative Ridge']);
    expect(root.textContent).toContain('Showing 1 of 4');

    setSelectValue('Evidence type', 'all');
    setSelectValue('Position availability', 'verified');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Verified Vein']);

    setSelectValue('Position availability', 'illustrative');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Illustrative Ridge']);

    setSelectValue('Position availability', 'unavailable');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Regional Basin', 'Synthetic Missing Coords With Verified Tag']);

    setSelectValue('Evidence type', 'derived');
    setSearchInput('basin');
    expect(
      Array.from(root.querySelectorAll('.science-record-button .record-title')).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Regional Basin']);
    expect(root.textContent).toContain('Showing 1 of 4');

    expect(state.markers()).toEqual(snapshot);
  });

  it('shows a distinct no-match state and Clear filters resets controls without touching mission state', () => {
    const initialRoute = structuredClone(missionMock.route!());
    const initialMode = missionMock.mode!();
    const initialObservations = structuredClone(missionMock.observations!());
    const initialLayers = structuredClone(missionMock.layers!());
    const initialImageRef = missionMock.image!()?.imageRef;

    const root = fixture.nativeElement as HTMLElement;
    const toolbarClearBtn = root.querySelector(
      '.results-bar button.clear-filters',
    ) as HTMLButtonElement;
    expect(toolbarClearBtn.disabled).toBe(true);

    // Select a record before filtering to zero matches.
    const buttons = root.querySelectorAll(
      'button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    fixture.detectChanges();
    selectMarker.mockClear();

    const searchInput = setSearchInput('nonexistent-mineral-xyz');
    const evidenceSelect = setSelectValue('Evidence type', 'simulated');

    expect(toolbarClearBtn.disabled).toBe(false);
    expect(root.textContent).toContain('Showing 0 of 3');
    expect(root.querySelector('ul.science-record-list')).toBeNull();
    expect(root.querySelector('.science-empty')).toBeNull();
    expect(root.querySelector('.science-state')).toBeNull();
    expect(root.querySelector('.science-state-error')).toBeNull();

    const noMatches = root.querySelector('.no-matches') as HTMLElement;
    expect(noMatches).not.toBeNull();
    expect(noMatches.getAttribute('role')).toBe('status');

    const allButtons = Array.from(root.querySelectorAll('button')) as HTMLButtonElement[];
    allButtons.forEach((btn) => expect(btn.getAttribute('type')).toBe('button'));

    const noMatchClearBtn = noMatches.querySelector('button.clear-filters') as HTMLButtonElement;
    expect(noMatchClearBtn).not.toBeNull();
    noMatchClearBtn.click();
    fixture.detectChanges();

    expect(component.searchQuery()).toBe('');
    expect(component.evidenceFilter()).toBe('all');
    expect(component.positionFilter()).toBe('all');
    expect(component.hasActiveFilters()).toBe(false);
    expect(searchInput.value).toBe('');
    expect(evidenceSelect.value).toBe('all');
    expect(toolbarClearBtn.disabled).toBe(true);
    expect(root.querySelector('.no-matches')).toBeNull();
    expect(
      root.querySelectorAll('ul.science-record-list button.science-record-button'),
    ).toHaveLength(3);

    expect(state.selectedMarkerId()).toBe('synthetic-rec-1');
    expect(selectMarker).not.toHaveBeenCalled();
    expect(initialize).not.toHaveBeenCalled();
    expect(missionMock.route!()).toEqual(initialRoute);
    expect(missionMock.mode!()).toBe(initialMode);
    expect(missionMock.observations!()).toEqual(initialObservations);
    expect(missionMock.layers!()).toEqual(initialLayers);
    expect(missionMock.image!()?.imageRef).toBe(initialImageRef);
  });

  it('keeps selected record details accessible with notice when hidden by filters and restores list button on clear', () => {
    const root = fixture.nativeElement as HTMLElement;
    const buttons = root.querySelectorAll(
      'button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    fixture.detectChanges();

    expect(component.selectedRecord()?.id).toBe('synthetic-rec-1');
    expect(component.isSelectedHiddenByFilter()).toBe(false);
    expect(root.querySelector('.hidden-notice')).toBeNull();

    setSelectValue('Evidence type', 'interpreted');

    const visibleButtons = root.querySelectorAll(
      'ul.science-record-list button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(visibleButtons).toHaveLength(1);
    expect(visibleButtons[0].textContent).toContain('Synthetic Boxwork Fracture Pattern');
    expect(visibleButtons[0].textContent).not.toContain('Synthetic Sulfate Zone');

    expect(component.isSelectedHiddenByFilter()).toBe(true);
    const details = root.querySelector('article.science-record-details') as HTMLElement;
    expect(details).not.toBeNull();
    expect(details.textContent).toContain('Synthetic Sulfate Zone');
    expect(details.textContent).toContain(
      'Synthetic elevated sulfate signature detected across fracture fill.',
    );

    const notice = details.querySelector('.hidden-notice') as HTMLElement;
    expect(notice).not.toBeNull();
    expect(notice.getAttribute('role')).toBe('status');
    expect(notice.textContent).toContain('outside the current filter results');

    const revealBtn = notice.querySelector('button.clear-filters') as HTMLButtonElement;
    expect(revealBtn).not.toBeNull();
    expect(revealBtn.getAttribute('type')).toBe('button');
    revealBtn.click();
    fixture.detectChanges();

    expect(component.isSelectedHiddenByFilter()).toBe(false);
    expect(root.querySelector('.hidden-notice')).toBeNull();
    const restoredButtons = root.querySelectorAll(
      'ul.science-record-list button.science-record-button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(restoredButtons).toHaveLength(3);
    expect(restoredButtons[0].classList.contains('selected')).toBe(true);
    expect(restoredButtons[0].getAttribute('aria-pressed')).toBe('true');

    // If the selected record is removed from markers while a filter is active, fallback cleanly.
    setSelectValue('Evidence type', 'interpreted');
    state.markers.set(threeUnlocatedRecords().slice(1));
    fixture.detectChanges();
    expect(component.selectedRecord()).toBeNull();
    expect(component.isSelectedHiddenByFilter()).toBe(false);
    expect(root.querySelector('article.science-record-details')).toBeNull();
    expect(root.querySelector('p.science-no-selection')).not.toBeNull();
  });
});
