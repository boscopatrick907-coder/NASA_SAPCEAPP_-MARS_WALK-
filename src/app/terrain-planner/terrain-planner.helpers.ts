import type { Point } from '../core/models';
import {
  DEFAULT_GRADE_CONSTRAINTS,
  type TerrainAvailabilityInput,
  type TerrainConstraintConfig,
  type TerrainEndpointsInput,
  type TerrainGradeUnit,
  type TerrainPlannerFailureCode,
  type TerrainPreviewState,
} from './terrain-planner.models';

export const ENGINE_UNAVAILABLE_TEXT = 'Unavailable (not supplied by engine)';

export type GateTone = 'neutral' | 'caution' | 'error' | 'accepted';

export interface GradeValidationResult {
  readonly valid: boolean;
  readonly value: number | null;
  readonly error: string | null;
}

export interface EndpointStatusView {
  readonly ready: boolean;
  readonly startLabel: string;
  readonly destinationLabel: string;
  readonly statusLabel: string;
  readonly error: string | null;
}

export interface TerrainGateView {
  readonly canRequest: boolean;
  readonly badgeLabel: string;
  readonly tone: GateTone;
  readonly message: string;
}

export interface PreviewStalenessView {
  readonly isStale: boolean;
  readonly reasons: readonly string[];
}

export interface OutcomeExplanationView {
  readonly kind: 'no-route' | 'cancelled' | 'error';
  readonly reasonCode: TerrainPlannerFailureCode;
  readonly headline: string;
  readonly explanation: string;
  readonly engineMessage: string | null;
  readonly nonImpassableNote: string;
  readonly preservationNote: string;
  readonly provisionalNote: string | null;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isFinitePoint(p: Point | null | undefined): p is Point {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
}

function samePoint(a: Point | null | undefined, b: Point | null | undefined): boolean {
  return isFinitePoint(a) && isFinitePoint(b) && a.x === b.x && a.y === b.y;
}

function formatPoint(p: Point | null | undefined): string {
  if (!isFinitePoint(p)) return 'Not set';
  return `(${Math.round(p.x)}, ${Math.round(p.y)}) px`;
}

export function unitSymbol(unit: TerrainGradeUnit): string {
  return unit === 'percent' ? '%' : '°';
}

export function unitName(unit: TerrainGradeUnit): string {
  return unit === 'percent' ? 'percent grade' : 'degrees';
}

export function resolveConstraintConfig(
  unit: TerrainGradeUnit,
  custom?: Partial<TerrainConstraintConfig> | null,
): TerrainConstraintConfig {
  const base = DEFAULT_GRADE_CONSTRAINTS[unit] ?? DEFAULT_GRADE_CONSTRAINTS.deg;
  if (!custom) return base;
  const min =
    typeof custom.min === 'number' && Number.isFinite(custom.min) && custom.min > 0
      ? custom.min
      : base.min;
  const max =
    typeof custom.max === 'number' && Number.isFinite(custom.max) && custom.max >= min
      ? custom.max
      : Math.max(base.max, min);
  const step =
    typeof custom.step === 'number' && Number.isFinite(custom.step) && custom.step > 0
      ? custom.step
      : base.step;
  const def =
    typeof custom.defaultValue === 'number' &&
    Number.isFinite(custom.defaultValue) &&
    custom.defaultValue >= min &&
    custom.defaultValue <= max
      ? custom.defaultValue
      : Math.min(Math.max(base.defaultValue, min), max);
  return { unit, min, max, step, defaultValue: def };
}

export function validateGradeConstraint(
  raw: string | null | undefined,
  config: TerrainConstraintConfig,
): GradeValidationResult {
  const sym = unitSymbol(config.unit);
  const cleaned = cleanText(raw);
  if (cleaned === null) {
    return {
      valid: false,
      value: null,
      error: `Enter an experimental maximum segment grade between ${config.min}${sym} and ${config.max}${sym}.`,
    };
  }
  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    return {
      valid: false,
      value: null,
      error: `Grade constraint must be a valid number in ${unitName(config.unit)} (${sym}).`,
    };
  }
  if (num < config.min || num > config.max) {
    return {
      valid: false,
      value: null,
      error: `Value must stay between ${config.min}${sym} and ${config.max}${sym}.`,
    };
  }
  return { valid: true, value: num, error: null };
}

export function evaluateEndpoints(endpoints: TerrainEndpointsInput | null | undefined): EndpointStatusView {
  const start = endpoints?.start ?? null;
  const dest = endpoints?.destination ?? null;
  const hasStart = isFinitePoint(start);
  const hasDest = isFinitePoint(dest);

  if (!hasStart && !hasDest) {
    return {
      ready: false,
      startLabel: 'Not set',
      destinationLabel: 'Not set',
      statusLabel: 'Endpoints incomplete',
      error: 'Choose Start and Destination points on the map before requesting a preview.',
    };
  }
  if (!hasStart) {
    return {
      ready: false,
      startLabel: 'Not set',
      destinationLabel: formatPoint(dest),
      statusLabel: 'Start missing',
      error: 'Set a Start point on the active orbital image.',
    };
  }
  if (!hasDest) {
    return {
      ready: false,
      startLabel: formatPoint(start),
      destinationLabel: 'Not set',
      statusLabel: 'Destination missing',
      error: 'Set a Destination point on the active orbital image.',
    };
  }
  if (samePoint(start, dest)) {
    return {
      ready: false,
      startLabel: formatPoint(start),
      destinationLabel: formatPoint(dest),
      statusLabel: 'Identical endpoints',
      error: 'Start and Destination match the same pixel coordinate; choose distinct endpoints.',
    };
  }
  return {
    ready: true,
    startLabel: formatPoint(start),
    destinationLabel: formatPoint(dest),
    statusLabel: 'Endpoints set',
    error: null,
  };
}

export function evaluateTerrainGate(
  terrain: TerrainAvailabilityInput | null | undefined,
  activeImageRef: string | null | undefined,
): TerrainGateView {
  const activeRef = cleanText(activeImageRef);
  const pkgRef = cleanText(terrain?.imageRef);
  const pkgId = cleanText(terrain?.packageId);
  const note = cleanText(terrain?.statusNote);

  if (!terrain || terrain.status === 'none') {
    return {
      canRequest: false,
      badgeLabel: 'No terrain package',
      tone: 'neutral',
      message:
        note ??
        'No measured DEM package is available yet. Manual 2D route sketching continues without elevation routing.',
    };
  }
  if (terrain.status === 'rejected') {
    return {
      canRequest: false,
      badgeLabel: 'Rejected terrain',
      tone: 'error',
      message:
        note ??
        'This terrain package failed coordinator review or alignment verification and cannot run route previews.',
    };
  }
  if (terrain.status === 'proposed' || terrain.status === 'pending-review') {
    return {
      canRequest: false,
      badgeLabel: 'Pending source review',
      tone: 'caution',
      message:
        note ??
        'Candidate elevation metadata is pending independent coordinator acceptance before terrain preview requests can run.',
    };
  }
  if (!pkgId || !pkgRef) {
    return {
      canRequest: false,
      badgeLabel: 'Incomplete terrain contract',
      tone: 'caution',
      message: 'Accepted status requires valid packageId and imageRef metadata from Patrick’s adapter.',
    };
  }
  if (activeRef && pkgRef !== activeRef) {
    return {
      canRequest: false,
      badgeLabel: 'Image mismatch',
      tone: 'error',
      message: `Terrain package targets "${pkgRef}", not active image "${activeRef}". Requests are disabled.`,
    };
  }
  if (terrain.offlineReady === false) {
    return {
      canRequest: false,
      badgeLabel: 'Offline pack incomplete',
      tone: 'caution',
      message:
        note ??
        'Terrain assets are missing or unverified in the offline cache; verify the offline pack before computing previews.',
    };
  }
  return {
    canRequest: true,
    badgeLabel: 'DEM ready (experimental)',
    tone: 'accepted',
    message:
      note ??
      'Reviewed DEM grid accepted for experimental path preview only — not an EVA safety or trafficability certification.',
  };
}

export function evaluatePreviewStaleness(
  preview: TerrainPreviewState | null | undefined,
  activeRequestId: string | null,
  terrain: TerrainAvailabilityInput | null | undefined,
  endpoints: TerrainEndpointsInput | null | undefined,
  currentGradeValue: number | null,
  currentGradeUnit: TerrainGradeUnit,
): PreviewStalenessView {
  if (!preview || preview.status !== 'preview-ready') {
    return { isStale: false, reasons: [] };
  }
  const reasons: string[] = [];
  if (activeRequestId && preview.requestId && preview.requestId !== activeRequestId) {
    reasons.push('A newer terrain request was issued after this preview.');
  }
  if (!terrain || terrain.status !== 'accepted') {
    reasons.push('Terrain acceptance status is no longer accepted.');
  }
  const curPkg = cleanText(terrain?.packageId);
  const resPkg = cleanText(preview.resultForPackageId);
  if (curPkg && resPkg && curPkg !== resPkg) {
    reasons.push('Terrain package version changed after preview generation.');
  }
  const curImg = cleanText(endpoints?.activeImageRef);
  const resImg = cleanText(preview.resultForImageRef);
  if (curImg && resImg && curImg !== resImg) {
    reasons.push('Active orbital image changed after preview generation.');
  }
  if (preview.resultForEndpoints) {
    if (
      !samePoint(endpoints?.start, preview.resultForEndpoints.start) ||
      !samePoint(endpoints?.destination, preview.resultForEndpoints.destination)
    ) {
      reasons.push('Start or destination endpoint moved or cleared after preview generation.');
    }
  } else if (!isFinitePoint(endpoints?.start) || !isFinitePoint(endpoints?.destination)) {
    reasons.push('Endpoints are incomplete.');
  }
  if (
    typeof preview.resultForMaxGrade === 'number' &&
    Number.isFinite(preview.resultForMaxGrade) &&
    currentGradeValue !== preview.resultForMaxGrade
  ) {
    reasons.push('Maximum segment grade input changed after preview generation.');
  }
  if (preview.resultForGradeUnit && preview.resultForGradeUnit !== currentGradeUnit) {
    reasons.push('Grade constraint unit changed after preview generation.');
  }
  return { isStale: reasons.length > 0, reasons };
}

const OUTCOME_COPY: Record<
  TerrainPlannerFailureCode,
  { headline: string; explanation: string; nonImpassableNote: string }
> = {
  'no-terrain-package': {
    headline: 'No terrain package loaded',
    explanation: 'Elevation routing requires a coordinator-accepted DEM package.',
    nonImpassableNote: 'Missing terrain data does not imply the surface is impassable.',
  },
  'terrain-not-accepted': {
    headline: 'Terrain package awaiting acceptance',
    explanation: 'Proposed, pending, or rejected DEM packages cannot run route previews.',
    nonImpassableNote: 'An incomplete review gate does not indicate impassable terrain.',
  },
  'image-ref-mismatch': {
    headline: 'Image mismatch prevented routing',
    explanation: 'The DEM package imageRef differs from the active orbital raster.',
    nonImpassableNote: 'Coordinate mismatch is an alignment block, not impassable terrain.',
  },
  'offline-pack-incomplete': {
    headline: 'Offline terrain pack incomplete',
    explanation: 'Required DEM grid assets are not hash-verified for offline use.',
    nonImpassableNote: 'Unverified cache state does not prove Martian terrain is impassable.',
  },
  'invalid-endpoints': {
    headline: 'Endpoints incomplete or invalid',
    explanation: 'Both Start and Destination must be distinct valid points within raster bounds.',
    nonImpassableNote: 'Input validation failure does not prove the surface is impassable.',
  },
  'endpoint-outside-coverage': {
    headline: 'Endpoint outside DEM coverage',
    explanation: 'At least one chosen point lies outside the prepared elevation grid footprint.',
    nonImpassableNote: 'Missing elevation coverage at an endpoint does not mean terrain is impassable.',
  },
  'endpoint-on-nodata': {
    headline: 'Endpoint lands on nodata cell',
    explanation: 'The elevation raster has missing data (nodata) at one of the chosen endpoints.',
    nonImpassableNote: 'A nodata pixel reflects missing stereo DEM measurements, not impassable terrain.',
  },
  'grade-limit-exceeded': {
    headline: 'No path within experimental grade threshold',
    explanation:
      'Every candidate grid path exceeded the selected experimental maximum segment grade constraint.',
    nonImpassableNote:
      'No route under this experimental threshold depends on grid spacing and chosen settings; it does not prove actual Martian terrain is impassable.',
  },
  'no-path-within-constraints': {
    headline: 'No path found under constraints',
    explanation:
      'The experimental solver could not connect Start and Destination across valid cells under the active settings.',
    nonImpassableNote:
      'No route from this experimental solver never proves the real terrain is physically impassable.',
  },
  cancelled: {
    headline: 'Preview request cancelled',
    explanation: 'The terrain preview calculation was cancelled before returning a suggestion.',
    nonImpassableNote: 'Cancelling a calculation says nothing about ground impassability.',
  },
  'stale-response': {
    headline: 'Superseded preview discarded',
    explanation: 'An older worker response no longer matched current endpoints or constraints.',
    nonImpassableNote: 'Discarding a stale result protects consistency and does not mean terrain is impassable.',
  },
  'worker-error': {
    headline: 'Terrain worker error',
    explanation: 'The experimental routing worker stopped with an unexpected runtime error.',
    nonImpassableNote: 'A worker failure indicates a software fault, not impassable Martian terrain.',
  },
  unknown: {
    headline: 'Terrain preview unavailable',
    explanation: 'No terrain route suggestion could be generated.',
    nonImpassableNote: 'An unavailable preview does not prove terrain is physically impassable.',
  },
};

export function explainPreviewOutcome(
  preview: TerrainPreviewState | null | undefined,
): OutcomeExplanationView | null {
  if (!preview || (preview.status !== 'no-route' && preview.status !== 'cancelled' && preview.status !== 'error')) {
    return null;
  }
  const fallbackCode: TerrainPlannerFailureCode =
    preview.status === 'cancelled'
      ? 'cancelled'
      : preview.status === 'no-route'
        ? 'no-path-within-constraints'
        : 'worker-error';
  const rawCode = preview.reasonCode ?? fallbackCode;
  const code: TerrainPlannerFailureCode = Object.prototype.hasOwnProperty.call(OUTCOME_COPY, rawCode)
    ? rawCode
    : fallbackCode;
  const entry = OUTCOME_COPY[code];
  return {
    kind: preview.status,
    reasonCode: code,
    headline: entry.headline,
    explanation: entry.explanation,
    engineMessage: cleanText(preview.engineMessage),
    nonImpassableNote: entry.nonImpassableNote,
    preservationNote: 'Your manual 2D route and unsaved Notebook drafts remain preserved.',
    provisionalNote: preview.isProvisionalCode
      ? 'Provisional reason code pending Enzo 2 worker contract freeze.'
      : null,
  };
}

export function formatEngineText(value: unknown): string {
  return cleanText(value) ?? ENGINE_UNAVAILABLE_TEXT;
}

export function formatEngineMeters(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return ENGINE_UNAVAILABLE_TEXT;
  }
  return `${value.toFixed(1)} m`;
}

export function formatEngineGrade(value: unknown, unit: TerrainGradeUnit): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return ENGINE_UNAVAILABLE_TEXT;
  }
  return `${value.toFixed(1)}${unitSymbol(unit)}`;
}

export function formatResolution(meters: unknown): string {
  if (typeof meters !== 'number' || !Number.isFinite(meters) || meters <= 0) {
    return ENGINE_UNAVAILABLE_TEXT;
  }
  return `${meters} m/pixel`;
}

export function cleanStringList(values: readonly string[] | null | undefined): readonly string[] {
  if (!values || !Array.isArray(values)) return [];
  return (values as readonly string[])
    .map((item: unknown) => cleanText(item))
    .filter((item): item is string => item !== null);
}
