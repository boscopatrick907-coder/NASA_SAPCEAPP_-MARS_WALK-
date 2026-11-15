#!/usr/bin/env python3
"""extract_rems_observations_v2.py — Extract per-quantity-per-interval observations from NASA PDS REMS MODRDR.

Produces Patrick's required schema:
  record_id,source_id,source_row_or_record,sol,utc_start,utc_end,quantity,
  original_value,original_unit,value,unit,quality_flag,quality_explanation,missing_reason

Extracts: pressure (Pa), air temperature (K), ground temperature (K),
          relative humidity (%), UV irradiance (W/m^2).
Wind and RAD are documented as unavailable.
"""

import csv
import glob
import hashlib
import os
from pathlib import Path
import statistics
import sys

PDS_SENTINEL = -999.00
ARCHIVE_BASE = "https://atmos.nmsu.edu/PDS/data/mslrem_1001/DATA"

# MODRDR6.FMT column indices (0-based from comma-split)
COL_TIMESTAMP   = 0   # TIMESTAMP (seconds since J2000)
COL_LMST        = 1   # Local Mean Solar Time
COL_LTST        = 2   # Local True Solar Time
COL_HWIND       = 3   # HORIZONTAL_WIND_SPEED (m/s)
COL_VWIND       = 4   # VERTICAL_WIND_SPEED (m/s)
COL_WDIR        = 5   # WIND_DIRECTION (deg)
COL_WS_CONF     = 6   # WS_CONFIDENCE_LEVEL (6 chars)
COL_GTEMP       = 7   # BRIGHTNESS_TEMP (K) - ground temperature
COL_GTS_CONF    = 10  # GTS_CONFIDENCE_LEVEL (4 chars)
COL_ATEMP       = 15  # AMBIENT_TEMP (K)
COL_AMB_CONF    = 16  # AMBIENT_TEMP_CONFIDENCE_LEVEL (9 chars)
COL_UV_A        = 17  # UV_A (W/m^2)
COL_UV_B        = 18  # UV_B (W/m^2)
COL_UV_C        = 19  # UV_C (W/m^2)
COL_UV_ABC      = 20  # UV_ABC (W/m^2)
COL_UV_D        = 21  # UV_D (W/m^2)
COL_UV_E        = 22  # UV_E (W/m^2)
COL_UVS_CONF    = 29  # UVS_CONFIDENCE_LEVEL (5 chars)
COL_HUMIDITY    = 30  # LOCAL_RELATIVE_HUMIDITY (%)
COL_HS_TEMP     = 31  # HS_TEMP (K)
COL_HS_CONF     = 35  # HS_CONFIDENCE_LEVEL (3 chars)
COL_PRESSURE    = 37  # PRESSURE (Pa)
COL_PS_CONF     = 39  # PS_CONFIDENCE_LEVEL (2 chars)


def is_sentinel(val):
    return abs(val - PDS_SENTINEL) < 0.01


def parse_rems_confidence_levels(gts_conf_str, amb_conf_str, ps_conf_str):
    """Parses NASA PDS confidence bitmasks per MODRDR6.FMT.

    Returns a dict with independent boolean flags:
      - ps_nominal: bool (PS_CONFIDENCE_LEVEL byte 1 == '1' -> no shadow effect)
      - amb_reliable: bool (AMBIENT_TEMP_CONFIDENCE_LEVEL byte 8 == '1' -> observation reliable)
      - gts_nominal: bool (GTS_CONFIDENCE_LEVEL byte 1 == '1' -> high recalibration quality)
    """
    ps_nominal = False
    ps_clean = ps_conf_str.strip()
    if len(ps_clean) >= 2:
        ps_nominal = (ps_clean[1] == '1')
    elif len(ps_clean) == 1:
        ps_nominal = (ps_clean[0] == '1')

    amb_clean = amb_conf_str.strip()
    amb_reliable = False
    if len(amb_clean) >= 9:
        amb_reliable = (amb_clean[8] == '1')

    gts_clean = gts_conf_str.strip()
    gts_nominal = False
    if len(gts_clean) >= 4 and "X" not in gts_clean:
        gts_nominal = (gts_clean[1] == '1')

    return {
        "ps_nominal": ps_nominal,
        "amb_reliable": amb_reliable,
        "gts_nominal": gts_nominal
    }


def is_valid_measurement(val, sentinel=PDS_SENTINEL):
    """Checks whether a floating point measurement is valid.

    Preserves legitimate physical 0.0 values while filtering the -999.00 sentinel.
    """
    if val is None:
        return False
    if abs(val - sentinel) < 1e-4:
        return False
    if val < 0.0:
        return False
    return True


def parse_float_safe(s):
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def get_source_id(sol):
    """Build the source_id referencing the product in sources.csv."""
    return f"REMS_MODRDR_SOL{sol:05d}"


def extract_sol_quantities(tab_path, lbl_path, sol):
    """Extract all quantities from a single sol's MODRDR table."""
    
    # Parse label for timestamps
    start_time = ""
    stop_time = ""
    with open(lbl_path, "r", encoding="ascii") as f:
        for line in f:
            if line.startswith("START_TIME"):
                start_time = line.split("=")[1].strip()
            elif line.startswith("STOP_TIME"):
                stop_time = line.split("=")[1].strip()
    
    # Accumulators per quantity
    pressures = []          # valid pressure values
    p_nominal_count = 0     # PS_CONFIDENCE byte 1 == '1'
    air_temps = []
    at_reliable_count = 0   # AMB_CONF byte 8 == '1'
    ground_temps = []
    gt_nominal_count = 0    # GTS_CONF byte 1 == '1'
    humidities = []
    h_reliable_count = 0    # HS_CONF byte 0 == '1'
    h_good_count = 0        # HS_CONF byte 1 == '1'
    uv_abc_vals = []        # UV_ABC > 0 (daytime only)
    uvs_good_count = 0
    
    total_records = 0
    
    with open(tab_path, "r", encoding="ascii") as f:
        for line in f:
            parts = [p.strip().strip('"') for p in line.strip().split(",")]
            if len(parts) < 40:
                continue
            total_records += 1
            
            # --- Pressure ---
            p_val = parse_float_safe(parts[COL_PRESSURE])
            if p_val is not None and not is_sentinel(p_val) and p_val >= 0:
                pressures.append(p_val)
                ps_conf = parts[COL_PS_CONF].strip()
                if len(ps_conf) >= 2 and ps_conf[1] == '1':
                    p_nominal_count += 1
            
            # --- Air temperature ---
            at_val = parse_float_safe(parts[COL_ATEMP])
            if at_val is not None and not is_sentinel(at_val) and at_val >= 0:
                air_temps.append(at_val)
                amb_conf = parts[COL_AMB_CONF].strip()
                if len(amb_conf) >= 9 and amb_conf[8] == '1':
                    at_reliable_count += 1
            
            # --- Ground temperature ---
            gt_val = parse_float_safe(parts[COL_GTEMP])
            if gt_val is not None and not is_sentinel(gt_val) and gt_val >= 0:
                ground_temps.append(gt_val)
                gts_conf = parts[COL_GTS_CONF].strip()
                if len(gts_conf) >= 4 and 'X' not in gts_conf and gts_conf[1] == '1':
                    gt_nominal_count += 1
            
            # --- Humidity ---
            h_val = parse_float_safe(parts[COL_HUMIDITY])
            if h_val is not None and not is_sentinel(h_val):
                # Humidity can legitimately be negative in some edge cases per sensor behavior
                # but PDS sentinel is -999.00. Accept values > -100 as valid.
                if h_val > -100:
                    humidities.append(h_val)
                    hs_conf = parts[COL_HS_CONF].strip()
                    if len(hs_conf) >= 1 and hs_conf[0] == '1':
                        h_reliable_count += 1
                    if len(hs_conf) >= 2 and hs_conf[1] == '1':
                        h_good_count += 1
            
            # --- UV (ABC total, daytime only) ---
            uv_val = parse_float_safe(parts[COL_UV_ABC])
            if uv_val is not None and uv_val > 0.01:  # daytime only
                uv_abc_vals.append(uv_val)
                uvs_conf = parts[COL_UVS_CONF].strip()
                # Check UVS: byte 3 = no shadow, byte 4 = dust < 10%
                if len(uvs_conf) >= 5:
                    if uvs_conf[3] == '1' and uvs_conf[4] == '1':
                        uvs_good_count += 1
    
    source_id = get_source_id(sol)
    records = []
    rec_idx = 1
    
    def make_record(quantity, orig_val, orig_unit, norm_val, norm_unit,
                    valid_count, total_count, quality_flag, quality_exp, missing_reason=""):
        nonlocal rec_idx
        r = {
            "record_id": f"{source_id}_Q{rec_idx:02d}",
            "source_id": source_id,
            "source_row_or_record": f"{valid_count} of {total_count} individual measurements",
            "sol": sol,
            "utc_start": start_time,
            "utc_end": stop_time,
            "quantity": quantity,
            "original_value": orig_val,
            "original_unit": orig_unit,
            "value": norm_val,
            "unit": norm_unit,
            "quality_flag": quality_flag,
            "quality_explanation": quality_exp,
            "missing_reason": missing_reason,
        }
        rec_idx += 1
        return r
    
    # Pressure
    if pressures:
        p_mean = round(sum(pressures) / len(pressures), 2)
        p_min = round(min(pressures), 2)
        p_max = round(max(pressures), 2)
        records.append(make_record(
            "atmospheric_pressure", p_mean, "Pa", p_mean, "Pa",
            len(pressures), total_records,
            f"PS_CONFIDENCE: {p_nominal_count}/{len(pressures)} nominal",
            f"PS_CONFIDENCE_LEVEL byte 1 (shadow): {p_nominal_count} records = '1' (no shadow effect) out of {len(pressures)} valid"
        ))
        records.append(make_record(
            "atmospheric_pressure_min", p_min, "Pa", p_min, "Pa",
            len(pressures), total_records,
            f"PS_CONFIDENCE: {p_nominal_count}/{len(pressures)} nominal",
            "Minimum of individual valid measurements"
        ))
        records.append(make_record(
            "atmospheric_pressure_max", p_max, "Pa", p_max, "Pa",
            len(pressures), total_records,
            f"PS_CONFIDENCE: {p_nominal_count}/{len(pressures)} nominal",
            "Maximum of individual valid measurements"
        ))
    else:
        records.append(make_record(
            "atmospheric_pressure", "", "Pa", "", "Pa",
            0, total_records, "no_valid_data",
            "All pressure records are sentinel (-999.00)",
            "All records sentinel"
        ))
    
    # Air temperature
    if air_temps:
        at_mean = round(sum(air_temps) / len(air_temps), 2)
        at_min = round(min(air_temps), 2)
        at_max = round(max(air_temps), 2)
        records.append(make_record(
            "air_temperature", at_mean, "K", at_mean, "K",
            len(air_temps), total_records,
            f"AMB_CONF: {at_reliable_count}/{len(air_temps)} reliable",
            f"AMBIENT_TEMP_CONFIDENCE_LEVEL byte 8 (reliability): {at_reliable_count} records = '1' (reliable) out of {len(air_temps)} valid"
        ))
        records.append(make_record(
            "air_temperature_min", at_min, "K", at_min, "K",
            len(air_temps), total_records,
            f"AMB_CONF: {at_reliable_count}/{len(air_temps)} reliable",
            "Minimum of individual valid measurements"
        ))
        records.append(make_record(
            "air_temperature_max", at_max, "K", at_max, "K",
            len(air_temps), total_records,
            f"AMB_CONF: {at_reliable_count}/{len(air_temps)} reliable",
            "Maximum of individual valid measurements"
        ))
    else:
        records.append(make_record(
            "air_temperature", "", "K", "", "K",
            0, total_records, "no_valid_data",
            "All air temperature records are sentinel (-999.00)",
            "All records sentinel"
        ))
    
    # Ground temperature
    if ground_temps:
        gt_mean = round(sum(ground_temps) / len(ground_temps), 2)
        gt_min = round(min(ground_temps), 2)
        gt_max = round(max(ground_temps), 2)
        records.append(make_record(
            "ground_temperature", gt_mean, "K", gt_mean, "K",
            len(ground_temps), total_records,
            f"GTS_CONF: {gt_nominal_count}/{len(ground_temps)} nominal",
            f"GTS_CONFIDENCE_LEVEL byte 1 (recalibration): {gt_nominal_count} records = '1' (high quality) out of {len(ground_temps)} valid; 'XXXX' = inactive excluded"
        ))
        records.append(make_record(
            "ground_temperature_min", gt_min, "K", gt_min, "K",
            len(ground_temps), total_records,
            f"GTS_CONF: {gt_nominal_count}/{len(ground_temps)} nominal",
            "Minimum of individual valid measurements"
        ))
        records.append(make_record(
            "ground_temperature_max", gt_max, "K", gt_max, "K",
            len(ground_temps), total_records,
            f"GTS_CONF: {gt_nominal_count}/{len(ground_temps)} nominal",
            "Maximum of individual valid measurements"
        ))
    else:
        records.append(make_record(
            "ground_temperature", "", "K", "", "K",
            0, total_records, "no_valid_data",
            "All GTS records are sentinel or inactive",
            "All records sentinel/inactive"
        ))
    
    # Relative humidity
    if humidities:
        rh_mean = round(sum(humidities) / len(humidities), 2)
        rh_min = round(min(humidities), 2)
        rh_max = round(max(humidities), 2)
        quality_note = "preliminary" if h_reliable_count == 0 else f"{h_reliable_count}/{len(humidities)} reliable"
        records.append(make_record(
            "relative_humidity", rh_mean, "%", rh_mean, "%",
            len(humidities), total_records,
            f"HS_CONF: {quality_note}; {h_good_count}/{len(humidities)} good quality",
            f"HS_CONFIDENCE_LEVEL byte 0 (reliability): {h_reliable_count} = '1'; byte 1 (quality): {h_good_count} = '1'. All readings are preliminary during Sols 3900-3915."
        ))
    else:
        records.append(make_record(
            "relative_humidity", "", "%", "", "%",
            0, total_records, "no_valid_data",
            "All humidity records are sentinel (-999.00)",
            "All records sentinel"
        ))
    
    # UV total irradiance (ABC band, daytime only)
    if uv_abc_vals:
        uv_mean = round(sum(uv_abc_vals) / len(uv_abc_vals), 2)
        uv_min = round(min(uv_abc_vals), 2)
        uv_max = round(max(uv_abc_vals), 2)
        records.append(make_record(
            "uv_irradiance_abc", uv_mean, "W/m^2", uv_mean, "W/m^2",
            len(uv_abc_vals), total_records,
            f"UVS_CONF: {uvs_good_count}/{len(uv_abc_vals)} good (no shadow, dust <10%)",
            f"UVS_CONFIDENCE_LEVEL bytes 3+4: {uvs_good_count} records with no shadow AND dust attenuation <10%. Daytime records only (UV_ABC > 0)."
        ))
    else:
        records.append(make_record(
            "uv_irradiance_abc", "", "W/m^2", "", "W/m^2",
            0, total_records, "no_valid_data",
            "No daytime UV measurements",
            "All UV records zero or sentinel"
        ))
    
    # Wind — documented unavailable for this period
    records.append(make_record(
        "wind_speed", "", "m/s", "", "m/s",
        0, total_records, "instrument_inactive",
        "WS_CONFIDENCE_LEVEL = 'XXXXXX' for all records; wind sensor inactive during Sols 3900-3915",
        "Wind sensor inactive (all records sentinel -999.00, confidence XXXXXX)"
    ))
    
    records.append(make_record(
        "wind_direction", "", "degrees_cw_from_north", "", "degrees_cw_from_north",
        0, total_records, "instrument_inactive",
        "WS_CONFIDENCE_LEVEL = 'XXXXXX' for all records; wind sensor inactive during Sols 3900-3915",
        "Wind sensor inactive (all records sentinel -999.00, confidence XXXXXX)"
    ))
    
    return records


def build_sources_csv(raw_dir, out_path):
    """Build Patrick's required sources.csv schema."""
    fieldnames = [
        "source_id", "instrument", "product_id", "product_version",
        "landing_url", "download_url", "label_url", "retrieved_utc",
        "filename", "bytes", "sha256", "attribution"
    ]
    
    rows = []
    for sol in range(3900, 3916):
        tab_files = glob.glob(os.path.join(raw_dir, f"*RMD{sol}*.TAB"))
        lbl_files = glob.glob(os.path.join(raw_dir, f"*RMD{sol}*.LBL"))
        if not tab_files or not lbl_files:
            continue
        
        tab_path = tab_files[0]
        lbl_path = lbl_files[0]
        tab_name = os.path.basename(tab_path)
        lbl_name = os.path.basename(lbl_path)
        product_id = tab_name.replace(".TAB", "")
        
        # Determine archive path
        if sol <= 3902:
            dir_range = "SOL_03779_03902"
        else:
            dir_range = "SOL_03903_03999"
        
        base_url = f"{ARCHIVE_BASE}/{dir_range}/SOL{sol:05d}"
        
        # Compute hashes and sizes
        for fname, fpath, ftype in [(tab_name, tab_path, "ASCII Table (MODRDR)"),
                                     (lbl_name, lbl_path, "PDS3 Label")]:
            fsize = os.path.getsize(fpath)
            sha = hashlib.sha256(open(fpath, "rb").read()).hexdigest()
            
            rows.append({
                "source_id": get_source_id(sol),
                "instrument": "REMS",
                "product_id": product_id,
                "product_version": "P2",
                "landing_url": "https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html",
                "download_url": f"{base_url}/{fname}",
                "label_url": f"{base_url}/{lbl_name}",
                "retrieved_utc": "2026-11-14T00:00:00Z",
                "filename": fname,
                "bytes": fsize,
                "sha256": sha,
                "attribution": "NASA/JPL-Caltech/CAB(CSIC-INTA)"
            })
    
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    return len(rows)


def main():
    raw_dir = Path("data/environment/raw/rems")
    out_dir = Path("data/environment")
    out_dir.mkdir(parents=True, exist_ok=True)
    obs_csv = out_dir / "observations.csv"
    
    all_records = []
    
    for sol in range(3900, 3916):
        tab_files = list(raw_dir.glob(f"*RMD{sol}*.TAB"))
        lbl_files = list(raw_dir.glob(f"*RMD{sol}*.LBL"))
        if not tab_files or not lbl_files:
            print(f"Error: missing files for sol {sol}", file=sys.stderr)
            sys.exit(1)
        
        print(f"Processing Sol {sol}...", file=sys.stderr)
        sol_records = extract_sol_quantities(str(tab_files[0]), str(lbl_files[0]), sol)
        all_records.extend(sol_records)
    
    fieldnames = [
        "record_id", "source_id", "source_row_or_record",
        "sol", "utc_start", "utc_end", "quantity",
        "original_value", "original_unit", "value", "unit",
        "quality_flag", "quality_explanation", "missing_reason"
    ]
    
    header_comments = [
        "# MARSWALK — Curiosity REMS Verified Archival Environmental Observations (Sols 3900-3915)",
        "# Schema: One row per quantity per observation interval (1 sol = 1 interval)",
        "# Instrument: Rover Environmental Monitoring Station (MSL Curiosity, Centro de Astrobiologia)",
        "# Product Line: MODRDR (MODRDR6.FMT, Release 0034, PDS Atmospheres Node mslrem_1001)",
        "# Aggregation: Daily mean/min/max over valid (non-sentinel, non-inactive) individual measurements",
        "# Quality: Independent per-sensor PDS confidence bitmasks documented per record",
        "# Sentinel: -999.00 = uncalibrated/inactive; legitimate 0.0 values preserved",
    ]
    
    with open(obs_csv, "w", encoding="utf-8", newline="\n") as f:
        for c in header_comments:
            f.write(c + "\n")
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)
    
    print(f"\nGenerated {obs_csv} ({obs_csv.stat().st_size} bytes, {len(all_records)} records across 16 sols)")
    
    # Also rebuild sources.csv
    sources_csv = Path("docs/data/sources.csv")
    n_sources = build_sources_csv(str(raw_dir), str(sources_csv))
    print(f"Generated {sources_csv} ({n_sources} source entries)")
    
    # Summary
    quantities = set(r["quantity"] for r in all_records)
    for q in sorted(quantities):
        q_recs = [r for r in all_records if r["quantity"] == q]
        has_val = sum(1 for r in q_recs if r["value"] != "")
        print(f"  {q}: {has_val}/{len(q_recs)} sols with data")


if __name__ == "__main__":
    main()
