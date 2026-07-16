# Module 6: Digital Forensics

## What was built
- File upload analysis: MD5/SHA-1/SHA-256 hashing, MIME type detection,
  EXIF metadata extraction for images (including a GPS privacy warning)
- Automatic cross-check of every file's SHA-256 against Module 5's
  threat-intel infrastructure (real code reuse across modules)
- Integrity verification: re-upload a file and confirm it matches a
  previous analysis byte-for-byte
- 18 new tests: pure hash/metadata logic (built entirely from in-memory
  test images, no sample files needed) + API tests for upload and verify

## API Reference

### POST /api/v1/forensics/analyze
Multipart file upload. Computes hashes, extracts metadata, checks threat
intel. **Files are never written to disk or executed** - analyzed as
in-memory bytes only, then discarded.

**Response `201`:** filename, size, MIME type, all three hashes,
`has_gps_data` flag, extracted metadata, and `threat_verdict` (null if
threat-intel isn't configured).

**Errors:** `422` for an empty file, `413` for anything over 25MB.

### GET /api/v1/forensics/analyses
Lists the current user's past analyses.

### GET /api/v1/forensics/analyses/{id}
Returns one full analysis record.

### POST /api/v1/forensics/analyses/{id}/verify
Multipart upload of a (presumably re-collected) file. Recomputes its
SHA-256 and compares against the stored original.

**Response:** `{ original_sha256, uploaded_sha256, is_match }`

## Design decisions worth understanding

**Never write uploaded files to disk.**
The platform processes bytes entirely in memory and discards them once
hashes/metadata are computed - only the derived results are persisted.
This is a deliberate security boundary: the app never becomes a place
where arbitrary user-uploaded (potentially malicious) files sit on a
filesystem waiting to be served, included, or accidentally executed.

**Size-capped streaming read, not `await file.read()` in one call.**
`_read_upload_safely()` reads in 1MB chunks and aborts the moment the
25MB cap is crossed - reading an unbounded upload fully into memory
before checking its size would itself be a denial-of-service vector.

**Reusing Module 5's Postgres enum type instead of creating a duplicate.**
`forensics_records.threat_verdict` uses the exact same `verdict` Postgres
ENUM type that `threat_lookups.verdict` already created - the migration
references it with `create_type=False` rather than defining a second,
functionally-identical enum type.

**GPS metadata surfaced as a first-class flag, not buried in JSON.**
`has_gps_data` is its own boolean column (not just something you'd have
to parse out of `metadata_json`), because embedded location data in an
image is a genuinely common, often-overlooked privacy leak - worth
surfacing prominently rather than requiring the user to dig for it.

## Known tradeoffs
- Metadata extraction only covers images (EXIF) - PDFs, Office documents,
  and other formats currently only get hash + MIME type + size, not deep
  metadata parsing. A natural extension, deliberately scoped out for now.
- MIME type detection uses the filename extension (`mimetypes.guess_type`),
  not magic-byte content sniffing - a renamed file's true type could be
  missed. A more forensically rigorous version would use `python-magic`
  (requires the system `libmagic` library, added Docker complexity we
  chose to defer).
- No chain-of-custody audit log yet (who accessed/downloaded an analysis
  record and when) - a natural fit for the future Reports/Admin modules.
