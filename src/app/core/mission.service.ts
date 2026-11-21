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
import {
  MAX_SUGGESTION_VERTICES,
  TERRAIN_CONTRACT_VERSION,
  TerrainSuggestionRecord,
  validTerrainSuggestion,
} from './terrain';

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
  private readonly suggestionState = signal<TerrainSuggestionRecord | null>(null);
  /** Provenance of the current route when it came from an accepted terrain suggestion (§8). */
  readonly terrainSuggestion = this.suggestionState.asReadonly();
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

  private recoveryFinished = false;
  private acknowledgedSavedRaw: string | null | undefined;
  private editRevision = 0;
  private readonly recoveryState = signal<string | null>(null);
  readonly recoveryMessage = this.recoveryState.asReadonly();

  /** Call once from root assembly. URLs respect the application's deployed base. */
  initialize(): Promise<void> {
    if (!this.initialization) {
      const revision = this.editRevision;
      this.initialization = this.loadData()
        .then(() => {
          if (this.dataStatus() !== 'ready' || !this.image() || revision !== this.editRevision)
            return;
          try {
            const raw = localStorage.getItem(this.key());
            if (raw === null) {
              this.acknowledgedSavedRaw = null;
              return;
            }
            const result = this.loadRoute();
            this.recoveryState.set(
              result.ok
                ? `Restored saved route and ${this.observations().length} observation(s) on this device.`
                : `${result.error} Saved data was not deleted. Export current work before replacing it.`,
            );
          } catch {
            this.recoveryState.set(
              'Saved mission could not be checked. Browser storage may be blocked; export your mission to keep a copy.',
            );
          }
        })
        .finally(() => {
          this.recoveryFinished = true;
        });
    }
    return this.initialization;
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
  private changeRoute(next: Route, suggestion: TerrainSuggestionRecord | null = null): void {
    this.editRevision++;
    this.history.update((h) => [...h, clone(this.route())]);
    this.routeState.set(frozen(next));
    // Any manual edit means the route is no longer the accepted suggestion.
    this.suggestionState.set(suggestion ? frozen(clone(suggestion)) : null);
  }
  /**
   * Contract §8 adapter: replace the route with an accepted, non-stale engine path.
   * Pushes undo history and never saves; "Save Route" stays an explicit user action.
   */
  replaceRouteFromSuggestion(
    path: readonly Point[],
    provenance: Omit<TerrainSuggestionRecord, 'acceptedAtUtc' | 'contractVersion'>,
  ): OperationResult {
    const image = this.image();
    if (!image) return { ok: false, error: 'Load image data before accepting a suggestion.' };
    if (!Array.isArray(path) || path.length < 2 || path.length > MAX_SUGGESTION_VERTICES)
      return {
        ok: false,
        error: 'Suggested path is empty or too long. Current route is unchanged.',
      };
    if (!path.every((p) => validPoint(p, image)))
      return {
        ok: false,
        error: 'Suggested path leaves the active image. Current route is unchanged.',
      };
    const record: TerrainSuggestionRecord = {
      contractVersion: TERRAIN_CONTRACT_VERSION,
      packageId: provenance.packageId,
      requestId: provenance.requestId,
      maxSegmentGradeDeg: provenance.maxSegmentGradeDeg,
      acceptedAtUtc: new Date().toISOString(),
    };
    if (!validTerrainSuggestion(record))
      return {
        ok: false,
        error: 'Suggestion provenance is incomplete. Current route is unchanged.',
      };
    const points = path.map((p) => ({ x: p.x, y: p.y }));
    this.changeRoute(
      { start: points[0], destination: points.at(-1)!, waypoints: points.slice(1, -1) },
      record,
    );
    return { ok: true };
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
  /**
   * Moves an existing route point (map drag). The first move of a drag pushes undo history;
   * later moves of the same drag update in place. Any move ends terrain-suggestion provenance.
   */
  moveRoutePoint(key: string, point: Point, firstMoveOfDrag: boolean): boolean {
    const image = this.image();
    if (!image || !validPoint(point, image)) return false;
    const next = clone(this.route());
    const p = { x: point.x, y: point.y };
    const m = /^waypoint-(\d+)$/.exec(key);
    if (key === 'start' && next.start) next.start = p;
    else if (key === 'destination' && next.destination) next.destination = p;
    else if (m && Number(m[1]) < next.waypoints.length) next.waypoints[Number(m[1])] = p;
    else return false;
    if (firstMoveOfDrag) this.changeRoute(next);
    else {
      this.editRevision++;
      this.routeState.set(frozen(next));
      this.suggestionState.set(null);
    }
    return true;
  }
  /** Removes one waypoint (undo-able). */
  removeWaypoint(index: number): boolean {
    const next = clone(this.route());
    if (!Number.isInteger(index) || index < 0 || index >= next.waypoints.length) return false;
    next.waypoints.splice(index, 1);
    this.changeRoute(next);
    return true;
  }
  undoRoute(): void {
    const previous = this.history().at(-1);
    if (previous) {
      this.editRevision++;
      this.routeState.set(frozen(clone(previous)));
      this.history.update((h) => h.slice(0, -1));
      this.suggestionState.set(null);
    }
  }
  clearRoute(): void {
    this.changeRoute(emptyRoute());
  }
  private key(): string {
    return `marswalk:v1:${this.image()!.imageRef}`;
  }
  private envelope(
    route = this.route(),
    observations = this.observations(),
    terrainSuggestion = this.terrainSuggestion(),
  ) {
    const base = { schemaVersion: 1, imageRef: this.image()!.imageRef, route, observations };
    // Field omitted entirely for ordinary routes, so existing saved bytes are unchanged.
    return terrainSuggestion ? { ...base, terrainSuggestion } : base;
  }
  /** Optional provenance from a stored/imported envelope; invalid provenance is dropped, not trusted. */
  private readSuggestion(value: object): TerrainSuggestionRecord | null {
    const s = (value as { terrainSuggestion?: unknown }).terrainSuggestion;
    return validTerrainSuggestion(s)
      ? frozen({
          contractVersion: s.contractVersion,
          packageId: s.packageId,
          requestId: s.requestId,
          maxSegmentGradeDeg: s.maxSegmentGradeDeg,
          acceptedAtUtc: s.acceptedAtUtc,
        })
      : null;
  }
  /** Never overwrite an unreadable, un-restored or concurrently changed saved record. */
  private persistMission(raw: string): OperationResult {
    if (!this.recoveryFinished || this.dataStatus() !== 'ready')
      return {
        ok: false,
        error: 'Wait for saved-mission recovery before saving. Your draft is unchanged.',
      };
    try {
      const existing = localStorage.getItem(this.key());
      if (existing !== null) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(existing);
        } catch {
          return {
            ok: false,
            error:
              'Saved mission is unreadable and was not overwritten. Export current work; preserve the existing browser record for recovery.',
          };
        }
        if (!validEnvelope(parsed, this.image()!))
          return {
            ok: false,
            error:
              'Saved mission is invalid and was not overwritten. Export current work and preserve the existing browser record.',
          };
        if (existing !== this.acknowledgedSavedRaw)
          return {
            ok: false,
            error:
              'Saved mission has not been restored or changed in another tab. Export current work before using Load route to review the saved mission.',
          };
      } else if (typeof this.acknowledgedSavedRaw === 'string') {
        return {
          ok: false,
          error: 'Saved mission changed in another tab. Export current work before reloading.',
        };
      }
      localStorage.setItem(this.key(), raw);
      this.acknowledgedSavedRaw = raw;
      return { ok: true };
    } catch {
      return {
        ok: false,
        error:
          'Browser storage is unavailable or full. Export your mission; existing work was not replaced.',
      };
    }
  }
  saveRoute(): OperationResult {
    if (!this.image()) return { ok: false, error: 'Load image data before saving.' };
    return this.persistMission(JSON.stringify(this.envelope()));
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
      this.acknowledgedSavedRaw = raw;
      this.editRevision++;
      this.routeState.set(frozen(clone(value.route)));
      this.observationState.set(frozen(clone(value.observations)));
      this.suggestionState.set(this.readSuggestion(value));
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
    const saved = this.persistMission(JSON.stringify(this.envelope(this.route(), notes)));
    if (!saved.ok) return saved;
    this.editRevision++;
    this.observationState.set(frozen(notes));
    return { ok: true };
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
    const suggestion = this.readSuggestion(value);
    // Persist before publishing state; guard unreadable or concurrently changed records.
    const saved = this.persistMission(
      JSON.stringify(this.envelope(route, observations, suggestion)),
    );
    if (!saved.ok) return saved;
    this.editRevision++;
    this.routeState.set(frozen(route));
    this.observationState.set(frozen(observations));
    this.suggestionState.set(suggestion);
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
