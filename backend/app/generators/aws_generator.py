import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class AWSLogGenerator:
    """
    Generates authentic AWS CloudTrail v1.08 records for manual security actions.
    """

    SERVICE_DOMAINS = {
        "iam": "iam.amazonaws.com",
        "signin": "signin.amazonaws.com",
        "ec2": "ec2.amazonaws.com",
        "s3": "s3.amazonaws.com",
        "cloudtrail": "cloudtrail.amazonaws.com",
        "kms": "kms.amazonaws.com",
        "sts": "sts.amazonaws.com",
        "rds": "rds.amazonaws.com",
        "lambda": "lambda.amazonaws.com",
    }

    @classmethod
    def generate_cloudtrail_event(
        cls,
        action: str,
        service: str,
        status: str,
        principal: str,
        source_ip: str,
        region: str = "us-east-1",
        account_id: str = "987654321098",
        role_arn: Optional[str] = None,
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
        event_source = cls.SERVICE_DOMAINS.get(service.lower(), f"{service.lower()}.amazonaws.com")
        event_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())

        is_success = status.lower() in ["success", "succeeded", "ok"]
        is_read_only = action.startswith(("Describe", "List", "Get"))

        # Build Identity
        if role_arn or "assumed-role" in principal.lower():
            user_identity = {
                "type": "AssumedRole",
                "principalId": f"AROA{uuid.uuid4().hex[:16].upper()}:session-{storyline_id[-4:]}",
                "arn": role_arn or f"arn:aws:sts::{account_id}:assumed-role/CloudAdminRole/session-{storyline_id[-4:]}",
                "accountId": account_id,
                "accessKeyId": f"ASIA{uuid.uuid4().hex[:16].upper()}",
                "sessionContext": {
                    "sessionIssuer": {
                        "type": "Role",
                        "principalId": f"AROA{uuid.uuid4().hex[:16].upper()}",
                        "arn": role_arn or f"arn:aws:iam::{account_id}:role/CloudAdminRole",
                        "accountId": account_id,
                        "userName": "CloudAdminRole",
                    },
                    "webIdFederationData": {},
                    "attributes": {
                        "creationDate": event_time,
                        "mfaAuthenticated": "true" if privilege_level >= 2 else "false",
                    },
                },
            }
        elif principal.lower() == "root":
            user_identity = {
                "type": "Root",
                "principalId": account_id,
                "arn": f"arn:aws:iam::{account_id}:root",
                "accountId": account_id,
                "accessKeyId": f"AKIA{uuid.uuid4().hex[:16].upper()}",
                "userName": "root",
            }
        else:
            clean_username = principal.split("/")[-1] if "/" in principal else principal
            user_identity = {
                "type": "IAMUser",
                "principalId": f"AIDA{uuid.uuid4().hex[:16].upper()}",
                "arn": f"arn:aws:iam::{account_id}:user/{clean_username}",
                "accountId": account_id,
                "accessKeyId": f"AKIA{uuid.uuid4().hex[:16].upper()}",
                "userName": clean_username,
            }

        # Build request parameters & response elements tailored to API action
        request_parameters, response_elements = cls._build_action_payloads(
            action=action,
            service=service,
            is_success=is_success,
            custom_params=custom_params,
            account_id=account_id,
            principal=principal,
            region=region,
        )

        cloudtrail_record: Dict[str, Any] = {
            "eventVersion": "1.08",
            "userIdentity": user_identity,
            "eventTime": event_time,
            "eventSource": event_source,
            "eventName": action,
            "awsRegion": region,
            "sourceIPAddress": source_ip,
            "userAgent": custom_params.get(
                "userAgent", "AWS Console CloudTrail/Client (Chrome 128.0.0; Windows NT 10.0)"
            ),
            "requestParameters": request_parameters,
            "responseElements": response_elements if is_success else None,
            "requestID": request_id,
            "eventID": event_id,
            "readOnly": is_read_only,
            "eventType": "AwsConsoleSignIn" if action == "ConsoleLogin" else "AwsApiCall",
            "managementEvent": True,
            "recipientAccountId": account_id,
            "eventCategory": "Management",
        }

        # Inject Failure attributes if unsuccessful
        if not is_success:
            cloudtrail_record["errorCode"] = error_code or "Client.UnauthorizedOperation"
            cloudtrail_record["errorMessage"] = (
                error_message
                or f"You are not authorized to perform this operation. User: {user_identity.get('arn')} is not authorized to perform: {service}:{action} on resource."
            )

        # Inject SynthoSec Dual Ground-Truth Metadata
        cloudtrail_record["_synth_metadata"] = {
            "storyline_id": storyline_id,
            "sequence_index": sequence_number,
            "privilege_level": privilege_level,
            "is_anomaly": is_anomaly,
            "mitre_attack": mitre_info,
            "cloud_provider": "aws",
            "manual_action": action,
            "status": "success" if is_success else "failure",
        }

        return cloudtrail_record

    @classmethod
    def _build_action_payloads(
        cls,
        action: str,
        service: str,
        is_success: bool,
        custom_params: Dict[str, Any],
        account_id: str,
        principal: str,
        region: str,
    ):
        req = dict(custom_params)
        resp = {}

        if action == "ConsoleLogin":
            req = {"mfaUsed": req.get("mfaUsed", "Yes" if is_success else "No")}
            resp = {"ConsoleLogin": "Success" if is_success else "Failure"}
        elif action == "GetCallerIdentity":
            req = {}
            resp = {
                "userId": f"AIDA{uuid.uuid4().hex[:16].upper()}",
                "account": account_id,
                "arn": f"arn:aws:iam::{account_id}:user/{principal.split('/')[-1]}",
            }
        elif action == "DescribeInstances":
            req = {"instancesSet": {}, "filterSet": {}}
            resp = {"reservationSet": [{"reservationId": f"r-{uuid.uuid4().hex[:10]}"}]}
        elif action == "ListBuckets":
            req = {}
            resp = {
                "buckets": [
                    {"name": "finance-audit-reports-2026", "creationDate": "2026-01-15T08:00:00Z"},
                    {"name": "customer-pii-production", "creationDate": "2026-02-20T10:30:00Z"},
                    {"name": "internal-cloudtrail-logs", "creationDate": "2025-11-04T12:00:00Z"},
                ],
                "owner": {"displayName": "admin", "id": account_id},
            }
        elif action == "RunInstances":
            req.setdefault("instanceType", "t3.large")
            req.setdefault("imageId", "ami-0c55b159cbfafe1f0")
            req.setdefault("minCount", 1)
            req.setdefault("maxCount", 1)
            resp = {
                "instancesSet": {
                    "items": [
                        {
                            "instanceId": f"i-0{uuid.uuid4().hex[:16]}",
                            "currentState": {"code": 0, "name": "pending"},
                            "instanceType": req["instanceType"],
                        }
                    ]
                }
            }
        elif action == "CreateUser":
            username = req.get("userName", "svc_cloud_operator")
            req = {"userName": username}
            resp = {
                "user": {
                    "path": "/",
                    "userName": username,
                    "userId": f"AIDA{uuid.uuid4().hex[:16].upper()}",
                    "arn": f"arn:aws:iam::{account_id}:user/{username}",
                    "createDate": datetime.now(timezone.utc).isoformat(),
                }
            }
        elif action == "AttachUserPolicy":
            req.setdefault("userName", "svc_cloud_operator")
            req.setdefault("policyArn", "arn:aws:iam::aws:policy/AdministratorAccess")
            resp = {"attachUserPolicyResponse": {"responseMetadata": {"requestId": str(uuid.uuid4())}}}
        elif action == "CreateAccessKey":
            target_user = req.get("userName", principal.split("/")[-1])
            req = {"userName": target_user}
            resp = {
                "accessKey": {
                    "userName": target_user,
                    "accessKeyId": f"AKIA{uuid.uuid4().hex[:16].upper()}",
                    "status": "Active",
                    "createDate": datetime.now(timezone.utc).isoformat(),
                }
            }
        elif action == "AssumeRole":
            target_role = req.get("roleArn", f"arn:aws:iam::{account_id}:role/SecurityAdminRole")
            req = {"roleArn": target_role, "roleSessionName": f"session-{uuid.uuid4().hex[:6]}"}
            resp = {
                "credentials": {
                    "accessKeyId": f"ASIA{uuid.uuid4().hex[:16].upper()}",
                    "expiration": datetime.now(timezone.utc).isoformat(),
                },
                "assumedRoleUser": {
                    "assumedRoleId": f"AROA{uuid.uuid4().hex[:16].upper()}:{req['roleSessionName']}",
                    "arn": f"{target_role}/{req['roleSessionName']}",
                },
            }
        elif action in ["StopLogging", "DeleteTrail"]:
            req = {"name": req.get("trailName", "arn:aws:cloudtrail:us-east-1:987654321098:trail/main-security-trail")}
            resp = {}
        elif action == "PutBucketPolicy":
            req.setdefault("bucketName", "customer-pii-production")
            req.setdefault(
                "policy",
                '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::customer-pii-production/*"}]}',
            )
            resp = {}
        elif action in ["DisableKey", "ScheduleKeyDeletion"]:
            req.setdefault("keyId", f"arn:aws:kms:{region}:{account_id}:key/{uuid.uuid4()}")
            resp = {"keyId": req["keyId"], "keyState": "PendingDeletion" if action == "ScheduleKeyDeletion" else "Disabled"}
        else:
            resp = {"response": "OK" if is_success else "Error"}

        return req, resp
