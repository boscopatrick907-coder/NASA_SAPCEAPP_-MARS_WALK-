import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionService } from '../core/mission.service';
import { testImage } from '../core/fixtures.spec-helper';
import { NotebookComponent } from './notebook.component';
import { signal } from '@angular/core';

/*** Real-service based tests ***/

describe('NotebookComponent', () => {
  let fixture: ComponentFixture<NotebookComponent>;
  let component: NotebookComponent;
  let service: MissionService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotebookComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(NotebookComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MissionService);
    http = TestBed.inject(HttpTestingController);
    const initialized = service.initialize();
    http
      .expectOne((request) => request.url.endsWith('/data/manifest.json'))
      .flush({
        ...testImage(),
        width: 1000,
        height: 1000,
      });
    await Promise.resolve();
    http
      .expectOne((request) => request.url.endsWith('/data/markers.json'))
      .flush([]);
    await initialized;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('creates notebook with empty draft and disabled submit', () => {
    expect(component).toBeTruthy();
    expect(component.draftText()).toBe('');
    expect(component.isDraftEmpty()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('.submit-btn') as HTMLButtonElement;
    // dataStatus is 'ready' after initialization, so disabled only due to empty draft
    expect(submitBtn.disabled).toBe(true);
  });

  it('rejects whitespace-only text without calling addObservation', () => {
    component.setDraftText('   \n  ');
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'addObservation');
    component.onSubmit();

    expect(spy).not.toHaveBeenCalled();
    expect(component.feedback()?.type).toBe('error');
    expect(component.draftText()).toBe('   \n  '); // preserved
  });

  it('saves valid observation, clears draft text, and updates list', () => {
    component.setDraftText('Discovered cross‑stratified sulfate ridges');
    fixture.detectChanges();

    component.onSubmit();
    fixture.detectChanges();

    expect(component.draftText()).toBe(''); // cleared on success
    expect(component.feedback()?.type).toBe('success');
    expect(service.observations()).toHaveLength(1);
    expect(service.observations()[0].text).toBe('Discovered cross‑stratified sulfate ridges');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Discovered cross‑stratified sulfate ridges');
  });

  it('preserves draft text in editor if storage fails', () => {
    component.setDraftText('Valuable geological observation that must not be lost');
    fixture.detectChanges();

    vi.spyOn(service, 'addObservation').mockReturnValue({ ok: false, error: 'Simulated quota exceeded error' });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.draftText()).toBe('Valuable geological observation that must not be lost');
    expect(component.feedback()?.type).toBe('error');
    expect(component.feedback()?.message).toContain('Simulated quota exceeded');
  });

  it('attaches route start location when enabled', () => {
    service.setMode('start');
    service.applyMapPoint({ x: 340, y: 520 });
    fixture.detectChanges();

    expect(component.hasStartPoint()).toBe(true);
    component.toggleAttachStart();
    expect(component.attachStartLocation()).toBe(true);

    component.setDraftText('Note at EVA start');
    component.onSubmit();

    expect(service.observations()[0].position).toEqual({ x: 340, y: 520 });
  });

  it('allows location checkbox to be unchecked after being checked', () => {
    service.setMode('start');
    service.applyMapPoint({ x: 100, y: 200 });
    fixture.detectChanges();

    component.toggleAttachStart(); // enable
    expect(component.attachStartLocation()).toBe(true);

    component.toggleAttachStart(); // disable
    expect(component.attachStartLocation()).toBe(false);
  });
});

/*** Loading‑aware tests using a mock MissionService ***/

describe('NotebookComponent (loading‑aware)', () => {
  let fixture: ComponentFixture<NotebookComponent>;
  let component: NotebookComponent;
  let mockService: any;

  class MockMissionService {
    readonly dataStatus = signal<'loading' | 'ready'>('loading');
    readonly observations = signal<any[]>([]);
    readonly image = signal(null);
    readonly route = signal<any>({ start: null, destination: null, waypoints: [] });
    addObservation = vi.fn(() => ({ ok: true }));
    setMode = () => {};
    applyMapPoint = () => {};
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotebookComponent],
      providers: [{ provide: MissionService, useClass: MockMissionService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotebookComponent);
    component = fixture.componentInstance;
    mockService = TestBed.inject(MissionService) as MockMissionService;
    fixture.detectChanges();
  });

  it('disables submit while mission data is loading', () => {
    mockService.dataStatus.set('loading');
    component.setDraftText('A note');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.submit-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('enables submit when ready and draft non‑empty', () => {
    mockService.dataStatus.set('ready');
    component.setDraftText('A note');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.submit-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('prevents submission while loading and shows feedback', () => {
    mockService.dataStatus.set('loading');
    component.setDraftText('Late note');
    fixture.detectChanges();
    component.onSubmit();
    expect(component.feedback()?.type).toBe('error');
    expect(component.feedback()?.message).toContain('still loading');
    expect(mockService.addObservation).not.toHaveBeenCalled();
  });

  it('submits successfully when ready, clears draft and records observation', () => {
    mockService.dataStatus.set('ready');
    component.setDraftText('Ready note');
    fixture.detectChanges();
    component.onSubmit();
    expect(mockService.addObservation).toHaveBeenCalledWith('Ready note', null);
    expect(component.draftText()).toBe('');
    expect(component.feedback()?.type).toBe('success');
  });

  it('allows location checkbox to be unchecked after being checked (mock service)', () => {
    // Simulate a start point in the mock route
    mockService.route.set({ start: { x: 100, y: 200 }, destination: null, waypoints: [] });
    component.toggleAttachStart(); // enable
    expect(component.attachStartLocation()).toBe(true);
    component.toggleAttachStart(); // disable
    expect(component.attachStartLocation()).toBe(false);
  });
});
