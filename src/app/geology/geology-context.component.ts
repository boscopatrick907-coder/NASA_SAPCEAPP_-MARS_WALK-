/**
 * Geology context: the regional SIM 3292 unit (with its scale limits) and local landform
 * statistics computed from the accepted 1 m DTM. Landforms describe shape, not rock type.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { https } from '../core/validation';
import { slopeGrid, TerrainSampler } from '../core/terrain-profile';
import { slopeAtCell } from '../core/terrain-profile';
import { TerrainSamplerStore } from '../core/terrain-sampler.store';

export interface GeologyContext {
  schemaVersion: 1;
  regionalUnit: {
    code: string;
    name: string;
    map: string;
    url: string;
    credit: string;
    scale: string;
    context: string;
    limitations: string[];
  };
  localDataNote: string;
  furtherSources: { title: string; url: string; use: string }[];
}

export function validGeology(v: unknown): v is GeologyContext {
  const o = v as GeologyContext;
  const text = (s: unknown) => typeof s === 'string' && s.trim().length > 0;
  return (
    !!o &&
    o.schemaVersion === 1 &&
    !!o.regionalUnit &&
    ['code', 'name', 'map', 'credit', 'scale', 'context'].every((k) =>
      text((o.regionalUnit as never)[k]),
    ) &&
    https(o.regionalUnit.url) &&
    Array.isArray(o.regionalUnit.limitations) &&
    o.regionalUnit.limitations.every(text) &&
    text(o.localDataNote) &&
    Array.isArray(o.furtherSources) &&
    o.furtherSources.every((f) => text(f?.title) && https(f?.url) && text(f?.use))
  );
}

export interface LandformStats {
  minElevation: number;
  maxElevation: number;
  meanSlopeDeg: number;
  /** Share of valid cells per slope class, in percent. */
  classes: { label: string; percent: number }[];
  /** Most common downslope direction among cells steeper than 5°. */
  dominantFacing: string | null;
  cells: number;
}

/** Whole-grid landform statistics (exported for tests). */
export function landformStats(s: TerrainSampler): LandformStats | null {
  const slopes = slopeGrid(s);
  const bins = [0, 0, 0, 0];
  const facing = new Array(8).fill(0);
  let n = 0;
  let sum = 0;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++) {
      const i = r * s.cols + c;
      if (s.mask[i] !== 1) continue;
      zMin = Math.min(zMin, s.elevation[i]);
      zMax = Math.max(zMax, s.elevation[i]);
      const v = slopes[i];
      if (Number.isNaN(v)) continue;
      n++;
      sum += v;
      bins[v < 10 ? 0 : v < 20 ? 1 : v < 30 ? 2 : 3]++;
      if (v > 5) {
        const a = slopeAtCell(s, c, r)!.aspectDeg;
        facing[Math.round(a / 45) % 8]++;
      }
    }
  if (!n) return null;
  const labels = ['under 10°', '10–20°', '20–30°', '30° and steeper'];
  const best = facing.indexOf(Math.max(...facing));
  return {
    minElevation: zMin,
    maxElevation: zMax,
    meanSlopeDeg: sum / n,
    classes: bins.map((b, k) => ({ label: labels[k], percent: (100 * b) / n })),
    dominantFacing:
      Math.max(...facing) > 0
        ? [
            'north',
            'north-east',
            'east',
            'south-east',
            'south',
            'south-west',
            'west',
            'north-west',
          ][best]
        : null,
    cells: n,
  };
}

@Component({
  selector: 'app-geology-context',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="geology" aria-labelledby="geology-title">
      <h2 id="geology-title">Geology &amp; landforms</h2>
      @if (stats(); as st) {
        <h3>Local landforms (1 m terrain model)</h3>
        <p>{{ summary(st) }}</p>
        <ul class="classes">
          @for (c of st.classes; track c.label) {
            <li>
              <span>{{ c.label }}</span><span class="bar" [style.width.%]="c.percent"></span
              ><span>{{ c.percent | number: '1.0-0' }} %</span>
            </li>
          }
        </ul>
      } @else {
        <p>Local landform statistics appear once the terrain model has loaded.</p>
      }
      @if (geology(); as g) {
        <p class="note">{{ g.localDataNote }}</p>
        <h3>Regional unit: {{ g.regionalUnit.code }} — {{ g.regionalUnit.name }}</h3>
        <p>{{ g.regionalUnit.context }}</p>
        <p class="note">
          <a [href]="g.regionalUnit.url" target="_blank" rel="noopener noreferrer">{{
            g.regionalUnit.map
          }}</a>
          · {{ g.regionalUnit.credit }} · {{ g.regionalUnit.scale }}
        </p>
        <ul class="note">
          @for (l of g.regionalUnit.limitations; track $index) {
            <li>{{ l }}</li>
          }
        </ul>
        <details>
          <summary>Mineralogy and finer-scale maps (not yet in the app)</summary>
          <ul>
            @for (f of g.furtherSources; track f.url) {
              <li>
                <a [href]="f.url" target="_blank" rel="noopener noreferrer">{{ f.title }}</a>.
                {{ f.use }}
              </li>
            }
          </ul>
        </details>
      } @else if (failed()) {
        <p class="note">Regional geology context could not be loaded.</p>
      }
    </section>
  `,
  styles: `
    .geology {
      display: grid;
      gap: 6px;
    }
    h2 {
      font-size: 1.05rem;
      margin: 0;
    }
    h3 {
      font-size: 0.9rem;
      margin: 6px 0 0;
    }
    p,
    li {
      margin: 0;
      font-size: 0.85rem;
    }
    .note {
      opacity: 0.8;
      font-size: 0.8rem;
    }
    .classes {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 3px;
    }
    .classes li {
      display: grid;
      grid-template-columns: 8.5rem 1fr 3rem;
      align-items: center;
      gap: 6px;
    }
    .bar {
      height: 8px;
      border-radius: 4px;
      background: #f97316;
      min-width: 2px;
    }
    details summary {
      min-height: 44px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
  `,
})
export class GeologyContextComponent {
  private readonly store = inject(TerrainSamplerStore);
  readonly geology = signal<GeologyContext | null>(null);
  readonly failed = signal(false);
  readonly stats = computed(() => {
    const s = this.store.sampler();
    return s ? landformStats(s) : null;
  });

  summary(st: LandformStats): string {
    const relief = (st.maxElevation - st.minElevation).toFixed(0);
    const facing = st.dominantFacing ? `; slopes mostly face ${st.dominantFacing}` : '';
    return `Elevation ${st.minElevation.toFixed(0)} to ${st.maxElevation.toFixed(0)} m (${relief} m of relief); mean slope ${st.meanSlopeDeg.toFixed(1)}°${facing}.`;
  }

  constructor() {
    const url = new URL('data/geology.json', inject(DOCUMENT).baseURI).href;
    inject(HttpClient)
      .get<unknown>(url)
      .subscribe({
        next: (v) => (validGeology(v) ? this.geology.set(v) : this.failed.set(true)),
        error: () => this.failed.set(true),
      });
  }
}
