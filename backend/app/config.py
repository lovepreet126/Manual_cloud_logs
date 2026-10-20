import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
LOGS_FILE = DATA_DIR / "cloud_manual_logs.json"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Cloud Providers
CLOUD_AWS = "aws"
CLOUD_AZURE = "azure"
CLOUD_GCP = "gcp"
SUPPORTED_CLOUDS = [CLOUD_AWS, CLOUD_AZURE, CLOUD_GCP]

# IP Presets for realistic cloud activity
IP_PRESETS = {
    "corporate_office": {"ip": "12.158.45.22", "label": "Corporate HQ (Trusted)", "type": "benign"},
    "dev_vpn": {"ip": "54.240.196.18", "label": "Developer VPN (Trusted)", "type": "benign"},
    "cloud_nat": {"ip": "35.180.12.90", "label": "Cloud NAT Gateway (Internal)", "type": "benign"},
    "suspicious_tor": {"ip": "185.220.101.5", "label": "Tor Exit Node (Suspicious)", "type": "malicious"},
    "attacker_c2": {"ip": "45.154.255.88", "label": "External Untrusted IP (Attacker)", "type": "malicious"},
    "foreign_datacenter": {"ip": "194.26.29.112", "label": "Foreign VPS / Proxy (Anomaly)", "type": "malicious"},
}

# Privilege Ladder Levels
PRIVILEGE_LEVELS = {
    0: {
        "id": "unauthenticated",
        "name": "Level 0: Pre-Authentication",
        "description": "Unauthenticated public actor. Can only attempt login, identity federation, or public reconnaissance.",
        "badge_color": "gray",
    },
    1: {
        "id": "authenticated_recon",
        "name": "Level 1: Authenticated Recon & Discovery",
        "description": "Standard identity verified. Read-only permissions, service listing, caller identity inspection.",
        "badge_color": "blue",
    },
    2: {
        "id": "resource_operator",
        "name": "Level 2: Resource Operator",
        "description": "Operational permissions to provision, mutate, start/stop compute, storage, and networking resources.",
        "badge_color": "emerald",
    },
    3: {
        "id": "privilege_escalation",
        "name": "Level 3: Privilege Escalation & IAM Ops",
        "description": "Attempting or performing role assumption, credential creation, and policy modifications.",
        "badge_color": "amber",
    },
    4: {
        "id": "critical_admin",
        "name": "Level 4: Root / Cloud Admin & Exfiltration",
        "description": "Full administrative privileges. High-impact operations, audit tampering, data exfiltration, and resource destruction.",
        "badge_color": "rose",
    },
}
