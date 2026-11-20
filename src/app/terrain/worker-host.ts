/**
 * Worker-side message handling, independent of the Worker global so it can be
 * unit-tested. The search runs in chunks and yields to the event loop between
 * them so `cancel` and superseding `route` messages are processed (§6).
 */
import { checkGridMask, ImageGeoref, TERRAIN_CONTRACT_VERSION } from '../core/terrain';
import { TerrainWorkerRequest, TerrainWorkerResponse } from './protocol';
import { RouteOutcome, routeSearch, SearchOptions, TerrainGrid, validGrid } from './routing';

export type Post = (message: TerrainWorkerResponse) => void;
export type Yield = () => Promise<void>;

const macrotask: Yield = () => new Promise((resolve) => setTimeout(resolve, 0));

export class TerrainWorkerHost {
  private loaded: { packageId: string; image: ImageGeoref; grid: TerrainGrid } | null = null;
  private active: string | null = null;

  constructor(
    private readonly post: Post,
    private readonly options: SearchOptions = {},
    private readonly yieldToLoop: Yield = macrotask,
  ) {}

  handle(msg: TerrainWorkerRequest): Promise<void> | void {
    switch (msg?.type) {
      case 'load':
        return this.load(msg);
      case 'route':
        return this.route(msg);
      case 'cancel':
        if (this.active === msg.requestId) this.active = null;
        return;
    }
  }

  private load(msg: Extract<TerrainWorkerRequest, { type: 'load' }>) {
    this.active = null;
    this.loaded = null;
    const failed = (message: string) =>
      this.post({ type: 'load-failed', packageId: msg.packageId, message });
    if (msg.contractVersion !== TERRAIN_CONTRACT_VERSION)
      return failed('contract version mismatch');
    const n = msg.cols * msg.rows;
    if (!(msg.grid instanceof ArrayBuffer) || !(msg.mask instanceof ArrayBuffer))
      return failed('missing buffers');
    if (msg.grid.byteLength !== n * 4 || msg.mask.byteLength !== n)
      return failed('buffer size mismatch');
    const grid: TerrainGrid = {
      cols: msg.cols,
      rows: msg.rows,
      geotransform: msg.geotransform,
      elevation: new Float32Array(msg.grid),
      mask: new Uint8Array(msg.mask),
    };
    if (!validGrid(grid)) return failed('invalid grid');
    if (checkGridMask(grid.elevation, grid.mask) === null) return failed('grid and mask disagree');
    this.loaded = { packageId: msg.packageId, image: msg.image, grid };
    this.post({ type: 'loaded', packageId: msg.packageId });
  }

  private async route(msg: Extract<TerrainWorkerRequest, { type: 'route' }>) {
    const base = {
      type: 'result' as const,
      requestId: msg.requestId,
      packageId: msg.packageId,
      imageRef: msg.imageRef,
    };
    const reply = (o: RouteOutcome | { status: 'cancelled' }) =>
      this.post(
        o.status === 'preview-ready'
          ? { ...base, status: o.status, path: o.path, metrics: o.metrics }
          : o.status === 'cancelled'
            ? { ...base, status: 'cancelled', reasonCode: 'cancelled', message: null }
            : { ...base, status: o.status, reasonCode: o.reasonCode, message: o.message },
      );
    if (msg.contractVersion !== TERRAIN_CONTRACT_VERSION)
      return reply({
        status: 'error',
        reasonCode: 'worker-error',
        message: 'contract version mismatch',
      });
    const loaded = this.loaded;
    if (!loaded || loaded.packageId !== msg.packageId)
      return reply({ status: 'error', reasonCode: 'no-terrain-package', message: null });
    if (loaded.image.imageRef !== msg.imageRef)
      return reply({ status: 'error', reasonCode: 'image-ref-mismatch', message: null });

    // A new route implicitly supersedes (cancels) the previous one.
    this.active = msg.requestId;
    let outcome: RouteOutcome;
    try {
      const it = routeSearch(loaded.grid, loaded.image, msg, this.options);
      for (;;) {
        const step = it.next();
        if (step.done) {
          outcome = step.value;
          break;
        }
        await this.yieldToLoop();
        if (this.active !== msg.requestId) return reply({ status: 'cancelled' });
      }
    } catch (e) {
      outcome = {
        status: 'error',
        reasonCode: 'worker-error',
        message: e instanceof Error ? e.message : 'unknown',
      };
    }
    if (this.active !== msg.requestId) return reply({ status: 'cancelled' });
    this.active = null;
    reply(outcome);
  }
}
