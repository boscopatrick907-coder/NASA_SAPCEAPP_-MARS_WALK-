import {
  cellCentre,
  checkGridMask,
  containingCell,
  coverageLabel,
  degreesToPercent,
  Geotransform,
  ImageGeoref,
  imageCoverage,
  imageToProjected,
  MAX_TERRAIN_CELLS,
  percentToDegrees,
  projectedToGrid,
  projectedToImage,
  segmentGradeDeg,
  terrainGate,
  TerrainManifest,
  terrainReadiness,
  validTerrainManifest,
} from './terrain';

// Active crop georeference (docs/data/evidence/CALIBRATED_CROP.json).
const crop: ImageGeoref = {
  imageRef: 'hirise-psp001752-red-center-2048-025m-v2',
  width: 2048,
  height: 2048,
  pixelSizeMeters: 0.25,
  xminMeters: -2531487,
  yminMeters: -287315.75,
};
// Synthetic 1 m grid exactly covering the crop (tests only, never runtime terrain).
const gt: Geotransform = [-2531487, 1, 0, -286803.75, 0, -1];
const sha = async (b: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', b.slice().buffer))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');

function manifest(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    contractVersion: 'terrain-v1',
    packageId: 'terrain-synthetic-v1',
    imageRef: crop.imageRef,
    productId: 'SYNTHETIC',
    source: { title: 'Synthetic', url: 'https://example.org/x', credit: 'Test' },
    grid: { cols: 512, rows: 512, geotransform: [...gt] },
    horizontal: { units: 'meters', nativeSpacingMeters: 1, preparedSpacingMeters: 1 },
    vertical: { units: 'meters', datumOrReference: 'synthetic' },
    files: [
      { path: 'grid.f32', bytes: 512 * 512 * 4, sha256: 'a'.repeat(64) },
      { path: 'mask.u8', bytes: 512 * 512, sha256: 'b'.repeat(64) },
    ],
    admission: { status: 'pending-review', reviewer: null, decidedAtUtc: null, evidenceRef: null },
    ...over,
  };
}

describe('terrain contract v1 transforms', () => {
  it('maps image corners to the documented crop bounds', () => {
    expect(imageToProjected({ x: 0, y: 0 }, crop)).toEqual({ e: -2531487, n: -287315.75 });
    expect(imageToProjected({ x: 2048, y: 2048 }, crop)).toEqual({ e: -2530975, n: -286803.75 });
  });

  it('round-trips image ↔ projected', () => {
    const p = { x: 1234.5, y: 17.25 };
    const back = projectedToImage(imageToProjected(p, crop), crop);
    expect(back.x).toBeCloseTo(p.x, 9);
    expect(back.y).toBeCloseTo(p.y, 9);
  });

  it('uses north-up rows and cell-centre values', () => {
    expect(cellCentre({ col: 0, row: 0 }, gt)).toEqual({ e: -2531486.5, n: -286804.25 });
    const idx = projectedToGrid(cellCentre({ col: 7, row: 3 }, gt), gt);
    expect(idx.col).toBeCloseTo(7, 9);
    expect(idx.row).toBeCloseTo(3, 9);
  });

  it('finds the containing cell: image top-left is row 0, bottom-left is the last row', () => {
    expect(containingCell({ x: 0.1, y: 2047.9 }, crop, gt, 512, 512)).toEqual({ col: 0, row: 0 });
    expect(containingCell({ x: 0.1, y: 0.1 }, crop, gt, 512, 512)).toEqual({ col: 0, row: 511 });
    expect(containingCell({ x: 2048, y: 1 }, crop, gt, 512, 512)).toBeNull();
    expect(containingCell({ x: 1, y: 1 }, crop, gt, 100, 100)).toBeNull();
  });
});

describe('terrain grade units', () => {
  it('converts degrees and percent consistently (15° is not 25 %)', () => {
    expect(degreesToPercent(15)).toBeCloseTo(26.795, 3);
    expect(percentToDegrees(25)).toBeCloseTo(14.036, 3);
    expect(percentToDegrees(degreesToPercent(33))).toBeCloseTo(33, 9);
  });
  it('computes unsigned segment grade', () => {
    expect(segmentGradeDeg(-1, 1)).toBeCloseTo(45, 9);
    expect(segmentGradeDeg(0, Math.SQRT2)).toBe(0);
  });
});

describe('validTerrainManifest', () => {
  it('accepts a well-formed pending manifest', () => {
    expect(validTerrainManifest(manifest())).toBe(true);
  });
  it('rejects wrong contract, rotation, upsampling, spacing mismatch and size cap', () => {
    expect(validTerrainManifest(manifest({ contractVersion: 'v1-proposal' }))).toBe(false);
    expect(
      validTerrainManifest(
        manifest({ grid: { cols: 512, rows: 512, geotransform: [gt[0], 1, 0.1, gt[3], 0, -1] } }),
      ),
    ).toBe(false);
    expect(
      validTerrainManifest(
        manifest({
          horizontal: { units: 'meters', nativeSpacingMeters: 2, preparedSpacingMeters: 1 },
        }),
      ),
    ).toBe(false);
    expect(
      validTerrainManifest(
        manifest({
          horizontal: { units: 'meters', nativeSpacingMeters: 1, preparedSpacingMeters: 2 },
        }),
      ),
    ).toBe(false);
    const n = Math.sqrt(MAX_TERRAIN_CELLS) + 1;
    expect(
      validTerrainManifest(
        manifest({
          grid: { cols: n, rows: n, geotransform: [...gt] },
          files: [
            { path: 'grid.f32', bytes: n * n * 4, sha256: 'a'.repeat(64) },
            { path: 'mask.u8', bytes: n * n, sha256: 'b'.repeat(64) },
          ],
        }),
      ),
    ).toBe(false);
  });
  it('rejects file sizes that disagree with grid dimensions, unsafe paths and duplicates', () => {
    expect(
      validTerrainManifest(
        manifest({
          files: [
            { path: 'grid.f32', bytes: 4, sha256: 'a'.repeat(64) },
            { path: 'mask.u8', bytes: 512 * 512, sha256: 'b'.repeat(64) },
          ],
        }),
      ),
    ).toBe(false);
    expect(
      validTerrainManifest(
        manifest({
          files: [
            { path: '../grid.f32', bytes: 512 * 512 * 4, sha256: 'a'.repeat(64) },
            { path: 'mask.u8', bytes: 512 * 512, sha256: 'b'.repeat(64) },
          ],
        }),
      ),
    ).toBe(false);
    const g = { path: 'grid.f32', bytes: 512 * 512 * 4, sha256: 'a'.repeat(64) };
    expect(
      validTerrainManifest(
        manifest({ files: [g, g, { path: 'mask.u8', bytes: 512 * 512, sha256: 'b'.repeat(64) }] }),
      ),
    ).toBe(false);
  });
  it('requires reviewer, date and evidence for an accepted decision', () => {
    const bare = { status: 'accepted', reviewer: null, decidedAtUtc: null, evidenceRef: null };
    expect(validTerrainManifest(manifest({ admission: bare }))).toBe(false);
    expect(
      validTerrainManifest(
        manifest({
          admission: {
            status: 'accepted',
            reviewer: 'Patrick',
            decidedAtUtc: '2026-11-20T00:00:00Z',
            evidenceRef: 'ACCEPTANCE.md',
          },
        }),
      ),
    ).toBe(true);
  });
});

describe('checkGridMask', () => {
  it('counts valid cells when NaN and mask agree', () => {
    expect(checkGridMask(new Float32Array([1, NaN, 3]), new Uint8Array([1, 0, 1]))).toBe(2);
  });
  it('treats any disagreement or bad mask value as corrupt', () => {
    expect(checkGridMask(new Float32Array([1, 2]), new Uint8Array([1, 0]))).toBeNull();
    expect(checkGridMask(new Float32Array([NaN]), new Uint8Array([1]))).toBeNull();
    expect(checkGridMask(new Float32Array([1]), new Uint8Array([2]))).toBeNull();
    expect(checkGridMask(new Float32Array([1]), new Uint8Array([1, 1]))).toBeNull();
  });
});

describe('coverage', () => {
  it('reports full, partial and none against the crop footprint', () => {
    expect(coverageLabel(imageCoverage(crop, gt, 512, 512))).toBe('full');
    expect(imageCoverage(crop, gt, 256, 512)).toBeCloseTo(0.5, 9);
    expect(coverageLabel(imageCoverage(crop, [0, 1, 0, 0, 0, -1], 10, 10))).toBe('none');
  });
});

describe('terrainGate', () => {
  const m = manifest() as unknown as TerrainManifest;
  const accepted = { ...m, admission: { ...m.admission, status: 'accepted' } } as TerrainManifest;
  it('blocks in contract order and never trusts self-declared flags', () => {
    expect(terrainGate(null, crop.imageRef, 'verified')).toBe('no-terrain-package');
    expect(
      terrainGate({ ...m, claimedVerified: true } as TerrainManifest, crop.imageRef, 'verified'),
    ).toBe('terrain-not-accepted');
    expect(terrainGate(accepted, 'other-image', 'verified')).toBe('image-ref-mismatch');
    expect(terrainGate(accepted, crop.imageRef, 'partial')).toBe('offline-pack-incomplete');
    expect(terrainGate(accepted, crop.imageRef, 'verified')).toBeNull();
  });
});

describe('terrainReadiness', () => {
  const grid = new Uint8Array([1, 2, 3, 4]);
  const mask = new Uint8Array([1]);
  let m: TerrainManifest;
  beforeAll(async () => {
    m = {
      ...(manifest() as unknown as TerrainManifest),
      files: [
        { path: 'grid.f32', bytes: 4, sha256: await sha(grid) },
        { path: 'mask.u8', bytes: 1, sha256: await sha(mask) },
      ],
    } as TerrainManifest;
  });
  const store = (files: Record<string, Uint8Array>) => async (p: string) => files[p] ?? null;

  it('is verified only when every file is present and hash-valid', async () => {
    expect(await terrainReadiness(m, store({ 'grid.f32': grid, 'mask.u8': mask }))).toBe(
      'verified',
    );
  });
  it('distinguishes not-cached, partial and corrupt', async () => {
    expect(await terrainReadiness(m, store({}))).toBe('not-cached');
    expect(await terrainReadiness(m, store({ 'grid.f32': grid }))).toBe('partial');
    expect(
      await terrainReadiness(
        m,
        store({ 'grid.f32': new Uint8Array([9, 9, 9, 9]), 'mask.u8': mask }),
      ),
    ).toBe('corrupt');
    expect(
      await terrainReadiness(m, store({ 'grid.f32': grid, 'mask.u8': new Uint8Array([1, 1]) })),
    ).toBe('corrupt');
  });
  it('treats a throwing reader as missing, not verified', async () => {
    expect(
      await terrainReadiness(m, async () => {
        throw new Error('cache');
      }),
    ).toBe('not-cached');
  });
});
