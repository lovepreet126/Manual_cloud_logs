import React, { useState } from "react";
import { X, CheckCircle, XCircle, AlertCircle, ShieldAlert, Cpu, Globe, User, Terminal, Code } from "lucide-react";

export default function ActionModal({
  activity,
  session,
  ipPresets,
  onClose,
  onExecute,
}) {
  if (!activity) return null;

  const [status, setStatus] = useState("success");
  const [selectedIpPreset, setSelectedIpPreset] = useState("corporate_office");
  const [customIp, setCustomIp] = useState("12.158.45.22");
  const [principal, setPrincipal] = useState(
    session?.active_principal || (activity.cloud === "aws" ? "ria_developer" : "ria.dev@enterprise.com")
  );
  const [region, setRegion] = useState(
    activity.cloud === "aws" ? "us-east-1" : activity.cloud === "azure" ? "eastus" : "us-central1"
  );
  const [selectedErrorCode, setSelectedErrorCode] = useState(
    activity.error_options?.[0]?.code || "Client.UnauthorizedOperation"
  );
  const [customErrorMessage, setCustomErrorMessage] = useState(
    activity.error_options?.[0]?.message || "You are not authorized to perform this operation."
  );
  const [customParams, setCustomParams] = useState(activity.default_params || {});
  const [isAnomalyOverride, setIsAnomalyOverride] = useState(activity.is_critical_anomaly);
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  const handleIpPresetChange = (presetKey) => {
    setSelectedIpPreset(presetKey);
    if (ipPresets && ipPresets[presetKey]) {
      setCustomIp(ipPresets[presetKey].ip);
    }
  };

  const handleErrorCodeChange = (code) => {
    setSelectedErrorCode(code);
    const opt = activity.error_options?.find((o) => o.code === code);
    if (opt) setCustomErrorMessage(opt.message);
  };

  const handleParamChange = (key, value) => {
    setCustomParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorBanner(null);

    const payload = {
      activity_id: activity.id,
      status: status,
      source_ip: customIp,
      principal: principal,
      region: region,
      error_code: status === "failure" ? selectedErrorCode : null,
      error_message: status === "failure" ? customErrorMessage : null,
      custom_params: customParams,
      is_anomaly_override: isAnomalyOverride,
    };

    try {
      await onExecute(payload);
      onClose();
    } catch (err) {
      setErrorBanner(err.message || "Failed to execute activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
                {activity.cloud.toUpperCase()}
              </span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                {activity.name}
              </h2>
            </div>
            <div className="code-font" style={{ fontSize: "0.78rem", color: "#38bdf8", marginTop: 2 }}>
              {activity.api_call}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {/* Error Banner if API rejected */}
          {errorBanner && (
            <div style={{
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#fecdd3",
              fontSize: "0.85rem",
            }}>
              <AlertCircle size={18} color="#f43f5e" />
              <span>{errorBanner}</span>
            </div>
          )}

          {/* STEP 1: SUCCESS OR FAILURE SELECTION */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: 8 }}>
              1. Operation Outcome (Success or Failure) <span style={{ color: "#f43f5e" }}>*</span>
            </label>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 12 }}>
              Decide whether this cloud action succeeds or fails. Unlocking higher privileges requires successful authentication and privilege escalation.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Success Button */}
              <button
                type="button"
                onClick={() => setStatus("success")}
                style={{
                  background: status === "success" ? "rgba(16, 185, 129, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  border: status === "success" ? "2px solid #10b981" : "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.2s ease",
                  textAlign: "left",
                }}
              >
                <CheckCircle size={24} color={status === "success" ? "#10b981" : "#64748b"} />
                <div>
                  <div style={{ fontWeight: 700, color: status === "success" ? "#10b981" : "#e2e8f0", fontSize: "0.95rem" }}>
                    Success (Granted)
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                    HTTP 200 OK / Authorized
                  </div>
                </div>
              </button>

              {/* Failure Button */}
              <button
                type="button"
                onClick={() => setStatus("failure")}
                style={{
                  background: status === "failure" ? "rgba(244, 63, 94, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  border: status === "failure" ? "2px solid #f43f5e" : "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.2s ease",
                  textAlign: "left",
                }}
              >
                <XCircle size={24} color={status === "failure" ? "#f43f5e" : "#64748b"} />
                <div>
                  <div style={{ fontWeight: 700, color: status === "failure" ? "#f43f5e" : "#e2e8f0", fontSize: "0.95rem" }}>
                    Failure / Denied
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                    HTTP 401/403 AccessDenied
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* IF FAILURE: ERROR CODE & MESSAGE */}
          {status === "failure" && (
            <div style={{
              background: "rgba(244, 63, 94, 0.06)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              borderRadius: 10,
              padding: 16,
              marginBottom: 20,
            }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#f43f5e", marginBottom: 8 }}>
                Select Simulated Error Code
              </label>

              {activity.error_options && activity.error_options.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {activity.error_options.map((opt) => (
                    <label
                      key={opt.code}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        background: selectedErrorCode === opt.code ? "rgba(244, 63, 94, 0.15)" : "rgba(0,0,0,0.2)",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: selectedErrorCode === opt.code ? "1px solid #f43f5e" : "1px solid transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="errorOption"
                        checked={selectedErrorCode === opt.code}
                        onChange={() => handleErrorCodeChange(opt.code)}
                      />
                      <div>
                        <span className="code-font" style={{ fontWeight: 600, color: "#fecdd3" }}>
                          {opt.code}
                        </span>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{opt.message}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : null}

              <div>
                <label style={{ display: "block", fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: 4 }}>
                  Custom Error Message:
                </label>
                <input
                  type="text"
                  value={customErrorMessage}
                  onChange={(e) => setCustomErrorMessage(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: "0.82rem",
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: SOURCE IP & CONTEXT */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: 6 }}>
              2. Source IP Address
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {ipPresets &&
                Object.entries(ipPresets).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleIpPresetChange(key)}
                    style={{
                      background: selectedIpPreset === key ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.04)",
                      border: selectedIpPreset === key ? "1px solid #38bdf8" : "1px solid var(--border-subtle)",
                      color: val.type === "malicious" ? "#f43f5e" : "#cbd5e1",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    {val.label}
                  </button>
                ))}
            </div>

            <input
              type="text"
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              placeholder="e.g. 12.158.45.22"
              className="code-font"
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* STEP 3: CALLER PRINCIPAL & REGION */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                Caller Principal / User
              </label>
              <input
                type="text"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="code-font"
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#fff",
                  fontSize: "0.82rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                Target Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#fff",
                  fontSize: "0.82rem",
                }}
              >
                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                <option value="us-west-2">us-west-2 (Oregon)</option>
                <option value="eu-west-1">eu-west-1 (Ireland)</option>
                <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                <option value="eastus">eastus (Azure)</option>
                <option value="us-central1">us-central1 (GCP)</option>
              </select>
            </div>
          </div>

          {/* STEP 4: ACTION PARAMETERS */}
          {Object.keys(customParams).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                Operation Parameters
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(customParams).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="code-font" style={{ width: 140, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {k}:
                    </span>
                    <input
                      type="text"
                      value={typeof v === "object" ? JSON.stringify(v) : v}
                      onChange={(e) => handleParamChange(k, e.target.value)}
                      className="code-font"
                      style={{
                        flex: 1,
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        color: "#fff",
                        fontSize: "0.8rem",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 18,
          }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                background: status === "success" ? "linear-gradient(135deg, #059669, #10b981)" : "linear-gradient(135deg, #dc2626, #ef4444)",
              }}
            >
              {loading ? "Recording Telemetry..." : `Execute Action [${status.toUpperCase()}]`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
