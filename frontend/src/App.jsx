import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PrivilegeLadder from "./components/PrivilegeLadder";
import ActivityGrid from "./components/ActivityGrid";
import ActionModal from "./components/ActionModal";
import LiveLogViewer from "./components/LiveLogViewer";
import PlaybookGuide from "./components/PlaybookGuide";
import {
  fetchSession,
  resetSession,
  switchCloud,
  toggleGodMode,
  fetchActivities,
  executeActivity,
  fetchLogs,
  clearLogs,
  getExportJsonUrl,
  getExportNativeUrl,
  fetchIpPresets,
} from "./services/api";

export default function App() {
  const [session, setSession] = useState(null);
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [ipPresets, setIpPresets] = useState({});
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionId = session?.session_id;

  // Initialize Data
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const sess = await fetchSession();
        setSession(sess);

        const [acts, logList, ips] = await Promise.all([
          fetchActivities(sess.session_id, sess.cloud_provider),
          fetchLogs({ session_id: sess.session_id }),
          fetchIpPresets(),
        ]);

        setActivities(acts);
        setLogs(logList);
        setIpPresets(ips);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const showToast = (msg, duration = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  // Switch Cloud Provider
  const handleSwitchCloud = async (cloud) => {
    try {
      const updated = await switchCloud(sessionId, cloud);
      setSession(updated);
      const acts = await fetchActivities(sessionId, cloud);
      setActivities(acts);
      showToast(`Switched cloud environment to ${cloud.toUpperCase()}`);
    } catch (err) {
      alert("Error switching cloud: " + err.message);
    }
  };

  // Reset Session
  const handleResetSession = async () => {
    if (!confirm("Are you sure you want to reset session back to Level 0 (Pre-Authentication)?"))
      return;
    try {
      const updated = await resetSession(sessionId, session?.cloud_provider);
      setSession(updated);
      setAlertMessage(null);
      const acts = await fetchActivities(updated.session_id, updated.cloud_provider);
      setActivities(acts);
      showToast("Session reset to Level 0 (Pre-Authentication)");
    } catch (err) {
      alert("Error resetting session: " + err.message);
    }
  };

  // Toggle Developer God Mode
  const handleToggleGodMode = async () => {
    try {
      const updated = await toggleGodMode(sessionId);
      setSession(updated);
      const acts = await fetchActivities(sessionId, updated.cloud_provider);
      setActivities(acts);
      showToast(
        updated.god_mode
          ? "Developer God Mode Enabled: All privilege gates unlocked for testing!"
          : "God Mode Disabled: Standard privilege gating active"
      );
    } catch (err) {
      alert("Error toggling God Mode: " + err.message);
    }
  };

  // Execute Manual Activity
  const handleExecuteActivity = async (payload) => {
    const res = await executeActivity(sessionId, payload);
    setSession(res.session_state);

    if (res.alert_triggered) {
      setAlertMessage(res.alert_triggered);
    }

    if (res.unlocked_new_level) {
      showToast(`🎉 MILESTONE UNLOCKED: Level ${res.unlocked_level} privileges acquired!`, 5000);
    } else {
      showToast(res.message);
    }

    // Refresh activities lock state & logs
    const [acts, logList] = await Promise.all([
      fetchActivities(sessionId, res.session_state.cloud_provider),
      fetchLogs({ session_id: sessionId }),
    ]);
    setActivities(acts);
    setLogs(logList);
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!confirm("Clear all generated logs for this session?")) return;
    try {
      await clearLogs(sessionId);
      setLogs([]);
      showToast("Logs cleared successfully.");
    } catch (err) {
      alert("Error clearing logs: " + err.message);
    }
  };

  // Select Activity by ID from Playbook Guide
  const handleSelectActivityById = (actId) => {
    const act = activities.find((a) => a.id === actId);
    if (act) {
      setSelectedActivity(act);
    } else {
      alert(`Activity '${actId}' not found in current cloud provider. Switch to AWS to use this playbook.`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <Navbar
        session={session}
        onSwitchCloud={handleSwitchCloud}
        onResetSession={handleResetSession}
        onToggleGodMode={handleToggleGodMode}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1050,
            background: "#0f172a",
            color: "#38bdf8",
            border: "1px solid #38bdf8",
            borderRadius: 10,
            padding: "12px 20px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(56, 189, 248, 0.4)",
            fontWeight: 600,
            fontSize: "0.88rem",
            animation: "pulseGlow 2s infinite",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 24px", width: "100%", flex: 1 }}>
        {/* Playbook Scenario Guides */}
        <PlaybookGuide onSelectActivityById={handleSelectActivityById} />

        {/* Privilege Ladder & Session Gating Visualizer */}
        <PrivilegeLadder
          session={session}
          alertMessage={alertMessage}
        />

        {/* Activity Buttons Grid */}
        <ActivityGrid
          activities={activities}
          onSelectActivity={setSelectedActivity}
          activeCloud={session?.cloud_provider || "aws"}
        />

        {/* Live JSON Log Viewer */}
        <LiveLogViewer
          logs={logs}
          onClearLogs={handleClearLogs}
          exportJsonUrl={getExportJsonUrl(sessionId)}
          exportNativeUrl={getExportNativeUrl(sessionId)}
        />
      </main>

      {/* Action Execution Modal */}
      {selectedActivity && (
        <ActionModal
          activity={selectedActivity}
          session={session}
          ipPresets={ipPresets}
          onClose={() => setSelectedActivity(null)}
          onExecute={handleExecuteActivity}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "20px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.8rem",
        background: "rgba(10, 15, 26, 0.6)",
      }}>
        CloudSec LogForge &copy; 2026 &bull; Manual Cloud Activity & Security Audit Log Generator &bull; JSON Schema Compliant
      </footer>
    </div>
  );
}
