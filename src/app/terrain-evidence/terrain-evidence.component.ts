import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type {
  TerrainContextSource,
  TerrainEvidenceState,
  TerrainRoutingOutcome,
} from './terrain-evidence.models';
import {
  cleanLimitations,
  displayBytes,
  displayList,
  displayPercent,
  displaySpacing,
  displayText,
  displayUncertaintyMeters,
  explainRoutingFailure,
  formatContextSources,
  resolveEffectiveAdmission,
  sanitizeHttpsUrl,
} from './terrain-evidence.presenters';

/**
 * Standalone, read-only Terrain Evidence & Provenance view (Emma Agent 2).
 * Summarizes coordinator admission state, expandable DEM/registration/uncertainty
 * metadata, routing failure causes, and separation from non-terrain context sources.
 */
@Component({
  selector: 'app-terrain-evidence',
  standalone: true,
  imports: [],
  templateUrl: './terrain-evidence.component.html',
  styleUrl: './terrain-evidence.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerrainEvidenceComponent {
  readonly evidence = input<TerrainEvidenceState | null>(null);
  readonly routingOutcome = input<TerrainRoutingOutcome | null>(null);
  readonly activeImageRef = input<string | null>(null);
  readonly contextSources = input<readonly TerrainContextSource[]>([]);

  readonly admissionView = computed(() =>
    resolveEffectiveAdmission(this.evidence(), this.activeImageRef()),
  );

  readonly routingFailure = computed(() => explainRoutingFailure(this.routingOutcome()));

  readonly contextSourceViews = computed(() => formatContextSources(this.contextSources()));

  readonly productMeta = computed(() => {
    const meta = this.evidence()?.metadata ?? null;
    const adm = this.evidence()?.admission ?? null;
    const src = meta?.source ?? null;
    const acq = meta?.acquisition ?? null;
    const integ = meta?.integrity ?? null;
    const rawUrl = src?.url ?? null;

    return {
      packageId: displayText(meta?.packageId),
      productId: displayText(meta?.productId),
      productVersion: displayText(meta?.productVersion),
      targetImageRef: displayText(meta?.imageRef),
      sourceTitle: displayText(src?.title),
      safeSourceUrl: sanitizeHttpsUrl(rawUrl),
      rawSourceUrl: rawUrl?.trim() ? rawUrl.trim() : null,
      sourceCredit: displayText(src?.credit),
      producer: displayText(src?.producer),
      licenseOrTerms: displayText(src?.licenseOrTerms),
      stereoIds: displayList(acq?.sourceStereoImageIds),
      acquisitionDates: displayList(acq?.acquisitionDates),
      processingHistory: displayText(acq?.processingHistory),
      reviewer: displayText(adm?.reviewer),
      decidedAtUtc: displayText(adm?.decidedAtUtc),
      admissionEvidenceRef: displayText(adm?.evidenceRef),
      sourceSha256: displayText(integ?.sourceSha256),
      preparedSha256: displayText(integ?.preparedSha256),
      byteLength: displayBytes(integ?.byteLength),
      offlinePackStatus: displayText(integ?.offlinePackStatus),
    };
  });

  readonly spatialMeta = computed(() => {
    const meta = this.evidence()?.metadata ?? null;
    const h = meta?.horizontal ?? null;
    const v = meta?.vertical ?? null;
    const cov = meta?.coverage ?? null;
    const reg = meta?.registration ?? null;
    const nd = meta?.nodata ?? null;
    const unc = meta?.uncertainty ?? null;

    return {
      crs: displayText(h?.crs),
      horizontalUnits: displayText(h?.units),
      nativeSpacing: displaySpacing(h?.nativeSpacingMeters),
      preparedSpacing: displaySpacing(h?.preparedSpacingMeters),
      resamplingMethod: displayText(h?.resamplingMethod),
      verticalUnits: displayText(v?.units),
      verticalDatum: displayText(v?.datumOrReference),
      verticalAccuracyNote: displayText(v?.accuracyNote),
      coverageSummary: displayText(cov?.summary),
      overlapStatus: displayText(cov?.overlapWithActiveImage),
      boundsSummary: displayText(cov?.boundsSummary),
      registrationStatus: displayText(reg?.status),
      registrationMethod: displayText(reg?.method),
      registrationResiduals: displayText(reg?.residualSummary),
      registrationTolerance: displayText(reg?.toleranceSummary),
      registrationEvidenceRef: displayText(reg?.evidenceRef),
      nodataValue: displayText(nd?.nodataValue),
      missingPercent: displayPercent(nd?.missingPercent),
      nodataPolicy: displayText(nd?.policy),
      uncertaintySummary: displayText(unc?.summary),
      verticalUncertainty: displayUncertaintyMeters(unc?.verticalUncertaintyMeters),
      horizontalUncertainty: displayUncertaintyMeters(unc?.horizontalUncertaintyMeters),
      limitations: cleanLimitations(unc?.limitations),
    };
  });
}
