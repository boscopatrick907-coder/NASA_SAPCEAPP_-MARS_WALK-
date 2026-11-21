import { Injectable, signal } from '@angular/core';
import { Point } from './models';
import type { TerrainSampler } from './terrain-profile';

export interface TerrainLayerImages {
  /** PNG data URLs rendered from the accepted DTM (shaded relief, slope classes). */
  readonly reliefUrl: string;
  readonly slopeUrl: string;
  /** Grid footprint in image pixels (bottom-left origin). */
  readonly bounds: {
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
  };
}

/** CRISM mineral layer for the active image (validated from data/mineralogy/mineralogy.json). */
export interface MineralLayer {
  readonly index: string;
  readonly title: string;
  readonly overlayUrl: string;
  readonly bounds: {
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
  };
  readonly stretchMax: number;
  readonly grid: {
    readonly cols: number;
    readonly rows: number;
    readonly values: readonly (number | null)[];
  };
}

/** Index value of the mineral grid at an image point (null outside or missing). */
export function mineralValueAt(m: MineralLayer, p: Point): number | null {
  const fx = (p.x - m.bounds.x0) / (m.bounds.x1 - m.bounds.x0);
  const fy = (m.bounds.y1 - p.y) / (m.bounds.y1 - m.bounds.y0);
  if (!(fx >= 0 && fx < 1 && fy >= 0 && fy < 1)) return null;
  const v =
    m.grid.values[Math.floor(fy * m.grid.rows) * m.grid.cols + Math.floor(fx * m.grid.cols)];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Shared terrain state for eager UI (map) without importing the terrain loader. Written by the
 * lazily loaded terrain bootstrap once the accepted package is verified; null otherwise.
 */
@Injectable({ providedIn: 'root' })
export class TerrainSamplerStore {
  private readonly samplerState = signal<TerrainSampler | null>(null);
  private readonly layersState = signal<TerrainLayerImages | null>(null);
  private readonly hoverState = signal<Point | null>(null);
  private readonly mineralState = signal<MineralLayer | null>(null);
  readonly mineral = this.mineralState.asReadonly();
  /** Which terrain/mineral overlays are drawn on the map (shared with the demo walk). */
  readonly showRelief = signal(false);
  readonly showSlope = signal(false);
  readonly showMineral = signal(false);
  publishMineral(layer: MineralLayer | null): void {
    this.mineralState.set(layer);
  }
  readonly sampler = this.samplerState.asReadonly();
  readonly layers = this.layersState.asReadonly();
  /** Point highlighted from the elevation profile chart (shown on the map). */
  readonly hover = this.hoverState.asReadonly();
  publish(sampler: TerrainSampler | null, layers: TerrainLayerImages | null): void {
    this.samplerState.set(sampler);
    this.layersState.set(layers);
  }
  setHover(p: Point | null): void {
    this.hoverState.set(p ? { x: p.x, y: p.y } : null);
  }
}
