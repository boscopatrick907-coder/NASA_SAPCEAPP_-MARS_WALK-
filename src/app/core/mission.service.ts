import { computed, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ImageManifest,
  LayerId,
  Mode,
  Observation,
  OperationResult,
  Point,
  Route,
  ScienceMarker,
} from './models';
import { assessRoute, emptyRoute } from './route';
import { validEnvelope, validManifest, validMarkers, validPoint } from './validation';

export const MAX_MISSION_IMPORT_BYTES = 1024 * 1024;

const clone = <T>(value: T): T => structuredClone(value);
const frozen = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(frozen);
    Object.freeze(value);
  }
  return value;
};
@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly imageState = signal<ImageManifest | null>(null);
  private readonly markerState = signal<readonly ScienceMarker[]>([]);
  private readonly routeState = signal<Route>(frozen(emptyRoute()));
  private readonly modeState = signal<Mode>('inspect');
  private readonly layerState = signal<Readonly<Record<LayerId, boolean>>>({
    imagery: true,
    markers: true,
    grid: false,
    coverage: true,
  });
  private readonly selectedState = signal<string | null>(null);
  private readonly observationState = signal<readonly Observation[]>([]);
  private readonly history = signal<Route[]>([]);
  private readonly statusState = signal<'loading' | 'ready' | 'unavailable' | 'error'>('loading');
  private readonly errorState = signal<string | null>(null);
  private initialization?: Promise<void>;

  readonly image = this.imageState.asReadonly();
  readonly markers = this.markerState.asReadonly();
  readonly route = this.routeState.asReadonly();
  readonly mode = this.modeState.asReadonly();
  readonly layers = this.layerState.asReadonly();
  readonly selectedMarkerId = this.selectedState.asReadonly();
  readonly observations = this.observationState.asReadonly();
  readonly dataStatus = this.statusState.asReadonly();
  readonly dataError = this.errorState.asReadonly();
  readonly assessment = computed(() => frozen(assessRoute(this.route(), this.image())));
  readonly canUndo = computed(() => this.history().length > 0);

  /** Call once from root assembly. URLs respect the application's deployed base. */
  initialize(): Promise<void> {
    return (this.initialization ??= this.loadData().then(() => {
      // Auto‑load saved mission if present. Errors are ignored.
      this.loadRoute();
    }));
  }
  private async loadData(): Promise<void> {
    try {
      const manifest = await firstValueFrom(
        this.http.get<unknown>(new URL('data/manifest.json', this.document.baseURI).href),
      );
      if (!validManifest(manifest))
        throw new Error('Invalid image manifest. Check the data handoff contract.');
      this.imageState.set(frozen(clone(manifest)));
      try {
        const markers = await firstValueFrom(
          this.http.get<unknown>(new URL('data/markers.json', this.document.baseURI).href),
        );
        if (!validMarkers(markers, manifest))
          throw new Error('Science records are invalid or reference a different image.');
        this.markerState.set(frozen(clone(markers)));
      } catch (error) {
        this.errorState.set(
          error instanceof HttpErrorResponse && error.status === 404
            ? 'Science records are not supplied yet.'
            : 'Science records could not be loaded or validated.',
        );
      }
      this.statusState.set('ready');
    } catch (error) {
      const missing = error instanceof HttpErrorResponse && error.status === 404;
      this.statusState.set(missing ? 'unavailable' : 'error');
      this.errorState.set(
        missing
          ? 'Image data has not been supplied. See docs/data/IMAGE_CONTRACT.md.'
          : 'Image manifest could not be loaded or validated.',
      );
    }
  }
  setMode(mode: Mode): void {
    if (['inspect', 'start', 'destination', 'waypoint'].includes(mode)) this.modeState.set(mode);
  }
  setLayer(id: LayerId, visible: boolean): void {
    if (Object.hasOwn(this.layers(), id) && typeof visible === 'boolean')
      this.layerState.update((l) => frozen({ ...l, [id]: visible }));
  }
  selectMarker(id: string | null): void {
    if (id === null || this.markers().some((m) => m.id === id)) this.selectedState.set(id);
  }
  private changeRoute(next: Route): void {
    this.history.update((h) => [...h, clone(this.route())]);
    this.routeState.set(frozen(next));
  }
  applyMapPoint(point: Point): void {
    const image = this.image();
    if (!image || !validPoint(point, image) || this.mode() === 'inspect') return;
    const next = clone(this.route());
    if (this.mode() === 'start') next.start = clone(point);
    else if (this.mode() === 'destination') next.destination = clone(point);
    else next.waypoints.push(clone(point));
    this.changeRoute(next);
  }
  undoRoute(): void {
    const previous = this.history().at(-1);
    if (previous) {
      this.routeState.set(frozen(clone(previous)));
      this.history.update((h) => h.slice(0, -1));
    }
  }
  clearRoute(): void {
    this.changeRoute(emptyRoute());
  }
  private key(): string {
    return `marswalk:v1:${this.image()!.imageRef}`;
  }
  private envelope(route = this.route(), observations = this.observations()) {
    return { schemaVersion: 1, imageRef: this.image()!.imageRef, route, observations };
  }
  saveRoute(): OperationResult {
    if (!this.image()) return { ok: false, error: 'Load image data before saving.' };
    try {
      localStorage.setItem(this.key(), JSON.stringify(this.envelope()));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Browser storage is unavailable or full. Export your mission.' };
    }
  }
  loadRoute(): OperationResult {
    const image = this.image();
    if (!image) return { ok: false, error: 'Load image data before loading a saved mission.' };
    try {
      const raw = localStorage.getItem(this.key());
      if (!raw) return { ok: false, error: 'No saved mission for this image.' };
      const value: unknown = JSON.parse(raw);
      if (!validEnvelope(value, image))
        return {
          ok: false,
          error: 'Saved mission is invalid or uses a different image reference.',
        };
      this.routeState.set(frozen(clone(value.route)));
      this.observationState.set(frozen(clone(value.observations)));
      this.history.set([]);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Saved mission could not be read. Existing state is unchanged.' };
    }
  }
  addObservation(text: string, position: Point | null): OperationResult {
    const image = this.image();
    if (!image) return { ok: false, error: 'Load image data before saving an observation.' };
    if (!text.trim()) return { ok: false, error: 'Enter an observation.' };
    if (position !== null && !validPoint(position, image))
      return { ok: false, error: 'Observation position is outside the active image.' };
    const notes = [
      ...this.observations(),
      {
        id: crypto.randomUUID(),
        imageRef: image.imageRef,
        createdAt: new Date().toISOString(),
        text: text.trim(),
        position: clone(position),
      },
    ];
    try {
      localStorage.setItem(this.key(), JSON.stringify(this.envelope(this.route(), notes)));
      this.observationState.set(frozen(notes));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Observation was not saved. Keep your draft and try exporting.' };
    }
  }
  /** Restore route/notes only; scientific data always comes from the active local pack. */
  importMission(raw: string): OperationResult {
    const image = this.image();
    if (!image) return { ok: false, error: 'Load the matching image before importing a mission.' };
    if (new TextEncoder().encode(raw).byteLength > MAX_MISSION_IMPORT_BYTES)
      return { ok: false, error: 'Mission files must be 1 MiB or smaller.' };
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'The selected file is not valid mission JSON.' };
    }
    if (!validEnvelope(value, image))
      return {
        ok: false,
        error: 'Invalid mission or a different image version. Current work is unchanged.',
      };

    const point = (p: Point | null): Point | null => (p === null ? null : { x: p.x, y: p.y });
    const route: Route = {
      start: point(value.route.start),
      destination: point(value.route.destination),
      waypoints: value.route.waypoints.map((p) => ({ x: p.x, y: p.y })),
    };
    const observations: Observation[] = value.observations.map((n) => ({
      id: n.id,
      imageRef: n.imageRef,
      createdAt: n.createdAt,
      text: n.text,
      position: point(n.position),
    }));
    try {
      // Persist before publishing state so an unsuccessful import leaves current work intact.
      localStorage.setItem(this.key(), JSON.stringify(this.envelope(route, observations)));
    } catch {
      return {
        ok: false,
        error: 'Import could not be saved on this device. Current work is unchanged.',
      };
    }
    this.routeState.set(frozen(route));
    this.observationState.set(frozen(observations));
    this.history.set([]);
    return { ok: true };
  }
  exportMission(): void {
    if (!this.image()) return;
    const payload = {
      ...this.envelope(),
      exportedAt: new Date().toISOString(),
      image: this.image(),
      markers: this.markers(),
      assessment: this.assessment(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    );
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'marswalk-mission.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
