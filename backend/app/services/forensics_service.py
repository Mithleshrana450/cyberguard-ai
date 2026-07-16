"""
Forensics orchestration service.

Security note on file handling: we NEVER write the uploaded file to disk
and never execute or "open" it with anything beyond Pillow's image
decoder (itself only invoked for files whose extension claims to be an
image). The raw bytes are held in memory only long enough to hash and
extract metadata, then discarded - only the computed results (hashes,
metadata, size) are persisted to the database. This avoids the platform
ever becoming a place attacker-controlled files sit on disk.
"""

import json

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.forensics import ForensicsRecord
from app.models.threat_intel import LookupType
from app.services import forensics_analysis as fa

MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


async def _read_upload_safely(file: UploadFile) -> bytes:
    """
    Reads the upload while enforcing a hard size cap - without this, a
    multi-gigabyte upload would be read entirely into memory before we
    ever get a chance to reject it, a straightforward denial-of-service
    vector for any file-upload endpoint.
    """
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)  # 1 MB at a time
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                f"File exceeds the {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB upload limit.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


def _check_threat_intel(db: Session, redis_client, user_id, sha256_hash: str):
    """
    Best-effort cross-check against Module 5's threat-intel infrastructure.
    Deliberately swallows failures (missing API key, VirusTotal down,
    rate limited) rather than failing the whole forensics analysis - a
    file's hashes and metadata are still valuable even if we can't reach
    an external reputation service right now.
    """
    try:
        from app.services.threat_intel_service import run_lookup

        lookup = run_lookup(db, redis_client, user_id, LookupType.HASH, sha256_hash)
        return lookup.verdict
    except HTTPException:
        return None


async def analyze_upload(db: Session, redis_client, user_id, file: UploadFile) -> ForensicsRecord:
    file_bytes = await _read_upload_safely(file)
    if len(file_bytes) == 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Uploaded file is empty.")

    result = fa.analyze_file(file.filename or "unknown", file_bytes)
    threat_verdict = _check_threat_intel(db, redis_client, user_id, result.sha256_hash)

    record = ForensicsRecord(
        user_id=user_id,
        filename=file.filename or "unknown",
        file_size_bytes=result.file_size_bytes,
        mime_type=result.mime_type,
        md5_hash=result.md5_hash,
        sha1_hash=result.sha1_hash,
        sha256_hash=result.sha256_hash,
        has_gps_data=result.has_gps_data,
        metadata_json=json.dumps(result.metadata),
        threat_verdict=threat_verdict,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


async def verify_integrity(db: Session, record_id, user_id, file: UploadFile) -> dict:
    record = (
        db.query(ForensicsRecord)
        .filter(ForensicsRecord.id == record_id, ForensicsRecord.user_id == user_id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Forensics record not found.")

    file_bytes = await _read_upload_safely(file)
    new_hashes = fa.compute_hashes(file_bytes)

    return {
        "original_filename": record.filename,
        "original_sha256": record.sha256_hash,
        "uploaded_sha256": new_hashes["sha256"],
        "is_match": new_hashes["sha256"] == record.sha256_hash,
    }
