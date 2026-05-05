import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Lock, Network, ArrowLeftRight } from "lucide-react";

let persistentACLState = null;

const defaultRules = Array.from({ length: 4 }, (_, i) => ({
  action: "permit",
  protocol: "ip",
  source: "",
  destination: "",
  port: "",
  log: false,
}));

const defaultState = {
  activeACLSection: "rules",
  aclType: "Standard",
  aclName: "",
  implicitDeny: true,
  interface: "G0/0 (LAN)",
  direction: "Inbound",
  applyTo: "All Traffic",
  defaultAction: "Deny",
  loggingLevel: "None",
  statefulInspection: false,
  rateLimiting: false,
  rules: defaultRules,
};

function dispatchLog(deviceName, deviceLocation, message) {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "Router", deviceName, message, location: deviceLocation, italic: true },
    })
  );
}

export default function ACLModal({ onClose, deviceName = "Router-Core-01", deviceLocation = "Data Center" }) {
  const [state, setState] = useState(persistentACLState || defaultState);
  const prevState = useRef(persistentACLState || defaultState);
  const set = (field, value) => setState((s) => ({ ...s, [field]: value }));

  const updateRule = (i, field, value) => {
    const rules = [...state.rules];
    rules[i] = { ...rules[i], [field]: value };
    set("rules", rules);
  };

  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

  const handleApply = () => {
    const prev = prevState.current;
    const logs = [];
    const ts = now();

    // ACL identity
    if (state.aclName !== prev.aclName || state.aclType !== prev.aclType) {
      logs.push(
        `%ACL-5-POLICY_MODIFY: [${ts}] ${deviceName} @ ${deviceLocation} — ACL configuration updated. ` +
        `Type: ${prev.aclType || "—"} → ${state.aclType} | ID/Name: "${prev.aclName || "—"}" → "${state.aclName || "—"}". ` +
        `Policy re-evaluated on all bound interfaces.`
      );
    } else if (state.aclName) {
      logs.push(
        `%ACL-6-POLICY_INSTALL: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `${state.aclType} ACL "${state.aclName}" committed to TCAM. ` +
        `Top-down rule evaluation active; implicit deny-all appended at sequence end.`
      );
    }

    // Rules
    state.rules.forEach((rule, i) => {
      if (rule.source || rule.destination || rule.port) {
        const prev_r = (prev.rules || [])[i] || {};
        const changed =
          rule.action !== prev_r.action ||
          rule.protocol !== prev_r.protocol ||
          rule.source !== prev_r.source ||
          rule.destination !== prev_r.destination ||
          rule.port !== prev_r.port;
        logs.push(
          changed
            ? `%ACL-5-RULE_MODIFY: [${ts}] ${deviceName} — Rule #${i + 1} updated. ` +
              `${rule.action.toUpperCase()} ${rule.protocol.toUpperCase()} ` +
              `src ${rule.source || "any"} → dst ${rule.destination || "any"} port ${rule.port || "any"}. ` +
              `${rule.log ? "Match events will be sent to syslog." : "Logging suppressed for this rule."}`
            : `%ACL-6-RULE_INSTALL: [${ts}] ${deviceName} — Rule #${i + 1}: ` +
              `${rule.action.toUpperCase()} ${rule.protocol.toUpperCase()} ` +
              `from ${rule.source || "any"} to ${rule.destination || "any"}` +
              `${rule.port ? ` on port(s) ${rule.port}` : ""}.`
        );
      }
    });

    // Interface binding
    if (state.interface !== prev.interface || state.direction !== prev.direction || state.applyTo !== prev.applyTo) {
      logs.push(
        `%ACL-5-BINDING_MODIFY: [${ts}] ${deviceName} — Interface binding updated. ` +
        `Interface: ${prev.interface || "—"} → ${state.interface} | ` +
        `Direction: ${prev.direction || "—"} → ${state.direction} | ` +
        `Scope: ${prev.applyTo || "—"} → ${state.applyTo}. ` +
        `Hardware ACL tables refreshed on affected interface.`
      );
    }

    // Traffic behavior
    if (state.defaultAction !== prev.defaultAction) {
      logs.push(
        `%ACL-5-DEFAULT_ACTION_MOD: [${ts}] ${deviceName} — Default traffic action changed ` +
        `from ${prev.defaultAction || "—"} to ${state.defaultAction}. ` +
        `Unmatched packets will now be ${state.defaultAction.toLowerCase()}ed at the end of the ACL.`
      );
    }
    if (state.statefulInspection !== prev.statefulInspection) {
      logs.push(
        state.statefulInspection
          ? `%ACL-5-SPI_ENABLED: [${ts}] ${deviceName} — Stateful Packet Inspection enabled. ` +
            `Return traffic for established sessions will be automatically permitted.`
          : `%ACL-5-SPI_DISABLED: [${ts}] ${deviceName} — Stateful inspection disabled. ` +
            `Return traffic must be explicitly permitted via ACL rules.`
      );
    }

    if (logs.length === 0) {
      logs.push(
        `%ACL-6-NOP: [${ts}] ${deviceName} @ ${deviceLocation} — ACL Apply invoked; no parameter changes detected. ` +
        `Existing policy unchanged.`
      );
    }

    logs.forEach((message) => dispatchLog(deviceName, deviceLocation, message));
    persistentACLState = state;
    prevState.current = state;
    onClose();
  };

  return createPortal(
    <div className="config-modal-overlay nat-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <ShieldCheck size={20} />
            <span>Access Control List Configuration</span>
          </div>
          <div className="nav-list">
            <button className={`nav-item ${state.activeACLSection === "rules" ? "active" : ""}`} onClick={() => set("activeACLSection", "rules")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>ACL Rules</strong><p>Permit / Deny logic</p></div>
            </button>
            <button className={`nav-item ${state.activeACLSection === "binding" ? "active" : ""}`} onClick={() => set("activeACLSection", "binding")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Interface Binding</strong><p>Apply ACL to ports</p></div>
            </button>
            <button className={`nav-item ${state.activeACLSection === "advanced" ? "active" : ""}`} onClick={() => set("activeACLSection", "advanced")}>
              <div className="nav-icon"><ArrowLeftRight size={16} /></div>
              <div className="nav-text"><strong>Traffic Behavior</strong><p>Flow & logging</p></div>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{state.activeACLSection.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {/* GLOBAL */}
            <div className="config-group-mono">
              <label>ACL Mode</label>
              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Type</span>
                  <select value={state.aclType} onChange={(e) => set("aclType", e.target.value)}>
                    <option>Select</option>
                    <option>Standard</option>
                    <option>Extended</option>
                  </select>
                </div>
                <div className="input-wrap">
                  <span>ACL ID / Name</span>
                  <input placeholder="e.g. ACL_101" value={state.aclName} onChange={(e) => set("aclName", e.target.value)} />
                </div>
              </div>
            </div>

            {/* DYNAMIC */}
            <div className="config-group-mono highlight-area">

              {state.activeACLSection === "rules" && (
                <>
                  <label>Rule Engine (Top-down priority)</label>
                  <table className="acl-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Action</th>
                        <th>Protocol</th>
                        <th>Source</th>
                        <th>Destination</th>
                        <th>Port</th>
                        <th>Log</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.rules.map((rule, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            <select value={rule.action} onChange={(e) => updateRule(i, "action", e.target.value)}>
                              <option>permit</option>
                              <option>deny</option>
                            </select>
                          </td>
                          <td>
                            <select value={rule.protocol} onChange={(e) => updateRule(i, "protocol", e.target.value)}>
                              <option>ip</option>
                              <option>tcp</option>
                              <option>udp</option>
                              <option>icmp</option>
                            </select>
                          </td>
                          <td><input placeholder="e.g. 192.168.1.0/24" value={rule.source} onChange={(e) => updateRule(i, "source", e.target.value)} /></td>
                          <td><input placeholder="e.g. any" value={rule.destination} onChange={(e) => updateRule(i, "destination", e.target.value)} /></td>
                          <td><input placeholder="e.g. 80,443" value={rule.port} onChange={(e) => updateRule(i, "port", e.target.value)} /></td>
                          <td><input type="checkbox" checked={rule.log} onChange={(e) => updateRule(i, "log", e.target.checked)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="checkbox-wrap">
                    <input type="checkbox" checked={state.implicitDeny} onChange={(e) => set("implicitDeny", e.target.checked)} />
                    <span>Implicit Deny (block unmatched traffic)</span>
                  </div>
                </>
              )}

              {state.activeACLSection === "binding" && (
                <>
                  <label>Apply ACL to Interface</label>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Interface</span>
                      <select value={state.interface} onChange={(e) => set("interface", e.target.value)}>
                        <option>Select</option>
                        <option>G0/0 (LAN)</option>
                        <option>G0/1 (WAN)</option>
                        <option>VLAN 10</option>
                      </select>
                    </div>
                    <div className="input-wrap">
                      <span>Direction</span>
                      <select value={state.direction} onChange={(e) => set("direction", e.target.value)}>
                        <option>Select</option>
                        <option>Inbound</option>
                        <option>Outbound</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-wrap">
                    <span>Apply To</span>
                    <select value={state.applyTo} onChange={(e) => set("applyTo", e.target.value)}>
                      <option>Select</option>
                      <option>All Traffic</option>
                      <option>Matched Traffic Only</option>
                    </select>
                  </div>
                </>
              )}

              {state.activeACLSection === "advanced" && (
                <>
                  <label>Traffic Behavior</label>
                  <div className="input-wrap">
                    <span>Default Action</span>
                    <select value={state.defaultAction} onChange={(e) => set("defaultAction", e.target.value)}>
                      <option>Select</option>
                      <option>Deny</option>
                      <option>Permit</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Logging Level</span>
                    <select value={state.loggingLevel} onChange={(e) => set("loggingLevel", e.target.value)}>
                      <option>Select</option>
                      <option>None</option>
                      <option>Errors Only</option>
                      <option>All Matches</option>
                    </select>
                  </div>
                  <div className="checkbox-wrap">
                    <input type="checkbox" checked={state.statefulInspection} onChange={(e) => set("statefulInspection", e.target.checked)} />
                    <span>Enable Stateful Inspection</span>
                  </div>
                  <div className="checkbox-wrap">
                    <input type="checkbox" checked={state.rateLimiting} onChange={(e) => set("rateLimiting", e.target.checked)} />
                    <span>Enable Rate Limiting</span>
                  </div>
                </>
              )}

            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply ACL</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}