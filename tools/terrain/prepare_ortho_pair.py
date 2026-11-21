"""Build the PROPOSED alternative imagery–DTM pair from original HiRISE downloads.

Inputs (provider originals, not stored in Git):
  DTEEC_001488_1750_001752_1750_U02.IMG          (PDS3, attached label)
  PSP_001752_1750_RED_A_01_ORTHO.JP2 + .LBL      (0.2529 m orthoimage made from that DTM)
Outputs in --out (staging, never public/ until accepted):
  image/PSP_001752_1750_RED_A_ortho_crop_2048.jpg   display image
  image/IMAGE_EVIDENCE.json                          georeference of the display image
  dem/dtm_window.tif                                 DTM window as GeoTIFF (no resampling)
  dem/CONVERSION.json                                how the window was cut and georeferenced

Pixel convention (stated, not inferred): the upper-left CORNER of pixel (0,0) is at
x = -SAMPLE_PROJECTION_OFFSET * MAP_SCALE, y = LINE_PROJECTION_OFFSET * MAP_SCALE, for both
products. Registration against the 1 m orthoimage showed the ±0.5 px alternatives change the
fit by < 1 m (see docs/data/terrain-v2/REGISTRATION.md); the residual is part of the evidence.

Requires numpy, tifffile, Pillow and the OpenJPEG CLI (opj_decompress).
"""
import argparse, hashlib, json, math, re, subprocess, sys, tempfile
from pathlib import Path
import numpy as np, tifffile
from PIL import Image

R = 3396190.0


def label_value(text, key):
    m = re.search(rf'^\s*{re.escape(key)}\s*=\s*([^\s<]+)', text, re.M)
    if not m:
        raise SystemExit(f'label key missing: {key}')
    return m.group(1).strip('"')


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def write_geotiff(path, data, ulx, uly, spacing, center_lon, nodata=None):
    doubles = [R, R, center_lon, 0.0, 0.0, 0.0, 0.0]
    keys = sorted([(1024, 0, 1, 1), (1025, 0, 1, 1), (2048, 0, 1, 32767), (2057, 34736, 1, 0), (2058, 34736, 1, 1),
                   (3072, 0, 1, 32767), (3075, 0, 1, 17), (3076, 0, 1, 9001), (3078, 34736, 1, 4),
                   (3082, 34736, 1, 5), (3083, 34736, 1, 6), (3088, 34736, 1, 2), (3089, 34736, 1, 3)])
    directory = [1, 1, 0, len(keys)] + [v for k in keys for v in k]
    tags = [(33550, 'd', 3, (spacing, spacing, 0.0), True), (33922, 'd', 6, (0.0, 0.0, 0.0, ulx, uly, 0.0), True),
            (34735, 'H', len(directory), directory, True), (34736, 'd', len(doubles), doubles, True)]
    if nodata is not None:
        tags.append((42113, 's', 0, str(np.float32(nodata)), True))
    tifffile.imwrite(path, data, extratags=tags)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--dtm', required=True)
    p.add_argument('--ortho-jp2', required=True)
    p.add_argument('--ortho-lbl', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--col0', type=int, required=True, help='ortho column of the crop upper-left pixel')
    p.add_argument('--row0', type=int, required=True)
    p.add_argument('--size', type=int, default=2048)
    p.add_argument('--image-ref', required=True)
    p.add_argument('--margin-m', type=float, default=8.0, help='extra DTM coverage around the image, metres')
    a = p.parse_args(argv)
    out = Path(a.out)
    (out / 'image').mkdir(parents=True, exist_ok=True)
    (out / 'dem').mkdir(parents=True, exist_ok=True)

    # --- orthoimage crop -------------------------------------------------------------
    lbl = Path(a.ortho_lbl).read_text(errors='replace')
    sA = float(label_value(lbl, 'MAP_SCALE')); spoA = float(label_value(lbl, 'SAMPLE_PROJECTION_OFFSET'))
    lpoA = float(label_value(lbl, 'LINE_PROJECTION_OFFSET')); lon0 = float(label_value(lbl, 'CENTER_LONGITUDE'))
    lat0 = float(label_value(lbl, 'CENTER_LATITUDE'))
    if lat0 != 0.0 or abs(float(label_value(lbl, 'A_AXIS_RADIUS')) * 1000 - R) > 1e-6:
        raise SystemExit('ortho projection differs from the expected sphere / centre latitude')
    x0A, y0A = -spoA * sA, lpoA * sA
    region = f'{a.col0},{a.row0},{a.col0 + a.size},{a.row0 + a.size}'
    with tempfile.TemporaryDirectory() as td:
        png = Path(td) / 'crop.png'
        subprocess.run(['opj_decompress', '-i', a.ortho_jp2, '-o', str(png), '-d', region], check=True,
                       stdout=subprocess.DEVNULL)
        pix = np.array(Image.open(png))
    if pix.shape != (a.size, a.size) or (pix == 0).mean() > 0.001:
        raise SystemExit(f'crop is not a full {a.size}² image inside the ortho footprint')
    jpg = out / 'image' / 'PSP_001752_1750_RED_A_ortho_crop_2048.jpg'
    Image.fromarray(pix).save(jpg, quality=90, optimize=True)
    ulx, uly = x0A + a.col0 * sA, y0A - a.row0 * sA
    bounds = [ulx, uly - a.size * sA, ulx + a.size * sA, uly]
    lat_c = math.degrees((bounds[1] + bounds[3]) / 2 / R); lon_c = lon0 + math.degrees((bounds[0] + bounds[2]) / 2 / R)
    evidence = {
        'imageRef': a.image_ref, 'sourceProduct': 'PSP_001752_1750_RED_A_01_ORTHO',
        'sourceSha256': sha256(a.ortho_jp2), 'sourceLabelSha256': sha256(a.ortho_lbl),
        'sourcePixelWindow': [a.col0, a.row0, a.size, a.size], 'dimensions': [a.size, a.size],
        'pixelSizeMeters': [sA, -sA], 'upperLeftProjectedMeters': [ulx, uly], 'boundsProjectedMeters': bounds,
        'centerLatLonDeg': [round(lat_c, 6), round(lon_c, 6)], 'displaySha256': sha256(jpg),
        'displayConversion': 'Provider 8-bit orthoimage values unchanged; JPEG quality 90; no resampling',
        'crs': {'name': 'Equirectangular MARS (HiRISE DTM frame)', 'radiusMeters': R, 'centerLongitude': lon0,
                'centerLatitude': 0.0, 'standardParallel': 0.0, 'units': 'meters'},
        'pixelConvention': 'upper-left corner of pixel (0,0) at (-SAMPLE_PROJECTION_OFFSET, LINE_PROJECTION_OFFSET) × MAP_SCALE',
    }
    (out / 'image' / 'IMAGE_EVIDENCE.json').write_text(json.dumps(evidence, indent=2) + '\n')

    # --- DTM window as GeoTIFF ---------------------------------------------------------
    raw = Path(a.dtm).read_bytes()
    head = raw[:200_000].decode('latin-1')
    rec = int(label_value(head, 'RECORD_BYTES')); start = (int(label_value(head, '^IMAGE')) - 1) * rec
    lines, samples = int(label_value(head, 'LINES')), int(label_value(head, 'LINE_SAMPLES'))
    if label_value(head, 'SAMPLE_TYPE') != 'PC_REAL' or label_value(head, 'SAMPLE_BITS') != '32':
        raise SystemExit('unexpected DTM sample type')
    if float(label_value(head, 'SCALING_FACTOR')) != 1.0 or float(label_value(head, 'OFFSET')) != 0.0:
        raise SystemExit('DTM scaling/offset not identity')
    if float(label_value(head, 'CENTER_LONGITUDE')) != lon0 or float(label_value(head, 'CENTER_LATITUDE')) != 0.0:
        raise SystemExit('DTM and ortho projections differ')
    sD = float(label_value(head, 'MAP_SCALE')); spoD = float(label_value(head, 'SAMPLE_PROJECTION_OFFSET'))
    lpoD = float(label_value(head, 'LINE_PROJECTION_OFFSET'))
    dem = np.frombuffer(raw, dtype='<f4', offset=start, count=lines * samples).reshape(lines, samples)
    x0D, y0D = -spoD * sD, lpoD * sD
    c0 = math.floor((bounds[0] - a.margin_m - x0D) / sD); c1 = math.ceil((bounds[2] + a.margin_m - x0D) / sD)
    r0 = math.floor((y0D - bounds[3] - a.margin_m) / sD); r1 = math.ceil((y0D - bounds[1] + a.margin_m) / sD)
    if c0 < 0 or r0 < 0 or c1 > samples or r1 > lines:
        raise SystemExit('DTM does not cover the crop plus margin')
    win = np.array(dem[r0:r1, c0:c1], dtype='<f4')
    nodata = np.frombuffer(bytes.fromhex(label_value(head, 'MISSING_CONSTANT').split('#')[1]), '>f4')[0]
    write_geotiff(out / 'dem' / 'dtm_window.tif', win, x0D + c0 * sD, y0D - r0 * sD, sD, lon0, nodata)
    conversion = {
        'source': Path(a.dtm).name, 'sourceBytes': len(raw), 'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'label': {k: label_value(head, k) for k in ('PRODUCT_ID', 'PRODUCT_VERSION_ID', 'MAP_SCALE', 'LINE_PROJECTION_OFFSET',
                                                    'SAMPLE_PROJECTION_OFFSET', 'CENTER_LONGITUDE', 'MISSING_CONSTANT')},
        'window': {'row0': r0, 'row1': r1, 'col0': c0, 'col1': c1}, 'nodataFloat': float(nodata),
        'resampling': 'none', 'pixelConvention': evidence['pixelConvention'],
        'tool': 'tools/terrain/prepare_ortho_pair.py (in place of gdal_translate; numpy ' + np.__version__ + ', tifffile ' + tifffile.__version__ + ')',
    }
    (out / 'dem' / 'CONVERSION.json').write_text(json.dumps(conversion, indent=2) + '\n')
    print(json.dumps({'image': str(jpg), 'bounds': bounds, 'center': evidence['centerLatLonDeg'], 'demWindow': conversion['window']}, indent=1))


if __name__ == '__main__':
    sys.exit(main())
