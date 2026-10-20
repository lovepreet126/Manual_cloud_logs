import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException, Response
from typing import List, Dict, Any, Optional
from app.models.activity_models import ExecuteActivityRequest, ExecuteActivityResponse
from app.core.privilege_engine import PrivilegeEngine
from app.core.session_manager import SessionManager
from app.storage.log_store import LogStore
from app.generators.aws_generator import AWSLogGenerator
from app.generators.azure_generator import AzureLogGenerator
from app.generators.gcp_generator import GCPLogGenerator

router = APIRouter(prefix="/api/logs", tags=["Logs"])


@router.post("/execute", response_model=ExecuteActivityResponse)
def execute_activity(req: ExecuteActivityRequest, session_id: str = Query(...)):
    activity = PrivilegeEngine.get_activity_by_id(req.activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail=f"Activity '{req.activity_id}' not found.")

    session = SessionManager.get_or_create_session(session_id=session_id, cloud_provider=activity.cloud)

    # 1. Check Privilege Lock
    is_unlocked = PrivilegeEngine.is_activity_unlocked(
        activity=activity,
        current_privilege_level=session.current_privilege_level,
        unlocked_levels=session.unlocked_privilege_levels,
        god_mode=session.god_mode,
    )

    if not is_unlocked:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Privilege Enforcement Violation: You cannot execute '{activity.name}' (Level {activity.required_privilege_level}) "
                f"because your current session is at Level {session.current_privilege_level}. "
                "You must clear preceding privilege milestones first (e.g. successful login, discovery, or privilege escalation). "
                "Alternatively, enable 'Developer God Mode' in the top bar to bypass privilege restrictions for testing."
            ),
        )

    # 2. Determine Parameters
    source_ip = req.source_ip or "12.158.45.22"
    principal = req.principal or session.active_principal
    region = req.region or ("us-east-1" if activity.cloud == "aws" else ("eastus" if activity.cloud == "azure" else "us-central1"))
    status = req.status.lower().strip()
    is_anomaly = req.is_anomaly_override if req.is_anomaly_override is not None else activity.is_critical_anomaly

    # Merge custom parameters with defaults
    params = dict(activity.default_params)
    params.update(req.custom_params)

    # MITRE ATT&CK Info
    mitre_info = {
        "tactic": activity.mitre_tactic,
        "technique": activity.mitre_technique,
        "technique_id": activity.mitre_technique_id,
    }

    # 3. Generate Native Cloud Log Event
    if activity.cloud == "aws":
        raw_event = AWSLogGenerator.generate_cloudtrail_event(
            action=activity.api_call.split(":")[-1] if ":" in activity.api_call else activity.name,
            service=activity.service,
            status=status,
            principal=principal,
            source_ip=source_ip,
            region=region,
            account_id=session.account_id,
            role_arn=session.active_role_arn,
            custom_params=params,
            error_code=req.error_code,
            error_message=req.error_message,
            storyline_id=session.session_id,
            sequence_number=session.sequence_number + 1,
            privilege_level=activity.required_privilege_level,
            is_anomaly=is_anomaly,
            mitre_info=mitre_info,
        )
    elif activity.cloud == "azure":
        raw_event = AzureLogGenerator.generate_azure_event(
            action=activity.name.replace(" ", ""),
            service=activity.service,
            status=status,
            principal=principal,
            source_ip=source_ip,
            region=region,
            custom_params=params,
            error_code=req.error_code,
            error_message=req.error_message,
            storyline_id=session.session_id,
            sequence_number=session.sequence_number + 1,
            privilege_level=activity.required_privilege_level,
            is_anomaly=is_anomaly,
            mitre_info=mitre_info,
        )
    else:
        raw_event = GCPLogGenerator.generate_gcp_event(
            action=activity.name.replace(" ", ""),
            service=activity.service,
            status=status,
            principal=principal,
            source_ip=source_ip,
            region=region,
            custom_params=params,
            error_code=req.error_code,
            error_message=req.error_message,
            storyline_id=session.session_id,
            sequence_number=session.sequence_number + 1,
            privilege_level=activity.required_privilege_level,
            is_anomaly=is_anomaly,
            mitre_info=mitre_info,
        )

    # 4. Evaluate Session Progression & State Updates
    updated_session, unlocked_new, new_level, alert_msg = SessionManager.evaluate_activity_progression(
        session_id=session_id,
        activity=activity,
        status=status,
        source_ip=source_ip,
        custom_params=params,
    )

    # 5. Build Unified Dual-Format Entry
    log_id = f"log-{uuid.uuid4().hex[:12]}"
    unified_entry = {
        "id": log_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cloud_provider": activity.cloud,
        "service": activity.service,
        "action": activity.api_call,
        "activity_name": activity.name,
        "status": status,
        "privilege_level": activity.required_privilege_level,
        "is_anomaly": is_anomaly,
        "mitre_attack": mitre_info,
        "principal": principal,
        "source_ip": source_ip,
        "region": region,
        "error_code": req.error_code,
        "error_message": req.error_message,
        "raw_event": raw_event,
        "session_id": session_id,
        "sequence_number": updated_session.sequence_number,
        "tags": [activity.cloud, activity.category.lower().replace(" ", "_"), status],
    }

    # Store entry
    LogStore.add_log(unified_entry)

    message = f"Executed {activity.name} [{status.upper()}] successfully."
    if unlocked_new:
        message += f" Congratulations! Level {new_level} privilege unlocked!"

    return ExecuteActivityResponse(
        success=True,
        message=message,
        log_entry=unified_entry,
        session_state=updated_session,
        unlocked_new_level=unlocked_new,
        unlocked_level=new_level,
        alert_triggered=alert_msg,
    )


@router.get("", response_model=List[Dict[str, Any]])
def get_logs(
    session_id: Optional[str] = Query(None),
    cloud: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    anomaly: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    return LogStore.get_logs(
        session_id=session_id,
        cloud_provider=cloud,
        status=status,
        is_anomaly=anomaly,
        search=search,
        limit=limit,
    )


@router.delete("")
def clear_logs(session_id: Optional[str] = Query(None)):
    LogStore.clear_logs(session_id=session_id)
    return {"message": "Logs cleared successfully."}


@router.get("/export/json")
def export_json(session_id: Optional[str] = Query(None)):
    content = LogStore.export_json_string(session_id=session_id, pretty=True)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=cloud_manual_logs_{session_id or 'all'}.json"},
    )


@router.get("/export/native")
def export_native_json(session_id: Optional[str] = Query(None)):
    native_records = LogStore.export_native_json(session_id=session_id)
    import json
    return Response(
        content=json.dumps(native_records, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=cloud_native_audit_logs_{session_id or 'all'}.json"},
    )
