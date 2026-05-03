import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Server, ShieldCheck, Network, Activity } from "lucide-react";

export default function SSHModal({ onClose }) {
  const [activeSSHTab, setActiveSSHTab] = useState("general");

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

            <button className={`nav-item ${activeSSHTab === "general" ? "active" : ""}`} onClick={() => setActiveSSHTab("general")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>General</strong><p>Enable & port settings</p></div>
            </button>

            <button className={`nav-item ${activeSSHTab === "auth" ? "active" : ""}`} onClick={() => setActiveSSHTab("auth")}>
              <div className="nav-icon"><ShieldCheck size={16} /></div>
              <div className="nav-text"><strong>Authentication</strong><p>Password / Key access</p></div>
            </button>

            <button className={`nav-item ${activeSSHTab === "keys" ? "active" : ""}`} onClick={() => setActiveSSHTab("keys")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>SSH Keys</strong><p>Public key management</p></div>
            </button>

            <button className={`nav-item ${activeSSHTab === "access" ? "active" : ""}`} onClick={() => setActiveSSHTab("access")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Access Control</strong><p>Allowed IPs / users</p></div>
            </button>

            <button className={`nav-item ${activeSSHTab === "sessions" ? "active" : ""}`} onClick={() => setActiveSSHTab("sessions")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>Sessions</strong><p>Active connections</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeSSHTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeSSHTab === "general" && (
              <div className="config-group-mono">
                <label>SSH Service Settings</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Enable SSH</span>
                    <select>
                      <option>Enabled</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Port</span>
                    <input placeholder="22" />
                  </div>
                  <div className="input-wrap">
                    <span>Protocol Version</span>
                    <select>
                      <option>SSH-2 (Recommended)</option>
                      <option>SSH-1 (Legacy)</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Allow remote root login</span>
                </div>
              </div>
            )}

            {activeSSHTab === "auth" && (
              <div className="config-group-mono">
                <label>Authentication Methods</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Password Login</span>
                    <select>
                      <option>Enabled</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Key-Based Auth</span>
                    <select>
                      <option>Required</option>
                      <option>Optional</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Disable empty passwords</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>2FA (future support)</span>
                </div>
              </div>
            )}

            {activeSSHTab === "keys" && (
              <div className="config-group-mono">
                <label>SSH Public Keys</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Key Type</th>
                      <th>Fingerprint</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td><input placeholder="admin" /></td>
                        <td>
                          <select>
                            <option>RSA</option>
                            <option>ECDSA</option>
                            <option>ED25519</option>
                          </select>
                        </td>
                        <td><input placeholder="SHA256:xxxxxx" /></td>
                        <td><input type="checkbox" defaultChecked /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSSHTab === "access" && (
              <div className="config-group-mono">
                <label>Access Restrictions</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Allowed IP Range</span>
                    <input placeholder="192.168.1.0/24" />
                  </div>
                  <div className="input-wrap">
                    <span>Blocked IP</span>
                    <input placeholder="0.0.0.0/0 (optional)" />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable IP filtering</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Rate limiting (anti brute-force)</span>
                </div>
              </div>
            )}

            {activeSSHTab === "sessions" && (
              <div className="config-group-mono">
                <label>Active SSH Sessions</label>
                <div className="acl-table">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Source IP</th>
                        <th>Uptime</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>admin</td>
                        <td>192.168.1.10</td>
                        <td>2h 12m</td>
                        <td style={{ color: "green" }}>ACTIVE</td>
                      </tr>
                      <tr>
                        <td>root</td>
                        <td>10.0.0.5</td>
                        <td>15m</td>
                        <td style={{ color: "green" }}>ACTIVE</td>
                      </tr>
                      <tr>
                        <td>guest</td>
                        <td>203.0.113.9</td>
                        <td>—</td>
                        <td style={{ color: "red" }}>BLOCKED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply SSH Config</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}