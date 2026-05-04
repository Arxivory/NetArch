import { useState } from "react";
import { createPortal } from "react-dom";
import { ServerIcon, Server, Activity } from "lucide-react";

export default function SyslogModal({ onClose }) {
  const [activeSyslogTab, setActiveSyslogTab] = useState("servers");

  return createPortal(
    <div className="config-modal-overlay syslog-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <ServerIcon size={18} />
            <span>Logs / Syslog</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeSyslogTab === "servers" ? "active" : ""}`} onClick={() => setActiveSyslogTab("servers")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>Syslog Servers</strong><p>Remote logging endpoints</p></div>
            </button>

            <button className={`nav-item ${activeSyslogTab === "severity" ? "active" : ""}`} onClick={() => setActiveSyslogTab("severity")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>Severity Levels</strong><p>Critical event filtering</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Syslog Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeSyslogTab === "servers" && (
              <div className="config-group-mono">
                <label>Remote Syslog Servers</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Server IP</th>
                      <th>Port</th>
                      <th>Protocol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((i) => (
                      <tr key={i}>
                        <td><input placeholder="192.168.1.250" /></td>
                        <td><input placeholder="514" /></td>
                        <td>
                          <select>
                            <option>UDP</option>
                            <option>TCP</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSyslogTab === "severity" && (
              <div className="config-group-mono">
                <label>Logging Severity</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Console Logging</span>
                    <select>
                      <option>Warnings</option>
                      <option>Errors</option>
                      <option>Critical</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Buffer Size</span>
                    <input placeholder="8192 KB" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply Syslog</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}