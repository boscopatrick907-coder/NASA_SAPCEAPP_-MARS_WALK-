"""CRISM MTRDR summary-parameter helpers: label parsing, cube reading, georeference, registration."""
import math, re
from pathlib import Path
import numpy as np
from scipy.ndimage import map_coordinates, uniform_filter
from scipy.signal import fftconvolve

R = 3396190.0
INVALID = 65000.0  # CRISM uses 65535 for invalid samples


def label(path):
    t = Path(path).read_text(errors='replace')
    g = lambda k: re.search(rf'^\s*{k}\s*=\s*"?([-0-9.A-Za-z_]+)', t, re.M).group(1)
    names = re.findall(r'"([A-Z0-9_]+)"', t[t.index('BAND_NAME'):]) if 'BAND_NAME' in t else []
    return {
        'product': g('PRODUCT_ID'), 'start': g('START_TIME'),
        'lines': int(g('LINES')), 'samples': int(g('LINE_SAMPLES')), 'bands': int(g('BANDS')),
        'scale': float(g('MAP_SCALE')) * 1000.0, 'lpo': float(g('LINE_PROJECTION_OFFSET')),
        'spo': float(g('SAMPLE_PROJECTION_OFFSET')), 'lon0': float(g('CENTER_LONGITUDE')),
        'lat0': float(g('CENTER_LATITUDE')), 'radius': float(g('A_AXIS_RADIUS')) * 1000.0, 'names': names,
    }


def cube(img, L):
    c = np.fromfile(img, '<f4').reshape(L['bands'], L['lines'], L['samples']).astype(np.float64)
    c[(c >= INVALID) | ~np.isfinite(c)] = np.nan
    return c


def corner(L, target_lon0):
    """Upper-left corner (projected metres) of pixel (0,0) in a frame centred on target_lon0.
    Convention (stated, as for the HiRISE products): corner = (-SPO, LPO) * MAP_SCALE."""
    if L['lat0'] != 0.0 or abs(L['radius'] - R) > 1:
        raise SystemExit('unexpected CRISM projection (centre latitude or radius)')
    x0 = -L['spo'] * L['scale'] + R * math.radians(L['lon0'] - target_lon0)
    y0 = L['lpo'] * L['scale']
    return x0, y0


def block_mean_at(img, img_x0, img_y0, img_s, xs, ys, cell):
    """Mean of a fine image over cell-sized squares centred at projected (xs, ys)."""
    k = max(1, int(round(cell / img_s)))
    sm = uniform_filter(np.nan_to_num(img), size=k, mode='nearest')
    cols = (xs - img_x0) / img_s - 0.5
    rows = (img_y0 - ys) / img_s - 0.5
    return map_coordinates(sm, [rows, cols], order=1, mode='constant', cval=np.nan)


def ncc_shift(fixed, moving, radius):
    """Integer+subpixel shift (dx, dy) in pixels such that moving(x+dx, y+dy) ≈ fixed(x, y)."""
    f = fixed[radius:-radius, radius:-radius]
    mask = np.isfinite(f)
    f = np.where(mask, f, np.nanmean(f))
    m = np.where(np.isfinite(moving), moving, np.nanmean(moving))
    t = f - f.mean(); t /= np.sqrt((t ** 2).sum())
    ones = np.ones_like(t)
    num = fftconvolve(m, t[::-1, ::-1], 'valid')
    s1 = fftconvolve(m, ones, 'valid'); s2 = fftconvolve(m ** 2, ones, 'valid')
    c = num / np.sqrt(np.maximum(s2 - s1 ** 2 / t.size, 1e-12))
    py, px = np.unravel_index(np.argmax(c), c.shape)
    para = lambda a, b, d: 0.0 if (a - 2 * b + d) == 0 else 0.5 * (a - d) / (a - 2 * b + d)
    dy = para(c[py - 1, px], c[py, px], c[py + 1, px]) if 0 < py < c.shape[0] - 1 else 0.0
    dx = para(c[py, px - 1], c[py, px], c[py, px + 1]) if 0 < px < c.shape[1] - 1 else 0.0
    edge = py in (0, c.shape[0] - 1) or px in (0, c.shape[1] - 1)
    return px + dx - radius, py + dy - radius, float(c[py, px]), edge
