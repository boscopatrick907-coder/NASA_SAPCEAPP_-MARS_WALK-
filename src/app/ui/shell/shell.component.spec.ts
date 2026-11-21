import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { MissionService } from '../../core/mission.service';
import { NotebookComponent } from '../../notebook/notebook.component';
import { ShellComponent } from './shell.component';

@Component({
  standalone: true,
  imports: [ShellComponent],
  template: `
    <app-shell>
      <div pwa-status data-testid="projected-pwa">Projected PWA status</div>
      <div environmental-context data-testid="projected-env">Projected REMS context</div>
    </app-shell>
  `,
})
class ShellSlotHostComponent {}

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  const originalViewportWidth = window.innerWidth;

  beforeEach(async () => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalViewportWidth,
    });
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [MissionService, provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalViewportWidth,
    });
  });

  it('creates shell layout and defaults to confidence tab', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('confidence');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-confidence-panel')).toBeTruthy();
  });

  it('switches between tabs on demand', async () => {
    component.setActiveTab('planner');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('planner');
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-route-planner')).toBeTruthy();

    component.setActiveTab('notebook');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('notebook');
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-notebook')).toBeTruthy();
  });

  it('toggles panel collapsed state', () => {
    expect(component.isPanelCollapsed()).toBe(false);
    component.togglePanel();
    expect(component.isPanelCollapsed()).toBe(true);
    component.togglePanel();
    expect(component.isPanelCollapsed()).toBe(false);
  });

  it('handles resizer keyboard navigation and width reset', () => {
    const initialWidth = component.panelWidth();
    expect(initialWidth).toBe(380);

    // ArrowLeft widens panel
    component.onResizerKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(component.panelWidth()).toBe(400);

    // ArrowRight narrows panel
    component.onResizerKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.panelWidth()).toBe(380);

    // Double click resets to default
    component.onResizerKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(component.panelWidth()).toBe(400);
    component.resetPanelWidth();
    expect(component.panelWidth()).toBe(380);
  });

  it('clamps keyboard and restored widths to reserve map space at an 820px viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 820 });
    component.onResizerKeydown(new KeyboardEvent('keydown', { key: 'End' }));
    expect(component.panelWidth()).toBe(520);
    localStorage.setItem('marswalk_panel_width', '750');
    fixture.destroy();
    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.panelWidth()).toBe(520);
  });

  it('resizes the sidebar with pointer input and persists the viewport-clamped width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 820 });
    component.onViewportResize();
    component.startResize(new MouseEvent('mousedown', { clientX: 440 }));

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 360 }));
    expect(component.panelWidth()).toBe(460);
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
    expect(component.panelWidth()).toBe(520);
    window.dispatchEvent(new MouseEvent('mouseup'));

    expect(localStorage.getItem('marswalk_panel_width')).toBe('520');
    expect(component.isResizing()).toBe(false);
  });

  it('keeps unsaved and failed-save notebook drafts while tabs change', async () => {
    component.setActiveTab('notebook');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const notebook = fixture.debugElement.query(By.directive(NotebookComponent))
      .componentInstance as NotebookComponent;
    const mission = TestBed.inject(MissionService);
    notebook.setDraftText('Keep this exact field note');
    component.setActiveTab('planner');
    fixture.detectChanges();
    component.setActiveTab('notebook');
    fixture.detectChanges();
    expect(notebook.draftText()).toBe('Keep this exact field note');

    vi.spyOn(mission, 'addObservation').mockReturnValue({
      ok: false,
      error: 'Storage unavailable',
    });
    notebook.onSubmit();
    component.setActiveTab('confidence');
    fixture.detectChanges();
    component.setActiveTab('notebook');
    fixture.detectChanges();
    expect(notebook.draftText()).toBe('Keep this exact field note');
    expect(notebook.feedback()?.type).toBe('error');
  });

  it('wires full ARIA tablist, tab, and tabpanel linkage with roving tabindex', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tablist = compiled.querySelector('nav.panel-tabs[role="tablist"]');
    expect(tablist?.getAttribute('aria-label')).toBe('Workspace Sections');

    const tabIds = ['confidence', 'planner', 'notebook', 'transfer', 'rehearsal'] as const;
    for (const id of tabIds) {
      const tab = compiled.querySelector(`#tab-${id}`) as HTMLButtonElement | null;
      const panel = compiled.querySelector(`#panel-${id}`) as HTMLElement | null;
      expect(tab).toBeTruthy();
      expect(tab?.getAttribute('role')).toBe('tab');
      expect(tab?.getAttribute('aria-controls')).toBe(`panel-${id}`);
      expect(panel).toBeTruthy();
      expect(panel?.getAttribute('role')).toBe('tabpanel');
      expect(panel?.getAttribute('aria-labelledby')).toBe(`tab-${id}`);
      expect(panel?.getAttribute('tabindex')).toBe('0');
    }

    const assertSelected = (selectedId: (typeof tabIds)[number]) => {
      for (const id of tabIds) {
        const tab = compiled.querySelector(`#tab-${id}`) as HTMLButtonElement;
        const panel = compiled.querySelector(`#panel-${id}`) as HTMLElement;
        const isSelected = id === selectedId;
        expect(tab.getAttribute('aria-selected')).toBe(String(isSelected));
        expect(tab.tabIndex).toBe(isSelected ? 0 : -1);
        expect(panel.hidden).toBe(!isSelected);
      }
    };

    assertSelected('confidence');

    component.setActiveTab('rehearsal');
    fixture.detectChanges();
    assertSelected('rehearsal');
    expect(compiled.querySelector('#panel-rehearsal')?.getAttribute('aria-labelledby')).toBe(
      'tab-rehearsal',
    );
    expect(compiled.querySelector('#viewer-title')?.textContent).toContain('Optional 3D rehearsal');
  });

  it('supports keyboard tab navigation with wrap-around without hijacking notebook textarea keys', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tab = (id: string) => compiled.querySelector(`#tab-${id}`) as HTMLButtonElement;

    tab('confidence').focus();
    tab('confidence').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(component.activeTab()).toBe('planner');
    expect(document.activeElement).toBe(tab('planner'));

    tab('planner').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeTab()).toBe('rehearsal');
    expect(document.activeElement).toBe(tab('rehearsal'));

    tab('rehearsal').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(component.activeTab()).toBe('confidence');
    expect(document.activeElement).toBe(tab('confidence'));

    tab('confidence').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    fixture.detectChanges();
    expect(component.activeTab()).toBe('rehearsal');
    expect(document.activeElement).toBe(tab('rehearsal'));

    tab('rehearsal').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeTab()).toBe('confidence');
    expect(document.activeElement).toBe(tab('confidence'));

    component.setActiveTab('notebook');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const textarea = compiled.querySelector('#obs-input') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    textarea.focus();
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      fixture.detectChanges();
      expect(component.activeTab()).toBe('notebook');
    }

    const directEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
    Object.defineProperty(directEvent, 'target', { value: textarea });
    component.onTabKeydown(directEvent);
    expect(directEvent.defaultPrevented).toBe(false);
    expect(component.activeTab()).toBe('notebook');
  });

  it('applies inert and aria-hidden on collapsed side panel, hides resizer, and restores on expand', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const aside = compiled.querySelector('#side-panel') as HTMLElement;
    const toggleBtn = compiled.querySelector('.panel-toggle-btn') as HTMLButtonElement;
    const resizer = compiled.querySelector('.panel-resizer') as HTMLElement;

    expect(aside.hasAttribute('inert')).toBe(false);
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(toggleBtn.getAttribute('aria-controls')).toBe('side-panel');
    expect(resizer.hidden).toBe(false);
    expect(resizer.tabIndex).toBe(0);

    toggleBtn.click();
    fixture.detectChanges();

    expect(aside.hasAttribute('inert')).toBe(true);
    expect(aside.getAttribute('aria-hidden')).toBe('true');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    expect(resizer.hidden).toBe(true);
    expect(resizer.tabIndex).toBe(-1);

    toggleBtn.click();
    fixture.detectChanges();

    expect(aside.hasAttribute('inert')).toBe(false);
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(resizer.hidden).toBe(false);
    expect(resizer.tabIndex).toBe(0);
  });

  it('lazily mounts planner and notebook stickily while still tearing down 3D viewer on tab leave', async () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-confidence-panel')).toBeTruthy();
    expect(compiled.querySelector('app-map')).toBeTruthy();
    expect(compiled.querySelector('app-route-planner')).toBeNull();
    expect(compiled.querySelector('app-notebook')).toBeNull();
    expect(compiled.querySelector('app-viewer3d')).toBeNull();

    component.setActiveTab('planner');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(compiled.querySelector('app-route-planner')).toBeTruthy();
    expect(compiled.querySelector('app-notebook')).toBeNull();

    component.setActiveTab('notebook');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(compiled.querySelector('app-notebook')).toBeTruthy();
    expect(compiled.querySelector('app-route-planner')).toBeTruthy();

    component.setActiveTab('rehearsal');
    fixture.detectChanges();
    expect(component.viewerOpen()).toBe(false);
    expect(compiled.querySelector('app-viewer3d')).toBeNull();

    const viewerToggle = compiled.querySelector('.viewer-toggle') as HTMLButtonElement;
    viewerToggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.viewerOpen()).toBe(true);
    expect(compiled.querySelector('app-viewer3d')).toBeTruthy();

    component.setActiveTab('confidence');
    fixture.detectChanges();
    expect(component.viewerOpen()).toBe(false);
    expect(compiled.querySelector('app-viewer3d')).toBeNull();
    expect(compiled.querySelector('app-route-planner')).toBeTruthy();
    expect(compiled.querySelector('app-notebook')).toBeTruthy();
  });

  it('keeps WCAG Label-in-Name on panel toggle and renders footer readiness boundary', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('.panel-toggle-btn') as HTMLButtonElement;
    const boundary = compiled.querySelector('.workspace-footer .footer-boundary') as HTMLElement;

    expect(toggleBtn.textContent?.trim()).toBe('Collapse Panel ▸');
    expect(toggleBtn.getAttribute('aria-label')).toBe('Collapse panel sidebar');

    toggleBtn.click();
    fixture.detectChanges();
    expect(toggleBtn.textContent?.trim()).toBe('Show Panel ◂');
    expect(toggleBtn.getAttribute('aria-label')).toBe('Show panel sidebar');

    expect(boundary?.textContent?.trim()).toContain(
      'Readiness states (metadata, map display, local storage, network, offline pack) are verified independently.',
    );
  });

  it('does not write marswalk_panel_width to localStorage in ngOnDestroy unless resized', () => {
    localStorage.clear();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    fixture.destroy();
    expect(setItemSpy).not.toHaveBeenCalledWith('marswalk_panel_width', expect.anything());
    expect(localStorage.getItem('marswalk_panel_width')).toBeNull();
    setItemSpy.mockRestore();
  });

  it('projects lifecycle and environmental content once in the expected order', async () => {
    const hostFixture = TestBed.createComponent(ShellSlotHostComponent);
    hostFixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0)); // let @defer (on idle) blocks load
    await hostFixture.whenStable();
    hostFixture.detectChanges();
    const hostEl = hostFixture.nativeElement as HTMLElement;

    const layout = hostEl.querySelector('.shell-layout') as HTMLElement;
    const pwaProjected = layout.querySelector('[data-testid="projected-pwa"]') as HTMLElement;
    const header = layout.querySelector('app-header') as HTMLElement;
    expect(pwaProjected).toBeTruthy();
    // Install/offline controls live in the header's status dropdown.
    expect(header.querySelector('.status-dropdown')?.contains(pwaProjected)).toBe(true);
    expect(layout.querySelectorAll('[data-testid="projected-pwa"]')).toHaveLength(1);

    const confidencePanel = hostEl.querySelector('app-confidence-panel') as HTMLElement;
    const envProjected = confidencePanel.querySelector(
      '[data-testid="projected-env"]',
    ) as HTMLElement;
    expect(envProjected).toBeTruthy();
    expect(confidencePanel.querySelector('.env-slot-card')).toBeNull();
    expect(envProjected.previousElementSibling?.tagName.toLowerCase()).toBe(
      'app-exploration-confidence',
    );
    expect(envProjected.nextElementSibling?.tagName.toLowerCase()).toBe('app-science-context');
    hostFixture.destroy();
  });

  it('connects mission review workflow buttons to open panels, expand collapsed sidebar, focus tab, and preserve drafts/state without storage writes', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const mission = TestBed.inject(MissionService);

    // Open notebook first and type an unsaved draft
    const notebookBtn = compiled.querySelector(
      '[data-workflow-tab="notebook"]',
    ) as HTMLButtonElement;
    notebookBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('notebook');

    const notebookDebug = fixture.debugElement.query(By.directive(NotebookComponent));
    const notebookComp = notebookDebug.componentInstance as NotebookComponent;
    notebookComp.setDraftText('Unsaved boxwork fracture observation draft');
    fixture.detectChanges();

    // Collapse the sidebar and spy on storage/mission methods
    component.togglePanel();
    fixture.detectChanges();
    expect(component.isPanelCollapsed()).toBe(true);

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const saveRouteSpy = vi.spyOn(mission, 'saveRoute');
    const clearRouteSpy = vi.spyOn(mission, 'clearRoute');
    const exportSpy = vi.spyOn(mission, 'exportMission');
    const setModeSpy = vi.spyOn(mission, 'setMode');

    // Click "2. Edit route" in MissionReviewComponent while sidebar is collapsed
    const plannerBtn = compiled.querySelector('[data-workflow-tab="planner"]') as HTMLButtonElement;
    plannerBtn.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();

    expect(component.isPanelCollapsed()).toBe(false);
    expect(component.activeTab()).toBe('planner');
    expect(document.activeElement?.id).toBe('tab-planner');

    // Navigate through transfer and back to notebook
    const transferBtn = compiled.querySelector(
      '[data-workflow-tab="transfer"]',
    ) as HTMLButtonElement;
    transferBtn.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(component.activeTab()).toBe('transfer');
    expect(document.activeElement?.id).toBe('tab-transfer');

    notebookBtn.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(component.activeTab()).toBe('notebook');
    expect(document.activeElement?.id).toBe('tab-notebook');
    expect(notebookComp.draftText()).toBe('Unsaved boxwork fracture observation draft');

    // Verify zero side effects on mission or storage
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(saveRouteSpy).not.toHaveBeenCalled();
    expect(clearRouteSpy).not.toHaveBeenCalled();
    expect(exportSpy).not.toHaveBeenCalled();
    expect(setModeSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
