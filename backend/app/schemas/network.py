import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.network import NetworkScanStatus


class NetworkScanRequest(BaseModel):
    target_range: str


class NetworkHostResponse(BaseModel):
    id: uuid.UUID
    ip_address: str
    is_up: bool
    hostname: str | None
    open_ports_json: str

    model_config = {"from_attributes": True}


class NetworkScanResponse(BaseModel):
    id: uuid.UUID
    target_range: str
    status: NetworkScanStatus
    hosts_scanned: int
    hosts_up: int
    error_message: str | None
    created_at: datetime
    hosts: list[NetworkHostResponse]

    model_config = {"from_attributes": True}


class NetworkScanListItem(BaseModel):
    id: uuid.UUID
    target_range: str
    status: NetworkScanStatus
    hosts_scanned: int
    hosts_up: int
    created_at: datetime

    model_config = {"from_attributes": True}
