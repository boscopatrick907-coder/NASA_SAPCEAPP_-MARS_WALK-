"""Synthetic tests for crism_lib (fixtures only)."""
import math, sys, unittest
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import crism_lib as c  # noqa: E402


class CrismLib(unittest.TestCase):
    def test_corner_shifts_centre_longitude_exactly(self):
        L = {'lat0': 0.0, 'radius': c.R, 'spo': -451675.8722222, 'lpo': -15532.3322222, 'scale': 18.0, 'lon0': 0.0}
        x0, y0 = c.corner(L, 137.3)
        self.assertAlmostEqual(x0, 451675.8722222 * 18 + c.R * math.radians(-137.3), 6)
        self.assertAlmostEqual(y0, -15532.3322222 * 18, 6)

    def test_corner_rejects_other_projections(self):
        with self.assertRaises(SystemExit):
            c.corner({'lat0': 5.0, 'radius': c.R, 'spo': 0, 'lpo': 0, 'scale': 18, 'lon0': 0}, 137.3)

    def test_ncc_recovers_a_known_shift(self):
        rng = np.random.default_rng(3)
        base = rng.random((80, 80))
        fixed = base[10:70, 10:70]
        moving = base[10 - 6 + 3:70 + 6 + 3, 10 - 6 - 2:70 + 6 - 2]  # content offset by (+3 rows, -2 cols)
        dx, dy, peak, edge = c.ncc_shift(np.pad(fixed, 6, constant_values=np.nan), moving, 6)
        self.assertAlmostEqual(dx, 2, delta=0.2)
        self.assertAlmostEqual(dy, -3, delta=0.2)
        self.assertGreater(peak, 0.99)
        self.assertFalse(edge)


if __name__ == '__main__':
    unittest.main()
