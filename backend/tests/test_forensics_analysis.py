import hashlib
import io

from PIL import Image

from app.services.forensics_analysis import (
    analyze_file,
    compute_hashes,
    extract_image_metadata,
    guess_mime_type,
)


def test_compute_hashes_matches_known_values():
    # "hello world" has well-known published hash values - a good sanity
    # check that we're calling hashlib correctly, not just "some hash".
    data = b"hello world"
    hashes = compute_hashes(data)
    assert hashes["md5"] == hashlib.md5(data).hexdigest()
    assert hashes["sha1"] == hashlib.sha1(data).hexdigest()
    assert hashes["sha256"] == hashlib.sha256(data).hexdigest()
    assert hashes["sha256"] == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"


def test_compute_hashes_different_bytes_give_different_hashes():
    assert compute_hashes(b"file A")["sha256"] != compute_hashes(b"file B")["sha256"]


def test_compute_hashes_identical_bytes_give_identical_hashes():
    # This IS the integrity-verification guarantee the /verify endpoint
    # relies on - same content must always produce the same hash.
    assert compute_hashes(b"identical content") == compute_hashes(b"identical content")


def test_guess_mime_type_from_extension():
    assert guess_mime_type("report.pdf") == "application/pdf"
    assert guess_mime_type("photo.jpg") == "image/jpeg"


def test_guess_mime_type_unknown_extension_falls_back():
    assert guess_mime_type("mystery_file.xyz123") == "application/octet-stream"


def _make_test_png(with_exif: bool = False) -> bytes:
    image = Image.new("RGB", (10, 10), color="blue")
    buffer = io.BytesIO()
    if with_exif:
        exif = image.getexif()
        exif[0x0110] = "TestCameraModel"  # Model tag
        image.save(buffer, format="JPEG", exif=exif)
    else:
        image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_extract_image_metadata_returns_empty_for_non_image():
    assert extract_image_metadata(b"not an image, just text bytes") == {}


def test_extract_image_metadata_returns_empty_for_image_without_exif():
    png_bytes = _make_test_png(with_exif=False)
    # PNG format doesn't carry EXIF the way JPEG does - should return {}
    # cleanly, not crash.
    assert extract_image_metadata(png_bytes) == {}


def test_extract_image_metadata_extracts_camera_model_when_present():
    jpeg_bytes = _make_test_png(with_exif=True)
    metadata = extract_image_metadata(jpeg_bytes)
    assert metadata.get("Model") == "TestCameraModel"


def test_analyze_file_full_pipeline_for_plain_text():
    result = analyze_file("notes.txt", b"just some plain text content")
    assert result.mime_type == "text/plain"
    assert result.file_size_bytes == len(b"just some plain text content")
    assert result.has_gps_data is False
    assert result.metadata == {}
    assert len(result.sha256_hash) == 64  # hex-encoded SHA-256 is always 64 chars


def test_analyze_file_full_pipeline_for_image():
    png_bytes = _make_test_png(with_exif=False)
    result = analyze_file("photo.png", png_bytes)
    assert result.mime_type == "image/png"
    assert result.file_size_bytes == len(png_bytes)
