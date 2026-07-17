import json

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.network import NetworkHost, NetworkScan, NetworkScanStatus
from app.services.network_analysis import check_target_authorized
from app.services.network_scanner import scan_network


def run_network_scan(db: Session, user_id, target_range: str) -> NetworkScan:
    auth_result = check_target_authorized(target_range)
    if not auth_result.is_authorized:
        # 403, not 422 - this isn't "malformed input," it's "this request
        # is not permitted," which is what 403 Forbidden means.
        raise HTTPException(status.HTTP_403_FORBIDDEN, auth_result.error)

    hosts = [str(ip) for ip in auth_result.network.hosts()] or [str(auth_result.network.network_address)]

    scan = NetworkScan(
        user_id=user_id,
        target_range=target_range,
        status=NetworkScanStatus.COMPLETED,
        hosts_scanned=len(hosts),
    )

    try:
        results = scan_network(hosts)
    except Exception as exc:  # noqa: BLE001 - a scan failure shouldn't crash the request
        scan.status = NetworkScanStatus.FAILED
        scan.error_message = str(exc)[:500]
        db.add(scan)
        db.commit()
        db.refresh(scan)
        return scan

    scan.hosts_up = sum(1 for r in results if r.is_up)
    db.add(scan)
    db.flush()  # get scan.id without a full commit yet

    for r in results:
        db.add(
            NetworkHost(
                scan_id=scan.id,
                ip_address=r.ip_address,
                is_up=r.is_up,
                hostname=r.hostname,
                open_ports_json=json.dumps(r.open_ports),
            )
        )

    db.commit()
    db.refresh(scan)
    return scan
