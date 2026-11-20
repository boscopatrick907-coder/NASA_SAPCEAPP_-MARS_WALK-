/**
 * Independent alignment checks (Willy 2, Planning V2). Expected values are derived by hand
 * from docs/data/evidence/CALIBRATED_CROP.json and the contract text, not from the code
 * under test. Synthetic grids only; a pass here does not establish real-DEM alignment.
 * Case IDs match docs/qa/PLANNING_V2_ALIGNMENT.md.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as L from 'leaflet';
import {
  containingCell,
  coverageLabel,
  Geotransform,
  ImageGeoref,
  imageCoverage,
  imageToProjected,
  projectedToImage,
  terrainGate,
  TerrainManifest,
} from '../../src/app/core/terrain';
import { imageBounds, toLeafletPoint } from '../../src/app/map/map.component';
import { validEnvelope } from '../../src/app/core/validation';
import { ImageManifest } from '../../src/app/core/models';

const evidence = JSON.parse(readFileSync('docs/data/evidence/CALIBRATED_CROP.json', 'utf8'));
const manifestJson: ImageManifest = JSON.parse(readFileSync('public/data/manifest.json', 'utf8'));
const [XMIN, YMIN, XMAX, YMAX] = evidence.boundsProjectedMeters as number[];
const crop: ImageGeoref = {
  imageRef: evidence.imageRef,
  width: evidence.dimensions[0],
  height: evidence.dimensions[1],
  pixelSizeMeters: evidence.pixelSizeMeters[0],
  xminMeters: XMIN,
  yminMeters: YMIN,
};
/** 1 m grid exactly on the crop footprint: 512 × 512. */
const exact: Geotransform = [XMIN, 1, 0, YMAX, 0, -1];

describe('A0 evidence self-consistency', () => {
  it('bounds = upper-left + size × pixel', () => {
    expect(evidence.upperLeftProjectedMeters).toEqual([XMIN, YMAX]);
    expect(XMIN + 2048 * 0.25).toBe(XMAX);
    expect(YMAX - 2048 * 0.25).toBe(YMIN);
    expect(evidence.pixelSizeMeters).toEqual([0.25, -0.25]);
  });
  it('runtime manifest matches the evidence', () => {
    expect(manifestJson.imageRef).toBe(evidence.imageRef);
    expect([manifestJson.width, manifestJson.height]).toEqual(evidence.dimensions);
    expect(manifestJson.calibration.metersPerPixel).toBe(0.25);
    expect(manifestJson.coordinateSystem).toBe('image-pixels-bottom-left');
  });
});

describe('A1 image corners', () => {
  it.each([
    ['bottom-left', { x: 0, y: 0 }, { e: XMIN, n: YMIN }],
    ['bottom-right', { x: 2048, y: 0 }, { e: XMAX, n: YMIN }],
    ['top-left', { x: 0, y: 2048 }, { e: XMIN, n: YMAX }],
    ['top-right', { x: 2048, y: 2048 }, { e: XMAX, n: YMAX }],
    ['centre', { x: 1024, y: 1024 }, { e: -2531231, n: -287059.75 }],
  ])('%s', (_, p, q) => {
    expect(imageToProjected(p, crop)).toEqual(q);
    expect(projectedToImage(q, crop)).toEqual(p);
  });
});

describe('A2 cell centres and A3 row inversion', () => {
  it('image pixel at the top-left maps to grid row 0, col 0', () => {
    // Pixel centre (0.125, 2047.875) lies 0.03125 m east / south of the NW corner → cell (0,0).
    expect(containingCell({ x: 0.125, y: 2047.875 }, crop, exact, 512, 512)).toEqual({
      col: 0,
      row: 0,
    });
  });
  it('image pixel at the bottom-left maps to the last row', () => {
    expect(containingCell({ x: 0.125, y: 0.125 }, crop, exact, 512, 512)).toEqual({
      col: 0,
      row: 511,
    });
  });
  it('4 image pixels per 1 m cell: pixels 4..7 east share col 1', () => {
    for (const x of [4.01, 5.5, 7.99])
      expect(containingCell({ x, y: 2047 }, crop, exact, 512, 512)?.col).toBe(1);
    expect(containingCell({ x: 3.99, y: 2047 }, crop, exact, 512, 512)?.col).toBe(0);
  });
  it('a cell centre maps back to the expected image pixel', () => {
    // Cell (col 10, row 20) centre: E = XMIN + 10.5, N = YMAX − 20.5 → x = 42, y = 2048 − 82 = 1966.
    expect(projectedToImage({ e: XMIN + 10.5, n: YMAX - 20.5 }, crop)).toEqual({ x: 42, y: 1966 });
  });
});

describe('A4 crop offsets', () => {
  it('DEM starting 10 m west and 20 m north: image NW corner is cell (10, 20)', () => {
    const gt: Geotransform = [XMIN - 10, 1, 0, YMAX + 20, 0, -1];
    expect(containingCell({ x: 0.1, y: 2047.9 }, crop, gt, 600, 600)).toEqual({ col: 10, row: 20 });
    expect(coverageLabel(imageCoverage(crop, gt, 600, 600))).toBe('full');
  });
  it('2 m cells offset by half a cell', () => {
    const gt: Geotransform = [XMIN - 1, 2, 0, YMAX + 1, 0, -2];
    // x = 0.1 px → E = XMIN + 0.025 → (0.025 + 1)/2 = 0.51 → col 0.
    expect(containingCell({ x: 0.1, y: 2047.9 }, crop, gt, 300, 300)).toEqual({ col: 0, row: 0 });
    // x = 4.1 px → E = XMIN + 1.025 → 1.01 → col 1.
    expect(containingCell({ x: 4.1, y: 2047.9 }, crop, gt, 300, 300)?.col).toBe(1);
  });
  it('partial and disjoint grids are reported as such', () => {
    expect(imageCoverage(crop, exact, 256, 512)).toBeCloseTo(0.5, 12);
    expect(coverageLabel(imageCoverage(crop, [XMAX + 1, 1, 0, YMAX, 0, -1], 10, 10))).toBe('none');
  });
});

describe('A5 borders', () => {
  it('interior cell boundaries belong to the east / south cell', () => {
    expect(containingCell({ x: 4, y: 2047 }, crop, exact, 512, 512)?.col).toBe(1); // E = XMIN + 1 exactly
    expect(containingCell({ x: 1, y: 2044 }, crop, exact, 512, 512)?.row).toBe(1); // N = YMAX − 1 exactly
  });
  it('top edge (y = height) is inside the grid', () => {
    // FINDING A5-2 (minor): returns row -0. Numerically equal and indexes correctly, so compare with ==.
    const cell = containingCell({ x: 1, y: 2048 }, crop, exact, 512, 512)!;
    expect(cell.col === 0 && cell.row === 0).toBe(true);
  });
  // FINDING A5-1: validPoint accepts x = width and y = 0, and the map clamps clicks to them,
  // but with an exactly covering grid those points fall outside the last cell. Expected:
  // inside (last col / last row). Marked `fails` so the suite flips when it is fixed.
  it.fails('right edge (x = width) maps to the last column', () => {
    expect(containingCell({ x: 2048, y: 1000 }, crop, exact, 512, 512)?.col).toBe(511);
  });
  it.fails('bottom edge (y = 0) maps to the last row', () => {
    expect(containingCell({ x: 1000, y: 0 }, crop, exact, 512, 512)?.row).toBe(511);
  });
});

describe('A6 nodata endpoint lookup', () => {
  it('the mask index for a cell is row × cols + col (row 0 north)', () => {
    const mask = new Uint8Array(512 * 512).fill(1);
    mask[0] = 0; // NW cell invalid
    const cell = containingCell({ x: 0.1, y: 2047.9 }, crop, exact, 512, 512)!;
    expect(mask[cell.row * 512 + cell.col]).toBe(0);
    const sw = containingCell({ x: 0.1, y: 0.1 }, crop, exact, 512, 512)!;
    expect(sw.row * 512 + sw.col).toBe(511 * 512);
  });
});

describe('A7 wrong imageRef and A8 legacy missions', () => {
  const pkg = {
    imageRef: crop.imageRef,
    admission: { status: 'accepted', reviewer: 'r', decidedAtUtc: 'd', evidenceRef: 'e' },
  } as unknown as TerrainManifest;
  it('terrain for another image is refused', () => {
    expect(terrainGate(pkg, 'hirise-mro-pia26306-boxwork-2048x1042-v1', 'verified')).toBe(
      'image-ref-mismatch',
    );
    expect(terrainGate(pkg, null, 'verified')).toBe('image-ref-mismatch');
  });
  it('missions saved on the old image are not accepted by the current image', () => {
    const legacy = {
      schemaVersion: 1,
      imageRef: evidence.oldImageRef,
      route: { start: { x: 1, y: 1 }, destination: { x: 2, y: 2 }, waypoints: [] },
      observations: [],
    };
    expect(validEnvelope(legacy, manifestJson)).toBe(false);
    expect(validEnvelope({ ...legacy, imageRef: manifestJson.imageRef }, manifestJson)).toBe(true);
  });
  it('a mission with a terrainSuggestion field still imports (contract §8)', () => {
    const m = {
      schemaVersion: 1,
      imageRef: manifestJson.imageRef,
      route: { start: { x: 1, y: 1 }, destination: { x: 2, y: 2 }, waypoints: [] },
      observations: [],
      terrainSuggestion: {
        contractVersion: 'terrain-v1',
        packageId: 'p',
        requestId: 'r',
        maxSegmentGradeDeg: 15,
        acceptedAtUtc: 't',
      },
    };
    expect(validEnvelope(m, manifestJson)).toBe(true);
  });
});

describe('A9 map ↔ image ↔ grid chain (Leaflet CRS.Simple)', () => {
  it('map bounds put image y = height at the top of the screen', () => {
    const [[s, w], [n, e]] = imageBounds({ width: 2048, height: 2048 }) as [
      [number, number],
      [number, number],
    ];
    expect([s, w, n, e]).toEqual([0, 0, 2048, 2048]);
    const top = L.CRS.Simple.latLngToPoint(L.latLng(toLeafletPoint({ x: 0, y: 2048 })), 0);
    const bottom = L.CRS.Simple.latLngToPoint(L.latLng(toLeafletPoint({ x: 0, y: 0 })), 0);
    expect(top.y).toBeLessThan(bottom.y); // screen y grows downward
  });
  it('a click on the screen top-left lands in grid row 0', () => {
    const latlng = L.CRS.Simple.pointToLatLng(L.point(0.5, -2047.5), 0); // just inside NW corner at zoom 0
    const p = { x: latlng.lng, y: latlng.lat }; // same conversion as MapComponent click handler
    expect(containingCell(p, crop, exact, 512, 512)).toEqual({ col: 0, row: 0 });
  });
});
