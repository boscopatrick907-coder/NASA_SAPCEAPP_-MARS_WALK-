import { Component, ElementRef, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { MissionService } from '../../core/mission.service';
import { Viewer3dComponent } from '../../viewer3d/viewer3d.component';
import { MapComponent } from '../../map/map.component';
import { NotebookComponent } from '../../notebook/notebook.component';
import { RoutePlannerComponent } from '../../planner/route-planner.component';
import { TerrainPreviewComponent } from '../../terrain/terrain-preview.component';
import { TerrainBootstrapComponent } from '../../terrain/terrain-bootstrap.component';
import { ConfidencePanelComponent } from '../confidence-panel/confidence-panel.component';
import { HeaderComponent } from '../header/header.component';
import {
  MissionReviewComponent,
  type MissionWorkflowTab,
} from '../mission-review/mission-review.component';

export type ActiveTab = 'confidence' | 'planner' | 'notebook' | 'transfer' | 'rehearsal';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MapComponent,
    Viewer3dComponent,
    HeaderComponent,
    MissionReviewComponent,
    ConfidencePanelComponent,
    RoutePlannerComponent,
    TerrainPreviewComponent,
    TerrainBootstrapComponent,
    NotebookComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnDestroy {
  private missionService = inject(MissionService);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly observations = this.missionService.observations;

  readonly activeTab = signal<ActiveTab>('confidence');
  readonly viewerOpen = signal(false);
  readonly plannerOpened = signal(false);
  readonly notebookOpened = signal(false);
  readonly isPanelCollapsed = signal<boolean>(false);

  private readonly tabOrder: readonly ActiveTab[] = [
    'confidence',
    'planner',
    'notebook',
    'transfer',
    'rehearsal',
  ];

  // Resizable sidebar state
  readonly panelWidth = signal<number>(380);
  readonly isResizing = signal<boolean>(false);

  private readonly MIN_WIDTH = 300;
  private readonly MIN_MAP_WIDTH = 300;
  private readonly MAX_WIDTH = 750;
  private readonly DEFAULT_WIDTH = 380;
  private readonly STORAGE_KEY = 'marswalk_panel_width';

  private boundMouseMove?: (e: MouseEvent) => void;
  private boundMouseUp?: () => void;
  private boundTouchMove?: (e: TouchEvent) => void;
  private boundTouchEnd?: () => void;

  constructor() {
    this.initPanelWidth();
  }

  maxPanelWidth(): number {
    const viewportWidth =
      typeof window === 'undefined' ? this.MAX_WIDTH + this.MIN_MAP_WIDTH : window.innerWidth;
    return Math.max(this.MIN_WIDTH, Math.min(this.MAX_WIDTH, viewportWidth - this.MIN_MAP_WIDTH));
  }

  private clampPanelWidth(width: number): number {
    return Math.min(this.maxPanelWidth(), Math.max(this.MIN_WIDTH, width));
  }

  private initPanelWidth(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) this.panelWidth.set(this.clampPanelWidth(parsed));
      }
    } catch {
      // Ignore storage errors
    }
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    if (window.innerWidth > 768) this.panelWidth.set(this.clampPanelWidth(this.panelWidth()));
  }

  setActiveTab(tab: ActiveTab): void {
    if (tab === 'planner') this.plannerOpened.set(true);
    if (tab === 'notebook') this.notebookOpened.set(true);
    if (tab !== 'rehearsal') this.viewerOpen.set(false);
    this.activeTab.set(tab);
    if (this.isPanelCollapsed()) {
      this.isPanelCollapsed.set(false);
    }
  }

  onWorkflowNavigate(tab: MissionWorkflowTab): void {
    this.setActiveTab(tab);
    setTimeout(() => {
      const tabBtn = this.elementRef.nativeElement.querySelector<HTMLElement>(`#tab-${tab}`);
      tabBtn?.focus();
    });
  }

  onTabKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    const tabButton = target?.closest?.('[role="tab"]') as HTMLElement | null;
    if (!tabButton) return;

    const rawId = tabButton.id.startsWith('tab-') ? (tabButton.id.slice(4) as ActiveTab) : null;
    const currentIndex =
      rawId && this.tabOrder.includes(rawId)
        ? this.tabOrder.indexOf(rawId)
        : this.tabOrder.indexOf(this.activeTab());

    let nextTab: ActiveTab | null = null;
    if (event.key === 'ArrowRight') {
      nextTab = this.tabOrder[(currentIndex + 1) % this.tabOrder.length];
    } else if (event.key === 'ArrowLeft') {
      nextTab = this.tabOrder[(currentIndex - 1 + this.tabOrder.length) % this.tabOrder.length];
    } else if (event.key === 'Home') {
      nextTab = this.tabOrder[0];
    } else if (event.key === 'End') {
      nextTab = this.tabOrder[this.tabOrder.length - 1];
    }

    if (!nextTab) return;

    event.preventDefault();
    this.setActiveTab(nextTab);
    this.elementRef.nativeElement.querySelector<HTMLElement>(`#tab-${nextTab}`)?.focus();
  }

  togglePanel(): void {
    this.isPanelCollapsed.update((v) => !v);
  }

  startResize(event: MouseEvent | TouchEvent): void {
    if (this.isPanelCollapsed()) return;

    event.preventDefault();
    this.isResizing.set(true);

    this.boundMouseMove = (e: MouseEvent) => this.handlePointerMove(e.clientX);
    this.boundMouseUp = () => this.stopResize();

    this.boundTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.handlePointerMove(e.touches[0].clientX);
      }
    };
    this.boundTouchEnd = () => this.stopResize();

    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundTouchEnd);
  }

  private handlePointerMove(clientX: number): void {
    const windowWidth = window.innerWidth;
    const newWidth = windowWidth - clientX;
    this.panelWidth.set(this.clampPanelWidth(newWidth));
  }

  private stopResize(): void {
    const wasResizing = this.isResizing();
    this.isResizing.set(false);

    if (this.boundMouseMove) window.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundMouseUp) window.removeEventListener('mouseup', this.boundMouseUp);
    if (this.boundTouchMove) window.removeEventListener('touchmove', this.boundTouchMove);
    if (this.boundTouchEnd) window.removeEventListener('touchend', this.boundTouchEnd);

    if (wasResizing) this.persistPanelWidth();
  }

  private persistPanelWidth(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.panelWidth().toString());
    } catch {
      // Ignore storage errors.
    }
  }

  resetPanelWidth(): void {
    this.panelWidth.set(this.clampPanelWidth(this.DEFAULT_WIDTH));
    this.persistPanelWidth();
  }

  onResizerKeydown(event: KeyboardEvent): void {
    const STEP = 20;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = this.clampPanelWidth(this.panelWidth() + STEP);
      this.panelWidth.set(next);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const next = this.clampPanelWidth(this.panelWidth() - STEP);
      this.panelWidth.set(next);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.panelWidth.set(this.clampPanelWidth(this.MIN_WIDTH));
    } else if (event.key === 'End') {
      event.preventDefault();
      this.panelWidth.set(this.clampPanelWidth(this.MAX_WIDTH));
    }
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) this.persistPanelWidth();
  }

  ngOnDestroy(): void {
    this.stopResize();
  }
}
