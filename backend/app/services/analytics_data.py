"""
Pure analytics aggregation functions - same pattern as every prior
module's pure/impure split. These take plain lists of dicts (or plain
lists of numbers/strings) and return aggregated results - no DB, no
network, fully unit testable.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone


def bucket_by_day(timestamps: list[str], days: int) -> list[dict]:
    """
    Groups a list of ISO timestamp strings into daily counts for the last
    `days` days, including days with zero events - a trend chart with
    gaps for missing dates would be misleading (looks like the axis
    itself is broken), so every day in the range gets an explicit entry.
    """
    today = datetime.now(timezone.utc).date()
    date_range = [today - timedelta(days=offset) for offset in range(days - 1, -1, -1)]

    counts: dict = defaultdict(int)
    for ts in timestamps:
        try:
            event_date = datetime.fromisoformat(ts).date()
        except ValueError:
            continue
        counts[event_date] += 1

    return [{"date": d.isoformat(), "count": counts.get(d, 0)} for d in date_range]


def compute_score_distribution(scores: list[int]) -> dict:
    """
    Buckets security scores into three bands. Fixed bands (not dynamic
    binning) deliberately - "critical / needs improvement / good" is more
    immediately meaningful to a reader than an arbitrary histogram shape
    that changes every time new scans come in.
    """
    buckets = {"critical_0_40": 0, "needs_improvement_41_70": 0, "good_71_100": 0}
    for score in scores:
        if score <= 40:
            buckets["critical_0_40"] += 1
        elif score <= 70:
            buckets["needs_improvement_41_70"] += 1
        else:
            buckets["good_71_100"] += 1
    return buckets


def compute_distribution(values: list[str]) -> dict:
    """Generic counter - used for severity/verdict/status distributions
    across several different modules' data, since they all reduce to
    'count how many of each string value appear'."""
    counts: dict = defaultdict(int)
    for v in values:
        counts[v] += 1
    return dict(counts)
