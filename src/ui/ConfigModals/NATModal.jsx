import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, Activity, Server, Network } from "lucide-react";

export default function NATModal({ onClose }) {
  const [activeNatType, setActiveNatType] = useState("pat");

  return createPortal(
    <div className="config-modal-overlay nat-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <ArrowLeftRight size={20} />
            <span>NAT Configuration</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeNatType === "pat" ? "active" : ""}`} onClick={() => setActiveNatType("pat")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>PAT (Overload)</strong><p>Many-to-One</p></div>
            </button>

            <button className={`nav-item ${activeNatType === "static" ? "active" : ""}`} onClick={() => setActiveNatType("static")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>Static NAT</strong><p>One-to-One / Port</p></div>
            </button>

            <button className={`nav-item ${activeNatType === "dynamic" ? "active" : ""}`} onClick={() => setActiveNatType("dynamic")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Dynamic NAT</strong><p>Pool Mapping</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeNatType.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {/* INTERFACES */}
            <div className="config-group-mono">
              <label>Interface Assignment</label>
              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Inside</span>
                  <select><option>G0/0 (LAN)</option></select>
                </div>
                <div className="input-wrap">
                  <span>Outside</span>
                  <select><option>G0/1 (WAN)</option></select>
                </div>
              </div>
            </div>

            {/* ACL BUILDER */}
            <div className="config-group-mono">
              <label>Access Control List (ACL)</label>
              <div className="inline-fields">
                <div className="input-wrap">
                  <span>ACL ID</span>
                  <input type="text" placeholder="1" />
                </div>
                <div className="input-wrap">
                  <span>Source Network</span>
                  <input type="text" placeholder="192.168.1.0" />
                </div>
                <div className="input-wrap">
                  <span>Wildcard Mask</span>
                  <input type="text" placeholder="0.0.0.255" />
                </div>
              </div>
            </div>

            {/* DYNAMIC CONTENT */}
            <div className="config-group-mono highlight-area">

              {activeNatType === "pat" && (
                <>
                  <label>PAT Configuration</label>
                  <div className="input-wrap">
                    <span>Translation Mode</span>
                    <select>
                      <option>Use Interface IP</option>
                      <option>Use NAT Pool</option>
                    </select>
                  </div>
                  <div className="checkbox-wrap">
                    <input type="checkbox" defaultChecked />
                    <span>Enable Overload (Port Translation)</span>
                  </div>
                </>
              )}

              {activeNatType === "static" && (
                <>
                  <label>Static Mapping</label>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Private IP</span>
                      <input placeholder="192.168.1.10" />
                    </div>
                    <div className="input-wrap">
                      <span>Public IP</span>
                      <input placeholder="203.0.113.5" />
                    </div>
                  </div>
                  <label style={{ marginTop: "15px" }}>Port Forwarding (Static PAT)</label>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Private Port</span>
                      <input placeholder="80" />
                    </div>
                    <div className="input-wrap">
                      <span>Public Port</span>
                      <input placeholder="8080" />
                    </div>
                  </div>
                </>
              )}

              {activeNatType === "dynamic" && (
                <>
                  <label>NAT Pool</label>
                  <div className="input-wrap">
                    <span>Pool Name</span>
                    <input placeholder="MYPOOL" />
                  </div>
                  <div className="inline-fields">
                    <div className="input-wrap">
                      <span>Start IP</span>
                      <input placeholder="203.0.113.10" />
                    </div>
                    <div className="input-wrap">
                      <span>End IP</span>
                      <input placeholder="203.0.113.20" />
                    </div>
                    <div className="input-wrap">
                      <span>Netmask</span>
                      <input placeholder="255.255.255.224" />
                    </div>
                  </div>
                  <div className="input-wrap">
                    <span>Bind ACL ID</span>
                    <input placeholder="1" />
                  </div>
                </>
              )}

            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={onClose}>Apply Changes</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}