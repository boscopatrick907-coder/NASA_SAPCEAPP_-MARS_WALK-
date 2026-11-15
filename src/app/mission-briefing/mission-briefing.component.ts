import { Component, computed, inject, signal } from '@angular/core';
import { MissionService } from '../core/mission.service';
import type { ScienceMarker } from '../core/models';

export interface SafeBriefingRecord {
  readonly id: string;
  readonly name: string;
  readonly instrument: string | null;
  readonly date: string | null;
  readonly finding: string;
  readonly evidenceType: ScienceMarker['evidenceType'];
  readonly positionStatus: ScienceMarker['positionStatus'];
  readonly sourceTitle: string;
  readonly sourceCredit: string;
  readonly safeSourceUrl: string | null;
  readonly limitations: readonly string[];
}

export type CopyFeedbackState = 'idle' | 'copied' | 'error';

/**
 * Standalone, read-only mission briefing and field observation guide component for Emma 2.
 * Presents the scientific question, MRO/HiRISE and Curiosity/MSL evidence,
 * explicit scientific/spatial limitations, workflow guidance, a truthful
 * reactive structural checklist, and a deterministic plain-text field observation guide.
 * Performs zero mutations, storage calls, or navigation.
 */
@Component({
  selector: 'app-mission-briefing',
  standalone: true,
  imports: [],
  templateUrl: './mission-briefing.component.html',
  styleUrl: './mission-briefing.component.scss',
})
export class MissionBriefingComponent {
  readonly mission = inject(MissionService);

  readonly title =
    "What evidence supports the interpretation that ancient groundwater helped form Mount Sharp's boxwork?";

  readonly dataStatus = computed(() => this.mission.dataStatus());
  readonly dataError = computed(() => this.mission.dataError());

  readonly copyStatus = signal<CopyFeedbackState>('idle');
  readonly copyMessage = signal<string | null>(null);

  readonly imageInfo = computed(() => {
    const img = this.mission.image();
    if (!img) {
      return null;
    }
    return {
      imageRef: img.imageRef,
      title: img.source.title,
      credit: img.source.credit,
      safeUrl: this.toSafeExternalUrl(img.source.url),
      observationDate: img.observationDate,
      coverageStatus: img.coverageStatus,
      calibrationVerified: img.calibration.verified,
      metersPerPixel: img.calibration.metersPerPixel,
      limitations: img.limitations,
    };
  });

  readonly records = computed<readonly SafeBriefingRecord[]>(() =>
    this.mission.markers().map((marker) => ({
      id: marker.id,
      name: marker.name,
      instrument: marker.instrument,
      date: marker.date,
      finding: marker.finding,
      evidenceType: marker.evidenceType,
      positionStatus: marker.positionStatus,
      sourceTitle: marker.source.title,
      sourceCredit: marker.source.credit,
      safeSourceUrl: this.toSafeExternalUrl(marker.source.url),
      limitations: marker.limitations,
    })),
  );

  readonly hasStartAndDestination = computed(() => {
    const route = this.mission.route();
    return route.start !== null && route.destination !== null;
  });

  readonly selectedRecord = computed<SafeBriefingRecord | null>(() => {
    const selectedId = this.mission.selectedMarkerId();
    const activeImage = this.mission.image();
    if (!selectedId) {
      return null;
    }
    const rawMarker = this.mission.markers().find((m) => m.id === selectedId) ?? null;
    if (!rawMarker) {
      return null;
    }
    if (activeImage && rawMarker.imageRef !== activeImage.imageRef) {
      return null;
    }
    return this.records().find((record) => record.id === selectedId) ?? null;
  });

  readonly hasSelectedRecord = computed(() => this.selectedRecord() !== null);

  readonly observationCount = computed(() => this.mission.observations().length);
  readonly hasObservation = computed(() => this.observationCount() > 0);

  /**
   * Truthful structural checklist over readonly signals.
   * Reflects current state presence only; never implies a safe or completed mission.
   */
  readonly checklist = computed(() => ({
    startAndDestination: this.hasStartAndDestination(),
    markerSelected: this.hasSelectedRecord(),
    observationPresent: this.hasObservation(),
  }));

  /**
   * Deterministic plain-text field observation template.
   * Prefills only active imageRef and valid selected record name/HTTPS source URL;
   * keeps all observation/interpretation sections as prompts without generating claims
   * or implying a source record lies at a route point.
   */
  readonly observationTemplate = computed(() => {
    const img = this.imageInfo();
    const sel = this.selectedRecord();

    const imageRefLine = img
      ? `Active imageRef: ${img.imageRef}`
      : 'Active imageRef: [No verified image loaded]';

    const sourceLine = sel
      ? `Selected contextual record: ${sel.name} (${sel.id}) — ${
          sel.safeSourceUrl ?? 'Source URL unavailable or non-HTTPS'
        } [Regional context; position: ${sel.positionStatus} — not tied to a route coordinate]`
      : 'Selected contextual record: [None selected — choose a record in Confidence & Data]';

    return [
      'Mission question:',
      this.title,
      imageRefLine,
      '',
      'What I can see in this image:',
      '[Prompt: Describe visible ridge networks, hollows, or textures on the orbital frame without assuming metric scale or slope.]',
      '',
      'What the selected source reports:',
      sourceLine,
      '[Prompt: Summarize the primary NASA observation or derivation from the selected source in your own words.]',
      '',
      'My interpretation/question:',
      '[Prompt: State your exploration question or hypothesis and how it relates to the boxwork groundwater interpretation.]',
      '',
      'What remains uncertain:',
      '[Prompt: Note unverified spatial overlap (no pixel tie-points for regional records), uncalibrated distance/DEM/slope, and rover measurements still needed.]',
    ].join('\n');
  });

  async copyObservationTemplate(): Promise<void> {
    const text = this.observationTemplate();
    const clipboard =
      typeof navigator !== 'undefined' && navigator.clipboard ? navigator.clipboard : null;

    if (!clipboard || typeof clipboard.writeText !== 'function') {
      this.copyStatus.set('error');
      this.copyMessage.set(
        'Clipboard access is unavailable in this browser context. Select and copy the read-only template text below manually, then paste it into the Notebook tab.',
      );
      return;
    }

    try {
      await clipboard.writeText(text);
      this.copyStatus.set('copied');
      this.copyMessage.set(
        'Template copied to clipboard. Open the Notebook tab and paste it into the editor to record your observation.',
      );
    } catch {
      this.copyStatus.set('error');
      this.copyMessage.set(
        'Clipboard permission was denied or failed. Select and copy the read-only template text below manually, then paste it into the Notebook tab.',
      );
    }
  }

  toSafeExternalUrl(rawUrl: string | null | undefined): string | null {
    if (!rawUrl) {
      return null;
    }
    try {
      const parsed = new URL(rawUrl.trim());
      return parsed.protocol === 'https:' ? parsed.toString() : null;
    } catch {
      return null;
    }
  }
}
