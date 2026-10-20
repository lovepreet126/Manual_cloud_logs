import React, { useState } from "react";
import { Download, Copy, Trash2, Check, ChevronDown, ChevronRight, Search, FileJson, Shield, AlertTriangle } from "lucide-react";

export default function LiveLogViewer({
  logs,
  onClearLogs,
  exportJsonUrl,
  exportNativeUrl,
}) {
  const [expandedLogId, setExpandedLogId] = useState(logs[0]?.id || null);
  const [viewMode, setViewMode] = useState("dual"); // "dual" or "native"
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [allCopied, setAllCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      filterStatus === "all" || log.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source_ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.error_code && log.error_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      JSON.stringify(log.raw_event).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const copyLogJson = (log, e) => {
    e.stopPropagation();
    const dataToCopy = viewMode === "native" ? log.raw_event : log;
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllLogs = () => {
    const dataToCopy =
      viewMode === "native" ? logs.map((l) => l.raw_event) : logs;
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: "24px" }}>
      {/* Top Header & Export Controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileJson size={22} color="#38bdf8" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              Live Security Telemetry & JSON Logs ({logs.length})
            </h2>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
            Real-time audit records emitted from your manual cloud activities. Formatted in authentic JSON schema.
          </p>
        </div>

        {/* Toolbar buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Format Mode Selector */}
          <div style={{
            display: "flex",
            background: "rgba(0,0,0,0.3)",
            padding: 3,
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
          }}>
            <button
              onClick={() => setViewMode("dual")}
              style={{
                background: viewMode === "dual" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                border: "none",
                color: viewMode === "dual" ? "#38bdf8" : "var(--text-muted)",
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Dual Unified JSON
            </button>
            <button
              onClick={() => setViewMode("native")}
              style={{
                background: viewMode === "native" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                border: "none",
                color: viewMode === "native" ? "#38bdf8" : "var(--text-muted)",
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Pure Native Cloud JSON
            </button>
          </div>

          {/* Copy All */}
          <button onClick={copyAllLogs} className="btn-secondary" style={{ fontSize: "0.8rem" }}>
            {allCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {allCopied ? "Copied All!" : "Copy JSON"}
          </button>

          {/* Download JSON */}
          <a
            href={viewMode === "native" ? exportNativeUrl : exportJsonUrl}
            download
            className="btn-primary"
            style={{ fontSize: "0.8rem", padding: "7px 14px", textDecoration: "none" }}
          >
            <Download size={14} />
            Download .JSON
          </a>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            className="btn-secondary"
            style={{ fontSize: "0.8rem", color: "#f43f5e" }}
            title="Clear all generated logs"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 18,
        background: "rgba(0, 0, 0, 0.25)",
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid var(--border-subtle)",
      }}>
        {/* Status Filters */}
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "success", "failure"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                background: filterStatus === st ? "rgba(255, 255, 255, 0.12)" : "transparent",
                border: "none",
                color: filterStatus === st ? "#fff" : "var(--text-muted)",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {st === "all" ? "All Logs" : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter logs by keyword or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              outline: "none",
              fontSize: "0.8rem",
              width: 220,
            }}
          />
        </div>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "48px 20px",
          color: "var(--text-muted)",
          border: "1px dashed var(--border-subtle)",
          borderRadius: 10,
        }}>
          <FileJson size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#cbd5e1" }}>No Logs Emitted Yet</div>
          <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
            Click "Trigger Activity" on any unlocked cloud operation above to generate your first JSON audit record!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isSuccess = log.status.toLowerCase() === "success";
            const displayJson = viewMode === "native" ? log.raw_event : log;

            return (
              <div
                key={log.id}
                style={{
                  background: "var(--bg-secondary)",
                  border: isExpanded ? "1px solid var(--border-active)" : "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Accordion Row Header */}
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {isExpanded ? <ChevronDown size={16} color="#38bdf8" /> : <ChevronRight size={16} color="#64748b" />}
                    
                    <span className="code-font" style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      #{String(log.sequence_number).padStart(3, "0")}
                    </span>

                    <span className={`badge ${isSuccess ? "badge-success" : "badge-failure"}`}>
                      {log.status}
                    </span>

                    <span className="badge badge-info" style={{ fontSize: "0.68rem" }}>
                      {log.cloud_provider.toUpperCase()}
                    </span>

                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#f8fafc" }}>
                      {log.activity_name || log.action}
                    </span>

                    {log.is_anomaly && (
                      <span className="badge badge-failure" style={{ fontSize: "0.68rem" }}>
                        Anomaly Alert
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Source IP Badge */}
                    <span className="code-font" style={{
                      fontSize: "0.76rem",
                      color: ["185.220.101.5", "45.154.255.88"].includes(log.source_ip) ? "#f43f5e" : "#94a3b8",
                      background: "rgba(0,0,0,0.3)",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}>
                      {log.source_ip}
                    </span>

                    {/* Timestamp */}
                    <span className="code-font" style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      {log.timestamp.slice(11, 19)} UTC
                    </span>

                    {/* Copy JSON Button */}
                    <button
                      onClick={(e) => copyLogJson(log, e)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        color: copiedId === log.id ? "#10b981" : "var(--text-muted)",
                      }}
                      title="Copy JSON for this event"
                    >
                      {copiedId === log.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Expanded JSON Inspector */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid var(--border-subtle)",
                    background: "#050811",
                    padding: "16px 20px",
                  }}>
                    {/* Metadata Header */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}>
                      <div>
                        Principal: <span className="code-font" style={{ color: "#38bdf8" }}>{log.principal}</span> | 
                        Region: <span className="code-font" style={{ color: "#cbd5e1" }}> {log.region}</span>
                        {log.mitre_attack && (
                          <span> | MITRE: <span style={{ color: "#f59e0b" }}>{log.mitre_attack.technique_id} ({log.mitre_attack.technique})</span></span>
                        )}
                      </div>
                      <span className="code-font" style={{ color: "#64748b" }}>
                        Format: {viewMode === "native" ? "Native Cloud Payload" : "SynthoSec Dual JSON"}
                      </span>
                    </div>

                    {/* Formatted JSON Block */}
                    <pre
                      className="code-font"
                      style={{
                        margin: 0,
                        padding: "14px",
                        borderRadius: 8,
                        background: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        color: "#a5f3fc",
                        fontSize: "0.78rem",
                        lineHeight: 1.5,
                        overflowX: "auto",
                        maxHeight: 450,
                      }}
                    >
                      {JSON.stringify(displayJson, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
