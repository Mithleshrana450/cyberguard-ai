from app.services.csv_export import dicts_to_csv


def test_empty_rows_returns_empty_string():
    assert dicts_to_csv([]) == ""


def test_produces_header_row_from_dict_keys():
    csv_content = dicts_to_csv([{"id": "1", "name": "test"}])
    lines = csv_content.strip().splitlines()
    assert lines[0] == "id,name"


def test_produces_one_data_row_per_dict():
    rows = [{"id": "1", "name": "a"}, {"id": "2", "name": "b"}]
    csv_content = dicts_to_csv(rows)
    lines = csv_content.strip().splitlines()
    assert len(lines) == 3


def test_handles_commas_in_values_correctly():
    rows = [{"title": "Alert, with a comma", "severity": "high"}]
    csv_content = dicts_to_csv(rows)
    assert '"Alert, with a comma"' in csv_content


def test_handles_none_values_as_empty_string():
    rows = [{"score": None, "name": "test"}]
    csv_content = dicts_to_csv(rows)
    lines = csv_content.strip().splitlines()
    assert lines[1] == ",test"
