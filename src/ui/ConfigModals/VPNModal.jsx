import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, ArrowLeftRight, ShieldCheck, Network, Activity } from "lucide-react";

export default function VPNModal({ onClose }) {
  const [activeVPNTab, setActiveVPNTab] = useState("tunnel");

  return createPortal(
    <div className="config-modal-overlay vpn-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Lock size={18} />
            <span>VPN Configuration</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeVPNTab === "tunnel" ? "active" : ""}`} onClick={() => setActiveVPNTab("tunnel")}>
              <div className="nav-icon"><ArrowLeftRight size={16} /></div>
              <div className="nav-text"><strong>Site-to-Site</strong><p>Tunnel endpoints</p></div>
            </button>

            <button className={`nav-item ${activeVPNTab === "crypto" ? "active" : ""}`} onClick={() => setActiveVPNTab("crypto")}>
              <div className="nav-icon"><ShieldCheck size={16} /></div>
              <div className="nav-text"><strong>Encryption</strong><p>IPSec / IKE policies</p></div>
            </button>

            <button className={`nav-item ${activeVPNTab === "routing" ? "active" : ""}`} onClick={() => setActiveVPNTab("routing")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Traffic Rules</strong><p>VPN ACL selectors</p></div>
            </button>

            <button className={`nav-item ${activeVPNTab === "status" ? "active" : ""}`} onClick={() => setActiveVPNTab("status")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>Monitoring</strong><p>Tunnel health & uptime</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeVPNTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeVPNTab === "tunnel" && (
              <div className="config-group-mono">
                <label>Site-to-Site Tunnel Setup</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Local Gateway</span>
                    <input placeholder="203.0.113.1" />
                  </div>
                  <div className="input-wrap">
                    <span>Remote Gateway</span>
                    <input placeholder="198.51.100.1" />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Local Subnet</span>
                    <input placeholder="192.168.1.0/24" />
                  </div>
                  <div className="input-wrap">
                    <span>Remote Subnet</span>
                    <input placeholder="10.10.0.0/24" />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Auto-negotiate tunnel</span>
                </div>
              </div>
            )}

            {activeVPNTab === "crypto" && (
              <div className="config-group-mono">
                <label>IPSec / IKE Encryption</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>IKE Version</span>
                    <select>
                      <option>IKEv2 (Recommended)</option>
                      <option>IKEv1</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Encryption</span>
                    <select>
                      <option>AES-256</option>
                      <option>AES-128</option>
                      <option>3DES (Legacy)</option>
                    </select>
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Integrity</span>
                    <select>
                      <option>SHA-256</option>
                      <option>SHA-1</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Pre-Shared Key</span>
                    <input type="password" placeholder="••••••••••" />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable Perfect Forward Secrecy (PFS)</span>
                </div>
              </div>
            )}

            {activeVPNTab === "routing" && (
              <div className="config-group-mono">
                <label>VPN Traffic Selection (Crypto ACL)</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Source Network</span>
                    <input placeholder="192.168.1.0/24" />
                  </div>
                  <div className="input-wrap">
                    <span>Destination Network</span>
                    <input placeholder="10.10.0.0/24" />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Encrypt matching traffic only</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Bypass local traffic optimization</span>
                </div>
              </div>
            )}

            {activeVPNTab === "status" && (
              <div className="config-group-mono">
                <label>Tunnel Monitoring Dashboard</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Tunnel</th>
                      <th>Status</th>
                      <th>Uptime</th>
                      <th>Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>HQ ↔ Branch A</td>
                      <td style={{ color: "green" }}>UP</td>
                      <td>3h 21m</td>
                      <td>28ms</td>
                    </tr>
                    <tr>
                      <td>HQ ↔ Branch B</td>
                      <td style={{ color: "red" }}>DOWN</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply VPN</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}