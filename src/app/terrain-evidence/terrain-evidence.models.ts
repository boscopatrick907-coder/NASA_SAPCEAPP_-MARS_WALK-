/**
 * Proposed Planning V2 Terrain Evidence & Provenance contract (v1-proposal).
 *
 * All interfaces here are read-only proposals for Patrick's contract freeze
 * (`docs/planning/TERRAIN_CONTRACT_V1.md`). Final runtime wiring must consume
 * coordinator-approved admission decisions and Enzo 2's agreed failure codes.
 */
import type { TerrainAdmissionStatus as CoreAdmission, TerrainFailureCode } from '../core/terrain';

export const TERRAIN_EVIDENCE_CONTRACT_VERSION = 'terrain-v1' as const;

export type TerrainAdmissionStatus = CoreAdmission;

export interface TerrainAdmissionDecision {
  readonly status: TerrainAdmissionStatus;
  readonly reviewer: string | null;
  readonly decidedAtUtc: string | null;
  readonly evidenceRef: string | null;
  readonly rejectionReason?: string | null;
  readonly notes?: string | null;
}

export interface TerrainSourceMetadata {
  readonly title: string | null;
  readonly url: string | null;
  readonly credit: string | null;
  readonly producer?: string | null;
  readonly licenseOrTerms?: string | null;
}

export interface TerrainAcquisitionMetadata {
  readonly sourceStereoImageIds?: readonly string[];
  readonly acquisitionDates?: readonly string[];
  readonly processingHistory?: string | null;
}

export interface TerrainHorizontalMetadata {
  readonly crs?: string | null;
  readonly units?: string | null;
  readonly nativeSpacingMeters?: number | null;
  readonly preparedSpacingMeters?: number | null;
  readonly resamplingMethod?: string | null;
}

export interface TerrainVerticalMetadata {
  readonly units?: string | null;
  readonly datumOrReference?: string | null;
  readonly accuracyNote?: string | null;
}

export interface TerrainCoverageMetadata {
  readonly summary?: string | null;
  readonly overlapWithActiveImage?: 'full' | 'partial' | 'none' | 'unverified' | null;
  readonly boundsSummary?: string | null;
}

export interface TerrainRegistrationMetadata {
  readonly status?: 'verified' | 'provisional' | 'failed' | 'unverified' | null;
  readonly method?: string | null;
  readonly residualSummary?: string | null;
  readonly toleranceSummary?: string | null;
  readonly evidenceRef?: string | null;
}

export interface TerrainNodataMetadata {
  readonly nodataValue?: string | null;
  readonly missingPercent?: number | null;
  readonly policy?: string | null;
}

export interface TerrainUncertaintyMetadata {
  readonly summary?: string | null;
  readonly verticalUncertaintyMeters?: number | null;
  readonly horizontalUncertaintyMeters?: number | null;
  readonly limitations?: readonly string[];
}

export interface TerrainIntegrityMetadata {
  readonly sourceSha256?: string | null;
  readonly preparedSha256?: string | null;
  readonly byteLength?: number | null;
  readonly offlinePackStatus?:
    'not-cached' | 'partial' | 'verified' | 'corrupt' | 'unavailable' | null;
  readonly claimedVerified?: boolean;
}

export interface TerrainProductMetadata {
  readonly packageId: string | null;
  readonly productId: string | null;
  readonly productVersion?: string | null;
  readonly imageRef: string | null;
  readonly source: TerrainSourceMetadata | null;
  readonly acquisition?: TerrainAcquisitionMetadata | null;
  readonly horizontal?: TerrainHorizontalMetadata | null;
  readonly vertical?: TerrainVerticalMetadata | null;
  readonly coverage?: TerrainCoverageMetadata | null;
  readonly registration?: TerrainRegistrationMetadata | null;
  readonly nodata?: TerrainNodataMetadata | null;
  readonly uncertainty?: TerrainUncertaintyMetadata | null;
  readonly integrity?: TerrainIntegrityMetadata | null;
}

export interface TerrainEvidenceState {
  readonly contractVersion?: string;
  readonly admission: TerrainAdmissionDecision | null;
  readonly metadata: TerrainProductMetadata | null;
}

/** Provisional failure codes pending Enzo 2's terrain-routing worker contract. */
export type TerrainRoutingFailureCode = TerrainFailureCode;

export interface TerrainRoutingOutcome {
  readonly status: 'idle' | 'available' | 'unavailable';
  readonly reasonCode?: TerrainRoutingFailureCode | null;
  readonly engineMessage?: string | null;
  readonly isProvisionalCode?: boolean;
}

export type TerrainContextKind =
  'orbital-imagery' | 'rover-science' | 'regional-geology' | 'historical-rems' | 'illustrative-3d';

export interface TerrainContextSource {
  readonly kind: TerrainContextKind;
  readonly title: string;
  readonly credit: string;
  readonly url?: string | null;
  readonly boundaryNote: string;
  readonly limitations?: readonly string[];
}
