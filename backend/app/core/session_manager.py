import uuid
from typing import Dict, Optional, Tuple
from app.models.activity_models import SessionState, ActivityDefinition


class SessionManager:
    """
    Manages interactive simulation sessions, tracking privilege level progression,
    active IAM identities, failed attempts, and unlocked state across cloud environments.
    """

    _sessions: Dict[str, SessionState] = {}

    @classmethod
    def get_or_create_session(
        cls, session_id: Optional[str] = None, cloud_provider: str = "aws"
    ) -> SessionState:
        if not session_id or session_id not in cls._sessions:
            new_id = session_id or f"sess-{uuid.uuid4().hex[:8]}"
            initial_principal = {
                "aws": "unauthenticated_caller",
                "azure": "anonymous@external-net",
                "gcp": "anonymous-guest",
            }.get(cloud_provider.lower(), "unauthenticated_caller")

            state = SessionState(
                session_id=new_id,
                cloud_provider=cloud_provider.lower(),
                current_privilege_level=0,
                active_principal=initial_principal,
                active_role_arn=None,
                god_mode=False,
                sequence_number=0,
                total_logs_count=0,
                recent_activities=[],
                unlocked_privilege_levels=[0],
                is_authenticated=False,
                consecutive_failed_logins=0,
                compromised_indicator=False,
            )
            cls._sessions[new_id] = state
            return state

        return cls._sessions[session_id]

    @classmethod
    def update_cloud_provider(cls, session_id: str, cloud_provider: str) -> SessionState:
        session = cls.get_or_create_session(session_id)
        session.cloud_provider = cloud_provider.lower()
        return session

    @classmethod
    def toggle_god_mode(cls, session_id: str, enabled: Optional[bool] = None) -> SessionState:
        session = cls.get_or_create_session(session_id)
        if enabled is None:
            session.god_mode = not session.god_mode
        else:
            session.god_mode = enabled
        return session

    @classmethod
    def reset_session(cls, session_id: str, cloud_provider: Optional[str] = None) -> SessionState:
        provider = cloud_provider or cls.get_or_create_session(session_id).cloud_provider
        if session_id in cls._sessions:
            del cls._sessions[session_id]
        return cls.get_or_create_session(session_id=session_id, cloud_provider=provider)

    @classmethod
    def evaluate_activity_progression(
        cls,
        session_id: str,
        activity: ActivityDefinition,
        status: str,
        source_ip: str,
        custom_params: Dict,
    ) -> Tuple[SessionState, bool, Optional[int], Optional[str]]:
        """
        Updates session state based on the outcome of a manual action.
        Returns: (updated_session, unlocked_new_level_bool, new_level_int, alert_triggered_str)
        """
        session = cls.get_or_create_session(session_id, activity.cloud)
        session.sequence_number += 1
        session.total_logs_count += 1
        session.recent_activities.append(activity.id)
        if len(session.recent_activities) > 20:
            session.recent_activities.pop(0)

        is_success = status.lower() in ["success", "succeeded", "ok"]
        unlocked_new_level = False
        new_unlocked_level: Optional[int] = None
        alert_triggered: Optional[str] = None

        # Check for suspicious IP
        if source_ip in ["185.220.101.5", "45.154.255.88", "194.26.29.112"]:
            session.compromised_indicator = True
            alert_triggered = f"Suspicious IP Activity ({source_ip}) associated with action {activity.name}"

        # 1. Handling Login Actions (Level 0)
        if activity.category == "Authentication":
            if is_success:
                session.consecutive_failed_logins = 0
                session.is_authenticated = True

                # Unlock Level 1 (Recon)
                if 1 not in session.unlocked_privilege_levels:
                    session.unlocked_privilege_levels.append(1)
                    session.current_privilege_level = max(session.current_privilege_level, 1)
                    unlocked_new_level = True
                    new_unlocked_level = 1

                # Establish Principal Identity
                username = (
                    custom_params.get("userName")
                    or custom_params.get("userPrincipalName")
                    or custom_params.get("principalEmail")
                    or "ria_developer"
                )
                session.active_principal = username
                if activity.cloud == "aws":
                    session.active_role_arn = f"arn:aws:iam::{session.account_id}:user/{username}"
                elif activity.cloud == "azure":
                    session.active_role_arn = f"{username}@enterprise.onmicrosoft.com"
                else:
                    session.active_role_arn = f"{username}@synth-cloud.com"
            else:
                session.consecutive_failed_logins += 1
                if session.consecutive_failed_logins >= 3:
                    alert_triggered = (
                        f"Potential Cloud Credential Brute Force: {session.consecutive_failed_logins} consecutive failed logins!"
                    )

        # 2. Handling Discovery / Recon Completion (Unlocking Level 2 - Resource Mutation)
        elif activity.category == "Discovery" and is_success:
            if 2 not in session.unlocked_privilege_levels and session.current_privilege_level >= 1:
                session.unlocked_privilege_levels.append(2)
                session.current_privilege_level = max(session.current_privilege_level, 2)
                unlocked_new_level = True
                new_unlocked_level = 2

        # 3. Handling Resource Operator Activities (Unlocking Level 3 - IAM / Escalation)
        elif activity.category == "Resource Mutation" and is_success:
            if 3 not in session.unlocked_privilege_levels and session.current_privilege_level >= 2:
                session.unlocked_privilege_levels.append(3)
                session.current_privilege_level = max(session.current_privilege_level, 3)
                unlocked_new_level = True
                new_unlocked_level = 3

        # 4. Handling Explicit Privilege Escalation (Unlocking Level 4 - Critical Admin)
        if is_success and activity.privilege_unlock_on_success is not None:
            target_level = activity.privilege_unlock_on_success
            if target_level not in session.unlocked_privilege_levels:
                session.unlocked_privilege_levels.append(target_level)
                unlocked_new_level = True
                new_unlocked_level = target_level

            session.current_privilege_level = max(session.current_privilege_level, target_level)

            if activity.elevates_to_role:
                session.active_role_arn = activity.elevates_to_role
                session.active_principal = activity.elevates_to_role.split("/")[-1]

            if target_level >= 4:
                alert_triggered = f"HIGH PRIVILEGE ACQUIRED: Principal escalated to Level 4 Cloud Administrator!"

        # 5. Critical Anomaly Trigger
        if activity.is_critical_anomaly and is_success:
            alert_triggered = f"CRITICAL SECURITY ALERT: {activity.name} triggered! Defense Evasion / Exfiltration detected."

        return session, unlocked_new_level, new_unlocked_level, alert_triggered
