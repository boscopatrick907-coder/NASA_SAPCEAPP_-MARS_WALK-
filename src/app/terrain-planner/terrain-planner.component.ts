import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  TerrainAvailabilityInput,
  TerrainConstraintConfig,
  TerrainEndpointsInput,
  TerrainGradeUnit,
  TerrainPreviewAcceptPayload,
  TerrainPreviewActionPayload,
  TerrainPreviewState,
  TerrainRouteRequestPayload,
} from './terrain-planner.models';
import {
  cleanStringList,
  ENGINE_UNAVAILABLE_TEXT,
  evaluateEndpoints,
  evaluatePreviewStaleness,
  evaluateTerrainGate,
  explainPreviewOutcome,
  formatEngineGrade,
  formatEngineMeters,
  formatEngineText,
  formatResolution,
  resolveConstraintConfig,
  unitName,
  unitSymbol,
  validateGradeConstraint,
} from './terrain-planner.helpers';
import { percentToDegrees } from '../core/terrain';

/**
 * Standalone experimental terrain path planner controls (Emma Agent 1).
 * Consumes coordinator/engine signals via inputs and delegates actions via outputs
 * without modifying RoutePlanner, Map, Notebook drafts, or localStorage directly.
 */
@Component({
  selector: 'app-terrain-planner',
  standalone: true,
  imports: [],
  templateUrl: './terrain-planner.component.html',
  styleUrl: './terrain-planner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerrainPlannerComponent {
  readonly terrain = input<TerrainAvailabilityInput | null>(null);
  readonly endpoints = input<TerrainEndpointsInput | null>(null);
  readonly preview = input<TerrainPreviewState | null>(null);
  readonly gradeUnit = input<TerrainGradeUnit>('deg');
  readonly constraintConfig = input<Partial<TerrainConstraintConfig> | null>(null);

  readonly requestPreview = output<TerrainRouteRequestPayload>();
  readonly cancelPreview = output<TerrainPreviewActionPayload>();
  readonly acceptPreview = output<TerrainPreviewAcceptPayload>();
  readonly rejectPreview = output<TerrainPreviewActionPayload>();

  private readonly gradeDraft = signal<{ unit: TerrainGradeUnit; raw: string } | null>(null);
  readonly lastRequestId = signal<string | null>(null);
  readonly actionFeedback = signal<string | null>(null);

  readonly config = computed(() =>
    resolveConstraintConfig(this.gradeUnit(), this.constraintConfig()),
  );
  readonly unitSym = computed(() => unitSymbol(this.gradeUnit()));
  readonly unitLabel = computed(() => unitName(this.gradeUnit()));

  readonly gradeRawValue = computed(() => {
    const draft = this.gradeDraft();
    const unit = this.gradeUnit();
    if (draft && draft.unit === unit) return draft.raw;
    return String(this.config().defaultValue);
  });

  readonly gradeValidation = computed(() =>
    validateGradeConstraint(this.gradeRawValue(), this.config()),
  );

  readonly endpointStatus = computed(() => evaluateEndpoints(this.endpoints()));

  readonly terrainGate = computed(() =>
    evaluateTerrainGate(this.terrain(), this.endpoints()?.activeImageRef),
  );

  readonly isRunning = computed(() => this.preview()?.status === 'running');

  readonly staleness = computed(() =>
    evaluatePreviewStaleness(
      this.preview(),
      this.lastRequestId(),
      this.terrain(),
      this.endpoints(),
      this.gradeValidation().value,
      this.gradeUnit(),
    ),
  );

  readonly canRequest = computed(
    () =>
      this.terrainGate().canRequest &&
      this.endpointStatus().ready &&
      this.gradeValidation().valid &&
      !this.isRunning(),
  );

  readonly canAccept = computed(() => {
    const p = this.preview();
    return (
      !!p &&
      p.status === 'preview-ready' &&
      !this.staleness().isStale &&
      this.terrainGate().canRequest &&
      !!p.requestId?.trim()
    );
  });

  readonly previewMetrics = computed(() => {
    const p = this.preview();
    if (!p || p.status !== 'preview-ready') return null;
    const m = p.engineResult;
    const unit = m?.gradeUnit ?? this.gradeUnit();
    const resFromEngine = m?.terrainResolutionMeters ?? this.terrain()?.terrainResolutionMeters;
    const waypointCount =
      typeof m?.waypointCount === 'number' && Number.isFinite(m.waypointCount)
        ? String(m.waypointCount)
        : ENGINE_UNAVAILABLE_TEXT;
    return {
      objectiveLabel: formatEngineText(m?.objectiveLabel),
      sampledDistance: formatEngineMeters(m?.sampledDistanceMeters),
      maxSampledGrade: formatEngineGrade(m?.maxSampledSegmentGrade, unit),
      terrainResolution: formatResolution(resFromEngine),
      waypointCount,
      missingInformation: cleanStringList(m?.missingInformation),
      caveatNote: m?.caveatNote?.trim() ? m.caveatNote.trim() : null,
    };
  });

  readonly outcomeView = computed(() => explainPreviewOutcome(this.preview()));

  onGradeInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.gradeDraft.set({ unit: this.gradeUnit(), raw: value });
  }

  resetConstraint(): void {
    this.gradeDraft.set(null);
    this.actionFeedback.set('Reset grade limit to the default experimental threshold.');
  }

  onRequestPreview(): void {
    if (!this.canRequest()) return;
    const t = this.terrain();
    const ep = this.endpoints();
    const grade = this.gradeValidation().value;
    if (!t?.packageId || !t.imageRef || !ep?.start || !ep.destination || grade === null) return;

    // UUID per contract §6; the coordinator passes this same id to the worker (review E1-2).
    const requestId = crypto.randomUUID();
    this.lastRequestId.set(requestId);
    this.requestPreview.emit({
      requestId,
      imageRef: t.imageRef,
      packageId: t.packageId,
      start: ep.start,
      destination: ep.destination,
      maxSegmentGrade: grade,
      gradeUnit: this.gradeUnit(),
      maxSegmentGradeDeg: this.gradeUnit() === 'percent' ? percentToDegrees(grade) : grade,
    });
    this.actionFeedback.set(
      `Requested preview (${requestId}). Existing manual routes and Notebook drafts stay untouched.`,
    );
  }

  onCancelPreview(): void {
    if (!this.isRunning()) return;
    const reqId = this.preview()?.requestId ?? this.lastRequestId();
    this.cancelPreview.emit({ requestId: reqId });
    this.actionFeedback.set(
      'Cancellation requested. Manual routes and Notebook drafts are preserved.',
    );
  }

  onAcceptPreview(): void {
    if (!this.canAccept()) return;
    const p = this.preview();
    const t = this.terrain();
    if (!p?.requestId || !t?.packageId || !t.imageRef) return;
    this.acceptPreview.emit({
      requestId: p.requestId,
      imageRef: t.imageRef,
      packageId: t.packageId,
    });
    this.actionFeedback.set(
      'Preview acceptance sent to coordinator adapter. No automatic save ran — use Save Route to store changes.',
    );
  }

  onRejectPreview(): void {
    const p = this.preview();
    if (!p || p.status !== 'preview-ready') return;
    this.rejectPreview.emit({ requestId: p.requestId });
    this.actionFeedback.set(
      'Preview suggestion rejected. Existing manual routes and Notebook drafts remain untouched.',
    );
  }
}
