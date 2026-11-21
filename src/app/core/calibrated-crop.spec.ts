import { describe, it, expect } from 'vitest';
import manifest from '../../../public/data/manifest.json';
import { validManifest, validEnvelope } from './validation';
import { assessRoute } from './route';
import type { ImageManifest } from './models';
const image = manifest as ImageManifest;
describe('active georeferenced crop contract', () => {
  it('validates square projected pixel scale and derives known planar lengths, including zero', () => {
    expect(validManifest(manifest)).toBe(true);
    expect(image.width).toBe(2048);
    expect(image.height).toBe(2048);
    // Provider orthoimage scale (PSP_001752_1750_RED_A_01_ORTHO MAP_SCALE).
    const s = 0.2529366986449;
    expect(image.calibration.metersPerPixel).toBe(s);
    const a = assessRoute(
      { start: { x: 0, y: 0 }, destination: { x: 2048, y: 0 }, waypoints: [] },
      image,
    );
    expect(a.planarDistanceMeters).toBeCloseTo(2048 * s, 9);
    expect(a.terrainStatus).toBe('unavailable');
    expect(
      assessRoute({ start: { x: 0, y: 0 }, destination: { x: 300, y: 400 }, waypoints: [] }, image)
        .planarDistanceMeters,
    ).toBeCloseTo(500 * s, 9);
    expect(
      assessRoute({ start: { x: 10, y: 10 }, destination: { x: 10, y: 10 }, waypoints: [] }, image)
        .planarDistanceMeters,
    ).toBe(0);
  });
  it('rejects legacy-image missions instead of silently moving their coordinates', () => {
    for (const imageRef of [
      'hirise-mro-pia26306-boxwork-2048x1042-v1',
      'hirise-psp001752-red-center-2048-025m-v2',
    ])
      expect(
        validEnvelope(
          {
            schemaVersion: 1,
            imageRef,
            route: { start: { x: 10, y: 10 }, destination: null, waypoints: [] },
            observations: [],
          },
          image,
        ),
      ).toBe(false);
    expect(
      validEnvelope(
        {
          schemaVersion: 1,
          imageRef: 'hirise-mro-pia26306-boxwork-2048x1042-v1',
          route: { start: { x: 10, y: 10 }, destination: null, waypoints: [] },
          observations: [],
        },
        image,
      ),
    ).toBe(false);
  });
});

import terrainIndex from '../../../public/data/terrain/index.json';
import terrainManifest from '../../../public/data/terrain/terrain-dteec_001488_1750_001752_1750_u02-hirise-psp001752-red-ortho-2048-0253m-v3-v1/terrain-manifest.json';
import {
  coverageLabel,
  imageCoverage,
  imageGeoref,
  terrainGate,
  validTerrainManifest,
} from './terrain';

describe('accepted terrain package for the active image', () => {
  it('is the indexed, valid, accepted package for this image with full coverage', () => {
    expect(terrainIndex.activePackageId).toBe(terrainManifest.packageId);
    expect(validTerrainManifest(terrainManifest)).toBe(true);
    expect(terrainManifest.admission.status).toBe('accepted');
    const g = imageGeoref(image)!;
    expect(g).not.toBeNull();
    expect(g.imageRef).toBe(terrainManifest.imageRef);
    const gt = terrainManifest.grid.geotransform as unknown as Parameters<typeof imageCoverage>[1];
    expect(
      coverageLabel(imageCoverage(g, gt, terrainManifest.grid.cols, terrainManifest.grid.rows)),
    ).toBe('full');
    expect(terrainGate(terrainManifest as never, image.imageRef, 'verified')).toBeNull();
    expect(terrainGate(terrainManifest as never, image.imageRef, 'partial')).toBe(
      'offline-pack-incomplete',
    );
  });
  it('has no georeference when calibration and georeference disagree', () => {
    expect(
      imageGeoref({ ...image, calibration: { ...image.calibration, metersPerPixel: 0.25 } }),
    ).toBeNull();
    expect(imageGeoref({ ...image, georeference: undefined })).toBeNull();
  });
});
