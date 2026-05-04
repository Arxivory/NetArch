import { useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Server, Lock, Network, ArrowDown } from "lucide-react";

export default function SNMPModal({ onClose }) {
  const [activeSNMPTab, setActiveSNMPTab] = useState("agent");

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

            <button className={`nav-item ${activeSNMPTab === "agent" ? "active" : ""}`} onClick={() => setActiveSNMPTab("agent")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>SNMP Agent</strong><p>Identity & versioning</p></div>
            </button>

            <button className={`nav-item ${activeSNMPTab === "security" ? "active" : ""}`} onClick={() => setActiveSNMPTab("security")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>Security</strong><p>v1/v2c/v3 access control</p></div>
            </button>

            <button className={`nav-item ${activeSNMPTab === "mib" ? "active" : ""}`} onClick={() => setActiveSNMPTab("mib")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>MIB Monitoring</strong><p>OID tracking & thresholds</p></div>
            </button>

            <button className={`nav-item ${activeSNMPTab === "traps" ? "active" : ""}`} onClick={() => setActiveSNMPTab("traps")}>
              <div className="nav-icon"><ArrowDown size={16} /></div>
              <div className="nav-text"><strong>Traps & Alerts</strong><p>Event notification system</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeSNMPTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeSNMPTab === "agent" && (
              <div className="config-group-mono">
                <label>SNMP Agent Identity</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>System Name</span>
                    <input placeholder="Router-Core-01" />
                  </div>
                  <div className="input-wrap">
                    <span>Location</span>
                    <input placeholder="Data Center - Manila" />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>SNMP Version</span>
                    <select>
                      <option>v3 (Recommended)</option>
                      <option>v2c</option>
                      <option>v1 (Legacy)</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Contact</span>
                    <input placeholder="admin@network.local" />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable SNMP agent globally</span>
                </div>
              </div>
            )}

            {activeSNMPTab === "security" && (
              <div className="config-group-mono">
                <label>SNMP Security Configuration</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Read Community</span>
                    <input placeholder="public" />
                  </div>
                  <div className="input-wrap">
                    <span>Write Community</span>
                    <input placeholder="private" />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Manager IP ACL</span>
                    <input placeholder="192.168.1.10/32" />
                  </div>
                  <div className="input-wrap">
                    <span>SNMPv3 Security Level</span>
                    <select>
                      <option>authPriv (Recommended)</option>
                      <option>authNoPriv</option>
                      <option>noAuthNoPriv</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable access logging</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Restrict SNMP to trusted networks only</span>
                </div>
              </div>
            )}

            {activeSNMPTab === "mib" && (
              <div className="config-group-mono">
                <label>MIB / OID Monitoring Engine</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>OID</th>
                      <th>Metric</th>
                      <th>Threshold</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>.1.3.6.1.2.1.1.3</td>
                      <td>System Uptime</td>
                      <td><input placeholder="> 99.9%" /></td>
                      <td><input type="checkbox" defaultChecked /></td>
                    </tr>
                    <tr>
                      <td>.1.3.6.1.2.1.2.2</td>
                      <td>Interface Utilization</td>
                      <td><input placeholder="> 80%" /></td>
                      <td><input type="checkbox" /></td>
                    </tr>
                    <tr>
                      <td>.1.3.6.1.4.1</td>
                      <td>CPU Load</td>
                      <td><input placeholder="> 75%" /></td>
                      <td><input type="checkbox" defaultChecked /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeSNMPTab === "traps" && (
              <div className="config-group-mono">
                <label>Trap & Alert System</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Trap Receiver IP</span>
                    <input placeholder="192.168.1.100" />
                  </div>
                  <div className="input-wrap">
                    <span>Port</span>
                    <input placeholder="162" />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Link up/down notifications</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>CPU / Memory threshold alerts</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Anomaly detection engine</span>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply SNMP</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}