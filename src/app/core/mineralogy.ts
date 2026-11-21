/** Validation of data/mineralogy/mineralogy.json (CRISM layer metadata). */
import { https } from './validation';
import type { MineralLayer } from './terrain-sampler.store';

export interface MineralogyDoc {
  schemaVersion: 1;
  imageRef: string;
  title: string;
  credit: string;
  method: string;
  mappedIndex: string;
  smoothingMeters: number;
  cellMeters: number;
  stretch: { min: number; max: number };
  overlay: { path: string; boundsImagePx: { x0: number; y0: number; x1: number; y1: number } };
  context: { path: string; widthMeters: number; note: string };
  cropGrid: { cols: number; rows: number; values: (number | null)[] };
  sources: { product: string; acquired: string; url: string; sha256: string; bytes: number }[];
  registration: Record<
    string,
    { shiftE_N_m: [number, number]; peakNCC: number; windowSpread_m: number }
  >;
  reproducibility: Record<string, Record<string, number>>;
  indices: Record<
    string,
    {
      meaning: string;
      finding: string;
      noiseFloor: number;
      mapped: boolean;
      observations: Record<
        string,
        { median: number; p10: number; p90: number; positiveShare: number }
      >;
    }
  >;
  limitations: string[];
}

const fin = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const safePath = (v: unknown) =>
  typeof v === 'string' && /^data\/mineralogy\/[a-z0-9._-]+$/.test(v);

export function validMineralogy(v: unknown, imageRef: string | null): v is MineralogyDoc {
  const d = v as MineralogyDoc;
  if (!d || d.schemaVersion !== 1 || d.imageRef !== imageRef) return false;
  if (![d.title, d.credit, d.method, d.mappedIndex].every(text)) return false;
  if (!fin(d.stretch?.max) || !(d.stretch.max > 0)) return false;
  const b = d.overlay?.boundsImagePx;
  if (
    !safePath(d.overlay?.path) ||
    !safePath(d.context?.path) ||
    !b ||
    ![b.x0, b.x1, b.y0, b.y1].every(fin)
  )
    return false;
  if (!(b.x1 > b.x0 && b.y1 > b.y0)) return false;
  const g = d.cropGrid;
  if (!g || !Number.isInteger(g.cols) || !Number.isInteger(g.rows) || g.cols < 1 || g.rows < 1)
    return false;
  if (!Array.isArray(g.values) || g.values.length !== g.cols * g.rows) return false;
  if (!g.values.every((x) => x === null || fin(x))) return false;
  if (
    !Array.isArray(d.sources) ||
    !d.sources.length ||
    !d.sources.every((s) => text(s.product) && https(s.url))
  )
    return false;
  if (!d.indices || !d.indices[d.mappedIndex]) return false;
  return Array.isArray(d.limitations) && d.limitations.every(text);
}

export function mineralLayerFrom(d: MineralogyDoc, baseUri: string): MineralLayer {
  return {
    index: d.mappedIndex,
    title: d.title,
    overlayUrl: new URL(d.overlay.path, baseUri).href,
    bounds: d.overlay.boundsImagePx,
    stretchMax: d.stretch.max,
    grid: d.cropGrid,
  };
}
