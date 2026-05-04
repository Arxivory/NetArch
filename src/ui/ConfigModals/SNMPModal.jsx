import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Activity, Server, Lock, Network, ArrowDown } from "lucide-react";

let persistentSNMPState = null;

const defaultState = {
  activeSNMPTab:     "agent",
  systemName:        "",
  location:          "",
  snmpVersion:       "v3 (Recommended)",
  contact:           "",
  agentEnabled:      true,
  readCommunity:     "",
  writeCommunity:    "",
  managerACL:        "",
  securityLevel:     "authPriv (Recommended)",
  accessLogging:     true,
  restrictTrusted:   false,
  trapReceiver:      "",
  trapPort:          "",
  trapLinkUpDown:    true,
  trapCpuMemory:     false,
  trapAnomaly:       false,
};

function dispatchLog(deviceName, deviceLocation, message) {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "Router", deviceName, message, location: deviceLocation },
    })
  );
}

export default function SNMPModal({ onClose, deviceName = "Router-Core-01", deviceLocation = "Data Center" }) {
  const [state, setState] = useState(persistentSNMPState || defaultState);
  const prevState = useRef(persistentSNMPState || defaultState);
  const set = (field, value) => setState((s) => ({ ...s, [field]: value }));

  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

  const handleApply = () => {
    const prev = prevState.current;
    const logs = [];
    const ts = now();

    // Agent identity
    if (state.systemName !== prev.systemName || state.snmpVersion !== prev.snmpVersion) {
      logs.push(
        `%SNMP-5-AGENT_MODIFY: [${ts}] ${deviceName} @ ${deviceLocation} — SNMP agent identity updated. ` +
        `System Name: "${prev.systemName || "—"}" → "${state.systemName}" | ` +
        `Version: ${prev.snmpVersion || "—"} → ${state.snmpVersion}. ` +
        `sysDescr and sysName OIDs updated in MIB-II; management station re-discovery recommended.`
      );
    } else if (state.systemName) {
      logs.push(
        `%SNMP-6-AGENT_CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — SNMP agent committed. ` +
        `System: "${state.systemName}" | Location: "${state.location}" | Contact: "${state.contact}" | Version: ${state.snmpVersion}. ` +
        `Agent socket bound on UDP/161.`
      );
    }

    // Security
    if (state.readCommunity !== prev.readCommunity || state.writeCommunity !== prev.writeCommunity) {
      logs.push(
        `%SNMP-5-COMMUNITY_MODIFY: [${ts}] ${deviceName} — Community strings updated. ` +
        `RO community changed: ${prev.readCommunity ? "****" : "—"} → ${state.readCommunity ? "****" : "—"} | ` +
        `RW community changed: ${prev.writeCommunity ? "****" : "—"} → ${state.writeCommunity ? "****" : "—"}. ` +
        `Old community strings immediately invalidated; update NMS polling credentials.`
      );
    }

    if (state.securityLevel !== prev.securityLevel) {
      logs.push(
        `%SNMP-5-SECLEVEL_CHANGE: [${ts}] ${deviceName} — SNMPv3 security level changed ` +
        `from "${prev.securityLevel || "—"}" to "${state.securityLevel}". ` +
        `Re-authentication of all v3 users required. Non-compliant managers will be denied access.`
      );
    }

    // Traps
    if (state.trapReceiver !== prev.trapReceiver || state.trapPort !== prev.trapPort) {
      logs.push(
        `%SNMP-5-TRAP_DEST_MODIFY: [${ts}] ${deviceName} — Trap receiver updated. ` +
        `Old: ${prev.trapReceiver || "—"}:${prev.trapPort || "—"} → New: ${state.trapReceiver}:${state.trapPort}. ` +
        `Test trap will be dispatched to verify reachability of new destination.`
      );
    }
    if (state.trapLinkUpDown !== prev.trapLinkUpDown) {
      logs.push(
        state.trapLinkUpDown
          ? `%SNMP-6-TRAP_LINK_ENABLED: [${ts}] ${deviceName} — Link up/down trap notifications enabled. ` +
            `Interface state changes will generate SNMP linkDown (OID .1.3.6.1.6.3.1.1.5.3) and linkUp traps.`
          : `%SNMP-6-TRAP_LINK_DISABLED: [${ts}] ${deviceName} — Link up/down trap notifications disabled. ` +
            `Interface state changes will be suppressed from trap dispatch queue.`
      );
    }

    if (logs.length === 0) {
      logs.push(
        `%SNMP-6-NOP: [${ts}] ${deviceName} @ ${deviceLocation} — SNMP Apply invoked with no parameter changes. ` +
        `Agent state, community strings, and trap policies remain unchanged.`
      );
    }

    logs.forEach((message) => dispatchLog(deviceName, deviceLocation, message));
    persistentSNMPState = state;
    prevState.current = state;
    onClose();
  };

  return createPortal(
    <div className="config-modal-overlay snmp-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Activity size={18} />
            <span>SNMP Configuration</span>
          </div>
          <div className="nav-list">
            <button className={`nav-item ${state.activeSNMPTab === "agent" ? "active" : ""}`} onClick={() => set("activeSNMPTab", "agent")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>SNMP Agent</strong><p>Identity & versioning</p></div>
            </button>
            <button className={`nav-item ${state.activeSNMPTab === "security" ? "active" : ""}`} onClick={() => set("activeSNMPTab", "security")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>Security</strong><p>v1/v2c/v3 access control</p></div>
            </button>
            <button className={`nav-item ${state.activeSNMPTab === "mib" ? "active" : ""}`} onClick={() => set("activeSNMPTab", "mib")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>MIB Monitoring</strong><p>OID tracking & thresholds</p></div>
            </button>
            <button className={`nav-item ${state.activeSNMPTab === "traps" ? "active" : ""}`} onClick={() => set("activeSNMPTab", "traps")}>
              <div className="nav-icon"><ArrowDown size={16} /></div>
              <div className="nav-text"><strong>Traps & Alerts</strong><p>Event notification system</p></div>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{state.activeSNMPTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {state.activeSNMPTab === "agent" && (
              <div className="config-group-mono">
                <label>SNMP Agent Identity</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>System Name</span>
                    <input placeholder="e.g. Router-Core-01" value={state.systemName} onChange={(e) => set("systemName", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Location</span>
                    <input placeholder="e.g. Data Center - Manila" value={state.location} onChange={(e) => set("location", e.target.value)} />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>SNMP Version</span>
                    <select value={state.snmpVersion} onChange={(e) => set("snmpVersion", e.target.value)}>
                      <option>Select</option>
                      <option>v3 (Recommended)</option>
                      <option>v2c</option>
                      <option>v1 (Legacy)</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Contact</span>
                    <input placeholder="e.g. admin@network.local" value={state.contact} onChange={(e) => set("contact", e.target.value)} />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.agentEnabled} onChange={(e) => set("agentEnabled", e.target.checked)} />
                  <span>Enable SNMP agent globally</span>
                </div>
              </div>
            )}

            {state.activeSNMPTab === "security" && (
              <div className="config-group-mono">
                <label>SNMP Security Configuration</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Read Community</span>
                    <input placeholder="e.g. public" value={state.readCommunity} onChange={(e) => set("readCommunity", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Write Community</span>
                    <input placeholder="e.g. private" value={state.writeCommunity} onChange={(e) => set("writeCommunity", e.target.value)} />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Manager IP ACL</span>
                    <input placeholder="e.g. 192.168.1.10/32" value={state.managerACL} onChange={(e) => set("managerACL", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>SNMPv3 Security Level</span>
                    <select value={state.securityLevel} onChange={(e) => set("securityLevel", e.target.value)}>
                      <option>Select</option>
                      <option>authPriv (Recommended)</option>
                      <option>authNoPriv</option>
                      <option>noAuthNoPriv</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.accessLogging} onChange={(e) => set("accessLogging", e.target.checked)} />
                  <span>Enable access logging</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.restrictTrusted} onChange={(e) => set("restrictTrusted", e.target.checked)} />
                  <span>Restrict SNMP to trusted networks only</span>
                </div>
              </div>
            )}

            {state.activeSNMPTab === "mib" && (
              <div className="config-group-mono">
                <label>MIB / OID Monitoring Engine</label>
                <table className="acl-table">
                  <thead>
                    <tr><th>OID</th><th>Metric</th><th>Threshold</th><th>Alert</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>.1.3.6.1.2.1.1.3</td><td>System Uptime</td>
                      <td><input placeholder="e.g. &gt; 99.9%" /></td>
                      <td><input type="checkbox" defaultChecked /></td>
                    </tr>
                    <tr>
                      <td>.1.3.6.1.2.1.2.2</td><td>Interface Utilization</td>
                      <td><input placeholder="e.g. &gt; 80%" /></td>
                      <td><input type="checkbox" /></td>
                    </tr>
                    <tr>
                      <td>.1.3.6.1.4.1</td><td>CPU Load</td>
                      <td><input placeholder="e.g. &gt; 75%" /></td>
                      <td><input type="checkbox" defaultChecked /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {state.activeSNMPTab === "traps" && (
              <div className="config-group-mono">
                <label>Trap & Alert System</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Trap Receiver IP</span>
                    <input placeholder="e.g. 192.168.1.100" value={state.trapReceiver} onChange={(e) => set("trapReceiver", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Port</span>
                    <input placeholder="e.g. 162" value={state.trapPort} onChange={(e) => set("trapPort", e.target.value)} />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.trapLinkUpDown} onChange={(e) => set("trapLinkUpDown", e.target.checked)} />
                  <span>Link up/down notifications</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.trapCpuMemory} onChange={(e) => set("trapCpuMemory", e.target.checked)} />
                  <span>CPU / Memory threshold alerts</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.trapAnomaly} onChange={(e) => set("trapAnomaly", e.target.checked)} />
                  <span>Anomaly detection engine</span>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply SNMP</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}