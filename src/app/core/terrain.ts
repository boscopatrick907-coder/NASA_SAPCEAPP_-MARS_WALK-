/**
 * Terrain contract v1 (DRAFT) — shared types, transforms and package checks.
 * See docs/planning/TERRAIN_CONTRACT_V1.md. Not wired into the UI: no terrain
 * product is accepted and nothing here enables routing on its own.
 */
import { Point } from './models';
import { https } from './validation';

export const TERRAIN_CONTRACT_VERSION = 'terrain-v1' as const;
/** Parser memory guard (§2), not a performance budget. */
export const MAX_TERRAIN_CELLS = 2048 * 2048;

export type TerrainAdmissionStatus =
  'none' | 'proposed' | 'pending-review' | 'rejected' | 'accepted';
export type TerrainReadiness = 'not-cached' | 'partial' | 'verified' | 'corrupt' | 'unavailable';
export type TerrainPreviewStatus =
  'idle' | 'running' | 'preview-ready' | 'no-route' | 'cancelled' | 'error';
export type TerrainFailureCode =
  | 'no-terrain-package'
  | 'terrain-not-accepted'
  | 'image-ref-mismatch'
  | 'offline-pack-incomplete'
  | 'invalid-endpoints'
  | 'endpoint-outside-coverage'
  | 'endpoint-on-nodata'
  | 'grade-limit-exceeded'
  | 'no-path-within-constraints'
  | 'cancelled'
  | 'stale-response'
  | 'worker-error'
  | 'unknown';

/** Image georeference (§1.2): bottom-left pixel origin, square pixels, image CRS. */
export interface ImageGeoref {
  readonly imageRef: string;
  readonly width: number;
  readonly height: number;
  readonly pixelSizeMeters: number;
  readonly xminMeters: number;
  readonly yminMeters: number;
}
/** GDAL-order geotransform with no rotation: [gt0, gt1, 0, gt3, 0, gt5], gt1 > 0, gt5 < 0. */
export type Geotransform = readonly [number, number, number, number, number, number];
export interface Projected {
  readonly e: number;
  readonly n: number;
}
export interface GridIndex {
  readonly col: number;
  readonly row: number;
}

export interface TerrainFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}
export interface TerrainAdmission {
  readonly status: TerrainAdmissionStatus;
  readonly reviewer: string | null;
  readonly decidedAtUtc: string | null;
  readonly evidenceRef: string | null;
}
export interface TerrainManifest {
  readonly schemaVersion: 1;
  readonly contractVersion: typeof TERRAIN_CONTRACT_VERSION;
  readonly packageId: string;
  readonly imageRef: string;
  readonly productId: string;
  readonly source: { readonly title: string; readonly url: string; readonly credit: string };
  readonly grid: {
    readonly cols: number;
    readonly rows: number;
    readonly geotransform: Geotransform;
  };
  readonly horizontal: {
    readonly units: 'meters';
    readonly nativeSpacingMeters: number;
    readonly preparedSpacingMeters: number;
  };
  readonly vertical: { readonly units: 'meters'; readonly datumOrReference: string };
  readonly files: readonly TerrainFile[];
  readonly admission: TerrainAdmission;
}

// ---- §1 transforms -------------------------------------------------------

export function imageToProjected(p: Point, g: ImageGeoref): Projected {
  return { e: g.xminMeters + p.x * g.pixelSizeMeters, n: g.yminMeters + p.y * g.pixelSizeMeters };
}
export function projectedToImage(q: Projected, g: ImageGeoref): Point {
  return {
    x: (q.e - g.xminMeters) / g.pixelSizeMeters,
    y: (q.n - g.yminMeters) / g.pixelSizeMeters,
  };
}
/** Continuous grid index where integers are cell centres. */
export function projectedToGrid(q: Projected, gt: Geotransform): GridIndex {
  return { col: (q.e - gt[0]) / gt[1] - 0.5, row: (q.n - gt[3]) / gt[5] - 0.5 };
}
export function cellCentre(cell: GridIndex, gt: Geotransform): Projected {
  return { e: gt[0] + (cell.col + 0.5) * gt[1], n: gt[3] + (cell.row + 0.5) * gt[5] };
}
/**
 * Cell containing an image point, or null when outside the grid (§5 snapping).
 * Cells are half-open, except that a point exactly on the grid's closing east or
 * south edge belongs to the last column/row (image edges x = width, y = 0 are valid points).
 */
export function containingCell(
  p: Point,
  g: ImageGeoref,
  gt: Geotransform,
  cols: number,
  rows: number,
): GridIndex | null {
  const q = imageToProjected(p, g);
  const fc = (q.e - gt[0]) / gt[1];
  const fr = (q.n - gt[3]) / gt[5];
  // `+ 0` normalises -0 on the north/west edges.
  const col = (fc === cols ? cols - 1 : Math.floor(fc)) + 0;
  const row = (fr === rows ? rows - 1 : Math.floor(fr)) + 0;
  return col >= 0 && col < cols && row >= 0 && row < rows ? { col, row } : null;
}

// ---- §5 grade units ------------------------------------------------------

export const degreesToPercent = (deg: number) => 100 * Math.tan((deg * Math.PI) / 180);
export const percentToDegrees = (pct: number) => (Math.atan(pct / 100) * 180) / Math.PI;
/** Sampled segment grade in degrees between two cell centres; not local slope. */
export const segmentGradeDeg = (dz: number, horizontalMeters: number) =>
  (Math.atan(Math.abs(dz) / horizontalMeters) * 180) / Math.PI;

// ---- §3 manifest validation ---------------------------------------------

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const posInt = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0;
const SHA256 = /^[0-9a-f]{64}$/;
const SAFE_PATH = /^[a-z0-9][a-z0-9._-]*$/i;
const ADMISSION: readonly TerrainAdmissionStatus[] = [
  'none',
  'proposed',
  'pending-review',
  'rejected',
  'accepted',
];

export function validGeotransform(v: unknown): v is Geotransform {
  return (
    Array.isArray(v) &&
    v.length === 6 &&
    v.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    v[1] > 0 &&
    v[5] < 0 &&
    v[2] === 0 &&
    v[4] === 0
  );
}
function validFile(v: unknown): v is TerrainFile {
  return (
    record(v) &&
    text(v['path']) &&
    SAFE_PATH.test(v['path']) &&
    Number.isInteger(v['bytes']) &&
    (v['bytes'] as number) >= 0 &&
    typeof v['sha256'] === 'string' &&
    SHA256.test(v['sha256'])
  );
}
function validAdmission(v: unknown): v is TerrainAdmission {
  if (!record(v) || !ADMISSION.includes(v['status'] as TerrainAdmissionStatus)) return false;
  const nullable = (k: string) => v[k] === null || text(v[k]);
  if (!nullable('reviewer') || !nullable('decidedAtUtc') || !nullable('evidenceRef')) return false;
  // An accepted decision must name its reviewer, date and evidence.
  return (
    v['status'] !== 'accepted' ||
    (text(v['reviewer']) && text(v['decidedAtUtc']) && text(v['evidenceRef']))
  );
}

export function validTerrainManifest(v: unknown): v is TerrainManifest {
  if (!record(v) || v['schemaVersion'] !== 1 || v['contractVersion'] !== TERRAIN_CONTRACT_VERSION)
    return false;
  if (!text(v['packageId']) || !text(v['imageRef']) || !text(v['productId'])) return false;
  const s = v['source'];
  if (!record(s) || !text(s['title']) || !https(s['url']) || !text(s['credit'])) return false;
  const grid = v['grid'];
  if (!record(grid) || !posInt(grid['cols']) || !posInt(grid['rows'])) return false;
  if ((grid['cols'] as number) * (grid['rows'] as number) > MAX_TERRAIN_CELLS) return false;
  if (!validGeotransform(grid['geotransform'])) return false;
  const h = v['horizontal'];
  if (!record(h) || h['units'] !== 'meters' || !positive(h['nativeSpacingMeters'])) return false;
  // Prepared spacing may not be finer than native (§2): no fake upsampled detail.
  if (
    !positive(h['preparedSpacingMeters']) ||
    h['preparedSpacingMeters'] < h['nativeSpacingMeters']
  )
    return false;
  const gt = grid['geotransform'] as Geotransform;
  const spacing = h['preparedSpacingMeters'] as number;
  if (Math.abs(gt[1] - spacing) > 1e-9 * spacing || Math.abs(-gt[5] - spacing) > 1e-9 * spacing)
    return false;
  const z = v['vertical'];
  if (!record(z) || z['units'] !== 'meters' || !text(z['datumOrReference'])) return false;
  const files = v['files'];
  if (!Array.isArray(files) || !files.every(validFile)) return false;
  const paths = files.map((f) => f.path);
  if (new Set(paths).size !== paths.length) return false;
  const cells = (grid['cols'] as number) * (grid['rows'] as number);
  const grid32 = files.find((f) => f.path === 'grid.f32');
  const mask = files.find((f) => f.path === 'mask.u8');
  if (!grid32 || grid32.bytes !== cells * 4 || !mask || mask.bytes !== cells) return false;
  return validAdmission(v['admission']);
}

/**
 * §2: grid NaN and mask 0 must agree exactly; mask values only 0/1.
 * Returns the number of valid cells, or null when the pair is corrupt.
 */
export function checkGridMask(grid: Float32Array, mask: Uint8Array): number | null {
  if (grid.length !== mask.length) return null;
  let valid = 0;
  for (let i = 0; i < grid.length; i++) {
    const m = mask[i];
    const finite = Number.isFinite(grid[i]);
    if (m === 1 && finite) valid++;
    else if (!(m === 0 && Number.isNaN(grid[i]))) return null;
  }
  return valid;
}

/** Fraction of the image footprint covered by the grid footprint, 0..1 (§4 coverage display). */
export function imageCoverage(
  g: ImageGeoref,
  gt: Geotransform,
  cols: number,
  rows: number,
): number {
  const ix0 = g.xminMeters;
  const ix1 = g.xminMeters + g.width * g.pixelSizeMeters;
  const iy0 = g.yminMeters;
  const iy1 = g.yminMeters + g.height * g.pixelSizeMeters;
  const gx0 = gt[0];
  const gx1 = gt[0] + cols * gt[1];
  const gy1 = gt[3];
  const gy0 = gt[3] + rows * gt[5];
  const w = Math.max(0, Math.min(ix1, gx1) - Math.max(ix0, gx0));
  const h = Math.max(0, Math.min(iy1, gy1) - Math.max(iy0, gy0));
  return (w * h) / ((ix1 - ix0) * (iy1 - iy0));
}
export function coverageLabel(fraction: number): 'full' | 'partial' | 'none' {
  return fraction >= 1 - 1e-9 ? 'full' : fraction > 0 ? 'partial' : 'none';
}

// ---- §4 gate -------------------------------------------------------------

/**
 * Single runtime gate (§4). Returns null when terrain routing may be offered, or the
 * failure code to show. Self-declared flags in files are never consulted.
 */
export function terrainGate(
  manifest: TerrainManifest | null,
  activeImageRef: string | null,
  readiness: TerrainReadiness,
): TerrainFailureCode | null {
  if (!manifest) return 'no-terrain-package';
  if (manifest.admission.status !== 'accepted') return 'terrain-not-accepted';
  if (!activeImageRef || manifest.imageRef !== activeImageRef) return 'image-ref-mismatch';
  if (readiness !== 'verified') return 'offline-pack-incomplete';
  return null;
}

// ---- §7 readiness --------------------------------------------------------

async function sha256Hex(bytes: Uint8Array): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const digest = await subtle.digest('SHA-256', bytes.slice().buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * `verified` only when every listed file is present with matching length and SHA-256.
 * Manifest presence or connectivity never implies readiness.
 */
export async function terrainReadiness(
  manifest: TerrainManifest,
  read: (path: string) => Promise<Uint8Array | null>,
): Promise<TerrainReadiness> {
  let present = 0;
  for (const file of manifest.files) {
    let bytes: Uint8Array | null;
    try {
      bytes = await read(file.path);
    } catch {
      bytes = null;
    }
    if (!bytes) continue;
    present++;
    if (bytes.byteLength !== file.bytes) return 'corrupt';
    const hex = await sha256Hex(bytes);
    if (hex === null) return 'unavailable';
    if (hex !== file.sha256) return 'corrupt';
  }
  if (present === manifest.files.length) return 'verified';
  return present === 0 ? 'not-cached' : 'partial';
}
