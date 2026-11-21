// Synthetic grid for tests only.
import geology from '../../../public/data/geology.json';
import { landformStats, validGeology } from './geology-context.component';
import type { TerrainSampler } from '../core/terrain-profile';

function sampler(f: (c: number, r: number) => number): TerrainSampler {
  const N = 12;
  const elevation = new Float32Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) elevation[r * N + c] = f(c, r);
  return {
    georef: {
      imageRef: 'img',
      width: 48,
      height: 48,
      pixelSizeMeters: 0.25,
      xminMeters: 0,
      yminMeters: 0,
    },
    geotransform: [0, 1, 0, 12, 0, -1],
    cols: N,
    rows: N,
    elevation,
    mask: new Uint8Array(N * N).fill(1),
    centerLongitudeDeg: 137.3,
    radiusMeters: 3396190,
  };
}

describe('geology context', () => {
  it('the shipped geology.json is valid and keeps its limits', () => {
    expect(validGeology(geology)).toBe(true);
    expect(geology.regionalUnit.code).toBe('Htu');
    expect(geology.regionalUnit.limitations.length).toBeGreaterThan(0);
  });
  it('rejects non-HTTPS sources and missing fields', () => {
    expect(
      validGeology({ ...geology, furtherSources: [{ title: 't', url: 'http://x', use: 'u' }] }),
    ).toBe(false);
    expect(validGeology({ ...geology, regionalUnit: { ...geology.regionalUnit, name: '' } })).toBe(
      false,
    );
    expect(validGeology(null)).toBe(false);
  });
  it('landform statistics: a 45° plane rising east is all "30° and steeper", facing west', () => {
    const st = landformStats(sampler((c) => c))!; // 1 m per 1 m cell = 45°
    expect(st.meanSlopeDeg).toBeCloseTo(45, 4);
    expect(st.classes.at(-1)!.percent).toBeCloseTo(100, 6);
    expect(st.dominantFacing).toBe('west');
    expect(st.maxElevation - st.minElevation).toBe(11);
  });
  it('flat ground: all under 10°, no dominant facing', () => {
    const st = landformStats(sampler(() => 5))!;
    expect(st.classes[0].percent).toBe(100);
    expect(st.dominantFacing).toBeNull();
  });
});

import mineralogy from '../../../public/data/mineralogy/mineralogy.json';
import manifest from '../../../public/data/manifest.json';
import { mineralLayerFrom, validMineralogy } from '../core/mineralogy';
import { mineralValueAt } from '../core/terrain-sampler.store';

describe('CRISM mineralogy data', () => {
  it('the shipped layer is valid for the active image and only maps the reproducible index', () => {
    expect(validMineralogy(mineralogy, manifest.imageRef)).toBe(true);
    expect(validMineralogy(mineralogy, 'other-image')).toBe(false);
    expect(mineralogy.mappedIndex).toBe('SINDEX2');
    expect(mineralogy.reproducibility.SINDEX2['162m']).toBeGreaterThanOrEqual(0.5);
    for (const [k, v] of Object.entries(mineralogy.indices)) expect(v.mapped).toBe(k === 'SINDEX2');
    for (const r of Object.values(mineralogy.registration))
      expect(r.peakNCC).toBeGreaterThanOrEqual(0.7);
  });
  it('reads index values inside the overlay and nothing outside it', () => {
    const layer = mineralLayerFrom(mineralogy as never, 'http://x/');
    expect(mineralValueAt(layer, { x: 1024, y: 1024 })).not.toBeNull();
    expect(mineralValueAt(layer, { x: -500, y: 1024 })).toBeNull();
  });
  it('rejects unsafe paths and wrong grid sizes', () => {
    expect(
      validMineralogy(
        { ...mineralogy, overlay: { ...mineralogy.overlay, path: '../x.png' } },
        manifest.imageRef,
      ),
    ).toBe(false);
    expect(
      validMineralogy(
        { ...mineralogy, cropGrid: { ...mineralogy.cropGrid, cols: 3 } },
        manifest.imageRef,
      ),
    ).toBe(false);
  });
});
