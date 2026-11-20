// Synthetic grids in this file are test fixtures only — never runtime terrain.
import { Geotransform, ImageGeoref } from '../core/terrain';
import { planRoute, routeSearch, TerrainGrid } from './routing';

const COLS = 10;
const ROWS = 10;
// 40×40 px image at 0.25 m exactly covered by a 10×10 grid at 1 m.
const image: ImageGeoref = {
  imageRef: 'img',
  width: 40,
  height: 40,
  pixelSizeMeters: 0.25,
  xminMeters: 0,
  yminMeters: 0,
};
const gt: Geotransform = [0, 1, 0, 10, 0, -1];
/** Image point at the centre of grid cell (col,row); row 0 is north (top). */
const at = (col: number, row: number) => ({ x: (col + 0.5) * 4, y: (ROWS - row - 0.5) * 4 });

function grid(z: (c: number, r: number) => number, cols = COLS, rows = ROWS): TerrainGrid {
  const elevation = new Float32Array(cols * rows);
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const v = z(c, r);
      elevation[r * cols + c] = v;
      mask[r * cols + c] = Number.isNaN(v) ? 0 : 1;
    }
  return { cols, rows, geotransform: gt, elevation, mask };
}

/** Independent O(n²) Dijkstra over the same edge rules, written separately from the engine. */
function reference(
  g: TerrainGrid,
  s: [number, number],
  d: [number, number],
  cap: number,
): number | null {
  const n = g.cols * g.rows;
  const dist = new Array(n).fill(Infinity);
  const done = new Array(n).fill(false);
  const ok = (c: number, r: number) =>
    c >= 0 && r >= 0 && c < g.cols && r < g.rows && g.mask[r * g.cols + c] === 1;
  dist[s[1] * g.cols + s[0]] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    done[u] = true;
    const uc = u % g.cols;
    const ur = Math.floor(u / g.cols);
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dc && !dr) continue;
        const vc = uc + dc;
        const vr = ur + dr;
        if (!ok(vc, vr)) continue;
        if (dc && dr && !(ok(uc + dc, ur) && ok(uc, ur + dr))) continue;
        const run = Math.sqrt(dc * dc + dr * dr);
        const dz = g.elevation[vr * g.cols + vc] - g.elevation[u];
        if ((Math.atan(Math.abs(dz) / run) * 180) / Math.PI > cap) continue;
        const v = vr * g.cols + vc;
        dist[v] = Math.min(dist[v], dist[u] + Math.sqrt(run * run + dz * dz));
      }
  }
  const t = dist[d[1] * g.cols + d[0]];
  return t === Infinity ? null : t;
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

describe('terrain routing engine', () => {
  it('flat grid: straight diagonal path with exact endpoints and collinear vertices removed', () => {
    const o = planRoute(
      grid(() => 0),
      image,
      { start: at(0, 9), destination: at(9, 0), maxSegmentGradeDeg: 15 },
    );
    expect(o.status).toBe('preview-ready');
    if (o.status !== 'preview-ready') return;
    expect(o.path).toEqual([at(0, 9), at(9, 0)]);
    expect(o.metrics.sampledDistanceMeters).toBeCloseTo(9 * Math.SQRT2, 9);
    expect(o.metrics.maxSampledSegmentGradeDeg).toBe(0);
    expect(o.metrics.snapDistanceMeters.start).toBeCloseTo(0, 9);
  });

  it('ramp: terrain-following length counts elevation change', () => {
    const o = planRoute(
      grid((c) => c * 0.1),
      image,
      { start: at(0, 5), destination: at(9, 5), maxSegmentGradeDeg: 15 },
    );
    expect(o.status).toBe('preview-ready');
    if (o.status === 'preview-ready') {
      expect(o.metrics.sampledDistanceMeters).toBeCloseTo(9 * Math.hypot(1, 0.1), 6);
      expect(o.metrics.maxSampledSegmentGradeDeg).toBeCloseTo((Math.atan(0.1) * 180) / Math.PI, 4);
    }
  });

  it('steep wall forces a detour through the gap, and every segment respects the cap', () => {
    // Column 5 is a 10 m step except a gap at row 9.
    const g = grid((c, r) => (c === 5 && r !== 9 ? 10 : 0));
    const o = planRoute(g, image, {
      start: at(0, 0),
      destination: at(9, 0),
      maxSegmentGradeDeg: 20,
    });
    expect(o.status).toBe('preview-ready');
    if (o.status === 'preview-ready') {
      expect(o.metrics.maxSampledSegmentGradeDeg).toBeLessThanOrEqual(20);
      expect(o.metrics.sampledDistanceMeters).toBeCloseTo(reference(g, [0, 0], [9, 0], 20)!, 9);
      expect(o.path.some((p) => p.y < 4)).toBe(true); // passed through the southern gap
    }
  });

  it('nodata barrier without a gap: no path within constraints', () => {
    const o = planRoute(
      grid((c) => (c === 5 ? NaN : 0)),
      image,
      {
        start: at(0, 0),
        destination: at(9, 0),
        maxSegmentGradeDeg: 15,
      },
    );
    expect(o).toEqual({
      status: 'no-route',
      reasonCode: 'no-path-within-constraints',
      message: null,
    });
  });

  it('does not cut diagonally between two invalid orthogonal cells', () => {
    // Valid cells (0,0) and (1,1) touch only at a corner; (1,0) and (0,1) invalid.
    const g = grid((c, r) => (c + r === 1 && c <= 1 && r <= 1 ? NaN : 0), 2, 2);
    const small: ImageGeoref = { ...image, width: 8, height: 8 };
    const o = planRoute({ ...g, geotransform: [0, 1, 0, 2, 0, -1] }, small, {
      start: { x: 2, y: 6 },
      destination: { x: 6, y: 2 },
      maxSegmentGradeDeg: 15,
    });
    expect(o.status).toBe('no-route');
    if (o.status !== 'preview-ready') expect(o.reasonCode).toBe('grade-limit-exceeded');
  });

  it('reports endpoint and input failures with contract codes', () => {
    const flat = grid(() => 0);
    const q = { start: at(0, 0), destination: at(9, 9), maxSegmentGradeDeg: 15 };
    const code = (o: ReturnType<typeof planRoute>) =>
      o.status === 'preview-ready' ? null : o.reasonCode;
    expect(code(planRoute(flat, image, { ...q, destination: q.start }))).toBe('invalid-endpoints');
    expect(code(planRoute(flat, image, { ...q, start: { x: NaN, y: 1 } }))).toBe(
      'invalid-endpoints',
    );
    expect(code(planRoute(flat, image, { ...q, start: { x: 41, y: 1 } }))).toBe(
      'invalid-endpoints',
    );
    expect(code(planRoute(flat, image, { ...q, maxSegmentGradeDeg: 0 }))).toBe('invalid-endpoints');
    expect(code(planRoute(flat, image, { ...q, maxSegmentGradeDeg: 90 }))).toBe(
      'invalid-endpoints',
    );
    const half = {
      ...flat,
      cols: 5,
      elevation: flat.elevation.slice(0, 50),
      mask: flat.mask.slice(0, 50),
    };
    expect(code(planRoute(half, image, { ...q, destination: at(9, 0) }))).toBe(
      'endpoint-outside-coverage',
    );
    expect(
      code(
        planRoute(
          grid((c, r) => (c === 9 && r === 9 ? NaN : 0)),
          image,
          q,
        ),
      ),
    ).toBe('endpoint-on-nodata');
    expect(code(planRoute({ ...flat, cols: 11 }, image, q))).toBe('worker-error');
  });

  it('isolated endpoint at the chosen cap reports grade-limit-exceeded', () => {
    const o = planRoute(
      grid((c, r) => (c === 0 && r === 0 ? 0 : 5)),
      image,
      {
        start: at(0, 0),
        destination: at(9, 9),
        maxSegmentGradeDeg: 15,
      },
    );
    expect(o.status === 'no-route' && o.reasonCode).toBe('grade-limit-exceeded');
  });

  it('both endpoints in one cell: two-vertex path, zero sampled distance', () => {
    const o = planRoute(
      grid(() => 0),
      image,
      { start: { x: 0.5, y: 0.5 }, destination: { x: 3.5, y: 3.5 }, maxSegmentGradeDeg: 15 },
    );
    expect(o.status === 'preview-ready' && o.path.length).toBe(2);
    expect(o.status === 'preview-ready' && o.metrics.sampledDistanceMeters).toBe(0);
  });

  it('matches the independent reference solver on random terrain with holes', () => {
    for (let trial = 0; trial < 25; trial++) {
      const rand = seeded(trial + 1);
      const g = grid(() => (rand() < 0.15 ? NaN : rand() * 0.8));
      const s: [number, number] = [0, 0];
      const d: [number, number] = [9, 9];
      g.mask[0] = 1;
      g.elevation[0] = 0;
      g.mask[99] = 1;
      g.elevation[99] = 0;
      const ref = reference(g, s, d, 30);
      const o = planRoute(g, image, {
        start: at(...s),
        destination: at(...d),
        maxSegmentGradeDeg: 30,
      });
      if (ref === null) expect(o.status).toBe('no-route');
      else {
        expect(o.status).toBe('preview-ready');
        if (o.status === 'preview-ready')
          expect(o.metrics.sampledDistanceMeters).toBeCloseTo(ref, 6);
      }
    }
  });

  it('is deterministic for the same grid and query', () => {
    const rand = seeded(42);
    const g = grid(() => rand() * 0.3);
    const q = { start: at(0, 3), destination: at(9, 6), maxSegmentGradeDeg: 20 };
    expect(planRoute(g, image, q)).toEqual(planRoute(g, image, q));
  });

  it('yields at the chunk interval and enforces the search limit', () => {
    const q = { start: at(0, 0), destination: at(9, 9), maxSegmentGradeDeg: 15 };
    const it = routeSearch(
      grid(() => 0),
      image,
      q,
      { chunk: 1 },
    );
    let yields = 0;
    while (!it.next().done) yields++;
    expect(yields).toBeGreaterThan(0);
    const limited = planRoute(
      grid(() => 0),
      image,
      q,
      { maxExpansions: 3 },
    );
    expect(limited).toEqual({
      status: 'error',
      reasonCode: 'worker-error',
      message: 'search-limit',
    });
  });
});
