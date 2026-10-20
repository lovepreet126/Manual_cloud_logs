import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class GCPLogGenerator:
    """
    Generates authentic GCP Cloud Audit Log records for manual security actions.
    """

    PROJECT_ID = "synth-cloud-production-ops"

    @classmethod
    def generate_gcp_event(
        cls,
        action: str,
        service: str,
        status: str,
        principal: str,
        source_ip: str,
        region: str = "us-central1",
        custom_params: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None,
        storyline_id: str = "session-001",
        sequence_number: int = 1,
        privilege_level: int = 0,
        is_anomaly: bool = False,
        mitre_info: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        custom_params = custom_params or {}
        event_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        insert_id = f"gcp-{uuid.uuid4().hex}"

        is_success = status.lower() in ["success", "succeeded", "ok"]
        principal_email = principal if "@" in principal else f"{principal}@{cls.PROJECT_ID}.iam.gserviceaccount.com"

        service_name, method_name, resource_type = cls._resolve_gcp_method(action, service)

        severity = "INFO"
        if not is_success:
            severity = "ERROR"
        elif privilege_level >= 3 or is_anomaly:
            severity = "WARNING"

        gcp_record: Dict[str, Any] = {
            "protoPayload": {
                "@type": "type.googleapis.com/google.cloud.audit.AuditLog",
                "status": {
                    "code": 0 if is_success else 7,
                    "message": "OK" if is_success else (error_message or "PERMISSION_DENIED: The caller does not have permission"),
                },
                "authenticationInfo": {
                    "principalEmail": principal_email,
                    "authoritySelector": "default",
                },
                "requestMetadata": {
                    "callerIp": source_ip,
                    "callerSuppliedUserAgent": custom_params.get("userAgent", "google-cloud-sdk gcloud/470.0.0"),
                    "requestAttributes": {"time": event_time, "auth": {}},
                    "destinationAttributes": {},
                },
                "serviceName": service_name,
                "methodName": method_name,
                "authorizationInfo": [
                    {
                        "resource": f"projects/{cls.PROJECT_ID}",
                        "permission": f"{service_name.split('.')[0]}.admin",
                        "granted": is_success,
                    }
                ],
                "resourceName": f"projects/{cls.PROJECT_ID}/locations/{region}/resources/{custom_params.get('resourceName', 'default-res')}",
                "serviceData": {
                    "policyDelta": custom_params.get("policyDelta", {}),
                    "request": custom_params,
                },
            },
            "insertId": insert_id,
            "resource": {
                "type": resource_type,
                "labels": {
                    "project_id": cls.PROJECT_ID,
                    "location": region,
                },
            },
            "timestamp": event_time,
            "severity": severity,
            "logName": f"projects/{cls.PROJECT_ID}/logs/cloudaudit.googleapis.com%2Factivity",
            "operation": {
                "id": f"operations/{uuid.uuid4()}",
                "producer": service_name,
                "first": True,
                "last": True,
            },
        }

        # Inject SynthoSec Dual Ground-Truth Metadata
        gcp_record["_synth_metadata"] = {
            "storyline_id": storyline_id,
            "sequence_index": sequence_number,
            "privilege_level": privilege_level,
            "is_anomaly": is_anomaly,
            "mitre_attack": mitre_info,
            "cloud_provider": "gcp",
            "manual_action": action,
            "status": "success" if is_success else "failure",
        }

        return gcp_record

    @classmethod
    def _resolve_gcp_method(cls, action: str, service: str):
        mapping = {
            "GoogleLogin": ("iam.googleapis.com", "google.login.v1.Authenticate", "service_account"),
            "ComputeInstancesList": ("compute.googleapis.com", "v1.compute.instances.list", "gce_instance"),
            "ComputeInstancesInsert": ("compute.googleapis.com", "v1.compute.instances.insert", "gce_instance"),
            "StorageBucketsList": ("storage.googleapis.com", "storage.buckets.list", "gcs_bucket"),
            "StorageBucketsInsert": ("storage.googleapis.com", "storage.buckets.insert", "gcs_bucket"),
            "CreateServiceAccountKey": ("iam.googleapis.com", "google.iam.admin.v1.CreateServiceAccountKey", "service_account"),
            "SetIamPolicy": ("iam.googleapis.com", "google.iam.v1.SetIamPolicy", "project"),
            "SecretManagerAccess": ("secretmanager.googleapis.com", "google.cloud.secretmanager.v1.AccessSecretVersion", "secret"),
            "StorageBucketsDelete": ("storage.googleapis.com", "storage.buckets.delete", "gcs_bucket"),
            "DeleteAuditConfig": ("iam.googleapis.com", "google.iam.v1.DeleteAuditConfig", "project"),
        }
        return mapping.get(action, (f"{service}.googleapis.com", f"v1.{service}.{action}", "generic_resource"))
