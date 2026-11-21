/**
 * Shared walk-planning state: the user's survival assumptions and the terrain-aware budget
 * for the current route. Read by the survival panel, the on-map mission HUD and the demo walk.
 */
import { computed, inject, Injectable, signal } from '@angular/core';
import { MissionService } from './mission.service';
import { routePoints } from './route';
import { routeProfile } from './terrain-profile';
import { TerrainSamplerStore } from './terrain-sampler.store';
import { BudgetInputs, calculateBudget, TerrainLegs } from '../survival-budget/budget';

/** Illustrative scenario used by the example button and the demo walk (user assumptions). */
export const EXAMPLE_INPUTS: BudgetInputs = Object.freeze({
  speedKmh: 1,
  availableMinutes: 120,
  taskMinutes: 20,
  reserveMinutes: 30,
  climbMinutesPer100m: 10,
  descentMinutesPer100m: 3,
  gradeLimitDeg: 15,
});

@Injectable({ providedIn: 'root' })
export class MissionBriefStore {
  private readonly mission = inject(MissionService);
  private readonly terrain = inject(TerrainSamplerStore);

  readonly inputs = signal<BudgetInputs>({
    speedKmh: null,
    availableMinutes: null,
    taskMinutes: null,
    reserveMinutes: null,
  });
  /** True once assumptions were edited in this session (saved ones must not overwrite them). */
  dirty = false;

  /** Ground profile of the drawn route along the accepted DTM (null without terrain/endpoints). */
  readonly profile = computed(() => {
    const s = this.terrain.sampler();
    const route = this.mission.route();
    if (!s || !route.start || !route.destination) return null;
    return routeProfile(s, routePoints(route), s.geotransform[1], 0.1);
  });

  readonly terrainLegs = computed<TerrainLegs | null>(() => {
    const p = this.profile();
    return p
      ? {
          terrainMeters: p.terrainMeters,
          ascentMeters: p.ascentMeters,
          descentMeters: p.descentMeters,
          maxGradeDeg: p.maxGradeDeg,
          coverage: p.coverage,
        }
      : null;
  });

  readonly result = computed(() =>
    calculateBudget(
      this.mission.assessment().planarDistanceMeters,
      this.inputs(),
      this.terrainLegs(),
    ),
  );

  useExample(): void {
    this.dirty = true;
    this.inputs.set({ ...EXAMPLE_INPUTS });
  }
}

/** "h:mm" for an elapsed-minutes value (negative shown with a minus sign). */
export function clock(minutes: number): string {
  const sign = minutes < 0 ? '−' : '';
  const m = Math.round(Math.abs(minutes));
  return `${sign}${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}
