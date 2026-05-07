import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Network, ChevronDown, ChevronRight, Layers } from "lucide-react";
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

  // Support both Device.js Interface instances and plain JS objects
  const id   = raw.id   ?? raw.name ?? `iface-${index}`;
  const name = raw.name ?? raw.label ?? raw.id ?? `Interface ${index}`;
  const desc = raw.description ?? raw.desc ?? "";

  // IP — accept both class instances (ipv4.address) and plain objects
  const address    = raw.ipv4?.address    ?? raw.ipAddress  ?? raw.ip   ?? "";
  const subnetMask = raw.ipv4?.subnetMask ?? raw.subnetMask ?? raw.mask ?? "";

  // Operational status — Device.js exposes isUp / lineStatus
  const isUp =
    raw.isUp !== undefined ? raw.isUp :
    raw.status === "up"   ? true      : null;   // null = unknown

  // Connection info — populated by the modal's useMemo via link cross-reference
  const isConnected = raw.isConnected ?? false;
  const connectedTo = raw.connectedTo ?? null;  // { deviceName, portName }

  return { id, name, desc, address, subnetMask, isUp, isConnected, connectedTo };
}

// ---------------------------------------------------------------------------
// InterfaceRow
// ---------------------------------------------------------------------------
function InterfaceRow({ iface, deviceId, deviceName, deviceLocation }) {
  const [open,    setOpen]    = useState(false);
  const [ip,      setIp]      = useState(iface.address);
  const [mask,    setMask]    = useState(iface.subnetMask);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    // 1. Persist into NetworkStore so the data survives modal close
    if (deviceId && appState?.network) {
      const device = appState.network.getDevice(deviceId);
      if (device) {
        // Try the Device.js class method first, fall back to plain object mutation
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
            rawIface.ipv4 = {
              ...(rawIface.ipv4 ?? {}),
              address:    ip,
              subnetMask: mask,
            };
          }
        }

        // Trigger store notification so rest of app stays in sync
        appState.network.updateModified?.();
        appState.network.notify?.();
      }
    }

    // 2. Fire system log events (existing pattern)
    const logs = [];
    if (ip)   logs.push(`[Interface ${iface.name}] IP Address: ${ip}`);
    if (mask) logs.push(`[Interface ${iface.name}] Subnet Mask: ${mask}`);
    if (!logs.length) logs.push(`[Interface ${iface.name}] Applied — no parameters configured`);

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

  // Status dot colour
  const statusColor =
    iface.isUp === true  ? "#22c55e" :
    iface.isUp === false ? "#ef4444" : "#6b7280";

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
        <span
          title={iface.isUp === true ? "Up" : iface.isUp === false ? "Down" : "Status unknown"}
          style={{
            display:      "inline-block",
            width:        8,
            height:       8,
            borderRadius: "50%",
            background:   statusColor,
            marginRight:  6,
            flexShrink:   0,
          }}
        />
        <span className="iface-label">{iface.name}</span>
        {iface.desc && <span className="iface-desc">{iface.desc}</span>}
        {iface.isConnected && (
          <span className="iface-badge iface-badge--connected">connected</span>
        )}
        {isConfigured && <span className="iface-badge">configured</span>}
      </button>

      {/* ── Expanded config ── */}
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
// InterfaceModal
// ---------------------------------------------------------------------------
export default function InterfaceModal({
  onClose,
  deviceName     = "Router",
  deviceLocation = "Network",
  device         = null,          // ← the selectedEntity passed from PropertiesPanel
}) {
  // Derive the canonical interface list from the live device object.
  // Sources (merged, deduped by name):
  //   1. device._interfaces  (Device.js Map — logical, Layer 2/3)
  //   2. device._ports       (Device.js Map — physical, Layer 1)
  //   3. device.interfaces   (plain Array on serialised/store objects)
  //   4. FALLBACK_INTERFACES (sensible defaults when nothing is registered)
  //
  // Each interface is then annotated with live connectivity data from
  // appState.network.links so the "connected" badge reflects real topology.
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
      // Priority 1: Device.js _interfaces Map
      if (device._interfaces instanceof Map && device._interfaces.size > 0) {
        [...device._interfaces.values()].forEach(push);
      }

      // Priority 2: Device.js _ports Map (physical ports not already covered)
      if (device._ports instanceof Map && device._ports.size > 0) {
        [...device._ports.values()].forEach(push);
      }

      // Priority 3: plain interfaces array (serialised/store objects)
      if (Array.isArray(device.interfaces) && device.interfaces.length > 0) {
        device.interfaces.forEach(push);
      }
    }

    // Fallback when device has no registered interfaces or ports at all
    if (rawList.length === 0) {
      return FALLBACK_INTERFACES.map(normaliseInterface).filter(Boolean);
    }

    // Build a quick lookup: portName → { peerDeviceName, peerPortName }
    // Links in NetworkStore carry sourcePort/targetPort with id = "deviceId::portName"
    const connMap = new Map();
    const deviceId = device?.id;
    if (deviceId && appState?.network) {
      const links   = appState.network.getAllLinks?.() ?? appState.network.links ?? [];
      const devices = appState.network.getAllDevices?.() ?? appState.network.devices ?? [];

      const resolveDevice = (id) =>
        devices.find(d => d.id === id);

      for (const link of links) {
        // sourcePort.id format: "deviceId::portName"
        const srcId   = link.sourcePort?.id ?? "";
        const tgtId   = link.targetPort?.id ?? "";
        const [srcDev, srcPort] = srcId.split("::");
        const [tgtDev, tgtPort] = tgtId.split("::");

        if (srcDev === deviceId && srcPort) {
          const peer = resolveDevice(tgtDev);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? tgtDev ?? "Unknown";
          connMap.set(srcPort, { deviceName: peerName, portName: tgtPort ?? "" });
        }
        if (tgtDev === deviceId && tgtPort) {
          const peer = resolveDevice(srcDev);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? srcDev ?? "Unknown";
          connMap.set(tgtPort, { deviceName: peerName, portName: srcPort ?? "" });
        }

        // Also support plain sourceId/targetId + sourcePort/targetPort strings
        if (link.sourceId === deviceId && link.sourcePort && typeof link.sourcePort === "string") {
          const peer = resolveDevice(link.targetId);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? link.targetId ?? "Unknown";
          connMap.set(link.sourcePort, { deviceName: peerName, portName: link.targetPort ?? "" });
        }
        if (link.targetId === deviceId && link.targetPort && typeof link.targetPort === "string") {
          const peer = resolveDevice(link.sourceId);
          const peerName = peer?.hostname ?? peer?.label ?? peer?.name ?? link.sourceId ?? "Unknown";
          connMap.set(link.targetPort, { deviceName: peerName, portName: link.sourcePort ?? "" });
        }
      }
    }

    // Normalise and annotate with connectivity
    return rawList
      .map((raw, idx) => {
        const norm = normaliseInterface(raw, idx);
        if (!norm) return null;
        // Try matching by name, id, or short abbreviation
        const conn = connMap.get(norm.name) ?? connMap.get(norm.id) ?? null;
        // Also check port's own isOccupied flag (Device.js PhysicalPort)
        const occupied = raw.isOccupied === true;
        return {
          ...norm,
          isConnected: conn !== null || occupied,
          connectedTo: conn,
          // Upgrade isUp: if a link is present the line protocol is up
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
              <p className="iface-section-label">
                {deviceName} — {interfaces.length} Interface{interfaces.length !== 1 ? "s" : ""}
              </p>
              <p className="iface-hint">
                Select an interface to configure its network parameters.
              </p>

              <div className="iface-list">
                {interfaces.map((iface) => (
                  <InterfaceRow
                    key={iface.id}
                    iface={iface}
                    deviceId={deviceId}
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