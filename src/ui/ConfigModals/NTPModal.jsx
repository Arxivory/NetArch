import { useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Server, ArrowLeftRight, Lock, Activity } from "lucide-react";

export default function NTPModal({ onClose }) {
  const [activeNTPTab, setActiveNTPTab] = useState("server");

  return createPortal(
    <div className="config-modal-overlay ntp-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Clock size={18} />
            <span>NTP Configuration</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeNTPTab === "server" ? "active" : ""}`} onClick={() => setActiveNTPTab("server")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>NTP Servers</strong><p>Time source hierarchy</p></div>
            </button>

            <button className={`nav-item ${activeNTPTab === "sync" ? "active" : ""}`} onClick={() => setActiveNTPTab("sync")}>
              <div className="nav-icon"><ArrowLeftRight size={16} /></div>
              <div className="nav-text"><strong>Sync Engine</strong><p>Intervals & behavior</p></div>
            </button>

            <button className={`nav-item ${activeNTPTab === "auth" ? "active" : ""}`} onClick={() => setActiveNTPTab("auth")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>Authentication</strong><p>Secure time validation</p></div>
            </button>

            <button className={`nav-item ${activeNTPTab === "status" ? "active" : ""}`} onClick={() => setActiveNTPTab("status")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>Monitoring</strong><p>Clock drift & sync health</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeNTPTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeNTPTab === "server" && (
              <div className="config-group-mono">
                <label>Time Source Hierarchy</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>NTP Server</th>
                      <th>Type</th>
                      <th>Enabled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td>{i}</td>
                        <td><input placeholder="time.server.com" /></td>
                        <td>
                          <select>
                            <option>Public</option>
                            <option>Pool</option>
                            <option>Internal</option>
                            <option>Fallback</option>
                          </select>
                        </td>
                        <td><input type="checkbox" defaultChecked /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeNTPTab === "sync" && (
              <div className="config-group-mono">
                <label>Synchronization Engine</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Sync Interval</span>
                    <select>
                      <option>30 sec</option>
                      <option>60 sec</option>
                      <option>5 min</option>
                      <option>15 min</option>
                      <option>1 hour</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Mode</span>
                    <select>
                      <option>Client</option>
                      <option>Server</option>
                      <option>Peer</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Auto drift correction (slew mode)</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Force sync on boot</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Fallback to secondary NTP source</span>
                </div>
              </div>
            )}

            {activeNTPTab === "auth" && (
              <div className="config-group-mono">
                <label>NTP Authentication Layer</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Key ID</span>
                    <input placeholder="1" />
                  </div>
                  <div className="input-wrap">
                    <span>Algorithm</span>
                    <select>
                      <option>MD5</option>
                      <option>SHA1</option>
                      <option>SHA256</option>
                    </select>
                  </div>
                </div>
                <div className="input-wrap">
                  <span>Shared Key</span>
                  <input type="password" placeholder="••••••••••••" />
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Require authentication for all NTP peers</span>
                </div>
              </div>
            )}

            {activeNTPTab === "status" && (
              <div className="config-group-mono">
                <label>Clock Synchronization Health</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Offset</th>
                      <th>Last Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>time.google.com</td>
                      <td style={{ color: "green" }}>SYNCED</td>
                      <td>+0.003s</td>
                      <td>12s ago</td>
                    </tr>
                    <tr>
                      <td>pool.ntp.org</td>
                      <td style={{ color: "green" }}>SYNCED</td>
                      <td>+0.007s</td>
                      <td>18s ago</td>
                    </tr>
                    <tr>
                      <td>Local Clock</td>
                      <td style={{ color: "orange" }}>STANDBY</td>
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
            <button className="btn-primary">Apply NTP</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}