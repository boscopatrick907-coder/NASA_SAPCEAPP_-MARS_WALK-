/**
 * Terrain contract v1 §5 routing engine (pure, synchronous-chunked).
 * Shortest sampled terrain-following path under a segment-grade cap on an
 * 8-connected valid-cell graph. Not a safety, traversability or local-slope model.
 */
import { Point } from '../core/models';
import {
  cellCentre,
  containingCell,
  Geotransform,
  GridIndex,
  ImageGeoref,
  imageToProjected,
  projectedToImage,
  segmentGradeDeg,
  TerrainFailureCode,
} from '../core/terrain';

export interface TerrainGrid {
  readonly cols: number;
  readonly rows: number;
  readonly geotransform: Geotransform;
  readonly elevation: Float32Array;
  readonly mask: Uint8Array;
}
export interface RouteQuery {
  readonly start: Point;
  readonly destination: Point;
  readonly maxSegmentGradeDeg: number;
}
export interface TerrainRouteMetrics {
  readonly sampledDistanceMeters: number;
  readonly maxSampledSegmentGradeDeg: number;
  readonly vertexCount: number;
  readonly cellsVisited: number;
  readonly preparedSpacingMeters: number;
  readonly snapDistanceMeters: { readonly start: number; readonly destination: number };
  readonly missingInformation: readonly string[];
}
export type RouteOutcome =
  | {
      readonly status: 'preview-ready';
      readonly path: Point[];
      readonly metrics: TerrainRouteMetrics;
    }
  | {
      readonly status: 'no-route' | 'error';
      readonly reasonCode: TerrainFailureCode;
      readonly message: string | null;
    };
export interface SearchOptions {
  /** Node expansions between yields (cancel checkpoints). Contract: ≤ 10 000. */
  readonly chunk?: number;
  /** Abort with worker-error/search-limit above this many expansions. */
  readonly maxExpansions?: number;
}

export const DEFAULT_CHUNK = 10_000;
export const MISSING_INFORMATION = [
  'Grade is sampled between grid-cell centres; local slope, rocks and sub-cell obstacles are not represented.',
  'The first and last partial segments (exact endpoint to its cell centre) are not grade-checked.',
  'No hazard, traction, illumination or communication information is included.',
] as const;

// 8 neighbours: dc, dr. Order fixed for determinism.
const STEPS: readonly (readonly [number, number])[] = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

const fail = (
  status: 'no-route' | 'error',
  reasonCode: TerrainFailureCode,
  message: string | null = null,
): RouteOutcome => ({ status, reasonCode, message });

export function validGrid(g: TerrainGrid): boolean {
  const n = g.cols * g.rows;
  return (
    Number.isInteger(g.cols) &&
    Number.isInteger(g.rows) &&
    g.cols > 0 &&
    g.rows > 0 &&
    g.elevation.length === n &&
    g.mask.length === n &&
    g.geotransform[1] > 0 &&
    Math.abs(g.geotransform[5] + g.geotransform[1]) < 1e-9 * g.geotransform[1]
  );
}

/** Binary min-heap on (f, index): ties resolve to lower row, then lower col. */
class Heap {
  private readonly f: number[] = [];
  private readonly i: number[] = [];
  get size() {
    return this.i.length;
  }
  private less(a: number, b: number) {
    return this.f[a] < this.f[b] || (this.f[a] === this.f[b] && this.i[a] < this.i[b]);
  }
  private swap(a: number, b: number) {
    [this.f[a], this.f[b]] = [this.f[b], this.f[a]];
    [this.i[a], this.i[b]] = [this.i[b], this.i[a]];
  }
  push(f: number, i: number) {
    this.f.push(f);
    this.i.push(i);
    let c = this.i.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (!this.less(c, p)) break;
      this.swap(c, p);
      c = p;
    }
  }
  pop(): number {
    const top = this.i[0];
    const lastF = this.f.pop()!;
    const lastI = this.i.pop()!;
    if (this.i.length) {
      this.f[0] = lastF;
      this.i[0] = lastI;
      let p = 0;
      for (;;) {
        const l = 2 * p + 1;
        const r = l + 1;
        let m = p;
        if (l < this.i.length && this.less(l, m)) m = l;
        if (r < this.i.length && this.less(r, m)) m = r;
        if (m === p) break;
        this.swap(p, m);
        p = m;
      }
    }
    return top;
  }
}

/**
 * Generator search: yields `undefined` every `chunk` expansions so a driver can
 * check for cancellation, and returns the outcome.
 */
export function* routeSearch(
  grid: TerrainGrid,
  image: ImageGeoref,
  q: RouteQuery,
  opts: SearchOptions = {},
): Generator<undefined, RouteOutcome, void> {
  if (!validGrid(grid)) return fail('error', 'worker-error', 'invalid grid dimensions');
  const finitePoint = (p: Point) =>
    Number.isFinite(p?.x) &&
    Number.isFinite(p?.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x <= image.width &&
    p.y <= image.height;
  if (!finitePoint(q.start) || !finitePoint(q.destination))
    return fail('no-route', 'invalid-endpoints', 'endpoint missing or outside image');
  if (q.start.x === q.destination.x && q.start.y === q.destination.y)
    return fail('no-route', 'invalid-endpoints', 'identical endpoints');
  const cap = q.maxSegmentGradeDeg;
  if (!Number.isFinite(cap) || cap <= 0 || cap >= 90)
    return fail('no-route', 'invalid-endpoints', 'grade cap must be between 0 and 90 degrees');

  const { cols, rows, geotransform: gt, elevation, mask } = grid;
  const s = containingCell(q.start, image, gt, cols, rows);
  const d = containingCell(q.destination, image, gt, cols, rows);
  if (!s || !d) return fail('no-route', 'endpoint-outside-coverage');
  const si = s.row * cols + s.col;
  const di = d.row * cols + d.col;
  if (!mask[si] || !mask[di]) return fail('no-route', 'endpoint-on-nodata');

  const h = gt[1];
  const valid = (c: number, r: number) =>
    c >= 0 && r >= 0 && c < cols && r < rows && mask[r * cols + c] === 1;
  const edge = (c: number, r: number, dc: number, dr: number): number | null => {
    const nc = c + dc;
    const nr = r + dr;
    if (!valid(nc, nr)) return null;
    if (dc && dr && (!valid(c + dc, r) || !valid(c, r + dr))) return null; // no corner cutting
    const run = dc && dr ? Math.SQRT2 * h : h;
    const dz = elevation[nr * cols + nc] - elevation[r * cols + c];
    if (segmentGradeDeg(dz, run) > cap) return null;
    return Math.hypot(run, dz);
  };
  const isolated = (cell: GridIndex) =>
    STEPS.every(([dc, dr]) => edge(cell.col, cell.row, dc, dr) === null);
  const snap = (p: Point, cell: GridIndex) => {
    const a = imageToProjected(p, image);
    const b = cellCentre(cell, gt);
    return Math.hypot(a.e - b.e, a.n - b.n);
  };

  const n = cols * rows;
  const g = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heuristic = (i: number) => {
    const dx = Math.abs((i % cols) - d.col);
    const dy = Math.abs(Math.floor(i / cols) - d.row);
    // Octile planar distance: admissible since every edge cost ≥ its planar run.
    return h * (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy));
  };
  const chunk = Math.max(1, Math.min(opts.chunk ?? DEFAULT_CHUNK, DEFAULT_CHUNK));
  const maxExpansions = opts.maxExpansions ?? Infinity;

  let visited = 0;
  if (si !== di) {
    if (isolated(s) || isolated(d)) return fail('no-route', 'grade-limit-exceeded');
    const heap = new Heap();
    g[si] = 0;
    heap.push(heuristic(si), si);
    let found = false;
    while (heap.size) {
      const i = heap.pop();
      if (closed[i]) continue;
      closed[i] = 1;
      visited++;
      if (i === di) {
        found = true;
        break;
      }
      if (visited > maxExpansions) return fail('error', 'worker-error', 'search-limit');
      if (visited % chunk === 0) yield;
      const c = i % cols;
      const r = (i - c) / cols;
      for (const [dc, dr] of STEPS) {
        const cost = edge(c, r, dc, dr);
        if (cost === null) continue;
        const j = (r + dr) * cols + (c + dc);
        if (closed[j]) continue;
        const ng = g[i] + cost;
        if (ng < g[j]) {
          g[j] = ng;
          parent[j] = i;
          heap.push(ng + heuristic(j), j);
        }
      }
    }
    if (!found) return fail('no-route', 'no-path-within-constraints');
  }

  // Reconstruct, then drop exactly collinear interior vertices.
  const cells: number[] = [];
  for (let i = di; i !== -1; i = i === si ? -1 : parent[i]) cells.push(i);
  cells.reverse();
  let maxGrade = 0;
  for (let k = 1; k < cells.length; k++) {
    const a = cells[k - 1];
    const b = cells[k];
    const diagonal = a % cols !== b % cols && Math.floor(a / cols) !== Math.floor(b / cols);
    maxGrade = Math.max(
      maxGrade,
      segmentGradeDeg(elevation[b] - elevation[a], diagonal ? Math.SQRT2 * h : h),
    );
  }
  const kept = cells.filter((cur, k) => {
    if (k === 0 || k === cells.length - 1) return true;
    const prev = cells[k - 1];
    const next = cells[k + 1];
    return cur - prev !== next - cur;
  });
  const toPoint = (i: number) => {
    const p = projectedToImage(cellCentre({ col: i % cols, row: Math.floor(i / cols) }, gt), image);
    return { x: p.x, y: p.y };
  };
  const path: Point[] = [{ ...q.start }, ...kept.slice(1, -1).map(toPoint), { ...q.destination }];
  return {
    status: 'preview-ready',
    path,
    metrics: {
      sampledDistanceMeters: g[di] === Infinity ? 0 : si === di ? 0 : g[di],
      maxSampledSegmentGradeDeg: maxGrade,
      vertexCount: path.length,
      cellsVisited: visited,
      preparedSpacingMeters: h,
      snapDistanceMeters: { start: snap(q.start, s), destination: snap(q.destination, d) },
      missingInformation: [...MISSING_INFORMATION],
    },
  };
}

/** Run the search to completion synchronously (tests, small grids). */
export function planRoute(
  grid: TerrainGrid,
  image: ImageGeoref,
  q: RouteQuery,
  opts?: SearchOptions,
): RouteOutcome {
  const it = routeSearch(grid, image, q, opts);
  for (;;) {
    const step = it.next();
    if (step.done) return step.value;
  }
}
