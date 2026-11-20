"""Terrain contract v1 preparation: inspect a DEM and extract a compact study-area package.

Subcommands
  inspect  SOURCE [--image-evidence CROP.json]        JSON report; PDS3 .IMG/.LBL or GeoTIFF
  extract  --source DEM.tif --image-evidence CROP.json --out STAGING_DIR ...   GeoTIFF only

No resampling or reprojection happens here. If the DEM CRS differs from the image CRS,
extraction stops (exit 2). Reproject in a separately recorded, reviewed GDAL step first.
Exit codes: 0 ok, 2 refused (evidence/CRS/coverage), 3 bad input. Existing output is never
replaced unless --replace is given, and only after the new package validates.
Requires tools/data/requirements-spatial.txt (numpy, tifffile).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

CONTRACT = 'terrain-v1'
MAX_CELLS = 2048 * 2048
# Float32 sentinels at or below this are nodata (HiRISE uses ~ -3.4028e38).
SENTINEL_FLOOR = -1e30


class Refused(Exception):
    """Evidence or compatibility problem: stop, do not invent values."""


class BadInput(Exception):
    """Malformed or unreadable source."""


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()


# ---------------------------------------------------------------- readers

def read_geotiff(path: Path) -> dict:
    import tifffile

    try:
        with tifffile.TiffFile(path) as t:
            data = t.asarray()
            g = t.geotiff_metadata or {}
            page = t.pages[0]
            nodata_tag = page.tags.get(42113)
            nodata = float(nodata_tag.value) if nodata_tag is not None else None
    except Exception as e:  # tifffile raises many types
        raise BadInput(f'cannot read GeoTIFF: {e}') from e
    if data.ndim != 2:
        raise BadInput(f'expected a single-band 2-D raster, got shape {data.shape}')
    scale = g.get('ModelPixelScale')
    tie = g.get('ModelTiepoint')
    if not scale or not tie or len(tie) < 6:
        raise BadInput('missing ModelPixelScale/ModelTiepoint georeference')
    if tie[0] != 0 or tie[1] != 0:
        raise BadInput('only tiepoints at raster (0,0) are supported')
    if g.get('ModelTransformation') is not None:
        raise BadInput('rotated/sheared ModelTransformation is not supported in v1')
    # GTRasterTypeGeoKey 1 = PixelIsArea (tiepoint at the corner), 2 = PixelIsPoint (centre).
    raster_type = g.get('GTRasterTypeGeoKey', 1)
    raster_type = getattr(raster_type, 'value', raster_type)
    sx, sy = float(scale[0]), float(scale[1])
    x0, y0 = float(tie[3]), float(tie[4])
    if raster_type == 2:
        x0, y0 = x0 - sx / 2, y0 + sy / 2
    crs = {
        'citation': g.get('GTCitationGeoKey') or g.get('PCSCitationGeoKey'),
        'projection': g.get('ProjCoordTransGeoKey'),
        'radiusMeters': g.get('GeogSemiMajorAxisGeoKey'),
        'semiMinorMeters': g.get('GeogSemiMinorAxisGeoKey'),
        'centerLongitude': g.get('ProjCenterLongGeoKey', g.get('ProjNatOriginLongGeoKey')),
        'centerLatitude': g.get('ProjCenterLatGeoKey'),
        'standardParallel': g.get('ProjStdParallel1GeoKey'),
        'falseEasting': g.get('ProjFalseEastingGeoKey', 0.0),
        'falseNorthing': g.get('ProjFalseNorthingGeoKey', 0.0),
        'linearUnits': g.get('ProjLinearUnitsGeoKey'),
    }
    crs = {k: (getattr(v, 'value', v)) for k, v in crs.items()}
    return {
        'format': 'GeoTIFF',
        'data': data,
        'geotransform': [x0, sx, 0.0, y0, 0.0, -sy],
        'crs': crs,
        'nodata': nodata,
        'rasterType': 'PixelIsPoint' if raster_type == 2 else 'PixelIsArea',
    }


_KV = re.compile(r'^\s*([A-Z0-9_:^]+)\s*=\s*(.*?)\s*$')


def parse_pds3_label(text: str) -> dict:
    """Flat PDS3 keyword parse (OBJECT nesting kept as dotted prefixes). Values stay strings."""
    out: dict = {}
    stack: list[str] = []
    for line in text.splitlines():
        if line.strip() == 'END':
            break
        m = _KV.match(line)
        if not m:
            continue
        key, value = m.group(1), m.group(2).strip().strip('"')
        if key == 'OBJECT':
            stack.append(value)
            continue
        if key == 'END_OBJECT':
            if stack:
                stack.pop()
            continue
        out['.'.join(stack + [key])] = value
    return out


def inspect_pds3(path: Path) -> dict:
    """Report PDS3 label fields verbatim. Pixel-registration conventions are not interpreted."""
    raw = path.read_bytes()[:200_000]
    try:
        text = raw.decode('latin-1')
    except Exception as e:
        raise BadInput(f'cannot decode label: {e}') from e
    if 'PDS_VERSION_ID' not in text:
        raise BadInput('not a PDS3 label')
    label = parse_pds3_label(text)
    wanted = (
        'PRODUCT_ID', 'PRODUCER_INSTITUTION_NAME', 'SOURCE_PRODUCT_ID', 'START_TIME', 'STOP_TIME',
        'IMAGE.LINES', 'IMAGE.LINE_SAMPLES', 'IMAGE.SAMPLE_TYPE', 'IMAGE.SAMPLE_BITS', 'IMAGE.UNIT',
        'IMAGE.MISSING_CONSTANT', 'IMAGE.VALID_MINIMUM', 'IMAGE.VALID_MAXIMUM',
        'IMAGE_MAP_PROJECTION.MAP_PROJECTION_TYPE', 'IMAGE_MAP_PROJECTION.A_AXIS_RADIUS',
        'IMAGE_MAP_PROJECTION.CENTER_LATITUDE', 'IMAGE_MAP_PROJECTION.CENTER_LONGITUDE',
        'IMAGE_MAP_PROJECTION.MAP_SCALE', 'IMAGE_MAP_PROJECTION.LINE_PROJECTION_OFFSET',
        'IMAGE_MAP_PROJECTION.SAMPLE_PROJECTION_OFFSET', 'IMAGE_MAP_PROJECTION.MAXIMUM_LATITUDE',
        'IMAGE_MAP_PROJECTION.MINIMUM_LATITUDE', 'IMAGE_MAP_PROJECTION.EASTERNMOST_LONGITUDE',
        'IMAGE_MAP_PROJECTION.WESTERNMOST_LONGITUDE', 'IMAGE_MAP_PROJECTION.COORDINATE_SYSTEM_NAME',
        'IMAGE_MAP_PROJECTION.POSITIVE_LONGITUDE_DIRECTION',
    )
    fields = {k: label.get(k) for k in wanted}
    unresolved = [k for k, v in fields.items() if v is None]
    return {
        'format': 'PDS3 label',
        'file': str(path),
        'sha256': sha256(path),
        'bytes': path.stat().st_size,
        'labelFields': fields,
        'missingFields': unresolved,
        'note': (
            'Values are copied verbatim. Vertical datum/reference and accuracy are usually stated in the '
            'provider documentation, not this label: record them in SOURCE_INVENTORY.md with a citation. '
            'For extraction, convert with gdal_translate to GeoTIFF on a GDAL machine and record the exact '
            'command and GDAL version; this tool does not interpret PDS pixel-offset conventions.'
        ),
    }


# ---------------------------------------------------------------- analysis

def nodata_mask(data: np.ndarray, nodata: float | None) -> np.ndarray:
    a = data.astype(np.float64, copy=False)
    invalid = ~np.isfinite(a) | (a <= SENTINEL_FLOOR)
    if nodata is not None and math.isfinite(nodata):
        invalid |= a == nodata
    return ~invalid


def load_image_evidence(path: Path) -> dict:
    ev = json.loads(path.read_text())
    try:
        w, h = ev['dimensions']
        sx, sy = ev['pixelSizeMeters']
        xmin, ymin, xmax, ymax = ev['boundsProjectedMeters']
        crs = ev['crs']
    except (KeyError, ValueError, TypeError) as e:
        raise BadInput(f'image evidence missing fields: {e}') from e
    if not (sx > 0 and sy < 0 and abs(sx + sy) < 1e-12):
        raise BadInput('image evidence must have square north-up pixels')
    return {'imageRef': ev['imageRef'], 'width': w, 'height': h, 'pixel': sx,
            'bounds': [xmin, ymin, xmax, ymax], 'crs': crs}


def crs_problems(dem_crs: dict, image_crs: dict) -> list[str]:
    problems = []
    if dem_crs.get('projection') != 17:  # GeoTIFF CT_Equirectangular
        problems.append(f"DEM projection code {dem_crs.get('projection')} is not equirectangular (17)")
    if dem_crs.get('linearUnits') != 9001:
        problems.append(f"DEM linear units code {dem_crs.get('linearUnits')} is not metres (9001)")
    for dem_key, img_key in (('radiusMeters', 'radiusMeters'), ('centerLongitude', 'centerLongitude'),
                             ('centerLatitude', 'centerLatitude')):
        a, b = dem_crs.get(dem_key), image_crs.get(img_key)
        if a is None or b is None or abs(float(a) - float(b)) > 1e-9:
            problems.append(f'{dem_key}: DEM {a!r} vs image {b!r}')
    # Equirectangular x-scale depends on the standard parallel. CALIBRATED_CROP.json has no
    # separate field; its source GeoTIFF states ProjStdParallel1GeoKey = 0, equal to centerLatitude.
    image_sp = image_crs.get('standardParallel', image_crs.get('centerLatitude'))
    dem_sp = dem_crs.get('standardParallel')
    if dem_sp is None or image_sp is None or abs(float(dem_sp) - float(image_sp)) > 1e-9:
        problems.append(f'standardParallel: DEM {dem_sp!r} vs image {image_sp!r}')
    for k in ('falseEasting', 'falseNorthing'):
        if float(dem_crs.get(k) or 0.0) != float(image_crs.get(k, 0.0)):
            problems.append(f'{k}: DEM {dem_crs.get(k)!r} vs image {image_crs.get(k, 0.0)!r}')
    if dem_crs.get('semiMinorMeters') not in (None, dem_crs.get('radiusMeters')):
        problems.append('DEM uses an ellipsoid; image CRS is a sphere')
    return problems


def footprint(gt: list[float], rows: int, cols: int) -> list[float]:
    return [gt[0], gt[3] + rows * gt[5], gt[0] + cols * gt[1], gt[3]]


def coverage_fraction(fp: list[float], bounds: list[float]) -> float:
    w = max(0.0, min(fp[2], bounds[2]) - max(fp[0], bounds[0]))
    h = max(0.0, min(fp[3], bounds[3]) - max(fp[1], bounds[1]))
    return (w * h) / ((bounds[2] - bounds[0]) * (bounds[3] - bounds[1]))


def raster_report(src: dict, image: dict | None) -> dict:
    data = src['data']
    rows, cols = data.shape
    valid = nodata_mask(data, src['nodata'])
    vals = data[valid].astype(np.float64)
    gt = src['geotransform']
    rep = {
        'format': src['format'],
        'rows': rows, 'cols': cols, 'dtype': str(data.dtype),
        'geotransform': gt, 'rasterType': src['rasterType'], 'crs': src['crs'],
        'nodataValue': src['nodata'], 'validFraction': float(valid.mean()) if valid.size else 0.0,
        'elevationRange': [float(vals.min()), float(vals.max())] if vals.size else None,
        'footprintProjectedMeters': footprint(gt, rows, cols),
        'unresolved': ['vertical units', 'vertical datum/reference', 'vertical/horizontal accuracy'],
    }
    if image:
        rep['imageRef'] = image['imageRef']
        rep['crsProblems'] = crs_problems(src['crs'], image['crs'])
        rep['imageCoverageFraction'] = coverage_fraction(rep['footprintProjectedMeters'], image['bounds'])
    return rep


# ---------------------------------------------------------------- extraction

def window_for(gt: list[float], rows: int, cols: int, bounds: list[float]) -> tuple[int, int, int, int]:
    """Smallest whole-cell window covering the image bounds. Returns (row0, row1, col0, col1)."""
    eps = 1e-9
    c0 = math.floor((bounds[0] - gt[0]) / gt[1] + eps)
    c1 = math.ceil((bounds[2] - gt[0]) / gt[1] - eps)
    r0 = math.floor((bounds[3] - gt[3]) / gt[5] + eps)
    r1 = math.ceil((bounds[1] - gt[3]) / gt[5] - eps)
    if c0 < 0 or r0 < 0 or c1 > cols or r1 > rows:
        raise Refused('DEM does not fully cover the image bounds; propose a reduced area or alternative pair')
    return r0, r1, c0, c1


def extract(args: argparse.Namespace) -> dict:
    src_path = Path(args.source)
    image = load_image_evidence(Path(args.image_evidence))
    src = read_geotiff(src_path)
    if src['data'].dtype.kind != 'f':
        raise BadInput(f"elevation must be floating point, got {src['data'].dtype}")
    problems = crs_problems(src['crs'], image['crs'])
    if problems:
        raise Refused('CRS differs from image; reproject in a reviewed step first: ' + '; '.join(problems))
    gt = src['geotransform']
    if gt[1] <= 0 or gt[5] >= 0 or abs(gt[1] + gt[5]) > 1e-9 * gt[1]:
        raise BadInput('grid must be north-up with square cells')
    if gt[1] < image['pixel'] - 1e-12:
        raise Refused('DEM spacing finer than image pixels; not expected for HiRISE DTMs, needs review')
    if args.vertical_units != 'meters':
        raise Refused('contract v1 requires vertical units in metres')
    for name in ('vertical_reference', 'product_id', 'source_url', 'credit', 'title'):
        if not getattr(args, name, None) or not str(getattr(args, name)).strip():
            raise Refused(f'--{name.replace("_", "-")} is required (from the reviewed source inventory)')
    if not str(args.source_url).startswith('https://'):
        raise Refused('--source-url must be HTTPS')

    rows, cols = src['data'].shape
    r0, r1, c0, c1 = window_for(gt, rows, cols, image['bounds'])
    sub = src['data'][r0:r1, c0:c1].astype(np.float32)
    n_rows, n_cols = sub.shape
    if n_rows * n_cols > MAX_CELLS:
        raise Refused(f'{n_rows}x{n_cols} exceeds the contract parser cap of {MAX_CELLS} cells')
    valid = nodata_mask(sub, src['nodata'])
    if not valid.any():
        raise Refused('no valid elevation cells inside the image bounds')
    sub = np.where(valid, sub, np.float32('nan')).astype('<f4')
    mask = valid.astype(np.uint8)
    out_gt = [gt[0] + c0 * gt[1], gt[1], 0.0, gt[3] + r0 * gt[5], 0.0, gt[5]]

    out = Path(args.out)
    if out.exists() and not args.replace:
        raise Refused(f'{out} exists; pass --replace to swap it after validation')
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix='.terrain-', dir=out.parent))
    try:
        (tmp / 'grid.f32').write_bytes(sub.tobytes(order='C'))
        (tmp / 'mask.u8').write_bytes(mask.tobytes(order='C'))
        provenance = {
            'contractVersion': CONTRACT,
            'createdAtUtc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'command': ['prepare_terrain.py', 'extract', *sys.argv[2:]] if args.record_argv else None,
            'tools': {'python': sys.version.split()[0], 'numpy': np.__version__,
                      'tifffile': __import__('tifffile').__version__},
            'source': {'path': src_path.name, 'bytes': src_path.stat().st_size, 'sha256': sha256(src_path),
                       'rows': rows, 'cols': cols, 'geotransform': gt, 'nodataValue': src['nodata'],
                       'rasterType': src['rasterType']},
            'window': {'row0': r0, 'row1': r1, 'col0': c0, 'col1': c1},
            'resampling': 'none (whole-cell window, no reprojection)',
            'imageEvidence': {'imageRef': image['imageRef'], 'bounds': image['bounds']},
            'validFraction': float(mask.mean()),
        }
        (tmp / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
        files = [{'path': p, 'bytes': (tmp / p).stat().st_size, 'sha256': sha256(tmp / p)}
                 for p in ('grid.f32', 'mask.u8', 'provenance.json')]
        manifest = {
            'schemaVersion': 1, 'contractVersion': CONTRACT, 'packageId': args.package_id,
            'imageRef': image['imageRef'], 'productId': args.product_id,
            'source': {'title': args.title, 'url': args.source_url, 'credit': args.credit},
            'grid': {'cols': n_cols, 'rows': n_rows, 'geotransform': out_gt, 'crs': image['crs']},
            'horizontal': {'units': 'meters', 'nativeSpacingMeters': gt[1], 'preparedSpacingMeters': gt[1],
                           'resamplingMethod': 'none'},
            'vertical': {'units': 'meters', 'datumOrReference': args.vertical_reference},
            'nodata': {'sourceNodataValue': None if src['nodata'] is None else str(src['nodata']),
                       'missingPercent': round(100 * (1 - float(mask.mean())), 4)},
            'files': files,
            'admission': {'status': 'proposed', 'reviewer': None, 'decidedAtUtc': None, 'evidenceRef': None},
        }
        (tmp / 'terrain-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
        verify_package(tmp)
        if out.exists():
            backup = out.with_name(out.name + '.previous')
            if backup.exists():
                shutil.rmtree(backup)
            os.replace(out, backup)
            try:
                os.replace(tmp, out)
            except BaseException:
                os.replace(backup, out)  # keep the previous usable package
                raise
            shutil.rmtree(backup)
        else:
            os.replace(tmp, out)
    except BaseException:
        shutil.rmtree(tmp, ignore_errors=True)
        raise
    return manifest


def verify_package(folder: Path) -> None:
    m = json.loads((folder / 'terrain-manifest.json').read_text())
    n = m['grid']['cols'] * m['grid']['rows']
    for f in m['files']:
        p = folder / f['path']
        if p.stat().st_size != f['bytes'] or sha256(p) != f['sha256']:
            raise BadInput(f"package file mismatch: {f['path']}")
    grid = np.frombuffer((folder / 'grid.f32').read_bytes(), dtype='<f4')
    mask = np.frombuffer((folder / 'mask.u8').read_bytes(), dtype=np.uint8)
    if grid.size != n or mask.size != n:
        raise BadInput('grid/mask size disagrees with manifest')
    if not np.array_equal(np.isfinite(grid), mask == 1) or not np.isin(mask, (0, 1)).all():
        raise BadInput('grid NaN and mask disagree')


# ---------------------------------------------------------------- CLI

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    i = sub.add_parser('inspect')
    i.add_argument('source')
    i.add_argument('--image-evidence')
    e = sub.add_parser('extract')
    e.add_argument('--source', required=True)
    e.add_argument('--image-evidence', required=True)
    e.add_argument('--out', required=True)
    e.add_argument('--package-id', required=True)
    e.add_argument('--product-id')
    e.add_argument('--title')
    e.add_argument('--source-url')
    e.add_argument('--credit')
    e.add_argument('--vertical-units', default='meters')
    e.add_argument('--vertical-reference')
    e.add_argument('--replace', action='store_true')
    e.add_argument('--no-record-argv', dest='record_argv', action='store_false')
    args = p.parse_args(argv)
    try:
        if args.cmd == 'inspect':
            path = Path(args.source)
            if path.suffix.lower() in ('.img', '.lbl'):
                report = inspect_pds3(path)
            else:
                image = load_image_evidence(Path(args.image_evidence)) if args.image_evidence else None
                report = raster_report(read_geotiff(path), image)
                report['sha256'] = sha256(path)
            print(json.dumps(report, indent=2, default=str))
        else:
            m = extract(args)
            print(json.dumps({'packageId': m['packageId'], 'rows': m['grid']['rows'], 'cols': m['grid']['cols'],
                              'files': m['files']}, indent=2))
        return 0
    except Refused as err:
        print(f'refused: {err}', file=sys.stderr)
        return 2
    except (BadInput, OSError, json.JSONDecodeError) as err:
        print(f'bad input: {err}', file=sys.stderr)
        return 3


if __name__ == '__main__':
    sys.exit(main())
