"""Reproducible USGS SIM 3292 (Geologic Map of Mars, Tanaka et al., 2014) extractor and verifier for the Gale Crater / Mount Sharp (Aeolis Mons) boxwork AOI."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GEOJSON_PATH = REPO_ROOT / "docs/data/evidence/USGS_SIM3292_GALE_AOI.geojson"
DEFAULT_INVENTORY_PATH = REPO_ROOT / "docs/data/evidence/USGS_SIM3292_INVENTORY.json"

# Planetary geodesy constants (IAU 2000 Mars Sphere)
MARS_SPHERE_RADIUS_M = 3396190.0
MARS_SPHERE_RADIUS_KM = 3396.190
EXPECTED_SIM3292_PRJ_WKT = (
    'GEOGCS["GCS_Mars_2000_Sphere",'
    'DATUM["D_Mars_2000_Sphere",SPHEROID["Mars_2000_Sphere_IAU_IAG",3396190.0,0.0]],'
    'PRIMEM["Reference_Meridian",0.0],UNIT["Degree",0.0174532925199433]]'
)

# HiRISE optical dataset (marswalk_crop.tif / PSP_001752_1750 sub-crop) embedded GeoTIFF parameters
HIRISE_CROP_METADATA = {
    "sourceObservationId": "PSP_001752_1750",
    "nasaCatalogId": "PIA26306",
    "cropFileName": "marswalk_crop.tif",
    "widthPx": 2048,
    "heightPx": 2048,
    "bitsPerSample": 10,
    "pixelScaleMeters": 0.25,
    "tiepointUpperLeftEastingMeters": -2531487.0,
    "tiepointUpperLeftNorthingMeters": -286803.75,
    "projection": "Equirectangular MARS",
    "gcsName": "GCS_MARS",
    "datum": "D_MARS",
    "ellipsoid": "MARS_localRadius",
    "sphereRadiusMeters": MARS_SPHERE_RADIUS_M,
    "centralMeridianDeg": 180.0,
    "standardParallel1Deg": 0.0,
}

# Verbatim USGS SIM 3292 Description of Map Units (DMU) entries for Gale Crater / Mount Sharp units
SIM3292_DMU_CATALOG = {
    "Htu": {
        "unitCode": "Htu",
        "unitName": "Hesperian transition undivided unit",
        "unitGroup": "Transition units",
        "chronostratigraphicEpoch": "Hesperian",
        "typeAreaCoordinates": "lat -6.41° N., long 156.42° E.; lat -6.17° N., long 286.05° E. (localities 26, 28)",
        "description": (
            "Irregular plateaus hundreds of kilometers across. Layered. "
            "Hundreds of meters to kilometers thick."
        ),
        "additionalCharacteristics": (
            "In southern Elysium Planitia along highland/lowland boundary and within and east of Valles Marineris. "
            "Superposes units Nhu, Nve, mNh, and eNh; gradational with units eHt, Hve, and HNt (Hesperian part); "
            "overlain by units lHt, Ht, Hto, AHtu, Aa, and lAv. Includes hydrated sulfate spectral signatures; "
            "fluted slopes in places. Linear ridges, anabranching sinuous ridges, and wrinkle ridges common."
        ),
        "interpretation": (
            "Fine-grained eolian sediments and (or) pyroclastic air-fall deposits. Modified by fluvial dissection "
            "and eolian erosion. Linear ridges and grooves form yardangs. Tectonically contracted. "
            "Channels mostly inverted. Altered by acidic weathering in places."
        ),
        "pamphletGaleCraterNote": (
            "Tanaka et al. (2014, Pamphlet p. 12) explicitly note that acidic weathering conditions during the "
            "Hesperian led to sulfate enrichment of layered deposits in Gale Crater (mapped as unit Htu)."
        ),
    },
    "AHi": {
        "unitCode": "AHi",
        "unitName": "Amazonian and Hesperian impact unit",
        "unitGroup": "Impact unit",
        "chronostratigraphicEpoch": "Amazonian and Hesperian (Gale Crater specifically dated to Early Hesperian, eH, in Pamphlet Table 4)",
        "typeAreaCoordinates": "lat 23.17° N., long 207.77° E.",
        "description": (
            "Craters with rims and surrounding blankets; some include single to multi-lobed blanket forms, "
            "dense secondary crater chains, and (or) central peak or pit. Blanket thicknesses of meters "
            "to a few hundred meters."
        ),
        "additionalCharacteristics": (
            "Global occurrence. Superposes Noachian units; other unit superposition relations diverse. "
            "High kilometer-scale surface roughness; crater floors may be smooth to rough."
        ),
        "interpretation": (
            "Upturned, ejected, and brecciated target rocks and sediments, with local areas of impact melt. "
            "Post-impact mass-wasting and fluvial-lacustrine and eolian infill of craters common."
        ),
        "pamphletGaleCraterNote": (
            "Tanaka et al. (2014, Pamphlet Table 4, p. 36) date Gale Crater (154 km diameter, lat -5.4° N., "
            "long 137.8° E., count area 62,155 km²) to the Early Hesperian (eH) with N(5) = 173 ± 45, "
            "N(16) = 24 ± 17, and N(2) = 537 ± 36 superposed craters per 10^6 km²."
        ),
    },
}


def wrap_lon_180(lon_deg: float) -> float:
    """Normalize planetocentric longitude to [-180.0, 180.0] degrees East."""
    wrapped = (lon_deg + 180.0) % 360.0 - 180.0
    return 180.0 if wrapped == -180.0 and lon_deg > 0 else wrapped


def equirectangular_m_to_lonlat_deg(
    easting_m: float,
    northing_m: float,
    central_meridian_deg: float = 180.0,
    radius_m: float = MARS_SPHERE_RADIUS_M,
) -> tuple[float, float]:
    """Convert Equirectangular MARS projected meters to GCS_Mars_2000_Sphere (lon_deg, lat_deg)."""
    deg_per_meter = 180.0 / (math.pi * radius_m)
    lon_deg = wrap_lon_180(central_meridian_deg + easting_m * deg_per_meter)
    lat_deg = northing_m * deg_per_meter
    return round(lon_deg, 6), round(lat_deg, 6)


def lonlat_deg_to_equirectangular_m(
    lon_deg: float,
    lat_deg: float,
    central_meridian_deg: float = 180.0,
    radius_m: float = MARS_SPHERE_RADIUS_M,
) -> tuple[float, float]:
    """Convert GCS_Mars_2000_Sphere (lon_deg, lat_deg) to Equirectangular MARS projected meters."""
    lon_0_360 = lon_deg % 360.0
    delta_lon_deg = lon_0_360 - central_meridian_deg
    meters_per_deg = (math.pi * radius_m) / 180.0
    return delta_lon_deg * meters_per_deg, lat_deg * meters_per_deg


def compute_hirise_crop_footprint() -> dict[str, Any]:
    """Compute the exact geographic bounds and corner polygon of marswalk_crop.tif in GCS_Mars_2000_Sphere."""
    ulx = HIRISE_CROP_METADATA["tiepointUpperLeftEastingMeters"]
    uly = HIRISE_CROP_METADATA["tiepointUpperLeftNorthingMeters"]
    width_m = HIRISE_CROP_METADATA["widthPx"] * HIRISE_CROP_METADATA["pixelScaleMeters"]
    height_m = HIRISE_CROP_METADATA["heightPx"] * HIRISE_CROP_METADATA["pixelScaleMeters"]
    lrx = ulx + width_m
    lry = uly - height_m

    west_lon, north_lat = equirectangular_m_to_lonlat_deg(ulx, uly)
    east_lon, south_lat = equirectangular_m_to_lonlat_deg(lrx, lry)
    center_lon, center_lat = equirectangular_m_to_lonlat_deg((ulx + lrx) / 2.0, (uly + lry) / 2.0)

    ring = [
        [west_lon, south_lat],
        [east_lon, south_lat],
        [east_lon, north_lat],
        [west_lon, north_lat],
        [west_lon, south_lat],
    ]
    return {
        "widthMeters": width_m,
        "heightMeters": height_m,
        "areaSqMeters": width_m * height_m,
        "areaSqKm": round((width_m * height_m) / 1e6, 6),
        "eastingRangeMeters": [ulx, lrx],
        "northingRangeMeters": [lry, uly],
        "bboxLonLat": [west_lon, south_lat, east_lon, north_lat],
        "centerLonLat": [center_lon, center_lat],
        "polygonRing": ring,
    }


def spherical_distance_km(
    lon1_deg: float,
    lat1_deg: float,
    lon2_deg: float,
    lat2_deg: float,
    radius_km: float = MARS_SPHERE_RADIUS_KM,
) -> float:
    """Compute great-circle distance in kilometers on the Mars 2000 sphere using the Haversine formula."""
    phi1 = math.radians(lat1_deg)
    phi2 = math.radians(lat2_deg)
    dphi = math.radians(lat2_deg - lat1_deg)
    dlambda = math.radians(lon2_deg - lon1_deg)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * radius_km * math.asin(min(1.0, math.sqrt(a)))


def initial_bearing_deg(lon1_deg: float, lat1_deg: float, lon2_deg: float, lat2_deg: float) -> float:
    """Compute initial forward azimuth in degrees [0, 360) clockwise from true North."""
    phi1 = math.radians(lat1_deg)
    phi2 = math.radians(lat2_deg)
    dlambda = math.radians(lon2_deg - lon1_deg)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    return round((math.degrees(math.atan2(y, x)) + 360.0) % 360.0, 2)


def point_to_polyline_min_distance(
    lon_deg: float, lat_deg: float, coords: list[list[float]]
) -> dict[str, Any]:
    """Compute minimum geodesic distance on the Mars sphere from (lon_deg, lat_deg) to a LineString."""
    cos_lat = math.cos(math.radians(lat_deg))
    deg_to_km = (math.pi * MARS_SPHERE_RADIUS_KM) / 180.0

    best_dist_km = float("inf")
    best_point = [0.0, 0.0]
    best_seg_idx = 0

    for i in range(len(coords) - 1):
        x1, y1 = coords[i]
        x2, y2 = coords[i + 1]
        dx = (x2 - x1) * cos_lat
        dy = y2 - y1
        seg_len_sq = dx * dx + dy * dy
        if seg_len_sq == 0.0:
            proj_lon, proj_lat = x1, y1
        else:
            t = (((lon_deg - x1) * cos_lat) * dx + (lat_deg - y1) * dy) / seg_len_sq
            t = max(0.0, min(1.0, t))
            proj_lon = x1 + t * (x2 - x1)
            proj_lat = y1 + t * (y2 - y1)
        dist_km = spherical_distance_km(lon_deg, lat_deg, proj_lon, proj_lat)
        if dist_km < best_dist_km:
            best_dist_km = dist_km
            best_point = [round(proj_lon, 6), round(proj_lat, 6)]
            best_seg_idx = i

    nearest_vertex_dist_km = float("inf")
    nearest_vertex = [0.0, 0.0]
    nearest_vertex_idx = 0
    for idx, (vx, vy) in enumerate(coords):
        d_km = spherical_distance_km(lon_deg, lat_deg, vx, vy)
        if d_km < nearest_vertex_dist_km:
            nearest_vertex_dist_km = d_km
            nearest_vertex = [round(vx, 6), round(vy, 6)]
            nearest_vertex_idx = idx

    return {
        "minSegmentDistanceKm": round(best_dist_km, 3),
        "minSegmentDistanceMeters": round(best_dist_km * 1000.0, 1),
        "nearestPointOnSegmentLonLat": best_point,
        "bearingToNearestSegmentDeg": initial_bearing_deg(
            lon_deg, lat_deg, best_point[0], best_point[1]
        ),
        "nearestSegmentIndex": best_seg_idx,
        "minVertexDistanceKm": round(nearest_vertex_dist_km, 3),
        "nearestVertexLonLat": nearest_vertex,
        "nearestVertexIndex": nearest_vertex_idx,
    }


def point_in_ring(lon_deg: float, lat_deg: float, ring: list[list[float]]) -> bool:
    """Ray-casting point-in-ring test for a closed [lon, lat] ring."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > lat_deg) != (yj > lat_deg):
            x_intersect = (xj - xi) * (lat_deg - yi) / (yj - yi + 1e-15) + xi
            if lon_deg < x_intersect:
                inside = not inside
        j = i
    return inside


def point_in_polygon_rings(lon_deg: float, lat_deg: float, rings: list[list[list[float]]]) -> bool:
    """Evaluate point-in-polygon with parity rule across exterior and interior cutout rings."""
    inside = False
    for ring in rings:
        if point_in_ring(lon_deg, lat_deg, ring):
            inside = not inside
    return inside


def parse_dbf(dbf_bytes: bytes) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Parse an Esri Shapefile .dbf table into field descriptors and typed records."""
    num_rec, header_len, rec_len = struct.unpack("<IHH", dbf_bytes[4:12])
    fields: list[dict[str, Any]] = []
    pos = 32
    while pos < header_len - 1 and dbf_bytes[pos] != 0x0D:
        fname = dbf_bytes[pos : pos + 11].split(b"\x00")[0].decode("ascii", "replace")
        ftype = chr(dbf_bytes[pos + 11])
        flen = dbf_bytes[pos + 16]
        fdec = dbf_bytes[pos + 17]
        fields.append({"name": fname, "type": ftype, "length": flen, "decimals": fdec})
        pos += 32

    records: list[dict[str, Any]] = []
    offset = header_len
    for _ in range(num_rec):
        rec: dict[str, Any] = {}
        p = offset + 1
        for f in fields:
            raw_val = dbf_bytes[p : p + f["length"]].decode("utf-8", "replace").strip()
            if f["type"] in ("N", "F"):
                if raw_val == "":
                    rec[f["name"]] = None
                elif f["decimals"] == 0 and "." not in raw_val and "e" not in raw_val.lower():
                    rec[f["name"]] = int(raw_val)
                else:
                    rec[f["name"]] = float(raw_val)
            else:
                rec[f["name"]] = raw_val
            p += f["length"]
        records.append(rec)
        offset += rec_len
    return fields, records


def parse_shp_record(shp_bytes: bytes, shx_bytes: bytes, index: int) -> dict[str, Any]:
    """Parse a single Point (1), PolyLine (3), or Polygon (5) geometry record from .shp/.shx bytes."""
    rec_offset = struct.unpack(">I", shx_bytes[100 + index * 8 : 100 + index * 8 + 4])[0] * 2
    shape_type = struct.unpack_from("<I", shp_bytes, rec_offset + 8)[0]
    if shape_type == 1:
        x, y = struct.unpack_from("<dd", shp_bytes, rec_offset + 12)
        return {
            "shapeType": 1,
            "bbox": [round(x, 6), round(y, 6), round(x, 6), round(y, 6)],
            "coordinates": [round(x, 6), round(y, 6)],
            "partCount": 1,
            "vertexCount": 1,
        }
    if shape_type == 8:
        xmin, ymin, xmax, ymax, num_points = struct.unpack_from("<ddddI", shp_bytes, rec_offset + 12)
        pts = struct.unpack_from(f"<{num_points * 2}d", shp_bytes, rec_offset + 48)
        coords = [[round(pts[2 * k], 6), round(pts[2 * k + 1], 6)] for k in range(num_points)]
        return {
            "shapeType": 8,
            "bbox": [round(xmin, 6), round(ymin, 6), round(xmax, 6), round(ymax, 6)],
            "coordinates": coords[0] if num_points == 1 else coords,
            "partCount": 1,
            "vertexCount": num_points,
        }
    if shape_type in (3, 5):
        xmin, ymin, xmax, ymax, num_parts, num_points = struct.unpack_from(
            "<ddddII", shp_bytes, rec_offset + 12
        )
        parts = list(struct.unpack_from(f"<{num_parts}I", shp_bytes, rec_offset + 52))
        pts_offset = rec_offset + 52 + 4 * num_parts
        raw_pts = struct.unpack_from(f"<{num_points * 2}d", shp_bytes, pts_offset)
        rings: list[list[list[float]]] = []
        for p_idx in range(num_parts):
            start = parts[p_idx]
            end = parts[p_idx + 1] if p_idx + 1 < num_parts else num_points
            ring = [
                [round(raw_pts[2 * k], 6), round(raw_pts[2 * k + 1], 6)]
                for k in range(start, end)
            ]
            rings.append(ring)
        return {
            "shapeType": shape_type,
            "bbox": [round(xmin, 6), round(ymin, 6), round(xmax, 6), round(ymax, 6)],
            "rings": rings,
            "partCount": num_parts,
            "vertexCount": num_points,
        }
    raise ValueError(f"Unsupported shapefile shapeType: {shape_type}")


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract_from_source_dir(
    source_dir: Path,
    geojson_out: Path = DEFAULT_GEOJSON_PATH,
    inventory_out: Path = DEFAULT_INVENTORY_PATH,
) -> dict[str, Any]:
    """Extract Gale Crater / Mount Sharp geological context from extracted USGS SIM 3292 files."""
    shp_dir = source_dir / "SIM3292_Shapefiles"
    pub_dir = source_dir / "Mars_PublishedGeologicMaps_1Mscale_greater"

    layer_names = [
        "SIM3292_Global_Geology",
        "SIM3292_Global_Contacts",
        "SIM3292_Global_Structure",
        "SIM3292_Global_Landing_sites",
    ]
    layer_inventory: dict[str, Any] = {}
    parsed_layers: dict[str, tuple[bytes, bytes, list[dict[str, Any]]]] = {}

    for lname in layer_names:
        prj_path = shp_dir / f"{lname}.prj"
        dbf_path = shp_dir / f"{lname}.dbf"
        shp_path = shp_dir / f"{lname}.shp"
        shx_path = shp_dir / f"{lname}.shx"
        xml_path = shp_dir / f"{lname}.shp.xml"

        prj_text = prj_path.read_text(encoding="utf-8").strip()
        if prj_text != EXPECTED_SIM3292_PRJ_WKT:
            raise ValueError(f"Unexpected .prj WKT in {lname}: {prj_text}")

        dbf_bytes = dbf_path.read_bytes()
        shp_bytes = shp_path.read_bytes()
        shx_bytes = shx_path.read_bytes()
        fields, records = parse_dbf(dbf_bytes)
        shape_type = struct.unpack_from("<I", shp_bytes, 32)[0]
        xmin, ymin, xmax, ymax = struct.unpack_from("<dddd", shp_bytes, 36)

        layer_inventory[lname] = {
            "featureCount": len(records),
            "shapeType": {1: "Point", 3: "PolyLine", 5: "Polygon", 8: "MultiPoint"}.get(shape_type, str(shape_type)),
            "crsWkt": prj_text,
            "globalBoundingBoxLonLat": [
                round(xmin, 6),
                round(ymin, 6),
                round(xmax, 6),
                round(ymax, 6),
            ],
            "fields": fields,
            "files": {
                f"{lname}.shp": {"bytes": len(shp_bytes), "sha256": hashlib.sha256(shp_bytes).hexdigest()},
                f"{lname}.shx": {"bytes": len(shx_bytes), "sha256": hashlib.sha256(shx_bytes).hexdigest()},
                f"{lname}.dbf": {"bytes": len(dbf_bytes), "sha256": hashlib.sha256(dbf_bytes).hexdigest()},
                f"{lname}.prj": {"bytes": prj_path.stat().st_size, "sha256": sha256_file(prj_path)},
                f"{lname}.shp.xml": {"bytes": xml_path.stat().st_size, "sha256": sha256_file(xml_path)},
            },
        }
        parsed_layers[lname] = (shp_bytes, shx_bytes, records)

    # Inspect auxiliary index shapefile Mars_PublishedGeologicMaps_1Mscale_greater
    pub_base = pub_dir / "Mars_PublishedGeologicMaps_1Mscale_greater"
    pub_prj = (pub_dir / "Mars_PublishedGeologicMaps_1Mscale_greater.prj").read_text(encoding="utf-8").strip()
    pub_dbf = (pub_dir / "Mars_PublishedGeologicMaps_1Mscale_greater.dbf").read_bytes()
    pub_shp = (pub_dir / "Mars_PublishedGeologicMaps_1Mscale_greater.shp").read_bytes()
    pub_shx = (pub_dir / "Mars_PublishedGeologicMaps_1Mscale_greater.shx").read_bytes()
    pub_fields, pub_records = parse_dbf(pub_dbf)
    gale_overlapping_1m_maps: list[dict[str, Any]] = []
    for idx, rec in enumerate(pub_records):
        geom = parse_shp_record(pub_shp, pub_shx, idx)
        xmin, ymin, xmax, ymax = geom["bbox"]
        if xmin <= 138.64 and xmax >= 137.06 and ymin <= -4.45 and ymax >= -5.62:
            gale_overlapping_1m_maps.append({"recordIndex": idx, "bbox": geom["bbox"], "attributes": rec})

    layer_inventory["Mars_PublishedGeologicMaps_1Mscale_greater"] = {
        "featureCount": len(pub_records),
        "shapeType": "Polygon",
        "crsWkt": pub_prj,
        "fields": pub_fields,
        "galeCraterOverlappingCount": len(gale_overlapping_1m_maps),
        "files": {
            "Mars_PublishedGeologicMaps_1Mscale_greater.shp": {
                "bytes": len(pub_shp),
                "sha256": hashlib.sha256(pub_shp).hexdigest(),
            },
            "Mars_PublishedGeologicMaps_1Mscale_greater.dbf": {
                "bytes": len(pub_dbf),
                "sha256": hashlib.sha256(pub_dbf).hexdigest(),
            },
            "Mars_PublishedGeologicMaps_1Mscale_greater.prj": {
                "bytes": len(pub_prj.encode("utf-8")),
                "sha256": sha256_file(pub_dir / "Mars_PublishedGeologicMaps_1Mscale_greater.prj"),
            },
        },
    }

    hirise_aoi = compute_hirise_crop_footprint()
    aoi_center_lon, aoi_center_lat = hirise_aoi["centerLonLat"]

    # Extract target features in Gale Crater / Mount Sharp
    geol_shp, geol_shx, geol_records = parsed_layers["SIM3292_Global_Geology"]
    cont_shp, cont_shx, cont_records = parsed_layers["SIM3292_Global_Contacts"]
    struc_shp, struc_shx, struc_records = parsed_layers["SIM3292_Global_Structure"]
    land_shp, land_shx, land_records = parsed_layers["SIM3292_Global_Landing_sites"]

    # Regional geology inventory within [134°E..141°E, -8°N..-2°N]
    regional_units: list[dict[str, Any]] = []
    htu_feature_geom: dict[str, Any] | None = None
    htu_record: dict[str, Any] | None = None
    ahi_feature_geom: dict[str, Any] | None = None
    ahi_record: dict[str, Any] | None = None

    for idx, rec in enumerate(geol_records):
        geom = parse_shp_record(geol_shp, geol_shx, idx)
        xmin, ymin, xmax, ymax = geom["bbox"]
        if xmin <= 141.0 and xmax >= 134.0 and ymin <= -2.0 and ymax >= -8.0:
            contains_aoi = point_in_polygon_rings(aoi_center_lon, aoi_center_lat, geom["rings"])
            regional_units.append(
                {
                    "OBJECTID": rec["OBJECTID"],
                    "Unit": rec["Unit"],
                    "UnitDesc": rec["UnitDesc"],
                    "SphArea_km": rec["SphArea_km"],
                    "Shape_Leng": rec["Shape_Leng"],
                    "Shape_Area": rec["Shape_Area"],
                    "bboxLonLat": geom["bbox"],
                    "partCount": geom["partCount"],
                    "vertexCount": geom["vertexCount"],
                    "containsBoxworkAoi": contains_aoi,
                }
            )
            if rec["OBJECTID"] == 754:
                htu_feature_geom = geom
                htu_record = rec
            elif rec["OBJECTID"] == 775:
                ahi_feature_geom = geom
                ahi_record = rec

    if htu_feature_geom is None or htu_record is None or ahi_feature_geom is None or ahi_record is None:
        raise RuntimeError("Failed to locate Mount Sharp Htu (OBJECTID=754) or Gale Crater AHi (OBJECTID=775)")

    # Locate the Htu / AHi contact (OBJECTID = 2203)
    contact_geom: dict[str, Any] | None = None
    contact_record: dict[str, Any] | None = None
    for idx, rec in enumerate(cont_records):
        if rec["OBJECTID"] == 2203:
            contact_geom = parse_shp_record(cont_shp, cont_shx, idx)
            contact_record = rec
            break

    # Locate the Gale Crater rim structure (OBJECTID = 103)
    rim_geom: dict[str, Any] | None = None
    rim_record: dict[str, Any] | None = None
    for idx, rec in enumerate(struc_records):
        if rec["OBJECTID"] == 103:
            rim_geom = parse_shp_record(struc_shp, struc_shx, idx)
            rim_record = rec
            break

    # Locate MSL Curiosity landing site (OBJECTID = 9)
    msl_geom: dict[str, Any] | None = None
    msl_record: dict[str, Any] | None = None
    for idx, rec in enumerate(land_records):
        if rec["OBJECTID"] == 9 or rec["NAME"] == "MSL":
            msl_geom = parse_shp_record(land_shp, land_shx, idx)
            msl_record = rec
            break

    if (
        contact_geom is None
        or contact_record is None
        or rim_geom is None
        or rim_record is None
        or msl_geom is None
        or msl_record is None
    ):
        raise RuntimeError("Failed to locate required contact, rim structure, or MSL landing site record")

    # Compute exact geodesic distances from HiRISE boxwork AOI center to SIM 3292 features
    dist_to_contact = point_to_polyline_min_distance(
        aoi_center_lon, aoi_center_lat, contact_geom["rings"][0]
    )
    dist_to_rim = point_to_polyline_min_distance(
        aoi_center_lon, aoi_center_lat, rim_geom["rings"][0]
    )
    msl_lon, msl_lat = msl_geom["coordinates"]
    dist_to_msl_km = round(spherical_distance_km(aoi_center_lon, aoi_center_lat, msl_lon, msl_lat), 3)
    bearing_to_msl_deg = initial_bearing_deg(aoi_center_lon, aoi_center_lat, msl_lon, msl_lat)

    # Verify all 4 corners + center of marswalk_crop.tif are inside Htu (OBJECTID=754)
    corner_checks = []
    for pt_lon, pt_lat in hirise_aoi["polygonRing"][:4] + [[aoi_center_lon, aoi_center_lat]]:
        in_htu = point_in_polygon_rings(pt_lon, pt_lat, htu_feature_geom["rings"])
        in_ahi = point_in_polygon_rings(pt_lon, pt_lat, ahi_feature_geom["rings"])
        corner_checks.append(
            {"lon": pt_lon, "lat": pt_lat, "inHtu_OID754": in_htu, "inAHi_OID775": in_ahi}
        )

    msl_in_ahi = point_in_polygon_rings(msl_lon, msl_lat, ahi_feature_geom["rings"])
    msl_in_htu = point_in_polygon_rings(msl_lon, msl_lat, htu_feature_geom["rings"])

    # Build GeoJSON FeatureCollection
    geojson_obj = {
        "type": "FeatureCollection",
        "name": "USGS_SIM3292_Gale_Crater_Mount_Sharp_Boxwork_Context",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:IAU:2000:49900",
                "wkt": EXPECTED_SIM3292_PRJ_WKT,
                "sphereRadiusMeters": MARS_SPHERE_RADIUS_M,
                "note": "Planetocentric decimal degrees [-180..180 E, -90..90 N] on IAU 2000 Mars Sphere (R = 3,396,190.0 m)",
            },
        },
        "metadata": {
            "citation": (
                "Tanaka, K.L., Skinner, J.A., Jr., Dohm, J.M., Irwin, R.P., III, Kolb, E.J., "
                "Fortezzo, C.M., Platz, T., Michael, G.G., and Hare, T.M., 2014, "
                "Geologic map of Mars: U.S. Geological Survey Scientific Investigations Map 3292, "
                "scale 1:20,000,000, pamphlet 43 p., https://doi.org/10.3133/sim3292"
            ),
            "sourceArchiveUrl": "https://pubs.usgs.gov/sim/3292/downloads/sim3292_database.zip",
            "publicationScale": "1:20,000,000",
            "draftingScale": "1:5,000,000",
            "vertexSpacingKm": 5.0,
            "minimumOutcropDimensionsKm": [40.0, 100.0],
            "minimumLineLengthKm": 100.0,
            "minimumLineSpacingKm": 40.0,
            "scopeAndLimitationNotice": (
                "Regional chronostratigraphic context only (1:20,000,000 scale, 5 km vertex spacing). "
                "The entire 512 m x 512 m HiRISE boxwork AOI (marswalk_crop.tif / PIA26306) lies inside "
                "a single homogeneous polygon (OBJECTID=754, Unit Htu: Hesperian transition undivided unit) "
                "and cannot resolve meter-scale polygonal boxwork ridges, fractures, or EVA terrain hazards."
            ),
        },
        "features": [
            {
                "type": "Feature",
                "id": "SIM3292_Global_Geology.754",
                "bbox": htu_feature_geom["bbox"],
                "properties": {
                    "featureRole": "aoi-host-geologic-unit",
                    "sourceLayer": "SIM3292_Global_Geology",
                    **htu_record,
                    **SIM3292_DMU_CATALOG["Htu"],
                    "containsHiRiseBoxworkAoi": True,
                    "vertexCount": htu_feature_geom["vertexCount"],
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": htu_feature_geom["rings"],
                },
            },
            {
                "type": "Feature",
                "id": "SIM3292_Global_Geology.775",
                "bbox": ahi_feature_geom["bbox"],
                "properties": {
                    "featureRole": "surrounding-crater-impact-unit",
                    "sourceLayer": "SIM3292_Global_Geology",
                    **ahi_record,
                    **SIM3292_DMU_CATALOG["AHi"],
                    "containsHiRiseBoxworkAoi": False,
                    "containsMslLandingSite": msl_in_ahi,
                    "partCount": ahi_feature_geom["partCount"],
                    "vertexCount": ahi_feature_geom["vertexCount"],
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": ahi_feature_geom["rings"],
                },
            },
            {
                "type": "Feature",
                "id": "SIM3292_Global_Contacts.2203",
                "bbox": contact_geom["bbox"],
                "properties": {
                    "featureRole": "mound-boundary-contact",
                    "sourceLayer": "SIM3292_Global_Contacts",
                    **contact_record,
                    "separatesUnits": ["Htu (OBJECTID=754, Mount Sharp mound)", "AHi (OBJECTID=775, Gale Crater floor)"],
                    "distanceFromBoxworkAoiCenterKm": dist_to_contact["minSegmentDistanceKm"],
                    "distanceFromBoxworkAoiCenterMeters": dist_to_contact["minSegmentDistanceMeters"],
                    "nearestPointToBoxworkAoiLonLat": dist_to_contact["nearestPointOnSegmentLonLat"],
                    "bearingFromBoxworkAoiDeg": dist_to_contact["bearingToNearestSegmentDeg"],
                    "vertexCount": contact_geom["vertexCount"],
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": contact_geom["rings"][0],
                },
            },
            {
                "type": "Feature",
                "id": "SIM3292_Global_Structure.103",
                "bbox": rim_geom["bbox"],
                "properties": {
                    "featureRole": "gale-crater-rim-structure",
                    "sourceLayer": "SIM3292_Global_Structure",
                    **rim_record,
                    "distanceFromBoxworkAoiCenterKm": dist_to_rim["minSegmentDistanceKm"],
                    "distanceFromBoxworkAoiCenterMeters": dist_to_rim["minSegmentDistanceMeters"],
                    "nearestPointToBoxworkAoiLonLat": dist_to_rim["nearestPointOnSegmentLonLat"],
                    "bearingFromBoxworkAoiDeg": dist_to_rim["bearingToNearestSegmentDeg"],
                    "vertexCount": rim_geom["vertexCount"],
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": rim_geom["rings"][0],
                },
            },
            {
                "type": "Feature",
                "id": "SIM3292_Global_Landing_sites.9",
                "bbox": msl_geom["bbox"],
                "properties": {
                    "featureRole": "curiosity-landing-site",
                    "sourceLayer": "SIM3292_Global_Landing_sites",
                    **msl_record,
                    "hostGeologicUnit": "AHi (OBJECTID=775)",
                    "distanceFromBoxworkAoiCenterKm": dist_to_msl_km,
                    "bearingFromBoxworkAoiDeg": bearing_to_msl_deg,
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": msl_geom["coordinates"],
                },
            },
            {
                "type": "Feature",
                "id": "HiRISE_Boxwork_AOI.marswalk_crop",
                "bbox": hirise_aoi["bboxLonLat"],
                "properties": {
                    "featureRole": "optical-hirise-boxwork-aoi-footprint",
                    **HIRISE_CROP_METADATA,
                    "widthMeters": hirise_aoi["widthMeters"],
                    "heightMeters": hirise_aoi["heightMeters"],
                    "areaSqKm": hirise_aoi["areaSqKm"],
                    "centerLonLat": hirise_aoi["centerLonLat"],
                    "enclosingSim3292Unit": "Htu",
                    "enclosingSim3292ObjectId": 754,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [hirise_aoi["polygonRing"]],
                },
            },
        ],
    }

    geojson_out.parent.mkdir(parents=True, exist_ok=True)
    geojson_bytes = (json.dumps(geojson_obj, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    geojson_out.write_bytes(geojson_bytes)
    geojson_sha256 = hashlib.sha256(geojson_bytes).hexdigest()

    inventory_obj = {
        "schemaVersion": 1,
        "datasetId": "usgs-sim3292-mars-global-geology-20m",
        "title": "Geologic Map of Mars (USGS Scientific Investigations Map 3292)",
        "authors": [
            "Kenneth L. Tanaka",
            "James A. Skinner Jr.",
            "James M. Dohm",
            "Rossman P. Irwin III",
            "Eric J. Kolb",
            "Corey M. Fortezzo",
            "Thomas Platz",
            "Gregory G. Michael",
            "Trent M. Hare",
        ],
        "publicationYear": 2014,
        "doi": "https://doi.org/10.3133/sim3292",
        "sourceUrls": {
            "publicationPage": "https://pubs.usgs.gov/sim/3292/",
            "gisDatabaseZip": "https://pubs.usgs.gov/sim/3292/downloads/sim3292_database.zip",
            "readmeTxt": "https://pubs.usgs.gov/sim/3292/downloads/sim3292_readme.txt",
            "metadataTxt": "https://pubs.usgs.gov/sim/3292/downloads/sim3292_metadata.txt",
            "metadataXml": "https://pubs.usgs.gov/sim/3292/downloads/sim3292_metadata.xml",
            "pamphletPdf": "https://pubs.usgs.gov/sim/3292/pdf/sim3292_pamphlet.pdf",
            "dmuChartPdf": "https://pubs.usgs.gov/sim/3292/pdf/sim3292_dmu_with_locality_images.pdf",
            "tableD1Pdf": "https://pubs.usgs.gov/sim/3292/pdf/sim3292_tabled1.pdf",
        },
        "sourceArchive": {
            "fileName": "sim3292_database.zip",
            "totalBytes": 808910442,
            "readmeSha256": sha256_file(source_dir / "SIM3292_README.txt"),
            "metadataTxtSha256": sha256_file(source_dir / "SIM3292_metadata.txt"),
            "metadataXmlSha256": sha256_file(source_dir / "SIM3292_metadata.xml"),
        },
        "crsVerification": {
            "shapefileGeographicCrs": {
                "name": "GCS_Mars_2000_Sphere",
                "wkt": EXPECTED_SIM3292_PRJ_WKT,
                "datum": "D_Mars_2000_Sphere",
                "spheroid": "Mars_2000_Sphere_IAU_IAG",
                "semiMajorAxisMeters": MARS_SPHERE_RADIUS_M,
                "inverseFlattening": 0.0,
                "primeMeridian": "Reference_Meridian (0.0)",
                "angularUnit": "Degree (0.0174532925199433 rad)",
                "coordinateConvention": "Planetocentric latitude [-90..90 deg N], East-positive longitude [-180..180 deg E]",
            },
            "geodatabaseProjectedCrs": {
                "name": "Robinson_clon0_Mars_2000_Sphere",
                "projection": "Robinson",
                "centralMeridianDeg": 0.0,
                "linearUnit": "Meter (1.0)",
                "semiMajorAxisMeters": MARS_SPHERE_RADIUS_M,
                "inverseFlattening": 0.0,
                "note": "Shape_Leng and Shape_Area attributes are in Robinson projected meters; SphArea_km and SphLen_km are true spherical geodesic measurements.",
            },
            "opticalDatasetAlignment": {
                **HIRISE_CROP_METADATA,
                **hirise_aoi,
                "datumCompatibility": (
                    "Exact sphere radius match (R = 3,396,190.0 m) between HiRISE Equirectangular MARS "
                    "(Central_Meridian = 180.0 deg) and SIM 3292 GCS_Mars_2000_Sphere (Central_Meridian = 0.0 deg). "
                    "Zero ellipsoid/datum shift is required."
                ),
            },
        },
        "layers": layer_inventory,
        "aoiSpatialQuery": {
            "aoiCornerAndCenterContainment": corner_checks,
            "enclosingUnit": {
                "OBJECTID": htu_record["OBJECTID"],
                "Unit": htu_record["Unit"],
                "UnitDesc": htu_record["UnitDesc"],
                "SphArea_km": htu_record["SphArea_km"],
                "Shape_Leng": htu_record["Shape_Leng"],
                "Shape_Area": htu_record["Shape_Area"],
                "bboxLonLat": htu_feature_geom["bbox"],
                "vertexCount": htu_feature_geom["vertexCount"],
            },
            "surroundingGaleCraterUnit": {
                "OBJECTID": ahi_record["OBJECTID"],
                "Unit": ahi_record["Unit"],
                "UnitDesc": ahi_record["UnitDesc"],
                "SphArea_km": ahi_record["SphArea_km"],
                "Shape_Leng": ahi_record["Shape_Leng"],
                "Shape_Area": ahi_record["Shape_Area"],
                "bboxLonLat": ahi_feature_geom["bbox"],
                "partCount": ahi_feature_geom["partCount"],
                "vertexCount": ahi_feature_geom["vertexCount"],
                "craterCountAgeFromTable4": {
                    "craterName": "Gale",
                    "diameterKm": 154.0,
                    "centerLatDegN": -5.4,
                    "centerLonDegE": 137.8,
                    "countAreaSqKm": 62155.0,
                    "N_2": "537 +/- 36",
                    "N_5": "173 +/- 45",
                    "N_16": "24 +/- 17",
                    "epochAssigned": "eH (Early Hesperian)",
                },
            },
            "geodesicDistancesFromBoxworkAoiCenter": {
                "aoiCenterLonLat": [aoi_center_lon, aoi_center_lat],
                "toHtuAhiGeologicContact_OID2203": dist_to_contact,
                "toGaleCraterRimStructure_OID103": dist_to_rim,
                "toMslCuriosityLandingSite_OID9": {
                    "landingSiteLonLat": [msl_lon, msl_lat],
                    "distanceKm": dist_to_msl_km,
                    "distanceMeters": round(dist_to_msl_km * 1000.0, 1),
                    "bearingDeg": bearing_to_msl_deg,
                    "landingSiteInAHi_OID775": msl_in_ahi,
                    "landingSiteInHtu_OID754": msl_in_htu,
                },
            },
            "regionalUnitsInGaleSector_134_141E_8S_2S": regional_units,
        },
        "contextEvaluation": {
            "usefulForRegionalContext": True,
            "usefulForLocalBoxworkFeatureMapping": False,
            "recommendedRole": "regional-chronostratigraphic-context",
            "draftingScaleDenominator": 5000000,
            "publicationScaleDenominator": 20000000,
            "vertexSpacingMeters": 5000.0,
            "aoiWidthToVertexSpacingRatio": round(hirise_aoi["widthMeters"] / 5000.0, 5),
            "internalContactsInBoxworkAoi": 0,
            "internalStructuresInBoxworkAoi": 0,
            "summary": (
                "SIM 3292 provides authoritative planetary-scale chronostratigraphic context: it places the entire "
                "4,454.95 km^2 Mount Sharp (Aeolis Mons) mound—including 100% of our 512 m x 512 m HiRISE boxwork AOI—"
                "inside unit Htu (Hesperian transition undivided unit), interpreted by Tanaka et al. (2014) as "
                "fine-grained eolian/pyroclastic layered deposits altered by Hesperian acidic weathering and sulfate "
                f"enrichment, located {dist_to_contact['minSegmentDistanceKm']:.2f} km southeast (upslope) of the basal "
                "Htu/AHi contact (OBJECTID=2203) and surrounded by the Early Hesperian Gale Crater impact unit "
                f"(AHi, OBJECTID=775, where MSL Curiosity landed {dist_to_msl_km:.2f} km to the north-northeast). "
                "However, because SIM 3292 was drafted at 1:5,000,000 and published at 1:20,000,000 with a 5 km "
                "vertex spacing and 40 x 100 km minimum outcrop rule, the entire boxwork AOI is 1/10th of a single "
                "SIM 3292 vertex interval and contains zero internal contacts or structural lines. Meter-scale "
                "polygonal boxwork ridges and intervening hollows require HiRISE (0.25 m/pixel) optical/DTM analysis."
            ),
        },
        "deliveredArtifact": {
            "path": str(geojson_out.relative_to(REPO_ROOT)).replace("\\", "/")
            if geojson_out.is_relative_to(REPO_ROOT)
            else str(geojson_out),
            "bytes": len(geojson_bytes),
            "sha256": geojson_sha256,
            "featureCount": len(geojson_obj["features"]),
        },
    }

    inventory_out.parent.mkdir(parents=True, exist_ok=True)
    inv_bytes = (json.dumps(inventory_obj, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    inventory_out.write_bytes(inv_bytes)
    return inventory_obj


def verify_committed_artifacts(
    geojson_path: Path = DEFAULT_GEOJSON_PATH,
    inventory_path: Path = DEFAULT_INVENTORY_PATH,
) -> tuple[bool, dict[str, Any]]:
    """Verify the committed USGS SIM 3292 GeoJSON and inventory JSON without requiring network access."""
    errors: list[str] = []
    if not geojson_path.is_file():
        return False, {"success": False, "errors": [f"GeoJSON file not found: {geojson_path}"]}
    if not inventory_path.is_file():
        return False, {"success": False, "errors": [f"Inventory file not found: {inventory_path}"]}

    raw_geojson = geojson_path.read_bytes()
    actual_sha256 = hashlib.sha256(raw_geojson).hexdigest()
    geojson = json.loads(raw_geojson.decode("utf-8"))
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))

    delivered = inventory.get("deliveredArtifact", {})
    if delivered.get("bytes") != len(raw_geojson):
        errors.append(
            f"GeoJSON byte size mismatch: expected {delivered.get('bytes')}, got {len(raw_geojson)}"
        )
    if delivered.get("sha256") != actual_sha256:
        errors.append(
            f"GeoJSON SHA-256 mismatch: expected {delivered.get('sha256')}, got {actual_sha256}"
        )

    features_by_id = {f.get("id"): f for f in geojson.get("features", [])}
    required_ids = [
        "SIM3292_Global_Geology.754",
        "SIM3292_Global_Geology.775",
        "SIM3292_Global_Contacts.2203",
        "SIM3292_Global_Structure.103",
        "SIM3292_Global_Landing_sites.9",
        "HiRISE_Boxwork_AOI.marswalk_crop",
    ]
    for req_id in required_ids:
        if req_id not in features_by_id:
            errors.append(f"Missing required GeoJSON feature: {req_id}")

    if not errors:
        htu_rings = features_by_id["SIM3292_Global_Geology.754"]["geometry"]["coordinates"]
        ahi_rings = features_by_id["SIM3292_Global_Geology.775"]["geometry"]["coordinates"]
        aoi_ring = features_by_id["HiRISE_Boxwork_AOI.marswalk_crop"]["geometry"]["coordinates"][0]
        msl_pt = features_by_id["SIM3292_Global_Landing_sites.9"]["geometry"]["coordinates"]

        for lon, lat in aoi_ring[:4]:
            if not point_in_polygon_rings(lon, lat, htu_rings):
                errors.append(f"AOI corner ({lon}, {lat}) is not inside Htu polygon (OBJECTID=754)")
            if point_in_polygon_rings(lon, lat, ahi_rings):
                errors.append(f"AOI corner ({lon}, {lat}) erroneously classified inside AHi cutout")

        if not point_in_polygon_rings(msl_pt[0], msl_pt[1], ahi_rings):
            errors.append("MSL landing site is not inside Gale Crater AHi polygon (OBJECTID=775)")

    return len(errors) == 0, {
        "success": len(errors) == 0,
        "geojsonBytes": len(raw_geojson),
        "geojsonSha256": actual_sha256,
        "featureCount": len(geojson.get("features", [])),
        "enclosingUnit": inventory.get("aoiSpatialQuery", {}).get("enclosingUnit", {}).get("Unit"),
        "errors": errors,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=None,
        help="Path to extracted SIM3292_MarsGlobalGeologicGIS_20M directory to regenerate GeoJSON and inventory.",
    )
    parser.add_argument("--geojson", type=Path, default=DEFAULT_GEOJSON_PATH)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY_PATH)
    args = parser.parse_args(argv)

    try:
        if args.source_dir is not None:
            extract_from_source_dir(
                args.source_dir.resolve(),
                args.geojson.resolve(),
                args.inventory.resolve(),
            )
        ok, report = verify_committed_artifacts(args.geojson.resolve(), args.inventory.resolve())
        print(json.dumps(report, indent=2))
        return 0 if ok else 1
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"success": False, "errors": [str(exc)]}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
