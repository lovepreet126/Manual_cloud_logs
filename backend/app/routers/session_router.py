from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.core.session_manager import SessionManager
from app.models.activity_models import SessionState
from app.config import IP_PRESETS, PRIVILEGE_LEVELS, SUPPORTED_CLOUDS

router = APIRouter(prefix="/api/session", tags=["Session"])


@router.get("", response_model=SessionState)
def get_session(session_id: Optional[str] = Query(None), cloud: str = Query("aws")):
    return SessionManager.get_or_create_session(session_id=session_id, cloud_provider=cloud)


@router.post("/reset", response_model=SessionState)
def reset_session(session_id: str = Query(...), cloud: Optional[str] = Query(None)):
    return SessionManager.reset_session(session_id=session_id, cloud_provider=cloud)


@router.post("/cloud", response_model=SessionState)
def switch_cloud(session_id: str = Query(...), cloud: str = Query(...)):
    if cloud.lower() not in SUPPORTED_CLOUDS:
        raise HTTPException(status_code=400, detail=f"Unsupported cloud: {cloud}. Supported: {SUPPORTED_CLOUDS}")
    return SessionManager.update_cloud_provider(session_id=session_id, cloud_provider=cloud)


@router.post("/god-mode", response_model=SessionState)
def toggle_god_mode(session_id: str = Query(...), enabled: Optional[bool] = Query(None)):
    return SessionManager.toggle_god_mode(session_id=session_id, enabled=enabled)


@router.get("/ip-presets")
def get_ip_presets():
    return IP_PRESETS


@router.get("/privilege-levels")
def get_privilege_levels():
    return PRIVILEGE_LEVELS
