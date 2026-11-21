// Synthetic grids for tests only (never runtime terrain).
import {
  elevationAt,
  gridImageBounds,
  hillshade,
  latLonAt,
  routeProfile,
  slopeAt,
  slopeGrid,
  TerrainSampler,
} from './terrain-profile';

const N = 10;
/** 40×40 px image at 0.25 m exactly covered by a 10×10 grid at 1 m; z = f(east m, north m). */
function sampler(f: (e: number, n: number) => number, hole?: [number, number]): TerrainSampler {
  const elevation = new Float32Array(N * N);
  const mask = new Uint8Array(N * N);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const e = c + 0.5;
      const n = 10 - (r + 0.5);
      const isHole = hole && hole[0] === c && hole[1] === r;
      elevation[r * N + c] = isHole ? NaN : f(e, n);
      mask[r * N + c] = isHole ? 0 : 1;
    }
  return {
    georef: {
      imageRef: 'img',
      width: 40,
      height: 40,
      pixelSizeMeters: 0.25,
      xminMeters: 0,
      yminMeters: 0,
    },
    geotransform: [0, 1, 0, 10, 0, -1],
    cols: N,
    rows: N,
    elevation,
    mask,
    centerLongitudeDeg: 137.3,
    radiusMeters: 3396190,
  };
}
/** Image point at projected (e, n) metres. */
const at = (e: number, n: number) => ({ x: e * 4, y: n * 4 });

describe('elevationAt / slopeAt', () => {
  it('interpolates a plane exactly between cell centres', () => {
    const s = sampler((e, n) => 2 * e + 3 * n + 100);
    expect(elevationAt(s, at(3.5, 4.5))).toBeCloseTo(2 * 3.5 + 3 * 4.5 + 100, 6);
    expect(elevationAt(s, at(3.75, 4.25))).toBeCloseTo(2 * 3.75 + 3 * 4.25 + 100, 6);
  });
  it('slope and downslope aspect of a plane rising to the east', () => {
    const s = sampler((e) => e); // 45° rising east → downslope faces west (270°)
    const sl = slopeAt(s, at(5, 5))!;
    expect(sl.slopeDeg).toBeCloseTo(45, 6);
    expect(sl.aspectDeg).toBeCloseTo(270, 6);
    const north = slopeAt(
      sampler((_e, n) => -0.5 * n),
      at(5, 5),
    )!; // falls to the north
    expect(north.aspectDeg).toBeCloseTo(0, 6);
    expect(north.slopeDeg).toBeCloseTo((Math.atan(0.5) * 180) / Math.PI, 6);
  });
  it('null outside the grid, on nodata, and slope needs all neighbours', () => {
    const s = sampler(() => 1, [5, 5]);
    expect(elevationAt(s, { x: -1, y: 1 })).toBeNull();
    expect(elevationAt(s, at(5.5, 4.5))).toBeNull(); // centre of the hole cell
    expect(slopeAt(s, at(5.5, 3.5))).toBeNull(); // neighbour of the hole
    expect(slopeAt(s, at(0.5, 0.5))).toBeNull(); // grid edge
    expect(elevationAt(s, { x: NaN, y: 1 })).toBeNull();
  });
  it('lat/lon from the equirectangular inverse', () => {
    const s = sampler(() => 0);
    const ll = latLonAt(s, at(0, 0));
    expect(ll.lat).toBe(0);
    expect(ll.lon).toBe(137.3);
    expect(latLonAt(s, at((3396190 * (Math.PI / 180)) / 1e6, 0)).lon).toBeCloseTo(137.3 + 1e-6, 9);
  });
});

describe('routeProfile', () => {
  it('ramp: terrain length, ascent, descent and grade', () => {
    const s = sampler((e) => 0.1 * e);
    const p = routeProfile(s, [at(1, 5), at(9, 5)])!;
    expect(p.planarMeters).toBeCloseTo(8, 9);
    expect(p.terrainMeters).toBeCloseTo(8 * Math.hypot(1, 0.1), 6);
    expect(p.ascentMeters).toBeCloseTo(0.8, 6);
    expect(p.descentMeters).toBeCloseTo(0, 9);
    expect(p.maxGradeDeg).toBeCloseTo((Math.atan(0.1) * 180) / Math.PI, 4); // Float32 elevations
    expect(p.coverage).toBe(1);
    const back = routeProfile(s, [at(9, 5), at(1, 5)])!;
    expect(back.descentMeters).toBeCloseTo(0.8, 6);
    expect(back.ascentMeters).toBeCloseTo(0, 9);
  });
  it('ridge: climbs then descends across legs, includes every vertex', () => {
    const s = sampler((e) => 4 - Math.abs(e - 5.5)); // peak on a cell centre (e = 5.5)
    const p = routeProfile(s, [at(1.5, 5.5), at(5.5, 5.5), at(9.5, 5.5)])!;
    expect(p.ascentMeters).toBeCloseTo(4, 5);
    expect(p.descentMeters).toBeCloseTo(4, 5);
    expect(p.maxElevation).toBeCloseTo(4, 6);
    expect(p.samples.some((x) => x.point.x === at(5.5, 5.5).x && x.leg === 0)).toBe(true);
    expect(p.samples.at(-1)!.leg).toBe(1);
  });
  it('missing terrain counts planar and lowers coverage', () => {
    const s = sampler(() => 0, [5, 5]);
    const p = routeProfile(s, [at(0.5, 4.5), at(9.5, 4.5)])!;
    expect(p.coverage).toBeLessThan(1);
    expect(p.terrainMeters).toBeCloseTo(9, 6);
  });
  it('noise threshold damps tiny steps', () => {
    const s = sampler((e) => (Math.round(e) % 2 ? 0.02 : 0));
    expect(routeProfile(s, [at(1, 5), at(9, 5)], 1, 0.05)!.ascentMeters).toBe(0);
  });
  it('rejects fewer than two points', () => {
    expect(
      routeProfile(
        sampler(() => 0),
        [at(1, 1)],
      ),
    ).toBeNull();
  });
});

describe('derived layers', () => {
  it('slope grid and hillshade: flat ground lit evenly, edges empty', () => {
    const s = sampler(() => 0);
    const g = slopeGrid(s);
    expect(g[5 * N + 5]).toBe(0);
    expect(Number.isNaN(g[0])).toBe(true);
    const h = hillshade(s);
    expect(h[5 * N + 5]).toBe(Math.round(255 * Math.sin(Math.PI / 4)));
    expect(h[0]).toBe(0);
  });
  it('a slope facing the light is brighter than one facing away', () => {
    const facingNW = hillshade(sampler((e, n) => e - n)); // rises to SE, faces NW (sun 315°)
    const facingSE = hillshade(sampler((e, n) => n - e));
    expect(facingNW[5 * N + 5]).toBeGreaterThan(facingSE[5 * N + 5]);
  });
  it('grid footprint in image pixels', () => {
    expect(gridImageBounds(sampler(() => 0))).toEqual({ x0: 0, y0: 0, x1: 40, y1: 40 });
  });
});
