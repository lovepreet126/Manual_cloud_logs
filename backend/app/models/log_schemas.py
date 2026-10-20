from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class MitreAttackInfo(BaseModel):
    tactic: str
    technique: str
    technique_id: str


class UnifiedLogEntry(BaseModel):
    """
    Unified Cloud Security Log model.
    Combines standardized security event metadata with exact 1:1 native cloud telemetry
    (AWS CloudTrail / Azure Activity / GCP Cloud Audit).
    """
    id: str
    timestamp: str
    cloud_provider: str = Field(description="aws, azure, gcp")
    service: str
    action: str
    status: str = Field(description="success, failure, denied, error")
    privilege_level: int = Field(ge=0, le=4)
    is_anomaly: bool = False
    mitre_attack: Optional[MitreAttackInfo] = None
    principal: str
    source_ip: str
    region: str
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_event: Dict[str, Any] = Field(description="Native cloud provider audit log representation")
    session_id: str
    sequence_number: int
    tags: List[str] = Field(default_factory=list)
