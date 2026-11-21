import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DOCUMENT, DecimalPipe } from '@angular/common';
import { MissionService } from '../core/mission.service';
import { SurvivalBriefComponent } from '../survival-brief/survival-brief.component';
import { PreparationService } from '../survival-brief/preparation.service';
import { BudgetInputs, calculateBudget, TerrainLegs, validInputs } from './budget';
import { routePoints } from '../core/route';
import { routeProfile } from '../core/terrain-profile';
import { TerrainSamplerStore } from '../core/terrain-sampler.store';
import { ElevationProfileComponent } from '../terrain/elevation-profile.component';
@Component({
  selector: 'app-survival-budget',
  standalone: true,
  imports: [DecimalPipe, SurvivalBriefComponent, ElevationProfileComponent],
  templateUrl: './survival-budget.component.html',
  styleUrl: './survival-budget.component.scss',
})
export class SurvivalBudgetComponent {
  readonly mission = inject(MissionService);
  readonly preparation = inject(PreparationService);
  private readonly document = inject(DOCUMENT);
  readonly inputs = signal<BudgetInputs>({
    speedKmh: null,
    availableMinutes: null,
    taskMinutes: null,
    reserveMinutes: null,
  });
  private readonly terrainStore = inject(TerrainSamplerStore);
  /** Ground profile of the drawn route along the accepted DTM (null without terrain/endpoints). */
  readonly profile = computed(() => {
    const s = this.terrainStore.sampler();
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
  /** "h:mm" for an elapsed-minutes value (negative shown with a minus sign). */
  clock(minutes: number): string {
    const sign = minutes < 0 ? '−' : '';
    const m = Math.round(Math.abs(minutes));
    return `${sign}${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  }
  readonly message = signal(
    'Enter your own assumptions. No suit endurance or walking speed is supplied by NASA data.',
  );
  private imageRef: string | null = null;
  private dirty = false;
  constructor() {
    effect(() => {
      const ref = this.mission.image()?.imageRef;
      if (!ref || ref === this.imageRef) return;
      this.imageRef = ref;
      untracked(() => {
        if (!this.dirty) this.restore();
      });
    });
  }
  set(field: keyof BudgetInputs, event: Event) {
    this.dirty = true;
    const raw = (event.target as HTMLInputElement).value;
    this.inputs.update((v) => ({ ...v, [field]: raw.trim() === '' ? null : Number(raw) }));
    this.message.set(
      'Scenario changed. Save assumptions separately; Save Route does not save this scenario.',
    );
  }
  example() {
    this.dirty = true;
    this.inputs.set({
      speedKmh: 1,
      availableMinutes: 120,
      taskMinutes: 20,
      reserveMinutes: 30,
      climbMinutesPer100m: 10,
      descentMinutesPer100m: 3,
      gradeLimitDeg: 15,
    });
    this.message.set(
      'Illustrative example only: 1 km/h, 120 minutes available, 20 task minutes, 30 reserve minutes, +10 min per 100 m climbed, +3 min per 100 m descended, 15° grade limit. Replace these assumptions for your scenario.',
    );
  }
  private key() {
    return `marswalk:survival-budget:v1:${this.mission.image()!.imageRef}`;
  }
  private decode(raw: string): BudgetInputs | null {
    try {
      const v = JSON.parse(raw);
      return v.schemaVersion === 1 &&
        v.imageRef === this.mission.image()?.imageRef &&
        validInputs(v.inputs)
        ? v.inputs
        : null;
    } catch {
      return null;
    }
  }
  restore() {
    if (!this.mission.image()) return;
    try {
      const raw = localStorage.getItem(this.key());
      if (raw === null) return;
      const inputs = this.decode(raw);
      if (!inputs) {
        this.message.set(
          'Saved scenario is unreadable and has been preserved. Download your current brief; existing saved assumptions will not be overwritten.',
        );
        return;
      }
      this.inputs.set(inputs);
      this.dirty = false;
      this.message.set(
        'Saved assumptions restored for this image. Route data is saved separately.',
      );
    } catch {
      this.message.set('Scenario storage is unavailable. You can download the brief instead.');
    }
  }
  save() {
    if (!this.mission.image() || !validInputs(this.inputs())) {
      this.message.set('Enter valid assumptions before saving.');
      return;
    }
    try {
      const old = localStorage.getItem(this.key());
      if (old !== null && !this.decode(old)) {
        this.message.set(
          'Saved scenario is unreadable and was not overwritten. Download the brief to keep your current assumptions.',
        );
        return;
      }
      localStorage.setItem(
        this.key(),
        JSON.stringify({
          schemaVersion: 1,
          imageRef: this.mission.image()!.imageRef,
          inputs: this.inputs(),
        }),
      );
      this.dirty = false;
      this.message.set(
        'Scenario assumptions saved on this device. Save your route and observations separately.',
      );
    } catch {
      this.message.set('Scenario could not be saved. Download the brief to keep a copy.');
    }
  }
  brief() {
    const image = this.mission.image();
    const r = this.result();
    const i = this.inputs();
    const selected = this.mission.markers().find((m) => m.id === this.mission.selectedMarkerId());
    return [
      'MARSWALK — OUT-AND-BACK SURVIVAL PLANNING SCENARIO',
      ...this.preparation.briefLines(),
      `Created: ${new Date().toISOString()}`,
      `Image: ${image?.imageRef ?? 'unavailable'}`,
      `Assumed walking speed: ${i.speedKmh ?? 'unset'} km/h`,
      `Available time: ${i.availableMinutes ?? 'unset'} min`,
      `Task time: ${i.taskMinutes ?? 'unset'} min`,
      `Protected reserve: ${i.reserveMinutes ?? 'unset'} min`,
      `Extra minutes per 100 m climbed: ${i.climbMinutesPer100m ?? 'unset'}`,
      `Extra minutes per 100 m descended: ${i.descentMinutesPer100m ?? 'unset'}`,
      `Grade limit: ${i.gradeLimitDeg ?? 'unset'}${i.gradeLimitDeg != null ? '°' : ''}`,
      ...(r.ok
        ? [
            `Distance basis: ${r.usesTerrain ? `terrain-following, from the accepted DTM (${(r.terrainCoverage * 100).toFixed(0)} % of samples on terrain)` : 'planar map distance (no terrain model available for this route)'}`,
            `Planar distance: ${r.planarMeters.toFixed(2)} m`,
            `One-way distance used: ${r.oneWayMeters.toFixed(2)} m`,
            ...(r.usesTerrain
              ? [
                  `Outbound climb / descent: ${r.ascentMeters.toFixed(1)} m / ${r.descentMeters.toFixed(1)} m (return leg reversed)`,
                  `Steepest sampled grade: ${r.maxGradeDeg!.toFixed(1)}°${r.gradeExceeded ? ' — EXCEEDS your grade limit' : ''}`,
                  `Elevation: start ${this.profile()?.startElevation?.toFixed(1) ?? '?'} m, destination ${this.profile()?.endElevation?.toFixed(1) ?? '?'} m, highest ${this.profile()?.maxElevation?.toFixed(1) ?? '?'} m (Mars 2000 areoid)`,
                ]
              : []),
            `Outbound travel: ${r.outboundMinutes.toFixed(2)} min`,
            `Return travel: ${r.returnMinutes.toFixed(2)} min`,
            `Turn back no later than ${this.clock(r.turnaroundMinute)} (h:mm) after departure to keep the reserve`,
            `Same-path round trip: ${r.roundTripMeters.toFixed(2)} m`,
            `Round-trip travel: ${r.travelMinutes.toFixed(2)} min`,
            `Travel plus tasks: ${r.plannedMinutes.toFixed(2)} min`,
            `Margin after reserve: ${r.marginMinutes.toFixed(2)} min`,
            `Scenario: ${r.fits ? 'Within entered time budget' : 'Exceeds entered time budget'}`,
          ]
        : [`Estimate unavailable: ${r.reason}`]),
      `Route: ${JSON.stringify(this.mission.route())}`,
      `Observation count: ${this.mission.observations().length}`,
      ...this.mission
        .observations()
        .map(
          (note, n) =>
            `Observation ${n + 1} (${note.createdAt}; ${note.position ? JSON.stringify(note.position) : 'unlocated'}): ${note.text}`,
        ),
      selected
        ? `Selected science: ${selected.name}; evidence ${selected.evidenceType}; position ${selected.positionStatus}; ${selected.source.url}`
        : 'Selected science: none',
      ...(selected
        ? [
            `Finding: ${selected.finding}`,
            ...selected.limitations.map((l) => `Science limitation: ${l}`),
          ]
        : []),
      ...(image?.limitations.map((l) => `Image limitation: ${l}`) ?? []),
      'Assumptions: follow the drawn route outward and the same path back at constant user-entered speed, plus your entered minutes per 100 m of climb and descent. Planning estimate only, not a live countdown, oxygen calculation or safety decision.',
      'Terrain figures come from a 1 m HiRISE stereo DTM (DTEEC_001488_1750_001752_1750_U02) with no stated accuracy, sampled every grid cell; grades are between samples, not local slope or a traversability rating. Obstacles, rocks, soil, radiation, supplies and route-wide weather are not verified. Check suit/life-support endurance, communications and return access independently. AI-generated relief does not supply real elevations.',
      `Image source: ${image?.source.url ?? 'unavailable'}`,
      `Credit: ${image?.source.credit ?? 'unavailable'}`,
      'Use Mission Transfer to export the separate mission JSON for application import. This text brief cannot be imported as a mission.',
    ].join('\n');
  }
  download() {
    if (!this.mission.image()) return;
    const url = URL.createObjectURL(new Blob([this.brief()], { type: 'text/plain;charset=utf-8' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'marswalk-survival-brief.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
