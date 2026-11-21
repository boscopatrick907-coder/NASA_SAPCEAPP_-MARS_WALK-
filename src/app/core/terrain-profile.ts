/**
 * Terrain analysis on the accepted DTM package (Planning V2): elevation and slope at a point,
 * and the ground profile of any route. Pure functions; no rendering, no safety judgement.
 * Values come from a 1 m stereo DTM with no stated accuracy, so results are sampled estimates.
 */
import { Point } from './models';
import { Geotransform, ImageGeoref, imageToProjected } from './terrain';

export interface TerrainSampler {
  readonly georef: ImageGeoref;
  readonly geotransform: Geotransform;
  readonly cols: number;
  readonly rows: number;
  readonly elevation: Float32Array;
  readonly mask: Uint8Array;
  /** Planetocentric centre longitude of the projection (degrees), for lat/lon readouts. */
  readonly centerLongitudeDeg: number;
  readonly radiusMeters: number;
}

export interface SlopeAt {
  readonly slopeDeg: number;
  /** Downslope direction, degrees clockwise from north. */
  readonly aspectDeg: number;
}

/** Continuous grid coordinates (cell centres at integers) for an image point. */
function gridCoords(s: TerrainSampler, p: Point) {
  const q = imageToProjected(p, s.georef);
  const gt = s.geotransform;
  return { c: (q.e - gt[0]) / gt[1] - 0.5, r: (q.n - gt[3]) / gt[5] - 0.5 };
}
const valid = (s: TerrainSampler, c: number, r: number) =>
  c >= 0 && r >= 0 && c < s.cols && r < s.rows && s.mask[r * s.cols + c] === 1;

/**
 * Elevation (m, Mars 2000 areoid) at an image point: bilinear between the four surrounding
 * cell centres when all are valid, otherwise the containing cell; null outside or on nodata.
 */
export function elevationAt(s: TerrainSampler, p: Point): number | null {
  if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) return null;
  const { c, r } = gridCoords(s, p);
  const c0 = Math.floor(c);
  const r0 = Math.floor(r);
  const fc = c - c0;
  const fr = r - r0;
  if (
    valid(s, c0, r0) &&
    valid(s, c0 + 1, r0) &&
    valid(s, c0, r0 + 1) &&
    valid(s, c0 + 1, r0 + 1)
  ) {
    const z = (cc: number, rr: number) => s.elevation[rr * s.cols + cc];
    return (
      z(c0, r0) * (1 - fc) * (1 - fr) +
      z(c0 + 1, r0) * fc * (1 - fr) +
      z(c0, r0 + 1) * (1 - fc) * fr +
      z(c0 + 1, r0 + 1) * fc * fr
    );
  }
  const cc = Math.round(c);
  const rr = Math.round(r);
  return valid(s, cc, rr) ? s.elevation[rr * s.cols + cc] : null;
}

/** Local slope from Horn's 3×3 method at the nearest cell; null if any neighbour is missing. */
export function slopeAt(s: TerrainSampler, p: Point): SlopeAt | null {
  if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) return null;
  const { c, r } = gridCoords(s, p);
  return slopeAtCell(s, Math.round(c), Math.round(r));
}

export function slopeAtCell(s: TerrainSampler, c: number, r: number): SlopeAt | null {
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) if (!valid(s, c + dc, r + dr)) return null;
  const z = (dc: number, dr: number) => s.elevation[(r + dr) * s.cols + (c + dc)];
  const h = s.geotransform[1];
  // x east, y north (rows increase southward).
  const dzdx = (z(1, -1) + 2 * z(1, 0) + z(1, 1) - (z(-1, -1) + 2 * z(-1, 0) + z(-1, 1))) / (8 * h);
  const dzdy = (z(-1, -1) + 2 * z(0, -1) + z(1, -1) - (z(-1, 1) + 2 * z(0, 1) + z(1, 1))) / (8 * h);
  const slopeDeg = (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
  // Downslope azimuth: direction of -gradient, clockwise from north.
  const aspectDeg = ((Math.atan2(-dzdx, -dzdy) * 180) / Math.PI + 360) % 360;
  return { slopeDeg, aspectDeg };
}

/** Planetocentric latitude/longitude (degrees) of an image point (equirectangular, std parallel 0). */
export function latLonAt(s: TerrainSampler, p: Point): { lat: number; lon: number } {
  const q = imageToProjected(p, s.georef);
  const deg = 180 / Math.PI;
  return {
    lat: (q.n / s.radiusMeters) * deg,
    lon: s.centerLongitudeDeg + (q.e / s.radiusMeters) * deg,
  };
}

export interface ProfileSample {
  /** Image point of this sample. */
  readonly point: Point;
  /** Planar distance from the route start (m). */
  readonly distance: number;
  /** Elevation (m) or null on missing terrain. */
  readonly elevation: number | null;
  /** Index of the route leg (0 = start→first vertex). */
  readonly leg: number;
}

export interface RouteProfile {
  readonly samples: readonly ProfileSample[];
  readonly planarMeters: number;
  /** Planar length plus elevation change along the samples (missing stretches counted planar). */
  readonly terrainMeters: number;
  readonly ascentMeters: number;
  readonly descentMeters: number;
  /** Steepest sampled grade between consecutive samples (degrees). */
  readonly maxGradeDeg: number;
  readonly maxGradeAt: Point | null;
  readonly startElevation: number | null;
  readonly endElevation: number | null;
  readonly minElevation: number | null;
  readonly maxElevation: number | null;
  /** Fraction of samples with valid terrain (1 = complete). */
  readonly coverage: number;
  readonly stepMeters: number;
}

/**
 * Samples a polyline of image points every `stepMeters` (default: one DTM cell), including every
 * vertex. Ascent/descent ignore changes below `noiseMeters` per step to damp DTM noise.
 */
export function routeProfile(
  s: TerrainSampler,
  points: readonly Point[],
  stepMeters = s.geotransform[1],
  noiseMeters = 0,
): RouteProfile | null {
  if (points.length < 2 || !(stepMeters > 0)) return null;
  const px = s.georef.pixelSizeMeters;
  const samples: ProfileSample[] = [];
  let distance = 0;
  for (let leg = 0; leg < points.length - 1; leg++) {
    const a = points[leg];
    const b = points[leg + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) * px;
    const n = Math.max(1, Math.ceil(len / stepMeters));
    for (let k = leg === 0 ? 0 : 1; k <= n; k++) {
      const t = k / n;
      const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      samples.push({ point, distance: distance + len * t, elevation: elevationAt(s, point), leg });
    }
    distance += len;
  }
  let terrain = 0;
  let ascent = 0;
  let descent = 0;
  let maxGrade = 0;
  let maxGradeAt: Point | null = null;
  let validCount = samples[0].elevation === null ? 0 : 1;
  for (let i = 1; i < samples.length; i++) {
    const p = samples[i - 1];
    const q = samples[i];
    const run = q.distance - p.distance;
    if (q.elevation !== null) validCount++;
    if (p.elevation === null || q.elevation === null) {
      terrain += run;
      continue;
    }
    const dz = q.elevation - p.elevation;
    terrain += Math.hypot(run, dz);
    if (dz > noiseMeters) ascent += dz;
    else if (dz < -noiseMeters) descent -= dz;
    if (run > 1e-9) {
      const g = (Math.atan(Math.abs(dz) / run) * 180) / Math.PI;
      if (g > maxGrade) {
        maxGrade = g;
        maxGradeAt = q.point;
      }
    }
  }
  const zs = samples.map((x) => x.elevation).filter((z): z is number => z !== null);
  return {
    samples,
    planarMeters: distance,
    terrainMeters: terrain,
    ascentMeters: ascent,
    descentMeters: descent,
    maxGradeDeg: maxGrade,
    maxGradeAt,
    startElevation: samples[0].elevation,
    endElevation: samples[samples.length - 1].elevation,
    minElevation: zs.length ? Math.min(...zs) : null,
    maxElevation: zs.length ? Math.max(...zs) : null,
    coverage: validCount / samples.length,
    stepMeters,
  };
}

/** Grayscale shaded relief (0–255) per cell, 315° azimuth / 45° elevation; 0 on nodata. */
export function hillshade(
  s: TerrainSampler,
  azimuthDeg = 315,
  altitudeDeg = 45,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(s.cols * s.rows);
  const az = (azimuthDeg * Math.PI) / 180;
  const alt = (altitudeDeg * Math.PI) / 180;
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++) {
      const sl = slopeAtCell(s, c, r);
      if (!sl) continue;
      const slope = (sl.slopeDeg * Math.PI) / 180;
      // Aspect here is downslope azimuth; illumination uses the upslope-facing normal.
      const aspect = (sl.aspectDeg * Math.PI) / 180;
      const v =
        Math.sin(alt) * Math.cos(slope) + Math.cos(alt) * Math.sin(slope) * Math.cos(az - aspect);
      out[r * s.cols + c] = Math.max(1, Math.round(255 * Math.max(0, v)));
    }
  return out;
}

/** Slope (degrees) per cell, NaN on nodata/edges. */
export function slopeGrid(s: TerrainSampler): Float32Array {
  const out = new Float32Array(s.cols * s.rows).fill(NaN);
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++) {
      const sl = slopeAtCell(s, c, r);
      if (sl) out[r * s.cols + c] = sl.slopeDeg;
    }
  return out;
}

/** Image-pixel bounds of the grid footprint ([[ymin,xmin],[ymax,xmax]] in image pixels, bottom-left origin). */
export function gridImageBounds(s: TerrainSampler): {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} {
  const gt = s.geotransform;
  const g = s.georef;
  const x0 = (gt[0] - g.xminMeters) / g.pixelSizeMeters;
  const x1 = (gt[0] + s.cols * gt[1] - g.xminMeters) / g.pixelSizeMeters;
  const y1 = (gt[3] - g.yminMeters) / g.pixelSizeMeters;
  const y0 = (gt[3] + s.rows * gt[5] - g.yminMeters) / g.pixelSizeMeters;
  return { x0, y0, x1, y1 };
}
