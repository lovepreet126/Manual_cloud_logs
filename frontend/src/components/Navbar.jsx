import React from "react";
import { Cloud, Shield, RefreshCw, Zap, AlertTriangle, Copy, Check } from "lucide-react";

export default function Navbar({
  session,
  onSwitchCloud,
  onResetSession,
  onToggleGodMode,
}) {
  const [copied, setCopied] = React.useState(false);

  const copySessionId = () => {
    if (!session?.session_id) return;
    navigator.clipboard.writeText(session.session_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clouds = [
    { id: "aws", name: "AWS CloudTrail", color: "#ff9900" },
    { id: "azure", name: "Azure Activity", color: "#008ad7" },
    { id: "gcp", name: "GCP Cloud Audit", color: "#4285f4" },
  ];

  return (
    <header style={{
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(13, 19, 34, 0.8)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      padding: "14px 28px",
    }}>
      <div style={{
        maxWidth: 1600,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #0284c7, #38bdf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(56, 189, 248, 0.4)",
          }}>
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>
                CloudSec <span style={{ color: "#38bdf8" }}>LogForge</span>
              </span>
              <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                Manual Studio
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Interactive Cloud Activity & Security Audit Log Generator
            </p>
          </div>
        </div>

        {/* Cloud Provider Switcher */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.35)",
          padding: 4,
          borderRadius: 10,
          border: "1px solid var(--border-subtle)",
          gap: 4,
        }}>
          {clouds.map((c) => {
            const isActive = session?.cloud_provider === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSwitchCloud(c.id)}
                style={{
                  background: isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  border: isActive ? `1px solid ${c.color}` : "1px solid transparent",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? `0 0 12px ${c.color}40` : "none",
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c.color,
                }} />
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Session Info & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Session ID Chip */}
          <div
            onClick={copySessionId}
            title="Click to copy Session ID"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-subtle)",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Session:</span>
            <span className="code-font" style={{ color: "#38bdf8", fontWeight: 600 }}>
              {session?.session_id?.slice(0, 12)}...
            </span>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="var(--text-muted)" />}
          </div>

          {/* God Mode Toggle */}
          <button
            onClick={() => onToggleGodMode()}
            style={{
              background: session?.god_mode ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: session?.god_mode ? "1px solid #f59e0b" : "1px solid var(--border-subtle)",
              color: session?.god_mode ? "#fbbf24" : "var(--text-secondary)",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
            title="Developer God Mode: Bypass privilege lock gates to test any high-privilege action directly"
          >
            <Zap size={15} color={session?.god_mode ? "#fbbf24" : "var(--text-muted)"} />
            God Mode: {session?.god_mode ? "ON (Bypass)" : "OFF"}
          </button>

          {/* Reset Session */}
          <button
            onClick={onResetSession}
            className="btn-secondary"
            title="Reset session state back to Level 0 (Pre-Authentication)"
            style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          >
            <RefreshCw size={14} />
            Reset State
          </button>
        </div>
      </div>
    </header>
  );
}
