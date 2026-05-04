import { useState } from "react";
import { createPortal } from "react-dom";
import { GitBranch, Network, Layers, ShieldCheck } from "lucide-react";

export default function STPModal({ onClose }) {
  const [activeSTPTab, setActiveSTPTab] = useState("global");

  return createPortal(
    <div className="config-modal-overlay stp-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <GitBranch size={18} />
            <span>Spanning Tree</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeSTPTab === "global" ? "active" : ""}`} onClick={() => setActiveSTPTab("global")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Global STP</strong><p>Core spanning tree mode</p></div>
            </button>

            <button className={`nav-item ${activeSTPTab === "priority" ? "active" : ""}`} onClick={() => setActiveSTPTab("priority")}>
              <div className="nav-icon"><Layers size={16} /></div>
              <div className="nav-text"><strong>Bridge Priority</strong><p>Root bridge election</p></div>
            </button>

            <button className={`nav-item ${activeSTPTab === "protection" ? "active" : ""}`} onClick={() => setActiveSTPTab("protection")}>
              <div className="nav-icon"><ShieldCheck size={16} /></div>
              <div className="nav-text"><strong>Protection</strong><p>BPDU & root guard</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Spanning Tree Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeSTPTab === "global" && (
              <div className="config-group-mono">
                <label>STP Global Settings</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>STP Mode</span>
                    <select>
                      <option>Rapid PVST+</option>
                      <option>PVST+</option>
                      <option>MST</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Hello Time</span>
                    <input placeholder="2 sec" />
                  </div>
                  <div className="input-wrap">
                    <span>Forward Delay</span>
                    <input placeholder="15 sec" />
                  </div>
                </div>
              </div>
            )}

            {activeSTPTab === "priority" && (
              <div className="config-group-mono">
                <label>Bridge Priority</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>VLAN</th>
                      <th>Priority</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[10, 20, 30].map((vlan, i) => (
                      <tr key={i}>
                        <td>{vlan}</td>
                        <td><input placeholder="32768" /></td>
                        <td>
                          <select>
                            <option>Root Primary</option>
                            <option>Root Secondary</option>
                            <option>Normal</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSTPTab === "protection" && (
              <div className="config-group-mono">
                <label>Loop Protection Features</label>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable BPDU Guard</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable Root Guard</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable Loop Guard</span>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply STP Config</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}