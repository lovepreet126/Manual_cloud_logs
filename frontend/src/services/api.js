const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchSession(sessionId, cloud = "aws") {
  const url = new URL(`${API_BASE}/session`);
  if (sessionId) url.searchParams.append("session_id", sessionId);
  if (cloud) url.searchParams.append("cloud", cloud);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch session state");
  return res.json();
}

export async function resetSession(sessionId, cloud) {
  const url = new URL(`${API_BASE}/session/reset`);
  url.searchParams.append("session_id", sessionId);
  if (cloud) url.searchParams.append("cloud", cloud);
  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset session");
  return res.json();
}

export async function switchCloud(sessionId, cloud) {
  const url = new URL(`${API_BASE}/session/cloud`);
  url.searchParams.append("session_id", sessionId);
  url.searchParams.append("cloud", cloud);
  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) throw new Error("Failed to switch cloud provider");
  return res.json();
}

export async function toggleGodMode(sessionId, enabled = null) {
  const url = new URL(`${API_BASE}/session/god-mode`);
  url.searchParams.append("session_id", sessionId);
  if (enabled !== null) url.searchParams.append("enabled", enabled);
  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) throw new Error("Failed to toggle god mode");
  return res.json();
}

export async function fetchActivities(sessionId, cloud) {
  const url = new URL(`${API_BASE}/activities`);
  if (sessionId) url.searchParams.append("session_id", sessionId);
  if (cloud) url.searchParams.append("cloud", cloud);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch activities");
  return res.json();
}

export async function executeActivity(sessionId, payload) {
  const url = new URL(`${API_BASE}/logs/execute`);
  url.searchParams.append("session_id", sessionId);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to execute activity");
  }
  return res.json();
}

export async function fetchLogs(filters = {}) {
  const url = new URL(`${API_BASE}/logs`);
  if (filters.session_id) url.searchParams.append("session_id", filters.session_id);
  if (filters.cloud) url.searchParams.append("cloud", filters.cloud);
  if (filters.status) url.searchParams.append("status", filters.status);
  if (filters.anomaly !== undefined && filters.anomaly !== "")
    url.searchParams.append("anomaly", filters.anomaly);
  if (filters.search) url.searchParams.append("search", filters.search);
  if (filters.limit) url.searchParams.append("limit", filters.limit);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function clearLogs(sessionId) {
  const url = new URL(`${API_BASE}/logs`);
  if (sessionId) url.searchParams.append("session_id", sessionId);
  const res = await fetch(url.toString(), { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to clear logs");
  return res.json();
}

export function getExportJsonUrl(sessionId) {
  return `${API_BASE}/logs/export/json${sessionId ? `?session_id=${sessionId}` : ""}`;
}

export function getExportNativeUrl(sessionId) {
  return `${API_BASE}/logs/export/native${sessionId ? `?session_id=${sessionId}` : ""}`;
}

export async function fetchIpPresets() {
  const res = await fetch(`${API_BASE}/session/ip-presets`);
  if (!res.ok) throw new Error("Failed to fetch IP presets");
  return res.json();
}

export async function fetchPrivilegeLevels() {
  const res = await fetch(`${API_BASE}/session/privilege-levels`);
  if (!res.ok) throw new Error("Failed to fetch privilege levels");
  return res.json();
}
