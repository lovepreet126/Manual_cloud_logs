"""
Verification test script for CloudSec LogForge Backend
"""
import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_workflow():
    print("--- 1. Testing Root & Health ---")
    res = client.get("/")
    assert res.status_code == 200, res.text
    print("Root response:", res.json())

    print("\n--- 2. Testing Session Creation ---")
    session_res = client.get("/api/session?cloud=aws")
    assert session_res.status_code == 200
    session = session_res.json()
    sess_id = session["session_id"]
    print(f"Created session: {sess_id}, level: {session['current_privilege_level']}, unlocked: {session['unlocked_privilege_levels']}")
    assert session["current_privilege_level"] == 0
    assert 0 in session["unlocked_privilege_levels"]

    print("\n--- 3. Testing Activities Lock Enforcement ---")
    acts_res = client.get(f"/api/activities?session_id={sess_id}&cloud=aws")
    assert acts_res.status_code == 200
    acts = acts_res.json()
    login_act = next(a for a in acts if a["id"] == "aws_console_login")
    high_priv_act = next(a for a in acts if a["id"] == "aws_stop_logging")
    
    print(f"Login activity unlocked: {login_act['is_unlocked']}")
    print(f"StopLogging (Level 4) unlocked: {high_priv_act['is_unlocked']}")
    assert login_act["is_unlocked"] is True
    assert high_priv_act["is_unlocked"] is False

    print("\n--- 4. Testing Gating: Block High Privilege Action at Level 0 ---")
    exec_blocked = client.post(
        f"/api/logs/execute?session_id={sess_id}",
        json={"activity_id": "aws_stop_logging", "status": "success"}
    )
    print(f"Blocked execution status code: {exec_blocked.status_code}")
    assert exec_blocked.status_code == 403
    print(f"Expected 403 detail: {exec_blocked.json()['detail']}")

    print("\n--- 5. Testing Login Failure (Stays Level 0, records failure log) ---")
    fail_res = client.post(
        f"/api/logs/execute?session_id={sess_id}",
        json={
            "activity_id": "aws_console_login",
            "status": "failure",
            "error_code": "FailedAuthentication",
            "error_message": "Invalid password"
        }
    )
    assert fail_res.status_code == 200
    fail_data = fail_res.json()
    print("Login failure recorded:", fail_data["message"])
    print("Failed attempts count:", fail_data["session_state"]["consecutive_failed_logins"])
    assert fail_data["session_state"]["current_privilege_level"] == 0
    assert fail_data["session_state"]["consecutive_failed_logins"] == 1

    print("\n--- 6. Testing Login Success (Unlocks Level 1 Recon) ---")
    succ_res = client.post(
        f"/api/logs/execute?session_id={sess_id}",
        json={
            "activity_id": "aws_console_login",
            "status": "success",
            "principal": "ria_developer"
        }
    )
    assert succ_res.status_code == 200
    succ_data = succ_res.json()
    print("Login success:", succ_data["message"])
    print("New privilege level:", succ_data["session_state"]["current_privilege_level"])
    print("Unlocked levels:", succ_data["session_state"]["unlocked_privilege_levels"])
    assert succ_data["session_state"]["current_privilege_level"] >= 1
    assert 1 in succ_data["session_state"]["unlocked_privilege_levels"]

    print("\n--- 7. Testing Recon Execution (DescribeInstances -> Unlocks Level 2) ---")
    recon_res = client.post(
        f"/api/logs/execute?session_id={sess_id}",
        json={
            "activity_id": "aws_describe_instances",
            "status": "success"
        }
    )
    assert recon_res.status_code == 200
    print("DescribeInstances recorded:", recon_res.json()["message"])
    print("Current level now:", recon_res.json()["session_state"]["current_privilege_level"])

    print("\n--- 8. Testing Resource Operator Execution (RunInstances -> Unlocks Level 3) ---")
    run_res = client.post(
        f"/api/logs/execute?session_id={sess_id}",
        json={
            "activity_id": "aws_run_instances",
            "status": "success"
        }
    )
    assert run_res.status_code == 200
    print("RunInstances recorded:", run_res.json()["message"])
    print("Current level now:", run_res.json()["session_state"]["current_privilege_level"])
    assert run_res.json()["session_state"]["current_privilege_level"] >= 3

    print("\n--- 9. Testing Privilege Escalation (AssumeRole -> Unlocks Level 4) ---")
    escalate_res = client.post(
        f"/api/logs/execute?session_id={sess_id}",
        json={
            "activity_id": "aws_assume_role",
            "status": "success",
            "custom_params": {"roleArn": "arn:aws:iam::987654321098:role/SecurityAdminRole"}
        }
    )
    assert escalate_res.status_code == 200
    esc_data = escalate_res.json()
    print("Privilege Escalation:", esc_data["message"])
    print("Active Role ARN:", esc_data["session_state"]["active_role_arn"])
    print("New level:", esc_data["session_state"]["current_privilege_level"])
    assert esc_data["session_state"]["current_privilege_level"] == 4

    print("\n--- 10. Testing High Privilege Operation (StopLogging now allowed!) ---")
    stop_trail_res = client.post(
        f"/api/logs/execute?session_id={sess_id}",
        json={
            "activity_id": "aws_stop_logging",
            "status": "success"
        }
    )
    assert stop_trail_res.status_code == 200
    print("StopLogging executed:", stop_trail_res.json()["message"])

    print("\n--- 11. Testing Logs Query & JSON Format Verification ---")
    logs_res = client.get(f"/api/logs?session_id={sess_id}")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    print(f"Total logs retrieved for session: {len(logs)}")
    assert len(logs) >= 5

    # Check CloudTrail schema compliance in raw_event
    first_log = logs[0]
    print("\nSample Generated Event:")
    print("Action:", first_log["action"])
    print("CloudTrail Event Source:", first_log["raw_event"]["eventSource"])
    print("CloudTrail Event Name:", first_log["raw_event"]["eventName"])
    print("UserIdentity ARN:", first_log["raw_event"]["userIdentity"]["arn"])
    print("Ground-Truth Metadata:", first_log["raw_event"]["_synth_metadata"])
    assert "eventVersion" in first_log["raw_event"]
    assert "userIdentity" in first_log["raw_event"]
    assert "_synth_metadata" in first_log["raw_event"]

    print("[SUCCESS] ALL 11 VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_workflow()
