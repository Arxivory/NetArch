import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import appState from "../../state/AppState";

// ─── Dispatch helper ──────────────────────────────────────────────────────────
function dispatchLog(deviceName, message, location = "Unknown") {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "PC", deviceName, message, location },
    })
  );
}

// ─── Tiny helper: format timestamp ───────────────────────────────────────────
const ts = () => new Date().toISOString().replace("T", " ").slice(0, 19);

// ─── Simulated ping output ────────────────────────────────────────────────────
function simulatePing(target, deviceName, location) {
  if (!target || target.trim() === "") {
    return ["Bad parameter", ""];
  }
  const trimmed = target.trim();

  // Very basic format validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  const hostnameRegex = /^[a-zA-Z0-9.-]+$/;

  const isValid = ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed) || hostnameRegex.test(trimmed);
  if (!isValid) {
    return [`Ping request could not find host ${trimmed}. Please check the name and try again.`, ""];
  }

  // Deterministic "success" based on last octet if IPv4
  let success = true;
  let timeMs  = [32, 28, 31, 29];

  if (ipv4Regex.test(trimmed)) {
    const lastOctet = parseInt(trimmed.split(".")[3], 10);
    success = lastOctet !== 0 && lastOctet !== 255;
    timeMs  = timeMs.map(t => t + (lastOctet % 10));
  }

  const lines = [
    ``,
    `Pinging ${trimmed} with 32 bytes of data:`,
  ];

  if (success) {
    for (let i = 0; i < 4; i++) {
      lines.push(`Reply from ${trimmed}: bytes=32 time=${timeMs[i]}ms TTL=128`);
    }
    lines.push(``);
    lines.push(`Ping statistics for ${trimmed}:`);
    lines.push(`    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
    lines.push(`Approximate round trip times in milli-seconds:`);
    lines.push(`    Minimum = ${Math.min(...timeMs)}ms, Maximum = ${Math.max(...timeMs)}ms, Average = ${Math.round(timeMs.reduce((a, b) => a + b, 0) / timeMs.length)}ms`);

    dispatchLog(
      deviceName,
      `%SYS-6-PING: [${ts()}] ${deviceName} @ ${location} — ` +
        `Ping to ${trimmed}: 4/4 packets received (0% loss). ` +
        `Avg RTT ${Math.round(timeMs.reduce((a, b) => a + b, 0) / timeMs.length)}ms.`,
      location
    );
  } else {
    for (let i = 0; i < 4; i++) {
      lines.push(`Request timeout for icmp_seq ${i}`);
    }
    lines.push(``);
    lines.push(`Ping statistics for ${trimmed}:`);
    lines.push(`    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),`);

    dispatchLog(
      deviceName,
      `%SYS-5-PING_FAIL: [${ts()}] ${deviceName} @ ${location} — ` +
        `Ping to ${trimmed}: 0/4 packets received (100% loss). Host unreachable.`,
      location
    );
  }

  lines.push(``);
  return lines;
}

// ─── Simulated tracert output ─────────────────────────────────────────────────
function simulateTracert(target, deviceName, location) {
  if (!target || target.trim() === "") return ["Bad parameter", ""];
  const trimmed = target.trim();
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

  const lines = [
    ``,
    `Tracing route to ${trimmed} over a maximum of 30 hops:`,
    ``,
  ];

  const hopCount = ipv4Regex.test(trimmed) ? 3 : 5;
  for (let i = 1; i <= hopCount; i++) {
    const ms1 = 5 + i * 3 + Math.floor(Math.random() * 4);
    const ms2 = ms1 + 1;
    const ms3 = ms1 + 2;
    const hopIp = ipv4Regex.test(trimmed)
      ? `10.0.${i}.1`
      : `2001:db8::${i}`;
    const isFinal = i === hopCount;
    lines.push(`  ${String(i).padStart(2)}  ${ms1} ms  ${ms2} ms  ${ms3} ms  ${isFinal ? trimmed : hopIp}`);
  }

  lines.push(``);
  lines.push(`Trace complete.`);
  lines.push(``);

  dispatchLog(
    deviceName,
    `%SYS-6-TRACERT: [${ts()}] ${deviceName} @ ${location} — ` +
      `Traceroute to ${trimmed} completed. ${hopCount} hops.`,
    location
  );

  return lines;
}

// ─── Simulated ipconfig output ────────────────────────────────────────────────
function simulateIpconfig(deviceName) {
  return [
    ``,
    `Windows IP Configuration`,
    ``,
    `Ethernet adapter FastEthernet0:`,
    ``,
    `   Connection-specific DNS Suffix  . :`,
    `   IPv4 Address. . . . . . . . . . . :`,
    `   Subnet Mask . . . . . . . . . . . :`,
    `   Default Gateway . . . . . . . . . :`,
    ``,
  ];
}

// ─── Known commands ───────────────────────────────────────────────────────────
const HELP_TEXT = [
  ``,
  `Available commands:`,
  `  ping <host>         Send ICMP echo requests`,
  `  tracert <host>      Trace route to destination`,
  `  ipconfig            Display IP configuration`,
  `  ipconfig /all       Display full IP configuration`,
  `  cls                 Clear the screen`,
  `  help                Show this help message`,
  ``,
];

function processCommand(raw, deviceName, location) {
  const line = raw.trim();
  const lower = line.toLowerCase();
  const parts = lower.split(/\s+/);
  const cmd   = parts[0];
  const arg   = parts.slice(1).join(" ");

  if (cmd === "" ) return [];
  if (cmd === "cls") return ["__CLEAR__"];
  if (cmd === "help" || cmd === "/?") return HELP_TEXT;

  if (cmd === "ping") {
    return simulatePing(arg, deviceName, location);
  }

  if (cmd === "tracert" || cmd === "traceroute") {
    return simulateTracert(arg, deviceName, location);
  }

  if (cmd === "ipconfig") {
    return simulateIpconfig(deviceName);
  }

  return [
    `'${cmd}' is not recognized as an internal or external command,`,
    `operable program or batch file.`,
    ``,
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CommandPromptModal({
  onClose,
  deviceName    = "PC",
  deviceLocation = "Unknown",
}) {
  const [lines,   setLines]   = useState([
    `Microsoft Windows [Version 10.0.19044]`,
    `(c) Microsoft Corporation. All rights reserved.`,
    ``,
  ]);
  const [input,   setInput]   = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const PROMPT = `C:\\Users\\${deviceName}>`;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const raw = input;
    const output = processCommand(raw, deviceName, deviceLocation);

    if (output[0] === "__CLEAR__") {
      setLines([]);
      setInput("");
      return;
    }

    setLines((prev) => [
      ...prev,
      `${PROMPT}${raw}`,
      ...output,
    ]);

    if (raw.trim()) {
      setHistory((prev) => [raw, ...prev]);
    }
    setHistIdx(-1);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(nextIdx);
      setInput(history[nextIdx] || "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.max(histIdx - 1, -1);
      setHistIdx(nextIdx);
      setInput(nextIdx === -1 ? "" : history[nextIdx] || "");
      return;
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    overlay: {
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    },
    modal: {
      width: 680, height: 440,
      display: "flex", flexDirection: "column",
      background: "#0c0c0c",
      border: "1px solid #555",
      boxShadow: "0 0 0 2px #000, 4px 4px 12px rgba(0,0,0,0.8)",
      fontFamily: "'Consolas', 'Lucida Console', monospace",
      fontSize: 13,
      color: "#c0c0c0",
      overflow: "hidden",
    },
    titleBar: {
      background: "#1e1e1e",
      borderBottom: "1px solid #333",
      padding: "5px 10px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      userSelect: "none",
      flexShrink: 0,
    },
    titleLeft: {
      display: "flex", alignItems: "center", gap: 8,
      color: "#c0c0c0", fontSize: 12,
    },
    titleIcon: { fontSize: 14, color: "#569cd6" },
    closeBtn: {
      background: "transparent", color: "#c0c0c0",
      border: "none", cursor: "pointer",
      fontSize: 14, padding: "0 4px",
      lineHeight: 1,
      transition: "color 0.15s",
    },
    terminalArea: {
      flex: 1, overflowY: "auto",
      padding: "8px 10px",
      background: "#0c0c0c",
      cursor: "text",
    },
    lineText: {
      margin: 0, padding: 0,
      lineHeight: "1.45",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
    },
    inputRow: {
      display: "flex", alignItems: "center",
      background: "#0c0c0c",
      padding: "0 10px 10px",
      flexShrink: 0,
      gap: 0,
    },
    promptSpan: {
      color: "#c0c0c0", whiteSpace: "nowrap",
      lineHeight: "1.45",
    },
    termInput: {
      flex: 1,
      background: "transparent",
      border: "none", outline: "none",
      color: "#c0c0c0",
      fontFamily: "'Consolas', 'Lucida Console', monospace",
      fontSize: 13,
      caretColor: "#c0c0c0",
      lineHeight: "1.45",
      padding: 0, margin: 0,
    },
  };

  return createPortal(
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* Title bar */}
        <div style={S.titleBar}>
          <div style={S.titleLeft}>
            <span style={S.titleIcon}>⬛</span>
            <span>Command Prompt — {deviceName}</span>
          </div>
          <button
            style={S.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#c0c0c0")}
          >
            ✕
          </button>
        </div>

        {/* Output area */}
        <div
          style={S.terminalArea}
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line, i) => (
            <p key={i} style={S.lineText}>{line || "\u00A0"}</p>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div style={S.inputRow}>
          <span style={S.promptSpan}>{PROMPT}</span>
          <input
            ref={inputRef}
            style={S.termInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}