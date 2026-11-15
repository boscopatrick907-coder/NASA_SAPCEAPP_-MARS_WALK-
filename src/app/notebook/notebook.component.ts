import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Point } from '../core/models';
import { MissionService } from '../core/mission.service';

@Component({
  selector: 'app-notebook',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './notebook.component.html',
  styleUrl: './notebook.component.scss',
})
export class NotebookComponent {
  private missionService = inject(MissionService);

  readonly observations = this.missionService.observations;
  readonly image = this.missionService.image;
  readonly route = this.missionService.route;

  // expose service readiness status
  readonly dataStatus = this.missionService.dataStatus;

  // Local component draft state (retained on failure)
  readonly draftText = signal<string>('');
  readonly attachStartLocation = signal<boolean>(false);
  readonly feedback = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // enable submit only when service is ready and draft is non‑empty
  readonly canSubmit = computed(() => this.dataStatus() === 'ready' && !this.isDraftEmpty());

  readonly isDraftEmpty = computed(() => {
    return this.draftText().trim().length === 0;
  });

  readonly hasStartPoint = computed(() => {
    return this.route().start !== null;
  });

  setDraftText(text: string): void {
    this.draftText.set(text);
  }

  toggleAttachStart(): void {
    if (this.hasStartPoint()) {
      // Toggle attaching the start location to the next observation
      this.attachStartLocation.update(v => !v);
    }
  }

  onSubmit(): void {
    // Guard against submitting while the mission data is still loading
    if (this.dataStatus() !== 'ready') {
      this.setFeedback('Mission data is still loading, please wait.', 'error');
      return;
    }
    const raw = this.draftText();
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      this.setFeedback('Observation text cannot be empty or whitespace only.', 'error');
      return;
    }

    let pos: Point | null = null;
    const routeStart = this.route().start;
    if (this.attachStartLocation() && routeStart) {
      pos = { ...routeStart };
    }

    // Call service to validate and persist
    const res = this.missionService.addObservation(trimmed, pos);

    if (res.ok) {
      // Clear draft ONLY after confirmed success
      this.draftText.set('');
      this.attachStartLocation.set(false);
      this.setFeedback('Observation saved to local mission log.', 'success');
    } else {
      // Storage or validation failed: draftText is preserved!
      this.setFeedback(
        res.error ?? 'Storage failed: your note draft has been preserved in the editor.',
        'error',
      );
    }
  }

  private setFeedback(message: string, type: 'success' | 'error'): void {
    this.feedback.set({ message, type });
    setTimeout(() => {
      if (this.feedback()?.message === message) {
        this.feedback.set(null);
      }
    }, 4500);
  }
}
