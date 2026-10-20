import json
import os
from typing import List, Dict, Any, Optional
from app.config import LOGS_FILE, DATA_DIR


class LogStore:
    """
    Stores generated cloud logs in memory and writes directly to JSON / JSONL files on disk.
    """

    _logs: List[Dict[str, Any]] = []

    @classmethod
    def initialize(cls):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if LOGS_FILE.exists():
            try:
                with open(LOGS_FILE, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        cls._logs = json.loads(content)
            except Exception:
                cls._logs = []

    @classmethod
    def add_log(cls, entry: Dict[str, Any]) -> Dict[str, Any]:
        cls._logs.insert(0, entry)  # Prepend newest log first
        cls._persist()
        return entry

    @classmethod
    def get_logs(
        cls,
        session_id: Optional[str] = None,
        cloud_provider: Optional[str] = None,
        status: Optional[str] = None,
        is_anomaly: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        results = cls._logs

        if session_id:
            results = [l for l in results if l.get("session_id") == session_id]

        if cloud_provider:
            results = [l for l in results if l.get("cloud_provider", "").lower() == cloud_provider.lower()]

        if status:
            results = [l for l in results if l.get("status", "").lower() == status.lower()]

        if is_anomaly is not None:
            results = [l for l in results if l.get("is_anomaly") == is_anomaly]

        if search:
            query = search.lower()
            results = [
                l
                for l in results
                if query in l.get("action", "").lower()
                or query in l.get("principal", "").lower()
                or query in l.get("source_ip", "").lower()
                or query in json.dumps(l.get("raw_event", {})).lower()
            ]

        return results[offset : offset + limit]

    @classmethod
    def get_log_by_id(cls, log_id: str) -> Optional[Dict[str, Any]]:
        for l in cls._logs:
            if l.get("id") == log_id:
                return l
        return None

    @classmethod
    def clear_logs(cls, session_id: Optional[str] = None):
        if session_id:
            cls._logs = [l for l in cls._logs if l.get("session_id") != session_id]
        else:
            cls._logs = []
        cls._persist()

    @classmethod
    def export_json_string(cls, session_id: Optional[str] = None, pretty: bool = True) -> str:
        logs = cls.get_logs(session_id=session_id, limit=10000)
        return json.dumps(logs, indent=2 if pretty else None)

    @classmethod
    def export_native_json(cls, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns only the raw native cloud provider records (CloudTrail/Azure/GCP)."""
        logs = cls.get_logs(session_id=session_id, limit=10000)
        return [l.get("raw_event", l) for l in logs]

    @classmethod
    def _persist(cls):
        try:
            with open(LOGS_FILE, "w", encoding="utf-8") as f:
                json.dump(cls._logs, f, indent=2)
        except Exception as e:
            print(f"[LogStore] Error writing logs to {LOGS_FILE}: {e}")


# Initialize store on import
LogStore.initialize()
