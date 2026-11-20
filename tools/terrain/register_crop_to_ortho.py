"""NCC template matching: where does the crop's content sit in the DTM/ortho grid?
Result is reported as the offset (dE, dN) in metres such that
   feature at crop-frame position P appears in the ortho frame at P + (dE, dN)
(both expressed in the lon0=180 frame after the exact 137.3->180 x-translation)."""
import json, math, sys
import numpy as np, tifffile, imagecodecs
from scipy.ndimage import map_coordinates
from scipy.signal import fftconvolve
crop_path, jp2_path, out_path = sys.argv[1:4]
R = 3396190.0; s = 1.0117467945795; rad = math.pi/180
SPO, LPO = 3577.5000000001, -276559.50000001
SHIFT = R*(180-137.3)*rad
crop = tifffile.imread(crop_path).astype(float)
ulx, uly = -2531487.0, -286803.75
c1 = crop.reshape(512,4,512,4).mean(axis=(1,3))
ortho = imagecodecs.jpeg2k_decode(open(jp2_path,'rb').read()).astype(float)
M = 200  # search margin, metres
def ortho_on_grid(hx, hy):
    """Ortho resampled to a 1 m grid covering crop ± M, in the lon0=180 frame, under pixel hypothesis (hx,hy)."""
    x0, y0 = -(SPO+hx)*s, (LPO+hy)*s
    n = 512 + 2*M
    jj, ii = np.mgrid[0:n, 0:n]
    X = ulx - M + 0.5 + ii + SHIFT; Y = uly + M - 0.5 - jj
    col = (X-x0)/s - 0.5; row = (y0-Y)/s - 0.5
    return map_coordinates(ortho, [row, col], order=1, mode='constant', cval=np.nan)
def ncc(search, tmpl):
    t = (tmpl - tmpl.mean()); t /= np.sqrt((t**2).sum())
    ones = np.ones_like(t)
    num = fftconvolve(search, t[::-1, ::-1], mode='valid')
    s1 = fftconvolve(search, ones, mode='valid'); s2 = fftconvolve(search**2, ones, mode='valid')
    var = s2 - s1**2/t.size
    return num/np.sqrt(np.maximum(var, 1e-9))
def peak(c):
    py, px = np.unravel_index(np.argmax(c), c.shape)
    def para(m, z, p): d = m - 2*z + p; return 0.0 if d == 0 else 0.5*(m-p)/d
    dy = para(c[py-1,px], c[py,px], c[py+1,px]) if 0 < py < c.shape[0]-1 else 0
    dx = para(c[py,px-1], c[py,px], c[py,px+1]) if 0 < px < c.shape[1]-1 else 0
    return py+dy, px+dx, float(c[py,px])
def grad(a):
    gy, gx = np.gradient(a); return np.hypot(gx, gy)
out = {}
for name, (hx, hy) in {'H0 corner=offset': (0,0), 'H1 corner=offset-0.5': (-0.5,0.5), 'H2 corner=offset+0.5': (0.5,-0.5)}.items():
    g = ortho_on_grid(hx, hy); assert not np.isnan(g).any()
    res = {}
    for kind, f in (('intensity', lambda a: a), ('gradient', grad)):
        G, C = f(g), f(c1)
        # global: central 384x384 of the crop
        tmpl = C[64:448, 64:448]
        py, px, pk = peak(ncc(G, tmpl))
        # template top-left sits at search (M+64, M+64) when there is no offset
        dE, dS = px-(M+64), py-(M+64); dN = -dS
        tiles = []
        for ty in range(4):
            for tx in range(4):
                t = C[ty*128+16:ty*128+112, tx*128+16:tx*128+112]   # 96 px tile
                r0 = int(round(M + ty*128+16 + dS)) - 12; c0 = int(round(M + tx*128+16 + dE)) - 12
                sub = G[r0:r0+96+24, c0:c0+96+24]
                qy, qx, qk = peak(ncc(sub, t))
                tE = (c0+qx) - (M+tx*128+16); tN = -((r0+qy) - (M+ty*128+16))
                tiles.append((tE, tN, qk))
        T = np.array(tiles); good = T[:,2] > 0.5
        resid = np.hypot(T[good,0]-dE, T[good,1]-dN)
        res[kind] = {'offsetE_N_m': [round(dE,2), round(dN,2)], 'peakNCC': round(pk,3),
                     'tiles_ok': int(good.sum()), 'tileResidualRMS_m': round(float(np.sqrt((resid**2).mean())),2) if good.any() else None,
                     'tileResidualMax_m': round(float(resid.max()),2) if good.any() else None,
                     'tileOffsets': [[round(a,2), round(b,2), round(c,2)] for a,b,c in tiles]}
    out[name] = res
json.dump(out, open(out_path,'w'), indent=1, default=float)
for n, r in out.items():
    for k, v in r.items(): print(n, k, v['offsetE_N_m'], 'peak', v['peakNCC'], 'tiles', v['tiles_ok'], 'rms', v['tileResidualRMS_m'], 'max', v['tileResidualMax_m'])
