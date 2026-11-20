import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MissionService } from '../../core/mission.service';
import { ImageManifest, ScienceMarker } from '../../core/models';
import { ConfidencePanelComponent } from './confidence-panel.component';

describe('ConfidencePanelComponent', () => {
  let fixture: ComponentFixture<ConfidencePanelComponent>;
  let component: ConfidencePanelComponent;
  let service: MissionService;
  let http: HttpTestingController;

  const mockManifest: ImageManifest = {
    schemaVersion: 1,
    imageRef: 'gale_hirise_01',
    assetPath: 'data/imagery/gale.png',
    width: 1200,
    height: 900,
    coordinateSystem: 'image-pixels-bottom-left',
    source: {
      title: 'HiRISE ESP_037146_1755',
      url: 'https://hirise.lpl.arizona.edu/ESP_037146_1755',
      credit: 'NASA/JPL/UArizona',
    },
    observationDate: '2024-06-01',
    coverageStatus: 'verified-aoi',
    limitations: ['2D visible only, no hyperspectral data'],
    calibration: {
      verified: true,
      metersPerPixel: 0.25,
      sourceUrl: 'https://hirise.lpl.arizona.edu/calibration',
      method: 'Spacecraft geometry',
    },
  };

  const sampleMarker: ScienceMarker = {
    id: 'm1',
    name: 'Sulphate Ridge 01',
    imageRef: 'gale_hirise_01',
    position: { x: 300, y: 400 },
    positionStatus: 'verified',
    instrument: 'Mastcam',
    date: 'Sol 3120',
    finding: 'Distinct polygonal boxwork veins in layered sulfate bedrock',
    evidenceType: 'measured',
    source: {
      title: 'Curiosity Mastcam Sol 3120',
      url: 'https://mars.nasa.gov/msl/multimedia/images/',
      credit: 'NASA/JPL-Caltech/MSSS',
    },
    limitations: ['Sample taken from rover mast perspective'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfidencePanelComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfidencePanelComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MissionService);
    http = TestBed.inject(HttpTestingController);
    const unlocatedMarker: ScienceMarker = {
      ...sampleMarker,
      id: 'm2',
      name: 'Unlocated contextual record',
      position: null,
      positionStatus: 'unavailable',
    };
    const initialized = service.initialize();
    http.expectOne((request) => request.url.endsWith('/data/manifest.json')).flush(mockManifest);
    await Promise.resolve();
    http
      .expectOne((request) => request.url.endsWith('/data/markers.json'))
      .flush([sampleMarker, unlocatedMarker]);
    await initialized;
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0)); // let @defer (on idle) blocks load
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('displays Visual Review Only badge and never displays a SAFE badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Visual review only');
    expect(compiled.querySelector('.badge-safe')).toBeNull();
    expect(compiled.textContent?.toLowerCase()).not.toContain('badge-safe');
  });

  it('shows Distance unavailable when endpoints are missing', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.metric-value')?.textContent).toContain(
      'Metric distance unavailable',
    );
    expect(compiled.querySelectorAll('app-exploration-confidence')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-image-passport')).toHaveLength(1);
  });

  it('displays derived planar distance once start and destination are set', () => {
    service.setMode('start');
    service.applyMapPoint({ x: 0, y: 0 });
    service.setMode('destination');
    service.applyMapPoint({ x: 400, y: 0 }); // 400 px * 0.25 m/px = 100 meters
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('app-exploration-confidence .metric-value').textContent,
    ).toContain('100 m');
  });

  it('renders selected science marker details and allows deselection', () => {
    service.selectMarker('m1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.science-record-details')).toBeTruthy();
    expect(compiled.textContent).toContain('Sulphate Ridge 01');
    expect(compiled.textContent).toContain('Mastcam');

    // Deselect
    service.selectMarker(null);
    fixture.detectChanges();
    expect(compiled.querySelector('.science-record-details')).toBeNull();
  });

  it('opens an unlocated contextual record without modifying the route', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.science-record-button',
    )[1] as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(service.selectedMarkerId()).toBe('m2');
    expect(service.markers()[1].position).toBeNull();
    expect(service.route()).toEqual({ start: null, destination: null, waypoints: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Curiosity Mastcam Sol 3120',
    );
  });
});
