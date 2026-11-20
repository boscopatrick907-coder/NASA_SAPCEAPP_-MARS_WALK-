"""Synthetic-only tests for prepare_terrain.py. Fixtures are labelled SYNTHETIC and never shipped."""
import json
import shutil
import struct
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
import tifffile

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prepare_terrain as pt  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
CROP = ROOT / 'docs/data/evidence/CALIBRATED_CROP.json'
XMIN, YMAX = -2531487.0, -286803.75  # crop upper-left


def write_dem(path, data, x0=XMIN, y0=YMAX, spacing=1.0, *, std_parallel=0.0, center_lon=180.0,
              radius=3396190.0, transform=17, units=9001, nodata=None, point=False):
    """Minimal GeoTIFF with the same GeoKeys layout as the real crop."""
    doubles = [radius, radius, center_lon, 0.0, std_parallel, 0.0, 0.0]
    keys = [
        (1024, 0, 1, 1), (1025, 0, 1, 2 if point else 1), (2048, 0, 1, 32767),
        (2057, 34736, 1, 0), (2058, 34736, 1, 1), (3072, 0, 1, 32767), (3075, 0, 1, transform),
        (3076, 0, 1, units), (3082, 34736, 1, 5), (3083, 34736, 1, 6), (3088, 34736, 1, 2),
        (3089, 34736, 1, 3), (3078, 34736, 1, 4),
    ]
    keys.sort()
    directory = [1, 1, 0, len(keys)] + [v for k in keys for v in k]
    tie_x, tie_y = (x0 + spacing / 2, y0 - spacing / 2) if point else (x0, y0)
    extratags = [
        (33550, 'd', 3, (spacing, spacing, 0.0), True),
        (33922, 'd', 6, (0.0, 0.0, 0.0, tie_x, tie_y, 0.0), True),
        (34735, 'H', len(directory), directory, True),
        (34736, 'd', len(doubles), doubles, True),
    ]
    if nodata is not None:
        extratags.append((42113, 's', 0, str(nodata), True))
    tifffile.imwrite(path, data, extratags=extratags)


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def run_extract(self, dem, out=None, *extra):
        out = out or self.tmp / 'pkg'
        argv = ['extract', '--source', str(dem), '--image-evidence', str(CROP), '--out', str(out),
                '--package-id', 'terrain-synthetic-v1', '--product-id', 'SYNTHETIC', '--title', 'SYNTHETIC',
                '--source-url', 'https://example.org/synthetic', '--credit', 'test',
                '--vertical-reference', 'SYNTHETIC', '--no-record-argv', *extra]
        return pt.main(argv), out


class Extract(Base):
    def test_ramp_exact_cover_roundtrip(self):
        data = np.tile(np.arange(512, dtype=np.float32) * 0.1, (512, 1))
        dem = self.tmp / 'ramp.tif'
        write_dem(dem, data)
        code, out = self.run_extract(dem)
        self.assertEqual(code, 0)
        m = json.loads((out / 'terrain-manifest.json').read_text())
        self.assertEqual((m['grid']['cols'], m['grid']['rows']), (512, 512))
        self.assertEqual(m['grid']['geotransform'], [XMIN, 1.0, 0.0, YMAX, 0.0, -1.0])
        self.assertEqual(m['admission']['status'], 'proposed')
        grid = np.frombuffer((out / 'grid.f32').read_bytes(), '<f4').reshape(512, 512)
        np.testing.assert_array_equal(grid, data)
        self.assertEqual(m['horizontal']['preparedSpacingMeters'], m['horizontal']['nativeSpacingMeters'])

    def test_larger_dem_is_windowed_without_resampling(self):
        data = np.arange(600 * 600, dtype=np.float32).reshape(600, 600)
        dem = self.tmp / 'big.tif'
        write_dem(dem, data, x0=XMIN - 10, y0=YMAX + 20)  # crop starts at col 10, row 20
        code, out = self.run_extract(dem)
        self.assertEqual(code, 0)
        grid = np.frombuffer((out / 'grid.f32').read_bytes(), '<f4').reshape(512, 512)
        np.testing.assert_array_equal(grid, data[20:532, 10:522])
        prov = json.loads((out / 'provenance.json').read_text())
        self.assertEqual(prov['window'], {'row0': 20, 'row1': 532, 'col0': 10, 'col1': 522})

    def test_non_aligned_cells_take_the_covering_window(self):
        data = np.zeros((300, 300), np.float32)
        dem = self.tmp / 'off.tif'
        write_dem(dem, data, x0=XMIN - 1.5, y0=YMAX + 1.5, spacing=2.0)
        code, out = self.run_extract(dem)
        self.assertEqual(code, 0)
        m = json.loads((out / 'terrain-manifest.json').read_text())
        self.assertEqual((m['grid']['cols'], m['grid']['rows']), (257, 257))
        self.assertEqual(m['grid']['geotransform'][0], XMIN - 1.5)

    def test_pixel_is_point_tiepoint_is_shifted_to_corner(self):
        dem = self.tmp / 'pt.tif'
        write_dem(dem, np.zeros((512, 512), np.float32), point=True)
        code, out = self.run_extract(dem)
        self.assertEqual(code, 0)
        self.assertEqual(json.loads((out / 'terrain-manifest.json').read_text())['grid']['geotransform'][0], XMIN)

    def test_nodata_sentinels_and_tag_become_nan_and_mask(self):
        data = np.ones((512, 512), np.float32)
        data[0, 0] = -3.4028226550889045e38
        data[1, 1] = -9999
        data[2, 2] = np.nan
        dem = self.tmp / 'nd.tif'
        write_dem(dem, data, nodata=-9999)
        code, out = self.run_extract(dem)
        self.assertEqual(code, 0)
        grid = np.frombuffer((out / 'grid.f32').read_bytes(), '<f4').reshape(512, 512)
        mask = np.frombuffer((out / 'mask.u8').read_bytes(), np.uint8).reshape(512, 512)
        for rc in ((0, 0), (1, 1), (2, 2)):
            self.assertTrue(np.isnan(grid[rc]))
            self.assertEqual(mask[rc], 0)
        self.assertEqual(int(mask.sum()), 512 * 512 - 3)
        m = json.loads((out / 'terrain-manifest.json').read_text())
        self.assertAlmostEqual(m['nodata']['missingPercent'], round(300 / (512 * 512), 4))


class Refusals(Base):
    def test_partial_coverage_refused(self):
        dem = self.tmp / 'part.tif'
        write_dem(dem, np.zeros((256, 512), np.float32))
        self.assertEqual(self.run_extract(dem)[0], 2)

    def test_crs_mismatches_refused(self):
        for kw in ({'std_parallel': -5.0}, {'center_lon': 0.0}, {'radius': 3396000.0}, {'transform': 1},
                   {'units': 9002}):
            dem = self.tmp / 'crs.tif'
            write_dem(dem, np.zeros((512, 512), np.float32), **kw)
            self.assertEqual(self.run_extract(dem)[0], 2, kw)

    def test_all_nodata_refused(self):
        dem = self.tmp / 'empty.tif'
        write_dem(dem, np.full((512, 512), np.nan, np.float32))
        self.assertEqual(self.run_extract(dem)[0], 2)

    def test_missing_vertical_reference_refused(self):
        dem = self.tmp / 'ok.tif'
        write_dem(dem, np.zeros((512, 512), np.float32))
        argv = ['extract', '--source', str(dem), '--image-evidence', str(CROP), '--out', str(self.tmp / 'o'),
                '--package-id', 'p', '--product-id', 'S', '--title', 'S', '--source-url', 'https://e.org',
                '--credit', 'c', '--no-record-argv']
        self.assertEqual(pt.main(argv), 2)
        self.assertFalse((self.tmp / 'o').exists())

    def test_integer_raster_and_multiband_are_bad_input(self):
        dem = self.tmp / 'int.tif'
        write_dem(dem, np.zeros((512, 512), np.int16))
        self.assertEqual(self.run_extract(dem)[0], 3)
        dem2 = self.tmp / 'rgb.tif'
        tifffile.imwrite(dem2, np.zeros((3, 4, 4), np.float32))
        self.assertEqual(self.run_extract(dem2)[0], 3)

    def test_html_error_page_is_bad_input(self):
        dem = self.tmp / 'dtm.tif'
        dem.write_text('<html>403 Forbidden</html>')
        self.assertEqual(self.run_extract(dem)[0], 3)


class OutputSafety(Base):
    def test_existing_output_kept_without_replace_and_on_failure(self):
        good = self.tmp / 'good.tif'
        write_dem(good, np.zeros((512, 512), np.float32))
        code, out = self.run_extract(good)
        self.assertEqual(code, 0)
        before = (out / 'terrain-manifest.json').read_bytes()
        self.assertEqual(self.run_extract(good, out)[0], 2)  # no --replace
        bad = self.tmp / 'bad.tif'
        write_dem(bad, np.zeros((512, 512), np.float32), std_parallel=10.0)
        self.assertEqual(self.run_extract(bad, out, '--replace')[0], 2)
        self.assertEqual((out / 'terrain-manifest.json').read_bytes(), before)
        self.assertEqual([p.name for p in self.tmp.iterdir() if p.name.startswith('.terrain-')], [])

    def test_replace_swaps_after_validation(self):
        a = self.tmp / 'a.tif'
        write_dem(a, np.zeros((512, 512), np.float32))
        b = self.tmp / 'b.tif'
        write_dem(b, np.ones((512, 512), np.float32))
        _, out = self.run_extract(a)
        self.assertEqual(self.run_extract(b, out, '--replace')[0], 0)
        self.assertEqual(np.frombuffer((out / 'grid.f32').read_bytes(), '<f4')[0], 1.0)
        self.assertFalse((self.tmp / 'pkg.previous').exists())

    def test_interrupted_write_leaves_no_partial_package(self):
        dem = self.tmp / 'ok.tif'
        write_dem(dem, np.zeros((512, 512), np.float32))
        original = pt.verify_package
        pt.verify_package = lambda folder: (_ for _ in ()).throw(KeyboardInterrupt())
        try:
            with self.assertRaises(KeyboardInterrupt):
                self.run_extract(dem)
        finally:
            pt.verify_package = original
        self.assertFalse((self.tmp / 'pkg').exists())
        self.assertEqual([p.name for p in self.tmp.iterdir() if p.name.startswith('.terrain-')], [])

    def test_reproducible_bytes(self):
        dem = self.tmp / 'r.tif'
        write_dem(dem, np.random.default_rng(1).random((512, 512), dtype=np.float32))
        _, a = self.run_extract(dem, self.tmp / 'a')
        _, b = self.run_extract(dem, self.tmp / 'b')
        for name in ('grid.f32', 'mask.u8'):
            self.assertEqual((a / name).read_bytes(), (b / name).read_bytes())


class Inspect(Base):
    def test_pds3_label_fields_copied_verbatim(self):
        lbl = self.tmp / 'SYNTH.LBL'
        lbl.write_text('PDS_VERSION_ID = PDS3\nPRODUCT_ID = "SYNTHETIC_DTM"\nOBJECT = IMAGE\n LINES = 10\n'
                       ' LINE_SAMPLES = 12\n SAMPLE_TYPE = PC_REAL\n MISSING_CONSTANT = 16#FF7FFFFB#\nEND_OBJECT = IMAGE\n'
                       'OBJECT = IMAGE_MAP_PROJECTION\n MAP_PROJECTION_TYPE = "EQUIRECTANGULAR"\n'
                       ' CENTER_LATITUDE = 0.0 <DEG>\nEND_OBJECT = IMAGE_MAP_PROJECTION\nEND\n')
        rep = pt.inspect_pds3(lbl)
        self.assertEqual(rep['labelFields']['PRODUCT_ID'], 'SYNTHETIC_DTM')
        self.assertEqual(rep['labelFields']['IMAGE.LINES'], '10')
        self.assertEqual(rep['labelFields']['IMAGE.MISSING_CONSTANT'], '16#FF7FFFFB#')
        self.assertEqual(rep['labelFields']['IMAGE_MAP_PROJECTION.CENTER_LATITUDE'], '0.0 <DEG>')
        self.assertIn('IMAGE_MAP_PROJECTION.MAP_SCALE', rep['missingFields'])

    def test_non_label_rejected(self):
        f = self.tmp / 'x.lbl'
        f.write_bytes(struct.pack('<4f', 1, 2, 3, 4))
        with self.assertRaises(pt.BadInput):
            pt.inspect_pds3(f)

    def test_geotiff_report_coverage(self):
        dem = self.tmp / 'half.tif'
        write_dem(dem, np.zeros((512, 256), np.float32))
        rep = pt.raster_report(pt.read_geotiff(dem), pt.load_image_evidence(CROP))
        self.assertAlmostEqual(rep['imageCoverageFraction'], 0.5)
        self.assertEqual(rep['crsProblems'], [])


if __name__ == '__main__':
    unittest.main()
