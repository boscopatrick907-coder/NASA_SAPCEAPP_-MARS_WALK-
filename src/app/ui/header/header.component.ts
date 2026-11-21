import { Component, computed, inject } from '@angular/core';
import { LayerId } from '../../core/models';
import { MissionService } from '../../core/mission.service';
import { PwaService } from '../../core/pwa.service';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private missionService = inject(MissionService);
  private themeService = inject(ThemeService);
  private pwaService = inject(PwaService);

  readonly dataStatus = this.missionService.dataStatus;
  readonly image = this.missionService.image;
  readonly layers = this.missionService.layers;
  readonly theme = this.themeService.theme;
  readonly online = this.pwaService.online;
  readonly offlineState = this.pwaService.state;
  readonly offlineMessage = this.pwaService.message;
  readonly offlineProgress = this.pwaService.progress;
  readonly updateAvailable = this.pwaService.updateAvailable;
  readonly canInstall = this.pwaService.canInstall;

  readonly statusLabel = computed(() => {
    switch (this.dataStatus()) {
      case 'ready':
        return 'Metadata: Loaded';
      case 'loading':
        return 'Metadata: Loading…';
      case 'unavailable':
        return 'Metadata: Unavailable';
      case 'error':
        return 'Metadata: Error';
    }
  });

  readonly metadataStatusClass = computed(() => {
    switch (this.dataStatus()) {
      case 'ready':
        return 'status-info';
      case 'loading':
        return 'status-loading';
      case 'unavailable':
      case 'error':
        return 'status-error';
    }
  });

  /** One short, plain-language label for the header status button. */
  readonly statusSummary = computed(() => {
    const net = this.online() ? '' : 'No connection · ';
    switch (this.offlineState()) {
      case 'ready':
        return `${net}Offline ready`;
      case 'preparing':
        return `${net}Saving for offline…`;
      case 'checking':
        return `${net}Checking offline pack…`;
      case 'not-prepared':
        return `${net}Save for offline`;
      case 'error':
        return `${net}Offline pack needs repair`;
      case 'unsupported':
        return this.online() ? 'Online' : 'No connection';
    }
  });

  readonly networkLabel = computed(() => (this.online() ? 'Network: Online' : 'Network: Offline'));

  readonly offlinePackLabel = computed(() => {
    switch (this.offlineState()) {
      case 'ready':
        return 'Offline Pack: Verified';
      case 'preparing': {
        const p = this.offlineProgress();
        return p
          ? `Offline Pack: Preparing (${p.completed}/${p.total})`
          : 'Offline Pack: Preparing…';
      }
      case 'checking':
        return 'Offline Pack: Checking…';
      case 'not-prepared':
        return 'Offline Pack: Not Prepared';
      case 'unsupported':
        return 'Offline Pack: Unavailable';
      case 'error':
        return 'Offline Pack: Error';
    }
  });

  readonly offlinePackStatusClass = computed(() => {
    switch (this.offlineState()) {
      case 'ready':
        return 'status-ready';
      case 'preparing':
      case 'checking':
        return 'status-loading';
      case 'error':
        return 'status-error';
      case 'not-prepared':
      case 'unsupported':
        return 'status-neutral';
    }
  });

  toggleLayer(layerId: LayerId): void {
    const current = this.layers()[layerId];
    this.missionService.setLayer(layerId, !current);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onExport(): void {
    this.missionService.exportMission();
  }
}
