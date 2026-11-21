/**
 * Interactive elevation profile of the current route from the accepted DTM. Hover or tap to
 * read distance/elevation/grade; the matching point is highlighted on the map.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { RouteProfile } from '../core/terrain-profile';
import { TerrainSamplerStore } from '../core/terrain-sampler.store';

const W = 600;
const H = 180;
const PAD = { l: 52, r: 12, t: 12, b: 28 };

@Component({
  selector: 'app-elevation-profile',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (chart(); as c) {
      <figure class="profile">
        <figcaption>
          Elevation along your route · {{ profile()!.planarMeters | number: '1.0-0' }} m map
          distance, {{ profile()!.ascentMeters | number: '1.0-0' }} m up /
          {{ profile()!.descentMeters | number: '1.0-0' }} m down, steepest
          {{ profile()!.maxGradeDeg | number: '1.0-1' }}°
        </figcaption>
        <svg
          [attr.viewBox]="'0 0 ' + W + ' ' + H"
          role="img"
          [attr.aria-label]="c.summary"
          (pointermove)="onMove($event)"
          (pointerdown)="onMove($event)"
          (pointerleave)="clear()"
        >
          <rect
            [attr.x]="PAD.l"
            [attr.y]="PAD.t"
            [attr.width]="W - PAD.l - PAD.r"
            [attr.height]="H - PAD.t - PAD.b"
            class="plot"
          />
          @for (t of c.yTicks; track t.v) {
            <line
              [attr.x1]="PAD.l"
              [attr.x2]="W - PAD.r"
              [attr.y1]="t.y"
              [attr.y2]="t.y"
              class="grid"
            />
            <text [attr.x]="PAD.l - 6" [attr.y]="t.y + 4" text-anchor="end" class="tick">
              {{ t.v | number: '1.0-0' }}
            </text>
          }
          @for (t of c.xTicks; track t.v) {
            <text [attr.x]="t.x" [attr.y]="H - 8" text-anchor="middle" class="tick">
              {{ t.v | number: '1.0-0' }} m
            </text>
          }
          <path [attr.d]="c.area" class="area" />
          <path [attr.d]="c.line" class="line" />
          @for (seg of c.overLimit; track $index) {
            <path [attr.d]="seg" class="over" />
          }
          @if (c.maxGrade; as m) {
            <circle [attr.cx]="m.x" [attr.cy]="m.y" r="4" class="steep">
              <title>Steepest sampled grade</title>
            </circle>
          }
          @if (cursor(); as k) {
            <line
              [attr.x1]="k.x"
              [attr.x2]="k.x"
              [attr.y1]="PAD.t"
              [attr.y2]="H - PAD.b"
              class="cursor"
            />
            <circle [attr.cx]="k.x" [attr.cy]="k.y" r="4" class="dot" />
          }
        </svg>
        <p class="readout" aria-live="polite">
          @if (cursor(); as k) {
            {{ k.distance | number: '1.0-0' }} m · {{ k.elevation | number: '1.1-1' }} m elevation ·
            local grade {{ k.grade | number: '1.0-1' }}°
          } @else {
            Hover or tap the profile to see a point on the map.
          }
        </p>
        @if (profile()!.coverage < 1) {
          <p class="note">
            Part of the route is outside the terrain model or on missing data; those stretches count
            as flat.
          </p>
        }
        <p class="note">
          Sampled every {{ profile()!.stepMeters | number: '1.1-2' }} m from a 1 m HiRISE stereo DTM
          with no stated accuracy. Grades are between samples, not a safety rating.
        </p>
      </figure>
    }
  `,
  styles: `
    .profile {
      margin: 0;
      display: grid;
      gap: 4px;
    }
    figcaption {
      font-size: 0.85rem;
      font-weight: 600;
    }
    svg {
      width: 100%;
      height: auto;
      touch-action: none;
      cursor: crosshair;
    }
    .plot {
      fill: var(--surface-2, rgb(148 163 184 / 0.08));
    }
    .grid {
      stroke: rgb(148 163 184 / 0.35);
      stroke-width: 1;
    }
    .tick {
      font-size: 11px;
      fill: currentColor;
      opacity: 0.75;
    }
    .area {
      fill: rgb(56 189 248 / 0.18);
    }
    .line {
      fill: none;
      stroke: #38bdf8;
      stroke-width: 2;
    }
    .over {
      fill: none;
      stroke: #dc2626;
      stroke-width: 3.5;
    }
    .steep {
      fill: #dc2626;
      stroke: #fff;
      stroke-width: 1.5;
    }
    .cursor {
      stroke: currentColor;
      stroke-dasharray: 3 3;
      opacity: 0.6;
    }
    .dot {
      fill: #fff;
      stroke: #0ea5e9;
      stroke-width: 2;
    }
    .readout,
    .note {
      margin: 0;
      font-size: 0.8rem;
    }
    .note {
      opacity: 0.8;
    }
  `,
})
export class ElevationProfileComponent implements OnDestroy {
  readonly profile = input<RouteProfile | null>(null);
  /** Optional grade limit (degrees): segments steeper than this are drawn in red. */
  readonly gradeLimitDeg = input<number | null>(null);
  readonly W = W;
  readonly H = H;
  readonly PAD = PAD;
  private readonly store = inject(TerrainSamplerStore);
  private readonly index = signal<number | null>(null);

  readonly chart = computed(() => {
    const p = this.profile();
    if (!p || p.minElevation === null || p.maxElevation === null || p.samples.length < 2)
      return null;
    const total = p.planarMeters || 1;
    const span = Math.max(1, p.maxElevation - p.minElevation);
    const zMin = p.minElevation - span * 0.08;
    const zMax = p.maxElevation + span * 0.08;
    const x = (d: number) => PAD.l + (d / total) * (W - PAD.l - PAD.r);
    const y = (z: number) => PAD.t + (1 - (z - zMin) / (zMax - zMin)) * (H - PAD.t - PAD.b);
    let line = '';
    let pen = false;
    const pts: { x: number; y: number }[] = [];
    for (const s of p.samples) {
      if (s.elevation === null) {
        pen = false;
        pts.push({ x: x(s.distance), y: NaN });
        continue;
      }
      const X = x(s.distance);
      const Y = y(s.elevation);
      line += `${pen ? 'L' : 'M'}${X.toFixed(1)},${Y.toFixed(1)}`;
      pen = true;
      pts.push({ x: X, y: Y });
    }
    const valid = pts.filter((q) => Number.isFinite(q.y));
    const base = H - PAD.b;
    const area = valid.length
      ? `M${valid[0].x.toFixed(1)},${base}` +
        valid.map((q) => `L${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('') +
        `L${valid.at(-1)!.x.toFixed(1)},${base}Z`
      : '';
    const limit = this.gradeLimitDeg();
    const overLimit: string[] = [];
    let maxGrade: { x: number; y: number } | null = null;
    for (let i = 1; i < p.samples.length; i++) {
      const a = p.samples[i - 1];
      const b = p.samples[i];
      if (a.elevation === null || b.elevation === null) continue;
      const g =
        (Math.atan(Math.abs(b.elevation - a.elevation) / Math.max(1e-9, b.distance - a.distance)) *
          180) /
        Math.PI;
      if (limit !== null && g > limit)
        overLimit.push(
          `M${pts[i - 1].x.toFixed(1)},${pts[i - 1].y.toFixed(1)}L${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`,
        );
      if (p.maxGradeAt && b.point.x === p.maxGradeAt.x && b.point.y === p.maxGradeAt.y)
        maxGrade = pts[i];
    }
    const yTicks = [0, 1, 2, 3].map((k) => {
      const v = zMin + ((zMax - zMin) * (k + 0.5)) / 4;
      return { v, y: y(v) };
    });
    const step = niceStep(total / 4);
    const xTicks: { v: number; x: number }[] = [];
    for (let v = 0; v <= total + 1e-9; v += step) xTicks.push({ v, x: x(v) });
    const summary = `Elevation profile: starts at ${p.startElevation?.toFixed(0) ?? 'unknown'} m, ends at ${p.endElevation?.toFixed(0) ?? 'unknown'} m, highest ${p.maxElevation.toFixed(0)} m, lowest ${p.minElevation.toFixed(0)} m over ${total.toFixed(0)} m.`;
    return { line, area, overLimit, maxGrade, yTicks, xTicks, pts, summary, x };
  });

  readonly cursor = computed(() => {
    const i = this.index();
    const p = this.profile();
    const c = this.chart();
    if (i === null || !p || !c) return null;
    const s = p.samples[i];
    if (s.elevation === null || !Number.isFinite(c.pts[i].y)) return null;
    const j = Math.min(p.samples.length - 1, i + 1);
    const k = Math.max(0, i - 1);
    const a = p.samples[k];
    const b = p.samples[j];
    const grade =
      a.elevation !== null && b.elevation !== null && b.distance > a.distance
        ? (Math.atan(Math.abs(b.elevation - a.elevation) / (b.distance - a.distance)) * 180) /
          Math.PI
        : 0;
    return { x: c.pts[i].x, y: c.pts[i].y, distance: s.distance, elevation: s.elevation, grade };
  });

  onMove(event: PointerEvent): void {
    const p = this.profile();
    const svg = event.currentTarget as SVGSVGElement;
    const box = svg.getBoundingClientRect?.();
    if (!p || !box || box.width === 0) return;
    const vx = ((event.clientX - box.left) / box.width) * W;
    const d = ((vx - PAD.l) / (W - PAD.l - PAD.r)) * p.planarMeters;
    let best = 0;
    for (let i = 1; i < p.samples.length; i++)
      if (Math.abs(p.samples[i].distance - d) < Math.abs(p.samples[best].distance - d)) best = i;
    this.index.set(best);
    this.store.setHover(p.samples[best].point);
  }

  clear(): void {
    this.index.set(null);
    this.store.setHover(null);
  }

  ngOnDestroy(): void {
    this.store.setHover(null);
  }
}

function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-9)));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}
