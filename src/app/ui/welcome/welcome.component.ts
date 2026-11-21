/**
 * First-run welcome over the map: what MARSWALK is for, in one screen, and a one-click demo
 * walk. Dismissal is remembered on this device; the demo can be replayed from the step rail.
 */
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MissionService } from '../../core/mission.service';
import { MissionBriefStore } from '../../core/mission-brief.store';
import { TerrainSamplerStore } from '../../core/terrain-sampler.store';
import { DEMO_IMAGE_REF, runDemoWalk } from './demo-walk';
import { WELCOME_SEEN_KEY } from './welcome-seen';

export { WELCOME_SEEN_KEY, welcomeSeen } from './welcome-seen';

@Component({
  selector: 'app-welcome',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="welcome" aria-labelledby="welcome-title">
      <div class="card">
        <p class="kicker">
          <span class="dot" aria-hidden="true"></span>Gale Crater · Mount Sharp, Mars
        </p>
        <h2 id="welcome-title">Plan a walk on Mars.</h2>
        <p class="lead">
          See where the science is, check whether you can climb there, and know the exact minute you
          must turn back, even with no connection to Earth.
        </p>
        <ol class="features">
          <li>
            <span class="ico" aria-hidden="true">◎</span>
            <span
              ><strong>Find the science</strong> Sulfate minerals mapped from orbit (CRISM)</span
            >
          </li>
          <li>
            <span class="ico" aria-hidden="true">⛰</span>
            <span><strong>Check the climb</strong> 1 m terrain model: slope, height, profile</span>
          </li>
          <li>
            <span class="ico" aria-hidden="true">◷</span>
            <span
              ><strong>Know when to turn back</strong> Time budget with a protected reserve</span
            >
          </li>
        </ol>
        <div class="actions">
          <button type="button" class="primary" (click)="startDemo()" [disabled]="!demoReady()">
            <span aria-hidden="true">▶</span> Start the demo walk
          </button>
          <button type="button" class="ghost" (click)="dismiss()">Explore on my own</button>
        </div>
        <p class="fine">
          Real NASA data: HiRISE 25 cm image and 1 m terrain, CRISM mineral scans. A planning
          rehearsal, not a safety rating.
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 900;
      display: grid;
      place-items: center;
      padding: var(--space-4);
      background:
        radial-gradient(ellipse at 30% 20%, rgb(255 120 60 / 0.18), transparent 60%),
        rgb(8 6 5 / 0.62);
      backdrop-filter: blur(3px);
      animation: fade var(--dur-slow) var(--ease-out);
    }
    .card {
      width: min(560px, 100%);
      padding: var(--space-6);
      border: 1px solid rgb(255 255 255 / 0.1);
      border-radius: 22px;
      background: linear-gradient(160deg, rgb(40 28 22 / 0.92), rgb(16 12 10 / 0.94));
      box-shadow:
        0 30px 80px rgb(0 0 0 / 0.55),
        inset 0 1px 0 rgb(255 255 255 / 0.06);
      color: #f5efe8;
      animation: rise 400ms var(--ease-out);
    }
    .kicker {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 var(--space-3);
      color: #ffb08a;
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff8a4c;
      box-shadow: 0 0 0 4px rgb(255 138 76 / 0.2);
    }
    h2 {
      margin: 0;
      font-size: clamp(28px, 4.2vw, 40px);
      letter-spacing: -0.03em;
      background: linear-gradient(90deg, #fff 0%, #ffd1b8 60%, #ff8a4c 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .lead {
      margin: var(--space-3) 0 var(--space-5);
      color: #d9cbbd;
      font-size: var(--text-md);
      line-height: 1.55;
    }
    .features {
      display: grid;
      gap: var(--space-3);
      margin: 0 0 var(--space-5);
      padding: 0;
      list-style: none;
    }
    .features li {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-sm);
      color: #cdbfb2;
    }
    .features strong {
      display: block;
      color: #fff;
      font-size: var(--text-base);
    }
    .ico {
      flex: none;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgb(255 138 76 / 0.14);
      color: #ffa06c;
      font-size: 20px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }
    button {
      min-height: 48px;
      padding: 0 var(--space-5);
      border-radius: 999px;
      font: inherit;
      font-weight: 700;
      font-size: var(--text-md);
      cursor: pointer;
    }
    .primary {
      border: 0;
      color: #1a0f08;
      background: linear-gradient(135deg, #ffb07c, #ff7a3d);
      box-shadow: 0 8px 24px rgb(255 122 61 / 0.4);
    }
    .primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 30px rgb(255 122 61 / 0.5);
    }
    .primary:disabled {
      opacity: 0.6;
    }
    .ghost {
      border: 1px solid rgb(255 255 255 / 0.22);
      color: #f5efe8;
      background: transparent;
    }
    .ghost:hover {
      background: rgb(255 255 255 / 0.06);
    }
    button:focus-visible {
      outline: 3px solid #7ab8ff;
      outline-offset: 3px;
    }
    .fine {
      margin: var(--space-4) 0 0;
      color: #a8998b;
      font-size: var(--text-xs);
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
    }
    @media (max-width: 600px) {
      .card {
        padding: var(--space-5);
      }
      .actions button {
        flex: 1 1 100%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host,
      .card {
        animation: none;
      }
    }
  `,
})
export class WelcomeComponent {
  private readonly mission = inject(MissionService);
  private readonly brief = inject(MissionBriefStore);
  private readonly terrain = inject(TerrainSamplerStore);
  /** Emitted after the demo route is drawn. */
  readonly demoStarted = output<void>();
  readonly closed = output<void>();

  demoReady(): boolean {
    return this.mission.image()?.imageRef === DEMO_IMAGE_REF;
  }

  startDemo(): void {
    if (!runDemoWalk(this.mission, this.brief, this.terrain)) return;
    this.remember();
    this.demoStarted.emit();
  }

  dismiss(): void {
    this.remember();
    this.closed.emit();
  }

  private remember(): void {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, '1');
    } catch {
      // Storage unavailable: the welcome simply shows again next time.
    }
  }
}
