"""Build the CRISM mineralogy layer for the active image from MTRDR summary parameters.

Steps (all recorded in the output JSON):
  1. Register each CRISM observation locally to the HiRISE 1 m orthoimage (R770 vs HiRISE
     averaged to 18 m), in windows of 1.4/2.2/2.9 km around the crop; report stability.
  2. Measure reproducibility between the two independent observations per index and scale.
  3. Map only what reproduces: SINDEX2 (hydrated sulfate) averaged over both observations and
     smoothed to 162 m (9 CRISM pixels). Other indices are reported as area statistics only.
Outputs (to --out): mineralogy.json, sulfate-crop.png (overlay over the crop), context.png (~5 km).

Usage: python prepare_mineral_layers.py --crism-dir DIR --ortho-c PSP_001752_1750_RED_C_01_ORTHO.JP2
       --evidence docs/data/evidence/ORTHO_CROP.json --manifest public/data/manifest.json --out public/data/mineralogy
"""
import argparse, hashlib, json, math, sys
from pathlib import Path
import numpy as np, imagecodecs
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates, uniform_filter
sys.path.insert(0, str(Path(__file__).resolve().parent))
from crism_lib import label, cube, corner, block_mean_at, ncc_shift  # noqa: E402

SPO, LPO, HS = 3577.5000000001, -276559.50000001, 1.0117467945795  # HiRISE RED_C / DTM grid
BASE = 'https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/mrocr_4001/mtrdr'
OBS = {
    'frt0001bba1': '2010/2010_310/frt0001bba1/frt0001bba1_07_su165j_mtr3',
    'frt0001ca91': '2010/2010_365/frt0001ca91/frt0001ca91_07_su165j_mtr3',
}
INDICES = {
    'SINDEX2': 'Hydrated sulfate (poly- and mono-hydrated), 2.1/2.4 µm convexity',
    'BD1900_2': 'H2O-bearing minerals, 1.9 µm band depth',
    'D2300': 'Fe/Mg phyllosilicates (clays), 2.3 µm drop-off',
    'BD2210_2': 'Al-OH minerals, 2.21 µm band depth',
    'BD860_2': 'Crystalline ferric minerals (e.g. hematite), 0.86 µm band depth',
}
MAPPED, SMOOTH_PX = 'SINDEX2', 9


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def smooth(a, k):
    ok = np.isfinite(a)
    num = uniform_filter(np.where(ok, a, 0.0), k)
    den = uniform_filter(ok.astype(float), k)
    out = num / np.maximum(den, 1e-9)
    out[den < 0.6] = np.nan
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for k in ('--crism-dir', '--ortho-c', '--evidence', '--manifest', '--out'):
        ap.add_argument(k, required=True)
    a = ap.parse_args(argv)
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    ev = json.loads(Path(a.evidence).read_text())
    man = json.loads(Path(a.manifest).read_text())
    xmin, ymin, xmax, ymax = ev['boundsProjectedMeters']
    cx, cy = (xmin + xmax) / 2, (ymin + ymax) / 2
    hx0, hy0 = -SPO * HS, LPO * HS
    ortho = imagecodecs.jpeg2k_decode(Path(a.ortho_c).read_bytes()).astype(float)
    ortho[ortho == 0] = np.nan

    obs = {}
    for key, rel in OBS.items():
        lbl = Path(a.crism_dir) / f'{key}_07_su165j_mtr3.lbl'
        img = Path(a.crism_dir) / f'{key}_07_su165j_mtr3.img'
        L = label(lbl); c = cube(img, L); x0, y0 = corner(L, 137.3); s = L['scale']
        r770 = c[L['names'].index('R770')]
        # coarse global estimate, then local windows around the crop
        dE = dN = 0.0
        for it in range(3):
            pad = 25 if it == 0 else 6
            jj, ii = np.mgrid[-pad:L['lines'] + pad, -pad:L['samples'] + pad]
            hi = block_mean_at(ortho, hx0, hy0, HS, x0 + (ii + 0.5) * s + dE, y0 - (jj + 0.5) * s + dN, s)
            both = np.isfinite(r770) & np.isfinite(hi[pad:-pad, pad:-pad])
            rows = np.where(both.any(1))[0]; cols = np.where(both.any(0))[0]
            r0, r1, c0, c1 = rows[0] + 4, rows[-1] - 3, cols[0] + 4, cols[-1] - 3
            dx, dy, _, _ = ncc_shift(np.pad(r770[r0:r1, c0:c1], pad, constant_values=np.nan), hi[r0:r1 + 2 * pad, c0:c1 + 2 * pad], pad)
            dE += dx * s; dN -= dy * s
        windows = {}
        for half in (40, 60, 80):
            e, n = dE, dN
            for it in range(3):
                col = (cx - e - x0) / s - 0.5; row = (y0 - (cy - n)) / s - 0.5
                r0, c0, pad = int(round(row)) - half, int(round(col)) - half, 6
                jj, ii = np.mgrid[r0 - pad:r0 + 2 * half + pad, c0 - pad:c0 + 2 * half + pad]
                hi = block_mean_at(ortho, hx0, hy0, HS, x0 + (ii + 0.5) * s + e, y0 - (jj + 0.5) * s + n, s)
                dx, dy, peak, edge = ncc_shift(np.pad(r770[r0:r0 + 2 * half, c0:c0 + 2 * half], pad, constant_values=np.nan), hi, pad)
                e += dx * s; n -= dy * s
            windows[half] = (e, n, peak, edge)
        e, n, peak, edge = windows[60]
        spread = max(math.hypot(w[0] - e, w[1] - n) for w in windows.values())
        if edge or peak < 0.7 or spread > s:
            raise SystemExit(f'{key}: registration not reliable (peak {peak:.2f}, spread {spread:.1f} m)')
        obs[key] = {'L': L, 'c': c, 'x0': x0, 'y0': y0, 'shift': (e, n), 'peak': peak, 'spread': spread,
                    'img': img, 'lbl': lbl, 'url': f'{BASE}/{rel}'}

    def sample(o, param, X, Y):
        L, s = o['L'], o['L']['scale']; e, n = o['shift']
        cols = (X - e - o['x0']) / s - 0.5; rows = (o['y0'] - (Y - n)) / s - 0.5
        return map_coordinates(o['c'][L['names'].index(param)], [rows, cols], order=1, mode='constant', cval=np.nan)

    s = 18.0
    def grid(half_m):
        k = int(round(2 * half_m / s)); jj, ii = np.mgrid[0:k, 0:k]
        return cx - half_m + (ii + 0.5) * s, cy + half_m - (jj + 0.5) * s
    # reproducibility over a 5 km window
    X5, Y5 = grid(2500)
    repro, stats = {}, {}
    noise = {}
    for p in INDICES:
        A, B = (sample(obs[k], p, X5, Y5) for k in OBS)
        okn = np.isfinite(A) & np.isfinite(B)
        # per-pixel noise from the disagreement of two independent observations
        noise[p] = float(np.std(A[okn] - B[okn]) / math.sqrt(2))
        row = {}
        for k in (1, 3, 9):
            fa, fb = (smooth(A, k), smooth(B, k)) if k > 1 else (A, B)
            ok = np.isfinite(fa) & np.isfinite(fb)
            row[f'{int(k * s)}m'] = round(float(np.corrcoef(fa[ok], fb[ok])[0, 1]), 3)
        repro[p] = row
    # crop statistics (both observations)
    Xc, Yc = np.meshgrid(np.arange(xmin + s / 2, xmax, s), np.arange(ymax - s / 2, ymin, -s))
    for p, desc in INDICES.items():
        per = {}
        for k in OBS:
            v = sample(obs[k], p, Xc, Yc); v = v[np.isfinite(v)]
            per[k] = {'median': round(float(np.median(v)), 5), 'p10': round(float(np.percentile(v, 10)), 5),
                      'p90': round(float(np.percentile(v, 90)), 5), 'positiveShare': round(float((v > 0).mean()), 3)}
        meds = [per[k]['median'] for k in OBS]
        floor = noise[p]
        same_sign = all(m > 0 for m in meds) or all(m < 0 for m in meds)
        if all(m > floor for m in meds):
            finding = 'absorption above the noise floor in both observations'
        elif all(m <= 0 for m in meds):
            finding = 'no absorption detected in either observation'
        else:
            finding = 'not distinguishable from noise'
        stats[p] = {'meaning': desc, 'observations': per, 'consistentSign': same_sign,
                    'noiseFloor': round(floor, 5), 'finding': finding, 'mapped': p == MAPPED}
    # mapped layer: mean of both, smoothed 162 m, over a 5 km context and the crop (+1 cell)
    def mean_smoothed(X, Y):
        A, B = (sample(obs[k], MAPPED, X, Y) for k in OBS)
        m = np.nanmean(np.stack([A, B]), axis=0)
        return smooth(m, SMOOTH_PX)
    ctx = mean_smoothed(X5, Y5)
    lo, hi_ = 0.0, float(np.nanpercentile(ctx, 99))
    def rgba(v):
        t = np.clip((v - lo) / (hi_ - lo), 0, 1)
        img = np.zeros(v.shape + (4,), np.uint8)
        ok = np.isfinite(v) & (v > 0)
        # pale yellow -> deep magenta for weak -> strong sulfate index
        img[..., 0] = (250 - 60 * t).astype(np.uint8)
        img[..., 1] = (220 - 200 * t).astype(np.uint8)
        img[..., 2] = (120 + 80 * t).astype(np.uint8)
        img[..., 3] = np.where(ok, (60 + 170 * t), 0).astype(np.uint8)
        return img
    # context map with greyscale HiRISE-averaged backdrop and the crop outline
    jj, ii = np.mgrid[0:X5.shape[0], 0:X5.shape[1]]
    back = block_mean_at(ortho, hx0, hy0, HS, X5, Y5, s)
    g = np.nan_to_num((back - np.nanpercentile(back, 2)) / (np.nanpercentile(back, 98) - np.nanpercentile(back, 2)), nan=0)
    base = np.dstack([np.clip(g, 0, 1) * 255] * 3 + [np.full(g.shape, 255)]).astype(np.uint8)
    over = rgba(ctx).astype(float)
    al = over[..., 3:4] / 255
    comp = (base[..., :3] * (1 - al) + over[..., :3] * al).astype(np.uint8)
    im = Image.fromarray(np.dstack([comp, np.full(g.shape, 255, np.uint8)])).resize((X5.shape[1] * 2, X5.shape[0] * 2), Image.NEAREST)
    d = ImageDraw.Draw(im)
    px = lambda x, y: ((x - (cx - 2500)) / s * 2, ((cy + 2500) - y) / s * 2)
    d.rectangle([px(xmin, ymax), px(xmax, ymin)], outline=(56, 189, 248, 255), width=3)
    im.save(out / 'context.png', optimize=True)
    # crop overlay: one cell margin
    Xo, Yo = np.meshgrid(np.arange(xmin - s / 2, xmax + s, s), np.arange(ymax + s / 2, ymin - s, -s))
    crop = mean_smoothed(Xo, Yo)
    Image.fromarray(rgba(crop)).save(out / 'sulfate-crop.png', optimize=True)
    px_m = ev['pixelSizeMeters'][0]
    gx0, gy1 = Xo[0, 0] - s / 2, Yo[0, 0] + s / 2
    bounds = {'x0': (gx0 - xmin) / px_m, 'x1': (gx0 + Xo.shape[1] * s - xmin) / px_m,
              'y0': (gy1 - Yo.shape[0] * s - ymin) / px_m, 'y1': (gy1 - ymin) / px_m}
    doc = {
        'schemaVersion': 1,
        'imageRef': man['imageRef'],
        'title': 'CRISM hydrated-sulfate index (SINDEX2), two observations averaged, 162 m smoothing',
        'credit': 'NASA/JPL-Caltech/JHUAPL (MRO CRISM); PDS Geosciences Node',
        'method': 'MTRDR summary parameters (Viviano-Beck et al. 2014 definitions). Each observation registered locally to the HiRISE orthoimage; mapped only where both observations reproduce the pattern.',
        'mappedIndex': MAPPED,
        'smoothingMeters': SMOOTH_PX * s,
        'cellMeters': s,
        'stretch': {'min': lo, 'max': round(hi_, 5)},
        'overlay': {'path': 'data/mineralogy/sulfate-crop.png', 'boundsImagePx': {k: round(v, 3) for k, v in bounds.items()}},
        'context': {'path': 'data/mineralogy/context.png', 'widthMeters': 5000, 'note': 'Blue box = the study area. Backdrop: HiRISE averaged to 18 m.'},
        'cropGrid': {'cols': int(crop.shape[1]), 'rows': int(crop.shape[0]), 'values': [None if not np.isfinite(v) else round(float(v), 5) for v in crop.ravel()]},
        'sources': [{'product': obs[k]['L']['product'], 'acquired': obs[k]['L']['start'], 'url': obs[k]['url'] + '.img',
                     'sha256': sha(obs[k]['img']), 'bytes': obs[k]['img'].stat().st_size} for k in OBS],
        'registration': {k: {'shiftE_N_m': [round(obs[k]['shift'][0], 1), round(obs[k]['shift'][1], 1)],
                             'peakNCC': round(obs[k]['peak'], 3), 'windowSpread_m': round(obs[k]['spread'], 1)} for k in OBS},
        'reproducibility': repro,
        'indices': stats,
        'limitations': [
            'CRISM pixels are 18 m; the mapped layer is smoothed to 162 m because finer patterns did not reproduce between the two observations.',
            'Spectral indices indicate absorption features, not mineral abundance or identification; detections need full-spectrum confirmation.',
            'Dust and surface coatings weaken signatures; a missing signature does not prove absence.',
        ],
    }
    (out / 'mineralogy.json').write_text(json.dumps(doc, indent=1) + '\n')
    print(json.dumps({k: doc[k] for k in ('registration', 'reproducibility', 'stretch')}, indent=1))
    for p, st in stats.items():
        print(p, st['finding'], [st['observations'][k]['median'] for k in OBS])


if __name__ == '__main__':
    sys.exit(main())
