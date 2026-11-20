"""Independent registration check for a prepared imagery–DTM pair (Willy 2's R1 case).

1. Orthoimage crop (0.2529 m) block-averaged 4× to the DTM spacing vs the provider's 1 m
   orthoimage (same product family): global and 16-tile NCC offsets, metres.
2. DTM window shaded relief (best-fitting sun azimuth) vs the averaged crop: global offset.
Contract §1.4 draft tolerance: RMS ≤ 1 cell, max ≤ 2 cells. Prints JSON.
"""
import json, math, sys
import numpy as np, tifffile, imagecodecs
from PIL import Image
from scipy.signal import fftconvolve

pair, ortho_c_jp2, ortho_c_lbl = sys.argv[1:4]
ev = json.load(open(f'{pair}/image/IMAGE_EVIDENCE.json'))
img = np.array(Image.open(f'{pair}/image/PSP_001752_1750_RED_A_ortho_crop_2048.jpg'), dtype=float)
sA = ev['pixelSizeMeters'][0]; ulx, uly = ev['upperLeftProjectedMeters']
lbl = open(ortho_c_lbl, errors='replace').read()
val = lambda k: float(next(l.split('=')[1].split('<')[0] for l in lbl.splitlines() if l.strip().startswith(k + ' ')))
sC, spoC, lpoC = val('MAP_SCALE'), val('SAMPLE_PROJECTION_OFFSET'), val('LINE_PROJECTION_OFFSET')
x0C, y0C = -spoC * sC, lpoC * sC
f = round(sC / sA); assert abs(f * sA - sC) < 1e-6, (f, sA, sC)
small = img.reshape(img.shape[0] // f, f, img.shape[1] // f, f).mean(axis=(1, 3))   # cells of size sC
n = small.shape[0]

def ncc(search, t):
    t = t - t.mean(); t /= np.sqrt((t ** 2).sum()); o = np.ones_like(t)
    num = fftconvolve(search, t[::-1, ::-1], 'valid'); s1 = fftconvolve(search, o, 'valid'); s2 = fftconvolve(search ** 2, o, 'valid')
    return num / np.sqrt(np.maximum(s2 - s1 ** 2 / t.size, 1e-9))
def peak(c):
    py, px = np.unravel_index(np.argmax(c), c.shape)
    para = lambda m, z, p: 0.0 if (m - 2 * z + p) == 0 else 0.5 * (m - p) / (m - 2 * z + p)
    dy = para(c[py - 1, px], c[py, px], c[py + 1, px]) if 0 < py < c.shape[0] - 1 else 0
    dx = para(c[py, px - 1], c[py, px], c[py, px + 1]) if 0 < px < c.shape[1] - 1 else 0
    return py + dy, px + dx, float(c[py, px])

# --- 1. against the provider 1 m orthoimage
oc = imagecodecs.jpeg2k_decode(open(ortho_c_jp2, 'rb').read()).astype(float)
from scipy.ndimage import map_coordinates
M = 20
def on_cells(img_full, x0, y0, s, pad):
    # Sample img_full (grid corner x0,y0, spacing s) at the centres of the crop's sC cells, with a pad of cells.
    jj, ii = np.mgrid[-pad:n + pad, -pad:n + pad]
    X = ulx + (ii + 0.5) * sC; Y = uly - (jj + 0.5) * sC
    return map_coordinates(img_full, [(y0 - Y) / s - 0.5, (X - x0) / s - 0.5], order=1, mode='constant', cval=np.nan)
search = on_cells(oc, x0C, y0C, sC, M)
assert not np.isnan(search).any()
py, px, pk = peak(ncc(search, small[32:-32, 32:-32]))
gE, gN = (px - (M + 32)) * sC, -(py - (M + 32)) * sC
tiles = []
q = n // 4
for ty in range(4):
    for tx in range(4):
        t = small[ty * q + 8:(ty + 1) * q - 8, tx * q + 8:(tx + 1) * q - 8]
        sub = search[M + ty * q + 8 - 6:M + (ty + 1) * q - 8 + 6, M + tx * q + 8 - 6:M + (tx + 1) * q - 8 + 6]
        y, x, k = peak(ncc(sub, t)); tiles.append(((x - 6) * sC, -(y - 6) * sC, k))
T = np.array(tiles); good = T[:, 2] > 0.5; d = np.hypot(T[good, 0], T[good, 1])
ortho = {'globalOffsetE_N_m': [round(gE, 3), round(gN, 3)], 'peakNCC': round(pk, 3), 'tilesUsed': int(good.sum()),
         'tileRMS_m': round(float(np.sqrt((d ** 2).mean())), 3), 'tileMax_m': round(float(d.max()), 3)}

# --- 2. against DTM shaded relief
with tifffile.TiffFile(f'{pair}/dem/dtm_window.tif') as t:
    dem = t.asarray().astype(float); g = t.geotiff_metadata
sD = g['ModelPixelScale'][0]; dx0, dy0 = g['ModelTiepoint'][3], g['ModelTiepoint'][4]
oc_col = (ulx - dx0) / sD; oc_row = (dy0 - uly) / sD
gy, gx = np.gradient(dem, sD)
best = None
for az in range(0, 360, 10):
    a, el = math.radians(az), math.radians(30)
    hs = (math.cos(el) * (math.cos(a) * -gx + math.sin(a) * gy) + math.sin(el)) / np.sqrt(1 + gx ** 2 + gy ** 2)
    w = on_cells(hs, dx0, dy0, sD, 0)
    cc = np.corrcoef(w.ravel(), small.ravel())[0, 1]
    if best is None or cc > best[0]: best = (cc, az, hs)
cc, az, hs = best
hsc = on_cells(hs, dx0, dy0, sD, 0)
py, px, pk2 = peak(ncc(small, hsc[40:n - 40, 40:n - 40]))
relief = {'sunAzimuthDeg': az, 'corrAtZero': round(float(cc), 3), 'peakNCC': round(pk2, 3),
          'offsetE_N_m': [round(-(px - 40) * sC, 3), round((py - 40) * sC, 3)],
          'note': 'Shaded relief vs albedo image is an approximate check; a peak within ~2 cells supports registration.'}
tol = {'rmsCells': 1, 'maxCells': 2, 'cellMeters': sD}
verdict = ortho['tileRMS_m'] <= sD and ortho['tileMax_m'] <= 2 * sD and math.hypot(*ortho['globalOffsetE_N_m']) <= sD
print(json.dumps({'orthoCheck': ortho, 'reliefCheck': relief, 'tolerance': tol, 'withinTolerance': verdict}, indent=1))
