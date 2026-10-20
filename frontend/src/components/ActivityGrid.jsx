import React, { useState } from "react";
import { Lock, Play, Search, Filter, ShieldCheck, AlertTriangle, Layers, Terminal } from "lucide-react";

export default function ActivityGrid({ activities, onSelectActivity, activeCloud }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "All",
    "Authentication",
    "Discovery",
    "Resource Mutation",
    "IAM & Escalation",
    "High Impact & Tampering",
  ];

  const filteredActivities = activities.filter((act) => {
    const matchesCategory =
      selectedCategory === "All" || act.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.api_call.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.mitre_technique.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getServiceColor = (service) => {
    const s = service.toLowerCase();
    if (s.includes("iam") || s.includes("signin") || s.includes("auth")) return "#38bdf8";
    if (s.includes("s3") || s.includes("storage")) return "#10b981";
    if (s.includes("ec2") || s.includes("compute")) return "#f59e0b";
    if (s.includes("cloudtrail") || s.includes("insights") || s.includes("audit")) return "#f43f5e";
    if (s.includes("kms") || s.includes("keyvault") || s.includes("secret")) return "#a855f7";
    return "#94a3b8";
  };

  return (
    <div className="glass-panel" style={{ padding: "24px", marginBottom: 28 }}>
      {/* Top Header & Search Controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Terminal size={20} color="#38bdf8" />
            Manual Activity Operations ({filteredActivities.length})
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Select any cloud action to configure parameters, toggle Success/Failure, and generate realistic telemetry.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(0, 0, 0, 0.4)",
          border: "1px solid var(--border-subtle)",
          padding: "6px 12px",
          borderRadius: 8,
          width: "100%",
          maxWidth: 320,
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search action, API, MITRE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              outline: "none",
              fontSize: "0.85rem",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 8,
        marginBottom: 20,
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: isActive ? "rgba(56, 189, 248, 0.15)" : "transparent",
                border: isActive ? "1px solid #38bdf8" : "1px solid transparent",
                color: isActive ? "#38bdf8" : "var(--text-secondary)",
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Activity Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}>
        {filteredActivities.map((act) => {
          const isUnlocked = act.is_unlocked;
          const serviceColor = getServiceColor(act.service);

          return (
            <div
              key={act.id}
              style={{
                background: isUnlocked ? "var(--bg-secondary)" : "rgba(10, 15, 26, 0.6)",
                border: isUnlocked
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px dashed rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: isUnlocked ? 1 : 0.65,
                transition: "all 0.25s ease",
                position: "relative",
              }}
            >
              {/* Card Top: Badges */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <span
                    className="badge"
                    style={{
                      background: `${serviceColor}18`,
                      color: serviceColor,
                      border: `1px solid ${serviceColor}40`,
                      fontSize: "0.7rem",
                    }}
                  >
                    {act.service.toUpperCase()}
                  </span>

                  <div style={{ display: "flex", gap: 6 }}>
                    <span
                      className={`badge ${
                        act.required_privilege_level === 0
                          ? "badge-info"
                          : act.required_privilege_level <= 2
                          ? "badge-success"
                          : act.required_privilege_level === 3
                          ? "badge-warning"
                          : "badge-failure"
                      }`}
                      style={{ fontSize: "0.68rem" }}
                    >
                      Lvl {act.required_privilege_level}
                    </span>
                    {act.is_critical_anomaly && (
                      <span className="badge badge-failure" style={{ fontSize: "0.68rem" }}>
                        Anomaly
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & API Name */}
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>
                  {act.name}
                </h3>
                <div className="code-font" style={{ fontSize: "0.75rem", color: "#38bdf8", marginBottom: 10 }}>
                  {act.api_call}
                </div>

                {/* Description */}
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 14 }}>
                  {act.description}
                </p>

                {/* MITRE ATT&CK Info */}
                <div style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#94a3b8" }}>MITRE Tactic:</span>
                    <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{act.mitre_tactic}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#94a3b8" }}>Technique:</span>
                    <span className="code-font" style={{ color: "#f59e0b" }}>
                      {act.mitre_technique_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button / Lock Status */}
              <div>
                {isUnlocked ? (
                  <button
                    onClick={() => onSelectActivity(act)}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      padding: "9px 16px",
                    }}
                  >
                    <Play size={15} />
                    Trigger Activity
                  </button>
                ) : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "rgba(100, 116, 139, 0.1)",
                    border: "1px solid rgba(100, 116, 139, 0.2)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                  }}>
                    <Lock size={14} />
                    <span>{act.lock_reason || `Requires Level ${act.required_privilege_level}`}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
