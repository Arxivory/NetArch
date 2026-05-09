import { useState, useEffect, useRef } from "react";
import ConsolePanel from "./ConsolePanel";
import SimulationPanel from "./SimulationPanel";
import SwitchPanel from "./SwitchPanel";

export default function ConsoleSimulationLogs() {
  const [activeTab, setActiveTab] = useState("console");

  // ── Console log state (lifted so it survives tab switches) ─────────────────
  const [logData, setLogData] = useState([]);

  // ── Simulation log state (lifted so it survives tab switches) ──────────────
  const [simLogData, setSimLogData] = useState([]);

  // Keep a ref so the simulate handler always sees fresh logData
  const logDataRef = useRef(logData);
  useEffect(() => {
    logDataRef.current = logData;
  }, [logData]);

  // ── Listen for console log events ──────────────────────────────────────────
  useEffect(() => {
    const handleNewLog = (event) => {
      const { device, deviceName, message, location } = event.detail;
      const now = new Date();

      const newEntry = {
        id:         now.getTime() + Math.random(),
        device:     device     || "System",
        deviceName: deviceName || "Unknown Device",
        message:    message    || "No message provided",
        time:       now.toLocaleTimeString([], {
                      hour:   "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }),
        date:       now.toLocaleDateString("en-GB"),
        location:   location || "Unspecified",
      };

      setLogData((prev) => [newEntry, ...prev]);
    };

    window.addEventListener("add-system-log", handleNewLog);
    return () => window.removeEventListener("add-system-log", handleNewLog);
  }, []);

  // ── Listen for packet transmission events (simulation logs) ────────────────
  useEffect(() => {
    const handlePacketEvent = (event) => {
      const { srcDevice, dstDevice, nextDevice, packet, viaLink, packetId } = event.detail || {};

      const src = srcDevice;
      const dst = dstDevice || nextDevice;
      if (!src || !dst) return;

      const now = new Date();

      // ── Derive readable names ──────────────────────────────────────────────
      const srcName = src.hostname || src.label || src.id || "Unknown";
      const dstName = dst.hostname || dst.label || dst.id || "Unknown";

      // ── Derive device type label (Device column) ───────────────────────────
      const srcType =
        src.type
          ? src.type.charAt(0).toUpperCase() + src.type.slice(1)   // e.g. "Switch", "Router"
          : "Device";

      // ── Packet type → "ARP" | "ICMP" | "IP" | … ──────────────────────────
      const pktType =
        packet?.etherType === 0x0806
          ? "ARP"
          : packet?.payload?.protocol?.toUpperCase?.() ||
            packet?.type?.toUpperCase?.() ||
            "IP";

      // ── Source column: "srcName → dstName  (type, latency)" ───────────────
      const latencyMs = viaLink?.latencyMs != null ? `${viaLink.latencyMs} ms` : null;
      const sourceStr = `${srcName} → ${dstName}${latencyMs ? `  ·  ${latencyMs}` : ""}`;

      // ── Status: derive from packet / link state ────────────────────────────
      const linkStatus = viaLink?.status ?? "up";
      const status =
        linkStatus === "up" || linkStatus === "active" ? "Sent" : "Failed";

      // ── Message: human-readable summary ───────────────────────────────────
      const srcIP = packet?.payload?.srcIP || src.interfaces?.[0]?.ipv4?.address || "";
      const dstIP = packet?.payload?.dstIP || dst.interfaces?.[0]?.ipv4?.address || "";
      const ipPart =
        srcIP && dstIP ? ` (${srcIP} → ${dstIP})` :
        srcIP          ? ` from ${srcIP}`          : "";
      const message = `${pktType} packet${ipPart} via ${viaLink?.id || "link"}`;

      const newEntry = {
        id:         `sim-${now.getTime()}-${Math.random()}`,
        packetId:   packetId || null,
        // ── Columns that SimulationPanel renders ───────────────────────────
        device:     srcType,          // "Device" column  → device type
        deviceName: srcName,          // "Name"   column  → hostname
        message,                      // "Message" column → packet summary
        source:     sourceStr,        // "Source"  column → src→dst + latency
        status,                       // "Status"  column → Sent / Failed
        // ── Extra detail fields (used by MailModal) ────────────────────────
        srcMAC:     packet?.srcMAC || src.interfaces?.[0]?.macAddress || "",
        dstMAC:     packet?.dstMAC || dst.interfaces?.[0]?.macAddress || "",
        srcIP,
        dstIP,
        time: now.toLocaleTimeString([], {
          hour:   "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        date: now.toLocaleDateString("en-GB"),
      };

      setSimLogData((prev) => [newEntry, ...prev]);

      // ── Fire canvas animation: mail travels along the cable ───────────────
      // The Canvas layer listens for "animatePacketOnLink" and renders an
      // envelope SVG moving from sourcePort → targetPort along the link.
      window.dispatchEvent(
        new CustomEvent("animatePacketOnLink", {
          detail: {
            linkId:      viaLink?.id   ?? null,
            srcDeviceId: src.id        ?? null,
            dstDeviceId: (dst.id       ?? null),
            packetType:  pktType,
            durationMs:  Math.max(600, (viaLink?.latencyMs ?? 1) * 40),
          },
        })
      );
    };

    window.addEventListener("packetTransmissionScheduled", handlePacketEvent);
    return () => window.removeEventListener("packetTransmissionScheduled", handlePacketEvent);
  }, []);

  // ── Listen for simulate-network event ──────────────────────────────────────
  // When fired:
  //   1. Snapshot ALL current console activity into simulation logs
  //   2. Auto-switch tab to "simulation"
  useEffect(() => {
    const handleSimulate = (event) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], {
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = now.toLocaleDateString("en-GB");

      // Convert every console log entry into a simulation log entry
      const snapshotEntries = logDataRef.current.map((log) => ({
        id:         `sim-snap-${log.id}-${Math.random()}`,
        packetId:   null,
        // Column mapping → matches SimulationPanel's Device/Name/Message/Source/Status
        device:     log.device     || "System",      // "Device"  column
        deviceName: log.deviceName || "Unknown",     // "Name"    column
        message:    log.message    || "",             // "Message" column
        source:     log.location   || "Unspecified", // "Source"  column
        status:     "CONFIG",                         // "Status"  column
        time:       log.time || timestamp,
        date:       log.date || dateStr,
        isConfig:   true,
      }));

      if (snapshotEntries.length > 0) {
        // Add a separator entry to mark the simulation run boundary
        const separator = {
          id:         `sim-sep-${now.getTime()}`,
          isSeparator: true,
          time:        timestamp,
          date:        dateStr,
        };
        setSimLogData((prev) => [separator, ...snapshotEntries, ...prev]);
      }

      // Auto-switch to simulation tab
      setActiveTab("simulation");
    };

    window.addEventListener("simulate-network", handleSimulate);
    return () => window.removeEventListener("simulate-network", handleSimulate);
  }, []);

  return (
    <div className="console-simulation-logs">
      <SwitchPanel activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="panel">
        {activeTab === "console" ? (
          <ConsolePanel logData={logData} setLogData={setLogData} />
        ) : (
          <SimulationPanel simLogData={simLogData} setSimLogData={setSimLogData} />
        )}
      </div>
    </div>
  );
}