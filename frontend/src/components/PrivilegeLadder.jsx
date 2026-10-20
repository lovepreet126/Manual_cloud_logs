import React from "react";
import { Lock, Unlock, ShieldAlert, CheckCircle2, User, Key, AlertOctagon } from "lucide-react";

export default function PrivilegeLadder({ session, privilegeLevels, alertMessage }) {
  const levels = [
    {
      level: 0,
      title: "Pre-Auth",
      subtitle: "Unauthenticated Caller",
      badge: "Public",
      desc: "Console Login, STS session requests, public probing",
    },
    {
      level: 1,
      title: "Recon & Discovery",
      subtitle: "Authenticated User",
      badge: "Standard",
      desc: "DescribeInstances, ListBuckets, STS whoami",
    },
    {
      level: 2,
      title: "Resource Operator",
      subtitle: "Compute & Storage",
      badge: "Operational",
      desc: "RunInstances, PutObject, SecurityGroup ingress",
    },
    {
      level: 3,
      title: "Privilege Escalation",
      subtitle: "IAM & Role Operations",
      badge: "Escalation",
      desc: "AssumeRole, AttachUserPolicy, CreateAccessKey",
    },
    {
      level: 4,
      title: "Cloud Administrator",
      subtitle: "Full Root / Exfiltration",
      badge: "Critical",
      desc: "StopLogging, DeleteTrail, Public S3 Exfil, KMS deletion",
    },
  ];

  const currentLevel = session?.current_privilege_level ?? 0;
  const unlockedLevels = session?.unlocked_privilege_levels ?? [0];

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Alert Banner if triggered */}
      {(alertMessage || session?.compromised_indicator || session?.consecutive_failed_logins >= 3) && (
        <div
          className="alert-pulse"
          style={{
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            borderRadius: 12,
            padding: "12px 18px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={20} color="#f43f5e" />
            <div>
              <span style={{ fontWeight: 700, color: "#f43f5e", fontSize: "0.9rem" }}>
                SECURITY TELEMETRY ALERT:
              </span>{" "}
              <span style={{ color: "#fecdd3", fontSize: "0.85rem" }}>
                {alertMessage || (session?.consecutive_failed_logins >= 3
                  ? `Warning: ${session.consecutive_failed_logins} failed logins detected in current session!`
                  : "Anomalous / Suspicious IP address detected in session telemetry!")}
              </span>
            </div>
          </div>
          {session?.consecutive_failed_logins > 0 && (
            <span className="badge badge-failure">
              {session.consecutive_failed_logins} Failed Attempts
            </span>
          )}
        </div>
      )}

      {/* Main Ladder Panel */}
      <div className="glass-panel" style={{ padding: "20px 24px" }}>
        {/* Header with Principal Info */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: 14,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                Cloud Privilege Ladder & Security Gating
              </h2>
              <span className={`badge ${session?.is_authenticated ? "badge-success" : "badge-locked"}`}>
                {session?.is_authenticated ? "Authenticated Session" : "Unauthenticated"}
              </span>
              {session?.god_mode && (
                <span className="badge badge-warning">
                  God Mode Active (Gates Bypassed)
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
              Cloud activity execution is gated by privilege progression. Clear preceding tiers to unlock high-impact operations.
            </p>
          </div>

          {/* Current Principal Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(0,0,0,0.4)",
            border: "1px solid var(--border-subtle)",
            padding: "8px 14px",
            borderRadius: 8,
          }}>
            <User size={16} color="#38bdf8" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Active Principal / Caller
              </div>
              <div className="code-font" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>
                {session?.active_role_arn || session?.active_principal || "Anonymous / Public Caller"}
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Timeline */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
          position: "relative",
        }}>
          {levels.map((lvl) => {
            const isCurrent = currentLevel === lvl.level;
            const isUnlocked = session?.god_mode || unlockedLevels.includes(lvl.level) || currentLevel >= lvl.level;

            let borderColor = "var(--border-subtle)";
            let bgColor = "rgba(15, 23, 42, 0.4)";
            let badgeClass = "badge-locked";

            if (isCurrent) {
              borderColor = "#38bdf8";
              bgColor = "rgba(56, 189, 248, 0.08)";
              badgeClass = "badge-info";
            } else if (isUnlocked) {
              borderColor = "rgba(16, 185, 129, 0.35)";
              bgColor = "rgba(16, 185, 129, 0.05)";
              badgeClass = "badge-success";
            }

            return (
              <div
                key={lvl.level}
                className={isCurrent ? "active-pulse" : ""}
                style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
              >
                {/* Top Row: Level & Lock icon */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: isUnlocked ? (isCurrent ? "#0284c7" : "#059669") : "#334155",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {lvl.level}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                      {lvl.title}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <Unlock size={15} color={isCurrent ? "#38bdf8" : "#10b981"} />
                  ) : (
                    <Lock size={15} color="#64748b" />
                  )}
                </div>

                {/* Subtitle & Description */}
                <div>
                  <div style={{ fontSize: "0.75rem", color: isUnlocked ? "#cbd5e1" : "var(--text-muted)", fontWeight: 500, marginBottom: 4 }}>
                    {lvl.subtitle}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                    {lvl.desc}
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: "0.68rem" }}>
                    {isCurrent ? "Active Tier" : isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                  {isUnlocked && <CheckCircle2 size={13} color="#10b981" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
