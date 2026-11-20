/**
 * Main-thread client (§6): one active request, explicit cancel, and the stale
 * guard. Results whose requestId/packageId/imageRef/endpoints/grade no longer
 * match current state are reported as `stale-response` and never as a preview.
 */
import { Point } from '../core/models';
import { Geotransform, ImageGeoref, TERRAIN_CONTRACT_VERSION } from '../core/terrain';
import { TerrainResult, TerrainWorkerRequest, TerrainWorkerResponse } from './protocol';

export interface WorkerLike {
  postMessage(message: TerrainWorkerRequest, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((e: MessageEvent<TerrainWorkerResponse>) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
}
export interface RouteRequestInput {
  readonly packageId: string;
  readonly imageRef: string;
  readonly start: Point;
  readonly destination: Point;
  readonly maxSegmentGradeDeg: number;
}
export type ClientEvent =
  | { readonly kind: 'loaded'; readonly packageId: string }
  | { readonly kind: 'load-failed'; readonly packageId: string; readonly message: string }
  | { readonly kind: 'result'; readonly result: TerrainResult }
  | { readonly kind: 'stale'; readonly requestId: string }
  | { readonly kind: 'worker-error'; readonly requestId: string | null; readonly message: string };

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export class TerrainRoutingClient {
  private worker: WorkerLike | null = null;
  private pending: (RouteRequestInput & { requestId: string }) | null = null;

  constructor(
    private readonly createWorker: () => WorkerLike,
    private readonly emit: (event: ClientEvent) => void,
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  private ensure(): WorkerLike {
    if (!this.worker) {
      const w = this.createWorker();
      w.onmessage = (e) => this.receive(e.data);
      w.onerror = (e) => {
        const requestId = this.pending?.requestId ?? null;
        this.pending = null;
        this.dispose();
        this.emit({ kind: 'worker-error', requestId, message: e.message || 'worker failed' });
      };
      this.worker = w;
    }
    return this.worker;
  }

  /** Grid/mask buffers are transferred: callers must not reuse them. */
  load(
    packageId: string,
    image: ImageGeoref,
    cols: number,
    rows: number,
    geotransform: Geotransform,
    grid: ArrayBuffer,
    mask: ArrayBuffer,
  ) {
    this.pending = null;
    this.ensure().postMessage(
      {
        type: 'load',
        contractVersion: TERRAIN_CONTRACT_VERSION,
        packageId,
        image,
        cols,
        rows,
        geotransform,
        grid,
        mask,
      },
      [grid, mask],
    );
  }

  request(input: RouteRequestInput): string {
    const requestId = this.newId();
    this.pending = {
      ...input,
      start: { ...input.start },
      destination: { ...input.destination },
      requestId,
    };
    this.ensure().postMessage({
      type: 'route',
      contractVersion: TERRAIN_CONTRACT_VERSION,
      requestId,
      ...input,
    });
    return requestId;
  }

  cancel() {
    if (!this.pending) return;
    this.worker?.postMessage({ type: 'cancel', requestId: this.pending.requestId });
  }

  /**
   * Call whenever planner state changes. If it no longer matches the pending
   * request, the request is cancelled and its eventual result treated as stale.
   */
  invalidateIfChanged(current: RouteRequestInput) {
    const p = this.pending;
    if (!p) return;
    const same =
      p.packageId === current.packageId &&
      p.imageRef === current.imageRef &&
      samePoint(p.start, current.start) &&
      samePoint(p.destination, current.destination) &&
      p.maxSegmentGradeDeg === current.maxSegmentGradeDeg;
    if (!same) {
      this.worker?.postMessage({ type: 'cancel', requestId: p.requestId });
      this.pending = null;
    }
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending = null;
  }

  private receive(m: TerrainWorkerResponse) {
    if (m.type === 'loaded') return this.emit({ kind: 'loaded', packageId: m.packageId });
    if (m.type === 'load-failed')
      return this.emit({ kind: 'load-failed', packageId: m.packageId, message: m.message });
    if (m.type !== 'result') return;
    const p = this.pending;
    if (
      !p ||
      p.requestId !== m.requestId ||
      p.packageId !== m.packageId ||
      p.imageRef !== m.imageRef
    )
      return this.emit({ kind: 'stale', requestId: m.requestId });
    this.pending = null;
    this.emit({ kind: 'result', result: m });
  }
}
