/**
 * Coordinator integration of terrain preview (contract v1 §6–§8): owns the routing worker,
 * the planner-facing preview state and the map-facing suggestion. Never saves; only
 * `accept()` changes the route, through MissionService's adapter with undo.
 */
import { computed, effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { TerrainSuggestionStore } from '../core/terrain-suggestion.store';
import { Point } from '../core/models';
import { MissionService } from '../core/mission.service';
import { imageGeoref } from '../core/terrain';
import { TerrainService } from '../core/terrain.service';
import type {
  TerrainPreviewAcceptPayload,
  TerrainPreviewState,
  TerrainRouteRequestPayload,
} from '../terrain-planner/terrain-planner.models';
import { ClientEvent, TerrainRoutingClient, WorkerLike } from './terrain-routing.client';

export const TERRAIN_WORKER_FACTORY = new InjectionToken<() => WorkerLike>(
  'terrain worker factory',
  {
    providedIn: 'root',
    factory: () => () =>
      new Worker(new URL('./terrain-routing.worker', import.meta.url), {
        type: 'module',
      }) as unknown as WorkerLike,
  },
);

const IDLE: TerrainPreviewState = { status: 'idle', requestId: null };
const samePoint = (a: Point | null | undefined, b: Point | null | undefined) =>
  !!a && !!b && a.x === b.x && a.y === b.y;

@Injectable({ providedIn: 'root' })
export class TerrainPreviewService {
  private readonly mission = inject(MissionService);
  private readonly terrain = inject(TerrainService);
  private readonly createWorker = inject(TERRAIN_WORKER_FACTORY);

  private client: TerrainRoutingClient | null = null;
  private loadedPackageId: string | null = null;
  private loading: Promise<boolean> | null = null;
  private resolveLoad: ((ok: boolean) => void) | null = null;
  private request: TerrainRouteRequestPayload | null = null;

  private readonly previewState = signal<TerrainPreviewState>(IDLE);
  private readonly pathState = signal<readonly Point[] | null>(null);
  readonly preview = this.previewState.asReadonly();

  /**
   * Path for the map: only a ready preview whose image, package and endpoints still match
   * the current mission. Anything else draws nothing (Willy 1 proposal, guards 1–3).
   */
  readonly mapSuggestion = computed<readonly Point[] | null>(() => {
    const p = this.previewState();
    const path = this.pathState();
    const route = this.mission.route();
    if (p.status !== 'preview-ready' || !path) return null;
    if (p.resultForImageRef !== this.mission.image()?.imageRef) return null;
    if (p.resultForPackageId !== this.terrain.manifest()?.packageId) return null;
    if (!samePoint(p.resultForEndpoints?.start, route.start)) return null;
    if (!samePoint(p.resultForEndpoints?.destination, route.destination)) return null;
    return path;
  });

  private readonly store = inject(TerrainSuggestionStore);
  /** Publishes the guarded suggestion to the eagerly loaded map. */
  private readonly publish = effect(() => this.store.set(this.mapSuggestion()));

  /** Loads the verified package into the worker once. Resolves false when terrain is unavailable. */
  private ensureLoaded(): Promise<boolean> {
    const manifest = this.terrain.manifest();
    if (this.loadedPackageId && this.loadedPackageId === manifest?.packageId)
      return Promise.resolve(true);
    if (this.loading) return this.loading;
    const georef = imageGeoref(this.mission.image());
    const buffers = this.terrain.packageBuffers();
    if (this.terrain.gate() !== null || !manifest || !georef || !buffers)
      return Promise.resolve(false);
    this.loading = new Promise<boolean>((resolve) => (this.resolveLoad = resolve));
    this.ensureClient().load(
      manifest.packageId,
      georef,
      manifest.grid.cols,
      manifest.grid.rows,
      manifest.grid.geotransform,
      buffers.grid,
      buffers.mask,
    );
    return this.loading;
  }

  private ensureClient(): TerrainRoutingClient {
    return (this.client ??= new TerrainRoutingClient(this.createWorker, (e) => this.onEvent(e)));
  }

  async requestPreview(payload: TerrainRouteRequestPayload): Promise<void> {
    this.request = payload;
    this.pathState.set(null);
    this.previewState.set({
      status: 'running',
      requestId: payload.requestId,
      resultForImageRef: payload.imageRef,
      resultForPackageId: payload.packageId,
      resultForEndpoints: { start: { ...payload.start }, destination: { ...payload.destination } },
      resultForMaxGrade: payload.maxSegmentGrade,
      resultForGradeUnit: payload.gradeUnit,
    });
    await this.terrain.initialize();
    const ok = await this.ensureLoaded();
    if (this.request?.requestId !== payload.requestId) return; // superseded while loading
    if (!ok) {
      this.fail(
        payload.requestId,
        this.terrain.gate() ?? 'no-terrain-package',
        this.terrain.message(),
      );
      return;
    }
    this.client!.request(
      {
        packageId: payload.packageId,
        imageRef: payload.imageRef,
        start: payload.start,
        destination: payload.destination,
        maxSegmentGradeDeg: payload.maxSegmentGradeDeg,
      },
      payload.requestId,
    );
  }

  cancel(): void {
    this.client?.cancel();
  }

  reject(): void {
    this.request = null;
    this.pathState.set(null);
    this.previewState.set(IDLE);
  }

  /** Contract §8: replace the route with the accepted path (undo-able, not saved). */
  accept(payload: TerrainPreviewAcceptPayload): { ok: boolean; error?: string } {
    const p = this.previewState();
    const path = this.mapSuggestion();
    if (p.status !== 'preview-ready' || p.requestId !== payload.requestId || !path || !this.request)
      return { ok: false, error: 'This preview is no longer current. Request a new one.' };
    const result = this.mission.replaceRouteFromSuggestion(path, {
      packageId: payload.packageId,
      requestId: payload.requestId,
      maxSegmentGradeDeg: this.request.maxSegmentGradeDeg,
    });
    if (result.ok) this.reject();
    return result;
  }

  private fail(
    requestId: string,
    reasonCode: NonNullable<TerrainPreviewState['reasonCode']>,
    message: string | null,
  ) {
    const p = this.previewState();
    if (p.requestId !== requestId) return;
    this.previewState.set({
      ...p,
      status:
        reasonCode === 'cancelled'
          ? 'cancelled'
          : reasonCode === 'worker-error' || reasonCode === 'unknown'
            ? 'error'
            : 'no-route',
      reasonCode,
      engineMessage: message,
    });
  }

  private onEvent(e: ClientEvent): void {
    switch (e.kind) {
      case 'loaded':
        this.loadedPackageId = e.packageId;
        this.loading = null;
        this.resolveLoad?.(true);
        return;
      case 'load-failed':
        this.loadedPackageId = null;
        this.loading = null;
        this.resolveLoad?.(false);
        return;
      case 'worker-error':
        this.loadedPackageId = null;
        this.client = null;
        if (e.requestId) this.fail(e.requestId, 'worker-error', e.message);
        return;
      case 'stale':
        return; // the planner explains staleness; nothing is drawn or accepted
      case 'result': {
        const r = e.result;
        const p = this.previewState();
        if (p.requestId !== r.requestId) return;
        if (r.status !== 'preview-ready') return this.fail(r.requestId, r.reasonCode, r.message);
        this.pathState.set(r.path);
        this.previewState.set({
          ...p,
          status: 'preview-ready',
          engineResult: {
            objectiveLabel: 'Shortest sampled path under the grade limit',
            sampledDistanceMeters: r.metrics.sampledDistanceMeters,
            maxSampledSegmentGrade: r.metrics.maxSampledSegmentGradeDeg,
            gradeUnit: 'deg',
            terrainResolutionMeters: r.metrics.preparedSpacingMeters,
            waypointCount: Math.max(0, r.metrics.vertexCount - 2),
            missingInformation: r.metrics.missingInformation,
            caveatNote:
              'Experimental sampled-grade preview from a 1 m HiRISE stereo DTM. Not a safety, traction or obstacle assessment.',
          },
        });
      }
    }
  }
}
