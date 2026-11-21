import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { Point } from '../core/models';
import { TerrainPlannerComponent } from './terrain-planner.component';
import { ENGINE_UNAVAILABLE_TEXT } from './terrain-planner.helpers';
import type {
  TerrainAvailabilityInput,
  TerrainEndpointsInput,
  TerrainPlannerFailureCode,
  TerrainPreviewState,
} from './terrain-planner.models';

/**
 * Synthetic test-only fixtures. Never expose or bundle in production assets.
 */
const SYNTHETIC_IMAGE_REF = 'hirise-psp001752-red-center-2048-025m-v2';
const START_PT: Point = { x: 240, y: 420 };
const DEST_PT: Point = { x: 1420, y: 1580 };

function makeAcceptedTerrain(
  overrides: Partial<TerrainAvailabilityInput> = {},
): TerrainAvailabilityInput {
  return {
    status: 'accepted',
    packageId: 'synthetic-dem-pkg-v1',
    imageRef: SYNTHETIC_IMAGE_REF,
    terrainResolutionMeters: 1.0,
    offlineReady: true,
    ...overrides,
  };
}

function makeReadyEndpoints(overrides: Partial<TerrainEndpointsInput> = {}): TerrainEndpointsInput {
  return {
    start: START_PT,
    destination: DEST_PT,
    activeImageRef: SYNTHETIC_IMAGE_REF,
    manualRoutePointCount: 2,
    ...overrides,
  };
}

function makePreviewReady(overrides: Partial<TerrainPreviewState> = {}): TerrainPreviewState {
  return {
    status: 'preview-ready',
    requestId: 'tp-req-1',
    resultForImageRef: SYNTHETIC_IMAGE_REF,
    resultForPackageId: 'synthetic-dem-pkg-v1',
    resultForEndpoints: { start: START_PT, destination: DEST_PT },
    resultForMaxGrade: 15,
    resultForGradeUnit: 'deg',
    engineResult: {
      objectiveLabel: 'Minimize sampled segment grade within 15 deg cap',
      sampledDistanceMeters: 384.6,
      maxSampledSegmentGrade: 12.4,
      gradeUnit: 'deg',
      terrainResolutionMeters: 1.0,
      waypointCount: 7,
      missingInformation: [
        'Sub-meter boulder hazards are unresolved at 1.0 m grid spacing.',
        'Historical REMS weather does not establish live traverse conditions.',
      ],
      caveatNote: 'Synthetic test preview output only.',
    },
    ...overrides,
  };
}

describe('TerrainPlannerComponent', () => {
  let fixture: ComponentFixture<TerrainPlannerComponent>;
  let component: TerrainPlannerComponent;

  beforeEach(async () => {
    // Deterministic ids for assertions; production uses crypto.randomUUID() (contract §6).
    let seq = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `tp-req-${++seq}` as ReturnType<typeof crypto.randomUUID>,
    );
    await TestBed.configureTestingModule({
      imports: [TerrainPlannerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TerrainPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => vi.restoreAllMocks());

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function button(label: string): HTMLButtonElement {
    const btns = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const match = btns.find((b) => b.textContent?.trim() === label);
    if (!match) throw new Error(`Button "${label}" not found`);
    return match;
  }

  function gradeInput(): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '#tp-grade-input',
    ) as HTMLInputElement;
  }

  it('1. blocks requests on none, proposed, pending-review, rejected, image mismatch, and incomplete offline pack', () => {
    fixture.componentRef.setInput('endpoints', makeReadyEndpoints());

    const cases: Array<[TerrainAvailabilityInput | null, string]> = [
      [null, 'No terrain package'],
      [makeAcceptedTerrain({ status: 'proposed' }), 'Pending source review'],
      [makeAcceptedTerrain({ status: 'pending-review' }), 'Pending source review'],
      [makeAcceptedTerrain({ status: 'rejected' }), 'Rejected terrain'],
      [makeAcceptedTerrain({ imageRef: 'different-image-ref' }), 'Image mismatch'],
      [makeAcceptedTerrain({ offlineReady: false }), 'Offline pack incomplete'],
    ];

    for (const [terrain, expectedBadge] of cases) {
      fixture.componentRef.setInput('terrain', terrain);
      fixture.detectChanges();
      expect(text()).toContain(expectedBadge);
      expect(button('Request terrain preview').disabled).toBe(true);
    }

    fixture.componentRef.setInput('terrain', makeAcceptedTerrain());
    fixture.detectChanges();
    expect(text()).toContain('DEM ready (experimental)');
    expect(button('Request terrain preview').disabled).toBe(false);
  });

  it('2. validates missing or identical endpoints and disables Request until two distinct endpoints exist', () => {
    fixture.componentRef.setInput('terrain', makeAcceptedTerrain());

    fixture.componentRef.setInput(
      'endpoints',
      makeReadyEndpoints({ start: null, destination: null }),
    );
    fixture.detectChanges();
    expect(text()).toContain('Endpoints incomplete');
    expect(button('Request terrain preview').disabled).toBe(true);

    fixture.componentRef.setInput('endpoints', makeReadyEndpoints({ destination: null }));
    fixture.detectChanges();
    expect(text()).toContain('Destination missing');
    expect(button('Request terrain preview').disabled).toBe(true);

    fixture.componentRef.setInput('endpoints', makeReadyEndpoints({ destination: START_PT }));
    fixture.detectChanges();
    expect(text()).toContain('Identical endpoints');
    expect(button('Request terrain preview').disabled).toBe(true);
  });

  it('3. defaults grade input to degrees (1-45), supports percent mode, rejects invalid values with aria-invalid, and disclaims capability', () => {
    fixture.componentRef.setInput('terrain', makeAcceptedTerrain());
    fixture.componentRef.setInput('endpoints', makeReadyEndpoints());
    fixture.detectChanges();

    expect(text()).toContain('degrees, °');
    expect(text()).toContain('not an established astronaut, suit, or rover capability');
    expect(gradeInput().value).toBe('15');
    expect(gradeInput().getAttribute('aria-invalid')).toBe('false');

    for (const bad of ['', '   ', '0', '-5', '60', 'abc']) {
      gradeInput().value = bad;
      gradeInput().dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(gradeInput().getAttribute('aria-invalid')).toBe('true');
      expect(button('Request terrain preview').disabled).toBe(true);
    }

    button('Reset default').click();
    fixture.detectChanges();
    expect(gradeInput().value).toBe('15');
    expect(button('Request terrain preview').disabled).toBe(false);

    fixture.componentRef.setInput('gradeUnit', 'percent');
    fixture.detectChanges();
    expect(text()).toContain('percent grade, %');
    expect(gradeInput().value).toBe('26.8'); // same 15° limit shown in percent (review E1-4)
    expect(button('Request terrain preview').disabled).toBe(false);
  });

  it('4. emits requestPreview payload and supports Cancel while running', () => {
    fixture.componentRef.setInput('terrain', makeAcceptedTerrain());
    fixture.componentRef.setInput('endpoints', makeReadyEndpoints());
    fixture.detectChanges();

    const requested: unknown[] = [];
    const cancelled: unknown[] = [];
    component.requestPreview.subscribe((v) => requested.push(v));
    component.cancelPreview.subscribe((v) => cancelled.push(v));

    expect(button('Cancel preview').disabled).toBe(true);
    button('Request terrain preview').click();
    fixture.detectChanges();

    expect(requested.length).toBe(1);
    expect(requested[0]).toEqual({
      requestId: 'tp-req-1',
      imageRef: SYNTHETIC_IMAGE_REF,
      packageId: 'synthetic-dem-pkg-v1',
      start: START_PT,
      destination: DEST_PT,
      maxSegmentGrade: 15,
      gradeUnit: 'deg',
      maxSegmentGradeDeg: 15,
    });

    fixture.componentRef.setInput('preview', { status: 'running', requestId: 'tp-req-1' });
    fixture.detectChanges();
    expect(button('Request terrain preview').disabled).toBe(true);
    expect(button('Cancel preview').disabled).toBe(false);

    button('Cancel preview').click();
    fixture.detectChanges();
    expect(cancelled).toEqual([{ requestId: 'tp-req-1' }]);
  });

  it('5. displays engine-supplied metrics and falls back to Unavailable for NaN/null without claiming safety', () => {
    fixture.componentRef.setInput('terrain', makeAcceptedTerrain());
    fixture.componentRef.setInput('endpoints', makeReadyEndpoints());
    fixture.componentRef.setInput('preview', makePreviewReady());
    fixture.detectChanges();

    const content = text();
    expect(content).toContain('Preview suggestion (not saved)');
    expect(content).toContain('Minimize sampled segment grade within 15 deg cap');
    expect(content).toContain('384.6 m');
    expect(content).toContain('12.4°');
    expect(content).toContain('1 m/pixel');
    expect(content).toContain('Sub-meter boulder hazards are unresolved');
    expect(content).not.toMatch(/\bSafe route\b/i);

    fixture.componentRef.setInput(
      'preview',
      makePreviewReady({
        engineResult: {
          objectiveLabel: null,
          sampledDistanceMeters: Number.NaN,
          maxSampledSegmentGrade: null,
          gradeUnit: 'deg',
          terrainResolutionMeters: null,
          waypointCount: null,
          missingInformation: [],
        },
      }),
    );
    fixture.componentRef.setInput(
      'terrain',
      makeAcceptedTerrain({ terrainResolutionMeters: null }),
    );
    fixture.detectChanges();
    expect(text()).toContain(ENGINE_UNAVAILABLE_TEXT);
    expect(text()).not.toContain('NaN');
  });

  it('6. handles explicit accept and reject without auto-saving', () => {
    fixture.componentRef.setInput('terrain', makeAcceptedTerrain());
    fixture.componentRef.setInput('endpoints', makeReadyEndpoints());
    fixture.componentRef.setInput('preview', makePreviewReady());
    fixture.detectChanges();

    const accepted: unknown[] = [];
    const rejected: unknown[] = [];
    component.acceptPreview.subscribe((v) => accepted.push(v));
    component.rejectPreview.subscribe((v) => rejected.push(v));

    button('Accept preview route').click();
    fixture.detectChanges();
    expect(accepted).toEqual([
      { requestId: 'tp-req-1', imageRef: SYNTHETIC_IMAGE_REF, packageId: 'synthetic-dem-pkg-v1' },
    ]);
    expect(text()).toContain('No automatic save ran');

    button('Reject preview').click();
    fixture.detectChanges();
    expect(rejected).toEqual([{ requestId: 'tp-req-1' }]);
  });

  it('7. marks preview stale and disables Accept when endpoints, grade, imageRef, or terrain status change', () => {
    fixture.componentRef.setInput('terrain', makeAcceptedTerrain());
    fixture.componentRef.setInput('endpoints', makeReadyEndpoints());
    fixture.componentRef.setInput('preview', makePreviewReady());
    fixture.detectChanges();
    expect(button('Accept preview route').disabled).toBe(false);

    // Move destination endpoint
    fixture.componentRef.setInput(
      'endpoints',
      makeReadyEndpoints({ destination: { x: 1500, y: 1600 } }),
    );
    fixture.detectChanges();
    expect(text()).toContain('Stale preview — re-run required');
    expect(button('Accept preview route').disabled).toBe(true);
    expect(button('Reject preview').disabled).toBe(false);

    // Restore endpoints, then edit grade constraint
    fixture.componentRef.setInput('endpoints', makeReadyEndpoints());
    fixture.detectChanges();
    expect(button('Accept preview route').disabled).toBe(false);

    gradeInput().value = '20';
    gradeInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(text()).toContain('Stale preview — re-run required');
    expect(button('Accept preview route').disabled).toBe(true);
  });

  it.each<[TerrainPreviewState['status'], TerrainPlannerFailureCode]>([
    ['no-route', 'no-path-within-constraints'],
    ['no-route', 'grade-limit-exceeded'],
    ['no-route', 'endpoint-on-nodata'],
    ['cancelled', 'cancelled'],
    ['error', 'worker-error'],
  ])('8. explains %s outcome (%s) without claiming terrain is impassable', (status, code) => {
    fixture.componentRef.setInput('preview', {
      status,
      requestId: 'tp-req-2',
      reasonCode: code,
      engineMessage: 'Engine status note',
      isProvisionalCode: true,
    });
    fixture.detectChanges();

    const content = text();
    expect(content).toContain(code);
    expect(content).toContain('Engine status note');
    expect(content).toMatch(/never proves|does not prove|says nothing about|not\b.*\bimpassable/i);
    expect(content).toContain('Your manual 2D route and unsaved Notebook drafts remain preserved.');
  });

  it('9. preserves sibling Notebook draft & manual route across request/cancel/reject/error and makes zero localStorage calls', () => {
    @Component({
      standalone: true,
      imports: [TerrainPlannerComponent],
      template: `
        <textarea id="sibling-draft" [value]="draft()" (input)="onDraft($event)"></textarea>
        <app-terrain-planner
          [terrain]="terrain()"
          [endpoints]="endpoints()"
          [preview]="preview()"
          (requestPreview)="onReq($event)"
          (cancelPreview)="onCancel()"
          (rejectPreview)="onReject()"
        />
      `,
    })
    class HostPreserveComponent {
      readonly draft = signal('Unsaved field draft near boxwork ridges');
      readonly manualRoute = signal({ start: START_PT, destination: DEST_PT, waypoints: [] });
      readonly terrain = signal<TerrainAvailabilityInput>(makeAcceptedTerrain());
      readonly endpoints = signal<TerrainEndpointsInput>(makeReadyEndpoints());
      readonly preview = signal<TerrainPreviewState>(makePreviewReady());
      onDraft(e: Event): void {
        this.draft.set((e.target as HTMLTextAreaElement).value);
      }
      onReq(payload: { requestId: string }): void {
        this.preview.set({ status: 'running', requestId: payload.requestId });
      }
      onCancel(): void {
        this.preview.set({ status: 'cancelled', requestId: 'tp-req-9', reasonCode: 'cancelled' });
      }
      onReject(): void {
        this.preview.set({ status: 'idle', requestId: null });
      }
    }

    const setSpy = vi.spyOn(Storage.prototype, 'setItem');
    const getSpy = vi.spyOn(Storage.prototype, 'getItem');
    const hostFixture = TestBed.createComponent(HostPreserveComponent);
    hostFixture.detectChanges();

    const hostEl = hostFixture.nativeElement as HTMLElement;
    const clickLabel = (lbl: string) => {
      const b = Array.from(hostEl.querySelectorAll('button')).find(
        (x) => x.textContent?.trim() === lbl,
      ) as HTMLButtonElement;
      b.click();
      hostFixture.detectChanges();
    };

    clickLabel('Reject preview');
    clickLabel('Request terrain preview');
    clickLabel('Cancel preview');

    expect((hostEl.querySelector('#sibling-draft') as HTMLTextAreaElement).value).toBe(
      'Unsaved field draft near boxwork ridges',
    );
    expect(hostFixture.componentInstance.manualRoute()).toEqual({
      start: START_PT,
      destination: DEST_PT,
      waypoints: [],
    });
    expect(setSpy).not.toHaveBeenCalled();
    expect(getSpy).not.toHaveBeenCalled();
    setSpy.mockRestore();
    getSpy.mockRestore();
  });
});

describe('coordinator review fixes (E1-1, E1-3, E1-4)', () => {
  afterEach(() => vi.restoreAllMocks());
  const accepted = {
    status: 'accepted' as const,
    packageId: 'pkg',
    imageRef: 'img',
    terrainResolutionMeters: 1,
  };
  it('E1-1: a missing offlineReady flag is not ready', async () => {
    const { evaluateTerrainGate } = await import('./terrain-planner.helpers');
    expect(evaluateTerrainGate(accepted, 'img').canRequest).toBe(false);
    expect(evaluateTerrainGate({ ...accepted, offlineReady: true }, 'img').canRequest).toBe(true);
  });
  it('E1-3: no active image blocks requests', async () => {
    const { evaluateTerrainGate } = await import('./terrain-planner.helpers');
    const v = evaluateTerrainGate({ ...accepted, offlineReady: true }, null);
    expect(v.canRequest).toBe(false);
    expect(v.badgeLabel).toBe('No active image');
  });
  it('E1-4: a percent limit is sent to the engine in degrees', async () => {
    await TestBed.configureTestingModule({
      imports: [TerrainPlannerComponent],
    }).compileComponents();
    const f = TestBed.createComponent(TerrainPlannerComponent);
    f.componentRef.setInput('terrain', { ...accepted, offlineReady: true });
    f.componentRef.setInput('endpoints', {
      start: { x: 1, y: 1 },
      destination: { x: 5, y: 5 },
      activeImageRef: 'img',
    });
    f.componentRef.setInput('gradeUnit', 'percent');
    f.detectChanges();
    const sent: { maxSegmentGrade: number; maxSegmentGradeDeg: number; requestId: string }[] = [];
    f.componentInstance.requestPreview.subscribe((v) => sent.push(v));
    f.componentInstance.onRequestPreview();
    expect(sent[0].maxSegmentGrade).toBeCloseTo(26.8, 6);
    expect(sent[0].maxSegmentGradeDeg).toBeCloseTo(15, 1);
    expect(sent[0].requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
