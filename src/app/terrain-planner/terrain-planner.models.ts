import type { Point } from '../core/models';
import type { TerrainAdmissionStatus, TerrainFailureCode } from '../core/terrain';
import { degreesToPercent } from '../core/terrain';

/**
 * Proposed Planning V2 Terrain Planner Control Contract (v1-proposal).
 *
 * Designed for Emma Agent 1 (`src/app/terrain-planner/`) pending Patrick's
 * `docs/planning/TERRAIN_CONTRACT_V1.md` freeze and Enzo 2's worker failure enum.
 * Aligned in vocabulary with Agent 2's evidence view without cross-branch imports.
 */
export const TERRAIN_PLANNER_CONTRACT_VERSION = 'terrain-v1' as const;

export type TerrainPlannerAdmissionStatus = TerrainAdmissionStatus;

export type TerrainGradeUnit = 'deg' | 'percent';

export interface TerrainConstraintConfig {
  readonly unit: TerrainGradeUnit;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue: number;
}

export const DEFAULT_GRADE_CONSTRAINTS: Record<TerrainGradeUnit, TerrainConstraintConfig> = {
  deg: { unit: 'deg', min: 1, max: 45, step: 0.5, defaultValue: 15 },
  // One default limit (review E1-4): the percent field shows the same 15° limit (≈ 26.8 %).
  percent: {
    unit: 'percent',
    min: 1,
    max: 100,
    step: 0.1,
    defaultValue: Math.round(degreesToPercent(15) * 10) / 10,
  },
};

export interface TerrainAvailabilityInput {
  readonly status: TerrainPlannerAdmissionStatus;
  readonly packageId: string | null;
  readonly imageRef: string | null;
  readonly terrainResolutionMeters: number | null;
  readonly offlineReady?: boolean;
  readonly statusNote?: string | null;
}

export interface TerrainEndpointsInput {
  readonly start: Point | null;
  readonly destination: Point | null;
  readonly activeImageRef: string | null;
  readonly manualRoutePointCount?: number;
}

export type TerrainPlannerFailureCode = TerrainFailureCode;

export interface TerrainEnginePreviewMetrics {
  readonly objectiveLabel: string | null;
  readonly sampledDistanceMeters: number | null;
  readonly maxSampledSegmentGrade: number | null;
  readonly gradeUnit: TerrainGradeUnit;
  readonly terrainResolutionMeters: number | null;
  readonly waypointCount?: number | null;
  readonly missingInformation: readonly string[];
  readonly caveatNote?: string | null;
}

export type TerrainPreviewLifecycleStatus =
  'idle' | 'running' | 'preview-ready' | 'no-route' | 'cancelled' | 'error';

export interface TerrainPreviewState {
  readonly status: TerrainPreviewLifecycleStatus;
  readonly requestId: string | null;
  readonly resultForImageRef?: string | null;
  readonly resultForPackageId?: string | null;
  readonly resultForEndpoints?: { readonly start: Point; readonly destination: Point } | null;
  readonly resultForMaxGrade?: number | null;
  readonly resultForGradeUnit?: TerrainGradeUnit | null;
  readonly engineResult?: TerrainEnginePreviewMetrics | null;
  readonly reasonCode?: TerrainPlannerFailureCode | null;
  readonly engineMessage?: string | null;
  readonly isProvisionalCode?: boolean;
}

export interface TerrainRouteRequestPayload {
  readonly requestId: string;
  readonly imageRef: string;
  readonly packageId: string;
  readonly start: Point;
  readonly destination: Point;
  readonly maxSegmentGrade: number;
  readonly gradeUnit: TerrainGradeUnit;
  /** Contract §5 canonical limit sent to the engine (converted from percent when needed). */
  readonly maxSegmentGradeDeg: number;
}

export interface TerrainPreviewActionPayload {
  readonly requestId: string | null;
}

export interface TerrainPreviewAcceptPayload {
  readonly requestId: string;
  readonly imageRef: string;
  readonly packageId: string;
}
