"""Independent control-point check of the accepted DTM against the display orthoimage (R1b).

Method (independent of check_registration.py, which compared orthoimage with orthoimage):
  1. Render Lambertian shaded relief from the DTM using the REAL sun geometry of the image
     (incidence and sub-solar azimuth from the PSP_001752_1750_RED label; no fitted lighting).
  2. Average the 0.2529 m orthoimage crop to the DTM's 1.0117 m spacing.
  3. Split the area into a grid of independent tiles and find each tile's offset between
     relief and image by normalised cross-correlation of gradient magnitudes (shape edges,
     less sensitive to albedo than raw brightness).
  4. Tiles with a clear, unique peak become control points; report per-point residuals,
     RMS and max against the draft contract tolerance (1 cell RMS, 2 cells max).

Usage: python control_point_check.py PAIR_DIR RDR_LABEL OUT.json [--tiles 6] [--tile-cells 72]
PAIR_DIR is data/terrain-v2/staging/ortho-pair-v1 (image/, package/) or a rebuilt pair with dem/.
"""
import argparse, json, math, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, sobel
from scipy.signal import fftconvolve


def label_float(text, key):
    m = re.search(rf'^\s*{key}\s*=\s*([-0-9.]+)', text, re.M)
    if not m:
        raise SystemExit(f'label key missing: {key}')
    return float(m.group(1))


def sun_from_label(text):
    """HiRISE azimuths are clockwise from 3 o'clock in the projected image; NORTH_AZIMUTH gives
    where north points in that system. Sun azimuth from north = SUB_SOLAR - NORTH (mod 360)."""
    inc = label_float(text, 'INCIDENCE_ANGLE')
    sub = label_float(text, 'SUB_SOLAR_AZIMUTH')
    north = label_float(text, 'NORTH_AZIMUTH')
    return (sub - north) % 360.0, 90.0 - inc, {'INCIDENCE_ANGLE': inc, 'SUB_SOLAR_AZIMUTH': sub, 'NORTH_AZIMUTH': north}


def horn(z, h):
    """Horn slope/aspect (aspect = downslope azimuth, clockwise from north); rows go south."""
    zp = np.pad(z, 1, mode='edge')
    a, b, c = zp[:-2, :-2], zp[:-2, 1:-1], zp[:-2, 2:]
    d, f = zp[1:-1, :-2], zp[1:-1, 2:]
    g, hh, i = zp[2:, :-2], zp[2:, 1:-1], zp[2:, 2:]
    dzdx = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * h)
    dzdy = ((a + 2 * b + c) - (g + 2 * hh + i)) / (8 * h)  # north positive
    slope = np.arctan(np.hypot(dzdx, dzdy))
    aspect = np.arctan2(-dzdx, -dzdy) % (2 * np.pi)
    return slope, aspect


def lambert(z, h, az_deg, alt_deg):
    slope, aspect = horn(z, h)
    az, alt = math.radians(az_deg), math.radians(alt_deg)
    v = math.sin(alt) * np.cos(slope) + math.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(v, 0, None)


def ncc_peak(search, tmpl):
    t = tmpl - tmpl.mean()
    norm = np.sqrt((t ** 2).sum())
    if norm == 0:
        return None
    t /= norm
    ones = np.ones_like(t)
    num = fftconvolve(search, t[::-1, ::-1], 'valid')
    s1 = fftconvolve(search, ones, 'valid')
    s2 = fftconvolve(search ** 2, ones, 'valid')
    c = num / np.sqrt(np.maximum(s2 - s1 ** 2 / t.size, 1e-12))
    py, px = np.unravel_index(np.argmax(c), c.shape)
    peak = float(c[py, px])
    # second-best peak outside a 3-cell neighbourhood measures uniqueness
    c2 = c.copy()
    c2[max(0, py - 3):py + 4, max(0, px - 3):px + 4] = -np.inf
    second = float(c2.max()) if np.isfinite(c2).any() else -1.0
    para = lambda m, z0, p: 0.0 if (m - 2 * z0 + p) == 0 else 0.5 * (m - p) / (m - 2 * z0 + p)
    dy = para(c[py - 1, px], c[py, px], c[py + 1, px]) if 0 < py < c.shape[0] - 1 else 0.0
    dx = para(c[py, px - 1], c[py, px], c[py, px + 1]) if 0 < px < c.shape[1] - 1 else 0.0
    return py + dy, px + dx, peak, second


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pair')
    ap.add_argument('rdr_label')
    ap.add_argument('out')
    ap.add_argument('--tiles', type=int, default=6)
    ap.add_argument('--tile-cells', type=int, default=64)
    ap.add_argument('--search', type=int, default=6, help='search radius in cells')
    ap.add_argument('--signal', choices=['gradient', 'intensity'], default='gradient',
                    help='match edge strength (default) or raw brightness')
    a = ap.parse_args(argv)
    pair = Path(a.pair)
    ev = json.loads((pair / 'image' / 'IMAGE_EVIDENCE.json').read_text())
    img = np.array(Image.open(pair / 'image' / 'PSP_001752_1750_RED_A_ortho_crop_2048.jpg'), dtype=float)
    m = json.loads((pair / 'package' / 'terrain-manifest.json').read_text())
    gt = m['grid']['geotransform']
    cols, rows = m['grid']['cols'], m['grid']['rows']
    dem = np.frombuffer((pair / 'package' / 'grid.f32').read_bytes(), '<f4').reshape(rows, cols).astype(float)
    sA = ev['pixelSizeMeters'][0]
    h = gt[1]
    f = round(h / sA)
    assert abs(f * sA - h) < 1e-6
    small = img.reshape(img.shape[0] // f, f, img.shape[1] // f, f).mean(axis=(1, 3))
    n = small.shape[0]
    az, alt, sun_raw = sun_from_label(Path(a.rdr_label).read_text(errors='replace'))
    relief = lambert(dem, h, az, alt)
    ulx, uly = ev['upperLeftProjectedMeters']
    pad = a.search

    def on_cells(grid, padc):
        jj, ii = np.mgrid[-padc:n + padc, -padc:n + padc]
        X = ulx + (ii + 0.5) * h
        Y = uly - (jj + 0.5) * h
        return map_coordinates(grid, [(gt[3] - Y) / h - 0.5, (X - gt[0]) / h - 0.5], order=1, mode='nearest')

    rel = on_cells(relief, pad)
    grad = lambda x: np.hypot(sobel(x, 0), sobel(x, 1))
    G_rel, G_img = (grad(rel), grad(small)) if a.signal == 'gradient' else (rel, small)
    zero = np.corrcoef(rel[pad:pad + n, pad:pad + n].ravel(), small.ravel())[0, 1]

    k, T = a.tiles, a.tile_cells
    step = (n - T) / (k - 1)
    points = []
    for ty in range(k):
        for tx in range(k):
            r0, c0 = int(round(ty * step)), int(round(tx * step))
            tmpl = G_img[r0:r0 + T, c0:c0 + T]
            search = G_rel[r0:r0 + T + 2 * pad, c0:c0 + T + 2 * pad]
            res = ncc_peak(search, tmpl)
            if not res:
                continue
            py, px, peak, second = res
            # relief feature sits at (+dx east, -dy north) relative to the image feature
            dE, dN = (px - pad) * h, -(py - pad) * h
            centre_e = ulx + (c0 + T / 2) * h
            centre_n = uly - (r0 + T / 2) * h
            points.append({'tile': [ty, tx], 'centreProjectedM': [round(centre_e, 2), round(centre_n, 2)],
                           'offsetE_N_m': [round(dE, 3), round(dN, 3)], 'peakNCC': round(peak, 3),
                           'uniqueness': round(peak - second, 3)})
    good = [p for p in points if p['peakNCC'] >= 0.35 and p['uniqueness'] >= 0.05]
    d = np.array([math.hypot(*p['offsetE_N_m']) for p in good]) if good else np.array([])
    mean = np.mean([p['offsetE_N_m'] for p in good], axis=0) if good else [None, None]
    result = {
        'method': f'Lambertian relief from DTM with label sun geometry vs orthoimage; {a.signal} NCC per tile ({T}-cell tiles, {k}x{k} grid)',
        'sun': {'azimuthFromNorthDeg': round(az, 3), 'elevationDeg': round(alt, 3), 'label': sun_raw},
        'zeroShiftIntensityCorrelation': round(float(zero), 3),
        'tiles': len(points),
        'controlPoints': len(good),
        'acceptance': {'minPeakNCC': 0.35, 'minUniqueness': 0.05},
        'residualRMS_m': round(float(np.sqrt((d ** 2).mean())), 3) if good else None,
        'residualMax_m': round(float(d.max()), 3) if good else None,
        'meanOffsetE_N_m': [round(float(x), 3) for x in mean] if good else None,
        'standardErrorOfMean_m': round(float(np.sqrt((d ** 2).mean()) / math.sqrt(len(good))), 3) if good else None,
        'toleranceCells': {'rms': 1, 'max': 2, 'cellMeters': h},
        'points': points,
    }
    result['pass'] = bool(good and len(good) >= 8 and result['residualRMS_m'] <= h and result['residualMax_m'] <= 2 * h)
    Path(a.out).write_text(json.dumps(result, indent=1) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'points'}, indent=1))


if __name__ == '__main__':
    sys.exit(main())
