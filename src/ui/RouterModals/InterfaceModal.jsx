import { useState } from "react";
import { createPortal } from "react-dom";
import { Network, ChevronDown, ChevronRight, Layers } from "lucide-react";

const DEFAULT_INTERFACES = [
  { id: "g0/0",   label: "GigabitEthernet 0/0", description: "LAN-facing port"       },
  { id: "g0/1",   label: "GigabitEthernet 0/1", description: "WAN-facing port"       },
  { id: "g0/2",   label: "GigabitEthernet 0/2", description: "DMZ / uplink"          },
  { id: "s0/0/0", label: "Serial 0/0/0",         description: "WAN serial link"       },
  { id: "lo0",    label: "Loopback 0",            description: "Management / BGP RID" },
];

function InterfaceRow({ iface, deviceName, deviceLocation }) {
  const [open,    setOpen]    = useState(false);
  const [ip,      setIp]      = useState("");
  const [mask,    setMask]    = useState("");
  const [gateway, setGateway] = useState("");
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    const logs = [];
    if (ip)      logs.push(`[Interface ${iface.label}] IP Address: ${ip}`);
    if (mask)    logs.push(`[Interface ${iface.label}] Subnet Mask: ${mask}`);
    if (gateway) logs.push(`[Interface ${iface.label}] Default Gateway: ${gateway}`);
    if (!logs.length) logs.push(`[Interface ${iface.label}] Applied — no parameters configured`);

    logs.forEach((message) =>
      window.dispatchEvent(
        new CustomEvent("add-system-log", {
          detail: { device: "Router", deviceName, message, location: deviceLocation },
        })
      )
    );

    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const isConfigured = ip || mask || gateway;

  return (
    <div className={`iface-row ${open ? "iface-row--open" : ""}`}>

      {/* ── Row header ── */}
      <button className="iface-header" onClick={() => setOpen((v) => !v)}>
        <span className="iface-chevron">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span className="iface-icon">
          <Network size={14} />
        </span>
        <span className="iface-label">{iface.label}</span>
        <span className="iface-desc">{iface.description}</span>
        {isConfigured && <span className="iface-badge">configured</span>}
      </button>

      {/* ── Expanded config ── */}
      {open && (
        <div className="iface-body">

          <div className="iface-fields">
            <div className="iface-field">
              <span className="iface-field-label">IP Address</span>
              <input
                className="iface-input"
                placeholder="192.168.1.1"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
            </div>

            <div className="iface-field">
              <span className="iface-field-label">Subnet Mask</span>
              <input
                className="iface-input"
                placeholder="255.255.255.0"
                value={mask}
                onChange={(e) => setMask(e.target.value)}
              />
            </div>

            <div className="iface-field">
              <span className="iface-field-label">Default Gateway</span>
              <input
                className="iface-input"
                placeholder="192.168.1.254"
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
              />
            </div>
          </div>

          <div className="iface-apply-row">
            <button
              className={`iface-apply-btn ${applied ? "iface-apply-btn--ok" : ""}`}
              onClick={handleApply}
            >
              {applied ? "✓ Applied" : "Apply Interface"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default function InterfaceModal({
  onClose,
  deviceName     = "Router",
  deviceLocation = "Network",
}) {
  return createPortal(
    <div className="config-modal-overlay nat-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Layers size={20} />
            <span>Interface Configuration</span>
          </div>

          <div className="nav-list">
            <button className="nav-item active">
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text">
                <strong>Interfaces</strong>
                <p>IP, mask &amp; gateway</p>
              </div>
            </button>
          </div>

          
        </div>

        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>INTERFACE SETTINGS</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            <div className="iface-list-group">
              <p className="iface-section-label">Router Interfaces</p>
              <p className="iface-hint">Select an interface to configure its network parameters.</p>

              <div className="iface-list">
                {DEFAULT_INTERFACES.map((iface) => (
                  <InterfaceRow
                    key={iface.id}
                    iface={iface}
                    deviceName={deviceName}
                    deviceLocation={deviceLocation}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}