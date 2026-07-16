"""
Pure forensics analysis functions.

Same pattern as scan_analysis.py (Module 3) and threat_intel_analysis.py
(Module 5): every function here takes bytes/a filename in and returns
plain data out. No file system writes, no database, no network. This
means we can unit test "does this function correctly extract GPS
coordinates from EXIF data" using a tiny image built entirely in memory
during the test itself - no sample files needed on disk.
"""

import hashlib
import io
import mimetypes
from dataclasses import dataclass, field

from PIL import Image
from PIL.ExifTags import GPSTAGS, TAGS


@dataclass
class ForensicsResult:
    file_size_bytes: int
    mime_type: str
    md5_hash: str
    sha1_hash: str
    sha256_hash: str
    has_gps_data: bool
    metadata: dict = field(default_factory=dict)


def compute_hashes(file_bytes: bytes) -> dict:
    """
    Computes all three hashes in a single pass over the bytes. MD5 and
    SHA-1 are cryptographically broken for security purposes (collisions
    are practical to generate) but remain the standard identifiers many
    forensic tools and malware/threat databases index by, so we still
    compute them - SHA-256 is what you'd actually rely on for integrity
    guarantees.
    """
    return {
        "md5": hashlib.md5(file_bytes).hexdigest(),
        "sha1": hashlib.sha1(file_bytes).hexdigest(),
        "sha256": hashlib.sha256(file_bytes).hexdigest(),
    }


def guess_mime_type(filename: str) -> str:
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"


def _convert_gps_coordinate(value, ref) -> float | None:
    """
    EXIF stores GPS coordinates as (degrees, minutes, seconds) tuples plus
    a hemisphere reference ('N'/'S'/'E'/'W') - this converts that into a
    single decimal-degree float, the format actually useful for mapping.
    """
    try:
        degrees, minutes, seconds = value
        decimal = float(degrees) + float(minutes) / 60 + float(seconds) / 3600
        if ref in ("S", "W"):
            decimal = -decimal
        return round(decimal, 6)
    except (ValueError, TypeError, ZeroDivisionError):
        return None


def extract_image_metadata(file_bytes: bytes) -> dict:
    """
    Returns {} for non-images or images with no EXIF data. Returns a dict
    with a 'gps' key specifically when GPS coordinates are present -
    that's the privacy-relevant signal the frontend highlights as a
    warning, separate from the rest of the (lower-stakes) EXIF fields.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
        exif_data = image.getexif()
    except Exception:
        return {}

    if not exif_data:
        return {}

    metadata: dict = {}
    for tag_id, value in exif_data.items():
        tag_name = TAGS.get(tag_id, str(tag_id))
        if tag_name in ("Make", "Model", "DateTime", "Software"):
            metadata[tag_name] = str(value)

    # GPS info lives in its own nested IFD (Image File Directory) block,
    # accessed separately from the top-level EXIF tags above.
    gps_ifd = exif_data.get_ifd(0x8825) if hasattr(exif_data, "get_ifd") else None
    if gps_ifd:
        gps_tags = {GPSTAGS.get(k, k): v for k, v in gps_ifd.items()}
        lat = gps_tags.get("GPSLatitude")
        lat_ref = gps_tags.get("GPSLatitudeRef")
        lon = gps_tags.get("GPSLongitude")
        lon_ref = gps_tags.get("GPSLongitudeRef")

        if lat and lon and lat_ref and lon_ref:
            latitude = _convert_gps_coordinate(lat, lat_ref)
            longitude = _convert_gps_coordinate(lon, lon_ref)
            if latitude is not None and longitude is not None:
                metadata["gps"] = {"latitude": latitude, "longitude": longitude}

    return metadata


def analyze_file(filename: str, file_bytes: bytes) -> ForensicsResult:
    hashes = compute_hashes(file_bytes)
    mime_type = guess_mime_type(filename)
    metadata = extract_image_metadata(file_bytes) if mime_type.startswith("image/") else {}

    return ForensicsResult(
        file_size_bytes=len(file_bytes),
        mime_type=mime_type,
        md5_hash=hashes["md5"],
        sha1_hash=hashes["sha1"],
        sha256_hash=hashes["sha256"],
        has_gps_data="gps" in metadata,
        metadata=metadata,
    )
