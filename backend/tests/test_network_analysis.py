from app.services.network_analysis import check_target_authorized, service_name_for_port


def test_rejects_public_ip():
    result = check_target_authorized("8.8.8.8/32")
    assert result.is_authorized is False
    assert "private" in result.error.lower()


def test_rejects_public_range():
    result = check_target_authorized("1.1.1.0/24")
    assert result.is_authorized is False


def test_accepts_private_192_range():
    result = check_target_authorized("192.168.1.0/28")
    assert result.is_authorized is True
    assert result.network is not None


def test_accepts_private_10_range():
    result = check_target_authorized("10.0.0.0/28")
    assert result.is_authorized is True


def test_accepts_private_172_range():
    result = check_target_authorized("172.16.0.0/28")
    assert result.is_authorized is True


def test_accepts_loopback():
    result = check_target_authorized("127.0.0.1/32")
    assert result.is_authorized is True


def test_rejects_range_larger_than_max():
    # /24 (256 addresses) exceeds the /27 (32 address) cap
    result = check_target_authorized("192.168.1.0/24")
    assert result.is_authorized is False
    assert "too large" in result.error.lower()


def test_accepts_range_at_exactly_max_size():
    result = check_target_authorized("192.168.1.0/27")
    assert result.is_authorized is True


def test_rejects_malformed_input():
    result = check_target_authorized("not-an-ip-address")
    assert result.is_authorized is False
    assert result.network is None


def test_rejects_malformed_cidr_suffix():
    result = check_target_authorized("192.168.1.0/99")
    assert result.is_authorized is False


def test_single_ip_without_prefix_is_treated_as_one_host():
    result = check_target_authorized("192.168.1.5")
    assert result.is_authorized is True
    assert result.network.num_addresses == 1


def test_service_name_known_port():
    assert service_name_for_port(22) == "SSH"
    assert service_name_for_port(443) == "HTTPS"


def test_service_name_unknown_port():
    assert service_name_for_port(54321) == "Unknown"
