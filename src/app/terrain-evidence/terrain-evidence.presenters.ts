import { https } from '../core/validation';
import type {
  TerrainAdmissionStatus,
  TerrainContextKind,
  TerrainContextSource,
  TerrainEvidenceState,
  TerrainRoutingFailureCode,
  TerrainRoutingOutcome,
} from './terrain-evidence.models';

export const UNAVAILABLE_TEXT = 'Unavailable (not supplied)';

export type EvidenceTone = 'neutral' | 'caution' | 'error' | 'accepted';

export interface ResolvedAdmissionView {
  readonly effectiveStatus: TerrainAdmissionStatus;
  readonly badgeLabel: string;
  readonly tone: EvidenceTone;
  readonly summaryText: string;
  readonly boundaryNote: string;
  readonly detailNotice: string | null;
  readonly isAlignedToActiveImage: boolean;
  readonly hasUnverifiedClientClaim: boolean;
  readonly isAlert: boolean;
}

export interface ResolvedRoutingFailureView {
  readonly reasonCode: TerrainRoutingFailureCode;
  readonly headline: string;
  readonly explanation: string;
  readonly engineMessage: string | null;
  readonly impassabilityDisclaimer: string;
  readonly provisionalNote: string | null;
}

export interface SafeContextSourceView {
  readonly kindLabel: string;
  readonly title: string;
  readonly credit: string;
  readonly safeUrl: string | null;
  readonly rawUrl: string | null;
  readonly boundaryNote: string;
  readonly limitations: readonly string[];
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Validates external links strictly as credential-free HTTPS URLs. */
export function sanitizeHttpsUrl(url: unknown): string | null {
  return https(url) ? url.trim() : null;
}

export function displayText(value: unknown): string {
  return cleanText(value) ?? UNAVAILABLE_TEXT;
}

export function displaySpacing(meters: unknown): string {
  if (typeof meters !== 'number' || !Number.isFinite(meters) || meters <= 0) {
    return UNAVAILABLE_TEXT;
  }
  return `${meters} m/pixel`;
}

export function displayUncertaintyMeters(meters: unknown): string {
  if (typeof meters !== 'number' || !Number.isFinite(meters) || meters < 0) {
    return UNAVAILABLE_TEXT;
  }
  return `±${meters} m`;
}

export function displayPercent(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    return UNAVAILABLE_TEXT;
  }
  return `${value}%`;
}

export function displayBytes(bytes: unknown): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return UNAVAILABLE_TEXT;
  }
  if (bytes >= 1_048_576) {
    return `${bytes.toLocaleString('en-US')} bytes (${(bytes / 1_048_576).toFixed(2)} MiB)`;
  }
  if (bytes >= 1024) {
    return `${bytes.toLocaleString('en-US')} bytes (${(bytes / 1024).toFixed(1)} KiB)`;
  }
  return `${bytes.toLocaleString('en-US')} bytes`;
}

export function displayList(values: readonly string[] | null | undefined): string {
  if (!Array.isArray(values)) return UNAVAILABLE_TEXT;
  const items = values
    .map((item: unknown) => cleanText(item))
    .filter((item): item is string => item !== null);
  return items.length > 0 ? items.join(', ') : UNAVAILABLE_TEXT;
}

export function cleanLimitations(values: readonly string[] | null | undefined): readonly string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((item: unknown) => cleanText(item))
    .filter((item): item is string => item !== null);
}

/**
 * Resolves effective terrain admission state from coordinator review records.
 * Populated hashes, metadata forms, or client-side `claimedVerified` flags
 * can never promote an unreviewed/incomplete candidate to accepted.
 */
export function resolveEffectiveAdmission(
  state: TerrainEvidenceState | null | undefined,
  activeImageRef: string | null | undefined,
): ResolvedAdmissionView {
  const metadata = state?.metadata ?? null;
  const admission = state?.admission ?? null;
  const integrity = metadata?.integrity ?? null;

  const hasHashes = !!(cleanText(integrity?.sourceSha256) || cleanText(integrity?.preparedSha256));
  const hasMetadataFields = !!(
    cleanText(metadata?.productId) ||
    cleanText(metadata?.packageId) ||
    metadata?.source?.title
  );
  const rawStatus: TerrainAdmissionStatus = admission?.status ?? 'none';

  const activeRef = cleanText(activeImageRef);
  const packageRef = cleanText(metadata?.imageRef);
  const isMismatch = !!(activeRef && packageRef && activeRef !== packageRef);
  const isAlignedToActiveImage = !isMismatch && (rawStatus === 'accepted' ? !!packageRef : true);

  const clientClaimedUnreviewed =
    rawStatus !== 'accepted' && !!(integrity?.claimedVerified || hasHashes);

  const baseBoundaryNote =
    'Experimental DEM review only — never establishes EVA route safety, obstacle clearance, live weather, or life-support endurance.';

  if (!state || !admission || rawStatus === 'none') {
    const antiSpoofNotice =
      integrity?.claimedVerified || hasHashes || hasMetadataFields
        ? 'Supplied hashes, pack fields, or client-verified flags do not grant scientific acceptance without coordinator review.'
        : null;
    return {
      effectiveStatus: 'none',
      badgeLabel: 'No terrain package',
      tone: 'neutral',
      summaryText:
        'No measured elevation model (DEM) has been accepted for this workspace. 2D exploration continues in visual-review mode without elevation or slope data.',
      boundaryNote: baseBoundaryNote,
      detailNotice: antiSpoofNotice,
      isAlignedToActiveImage: false,
      hasUnverifiedClientClaim: !!(integrity?.claimedVerified || hasHashes),
      isAlert: false,
    };
  }

  if (rawStatus === 'rejected') {
    const reason = cleanText(admission.rejectionReason);
    return {
      effectiveStatus: 'rejected',
      badgeLabel: 'Rejected package (not usable)',
      tone: 'error',
      summaryText: reason
        ? `Coordinator rejected this terrain package: ${reason}`
        : 'Coordinator rejected this terrain package during scientific or alignment review. It cannot be used for route preview.',
      boundaryNote: baseBoundaryNote,
      detailNotice: cleanText(admission.notes),
      isAlignedToActiveImage: false,
      hasUnverifiedClientClaim: false,
      isAlert: true,
    };
  }

  if (rawStatus === 'proposed' || rawStatus === 'pending-review') {
    const isProposed = rawStatus === 'proposed';
    return {
      effectiveStatus: rawStatus,
      badgeLabel: isProposed ? 'Proposed candidate (unreviewed)' : 'Pending coordinator review',
      tone: 'caution',
      summaryText: isProposed
        ? 'This terrain dataset is a proposed candidate awaiting source inspection, alignment verification, and coordinator admission.'
        : 'This terrain package is currently pending independent coordinator review and alignment checks.',
      boundaryNote: baseBoundaryNote,
      detailNotice: clientClaimedUnreviewed
        ? 'A SHA-256 hash or populated metadata form confirms file identity or form completion only — it does not prove scientific acceptance.'
        : isMismatch
          ? `Target mismatch: candidate metadata references "${packageRef}", not active image "${activeRef}".`
          : cleanText(admission.notes),
      isAlignedToActiveImage: false,
      hasUnverifiedClientClaim: clientClaimedUnreviewed,
      isAlert: isMismatch,
    };
  }

  // Raw status is 'accepted': verify all three coordinator audit fields before trusting.
  const reviewer = cleanText(admission.reviewer);
  const decidedAtUtc = cleanText(admission.decidedAtUtc);
  const evidenceRef = cleanText(admission.evidenceRef);

  if (!reviewer || !decidedAtUtc || !evidenceRef) {
    return {
      effectiveStatus: 'pending-review',
      badgeLabel: 'Pending review (incomplete admission record)',
      tone: 'caution',
      summaryText:
        'Admission record is marked accepted but lacks required coordinator reviewer, UTC timestamp, or acceptance evidence reference. Treated as unaccepted pending audit.',
      boundaryNote: baseBoundaryNote,
      detailNotice:
        'All three coordinator sign-off fields (reviewer, UTC timestamp, and evidence reference) are required before DEM terrain can be treated as accepted.',
      isAlignedToActiveImage: false,
      hasUnverifiedClientClaim: true,
      isAlert: true,
    };
  }

  if (isMismatch) {
    return {
      effectiveStatus: 'accepted',
      badgeLabel: 'Image mismatch (unaligned)',
      tone: 'caution',
      summaryText: `Accepted DEM package targets "${packageRef}", which does not match the active image "${activeRef}". Do not project routes onto this grid.`,
      boundaryNote: baseBoundaryNote,
      detailNotice: `Coordinator admission (${reviewer}, ${decidedAtUtc}) applies to ${packageRef} only.`,
      isAlignedToActiveImage: false,
      hasUnverifiedClientClaim: false,
      isAlert: true,
    };
  }

  return {
    effectiveStatus: 'accepted',
    badgeLabel: 'Accepted terrain package',
    tone: 'accepted',
    summaryText:
      'Independently reviewed DEM accepted for experimental path preview only — not a route safety, obstacle-clearance, or EVA trafficability certification.',
    boundaryNote: baseBoundaryNote,
    detailNotice: cleanText(admission.notes),
    isAlignedToActiveImage: true,
    hasUnverifiedClientClaim: false,
    isAlert: false,
  };
}

const FAILURE_COPY: Record<
  TerrainRoutingFailureCode,
  { headline: string; explanation: string; impassabilityDisclaimer: string }
> = {
  'no-terrain-package': {
    headline: 'Terrain routing unavailable: no terrain package loaded',
    explanation:
      'No elevation grid is present in the workspace. Elevation-based path preview requires a coordinator-accepted DEM package.',
    impassabilityDisclaimer:
      'Absence of a terrain package means elevation data is missing — not that Martian terrain is impassable.',
  },
  'terrain-not-accepted': {
    headline: 'Terrain routing disabled: package not accepted',
    explanation:
      'Candidate, unreviewed, or rejected terrain packages cannot drive route previews until coordinator admission passes.',
    impassabilityDisclaimer:
      'Unaccepted data reflects an incomplete review gate, not physical terrain impassability.',
  },
  'image-ref-mismatch': {
    headline: 'Terrain routing blocked: active image mismatch',
    explanation:
      'The terrain package imageRef does not match the active orbital image, so pixel endpoints cannot map reliably onto the elevation grid.',
    impassabilityDisclaimer:
      'Coordinate mismatch is a dataset alignment block — it does not prove Martian terrain is impassable.',
  },
  'offline-pack-incomplete': {
    headline: 'Terrain routing unavailable offline: incomplete cached pack',
    explanation:
      'Required terrain assets have not finished hash-verified caching or failed integrity verification for offline use.',
    impassabilityDisclaimer:
      'An incomplete or unverified cache prevents grid loading offline — it does not imply terrain is impassable.',
  },
  'invalid-endpoints': {
    headline: 'Route preview unavailable: incomplete or invalid endpoints',
    explanation:
      'Start and destination coordinates must both be valid finite points within the active workspace bounds before running a preview.',
    impassabilityDisclaimer:
      'Endpoint validation failure indicates missing or out-of-range inputs, not an impassable surface.',
  },
  'endpoint-outside-coverage': {
    headline: 'Route preview unavailable: endpoint outside DEM coverage',
    explanation:
      'One or more chosen route points fall outside the spatial footprint covered by the prepared elevation grid.',
    impassabilityDisclaimer:
      'Falling outside DEM bounds means elevation measurements are absent there, not that the ground is impassable.',
  },
  'endpoint-on-nodata': {
    headline: 'Route preview unavailable: endpoint on missing nodata cell',
    explanation:
      'The selected point lands on a masked nodata pixel where valid DEM elevation measurements are missing.',
    impassabilityDisclaimer:
      'A nodata gap indicates an unmeasured cell in the source or stereo DEM, not an impassable cliff or obstacle.',
  },
  'grade-limit-exceeded': {
    headline: 'No preview path within configured grade threshold',
    explanation:
      'No continuous path satisfied the experimental maximum grid-cell grade limit under the current model parameters.',
    impassabilityDisclaimer:
      'Exceeding an experimental raster grade threshold depends on grid spacing and chosen settings; it does not certify or rule out real-world rover/EVA passability.',
  },
  'no-path-within-constraints': {
    headline: 'No path found under current constraints',
    explanation:
      'The experimental solver could not connect start and destination across valid non-nodata cells within the active limits.',
    impassabilityDisclaimer:
      'Solver non-convergence or constraint rejection does not prove actual Martian terrain is physically impassable.',
  },
  cancelled: {
    headline: 'Terrain route preview cancelled',
    explanation:
      'The terrain preview request was cancelled before completion. Your existing manual route and notebook drafts remain intact.',
    impassabilityDisclaimer:
      'Cancellation interrupted calculation before completion and says nothing about terrain traversability.',
  },
  'stale-response': {
    headline: 'Outdated route preview discarded',
    explanation:
      'A slower terrain response belonged to superseded endpoints or settings and was safely ignored to protect your current workspace.',
    impassabilityDisclaimer:
      'Discarding a stale computation prevents UI mismatch and does not indicate impassable ground.',
  },
  'worker-error': {
    headline: 'Terrain routing worker error',
    explanation:
      'The experimental terrain calculation worker encountered a runtime failure before producing a result. Manual routes and drafts remain preserved.',
    impassabilityDisclaimer:
      'A software/worker error means no elevation route could be computed; it never indicates impassable terrain.',
  },
  unknown: {
    headline: 'Terrain route preview unavailable',
    explanation:
      'Terrain path computation did not produce a preview result for an unspecified reason.',
    impassabilityDisclaimer:
      'An unavailable preview result does not prove the Martian terrain is physically impassable.',
  },
};

export function explainRoutingFailure(
  outcome: TerrainRoutingOutcome | null | undefined,
): ResolvedRoutingFailureView | null {
  if (!outcome || outcome.status !== 'unavailable') return null;
  const rawCode = outcome.reasonCode;
  const code: TerrainRoutingFailureCode =
    rawCode && Object.prototype.hasOwnProperty.call(FAILURE_COPY, rawCode) ? rawCode : 'unknown';
  const entry = FAILURE_COPY[code];
  return {
    reasonCode: code,
    headline: entry.headline,
    explanation: entry.explanation,
    engineMessage: cleanText(outcome.engineMessage),
    impassabilityDisclaimer: entry.impassabilityDisclaimer,
    provisionalNote: outcome.isProvisionalCode
      ? 'Provisional reason code pending Enzo 2 worker contract freeze.'
      : null,
  };
}

const CONTEXT_KIND_LABELS: Record<TerrainContextKind, string> = {
  'orbital-imagery': 'Orbital imagery',
  'rover-science': 'Curiosity science context',
  'regional-geology': 'Regional geology (1:20M)',
  'historical-rems': 'Historical REMS weather',
  'illustrative-3d': 'Illustrative 3D model',
};

export function formatContextSources(
  sources: readonly TerrainContextSource[] | null | undefined,
): readonly SafeContextSourceView[] {
  if (!sources || !Array.isArray(sources)) return [];
  return (sources as readonly TerrainContextSource[]).map((src) => {
    const rawUrl = cleanText(src.url);
    return {
      kindLabel: CONTEXT_KIND_LABELS[src.kind] ?? 'Contextual source',
      title: displayText(src.title),
      credit: displayText(src.credit),
      safeUrl: sanitizeHttpsUrl(rawUrl),
      rawUrl,
      boundaryNote: displayText(src.boundaryNote),
      limitations: cleanLimitations(src.limitations),
    };
  });
}
