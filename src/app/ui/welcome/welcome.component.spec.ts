import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WelcomeComponent } from './welcome.component';
import { WELCOME_SEEN_KEY, welcomeSeen } from './welcome-seen';
import { DEMO_IMAGE_REF, DEMO_ROUTE } from './demo-walk';
import { MissionService } from '../../core/mission.service';
import { EXAMPLE_INPUTS, MissionBriefStore } from '../../core/mission-brief.store';
import { TerrainSamplerStore } from '../../core/terrain-sampler.store';
import { MissionHudComponent } from '../mission-hud/mission-hud.component';
import type { Mode, Point, Route } from '../../core/models';

/** Minimal MissionService double that records route edits like the real service. */
function fakeMission(imageRef: string) {
  const route = signal<Route>({ start: null, destination: null, waypoints: [] });
  const mode = signal<Mode>('inspect');
  return {
    image: signal({ imageRef }),
    route,
    mode,
    assessment: signal({ planarDistanceMeters: null as number | null }),
    clearRoute: vi.fn(() => route.set({ start: null, destination: null, waypoints: [] })),
    setMode: (m: Mode) => mode.set(m),
    applyMapPoint: (p: Point) => {
      const r = structuredClone(route());
      if (mode() === 'start') r.start = p;
      else if (mode() === 'destination') r.destination = p;
      else if (mode() === 'waypoint') r.waypoints.push(p);
      route.set(r);
    },
  };
}

describe('welcome and demo walk', () => {
  let mission: ReturnType<typeof fakeMission>;
  function setup(imageRef = DEMO_IMAGE_REF) {
    mission = fakeMission(imageRef);
    TestBed.configureTestingModule({
      imports: [WelcomeComponent, MissionHudComponent],
      providers: [{ provide: MissionService, useValue: mission }],
    });
  }
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('draws the demo route, loads example assumptions and shows the sulfate layer', () => {
    setup();
    const f = TestBed.createComponent(WelcomeComponent);
    const started = vi.fn();
    f.componentInstance.demoStarted.subscribe(started);
    f.detectChanges();
    expect(welcomeSeen()).toBe(false);
    (f.nativeElement.querySelector('button.primary') as HTMLButtonElement).click();
    expect(mission.clearRoute).toHaveBeenCalled();
    expect(mission.route()).toEqual({
      start: DEMO_ROUTE.start,
      destination: DEMO_ROUTE.destination,
      waypoints: [DEMO_ROUTE.waypoint],
    });
    expect(mission.mode()).toBe('inspect');
    expect(TestBed.inject(MissionBriefStore).inputs()).toEqual(EXAMPLE_INPUTS);
    expect(TestBed.inject(TerrainSamplerStore).showMineral()).toBe(true);
    expect(started).toHaveBeenCalledOnce();
    expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe('1');
  });

  it('disables the demo for another image and remembers "explore on my own"', () => {
    setup('another-image');
    const f = TestBed.createComponent(WelcomeComponent);
    const closed = vi.fn();
    f.componentInstance.closed.subscribe(closed);
    f.detectChanges();
    expect((f.nativeElement.querySelector('button.primary') as HTMLButtonElement).disabled).toBe(
      true,
    );
    (f.nativeElement.querySelector('button.ghost') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledOnce();
    expect(welcomeSeen()).toBe(true);
    expect(mission.route().start).toBeNull();
  });

  it('HUD invites a demo without a route and shows the time budget once assumptions exist', () => {
    setup();
    const f = TestBed.createComponent(MissionHudComponent);
    const actions: string[] = [];
    f.componentInstance.action.subscribe((a) => actions.push(a));
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Set a start and a destination');
    (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(actions).toEqual(['demo']);

    mission.route.set({ start: { x: 0, y: 0 }, destination: { x: 10, y: 0 }, waypoints: [] });
    mission.assessment.set({ planarDistanceMeters: 500 });
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('500');
    expect(f.nativeElement.textContent).toContain('Add time budget');
    expect(f.nativeElement.textContent).not.toContain('Turn back by');

    TestBed.inject(MissionBriefStore).useExample();
    f.detectChanges();
    // 500 m at 1 km/h = 30 min each way; 120 − 30 reserve − 30 return = turn back by 1:00.
    expect(f.nativeElement.textContent).toContain('Turn back by');
    expect(f.nativeElement.textContent).toContain('1:00');
    // Margin: 120 − 30 − (60 + 20) = +10 min.
    expect(f.nativeElement.textContent).toContain('+10');
  });
});
