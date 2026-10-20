import React, { useState } from "react";
import { BookOpen, ChevronRight, Play, CheckCircle2, ShieldCheck, Flame, Skull } from "lucide-react";

export default function PlaybookGuide({ onSelectActivityById }) {
  const [activePlaybook, setActivePlaybook] = useState(0);

  const playbooks = [
    {
      title: "Playbook A: Normal Cloud Engineer Workflow",
      icon: <ShieldCheck size={18} color="#10b981" />,
      tag: "Benign Baseline",
      tagColor: "badge-success",
      description: "Standard legitimate cloud operations lifecycle with normal privileges.",
      steps: [
        { name: "Step 1: Authenticate to AWS Console", activityId: "aws_console_login", status: "success", tip: "Execute with Success to clear Level 0" },
        { name: "Step 2: Inspect Caller Identity", activityId: "aws_get_caller_identity", status: "success", tip: "Verifies standard developer STS identity" },
        { name: "Step 3: Enumerate EC2 Instances", activityId: "aws_describe_instances", status: "success", tip: "Discovers running virtual compute resources" },
        { name: "Step 4: Launch Dev EC2 Worker", activityId: "aws_run_instances", status: "success", tip: "Provisions resource under Level 2 operational access" },
      ],
    },
    {
      title: "Playbook B: Credential Stuffing & S3 Data Leak",
      icon: <Flame size={18} color="#f59e0b" />,
      tag: "Attack Scenario",
      tagColor: "badge-warning",
      description: "Failed login brute force followed by suspicious Tor login and S3 bucket exfiltration.",
      steps: [
        { name: "Step 1: Attempt Failed Login #1", activityId: "aws_console_login", status: "failure", tip: "Trigger Failure with Bad Password to simulate brute force" },
        { name: "Step 2: Attempt Failed Login #2", activityId: "aws_console_login", status: "failure", tip: "Consecutive failure count increases" },
        { name: "Step 3: Successful Login via Tor IP", activityId: "aws_console_login", status: "success", tip: "Select Tor Exit Node 185.220.101.5 to trigger alert" },
        { name: "Step 4: Enumerate S3 Buckets", activityId: "aws_list_buckets", status: "success", tip: "Identifies customer-pii-production bucket" },
        { name: "Step 5: Exfiltrate Data via Public S3 Policy", activityId: "aws_put_bucket_policy_public", status: "success", tip: "Opens bucket anonymously (* Principal)" },
      ],
    },
    {
      title: "Playbook C: Privilege Escalation & Forensic Tampering",
      icon: <Skull size={18} color="#f43f5e" />,
      tag: "Critical Threat",
      tagColor: "badge-failure",
      description: "Attacker leverages compromised credentials to assume admin role and destroy audit logs.",
      steps: [
        { name: "Step 1: Authenticate User", activityId: "aws_console_login", status: "success", tip: "Establishes initial access" },
        { name: "Step 2: Assume SecurityAdminRole", activityId: "aws_assume_role", status: "success", tip: "Escalates session directly to Level 4 Root/Admin" },
        { name: "Step 3: Stop CloudTrail Logging", activityId: "aws_stop_logging", status: "success", tip: "Defense evasion: Blinds SIEM and SOC detectors" },
        { name: "Step 4: Delete Security Trail", activityId: "aws_delete_trail", status: "success", tip: "Permanently destroys audit trails" },
        { name: "Step 5: Schedule KMS Ransomware Deletion", activityId: "aws_schedule_key_deletion", status: "success", tip: "Impact: Renders enterprise encrypted data unrecoverable" },
      ],
    },
  ];

  const current = playbooks[activePlaybook];

  return (
    <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={20} color="#38bdf8" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            Attack Scenarios & Playbook Walkthroughs
          </h2>
        </div>

        {/* Playbook Selector Tabs */}
        <div style={{ display: "flex", gap: 8 }}>
          {playbooks.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActivePlaybook(idx)}
              style={{
                background: activePlaybook === idx ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                border: activePlaybook === idx ? "1px solid #38bdf8" : "1px solid var(--border-subtle)",
                color: activePlaybook === idx ? "#38bdf8" : "var(--text-secondary)",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {p.icon}
              <span>Playbook {String.fromCharCode(65 + idx)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Playbook Details */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 10,
        padding: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
            {current.title}
          </h3>
          <span className={`badge ${current.tagColor}`} style={{ fontSize: "0.7rem" }}>
            {current.tag}
          </span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 14 }}>
          {current.description}
        </p>

        {/* Steps Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          {current.steps.map((step, sIdx) => (
            <div
              key={sIdx}
              onClick={() => onSelectActivityById(step.activityId, step.status)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "10px 12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#38bdf8";
                e.currentTarget.style.background = "rgba(56, 189, 248, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "#e2e8f0" }}>
                  {step.name}
                </span>
                <Play size={12} color="#38bdf8" />
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {step.tip}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
