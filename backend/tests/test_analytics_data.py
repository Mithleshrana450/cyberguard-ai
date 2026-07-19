from datetime import datetime, timedelta, timezone

from app.services.analytics_data import bucket_by_day, compute_distribution, compute_score_distribution


def test_bucket_by_day_includes_zero_count_days():
    result = bucket_by_day([], days=7)
    assert len(result) == 7
    assert all(day["count"] == 0 for day in result)


def test_bucket_by_day_counts_events_on_correct_day():
    today = datetime.now(timezone.utc)
    timestamps = [today.isoformat(), today.isoformat(), (today - timedelta(days=1)).isoformat()]
    result = bucket_by_day(timestamps, days=7)

    today_bucket = result[-1]
    yesterday_bucket = result[-2]
    assert today_bucket["count"] == 2
    assert yesterday_bucket["count"] == 1


def test_bucket_by_day_ignores_events_outside_the_window():
    old_event = (datetime.now(timezone.utc) - timedelta(days=100)).isoformat()
    result = bucket_by_day([old_event], days=7)
    assert sum(day["count"] for day in result) == 0


def test_bucket_by_day_handles_malformed_timestamps_gracefully():
    result = bucket_by_day(["not-a-real-timestamp"], days=7)
    assert sum(day["count"] for day in result) == 0


def test_bucket_by_day_result_is_chronologically_ordered():
    result = bucket_by_day([], days=5)
    dates = [day["date"] for day in result]
    assert dates == sorted(dates)


def test_score_distribution_buckets_correctly():
    result = compute_score_distribution([10, 35, 40, 41, 55, 70, 71, 90, 100])
    assert result["critical_0_40"] == 3
    assert result["needs_improvement_41_70"] == 3
    assert result["good_71_100"] == 3


def test_score_distribution_empty_list():
    result = compute_score_distribution([])
    assert result == {"critical_0_40": 0, "needs_improvement_41_70": 0, "good_71_100": 0}


def test_compute_distribution_counts_each_value():
    result = compute_distribution(["critical", "high", "critical", "low"])
    assert result == {"critical": 2, "high": 1, "low": 1}


def test_compute_distribution_empty_list():
    assert compute_distribution([]) == {}
