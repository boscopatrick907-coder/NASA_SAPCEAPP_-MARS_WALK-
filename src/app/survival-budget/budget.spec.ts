import { describe, expect, it } from 'vitest';
import { calculateBudget, validInputs } from './budget';
const inputs = { speedKmh: 1, availableMinutes: 120, taskMinutes: 20, reserveMinutes: 30 };
describe('out-and-back scenario arithmetic', () => {
  it('accounts for the full drawn route twice and protects the entered reserve', () => {
    const r = calculateBudget(500, inputs);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.roundTripMeters).toBe(1000);
    expect(r.travelMinutes).toBe(60);
    expect(r.plannedMinutes).toBe(80);
    expect(r.marginMinutes).toBe(10);
    expect(r.maxOutwardMeters).toBeCloseTo(583.333333);
    expect(r.fits).toBe(true);
  });
  it('reports an exceeded budget instead of clamping a deficit away', () => {
    const r = calculateBudget(1000, inputs);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.marginMinutes).toBe(-50);
      expect(r.fits).toBe(false);
    }
  });
  it('accepts an exactly exhausted scenario margin', () => {
    const r = calculateBudget(500, { ...inputs, availableMinutes: 110 });
    expect(r.ok && r.marginMinutes).toBe(0);
    expect(r.ok && r.fits).toBe(true);
  });
  it('accepts derived zero distance but still includes tasks and reserve', () => {
    const r = calculateBudget(0, inputs);
    expect(r.ok && r.travelMinutes).toBe(0);
    expect(r.ok && r.marginMinutes).toBe(70);
  });
  it('does not manufacture distance from missing calibration or endpoints', () => {
    expect(calculateBudget(null, inputs).ok).toBe(false);
  });
  it('handles tasks/reserve already exceeding time even for zero travel', () => {
    const r = calculateBudget(0, { ...inputs, availableMinutes: 10 });
    expect(r.ok && r.marginMinutes).toBe(-40);
    expect(r.ok && r.maxOutwardMeters).toBe(0);
  });
  it('rejects blank, nonfinite, negative and zero speed/time inputs', () => {
    for (const bad of [null, NaN, Infinity, -1, 0]) {
      expect(calculateBudget(500, { ...inputs, speedKmh: bad }).ok).toBe(false);
      expect(calculateBudget(500, { ...inputs, availableMinutes: bad }).ok).toBe(false);
    }
    for (const bad of [null, NaN, Infinity, -1]) {
      expect(calculateBudget(500, { ...inputs, taskMinutes: bad }).ok).toBe(false);
      expect(calculateBudget(500, { ...inputs, reserveMinutes: bad }).ok).toBe(false);
    }
    expect(calculateBudget(-1, inputs).ok).toBe(false);
    expect(calculateBudget(Infinity, inputs).ok).toBe(false);
  });
  it('rejects arithmetic overflow and malformed persisted assumptions', () => {
    expect(calculateBudget(Number.MAX_VALUE, { ...inputs, speedKmh: Number.MIN_VALUE }).ok).toBe(
      false,
    );
    expect(validInputs({})).toBe(false);
    expect(validInputs(null)).toBe(false);
    expect(validInputs(inputs)).toBe(true);
  });
});

describe('terrain-aware budget (Planning V2)', () => {
  const base = { speedKmh: 1.2, availableMinutes: 120, taskMinutes: 20, reserveMinutes: 30 };
  const legs = {
    terrainMeters: 1100,
    ascentMeters: 150,
    descentMeters: 50,
    maxGradeDeg: 22,
    coverage: 1,
  };

  it('uses terrain distance and asymmetric climb/descent per leg', () => {
    const r = calculateBudget(
      1000,
      { ...base, climbMinutesPer100m: 10, descentMinutesPer100m: 2 },
      legs,
    );
    if (!r.ok) throw new Error(r.reason);
    const walk = (1100 / 1200) * 60; // 55 min
    expect(r.usesTerrain).toBe(true);
    expect(r.oneWayMeters).toBe(1100);
    expect(r.outboundMinutes).toBeCloseTo(walk + 1.5 * 10 + 0.5 * 2, 9); // climbs 150, descends 50
    expect(r.returnMinutes).toBeCloseTo(walk + 0.5 * 10 + 1.5 * 2, 9); // the reverse
    expect(r.travelMinutes).toBeCloseTo(r.outboundMinutes + r.returnMinutes, 9);
    expect(r.turnaroundMinute).toBeCloseTo(120 - 30 - r.returnMinutes, 9);
    expect(r.marginMinutes).toBeCloseTo(120 - 30 - 20 - r.travelMinutes, 9);
  });

  it('falls back to planar distance with no climb terms when terrain is missing', () => {
    const r = calculateBudget(1000, { ...base, climbMinutesPer100m: 10 }, null);
    if (!r.ok) throw new Error(r.reason);
    expect(r.usesTerrain).toBe(false);
    expect(r.outboundMinutes).toBeCloseTo(50, 9);
    expect(r.maxGradeDeg).toBeNull();
  });

  it('warns when the route is steeper than the entered grade limit', () => {
    const over = calculateBudget(1000, { ...base, gradeLimitDeg: 20 }, legs);
    const under = calculateBudget(1000, { ...base, gradeLimitDeg: 25 }, legs);
    expect(over.ok && over.gradeExceeded).toBe(true);
    expect(under.ok && under.gradeExceeded).toBe(false);
  });

  it('rejects negative rates and out-of-range limits; old saved inputs stay valid', () => {
    expect(calculateBudget(1, { ...base, climbMinutesPer100m: -1 }).ok).toBe(false);
    expect(calculateBudget(1, { ...base, gradeLimitDeg: 0 }).ok).toBe(false);
    expect(calculateBudget(1, { ...base, gradeLimitDeg: 95 }).ok).toBe(false);
    expect(validInputs(base)).toBe(true);
    expect(validInputs({ ...base, climbMinutesPer100m: null, gradeLimitDeg: null })).toBe(true);
  });
});
