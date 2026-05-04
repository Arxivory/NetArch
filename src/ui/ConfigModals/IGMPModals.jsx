import { useState } from "react";
import { createPortal } from "react-dom";
import { Layers, Network, Server } from "lucide-react";

export default function IGMPModals({ onClose }) {
  const [activeIGMPTab, setActiveIGMPTab] = useState("snooping");

  return createPortal(
    <div className="config-modal-overlay igmp-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Layers size={18} />
            <span>IGMP Snooping</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeIGMPTab === "snooping" ? "active" : ""}`} onClick={() => setActiveIGMPTab("snooping")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Snooping</strong><p>Multicast optimization</p></div>
            </button>

            <button className={`nav-item ${activeIGMPTab === "querier" ? "active" : ""}`} onClick={() => setActiveIGMPTab("querier")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>Querier</strong><p>IGMP query management</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced IGMP Snooping</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeIGMPTab === "snooping" && (
              <div className="config-group-mono">
                <label>Multicast Traffic Settings</label>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable IGMP Snooping</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Fast leave processing</span>
                </div>
              </div>
            )}

            {activeIGMPTab === "querier" && (
              <div className="config-group-mono">
                <label>Querier Parameters</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Querier IP</span>
                    <input placeholder="192.168.1.1" />
                  </div>
                  <div className="input-wrap">
                    <span>Query Interval</span>
                    <input placeholder="125 sec" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply IGMP</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}