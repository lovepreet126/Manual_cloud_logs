# CloudSec LogForge — Manual Cloud Activity & Security Audit Log Generator

An interactive, full-stack cybersecurity platform designed for manually simulating cloud operations and generating structured, ground-truth **JSON audit logs** across **AWS (CloudTrail)**, **Azure (Activity Logs)**, and **GCP (Cloud Audit Logs)**.

---

## 🏛 Architecture & Project Organization

All files are neatly organized into independent, dedicated directories:

```
manuallogs/
├── start_all.bat                   # 🚀 1-Click launcher starting both backend & frontend
├── backend/                        # 🐍 Python FastAPI Backend Server
│   ├── app/
│   │   ├── main.py                 # FastAPI application entrypoint with CORS & routes
│   │   ├── config.py               # Constants, IP presets, privilege tiers
│   │   ├── core/
│   │   │   ├── session_manager.py  # Session state machine, identity tracker, alert engine
│   │   │   └── privilege_engine.py # Privilege gating logic & complete multi-cloud activity registry
│   │   ├── models/
│   │   │   ├── activity_models.py  # Action definition, execution payload, session state
│   │   │   └── log_schemas.py      # Unified dual-format JSON log schemas
│   │   ├── generators/
│   │   │   ├── aws_generator.py    # AWS CloudTrail v1.08 generator (IAM, EC2, S3, KMS, CloudTrail)
│   │   │   ├── azure_generator.py  # Azure Activity Log generator (RBAC, Compute, Storage, KeyVault)
│   │   │   └── gcp_generator.py    # GCP Cloud Audit Log generator (IAM, GCS, GCE, SecretManager)
│   │   ├── routers/
│   │   │   ├── session_router.py   # /api/session (get, reset, switch cloud, god mode)
│   │   │   ├── activities_router.py# /api/activities (catalog with real-time lock/unlock status)
│   │   │   └── logs_router.py      # /api/logs (execute manual action, query, export JSON)
│   │   └── storage/
│   │       └── log_store.py        # In-memory store + persistent JSON file writer
│   ├── data/
│   │   └── cloud_manual_logs.json  # 📁 Real-time saved JSON audit log output
│   ├── requirements.txt            # Python dependencies (FastAPI, Uvicorn, Pydantic)
│   ├── test_simulation.py          # 11-step automated verification test suite
│   └── start_backend.bat           # Dedicated backend launcher (Port 8000)
│
└── frontend/                       # ⚛️ Vite + React Interactive Dashboard
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                 # Master layout & state coordinator
    │   ├── index.css               # SOC dark console styling & micro-animations
    │   ├── services/
    │   │   └── api.js              # REST client calling backend APIs
    │   └── components/
    │       ├── Navbar.jsx          # Cloud switcher (AWS/Azure/GCP), Session ID, God Mode toggle
    │       ├── PrivilegeLadder.jsx # Visual 5-stage stepper showing gating & active principal
    │       ├── ActivityGrid.jsx    # Action cards with category filters & dynamic lock badges
    │       ├── ActionModal.jsx     # Success/Failure selector, IP presets, parameters, JSON preview
    │       ├── LiveLogViewer.jsx   # Real-time JSON log viewer with copy, download, & dual formats
    │       └── PlaybookGuide.jsx   # Attack & benign workflow guides (Brute Force, S3 Exfil, Evasion)
    └── start_frontend.bat          # Dedicated frontend launcher (Port 5173)
```

---

## 🔒 The Progressive Privilege Ladder

To mirror real-world cloud security controls, operations cannot be executed out-of-order:

| Tier | Name | Allowed Operations | Progression Criteria |
| :--- | :--- | :--- | :--- |
| **Level 0** | **Pre-Authentication** | Console Login, GetSessionToken, Public Probing | Initial state for any public actor |
| **Level 1** | **Recon & Discovery** | DescribeInstances, ListBuckets, GetCallerIdentity (whoami) | **Unlocked ONLY after a SUCCESSFUL Login** |
| **Level 2** | **Resource Operator** | RunInstances (Compute), PutObject (Storage), AuthorizeSecurityGroupIngress | Unlocked after completing discovery actions |
| **Level 3** | **Privilege Escalation** | AssumeRole (SecurityAdminRole), AttachUserPolicy, CreateAccessKey | Unlocked after resource operator access |
| **Level 4** | **Cloud Admin & Tampering** | StopLogging, DeleteTrail, Exfiltrate S3 (Public Bucket), Schedule KMS Deletion | **Unlocked ONLY upon successful Privilege Escalation** |

> **Developer God Mode**: A toggle in the top navigation bar allows you to bypass the privilege ladder during testing to trigger any operation directly.

---

## ⚡ How to Run

### Method 1: One-Click Launch (Recommended)
Double-click:
```bat
start_all.bat
```
This automatically starts both the FastAPI backend on `http://127.0.0.1:8000` and the Vite React frontend on `http://localhost:5173`.

### Method 2: Manual Start

**Backend**:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

**Frontend**:
```bash
cd frontend
npm.cmd run dev
```
Open your browser at `http://localhost:5173`.

---

## 🎯 How Manual Log Generation Works

1. **Select an Action**: Click **"Trigger Activity"** on any unlocked action card (e.g. `AWS Console Login`).
2. **Choose the Outcome**:
   - **`✓ Success (Granted)`**: Generates an authorized cloud audit log (HTTP 200). If it fulfills a privilege milestone, the next level unlocks immediately!
   - **`✕ Failure (Denied)`**: Prompts for simulated Cloud Error Codes (e.g. `FailedAuthentication`, `AccessDenied`, `Client.UnauthorizedOperation`). Emits a failed audit record and prevents progression. Consecutive failed logins trigger a brute-force security alert.
3. **Configure Telemetry**:
   - Select **Source IP Presets**: Corporate Office (`12.158.45.22`), Dev VPN (`54.240.196.18`), Tor Exit Node (`185.220.101.5`), Attacker C2 (`45.154.255.88`), or enter a custom IP.
   - Adjust Region, Principal, or custom resource parameters (e.g., bucket name, instance size, policy ARN).
4. **Execute**: Click **"Execute Action"**.
5. **View & Export JSON**:
   - The record immediately streams to the **Live Security Telemetry & JSON Logs** console.
   - Click any entry to inspect its syntax-highlighted JSON.
   - Switch between **Dual Unified JSON** (with MITRE & anomaly metadata) and **Pure Native Cloud JSON** (exact 1:1 CloudTrail/Azure/GCP).
   - Use **"Copy JSON"** or **"Download .JSON"** for SIEM ingestion (Wazuh, Splunk, Elastic, Sentinel).
   - Persisted automatically to `backend/data/cloud_manual_logs.json`.
