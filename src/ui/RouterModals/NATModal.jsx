import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, Activity, Server, Network } from "lucide-react";

// Global persistent state so inputs survive close/reopen (requirement #3)
let persistentNATState = null;

function dispatchLog(deviceName, deviceLocation, message) {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "Router", deviceName, message, location: deviceLocation, italic: true },
    })
  );
}

export default function NATModal({ onClose, deviceName = "Router-Core-01", deviceLocation = "Data Center" }) {
  const defaultState = {
    activeNatType: "pat",
    insideIface:       "G0/0 (LAN)",
    outsideIface:      "G0/1 (WAN)",
    aclId:             "",
    srcNetwork:        "",
    wildcardMask:      "",
    patMode:           "Use Interface IP",
    patOverload:       true,
    staticPrivateIP:   "",
    staticPublicIP:    "",
    staticPrivatePort: "",
    staticPublicPort:  "",
    poolName:          "",
    poolStartIP:       "",
    poolEndIP:         "",
    poolNetmask:       "",
    poolBindACL:       "",
  };

  // Load from persistent store or defaults (requirement #3)
  const [state, setState] = useState(persistentNATState || defaultState);

  // Track previous values so we can detect changes (requirement #6)
  const prevState = useRef(persistentNATState || defaultState);

  const set = (field, value) => setState((s) => ({ ...s, [field]: value }));

  const now = () => {
    const d = new Date();
    return d.toISOString().replace("T", " ").slice(0, 19);
  };

  const handleApply = () => {
    const prev = prevState.current;
    const logs  = [];
    const ts    = now();
    const host  = deviceName;
    const loc   = deviceLocation;

    // ── Interface assignment ──────────────────────────────────────────────
    if (state.insideIface !== prev.insideIface || state.outsideIface !== prev.outsideIface) {
      logs.push(
        `%NAT-5-IFACE_REBIND: [${ts}] ${host} @ ${loc} — NAT interface assignment updated. ` +
        `Inside: ${prev.insideIface} → ${state.insideIface} | Outside: ${prev.outsideIface} → ${state.outsideIface}. ` +
        `Translation table flushed; new entries will be created on first packet match.`
      );
    } else {
      logs.push(
        `%NAT-6-IFACE_CONFIRM: [${ts}] ${host} @ ${loc} — Interface binding verified. ` +
        `Inside: ${state.insideIface} | Outside: ${state.outsideIface}. No changes detected.`
      );
    }

    // ── ACL ───────────────────────────────────────────────────────────────
    if (state.aclId) {
      const changed = state.aclId !== prev.aclId;
      logs.push(
        changed
          ? `%NAT-5-ACL_MODIFY: [${ts}] ${host} — Standard ACL ID changed from ${prev.aclId || "unset"} to ${state.aclId}. ` +
            `Existing NAT translations referencing previous ACL will be invalidated.`
          : `%NAT-6-ACL_INSTALL: [${ts}] ${host} — Access Control List ID ${state.aclId} bound to NAT process. ` +
            `Packet classification engine updated.`
      );
    }
    if (state.srcNetwork) {
      const changed = state.srcNetwork !== prev.srcNetwork || state.wildcardMask !== prev.wildcardMask;
      logs.push(
        changed
          ? `%NAT-5-NETWORK_MODIFY: [${ts}] ${host} — NAT source network updated from ` +
            `[${prev.srcNetwork || "—"} ${prev.wildcardMask || "—"}] to ` +
            `[${state.srcNetwork} ${state.wildcardMask}]. ` +
            `Translation pool re-evaluated; adjacency timers not affected.`
          : `%NAT-6-NETWORK_STMT: [${ts}] ${host} — Source network ${state.srcNetwork} / wildcard ${state.wildcardMask} ` +
            `registered in NAT match criteria. Packets from this range are eligible for translation.`
      );
    }

    // ── PAT (Overload) ────────────────────────────────────────────────────
    if (state.activeNatType === "pat") {
      const modeChanged = state.patMode !== prev.patMode || prev.activeNatType !== "pat";
      logs.push(
        modeChanged
          ? `%PAT-5-MODE_CHANGE: [${ts}] ${host} @ ${loc} — PAT translation mode changed from ` +
            `"${prev.patMode || "—"}" to "${state.patMode}". ` +
            `Port mapping table cleared; overloaded sessions will re-negotiate.`
          : `%PAT-6-MODE_CONFIRM: [${ts}] ${host} — PAT translation mode confirmed: "${state.patMode}". ` +
            `Port Address Translation active on outside interface.`
      );
      if (state.patOverload) {
        logs.push(
          `%PAT-6-OVERLOAD_ENABLED: [${ts}] ${host} — Port overload (many-to-one) is ACTIVE. ` +
          `Source port randomization enabled; concurrent session limit: platform-dependent.`
        );
      }
    }

    // ── Static NAT ────────────────────────────────────────────────────────
    if (state.activeNatType === "static") {
      if (state.staticPrivateIP || state.staticPublicIP) {
        const changed =
          state.staticPrivateIP !== prev.staticPrivateIP ||
          state.staticPublicIP  !== prev.staticPublicIP;
        logs.push(
          changed
            ? `%NAT-5-STATIC_MODIFY: [${ts}] ${host} @ ${loc} — Static one-to-one mapping updated. ` +
              `Previous: ${prev.staticPrivateIP || "—"} → ${prev.staticPublicIP || "—"}. ` +
              `New: ${state.staticPrivateIP} → ${state.staticPublicIP}. ` +
              `ARP entry invalidated for old public IP; new entry will be resolved on next packet.`
            : `%NAT-6-STATIC_INSTALL: [${ts}] ${host} — Static NAT entry installed. ` +
              `Private ${state.staticPrivateIP} permanently mapped to Public ${state.staticPublicIP}. ` +
              `Translation is bidirectional and session-independent.`
        );
      }
      if (state.staticPrivatePort) {
        const changed =
          state.staticPrivatePort !== prev.staticPrivatePort ||
          state.staticPublicPort  !== prev.staticPublicPort;
        logs.push(
          changed
            ? `%PAT-5-PORTFWD_MODIFY: [${ts}] ${host} — Static PAT rule updated. ` +
              `Old: port ${prev.staticPrivatePort || "—"} → ${prev.staticPublicPort || "—"}. ` +
              `New: port ${state.staticPrivatePort} → ${state.staticPublicPort}. ` +
              `Active sessions on previous port will not be migrated.`
            : `%PAT-6-PORTFWD_INSTALL: [${ts}] ${host} — Static port-forwarding rule installed. ` +
              `Inbound traffic on public port ${state.staticPublicPort} will be forwarded to ` +
              `${state.staticPrivateIP}:${state.staticPrivatePort}.`
        );
      }
    }

    // ── Dynamic NAT ───────────────────────────────────────────────────────
    if (state.activeNatType === "dynamic") {
      if (state.poolName) {
        const changed = state.poolName !== prev.poolName || prev.activeNatType !== "dynamic";
        logs.push(
          changed
            ? `%NAT-5-POOL_MODIFY: [${ts}] ${host} @ ${loc} — NAT pool identifier changed ` +
              `from "${prev.poolName || "—"}" to "${state.poolName}". Previous pool bindings cleared.`
            : `%NAT-6-POOL_CREATE: [${ts}] ${host} — Dynamic NAT pool "${state.poolName}" registered. ` +
              `Pool entries will be allocated on demand from the configured IP range.`
        );
      }
      if (state.poolStartIP && state.poolEndIP) {
        const changed =
          state.poolStartIP !== prev.poolStartIP ||
          state.poolEndIP   !== prev.poolEndIP   ||
          state.poolNetmask !== prev.poolNetmask;
        logs.push(
          changed
            ? `%NAT-5-POOL_RANGE_MOD: [${ts}] ${host} — Dynamic pool range updated. ` +
              `Old: ${prev.poolStartIP || "—"} – ${prev.poolEndIP || "—"} (${prev.poolNetmask || "—"}). ` +
              `New: ${state.poolStartIP} – ${state.poolEndIP} (${state.poolNetmask}). ` +
              `Available address count recalculated; existing translations retained where possible.`
            : `%NAT-6-POOL_RANGE: [${ts}] ${host} — NAT address pool range defined: ` +
              `${state.poolStartIP} – ${state.poolEndIP}, netmask ${state.poolNetmask}. ` +
              `Total usable public addresses computed and reserved in translation table.`
        );
      }
      if (state.poolBindACL) {
        const changed = state.poolBindACL !== prev.poolBindACL;
        logs.push(
          changed
            ? `%NAT-5-POOL_ACL_MOD: [${ts}] ${host} — Pool ACL binding changed from ` +
              `ACL-${prev.poolBindACL || "—"} to ACL-${state.poolBindACL}. ` +
              `Traffic classification rules re-evaluated for dynamic address assignment.`
            : `%NAT-6-POOL_ACL_BIND: [${ts}] ${host} — ACL ${state.poolBindACL} bound to NAT pool "${state.poolName}". ` +
              `Only traffic matching this ACL will be eligible for dynamic address translation.`
        );
      }
    }

    if (logs.length === 0) {
      logs.push(
        `%NAT-6-NOP: [${ts}] ${host} @ ${loc} — Apply invoked with no configuration parameters set. ` +
        `No changes committed to NAT/PAT translation engine.`
      );
    }

    // Dispatch every log line to ConsolePanel
    logs.forEach((message) => dispatchLog(deviceName, deviceLocation, message));

    // Persist state for next open (requirement #3)
    persistentNATState = state;
    prevState.current  = state;

    onClose();
  };

  return createPortal(
    <div className="config-modal-overlay nat-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <ArrowLeftRight size={20} />
            <span>NAT Configuration</span>
          </div>

          <div className="nav-list">
            <button className={`nav-item ${state.activeNatType === "pat" ? "active" : ""}`} onClick={() => set("activeNatType", "pat")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>PAT (Overload)</strong><p>Many-to-One</p></div>
            </button>
            <button className={`nav-item ${state.activeNatType === "static" ? "active" : ""}`} onClick={() => set("activeNatType", "static")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>Static NAT</strong><p>One-to-One / Port</p></div>
            </button>
            <button className={`nav-item ${state.activeNatType === "dynamic" ? "active" : ""}`} onClick={() => set("activeNatType", "dynamic")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Dynamic NAT</strong><p>Pool Mapping</p></div>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{state.activeNatType.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {/* INTERFACES */}
            <div className="config-group-mono">
              <label>Interface Assignment</label>
              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Inside</span>
                  <select value={state.insideIface} onChange={(e) => set("insideIface", e.target.value)}>
                    <option>Select</option>
                    <option>G0/0 (LAN)</option>
                    <option>G0/1 (WAN)</option>
                    <option>Loopback0</option>
                  </select>
                </div>
                <div className="input-wrap">
                  <span>Outside</span>
                  <select value={state.outsideIface} onChange={(e) => set("outsideIface", e.target.value)}>
                    <option>Select</option>
                    <option>G0/1 (WAN)</option>
                    <option>G0/0 (LAN)</option>
                    <option>Serial0/0</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACL */}
            <div className="config-group-mono">
              <label>Access Control List (ACL)</label>
              <div className="inline-fields">
                <div className="input-wrap">
                  <span>ACL ID</span>
                  <input type="text" placeholder="e.g. 1" value={state.aclId} onChange={(e) => set("aclId", e.target.value)} />
                </div>
                <div className="input-wrap">
                  <span>Source Network</span>
                  <input type="text" placeholder="e.g. 192.168.1.0" value={state.srcNetwork} onChange={(e) => set("srcNetwork", e.target.value)} />
                </div>
                <div className="input-wrap">
                  <span>Wildcard Mask</span>
                  <input type="text" placeholder="e.g. 0.0.0.255" value={state.wildcardMask} onChange={(e) => set("wildcardMask", e.target.value)} />
                </div>
              </div>
            </div>

            {/* DYNAMIC CONTENT */}
            <div className="config-group-mono highlight-area">

              {state.activeNatType === "pat" && (
                <>
                  <label>PAT Configuration</label>
                  <div className="input-wrap">
                    <span>Translation Mode</span>
                    <select value={state.patMode} onChange={(e) => set("patMode", e.target.value)}>
                      <option>Select</option>
                      <option>Use Interface IP</option>
                      <option>Use NAT Pool</option>
                    </select>
                  </div>
                  <div className="checkbox-wrap">
                    <input type="checkbox" checked={state.patOverload} onChange={(e) => set("patOverload", e.target.checked)} />
                    <span>Enable Overload (Port Translation)</span>
                  </div>
                </>
              )}

              {state.activeNatType === "static" && (
                <>
                  <label>Static Mapping</label>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Private IP</span>
                      <input placeholder="e.g. 192.168.1.10" value={state.staticPrivateIP} onChange={(e) => set("staticPrivateIP", e.target.value)} />
                    </div>
                    <div className="input-wrap">
                      <span>Public IP</span>
                      <input placeholder="e.g. 203.0.113.5" value={state.staticPublicIP} onChange={(e) => set("staticPublicIP", e.target.value)} />
                    </div>
                  </div>
                  <label style={{ marginTop: "15px" }}>Port Forwarding (Static PAT)</label>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Private Port</span>
                      <input placeholder="e.g. 80" value={state.staticPrivatePort} onChange={(e) => set("staticPrivatePort", e.target.value)} />
                    </div>
                    <div className="input-wrap">
                      <span>Public Port</span>
                      <input placeholder="e.g. 8080" value={state.staticPublicPort} onChange={(e) => set("staticPublicPort", e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {state.activeNatType === "dynamic" && (
                <>
                  <label>NAT Pool</label>
                  <div className="input-wrap">
                    <span>Pool Name</span>
                    <input placeholder="e.g. POOL-WAN-01" value={state.poolName} onChange={(e) => set("poolName", e.target.value)} />
                  </div>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Start IP</span>
                      <input placeholder="e.g. 203.0.113.10" value={state.poolStartIP} onChange={(e) => set("poolStartIP", e.target.value)} />
                    </div>
                    <div className="input-wrap">
                      <span>End IP</span>
                      <input placeholder="e.g. 203.0.113.20" value={state.poolEndIP} onChange={(e) => set("poolEndIP", e.target.value)} />
                    </div>
                    <div className="input-wrap">
                      <span>Netmask</span>
                      <input placeholder="e.g. 255.255.255.224" value={state.poolNetmask} onChange={(e) => set("poolNetmask", e.target.value)} />
                    </div>
                  </div>
                  <div className="input-wrap">
                    <span>Bind ACL ID</span>
                    <input placeholder="e.g. 1" value={state.poolBindACL} onChange={(e) => set("poolBindACL", e.target.value)} />
                  </div>
                </>
              )}

            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply Changes</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}