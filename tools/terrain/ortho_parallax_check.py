"""Stereo-consistency check of the DTM (R1b, second method).

The provider orthorectified BOTH stereo images (PSP_001752_1750 and PSP_001488_1750) with the
same DTM. Each image was taken from a different viewing angle, so any horizontal misplacement of
the DTM would put terrain in different places in the two orthoimages (relief parallax). Matching
the two orthoimages tile by tile therefore tests the DTM against both source images, with no
shading model. Agreement within the draft tolerance (1 cell RMS, 2 cells max, >= 8 points) passes.

Usage: python ortho_parallax_check.py ORTHO_1752_C.JP2 ORTHO_1488_C.JP2 IMAGE_EVIDENCE.json OUT.json
Both JP2s must be the provider's 1 m RED_C orthoimages on the DTM grid (same label offsets).
"""
import json, math, sys
from pathlib import Path
import numpy as np, imagecodecs
from scipy.ndimage import sobel
sys.path.insert(0, str(Path(__file__).resolve().parent))
from control_point_check import ncc_peak  # noqa: E402

SPO, LPO, S = 3577.5000000001, -276559.50000001, 1.0117467945795  # shared RED_C / DTM grid


def main(a1, a2, evidence, out, k=6, T=64, pad=6):
    ev = json.loads(Path(evidence).read_text())
    ulx, uly = ev['upperLeftProjectedMeters']
    x0, y0 = -SPO * S, LPO * S
    c0 = int(round((ulx - x0) / S)); r0 = int(round((y0 - uly) / S))
    n = int(round(2048 * ev['pixelSizeMeters'][0] / S))
    o1 = imagecodecs.jpeg2k_decode(open(a1, 'rb').read()).astype(float)
    o2 = imagecodecs.jpeg2k_decode(open(a2, 'rb').read()).astype(float)
    assert o1.shape == o2.shape
    w1 = o1[r0:r0 + n, c0:c0 + n]
    w2 = o2[r0 - pad:r0 + n + pad, c0 - pad:c0 + n + pad]
    g = lambda x: np.hypot(sobel(x, 0), sobel(x, 1))
    step = (n - T) / (k - 1)
    pts = []
    for ty in range(k):
        for tx in range(k):
            rr, cc = int(round(ty * step)), int(round(tx * step))
            res = ncc_peak(g(w2[rr:rr + T + 2 * pad, cc:cc + T + 2 * pad]), g(w1[rr:rr + T, cc:cc + T]))
            if not res: continue
            py, px, peak, second = res
            pts.append({'tile': [ty, tx], 'offsetE_N_m': [round((px - pad) * S, 3), round(-(py - pad) * S, 3)],
                        'peakNCC': round(peak, 3), 'uniqueness': round(peak - second, 3)})
    good = [p for p in pts if p['peakNCC'] >= 0.35 and p['uniqueness'] >= 0.05]
    d = np.array([math.hypot(*p['offsetE_N_m']) for p in good])
    r = {'method': 'gradient NCC between the two provider orthoimages (PSP_001752 vs PSP_001488, both on the DTM), 6x6 tiles of 64 cells over the crop',
         'tiles': len(pts), 'controlPoints': len(good), 'acceptance': {'minPeakNCC': 0.35, 'minUniqueness': 0.05},
         'residualRMS_m': round(float(np.sqrt((d ** 2).mean())), 3) if len(good) else None,
         'residualMax_m': round(float(d.max()), 3) if len(good) else None,
         'meanOffsetE_N_m': [round(float(x), 3) for x in np.mean([p['offsetE_N_m'] for p in good], axis=0)] if good else None,
         'toleranceCells': {'rms': 1, 'max': 2, 'cellMeters': S}, 'points': pts}
    r['pass'] = bool(len(good) >= 8 and r['residualRMS_m'] <= S and r['residualMax_m'] <= 2 * S)
    Path(out).write_text(json.dumps(r, indent=1) + '\n')
    print(json.dumps({k: v for k, v in r.items() if k != 'points'}, indent=1))


if __name__ == '__main__':
    main(*sys.argv[1:5])
