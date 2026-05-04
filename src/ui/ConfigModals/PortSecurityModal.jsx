import { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Cable, Lock } from "lucide-react";

export default function PortSecurityModal({ onClose }) {
  const [activePortSecurityTab, setActivePortSecurityTab] = useState("mac");

  return createPortal(
    <div className="config-modal-overlay port-security-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <ShieldCheck size={18} />
            <span>Port Security</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activePortSecurityTab === "mac" ? "active" : ""}`} onClick={() => setActivePortSecurityTab("mac")}>
              <div className="nav-icon"><Cable size={16} /></div>
              <div className="nav-text"><strong>MAC Binding</strong><p>Allowed device addresses</p></div>
            </button>

            <button className={`nav-item ${activePortSecurityTab === "violation" ? "active" : ""}`} onClick={() => setActivePortSecurityTab("violation")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>Violation Action</strong><p>Unauthorized access policy</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Port Security</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activePortSecurityTab === "mac" && (
              <div className="config-group-mono">
                <label>Secure MAC Address Table</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Port</th>
                      <th>MAC Address</th>
                      <th>Max MACs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Fa0/1", "Fa0/2", "Gi0/1"].map((port, i) => (
                      <tr key={i}>
                        <td>{port}</td>
                        <td><input placeholder="AA:BB:CC:DD:EE:FF" /></td>
                        <td><input placeholder="1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activePortSecurityTab === "violation" && (
              <div className="config-group-mono">
                <label>Violation Policies</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Action</span>
                    <select>
                      <option>Shutdown</option>
                      <option>Restrict</option>
                      <option>Protect</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Recovery Time</span>
                    <input placeholder="300 sec" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply Security</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}