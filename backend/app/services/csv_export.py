"""
Pure CSV generation.

Kept as one small, generic function rather than a separate CSV-builder
per module - every module's history is fundamentally "a list of records
with named fields," so one function handles all six export types. The
per-module work is just producing the right list of dicts (done in
report_data.py), not reimplementing CSV writing six times.
"""

import csv
import io


def dicts_to_csv(rows: list[dict]) -> str:
    if not rows:
        return ""

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()
