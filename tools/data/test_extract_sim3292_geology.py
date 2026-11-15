"""Unit and regression tests for USGS SIM 3292 geological dataset extraction and verification."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import extract_sim3292_geology as sim3292

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "tools/data/extract_sim3292_geology.py"


class ExtractSim3292GeologyTests(unittest.TestCase):
    def test_equirectangular_lonlat_roundtrip_on_mars_sphere(self):
        ulx = -2531487.0
        uly = -286803.75
        lon, lat = sim3292.equirectangular_m_to_lonlat_deg(ulx, uly)
        self.assertAlmostEqual(lon, 137.292283, places=6)
        self.assertAlmostEqual(lat, -4.838553, places=6)

        rx, ry = sim3292.lonlat_deg_to_equirectangular_m(lon, lat)
        self.assertAlmostEqual(rx, ulx, delta=0.05)
        self.assertAlmostEqual(ry, uly, delta=0.05)

    def test_hirise_crop_footprint_dimensions_and_bounds(self):
        fp = sim3292.compute_hirise_crop_footprint()
        self.assertEqual(fp["widthMeters"], 512.0)
        self.assertEqual(fp["heightMeters"], 512.0)
        self.assertEqual(fp["areaSqMeters"], 262144.0)
        self.assertAlmostEqual(fp["areaSqKm"], 0.262144, places=6)
        self.assertEqual(fp["bboxLonLat"], [137.292283, -4.84719, 137.300921, -4.838553])
        self.assertEqual(fp["centerLonLat"], [137.296602, -4.842872])
        self.assertEqual(len(fp["polygonRing"]), 5)
        self.assertEqual(fp["polygonRing"][0], fp["polygonRing"][-1])

    def test_polygon_with_cutout_ring_parity(self):
        outer = [[135.0, -7.0], [140.0, -7.0], [140.0, -3.0], [135.0, -3.0], [135.0, -7.0]]
        hole = [[137.0, -5.5], [138.5, -5.5], [138.5, -4.5], [137.0, -4.5], [137.0, -5.5]]
        rings = [outer, hole]

        # Point in outer ring but outside hole -> inside
        self.assertTrue(sim3292.point_in_polygon_rings(136.0, -4.0, rings))
        # Point inside hole -> outside polygon
        self.assertFalse(sim3292.point_in_polygon_rings(137.3, -4.84, rings))
        # Point completely outside outer ring -> outside
        self.assertFalse(sim3292.point_in_polygon_rings(130.0, -4.0, rings))

    def test_committed_geojson_and_inventory_pass_verification(self):
        ok, report = sim3292.verify_committed_artifacts()
        self.assertTrue(ok, report["errors"])
        self.assertTrue(report["success"])
        self.assertEqual(report["featureCount"], 6)
        self.assertEqual(report["enclosingUnit"], "Htu")
        self.assertEqual(report["errors"], [])

        inventory = json.loads(sim3292.DEFAULT_INVENTORY_PATH.read_text(encoding="utf-8"))
        dist_info = inventory["aoiSpatialQuery"]["geodesicDistancesFromBoxworkAoiCenter"]
        self.assertAlmostEqual(
            dist_info["toHtuAhiGeologicContact_OID2203"]["minSegmentDistanceKm"], 5.784, places=2
        )
        self.assertAlmostEqual(
            dist_info["toGaleCraterRimStructure_OID103"]["minSegmentDistanceKm"], 33.726, places=2
        )
        self.assertAlmostEqual(
            dist_info["toMslCuriosityLandingSite_OID9"]["distanceKm"], 17.217, places=2
        )
        self.assertTrue(dist_info["toMslCuriosityLandingSite_OID9"]["landingSiteInAHi_OID775"])
        self.assertFalse(dist_info["toMslCuriosityLandingSite_OID9"]["landingSiteInHtu_OID754"])

    def test_corrupted_geojson_detected_by_verifier(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad_geojson = Path(tmp) / "corrupted.geojson"
            bad_geojson.write_text('{"type": "FeatureCollection", "features": []}\n', encoding="utf-8")
            ok, report = sim3292.verify_committed_artifacts(
                geojson_path=bad_geojson, inventory_path=sim3292.DEFAULT_INVENTORY_PATH
            )
            self.assertFalse(ok)
            self.assertFalse(report["success"])
            self.assertGreaterEqual(len(report["errors"]), 2)

    def test_cli_default_verification_succeeds(self):
        proc = subprocess.run(
            [sys.executable, str(SCRIPT)],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        payload = json.loads(proc.stdout)
        self.assertTrue(payload["success"])
        self.assertEqual(payload["enclosingUnit"], "Htu")


if __name__ == "__main__":
    unittest.main()
