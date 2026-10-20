from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ErrorOption(BaseModel):
    code: str
    message: str
    http_status: int = 403


class ActivityDefinition(BaseModel):
    id: str
    cloud: str  # "aws", "azure", "gcp"
    category: str  # "Authentication", "Discovery", "Resource Mutation", "IAM & Escalation", "High Impact & Tampering"
    name: str
    description: str
    service: str
    api_call: str
    required_privilege_level: int
    mitre_tactic: str
    mitre_technique: str
    mitre_technique_id: str
    default_params: Dict[str, Any] = Field(default_factory=dict)
    error_options: List[ErrorOption] = Field(default_factory=list)
    privilege_unlock_on_success: Optional[int] = None
    elevates_to_role: Optional[str] = None
    is_critical_anomaly: bool = False


class ExecuteActivityRequest(BaseModel):
    activity_id: str
    status: str = Field(description="'success' or 'failure'")
    source_ip: Optional[str] = None
    principal: Optional[str] = None
    region: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    custom_params: Dict[str, Any] = Field(default_factory=dict)
    is_anomaly_override: Optional[bool] = None


class SessionState(BaseModel):
    session_id: str
    cloud_provider: str
    current_privilege_level: int
    active_principal: str
    active_role_arn: Optional[str] = None
    god_mode: bool = False
    sequence_number: int = 0
    total_logs_count: int = 0
    recent_activities: List[str] = Field(default_factory=list)
    unlocked_privilege_levels: List[int] = Field(default_factory=lambda: [0])
    is_authenticated: bool = False
    account_id: str = "987654321098"
    consecutive_failed_logins: int = 0
    compromised_indicator: bool = False


class ExecuteActivityResponse(BaseModel):
    success: bool
    message: str
    log_entry: Dict[str, Any]
    session_state: SessionState
    unlocked_new_level: bool = False
    unlocked_level: Optional[int] = None
    alert_triggered: Optional[str] = None
