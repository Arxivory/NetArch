import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Network, ChevronDown, ChevronRight, Layers, Globe } from "lucide-react";
import appState from "../../state/AppState";

// ---------------------------------------------------------------------------
// Fallback interfaces shown when a device has no interfaces registered yet.
// These mirror common Cisco router defaults so the modal is never empty.
// ---------------------------------------------------------------------------
const FALLBACK_INTERFACES = [
  { id: "g0/0",   name: "GigabitEthernet0/0", description: "LAN-facing port"       },
  { id: "g0/1",   name: "GigabitEthernet0/1", description: "WAN-facing port"       },
  { id: "g0/2",   name: "GigabitEthernet0/2", description: "DMZ / uplink"          },
  { id: "s0/0/0", name: "Serial0/0/0",         description: "WAN serial link"       },
  { id: "lo0",    name: "Loopback0",            description: "Management / BGP RID" },
];

// ---------------------------------------------------------------------------
// Normalise a raw interface object (from Device.js or a plain data object)
// into a consistent shape that InterfaceRow can consume.
// ---------------------------------------------------------------------------
function normaliseInterface(raw, index) {
  if (!raw) return null;

  const id   = raw.id   ?? raw.name ?? `iface-${index}`;
  const name = raw.name ?? raw.label ?? raw.id ?? `Interface ${index}`;
  const desc = raw.description ?? raw.desc ?? "";

  // IPv4
  const address    = raw.ipv4?.address    ?? raw.ipAddress  ?? raw.ip   ?? "";
  const subnetMask = raw.ipv4?.subnetMask ?? raw.subnetMask ?? raw.mask ?? "";

  // IPv6
  const ipv6Address    = raw.ipv6?.address       ?? raw.ipv6Address    ?? "";
  const ipv6Prefix     = raw.ipv6?.prefixLength   ?? raw.ipv6Prefix     ?? "";
  const ipv6LinkLocal  = raw.ipv6?.linkLocal      ?? raw.ipv6LinkLocal  ?? "";
  const ipv6EUI64      = raw.ipv6?.eui64          ?? raw.ipv6EUI64      ?? false;

  const isUp =
    raw.isUp !== undefined ? raw.isUp :
    raw.status === "up"   ? true      : null;

  const isConnected = raw.isConnected ?? false;
  const connectedTo = raw.connectedTo ?? null;

  return {
    id, name, desc,
    address, subnetMask,
    ipv6Address, ipv6Prefix, ipv6LinkLocal, ipv6EUI64,
    isUp, isConnected, connectedTo,
  };
}

// ---------------------------------------------------------------------------
// InterfaceRow — IPv4 tab
// ---------------------------------------------------------------------------
function InterfaceRowIPv4({ iface, deviceId, deviceName, deviceLocation }) {
  const [open,    setOpen]    = useState(false);
  const [ip,      setIp]      = useState(iface.address);
  const [mask,    setMask]    = useState(iface.subnetMask);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (deviceId && appState?.network) {
      const device = appState.network.getDevice(deviceId);
      if (device) {
        const rawIface =
          device._interfaces?.get?.(iface.name) ??
          device._interfaces?.get?.(iface.id)   ??
          (Array.isArray(device.interfaces)
            ? device.interfaces.find(
                i => (i.id ?? i.name) === iface.id || i.name === iface.name
              )
            : null);

        if (rawIface) {
          if (typeof rawIface.configureIPv4 === "function") {
            rawIface.configureIPv4(ip, mask);
          } else {
            rawIface.ipv4 = { ...(rawIface.ipv4 ?? {}), address: ip, subnetMask: mask };
          }
        }

        appState.network.updateModified?.();
        appState.network.notify?.();
      }
    }

    const logs = [];
    if (ip)   logs.push(`[Interface ${iface.name}] IPv4 Address: ${ip}`);
    if (mask) logs.push(`[Interface ${iface.name}] Subnet Mask: ${mask}`);
    if (!logs.length) logs.push(`[Interface ${iface.name}] Applied — no IPv4 parameters configured`);

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

  const isConfigured = ip || mask;

  const statusColor =
    iface.isUp === true  ? "#22c55e" :
    iface.isUp === false ? "#ef4444" : "#6b7280";

  return (
    <div className={`iface-row ${open ? "iface-row--open" : ""}`}>
      <button className="iface-header" onClick={() => setOpen((v) => !v)}>
        <span className="iface-chevron">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span className="iface-icon"><Network size={14} /></span>
        <span
          title={iface.isUp === true ? "Up" : iface.isUp === false ? "Down" : "Status unknown"}
          style={{
            display: "inline-block", width: 8, height: 8,
            borderRadius: "50%", background: statusColor,
            marginRight: 6, flexShrink: 0,
          }}
        />
        <span className="iface-label">{iface.name}</span>
        {iface.desc && <span className="iface-desc">{iface.desc}</span>}
        {iface.isConnected && (
          <span className="iface-badge iface-badge--connected">connected</span>
        )}
        {isConfigured && <span className="iface-badge">configured</span>}
      </button>

      {open && (
        <div className="iface-body">
          {iface.connectedTo && (
            <div className="iface-connected-info">
              <span className="iface-connected-label">↔ Connected to</span>
              <span className="iface-connected-peer">
                {iface.connectedTo.deviceName}
                {iface.connectedTo.portName ? ` / ${iface.connectedTo.portName}` : ""}
              </span>
            </div>
          )}
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

// ---------------------------------------------------------------------------
// InterfaceRow — IPv6 tab
// ---------------------------------------------------------------------------
function InterfaceRowIPv6({ iface, deviceId, deviceName, deviceLocation }) {
  const [open,    setOpen]    = useState(false);
  const [addr,    setAddr]    = useState(iface.ipv6Address);
  const [prefix,  setPrefix]  = useState(iface.ipv6Prefix);
  const [eui64,   setEui64]   = useState(iface.ipv6EUI64);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (deviceId && appState?.network) {
      const device = appState.network.getDevice(deviceId);
      if (device) {
        const rawIface =
          device._interfaces?.get?.(iface.name) ??
          device._interfaces?.get?.(iface.id)   ??
          (Array.isArray(device.interfaces)
            ? device.interfaces.find(
                i => (i.id ?? i.name) === iface.id || i.name === iface.name
              )
            : null);

        if (rawIface) {
          if (typeof rawIface.configureIPv6 === "function") {
            rawIface.configureIPv6(addr, prefix, eui64);
          } else {
            rawIface.ipv6 = {
              ...(rawIface.ipv6 ?? {}),
              address: addr,
              prefixLength: prefix,
              eui64,
            };
          }
        }

        appState.network.updateModified?.();
        appState.network.notify?.();
      }
    }

    const logs = [];
    if (addr)   logs.push(`[Interface ${iface.name}] IPv6 Address: ${addr}/${prefix || "?"}`);
    if (eui64)  logs.push(`[Interface ${iface.name}] EUI-64 enabled`);
    if (!logs.length) logs.push(`[Interface ${iface.name}] Applied — no IPv6 parameters configured`);

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

  const isConfigured = addr || prefix;

  const statusColor =
    iface.isUp === true  ? "#22c55e" :
    iface.isUp === false ? "#ef4444" : "#6b7280";

  return (
    <div className={`iface-row ${open ? "iface-row--open" : ""}`}>
      <button className="iface-header" onClick={() => setOpen((v) => !v)}>
        <span className="iface-chevron">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span className="iface-icon"><Globe size={14} /></span>
        <span
          title={iface.isUp === true ? "Up" : iface.isUp === false ? "Down" : "Status unknown"}
          style={{
            display: "inline-block", width: 8, height: 8,
            borderRadius: "50%", background: statusColor,
            marginRight: 6, flexShrink: 0,
          }}
        />
        <span className="iface-label">{iface.name}</span>
        {iface.desc && <span className="iface-desc">{iface.desc}</span>}
        {iface.isConnected && (
          <span className="iface-badge iface-badge--connected">connected</span>
        )}
        {isConfigured && <span className="iface-badge">configured</span>}
      </button>

      {open && (
        <div className="iface-body">
          {iface.connectedTo && (
            <div className="iface-connected-info">
              <span className="iface-connected-label">↔ Connected to</span>
              <span className="iface-connected-peer">
                {iface.connectedTo.deviceName}
                {iface.connectedTo.portName ? ` / ${iface.connectedTo.portName}` : ""}
              </span>
            </div>
          )}

          <div className="iface-fields">
            <div className="iface-field">
              <span className="iface-field-label">IPv6 Address</span>
              <input
                className="iface-input"
                placeholder="2001:db8::1"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
              />
            </div>
            <div className="iface-field">
              <span className="iface-field-label">Prefix Length</span>
              <input
                className="iface-input"
                placeholder="64"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
            </div>
          </div>

          {/* Link-local — read-only, auto-derived by router */}
          {iface.ipv6LinkLocal && (
            <div className="iface-fields">
              <div className="iface-field">
                <span className="iface-field-label">Link-Local</span>
                <input
                  className="iface-input iface-input--readonly"
                  value={iface.ipv6LinkLocal}
                  readOnly
                  title="Auto-assigned by the router; not editable here"
                />
              </div>
            </div>
          )}

          {/* EUI-64 toggle */}
          <div className="iface-fields">
            <div className="iface-field iface-field--row">
              <label className="iface-toggle" htmlFor={`eui64-${iface.id}`}>
                <input
                  id={`eui64-${iface.id}`}
                  type="checkbox"
                  checked={eui64}
                  onChange={(e) => setEui64(e.target.checked)}
                />
                <span className="iface-toggle-track" />
                <span className="iface-field-label" style={{ marginLeft: 8 }}>
                  EUI-64 (auto-generate interface ID)
                </span>
              </label>
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

// ---------------------------------------------------------------------------
// InterfaceModal
// ---------------------------------------------------------------------------
export default function InterfaceModal({
  onClose,
  deviceName     = "Router",
  deviceLocation = "Network",
  device         = null,
}) {
  // "ipv4" | "ipv6"
  const [activeTab, setActiveTab] = useState("ipv4");

  const interfaces = useMemo(() => {
    const rawList = [];
    const seen    = new Set();

    const push = (raw, idx) => {
      if (!raw) return;
      const key = raw.name ?? raw.id ?? raw.label ?? `iface-${idx}`;
      if (seen.has(key)) return;
      seen.add(key);
      rawList.push(raw);
    };

    if (device) {
      if (device._interfaces instanceof Map && device._interfaces.size > 0) {
        [...device._interfaces.values()].forEach(push);
      }
      if (device._ports instanceof Map && device._ports.size > 0) {
        [...device._ports.values()].forEach(push);
      }
      if (Array.isArray(device.interfaces) && device.interfaces.length > 0) {
        device.interfaces.forEach(push);
      }
    }

    if (rawList.length === 0) {
      return FALLBACK_INTERFACES.map(normaliseInterface).filter(Boolean);
    }

    const connMap  = new Map();
    const deviceId = device?.id;
    if (deviceId && appState?.network) {
      const links   = appState.network.getAllLinks?.()   ?? appState.network.links   ?? [];
      const devices = appState.network.getAllDevices?.() ?? appState.network.devices ?? [];

      const resolveDevice = (id) => devices.find(d => d.id === id);

      for (const link of links) {
        const srcId   = link.sourcePort?.id ?? "";
        const tgtId   = link.targetPort?.id ?? "";
        const [srcDev, srcPort] = srcId.split("::");
        const [tgtDev, tgtPort] = tgtId.split("::");

        if (srcDev === deviceId && srcPort) {
          const peer     = resolveDevice(tgtDev);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? tgtDev ?? "Unknown";
          connMap.set(srcPort, { deviceName: peerName, portName: tgtPort ?? "" });
        }
        if (tgtDev === deviceId && tgtPort) {
          const peer     = resolveDevice(srcDev);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? srcDev ?? "Unknown";
          connMap.set(tgtPort, { deviceName: peerName, portName: srcPort ?? "" });
        }

        if (link.sourceId === deviceId && link.sourcePort && typeof link.sourcePort === "string") {
          const peer     = resolveDevice(link.targetId);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? link.targetId ?? "Unknown";
          connMap.set(link.sourcePort, { deviceName: peerName, portName: link.targetPort ?? "" });
        }
        if (link.targetId === deviceId && link.targetPort && typeof link.targetPort === "string") {
          const peer     = resolveDevice(link.sourceId);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? link.sourceId ?? "Unknown";
          connMap.set(link.targetPort, { deviceName: peerName, portName: link.sourcePort ?? "" });
        }
      }
    }

    return rawList
      .map((raw, idx) => {
        const norm = normaliseInterface(raw, idx);
        if (!norm) return null;
        const conn     = connMap.get(norm.name) ?? connMap.get(norm.id) ?? null;
        const occupied = raw.isOccupied === true;
        return {
          ...norm,
          isConnected: conn !== null || occupied,
          connectedTo: conn,
          isUp: norm.isUp !== null ? norm.isUp : (conn !== null || occupied ? true : null),
        };
      })
      .filter(Boolean);
  }, [device]);

  const deviceId = device?.id ?? null;

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
            {/* IPv4 tab */}
            <button
              className={`nav-item ${activeTab === "ipv4" ? "active" : ""}`}
              onClick={() => setActiveTab("ipv4")}
            >
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text">
                <strong>IPv4</strong>
                <p>IP, mask &amp; gateway</p>
              </div>
            </button>

            {/* IPv6 tab */}
            <button
              className={`nav-item ${activeTab === "ipv6" ? "active" : ""}`}
              onClick={() => setActiveTab("ipv6")}
            >
              <div className="nav-icon"><Globe size={16} /></div>
              <div className="nav-text">
                <strong>IPv6</strong>
                <p>Address &amp; prefix</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>
              {activeTab === "ipv4" ? "IPv4 INTERFACE SETTINGS" : "IPv6 INTERFACE SETTINGS"}
            </h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            <div className="iface-list-group">
              <p className="iface-section-label">
                {deviceName} — {interfaces.length} Interface{interfaces.length !== 1 ? "s" : ""}
              </p>
              <p className="iface-hint">
                {activeTab === "ipv4"
                  ? "Select an interface to configure its IPv4 network parameters."
                  : "Select an interface to configure its IPv6 address and prefix length."}
              </p>

              <div className="iface-list">
                {activeTab === "ipv4"
                  ? interfaces.map((iface) => (
                      <InterfaceRowIPv4
                        key={iface.id}
                        iface={iface}
                        deviceId={deviceId}
                        deviceName={deviceName}
                        deviceLocation={deviceLocation}
                      />
                    ))
                  : interfaces.map((iface) => (
                      <InterfaceRowIPv6
                        key={iface.id}
                        iface={iface}
                        deviceId={deviceId}
                        deviceName={deviceName}
                        deviceLocation={deviceLocation}
                      />
                    ))
                }
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