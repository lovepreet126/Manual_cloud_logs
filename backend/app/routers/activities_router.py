from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from app.core.privilege_engine import PrivilegeEngine, ACTIVITIES_REGISTRY
from app.core.session_manager import SessionManager
from app.models.activity_models import ActivityDefinition

router = APIRouter(prefix="/api/activities", tags=["Activities"])


@router.get("", response_model=List[Dict[str, Any]])
def list_activities(
    session_id: Optional[str] = Query(None),
    cloud: Optional[str] = Query(None),
):
    session = SessionManager.get_or_create_session(session_id=session_id, cloud_provider=cloud or "aws")
    active_cloud = cloud or session.cloud_provider
    activities = PrivilegeEngine.get_activities_for_cloud(active_cloud)

    result = []
    for act in activities:
        unlocked = PrivilegeEngine.is_activity_unlocked(
            activity=act,
            current_privilege_level=session.current_privilege_level,
            unlocked_levels=session.unlocked_privilege_levels,
            god_mode=session.god_mode,
        )
        act_dict = act.dict()
        act_dict["is_unlocked"] = unlocked
        act_dict["lock_reason"] = (
            None
            if unlocked
            else f"Locked: Requires Level {act.required_privilege_level} privilege. Clear prerequisite operations first."
        )
        result.append(act_dict)

    return result


@router.get("/{activity_id}")
def get_activity_detail(activity_id: str, session_id: Optional[str] = Query(None)):
    act = PrivilegeEngine.get_activity_by_id(activity_id)
    if not act:
        raise HTTPException(status_code=404, detail=f"Activity '{activity_id}' not found.")

    session = SessionManager.get_or_create_session(session_id=session_id, cloud_provider=act.cloud)
    unlocked = PrivilegeEngine.is_activity_unlocked(
        activity=act,
        current_privilege_level=session.current_privilege_level,
        unlocked_levels=session.unlocked_privilege_levels,
        god_mode=session.god_mode,
    )
    act_dict = act.dict()
    act_dict["is_unlocked"] = unlocked
    act_dict["lock_reason"] = None if unlocked else f"Requires Level {act.required_privilege_level} privilege."
    return act_dict
