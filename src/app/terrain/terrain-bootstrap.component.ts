/**
 * Headless, lazily loaded: verifies the accepted terrain package once the page is idle and
 * publishes a sampler plus rendered relief/slope layers for the map, profile and survival tools.
 * Publishes nothing when the gate is closed (no package, not accepted, wrong image, unverified).
 */
import { Component, DestroyRef, effect, inject, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MissionService } from '../core/mission.service';
import { imageGeoref } from '../core/terrain';
import { hillshade, slopeGrid, gridImageBounds, TerrainSampler } from '../core/terrain-profile';
import { TerrainSamplerStore } from '../core/terrain-sampler.store';
import { TerrainService } from '../core/terrain.service';

/** Slope classes (degrees) with colours; transparent below the first class. */
export const SLOPE_CLASSES: readonly {
  readonly min: number;
  readonly rgba: readonly number[];
  readonly label: string;
}[] = [
  { min: 10, rgba: [250, 204, 21, 150], label: '10–20°' },
  { min: 20, rgba: [249, 115, 22, 170], label: '20–30°' },
  { min: 30, rgba: [220, 38, 38, 190], label: '≥ 30°' },
];

@Component({ selector: 'app-terrain-bootstrap', standalone: true, template: '' })
export class TerrainBootstrapComponent {
  private readonly terrain = inject(TerrainService);
  private readonly mission = inject(MissionService);
  private readonly store = inject(TerrainSamplerStore);
  private readonly document = inject(DOCUMENT);
  private publishedFor: string | null = null;

  constructor() {
    void this.terrain.initialize();
    const ref = effect(() => {
      const gate = this.terrain.gate();
      const manifest = this.terrain.manifest();
      const image = this.mission.image();
      untracked(() => {
        const key =
          gate === null && manifest && image ? `${manifest.packageId}|${image.imageRef}` : null;
        if (key === this.publishedFor) return;
        this.publishedFor = key;
        if (!key) return this.store.publish(null, null);
        const georef = imageGeoref(image);
        const buffers = this.terrain.packageBuffers();
        const crs = image!.georeference?.crs;
        if (!georef || !buffers || !crs) return this.store.publish(null, null);
        const sampler: TerrainSampler = {
          georef,
          geotransform: manifest!.grid.geotransform,
          cols: manifest!.grid.cols,
          rows: manifest!.grid.rows,
          elevation: new Float32Array(buffers.grid),
          mask: new Uint8Array(buffers.mask),
          centerLongitudeDeg: crs.centerLongitude,
          radiusMeters: crs.radiusMeters,
        };
        this.store.publish(sampler, this.render(sampler));
      });
    });
    inject(DestroyRef).onDestroy(() => ref.destroy());
  }

  /** Renders relief and slope PNGs; returns null where canvas isn't available (tests, old browsers). */
  private render(s: TerrainSampler) {
    try {
      const canvas = this.document.createElement('canvas');
      const ctx = canvas.getContext?.('2d');
      if (!ctx) return null;
      canvas.width = s.cols;
      canvas.height = s.rows;
      const shade = hillshade(s);
      const relief = ctx.createImageData(s.cols, s.rows);
      for (let i = 0; i < shade.length; i++) {
        const v = shade[i];
        relief.data.set([v, v, v, v ? 255 : 0], i * 4);
      }
      ctx.putImageData(relief, 0, 0);
      const reliefUrl = canvas.toDataURL('image/png');
      const slopes = slopeGrid(s);
      const img = ctx.createImageData(s.cols, s.rows);
      for (let i = 0; i < slopes.length; i++) {
        const v = slopes[i];
        let cls: readonly number[] | null = null;
        for (const c of SLOPE_CLASSES) if (v >= c.min) cls = c.rgba;
        if (cls) img.data.set(cls, i * 4);
      }
      ctx.clearRect(0, 0, s.cols, s.rows);
      ctx.putImageData(img, 0, 0);
      return { reliefUrl, slopeUrl: canvas.toDataURL('image/png'), bounds: gridImageBounds(s) };
    } catch {
      return null;
    }
  }
}
