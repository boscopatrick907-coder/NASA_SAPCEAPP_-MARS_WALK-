import { Component, inject } from '@angular/core';
import { PwaService } from './pwa.service';

@Component({
  selector: 'app-pwa-panel',
  standalone: true,
  template: `
    <details class="pwa-panel">
      <summary>Install & offline · <span class="net" [class.off]="!pwa.online()">{{ pwa.online() ? 'Connection available' : 'Disconnected' }}</span> · <span class="pack" [class.ok]="pwa.state() === 'ready'">{{ packLabel() }}</span></summary>
      <p role="status">{{ pwa.message() }}</p>
      @if (pwa.progress(); as progress) { <p>{{ progress.completed }} / {{ progress.total }} files verified</p> }
      @if (pwa.version(); as version) { <p>Pack {{ version.slice(0, 12) }} · {{ pwa.totalBytes() }} bytes</p> }
      @if (pwa.state() !== 'unsupported') {
        <button type="button" (click)="pwa.prepare()" [disabled]="pwa.state() === 'preparing' || pwa.state() === 'checking'">Prepare offline</button>
        <button type="button" (click)="pwa.check()" [disabled]="pwa.state() === 'preparing' || pwa.state() === 'checking'">Verify saved pack</button>
        <button type="button" (click)="pwa.checkForUpdate()">Check for updates</button>
      }
      @if (pwa.canInstall()) { <button type="button" (click)="pwa.install()">Install MARSWALK</button> }
      @if (pwa.updateAvailable()) { <p>An update is waiting. Save/export work in every tab before applying it.</p><button type="button" (click)="pwa.applyUpdate()" [disabled]="pwa.state() === 'preparing'">Prepare & apply update</button> }
      <p>Install using your browser's install or Add to Home Screen menu if offered. Installation and offline preparation are separate. Browser storage may be cleared or evicted; verify again before disconnecting. External source websites need a connection.</p>
    </details>
  `,
  styles: `:host{display:block} .pwa-panel{padding:var(--space-1) max(var(--space-4),var(--safe-right)) var(--space-1) max(var(--space-4),var(--safe-left));padding-top:max(var(--space-1),var(--safe-top));background:var(--bg-surface);color:var(--text-secondary);border-bottom:1px solid var(--border-subtle);font-size:var(--text-xs)}summary{cursor:pointer;min-height:28px;display:flex;align-items:center;gap:.35rem;flex-wrap:wrap}.net,.pack{font-weight:600;color:var(--text-primary)}.net.off{color:var(--warning-text)}.pack.ok{color:var(--success-green)}p{max-width:90ch}button{min-height:44px;margin:0 var(--space-2) var(--space-2) 0;padding:0 var(--space-3);background:var(--bg-card);color:var(--text-primary);border:1px solid var(--border-control);border-radius:var(--radius-md);font-weight:600;cursor:pointer}button:hover:not(:disabled){border-color:var(--border-focus)}button:focus-visible,summary:focus-visible{outline:3px solid var(--border-focus);outline-offset:2px}button:disabled{opacity:.55}`,
})
export class PwaPanelComponent {
  readonly pwa = inject(PwaService);
  constructor() { void this.pwa.initialize(); }

  /** Plain-language pack state. "Pack verified" appears only for the verified ready state. */
  packLabel(): string {
    switch (this.pwa.state()) {
      case 'ready':
        return 'Pack verified';
      case 'checking':
        return 'Checking pack…';
      case 'preparing':
        return 'Preparing pack…';
      case 'not-prepared':
        return 'Pack not prepared';
      case 'error':
        return 'Pack needs repair';
      default:
        return 'Offline pack unavailable here';
    }
  }
}
