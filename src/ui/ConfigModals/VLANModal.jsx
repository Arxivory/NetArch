import { useState } from "react";
import { createPortal } from "react-dom";
import { Network, Layers, Cable, ArrowLeftRight, GitBranch, Activity } from "lucide-react";

export default function VLANModal({ onClose }) {
  const [activeVLANTab, setActiveVLANTab] = useState("vlans");

  return createPortal(
    <div className="config-modal-overlay vlan-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Network size={18} />
            <span>VLAN Manager</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeVLANTab === "vlans" ? "active" : ""}`} onClick={() => setActiveVLANTab("vlans")}>
              <div className="nav-icon"><Layers size={16} /></div>
              <div className="nav-text"><strong>VLAN Database</strong><p>Create & manage VLANs</p></div>
            </button>

            <button className={`nav-item ${activeVLANTab === "ports" ? "active" : ""}`} onClick={() => setActiveVLANTab("ports")}>
              <div className="nav-icon"><Cable size={16} /></div>
              <div className="nav-text"><strong>Port Assignment</strong><p>Access & trunk ports</p></div>
            </button>

            <button className={`nav-item ${activeVLANTab === "trunk" ? "active" : ""}`} onClick={() => setActiveVLANTab("trunk")}>
              <div className="nav-icon"><ArrowLeftRight size={16} /></div>
              <div className="nav-text"><strong>Trunking</strong><p>802.1Q uplink config</p></div>
            </button>

            <button className={`nav-item ${activeVLANTab === "stp" ? "active" : ""}`} onClick={() => setActiveVLANTab("stp")}>
              <div className="nav-icon"><GitBranch size={16} /></div>
              <div className="nav-text"><strong>STP Settings</strong><p>Loop prevention</p></div>
            </button>

            <button className={`nav-item ${activeVLANTab === "monitor" ? "active" : ""}`} onClick={() => setActiveVLANTab("monitor")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>Monitoring</strong><p>Traffic & VLAN health</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced VLAN Switch Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeVLANTab === "vlans" && (
              <div className="config-group-mono">
                <label>VLAN Database</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>VLAN ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td><input placeholder="10" /></td>
                        <td><input placeholder="SALES_VLAN" /></td>
                        <td>
                          <select>
                            <option>Data</option>
                            <option>Voice</option>
                            <option>Management</option>
                            <option>Native</option>
                          </select>
                        </td>
                        <td>
                          <select>
                            <option>Active</option>
                            <option>Suspended</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable VLAN pruning</span>
                </div>
              </div>
            )}

            {activeVLANTab === "ports" && (
              <div className="config-group-mono">
                <label>Switch Port Assignment</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>Mode</th>
                      <th>Access VLAN</th>
                      <th>Voice VLAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Fa0/1", "Fa0/2", "Fa0/3", "Gi0/1"].map((port, i) => (
                      <tr key={i}>
                        <td>{port}</td>
                        <td>
                          <select>
                            <option>Access</option>
                            <option>Trunk</option>
                            <option>Dynamic Auto</option>
                          </select>
                        </td>
                        <td><input placeholder="10" /></td>
                        <td><input placeholder="20" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeVLANTab === "trunk" && (
              <div className="config-group-mono">
                <label>802.1Q Trunk Configuration</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Native VLAN</span>
                    <input placeholder="99" />
                  </div>
                  <div className="input-wrap">
                    <span>Allowed VLANs</span>
                    <input placeholder="10,20,30,99" />
                  </div>
                  <div className="input-wrap">
                    <span>Encapsulation</span>
                    <select>
                      <option>802.1Q</option>
                      <option>ISL</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable DTP negotiation</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Restrict unused VLANs</span>
                </div>
              </div>
            )}

            {activeVLANTab === "stp" && (
              <div className="config-group-mono">
                <label>Spanning Tree Protocol</label>
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
                    <span>Bridge Priority</span>
                    <input placeholder="32768" />
                  </div>
                  <div className="input-wrap">
                    <span>Root Guard</span>
                    <select>
                      <option>Enabled</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable PortFast on access ports</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable BPDU Guard</span>
                </div>
              </div>
            )}

            {activeVLANTab === "monitor" && (
              <div className="config-group-mono">
                <label>VLAN Monitoring & Statistics</label>
                <div className="acl-table">
                  <table>
                    <thead>
                      <tr>
                        <th>VLAN</th>
                        <th>Ports</th>
                        <th>Traffic Load</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>10</td>
                        <td>Fa0/1, Fa0/2</td>
                        <td>42%</td>
                        <td style={{ color: "green" }}>ACTIVE</td>
                      </tr>
                      <tr>
                        <td>20</td>
                        <td>Fa0/3</td>
                        <td>67%</td>
                        <td style={{ color: "green" }}>ACTIVE</td>
                      </tr>
                      <tr>
                        <td>99</td>
                        <td>Gi0/1</td>
                        <td>12%</td>
                        <td style={{ color: "orange" }}>NATIVE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply VLAN Config</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}