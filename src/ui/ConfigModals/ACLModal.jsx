import { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Lock, Network, ArrowLeftRight } from "lucide-react";

export default function ACLModal({ onClose }) {
  const [activeACLSection, setActiveACLSection] = useState("rules");

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

            <button className={`nav-item ${activeACLSection === "rules" ? "active" : ""}`} onClick={() => setActiveACLSection("rules")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>ACL Rules</strong><p>Permit / Deny logic</p></div>
            </button>

            <button className={`nav-item ${activeACLSection === "binding" ? "active" : ""}`} onClick={() => setActiveACLSection("binding")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Interface Binding</strong><p>Apply ACL to ports</p></div>
            </button>

            <button className={`nav-item ${activeACLSection === "advanced" ? "active" : ""}`} onClick={() => setActiveACLSection("advanced")}>
              <div className="nav-icon"><ArrowLeftRight size={16} /></div>
              <div className="nav-text"><strong>Traffic Behavior</strong><p>Flow & logging</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeACLSection.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {/* GLOBAL */}
            <div className="config-group-mono">
              <label>ACL Mode</label>
              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Type</span>
                  <select>
                    <option>Standard</option>
                    <option>Extended</option>
                  </select>
                </div>
                <div className="input-wrap">
                  <span>ACL ID / Name</span>
                  <input placeholder="ACL_101" />
                </div>
              </div>
            </div>

            {/* DYNAMIC */}
            <div className="config-group-mono highlight-area">

              {activeACLSection === "rules" && (
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
                      {[1, 2, 3, 4].map((r, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            <select>
                              <option>permit</option>
                              <option>deny</option>
                            </select>
                          </td>
                          <td>
                            <select>
                              <option>ip</option>
                              <option>tcp</option>
                              <option>udp</option>
                              <option>icmp</option>
                            </select>
                          </td>
                          <td><input placeholder="192.168.1.0/24" /></td>
                          <td><input placeholder="any" /></td>
                          <td><input placeholder="80,443" /></td>
                          <td><input type="checkbox" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="checkbox-wrap">
                    <input type="checkbox" defaultChecked />
                    <span>Implicit Deny (block unmatched traffic)</span>
                  </div>
                </>
              )}

              {activeACLSection === "binding" && (
                <>
                  <label>Apply ACL to Interface</label>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Interface</span>
                      <select>
                        <option>G0/0 (LAN)</option>
                        <option>G0/1 (WAN)</option>
                        <option>VLAN 10</option>
                      </select>
                    </div>
                    <div className="input-wrap">
                      <span>Direction</span>
                      <select>
                        <option>Inbound</option>
                        <option>Outbound</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-wrap">
                    <span>Apply To</span>
                    <select>
                      <option>All Traffic</option>
                      <option>Matched Traffic Only</option>
                    </select>
                  </div>
                </>
              )}

              {activeACLSection === "advanced" && (
                <>
                  <label>Traffic Behavior</label>
                  <div className="input-wrap">
                    <span>Default Action</span>
                    <select>
                      <option>Deny</option>
                      <option>Permit</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Logging Level</span>
                    <select>
                      <option>None</option>
                      <option>Errors Only</option>
                      <option>All Matches</option>
                    </select>
                  </div>
                  <div className="checkbox-wrap">
                    <input type="checkbox" />
                    <span>Enable Stateful Inspection</span>
                  </div>
                  <div className="checkbox-wrap">
                    <input type="checkbox" />
                    <span>Enable Rate Limiting</span>
                  </div>
                </>
              )}

            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply ACL</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}