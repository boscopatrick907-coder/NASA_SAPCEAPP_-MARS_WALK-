"""Regression and integrity checks for prepare_environment.py."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "tools/data/prepare_environment.py"
SAMPLE_CSV = REPO_ROOT / "tools/data/samples/curiosity_rems_rad_sample.csv"


class PrepareEnvironmentTests(unittest.TestCase):
    def run_cli(self, source, output, check=False):
        cmd = [
            sys.executable,
            str(SCRIPT),
            "--source",
            str(source),
            "--output",
            str(output),
        ]
        if check:
            cmd.append("--check")
        return subprocess.run(cmd, capture_output=True, text=True, check=False)

    def test_successful_generation_from_sample(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_file = Path(temp_dir) / "environment.json"
            res = self.run_cli(SAMPLE_CSV, out_file)
            self.assertEqual(res.returncode, 0, res.stdout + res.stderr)
            self.assertTrue(out_file.exists())

            data = json.loads(out_file.read_text(encoding="utf-8"))
            self.assertEqual(data["schemaVersion"], 1)
            self.assertEqual(data["region"], "Mount Sharp foothills, Gale Crater, Mars")
            self.assertEqual(data["dataStatus"], "illustrative-sample")
            self.assertIn("illustrative", data["dataStatusNote"].lower())
            self.assertEqual(data["sampleAudit"]["totalInputRows"], 16)
            self.assertEqual(data["sampleAudit"]["includedRows"], 14)
            self.assertEqual(data["sampleAudit"]["excludedRows"], 2)

            quantities = {q["id"]: q for q in data["quantities"]}
            self.assertIn("atmospheric-pressure", quantities)
            self.assertIn("ambient-air-temperature", quantities)
            self.assertIn("surface-radiation-dose-rate", quantities)

            # Pressure checks
            p = quantities["atmospheric-pressure"]
            self.assertEqual(p["unit"], "Pa")
            self.assertEqual(p["mean"], 806.1)
            self.assertEqual(p["min"], 767.9)
            self.assertEqual(p["max"], 843.5)
            self.assertEqual(p["sampleCount"], 14)
            self.assertEqual(p["qualityStatus"], "illustrative-sample")
            self.assertEqual(p["evidenceType"], "illustrative")
            self.assertEqual(p["perQuantityAudit"]["includedSolCount"], 14)
            self.assertEqual(p["perQuantityAudit"]["sentinelExcluded"], 0)
            self.assertEqual(p["perQuantityAudit"]["qualityExcluded"], 2)

            # Air temperature checks
            t = quantities["ambient-air-temperature"]
            self.assertEqual(t["unit"], "degC")
            self.assertEqual(t["mean"], -47.6)
            self.assertEqual(t["min"], -78.7)
            self.assertEqual(t["max"], -17.2)
            self.assertEqual(t["sampleCount"], 14)
            self.assertEqual(t["qualityStatus"], "illustrative-sample")
            self.assertEqual(t["evidenceType"], "illustrative")
            self.assertEqual(t["perQuantityAudit"]["includedSolCount"], 14)
            self.assertEqual(t["perQuantityAudit"]["sentinelExcluded"], 0)
            self.assertEqual(t["perQuantityAudit"]["qualityExcluded"], 2)

            # Radiation dose rate checks (14 valid samples with quality=0)
            r = quantities["surface-radiation-dose-rate"]
            self.assertEqual(r["unit"], "uGy/day")
            self.assertEqual(r["mean"], 211.7)
            self.assertEqual(r["sampleCount"], 14)
            self.assertEqual(r["qualityStatus"], "illustrative-sample")
            self.assertEqual(r["evidenceType"], "illustrative")
            self.assertEqual(r["perQuantityAudit"]["includedSolCount"], 14)
            self.assertEqual(r["perQuantityAudit"]["sentinelExcluded"], 0)
            self.assertEqual(r["perQuantityAudit"]["qualityExcluded"], 2)

    def test_deterministic_output(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out1 = Path(temp_dir) / "env1.json"
            out2 = Path(temp_dir) / "env2.json"
            res1 = self.run_cli(SAMPLE_CSV, out1)
            res2 = self.run_cli(SAMPLE_CSV, out2)
            self.assertEqual(res1.returncode, 0)
            self.assertEqual(res2.returncode, 0)
            self.assertEqual(out1.read_bytes(), out2.read_bytes())

    def test_check_mode_passes_on_matching_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_file = Path(temp_dir) / "environment.json"
            self.run_cli(SAMPLE_CSV, out_file)
            mtime_before = out_file.stat().st_mtime_ns

            res = self.run_cli(SAMPLE_CSV, out_file, check=True)
            self.assertEqual(res.returncode, 0, res.stderr)
            self.assertIn("[SUCCESS]", res.stdout)
            self.assertEqual(out_file.stat().st_mtime_ns, mtime_before)

    def test_check_mode_fails_on_tampered_value(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_file = Path(temp_dir) / "environment.json"
            self.run_cli(SAMPLE_CSV, out_file)

            data = json.loads(out_file.read_text(encoding="utf-8"))
            data["quantities"][0]["mean"] = 999.9
            out_file.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            mtime_before = out_file.stat().st_mtime_ns

            res = self.run_cli(SAMPLE_CSV, out_file, check=True)
            self.assertEqual(res.returncode, 1)
            self.assertIn("differs from computed source payload", res.stderr)
            self.assertEqual(out_file.stat().st_mtime_ns, mtime_before)

    def test_check_mode_fails_on_missing_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_file = Path(temp_dir) / "nonexistent.json"
            res = self.run_cli(SAMPLE_CSV, out_file, check=True)
            self.assertEqual(res.returncode, 1)
            self.assertIn("does not exist", res.stderr)
            self.assertFalse(out_file.exists())

    def test_sentinel_and_quality_filtering(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "test.csv"
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                "100,10.0,750.0,800.0,775.0,-70.0,-20.0,-45.0,200.0,0\n"
                "101,10.5,-9999.0,-9999.0,-9999.0,-9999.0,-9999.0,-9999.0,-9999.0,2\n"
                "102,11.0,760.0,810.0,785.0,-68.0,-18.0,-43.0,210.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 0)

            data = json.loads(out_file.read_text(encoding="utf-8"))
            self.assertEqual(data["sampleAudit"]["totalInputRows"], 3)
            self.assertEqual(data["sampleAudit"]["includedRows"], 2)
            self.assertEqual(data["sampleAudit"]["excludedRows"], 1)
            self.assertEqual(data["quantities"][0]["mean"], 780.0)

    def test_missing_source_fails_cleanly(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_file = Path(temp_dir) / "out.json"
            res = self.run_cli(Path(temp_dir) / "missing.csv", out_file)
            self.assertEqual(res.returncode, 1)
            self.assertIn("Source file does not exist", res.stderr)
            self.assertNotIn("Traceback", res.stderr)
            self.assertFalse(out_file.exists())

    def test_malformed_csv_fails_cleanly(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "bad.csv"
            csv_path.write_text("not_a_valid,csv_header\n1,2\n", encoding="utf-8")
            out_file = Path(temp_dir) / "out.json"
            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 1)
            self.assertIn("missing required columns", res.stderr)
            self.assertNotIn("Traceback", res.stderr)
            self.assertFalse(out_file.exists())

    def test_atomic_write_preserves_existing_file_on_failure(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_file = Path(temp_dir) / "out.json"
            sentinel_bytes = b"PRE_EXISTING_BYTES\n"
            out_file.write_bytes(sentinel_bytes)
            mtime_before = out_file.stat().st_mtime_ns

            bad_csv = Path(temp_dir) / "corrupt.csv"
            bad_csv.write_text("sol,ls_deg\n1,2\n", encoding="utf-8")
            res = self.run_cli(bad_csv, out_file)
            self.assertEqual(res.returncode, 1)
            self.assertEqual(out_file.read_bytes(), sentinel_bytes)
            self.assertEqual(out_file.stat().st_mtime_ns, mtime_before)

    # -----------------------------------------------------------------------
    # R2: Source/output alias guard regressions
    # -----------------------------------------------------------------------

    def test_output_aliasing_source_fails_and_preserves_source(self):
        """R2: Passing identical source and output path exits 1 and preserves source bytes."""
        with tempfile.TemporaryDirectory() as temp_dir:
            src_csv = Path(temp_dir) / "input.csv"
            original_bytes = SAMPLE_CSV.read_bytes()
            src_csv.write_bytes(original_bytes)
            mtime_before = src_csv.stat().st_mtime_ns

            # Run with --source and --output pointing to the exact same file
            res = self.run_cli(src_csv, src_csv)
            self.assertEqual(res.returncode, 1)
            self.assertIn("aliases source input", res.stderr)
            self.assertNotIn("Traceback", res.stderr)
            self.assertEqual(src_csv.read_bytes(), original_bytes)
            self.assertEqual(src_csv.stat().st_mtime_ns, mtime_before)

    def test_output_aliasing_source_relative_path_fails(self):
        """R2: Passing source and output with equivalent relative paths is rejected."""
        with tempfile.TemporaryDirectory() as temp_dir:
            src_csv = Path(temp_dir) / "input.csv"
            original_bytes = SAMPLE_CSV.read_bytes()
            src_csv.write_bytes(original_bytes)

            alt_path = Path(temp_dir) / "." / "input.csv"
            res = self.run_cli(src_csv, alt_path)
            self.assertEqual(res.returncode, 1)
            self.assertIn("aliases source input", res.stderr)
            self.assertEqual(src_csv.read_bytes(), original_bytes)

    # -----------------------------------------------------------------------
    # R3: Finite number and consistent range regressions
    # -----------------------------------------------------------------------

    def test_nan_input_rejected_and_preserves_destination(self):
        """R3: NaN float in CSV is rejected with exit 1 and does not replace destination."""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "nan.csv"
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                "100,10.0,750.0,800.0,nan,-70.0,-20.0,-45.0,200.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            sentinel_bytes = b'{"sentinel": true}\n'
            out_file.write_bytes(sentinel_bytes)
            mtime_before = out_file.stat().st_mtime_ns

            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 1)
            self.assertIn("Non-finite value", res.stderr)
            self.assertNotIn("Traceback", res.stderr)
            self.assertEqual(out_file.read_bytes(), sentinel_bytes)
            self.assertEqual(out_file.stat().st_mtime_ns, mtime_before)

    def test_infinity_input_rejected_and_preserves_destination(self):
        """R3: Infinity float in CSV is rejected with exit 1 and does not replace destination."""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "inf.csv"
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                "100,10.0,750.0,800.0,inf,-70.0,-20.0,-45.0,200.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            sentinel_bytes = b'{"sentinel": true}\n'
            out_file.write_bytes(sentinel_bytes)
            mtime_before = out_file.stat().st_mtime_ns

            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 1)
            self.assertIn("Non-finite value", res.stderr)
            self.assertNotIn("Traceback", res.stderr)
            self.assertEqual(out_file.read_bytes(), sentinel_bytes)
            self.assertEqual(out_file.stat().st_mtime_ns, mtime_before)

    def test_overflow_input_rejected_and_preserves_destination(self):
        """R3: Overflow float (1e309) in CSV is rejected with exit 1."""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "overflow.csv"
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                "100,10.0,750.0,800.0,1e309,-70.0,-20.0,-45.0,200.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            sentinel_bytes = b'{"sentinel": true}\n'
            out_file.write_bytes(sentinel_bytes)

            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 1)
            self.assertIn("Non-finite value", res.stderr)
            self.assertEqual(out_file.read_bytes(), sentinel_bytes)

    def test_inconsistent_min_mean_max_rejected_and_preserves_destination(self):
        """R3: Inconsistent min > mean or mean > max is rejected with exit 1."""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "inconsistent.csv"
            # min=1000, mean=10, max=1 -> min > mean and mean > max
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                "100,10.0,1000.0,1.0,10.0,-70.0,-20.0,-45.0,200.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            sentinel_bytes = b'{"sentinel": true}\n'
            out_file.write_bytes(sentinel_bytes)

            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 1)
            self.assertIn("Inconsistent pressure interval", res.stderr)
            self.assertNotIn("Traceback", res.stderr)
            self.assertEqual(out_file.read_bytes(), sentinel_bytes)

    # -----------------------------------------------------------------------
    # R4: Independent quantity quality/counts and legitimate zero regressions
    # -----------------------------------------------------------------------

    def test_legitimate_zero_radiation_preserved(self):
        """R4: A valid measurement of 0.0 radiation is preserved and not treated as sentinel."""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "zero_rad.csv"
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                "100,10.0,750.0,800.0,775.0,-70.0,-20.0,-45.0,0.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 0, res.stderr)

            data = json.loads(out_file.read_text(encoding="utf-8"))
            rad_qty = [q for q in data["quantities"] if q["id"] == "surface-radiation-dose-rate"][0]
            self.assertEqual(rad_qty["sampleCount"], 1)
            self.assertEqual(rad_qty["mean"], 0.0)
            self.assertEqual(rad_qty["min"], 0.0)
            self.assertEqual(rad_qty["max"], 0.0)
            self.assertEqual(rad_qty["qualityStatus"], "illustrative-sample")

    def test_per_quantity_independent_sentinel_handling(self):
        """R4: Sentinel in one quantity does not discard another quantity on the same sol."""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "independent.csv"
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                # Sol 100: valid pressure/temp, sentinel radiation (-9999.0)
                "100,10.0,750.0,800.0,775.0,-70.0,-20.0,-45.0,-9999.0,0\n"
                # Sol 101: sentinel pressure (-9999.0), valid temp and valid radiation (210.0)
                "101,10.5,-9999.0,-9999.0,-9999.0,-72.0,-22.0,-47.0,210.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 0, res.stderr)

            data = json.loads(out_file.read_text(encoding="utf-8"))
            self.assertEqual(data["sampleAudit"]["includedRows"], 2)

            q_by_id = {q["id"]: q for q in data["quantities"]}
            # Pressure has 1 usable sol (Sol 100), Sol 101 was sentinel
            p = q_by_id["atmospheric-pressure"]
            self.assertEqual(p["sampleCount"], 1)
            self.assertEqual(p["mean"], 775.0)
            self.assertEqual(p["perQuantityAudit"]["includedSolCount"], 1)
            self.assertEqual(p["perQuantityAudit"]["sentinelExcluded"], 1)

            # Temp has 2 usable sols (Sol 100 and Sol 101)
            t = q_by_id["ambient-air-temperature"]
            self.assertEqual(t["sampleCount"], 2)

            # Radiation has 1 usable sol (Sol 101), Sol 100 was sentinel
            r = q_by_id["surface-radiation-dose-rate"]
            self.assertEqual(r["sampleCount"], 1)
            self.assertEqual(r["mean"], 210.0)
            self.assertEqual(r["perQuantityAudit"]["includedSolCount"], 1)
            self.assertEqual(r["perQuantityAudit"]["sentinelExcluded"], 1)


    def test_zero_pressure_and_temp_preserved_as_valid(self):
        """R4: Physical 0.0 values (e.g. 0.0 degC) are preserved and not discarded as sentinels."""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "zeros.csv"
            csv_path.write_text(
                "sol,ls_deg,pressure_min_pa,pressure_max_pa,pressure_mean_pa,temp_air_min_c,temp_air_max_c,temp_air_mean_c,rad_dose_rate_ugy_day,quality_flag\n"
                "100,10.0,700.0,800.0,750.0,-5.0,0.0,-2.5,0.0,0\n",
                encoding="utf-8",
            )
            out_file = Path(temp_dir) / "out.json"
            res = self.run_cli(csv_path, out_file)
            self.assertEqual(res.returncode, 0, res.stderr)

            data = json.loads(out_file.read_text(encoding="utf-8"))
            q_by_id = {q["id"]: q for q in data["quantities"]}
            t = q_by_id["ambient-air-temperature"]
            self.assertEqual(t["max"], 0.0)
            self.assertEqual(t["sampleCount"], 1)
            self.assertEqual(t["perQuantityAudit"]["sentinelExcluded"], 0)

            r = q_by_id["surface-radiation-dose-rate"]
            self.assertEqual(r["mean"], 0.0)
            self.assertEqual(r["sampleCount"], 1)
            self.assertEqual(r["perQuantityAudit"]["sentinelExcluded"], 0)

    def test_rems_confidence_bitmask_parsing_logic(self):
        """R4: Verify exact bitmask logic matches PDS MODRDR6.FMT definitions."""
        from tools.data.extract_rems_observations import parse_rems_confidence_levels, is_valid_measurement

        # Nominal bitmasks:
        # PS: "11" -> byte 1 == '1' (no shadow)
        # AMBIENT: "001XX1111" -> byte 8 == '1' (observation reliable)
        # GTS: "0111" -> byte 1 == '1' (high recalibration quality)
        nominal = parse_rems_confidence_levels("0111", "001XX1111", "11")
        self.assertTrue(nominal["ps_nominal"])
        self.assertTrue(nominal["amb_reliable"])
        self.assertTrue(nominal["gts_nominal"])

        # Degraded/Unreliable bitmasks:
        # PS with shadow effect: "10" (byte 1 == '0')
        # AMBIENT unreliable: "001XX1110" (byte 8 == '0')
        # GTS uncalibrated/sensor offline: "XXXX"
        degraded = parse_rems_confidence_levels("XXXX", "001XX1110", "10")
        self.assertFalse(degraded["ps_nominal"])
        self.assertFalse(degraded["amb_reliable"])
        self.assertFalse(degraded["gts_nominal"])

        # Legitimate 0.0 vs -999.00 sentinel
        self.assertTrue(is_valid_measurement(0.0))
        self.assertTrue(is_valid_measurement(0.00))
        self.assertFalse(is_valid_measurement(-999.00))
        self.assertFalse(is_valid_measurement(-999.0))
        self.assertFalse(is_valid_measurement(-5.0))  # Unphysical Kelvin temperature

    def test_pds_confidence_bitmask_documentation_present(self):
        """R4: Official PDS MODRDR confidence bitmasks are documented and verified in processing.md."""
        proc_doc = Path("docs/data/processing.md")
        self.assertTrue(proc_doc.exists())
        text = proc_doc.read_text(encoding="utf-8")
        self.assertIn("PS_CONFIDENCE_LEVEL", text)
        self.assertIn("AMBIENT_TEMP_CONFIDENCE_LEVEL", text)
        self.assertIn("GTS_CONFIDENCE_LEVEL", text)
        self.assertIn("MODRDR6.FMT", text)


if __name__ == "__main__":
    unittest.main()
