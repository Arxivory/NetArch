import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Lock, Server, ShieldCheck, Network, Activity } from "lucide-react";

let persistentSSHState = null;

const defaultKeys = [
  { user: "", keyType: "RSA",     fingerprint: "", active: true },
  { user: "", keyType: "ECDSA",   fingerprint: "", active: true },
  { user: "", keyType: "ED25519", fingerprint: "", active: false },
];

const defaultState = {
  activeSSHTab:    "general",
  sshEnabled:      "Enabled",
  port:            "",
  protocolVersion: "SSH-2 (Recommended)",
  allowRootLogin:  true,
  passwordLogin:   "Enabled",
  keyBasedAuth:    "Required",
  disableEmpty:    true,
  twoFA:           false,
  keys:            defaultKeys,
  allowedIP:       "",
  blockedIP:       "",
  ipFiltering:     true,
  rateLimiting:    false,
};

function dispatchLog(deviceName, deviceLocation, message) {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "Router", deviceName, message, location: deviceLocation },
    })
  );
}

export default function SSHModal({ onClose, deviceName = "Router-Core-01", deviceLocation = "Data Center" }) {
  const [state, setState] = useState(persistentSSHState || defaultState);
  const prevState = useRef(persistentSSHState || defaultState);
  const set = (field, value) => setState((s) => ({ ...s, [field]: value }));

  const updateKey = (i, field, value) => {
    const keys = [...state.keys];
    keys[i] = { ...keys[i], [field]: value };
    set("keys", keys);
  };

  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

  const handleApply = () => {
    const prev = prevState.current;
    const logs = [];
    const ts = now();

    // Service status
    if (state.sshEnabled !== prev.sshEnabled) {
      logs.push(
        state.sshEnabled === "Enabled"
          ? `%SSH-5-SERVICE_ENABLED: [${ts}] ${deviceName} @ ${deviceLocation} — SSH service STARTED. ` +
            `Listening on TCP/${state.port || "22"} using ${state.protocolVersion}. ` +
            `Remote management access is now available on this device.`
          : `%SSH-5-SERVICE_DISABLED: [${ts}] ${deviceName} @ ${deviceLocation} — SSH service STOPPED. ` +
            `All active sessions terminated. Remote CLI access is no longer available until re-enabled.`
      );
    }
    if (state.port !== prev.port && state.port) {
      logs.push(
        `%SSH-5-PORT_CHANGE: [${ts}] ${deviceName} — SSH listener port changed from ` +
        `${prev.port || "22"} to ${state.port}. ` +
        `Firewall ACLs and management station configurations must be updated to reflect new port.`
      );
    }
    if (state.protocolVersion !== prev.protocolVersion) {
      logs.push(
        `%SSH-5-PROTO_MOD: [${ts}] ${deviceName} — Protocol version changed from ` +
        `${prev.protocolVersion || "—"} to ${state.protocolVersion}. ` +
        `${state.protocolVersion.includes("1") ? "WARNING: SSH-1 is deprecated and cryptographically weak." : "SSH-2 selected; KEX and cipher negotiation updated."}`
      );
    }

    // Auth methods
    if (state.passwordLogin !== prev.passwordLogin) {
      logs.push(
        `%SSH-5-AUTH_PASSWD_MOD: [${ts}] ${deviceName} — Password authentication changed ` +
        `from ${prev.passwordLogin || "—"} to ${state.passwordLogin}. ` +
        `${state.passwordLogin === "Disabled" ? "Users must authenticate via SSH keys only." : "Password-based login re-enabled; ensure strong credential policy is enforced."}`
      );
    }
    if (state.keyBasedAuth !== prev.keyBasedAuth) {
      logs.push(
        `%SSH-5-AUTH_KEY_MOD: [${ts}] ${deviceName} — Key-based authentication policy changed ` +
        `from "${prev.keyBasedAuth || "—"}" to "${state.keyBasedAuth}". ` +
        `Authorized keys file re-evaluated on next connection attempt.`
      );
    }

    // Access control
    if (state.allowedIP !== prev.allowedIP || state.blockedIP !== prev.blockedIP) {
      logs.push(
        `%SSH-5-ACCESS_CTRL_MOD: [${ts}] ${deviceName} — SSH access control lists updated. ` +
        `Permitted: ${state.allowedIP || "any"} | Blocked: ${state.blockedIP || "none"}. ` +
        `IP filtering ${state.ipFiltering ? "ACTIVE" : "INACTIVE"}. ` +
        `New rules take effect immediately; existing sessions are not affected.`
      );
    }
    if (state.rateLimiting !== prev.rateLimiting) {
      logs.push(
        state.rateLimiting
          ? `%SSH-5-RATELIMIT_ENABLED: [${ts}] ${deviceName} — SSH brute-force protection enabled. ` +
            `Connection rate limiting active; excessive failed attempts will trigger temporary source block.`
          : `%SSH-6-RATELIMIT_DISABLED: [${ts}] ${deviceName} — SSH rate limiting disabled. ` +
            `No automatic blocking on repeated failed authentication attempts.`
      );
    }

    if (logs.length === 0) {
      logs.push(
        `%SSH-6-NOP: [${ts}] ${deviceName} @ ${deviceLocation} — SSH Apply invoked; no configuration changes detected. ` +
        `Service configuration, authentication policy, and access control rules remain unchanged.`
      );
    }

    logs.forEach((message) => dispatchLog(deviceName, deviceLocation, message));
    persistentSSHState = state;
    prevState.current = state;
    onClose();
  };

  return createPortal(
    <div className="config-modal-overlay ssh-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Lock size={18} />
            <span>SSH / Remote Access</span>
          </div>
          <div className="nav-list">
            <button className={`nav-item ${state.activeSSHTab === "general" ? "active" : ""}`} onClick={() => set("activeSSHTab", "general")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>General</strong><p>Enable & port settings</p></div>
            </button>
            <button className={`nav-item ${state.activeSSHTab === "auth" ? "active" : ""}`} onClick={() => set("activeSSHTab", "auth")}>
              <div className="nav-icon"><ShieldCheck size={16} /></div>
              <div className="nav-text"><strong>Authentication</strong><p>Password / Key access</p></div>
            </button>
            <button className={`nav-item ${state.activeSSHTab === "keys" ? "active" : ""}`} onClick={() => set("activeSSHTab", "keys")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>SSH Keys</strong><p>Public key management</p></div>
            </button>
            <button className={`nav-item ${state.activeSSHTab === "access" ? "active" : ""}`} onClick={() => set("activeSSHTab", "access")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Access Control</strong><p>Allowed IPs / users</p></div>
            </button>
            <button className={`nav-item ${state.activeSSHTab === "sessions" ? "active" : ""}`} onClick={() => set("activeSSHTab", "sessions")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>Sessions</strong><p>Active connections</p></div>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{state.activeSSHTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {state.activeSSHTab === "general" && (
              <div className="config-group-mono">
                <label>SSH Service Settings</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Enable SSH</span>
                    <select value={state.sshEnabled} onChange={(e) => set("sshEnabled", e.target.value)}>
                      <option>Select</option>
                      <option>Enabled</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Port</span>
                    <input placeholder="e.g. 22" value={state.port} onChange={(e) => set("port", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Protocol Version</span>
                    <select value={state.protocolVersion} onChange={(e) => set("protocolVersion", e.target.value)}>
                      <option>Select</option>
                      <option>SSH-2 (Recommended)</option>
                      <option>SSH-1 (Legacy)</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.allowRootLogin} onChange={(e) => set("allowRootLogin", e.target.checked)} />
                  <span>Allow remote root login</span>
                </div>
              </div>
            )}

            {state.activeSSHTab === "auth" && (
              <div className="config-group-mono">
                <label>Authentication Methods</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Password Login</span>
                    <select value={state.passwordLogin} onChange={(e) => set("passwordLogin", e.target.value)}>
                      <option>Select</option>
                      <option>Enabled</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Key-Based Auth</span>
                    <select value={state.keyBasedAuth} onChange={(e) => set("keyBasedAuth", e.target.value)}>
                      <option>Select</option>
                      <option>Required</option>
                      <option>Optional</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.disableEmpty} onChange={(e) => set("disableEmpty", e.target.checked)} />
                  <span>Disable empty passwords</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.twoFA} onChange={(e) => set("twoFA", e.target.checked)} />
                  <span>2FA (future support)</span>
                </div>
              </div>
            )}

            {state.activeSSHTab === "keys" && (
              <div className="config-group-mono">
                <label>SSH Public Keys</label>
                <table className="acl-table">
                  <thead>
                    <tr><th>User</th><th>Key Type</th><th>Fingerprint</th><th>Active</th></tr>
                  </thead>
                  <tbody>
                    {state.keys.map((k, i) => (
                      <tr key={i}>
                        <td><input placeholder="e.g. admin" value={k.user} onChange={(e) => updateKey(i, "user", e.target.value)} /></td>
                        <td>
                          <select value={k.keyType} onChange={(e) => updateKey(i, "keyType", e.target.value)}>
                            <option>RSA</option>
                            <option>ECDSA</option>
                            <option>ED25519</option>
                          </select>
                        </td>
                        <td><input placeholder="e.g. SHA256:xxxxxx" value={k.fingerprint} onChange={(e) => updateKey(i, "fingerprint", e.target.value)} /></td>
                        <td><input type="checkbox" checked={k.active} onChange={(e) => updateKey(i, "active", e.target.checked)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {state.activeSSHTab === "access" && (
              <div className="config-group-mono">
                <label>Access Restrictions</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Allowed IP Range</span>
                    <input placeholder="e.g. 192.168.1.0/24" value={state.allowedIP} onChange={(e) => set("allowedIP", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Blocked IP</span>
                    <input placeholder="e.g. 0.0.0.0/0 (optional)" value={state.blockedIP} onChange={(e) => set("blockedIP", e.target.value)} />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.ipFiltering} onChange={(e) => set("ipFiltering", e.target.checked)} />
                  <span>Enable IP filtering</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.rateLimiting} onChange={(e) => set("rateLimiting", e.target.checked)} />
                  <span>Rate limiting (anti brute-force)</span>
                </div>
              </div>
            )}

            {state.activeSSHTab === "sessions" && (
              <div className="config-group-mono">
                <label>Active SSH Sessions</label>
                <div className="acl-table">
                  <table>
                    <thead>
                      <tr><th>User</th><th>Source IP</th><th>Uptime</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>admin</td><td>192.168.1.10</td><td>2h 12m</td><td style={{ color: "green" }}>ACTIVE</td></tr>
                      <tr><td>root</td><td>10.0.0.5</td><td>15m</td><td style={{ color: "green" }}>ACTIVE</td></tr>
                      <tr><td>guest</td><td>203.0.113.9</td><td>—</td><td style={{ color: "red" }}>BLOCKED</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply SSH Config</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}