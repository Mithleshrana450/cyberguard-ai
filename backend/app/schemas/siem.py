import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.security_event import AlertSeverity, AlertType


class LoginEventResponse(BaseModel):
    id: uuid.UUID
    email_attempted: str
    ip_address: str
    success: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SecurityAlertResponse(BaseModel):
    id: uuid.UUID
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    source_ip: str
    is_resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}
