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

/**
 * Shared terrain state for eager UI (map) without importing the terrain loader. Written by the
 * lazily loaded terrain bootstrap once the accepted package is verified; null otherwise.
 */
@Injectable({ providedIn: 'root' })
export class TerrainSamplerStore {
  private readonly samplerState = signal<TerrainSampler | null>(null);
  private readonly layersState = signal<TerrainLayerImages | null>(null);
  private readonly hoverState = signal<Point | null>(null);
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
