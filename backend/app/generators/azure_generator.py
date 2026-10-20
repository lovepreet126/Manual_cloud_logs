import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class AzureLogGenerator:
    """
    Generates authentic Azure Activity Log records for manual security actions.
    """

    SUBSCRIPTION_ID = "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
    RESOURCE_GROUP = "rg-enterprise-cloud-prod"

    @classmethod
    def generate_azure_event(
        cls,
        action: str,
        service: str,
        status: str,
        principal: str,
        source_ip: str,
        region: str = "eastus",
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
        correlation_id = str(uuid.uuid4())
        event_data_id = str(uuid.uuid4())
        operation_id = str(uuid.uuid4())

        is_success = status.lower() in ["success", "succeeded", "ok"]
        caller_email = principal if "@" in principal else f"{principal}@enterprise.onmicrosoft.com"

        # Determine Azure Operation Name & Resource Provider
        op_name, res_provider, res_type = cls._resolve_operation(action, service)

        resource_id = (
            f"/subscriptions/{cls.SUBSCRIPTION_ID}/resourceGroups/{cls.RESOURCE_GROUP}/"
            f"providers/{res_provider}/{res_type.split('/')[-1]}/{custom_params.get('resourceName', 'res-default')}"
        )

        level = "Informational"
        if not is_success:
            level = "Error"
        elif privilege_level >= 3 or is_anomaly:
            level = "Warning"

        azure_record: Dict[str, Any] = {
            "channels": "Operation",
            "correlationId": correlation_id,
            "description": f"Manual cloud activity executed: {action} ({op_name})",
            "eventDataId": event_data_id,
            "eventName": {"value": "EndRequest", "localizedValue": "End Request"},
            "category": {"value": "Administrative", "localizedValue": "Administrative"},
            "eventTimestamp": event_time,
            "id": f"/subscriptions/{cls.SUBSCRIPTION_ID}/events/{event_data_id}/ticks/638123456789",
            "level": level,
            "operationId": operation_id,
            "operationName": {"value": op_name, "localizedValue": action},
            "resourceGroupName": cls.RESOURCE_GROUP,
            "resourceProviderName": {"value": res_provider, "localizedValue": res_provider},
            "resourceType": {"value": res_type, "localizedValue": res_type.split("/")[-1]},
            "resourceId": resource_id,
            "status": {"value": "Succeeded" if is_success else "Failed", "localizedValue": "Succeeded" if is_success else "Failed"},
            "subStatus": {"value": "OK" if is_success else (error_code or "Forbidden"), "localizedValue": "OK" if is_success else "Forbidden"},
            "submissionTimestamp": event_time,
            "subscriptionId": cls.SUBSCRIPTION_ID,
            "caller": caller_email,
            "httpRequest": {
                "clientRequestId": str(uuid.uuid4()),
                "clientIpAddress": source_ip,
                "method": "POST" if action.startswith(("Create", "Run", "Attach", "Put", "Delete")) else "GET",
                "url": f"https://management.azure.com{resource_id}?api-version=2024-03-01",
            },
            "properties": {
                "statusCode": 200 if is_success else 403,
                "statusMessage": "Action completed successfully" if is_success else (error_message or "AuthorizationFailed: Caller lacks required RBAC role"),
                "serviceRequestId": str(uuid.uuid4()),
                "location": region,
                "parameters": custom_params,
            },
        }

        # Inject SynthoSec Dual Ground-Truth Metadata
        azure_record["_synth_metadata"] = {
            "storyline_id": storyline_id,
            "sequence_index": sequence_number,
            "privilege_level": privilege_level,
            "is_anomaly": is_anomaly,
            "mitre_attack": mitre_info,
            "cloud_provider": "azure",
            "manual_action": action,
            "status": "success" if is_success else "failure",
        }

        return azure_record

    @classmethod
    def _resolve_operation(cls, action: str, service: str):
        mapping = {
            "InteractiveLogin": ("Microsoft.AAD/UserLogins/action", "Microsoft.AAD", "Microsoft.AAD/UserLogins"),
            "ListVirtualMachines": ("Microsoft.Compute/virtualMachines/read", "Microsoft.Compute", "Microsoft.Compute/virtualMachines"),
            "CreateVirtualMachine": ("Microsoft.Compute/virtualMachines/write", "Microsoft.Compute", "Microsoft.Compute/virtualMachines"),
            "ListStorageAccounts": ("Microsoft.Storage/storageAccounts/read", "Microsoft.Storage", "Microsoft.Storage/storageAccounts"),
            "CreateStorageBlob": ("Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action", "Microsoft.Storage", "Microsoft.Storage/storageAccounts"),
            "RoleAssignment": ("Microsoft.Authorization/roleAssignments/write", "Microsoft.Authorization", "Microsoft.Authorization/roleAssignments"),
            "KeyVaultAccess": ("Microsoft.KeyVault/vaults/secrets/read", "Microsoft.KeyVault", "Microsoft.KeyVault/vaults"),
            "DeleteKeyVault": ("Microsoft.KeyVault/vaults/delete", "Microsoft.KeyVault", "Microsoft.KeyVault/vaults"),
            "DeleteDiagnosticSettings": ("Microsoft.Insights/diagnosticSettings/delete", "Microsoft.Insights", "Microsoft.Insights/diagnosticSettings"),
        }
        return mapping.get(action, (f"Microsoft.{service.capitalize()}/{action}/action", f"Microsoft.{service.capitalize()}", f"Microsoft.{service.capitalize()}/generic"))
