/**
 * Mission HUD: the walk in five numbers (distance, climb, steepest grade, turn-back time,
 * margin), always visible above the map. Figures come from the shared MissionBriefStore.
 */
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { MissionService } from '../../core/mission.service';
import { clock, MissionBriefStore } from '../../core/mission-brief.store';

export type HudAction = 'demo' | 'planner';

@Component({
  selector: 'app-mission-hud',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hud" aria-label="Walk summary" aria-live="polite">
      @if (view(); as v) {
        @if (v.kind === 'empty') {
          <p class="hint">
            <span class="pulse" aria-hidden="true"></span>
            Set a <strong>start</strong> and a <strong>destination</strong> on the map to plan a
            walk.
          </p>
          <button type="button" class="cta" (click)="action.emit('demo')">
            <span aria-hidden="true">▶</span> Demo walk
          </button>
        } @else {
          <dl class="tiles">
            <div class="tile">
              <dt>Distance</dt>
              <dd>
                {{ v.distance }}<small>{{ v.distanceUnit }}</small>
              </dd>
            </div>
            <div class="tile">
              <dt>Climb</dt>
              <dd>
                @if (v.climb !== null) {
                  ↑{{ v.climb }}<small>m</small> <span class="sub">↓{{ v.descent }}</span>
                } @else {
                  <span class="na">—</span>
                }
              </dd>
            </div>
            <div class="tile" [class.bad]="v.gradeExceeded">
              <dt>Steepest</dt>
              <dd>
                @if (v.steepest !== null) {
                  {{ v.steepest }}<small>°</small>
                  @if (v.gradeExceeded) {
                    <span class="flag">over limit</span>
                  }
                } @else {
                  <span class="na">—</span>
                }
              </dd>
            </div>
            @if (v.turnBack !== null) {
              <div class="tile key" [class.bad]="!v.fits">
                <dt>Turn back by</dt>
                <dd>{{ v.turnBack }}<small>h:mm</small></dd>
              </div>
              <div class="tile" [class.good]="v.fits" [class.bad]="!v.fits">
                <dt>Margin</dt>
                <dd>{{ v.margin }}<small>min</small></dd>
              </div>
            }
          </dl>
          @if (v.turnBack === null) {
            <button type="button" class="cta" (click)="action.emit('planner')">
              Add time budget
            </button>
          }
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .hud {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      min-height: 64px;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      background: var(--hud-panel-bg);
      box-shadow: var(--shadow-panel);
    }
    .hint {
      margin: 0;
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }
    .hint strong {
      color: var(--text-primary);
    }
    .pulse {
      display: inline-block;
      margin-right: var(--space-2);
      vertical-align: middle;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--mars-accent);
      animation: pulse 1.8s ease-out infinite;
    }
    .tiles {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-5);
      margin: 0;
    }
    .tile {
      min-width: 0;
    }
    dt {
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    dd {
      margin: 0;
      font-family: var(--font-numeric);
      font-size: 22px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
      color: var(--text-primary);
      white-space: nowrap;
    }
    small {
      margin-left: 2px;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 500;
    }
    .sub {
      color: var(--text-muted);
      font-size: 14px;
    }
    .na {
      color: var(--text-muted);
    }
    .key dd {
      color: var(--mars-accent-text);
    }
    .good dd {
      color: var(--success-green);
    }
    .bad dd {
      color: var(--error-red);
    }
    .flag {
      margin-left: 6px;
      padding: 2px 6px;
      border-radius: 999px;
      background: var(--error-bg);
      color: var(--error-red);
      font-family: var(--font-sans);
      font-size: 11px;
      font-weight: 700;
      vertical-align: middle;
    }
    .cta {
      flex: none;
      min-height: 40px;
      padding: 0 var(--space-4);
      border: 0;
      border-radius: 999px;
      color: var(--on-accent);
      background: linear-gradient(135deg, #ffb07c, #ff7a3d);
      box-shadow: 0 6px 18px rgb(255 122 61 / 0.3);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .cta:focus-visible {
      outline: 3px solid var(--border-focus);
      outline-offset: 2px;
    }
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgb(255 138 76 / 0.6);
      }
      100% {
        box-shadow: 0 0 0 12px rgb(255 138 76 / 0);
      }
    }
    @media (max-width: 600px) {
      .hud {
        flex-wrap: wrap;
      }
      dd {
        font-size: 18px;
      }
      .tiles {
        gap: var(--space-1) var(--space-4);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pulse {
        animation: none;
      }
    }
  `,
})
export class MissionHudComponent {
  private readonly mission = inject(MissionService);
  private readonly brief = inject(MissionBriefStore);
  readonly action = output<HudAction>();

  readonly view = computed(() => {
    const route = this.mission.route();
    if (!route.start || !route.destination) return { kind: 'empty' as const };
    const p = this.brief.profile();
    const r = this.brief.result();
    const planar = this.mission.assessment().planarDistanceMeters;
    const meters = p && p.coverage > 0 ? p.terrainMeters : planar;
    const km = meters !== null && meters >= 1000;
    return {
      kind: 'route' as const,
      distance: meters === null ? '—' : km ? (meters / 1000).toFixed(2) : meters.toFixed(0),
      distanceUnit: meters === null ? '' : km ? 'km one way' : 'm one way',
      climb: p ? p.ascentMeters.toFixed(0) : null,
      descent: p ? p.descentMeters.toFixed(0) : null,
      steepest: p ? p.maxGradeDeg.toFixed(0) : null,
      gradeExceeded: r.ok && r.gradeExceeded,
      turnBack: r.ok ? clock(r.turnaroundMinute) : null,
      margin: r.ok
        ? `${r.marginMinutes >= 0 ? '+' : '−'}${Math.abs(r.marginMinutes).toFixed(0)}`
        : '',
      fits: r.ok && r.fits,
    };
  });
}
