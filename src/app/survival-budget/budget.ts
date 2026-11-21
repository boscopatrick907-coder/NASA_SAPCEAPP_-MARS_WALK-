export interface BudgetInputs {
  speedKmh: number | null;
  availableMinutes: number | null;
  taskMinutes: number | null;
  reserveMinutes: number | null;
  /** Extra minutes per 100 m climbed (user assumption; null = not applied). */
  climbMinutesPer100m?: number | null;
  /** Extra minutes per 100 m descended (user assumption; null = not applied). */
  descentMinutesPer100m?: number | null;
  /** Grade the user does not want to exceed, degrees (warning only; null = none). */
  gradeLimitDeg?: number | null;
}

/** Terrain figures for the outbound route (from the accepted DTM), or null when unavailable. */
export interface TerrainLegs {
  readonly terrainMeters: number;
  readonly ascentMeters: number;
  readonly descentMeters: number;
  readonly maxGradeDeg: number;
  readonly coverage: number;
}

const finiteAtLeast = (v: unknown, min: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min;
const optional = (v: unknown, max = Infinity) =>
  v === undefined || v === null || (finiteAtLeast(v, 0) && (v as number) <= max);

export function calculateBudget(
  distanceMeters: number | null,
  inputs: BudgetInputs,
  terrain: TerrainLegs | null = null,
) {
  if (distanceMeters === null || !Number.isFinite(distanceMeters) || distanceMeters < 0)
    return {
      ok: false as const,
      reason: 'Set both route endpoints and use a calibrated image to calculate the time scenario.',
    };
  const { speedKmh, availableMinutes, taskMinutes, reserveMinutes } = inputs;
  if (
    speedKmh === null ||
    !Number.isFinite(speedKmh) ||
    speedKmh <= 0 ||
    availableMinutes === null ||
    !Number.isFinite(availableMinutes) ||
    availableMinutes <= 0 ||
    taskMinutes === null ||
    !Number.isFinite(taskMinutes) ||
    taskMinutes < 0 ||
    reserveMinutes === null ||
    !Number.isFinite(reserveMinutes) ||
    reserveMinutes < 0
  )
    return {
      ok: false as const,
      reason:
        'Enter a positive walking speed and available time; enter zero or more minutes for tasks and reserve.',
    };
  if (
    !optional(inputs.climbMinutesPer100m) ||
    !optional(inputs.descentMinutesPer100m) ||
    !optional(inputs.gradeLimitDeg, 89.9) ||
    inputs.gradeLimitDeg === 0
  )
    return {
      ok: false as const,
      reason:
        'Climb and descent minutes must be zero or more; a grade limit must be between 0 and 90 degrees.',
    };
  const climbRate = inputs.climbMinutesPer100m ?? 0;
  const descentRate = inputs.descentMinutesPer100m ?? 0;
  const usesTerrain = terrain !== null && terrain.coverage > 0;
  const oneWayMeters = usesTerrain ? terrain.terrainMeters : distanceMeters;
  const up = usesTerrain ? terrain.ascentMeters : 0;
  const down = usesTerrain ? terrain.descentMeters : 0;
  const walkMinutes = (oneWayMeters / (speedKmh * 1000)) * 60;
  // Outbound climbs `up` and descends `down`; the return on the same path swaps them.
  const outboundMinutes = walkMinutes + (up / 100) * climbRate + (down / 100) * descentRate;
  const returnMinutes = walkMinutes + (down / 100) * climbRate + (up / 100) * descentRate;
  const oneWayMinutes = outboundMinutes;
  const roundTripMeters = oneWayMeters * 2;
  const travelMinutes = outboundMinutes + returnMinutes;
  const plannedMinutes = travelMinutes + taskMinutes;
  const marginMinutes = availableMinutes - reserveMinutes - plannedMinutes;
  /** Latest elapsed time (from departure) to start walking back and still keep the reserve. */
  const turnaroundMinute = availableMinutes - reserveMinutes - returnMinutes;
  const climbMinutes = ((up + down) / 100) * (climbRate + descentRate);
  const maxOutwardMeters = Math.max(
    0,
    (((availableMinutes - taskMinutes - reserveMinutes) / 2) * speedKmh * 1000) / 60,
  );
  const limit = inputs.gradeLimitDeg ?? null;
  const gradeExceeded = usesTerrain && limit !== null && terrain.maxGradeDeg > limit;
  if (
    ![
      oneWayMinutes,
      roundTripMeters,
      travelMinutes,
      plannedMinutes,
      marginMinutes,
      maxOutwardMeters,
      turnaroundMinute,
    ].every(Number.isFinite)
  )
    return {
      ok: false as const,
      reason: 'These inputs exceed the calculation range. Use smaller finite values.',
    };
  return {
    ok: true as const,
    usesTerrain,
    planarMeters: distanceMeters,
    oneWayMeters,
    roundTripMeters,
    oneWayMinutes,
    outboundMinutes,
    returnMinutes,
    travelMinutes,
    plannedMinutes,
    marginMinutes,
    turnaroundMinute,
    climbMinutes,
    ascentMeters: up,
    descentMeters: down,
    maxGradeDeg: usesTerrain ? terrain.maxGradeDeg : null,
    terrainCoverage: usesTerrain ? terrain.coverage : 0,
    gradeLimitDeg: limit,
    gradeExceeded,
    /** Flat-ground maximum (ignores climb); a guide, not a limit. */
    maxOutwardMeters,
    fits: marginMinutes >= 0,
  };
}
export function validInputs(value: unknown): value is BudgetInputs {
  if (!value || typeof value !== 'object') return false;
  const v = value as BudgetInputs;
  return calculateBudget(0, v).ok;
}
