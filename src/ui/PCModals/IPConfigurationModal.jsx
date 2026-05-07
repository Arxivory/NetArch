import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import appState from "../../state/AppState";

// ─── Dispatch helper (mirrors PropertiesContext pattern) ──────────────────────
function dispatchLog(deviceName, message, location = "Unknown") {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "PC", deviceName, message, location },
    })
  );
}

// ─── Generate EUI-64 link-local from interface name (deterministic per iface) ─
function generateLinkLocal(ifaceName) {
  const seed = [...(ifaceName || "eth0")].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hex  = (n, pad = 2) => (n & 0xff).toString(16).padStart(pad, "0").toUpperCase();
  return `FE80::${hex((seed >> 8) & 0xff)}${hex(seed & 0xff)}:${hex((seed * 3) & 0xff)}FF:FE${hex((seed * 7) & 0xff)}:${hex((seed * 13) & 0xff)}${hex((seed * 17) & 0xff)}`;
}

// ─── Derive interface list from a device object ───────────────────────────────
function resolveInterfaces(device) {
  if (!device) return [{ id: "default", name: "FastEthernet0" }];

  // Device class instance: has _interfaces Map
  if (device._interfaces instanceof Map && device._interfaces.size > 0) {
    return [...device._interfaces.values()].map((iface) => ({
      id:   iface.name || iface.id,
      name: iface.name,
      ipv4: iface.ipv4 || {},
    }));
  }

  // Plain array from NetworkStore
  if (Array.isArray(device.interfaces) && device.interfaces.length > 0) {
    return device.interfaces.map((i, idx) => ({
      id:   i.id   || i.name || `iface-${idx}`,
      name: i.name || i.label || `Interface${idx}`,
      ipv4: i.ipv4 || {},
    }));
  }

  // Fallback
  return [{ id: "fa0", name: "FastEthernet0", ipv4: {} }];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function IPConfigurationModal({
  onClose,
  device,
  deviceName   = "PC",
  deviceLocation = "Unknown",
}) {
  const interfaces = resolveInterfaces(device);

  // ── Selected interface ──────────────────────────────────────────────────────
  const [selectedIfaceId, setSelectedIfaceId] = useState(interfaces[0]?.id ?? "fa0");
  const selectedIface = interfaces.find((i) => i.id === selectedIfaceId) || interfaces[0];

  // ── IPv4 state ──────────────────────────────────────────────────────────────
  const [ipv4Mode,   setIpv4Mode]   = useState("static"); // "dhcp" | "static"
  const [ipv4Addr,   setIpv4Addr]   = useState("");
  const [subnetMask, setSubnetMask] = useState("");
  const [gateway4,   setGateway4]   = useState("");
  const [dns4,       setDns4]       = useState("");

  // ── IPv6 state ──────────────────────────────────────────────────────────────
  const [ipv6Mode,   setIpv6Mode]   = useState("static"); // "auto" | "static"
  const [ipv6Addr,   setIpv6Addr]   = useState("");
  const [ipv6Prefix, setIpv6Prefix] = useState("");
  const [gateway6,   setGateway6]   = useState("");
  const [dns6,       setDns6]       = useState("");
  const [linkLocal,  setLinkLocal]  = useState("");

  // ── Reset fields when interface changes ────────────────────────────────────
  useEffect(() => {
    const iface = interfaces.find((i) => i.id === selectedIfaceId) || interfaces[0];
    // Always start empty per spec (no prior user activity)
    setIpv4Addr("");
    setSubnetMask("");
    setGateway4("");
    setDns4("");
    setIpv6Addr("");
    setIpv6Prefix("");
    setGateway6("");
    setDns6("");
    setIpv4Mode("static");
    setIpv6Mode("static");
    setLinkLocal(generateLinkLocal(iface?.name));
  }, [selectedIfaceId]);

  // ── Debounce refs for console logging ──────────────────────────────────────
  const timers = useRef({});
  const originals = useRef({});

  const scheduleLog = (field, newVal, getOldVal, tag, makeMsg) => {
    if (!timers.current[field]) originals.current[field] = getOldVal();
    clearTimeout(timers.current[field]);
    timers.current[field] = setTimeout(() => {
      const oldVal = originals.current[field];
      if (oldVal !== newVal && newVal !== "") {
        const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
        dispatchLog(deviceName, makeMsg(ts, oldVal, newVal), deviceLocation);
        originals.current[field] = newVal;
      }
      delete timers.current[field];
    }, 1000);
  };

  // ── Logging helpers ─────────────────────────────────────────────────────────
  const onIpv4Change = (val) => {
    setIpv4Addr(val);
    scheduleLog("ipv4addr", val, () => ipv4Addr,
      "SYS-5-IP_CHANGE",
      (ts, o, n) =>
        `%SYS-5-IP_CHANGE: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `IPv4 Address updated: ${o || "unset"} → ${n}. ` +
        `ARP cache cleared for ${selectedIface?.name || "interface"}.`
    );
  };

  const onMaskChange = (val) => {
    setSubnetMask(val);
    scheduleLog("subnet", val, () => subnetMask,
      "SYS-6-SUBNET_CHANGE",
      (ts, o, n) =>
        `%SYS-6-SUBNET_CHANGE: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `Subnet Mask updated: ${o || "unset"} → ${n}. Network boundary recalculated.`
    );
  };

  const onGateway4Change = (val) => {
    setGateway4(val);
    scheduleLog("gw4", val, () => gateway4,
      "SYS-6-CONFIG",
      (ts, o, n) =>
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `Default Gateway updated: ${o || "unset"} → ${n}.`
    );
  };

  const onDns4Change = (val) => {
    setDns4(val);
    scheduleLog("dns4", val, () => dns4,
      "SYS-6-CONFIG",
      (ts, o, n) =>
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `DNS Server updated: ${o || "unset"} → ${n}.`
    );
  };

  const onIpv6Change = (val) => {
    setIpv6Addr(val);
    scheduleLog("ipv6addr", val, () => ipv6Addr,
      "SYS-5-IP_CHANGE",
      (ts, o, n) =>
        `%SYS-5-IP_CHANGE: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `IPv6 Address updated: ${o || "unset"} → ${n}.`
    );
  };

  const onPrefixChange = (val) => {
    setIpv6Prefix(val);
    scheduleLog("prefix6", val, () => ipv6Prefix,
      "SYS-6-CONFIG",
      (ts, o, n) =>
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `IPv6 Prefix Length updated: ${o || "unset"} → ${n}.`
    );
  };

  const onGateway6Change = (val) => {
    setGateway6(val);
    scheduleLog("gw6", val, () => gateway6,
      "SYS-6-CONFIG",
      (ts, o, n) =>
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `IPv6 Default Gateway updated: ${o || "unset"} → ${n}.`
    );
  };

  const onDns6Change = (val) => {
    setDns6(val);
    scheduleLog("dns6", val, () => dns6,
      "SYS-6-CONFIG",
      (ts, o, n) =>
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
        `IPv6 DNS Server updated: ${o || "unset"} → ${n}.`
    );
  };

  // ── DHCP / Auto mode toggle logging ────────────────────────────────────────
  const handleIpv4ModeChange = (mode) => {
    setIpv4Mode(mode);
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
    if (mode === "dhcp") {
      dispatchLog(
        deviceName,
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
          `IPv4 mode switched to DHCP on ${selectedIface?.name}. Requesting address from DHCP server.`,
        deviceLocation
      );
      // Clear static fields
      setIpv4Addr(""); setSubnetMask(""); setGateway4(""); setDns4("");
    } else {
      dispatchLog(
        deviceName,
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
          `IPv4 mode switched to Static on ${selectedIface?.name}.`,
        deviceLocation
      );
    }
  };

  const handleIpv6ModeChange = (mode) => {
    setIpv6Mode(mode);
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
    if (mode === "auto") {
      dispatchLog(
        deviceName,
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
          `IPv6 mode switched to Automatic (SLAAC) on ${selectedIface?.name}.`,
        deviceLocation
      );
      setIpv6Addr(""); setIpv6Prefix(""); setGateway6(""); setDns6("");
    } else {
      dispatchLog(
        deviceName,
        `%SYS-6-CONFIG: [${ts}] ${deviceName} @ ${deviceLocation} — ` +
          `IPv6 mode switched to Static on ${selectedIface?.name}.`,
        deviceLocation
      );
    }
  };

  // ── Styles (Packet Tracer aesthetic: light grey system UI) ─────────────────
  const S = {
    overlay: {
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    },
    modal: {
      width: 640, maxHeight: "90vh", overflowY: "auto",
      background: "#d4d0c8",
      border: "2px solid #808080",
      boxShadow: "4px 4px 0 #000",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: 13,
      color: "#000",
    },
    titleBar: {
      background: "linear-gradient(to right, #0a246a, #a6b5d7)",
      color: "#fff",
      padding: "4px 8px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontWeight: "bold", fontSize: 13,
      userSelect: "none",
    },
    closeBtn: {
      background: "#c0392b", color: "#fff",
      border: "1px solid #7f0000",
      width: 18, height: 18,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", fontSize: 11, fontWeight: "bold",
      lineHeight: 1,
    },
    body: { padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 },
    row: { display: "flex", alignItems: "center", gap: 8 },
    label: { width: 130, flexShrink: 0, color: "#000" },
    input: {
      flex: 1, height: 22, padding: "0 4px",
      border: "1px solid #7a7a7a",
      background: "#fff",
      fontFamily: "inherit", fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
    },
    inputDisabled: {
      flex: 1, height: 22, padding: "0 4px",
      border: "1px solid #7a7a7a",
      background: "#e8e8e8",
      fontFamily: "inherit", fontSize: 13,
      color: "#444",
      boxSizing: "border-box",
    },
    select: {
      flex: 1, height: 24, padding: "0 4px",
      border: "1px solid #7a7a7a",
      background: "#fff",
      fontFamily: "inherit", fontSize: 13,
      cursor: "pointer",
    },
    sectionTitle: {
      background: "#c0c0c0",
      borderTop: "1px solid #808080",
      borderBottom: "1px solid #808080",
      padding: "3px 6px",
      fontWeight: "bold",
      marginBottom: 6,
    },
    radioGroup: { display: "flex", gap: 24, alignItems: "center", marginBottom: 6 },
    radio: { display: "flex", alignItems: "center", gap: 4, cursor: "pointer" },
    separator: { borderTop: "1px solid #808080", margin: "6px 0" },
    ipv6Row: { display: "flex", alignItems: "center", gap: 4 },
    slash: { fontWeight: "bold", fontSize: 14, color: "#444" },
    prefixInput: {
      width: 50, height: 22, padding: "0 4px",
      border: "1px solid #7a7a7a",
      background: "#fff",
      fontFamily: "inherit", fontSize: 13,
      outline: "none",
      textAlign: "center",
    },
  };

  const isIpv4Static = ipv4Mode === "static";
  const isIpv6Static = ipv6Mode === "static";

  return createPortal(
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* Title bar */}
        <div style={S.titleBar}>
          <span>IP Configuration</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          {/* Interface selector */}
          <div style={S.row}>
            <span style={S.label}>Interface</span>
            <select
              style={S.select}
              value={selectedIfaceId}
              onChange={(e) => setSelectedIfaceId(e.target.value)}
            >
              {interfaces.map((iface) => (
                <option key={iface.id} value={iface.id}>{iface.name}</option>
              ))}
            </select>
          </div>

          <div style={S.separator} />

          {/* ── IPv4 Configuration ──────────────────────────────────────── */}
          <div style={S.sectionTitle}>IP Configuration</div>

          <div style={S.radioGroup}>
            <label style={S.radio}>
              <input
                type="radio" name="ipv4mode" value="dhcp"
                checked={ipv4Mode === "dhcp"}
                onChange={() => handleIpv4ModeChange("dhcp")}
              />
              DHCP
            </label>
            <label style={S.radio}>
              <input
                type="radio" name="ipv4mode" value="static"
                checked={ipv4Mode === "static"}
                onChange={() => handleIpv4ModeChange("static")}
              />
              Static
            </label>
          </div>

          <div style={S.row}>
            <span style={S.label}>IPv4 Address</span>
            <input
              style={isIpv4Static ? S.input : S.inputDisabled}
              value={ipv4Addr}
              disabled={!isIpv4Static}
              placeholder={isIpv4Static ? "" : "Assigned by DHCP"}
              onChange={(e) => onIpv4Change(e.target.value)}
            />
          </div>

          <div style={S.row}>
            <span style={S.label}>Subnet Mask</span>
            <input
              style={isIpv4Static ? S.input : S.inputDisabled}
              value={subnetMask}
              disabled={!isIpv4Static}
              placeholder={isIpv4Static ? "" : "Assigned by DHCP"}
              onChange={(e) => onMaskChange(e.target.value)}
            />
          </div>

          <div style={S.row}>
            <span style={S.label}>Default Gateway</span>
            <input
              style={S.input}
              value={gateway4}
              placeholder=""
              onChange={(e) => onGateway4Change(e.target.value)}
            />
          </div>

          <div style={S.row}>
            <span style={S.label}>DNS Server</span>
            <input
              style={S.input}
              value={dns4}
              placeholder=""
              onChange={(e) => onDns4Change(e.target.value)}
            />
          </div>

          <div style={S.separator} />

          {/* ── IPv6 Configuration ──────────────────────────────────────── */}
          <div style={S.sectionTitle}>IPv6 Configuration</div>

          <div style={S.radioGroup}>
            <label style={S.radio}>
              <input
                type="radio" name="ipv6mode" value="auto"
                checked={ipv6Mode === "auto"}
                onChange={() => handleIpv6ModeChange("auto")}
              />
              Automatic
            </label>
            <label style={S.radio}>
              <input
                type="radio" name="ipv6mode" value="static"
                checked={ipv6Mode === "static"}
                onChange={() => handleIpv6ModeChange("static")}
              />
              Static
            </label>
          </div>

          {/* IPv6 Address + prefix length side by side */}
          <div style={S.row}>
            <span style={S.label}>IPv6 Address</span>
            <div style={{ ...S.ipv6Row, flex: 1 }}>
              <input
                style={{
                  ...(isIpv6Static ? S.input : S.inputDisabled),
                  flex: 1,
                }}
                value={ipv6Addr}
                disabled={!isIpv6Static}
                placeholder={isIpv6Static ? "" : "SLAAC"}
                onChange={(e) => onIpv6Change(e.target.value)}
              />
              <span style={S.slash}>/</span>
              <input
                style={{
                  ...S.prefixInput,
                  background: isIpv6Static ? "#fff" : "#e8e8e8",
                  color: isIpv6Static ? "#000" : "#444",
                }}
                value={ipv6Prefix}
                disabled={!isIpv6Static}
                placeholder="64"
                onChange={(e) => onPrefixChange(e.target.value)}
              />
            </div>
          </div>

          <div style={S.row}>
            <span style={S.label}>Link Local Address</span>
            <input
              style={S.inputDisabled}
              value={linkLocal}
              readOnly
            />
          </div>

          <div style={S.row}>
            <span style={S.label}>Default Gateway</span>
            <input
              style={isIpv6Static ? S.input : S.inputDisabled}
              value={gateway6}
              disabled={!isIpv6Static}
              onChange={(e) => onGateway6Change(e.target.value)}
            />
          </div>

          <div style={S.row}>
            <span style={S.label}>DNS Server</span>
            <input
              style={isIpv6Static ? S.input : S.inputDisabled}
              value={dns6}
              disabled={!isIpv6Static}
              onChange={(e) => onDns6Change(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}