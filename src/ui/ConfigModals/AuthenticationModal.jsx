import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Server, ShieldCheck } from "lucide-react";

export default function AuthenticationModal({ onClose }) {
  const [activeAuthTab, setActiveAuthTab] = useState("radius");

  return createPortal(
    <div className="config-modal-overlay auth-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Lock size={18} />
            <span>User Authentication</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${activeAuthTab === "radius" ? "active" : ""}`} onClick={() => setActiveAuthTab("radius")}>
              <div className="nav-icon"><Server size={16} /></div>
              <div className="nav-text"><strong>RADIUS</strong><p>AAA authentication server</p></div>
            </button>

            <button className={`nav-item ${activeAuthTab === "dot1x" ? "active" : ""}`} onClick={() => setActiveAuthTab("dot1x")}>
              <div className="nav-icon"><ShieldCheck size={16} /></div>
              <div className="nav-text"><strong>802.1X</strong><p>Port-based access control</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Authentication Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {activeAuthTab === "radius" && (
              <div className="config-group-mono">
                <label>RADIUS Server Configuration</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Server IP</span>
                    <input placeholder="192.168.1.200" />
                  </div>
                  <div className="input-wrap">
                    <span>Port</span>
                    <input placeholder="1812" />
                  </div>
                  <div className="input-wrap">
                    <span>Shared Secret</span>
                    <input type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>
            )}

            {activeAuthTab === "dot1x" && (
              <div className="config-group-mono">
                <label>802.1X Access Control</label>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable 802.1X globally</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Force authentication on access ports</span>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply Authentication</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}