import { useState } from "react";
import { createPortal } from "react-dom";
import { Server, Network, ArrowDown, Lock, Activity } from "lucide-react";

export default function DHCPModal({ onClose }) {
  const [dhcpScope, setDhcpScope] = useState("basic");

  return createPortal(
    <div className="config-modal-overlay dhcp-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Server size={18} />
            <span>Advanced Configuration</span>
          </div>

          <div className="nav-list">

            <button className={`nav-item ${dhcpScope === "basic" ? "active" : ""}`} onClick={() => setDhcpScope("basic")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Basic Setup</strong><p>Gateway, DNS, Lease</p></div>
            </button>

            <button className={`nav-item ${dhcpScope === "pool" ? "active" : ""}`} onClick={() => setDhcpScope("pool")}>
              <div className="nav-icon"><ArrowDown size={16} /></div>
              <div className="nav-text"><strong>IP Pool Engine</strong><p>Allocation system</p></div>
            </button>

            <button className={`nav-item ${dhcpScope === "reservation" ? "active" : ""}`} onClick={() => setDhcpScope("reservation")}>
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>Binding Table</strong><p>MAC → IP mapping</p></div>
            </button>

            <button className={`nav-item ${dhcpScope === "advanced" ? "active" : ""}`} onClick={() => setDhcpScope("advanced")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>System Control</strong><p>Policies & behavior</p></div>
            </button>

          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{dhcpScope.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {dhcpScope === "basic" && (
              <div className="config-group-mono highlight-area">
                <label>Core DHCP Engine</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Default Gateway</span>
                    <input placeholder="192.168.1.1" />
                  </div>
                  <div className="input-wrap">
                    <span>Subnet Mask</span>
                    <input placeholder="255.255.255.0" />
                  </div>
                  <div className="input-wrap">
                    <span>DNS Server</span>
                    <input placeholder="8.8.8.8" />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable DHCP service</span>
                </div>
              </div>
            )}

            {dhcpScope === "pool" && (
              <div className="config-group-mono highlight-area">
                <label>IP Allocation Engine</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Start IP</span>
                    <input placeholder="192.168.1.100" />
                  </div>
                  <div className="input-wrap">
                    <span>End IP</span>
                    <input placeholder="192.168.1.200" />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Lease Time Policy</span>
                    <select>
                      <option>1 hour</option>
                      <option>12 hours</option>
                      <option>24 hours</option>
                      <option>7 days</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Conflict Handling</span>
                    <select>
                      <option>Reject duplicate</option>
                      <option>Override oldest</option>
                      <option>Ignore conflict</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {dhcpScope === "reservation" && (
              <div className="config-group-mono highlight-area">
                <label>Static Binding Table</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>MAC Address</th>
                      <th>Reserved IP</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td><input placeholder="Device Name" /></td>
                        <td><input placeholder="AA:BB:CC:DD:EE:FF" /></td>
                        <td><input placeholder="192.168.1.10" /></td>
                        <td>
                          <select>
                            <option>Active</option>
                            <option>Disabled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {dhcpScope === "advanced" && (
              <div className="config-group-mono highlight-area">
                <label>DHCP System Policies</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Domain Name</span>
                    <input placeholder="corp.local" />
                  </div>
                  <div className="input-wrap">
                    <span>NTP Server</span>
                    <input placeholder="time.google.com" />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>DHCP Relay</span>
                    <input placeholder="192.168.10.1" />
                  </div>
                  <div className="input-wrap">
                    <span>DNS Update Mode</span>
                    <select>
                      <option>Automatic</option>
                      <option>Manual</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Authoritative DHCP server</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable conflict detection engine</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable system logging</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable audit trail (enterprise mode)</span>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply Configuration</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}