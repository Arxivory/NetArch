import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Server, Network, ArrowDown, Lock, Activity } from "lucide-react";

// ── Req #3: Persistent state survives close/reopen ────────────────────────────
let persistentDHCPState = null;

const defaultState = {
  dhcpScope:         "basic",
  // Basic
  gateway:           "",
  subnetMask:        "",
  dnsServer:         "",
  dhcpEnabled:       true,
  // Pool
  startIP:           "",
  endIP:             "",
  leaseTime:         "Select",
  conflictHandling:  "Select",
  // Reservations
  reservations: [
    { device: "", mac: "", ip: "", status: "Active" },
    { device: "", mac: "", ip: "", status: "Active" },
    { device: "", mac: "", ip: "", status: "Active" },
  ],
  // Advanced
  domainName:        "",
  ntpServer:         "",
  dhcpRelay:         "",
  dnsUpdateMode:     "Select",
  authoritative:     true,
  conflictDetection: false,
  systemLogging:     false,
  auditTrail:        false,
};

function dispatchLog(deviceName, deviceLocation, message) {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "Router", deviceName, message, location: deviceLocation, italic: true },
    })
  );
}

export default function DHCPModal({ onClose, deviceName = "Router-Core-01", deviceLocation = "Data Center" }) {
  // ── Req #3: Load from persistent store or defaults ────────────────────────
  const [formData, setFormData] = useState(persistentDHCPState || defaultState);

  // ── Req #6: Track previous state for change detection ─────────────────────
  const prevData = useRef(persistentDHCPState || defaultState);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateReservation = (index, field, value) => {
    const next = [...formData.reservations];
    next[index] = { ...next[index], [field]: value };
    handleChange("reservations", next);
  };

  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

  // ── Req #1 + #5 + #6: Enterprise-style apply logging ─────────────────────
  const handleApply = () => {
    const prev = prevData.current;
    const logs = [];
    const ts   = now();

    // ── Service state ──────────────────────────────────────────────────────
    if (formData.dhcpEnabled !== prev.dhcpEnabled) {
      logs.push(
        formData.dhcpEnabled
          ? `%DHCP-5-SERVICE_ENABLED: [${ts}] ${deviceName} @ ${deviceLocation} — DHCP server process STARTED. ` +
            `Service is now accepting DISCOVER packets on all routed interfaces. ` +
            `Ensure scope and pool are correctly configured before client deployment.`
          : `%DHCP-5-SERVICE_DISABLED: [${ts}] ${deviceName} @ ${deviceLocation} — DHCP server process STOPPED. ` +
            `All pending OFFER and ACK transactions cancelled. ` +
            `Clients will no longer receive automatic IP assignments from this device.`
      );
    }

    // ── Basic scope ────────────────────────────────────────────────────────
    if (formData.gateway && formData.gateway !== prev.gateway) {
      logs.push(
        `%DHCP-5-GATEWAY_MODIFY: [${ts}] ${deviceName} — Default Gateway (Option 3) updated ` +
        `from ${prev.gateway || "unset"} → ${formData.gateway}. ` +
        `All subsequent DHCP ACK messages will advertise the new gateway to clients. ` +
        `Existing leases are not renewed automatically; clients must renew or rebind.`
      );
    } else if (formData.gateway && formData.gateway === prev.gateway) {
      logs.push(
        `%DHCP-6-GATEWAY_CONFIRM: [${ts}] ${deviceName} — Default Gateway confirmed: ${formData.gateway}. ` +
        `Option 3 will be included in all DHCP ACK responses.`
      );
    }

    if (formData.subnetMask && formData.subnetMask !== prev.subnetMask) {
      logs.push(
        `%DHCP-5-SUBNET_MODIFY: [${ts}] ${deviceName} — Subnet Mask (Option 1) changed ` +
        `from ${prev.subnetMask || "unset"} → ${formData.subnetMask}. ` +
        `Network boundary re-calculated; verify that pool range falls within new subnet.`
      );
    }

    if (formData.dnsServer && formData.dnsServer !== prev.dnsServer) {
      logs.push(
        `%DHCP-5-DNS_MODIFY: [${ts}] ${deviceName} — DNS Server (Option 6) updated ` +
        `from ${prev.dnsServer || "unset"} → ${formData.dnsServer}. ` +
        `Clients will receive the new resolver address on next DHCP renewal cycle.`
      );
    }

    // ── Pool ───────────────────────────────────────────────────────────────
    if (formData.startIP || formData.endIP) {
      const poolChanged =
        formData.startIP !== prev.startIP || formData.endIP !== prev.endIP;
      logs.push(
        poolChanged
          ? `%DHCP-5-POOL_MODIFY: [${ts}] ${deviceName} — IP address pool updated. ` +
            `Previous range: ${prev.startIP || "—"} – ${prev.endIP || "—"} | ` +
            `New range: ${formData.startIP} – ${formData.endIP}. ` +
            `Allocation engine recalculated; total available addresses updated in binding table.`
          : `%DHCP-6-POOL_INSTALL: [${ts}] ${deviceName} — Address pool committed. ` +
            `Allocation range: ${formData.startIP} – ${formData.endIP}. ` +
            `Pool is ready to serve client DISCOVER requests.`
      );
    }

    if (formData.leaseTime !== "Select" && formData.leaseTime !== prev.leaseTime) {
      logs.push(
        `%DHCP-6-LEASE_MODIFY: [${ts}] ${deviceName} — Lease duration (Option 51) changed ` +
        `from ${prev.leaseTime === "Select" ? "unset" : prev.leaseTime} → ${formData.leaseTime}. ` +
        `New leases will honour the updated TTL; active bindings retain their original expiry.`
      );
    }

    if (formData.conflictHandling !== "Select" && formData.conflictHandling !== prev.conflictHandling) {
      logs.push(
        `%DHCP-5-CONFLICT_POLICY_MOD: [${ts}] ${deviceName} — Address-conflict handling policy changed ` +
        `from "${prev.conflictHandling === "Select" ? "unset" : prev.conflictHandling}" → "${formData.conflictHandling}". ` +
        `PING-probe and ARP-check behaviour updated accordingly.`
      );
    }

    // ── Static Bindings ────────────────────────────────────────────────────
    formData.reservations.forEach((r, i) => {
      if (!r.mac || !r.ip) return;
      const prev_r = (prev.reservations || [])[i] || {};
      const changed = r.mac !== prev_r.mac || r.ip !== prev_r.ip || r.status !== prev_r.status;
      logs.push(
        changed
          ? `%DHCP-5-BINDING_MODIFY: [${ts}] ${deviceName} — Static binding #${i + 1} updated. ` +
            `Host: ${r.device || "unnamed"} | MAC: ${r.mac} → reserved IP: ${r.ip} (${r.status}). ` +
            `Previous binding removed from host table; new entry active immediately.`
          : `%DHCP-6-BINDING_INSTALL: [${ts}] ${deviceName} — Static DHCP binding committed. ` +
            `Host: ${r.device || "unnamed"} | MAC ${r.mac} permanently mapped to ${r.ip}. ` +
            `Entry marked ${r.status} in the binding table.`
      );
    });

    // ── Advanced / Relay ───────────────────────────────────────────────────
    if (formData.dhcpRelay && formData.dhcpRelay !== prev.dhcpRelay) {
      logs.push(
        `%DHCP-5-RELAY_MODIFY: [${ts}] ${deviceName} — DHCP Relay (ip helper-address) changed ` +
        `from ${prev.dhcpRelay || "unset"} → ${formData.dhcpRelay}. ` +
        `Broadcast DISCOVER packets from connected clients will now be forwarded to the new relay target.`
      );
    } else if (formData.dhcpRelay && formData.dhcpRelay === prev.dhcpRelay) {
      logs.push(
        `%DHCP-6-RELAY_CONFIRM: [${ts}] ${deviceName} — DHCP relay helper-address confirmed: ${formData.dhcpRelay}. ` +
        `Inter-VLAN DHCP forwarding is active.`
      );
    }

    if (formData.domainName && formData.domainName !== prev.domainName) {
      logs.push(
        `%DHCP-6-DOMAIN_MODIFY: [${ts}] ${deviceName} — Domain Name (Option 15) updated ` +
        `from "${prev.domainName || "unset"}" → "${formData.domainName}". ` +
        `Clients will append this suffix during DNS resolution on next lease renewal.`
      );
    }

    if (formData.ntpServer && formData.ntpServer !== prev.ntpServer) {
      logs.push(
        `%DHCP-6-NTP_MODIFY: [${ts}] ${deviceName} — NTP Server (Option 42) updated ` +
        `from ${prev.ntpServer || "unset"} → ${formData.ntpServer}. ` +
        `Clients will synchronise their clocks with the new time source on next lease renewal.`
      );
    }

    if (formData.dnsUpdateMode !== "Select" && formData.dnsUpdateMode !== prev.dnsUpdateMode) {
      logs.push(
        `%DHCP-6-DNSUPDATE_MOD: [${ts}] ${deviceName} — DNS dynamic update mode changed ` +
        `from "${prev.dnsUpdateMode === "Select" ? "unset" : prev.dnsUpdateMode}" → "${formData.dnsUpdateMode}". ` +
        `DDNS registration behaviour updated; verify DNS server ACLs permit updates from this device.`
      );
    }

    if (formData.conflictDetection !== prev.conflictDetection) {
      logs.push(
        formData.conflictDetection
          ? `%DHCP-5-CONFLICT_DET_ON: [${ts}] ${deviceName} — Conflict detection engine ENABLED. ` +
            `DHCP server will ping addresses before assignment. Allocation latency increases by ~500ms per offer.`
          : `%DHCP-5-CONFLICT_DET_OFF: [${ts}] ${deviceName} — Conflict detection engine DISABLED. ` +
            `Addresses will be allocated without pre-assignment verification.`
      );
    }

    if (formData.auditTrail !== prev.auditTrail) {
      logs.push(
        formData.auditTrail
          ? `%DHCP-6-AUDIT_ENABLED: [${ts}] ${deviceName} — DHCP audit trail ENABLED. ` +
            `All binding events (DISCOVER, OFFER, REQUEST, ACK, RELEASE, DECLINE) will be recorded to syslog.`
          : `%DHCP-6-AUDIT_DISABLED: [${ts}] ${deviceName} — DHCP audit trail DISABLED. ` +
            `Binding lifecycle events will no longer be forwarded to the syslog collector.`
      );
    }

    // ── Fallback if nothing changed ────────────────────────────────────────
    if (logs.length === 0) {
      logs.push(
        `%DHCP-6-NOP: [${ts}] ${deviceName} @ ${deviceLocation} — DHCP Apply invoked; ` +
        `no configuration parameters were modified. ` +
        `Current pool, bindings, and relay settings remain unchanged.`
      );
    }

    // ── Dispatch every line to ConsolePanel ────────────────────────────────
    logs.forEach((message) => dispatchLog(deviceName, deviceLocation, message));

    // ── Req #3: Persist state ──────────────────────────────────────────────
    persistentDHCPState = formData;
    prevData.current    = formData;

    onClose();
  };

  // ────────────────────────────────────────────────────────────────────────────
  return createPortal(
    <div className="config-modal-overlay dhcp-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Server size={18} />
            <span>DHCP Service</span>
          </div>

          <div className="nav-list">
            <button
              className={`nav-item ${formData.dhcpScope === "basic" ? "active" : ""}`}
              onClick={() => handleChange("dhcpScope", "basic")}
            >
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Basic Setup</strong><p>Gateway &amp; DNS</p></div>
            </button>

            <button
              className={`nav-item ${formData.dhcpScope === "pool" ? "active" : ""}`}
              onClick={() => handleChange("dhcpScope", "pool")}
            >
              <div className="nav-icon"><ArrowDown size={16} /></div>
              <div className="nav-text"><strong>IP Pool Engine</strong><p>Allocation system</p></div>
            </button>

            <button
              className={`nav-item ${formData.dhcpScope === "reservation" ? "active" : ""}`}
              onClick={() => handleChange("dhcpScope", "reservation")}
            >
              <div className="nav-icon"><Lock size={16} /></div>
              <div className="nav-text"><strong>Binding Table</strong><p>Static Mappings</p></div>
            </button>

            <button
              className={`nav-item ${formData.dhcpScope === "advanced" ? "active" : ""}`}
              onClick={() => handleChange("dhcpScope", "advanced")}
            >
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>System Control</strong><p>Advanced Policies</p></div>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>DHCP {formData.dhcpScope.toUpperCase()} CONFIG</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {/* ── BASIC ─────────────────────────────────────────────────── */}
            {formData.dhcpScope === "basic" && (
              <div className="config-group-mono highlight-area">
                <label>Core DHCP Engine</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Default Gateway</span>
                    <input
                      placeholder="e.g. 192.168.1.1"
                      value={formData.gateway}
                      onChange={(e) => handleChange("gateway", e.target.value)}
                    />
                  </div>
                  <div className="input-wrap">
                    <span>Subnet Mask</span>
                    <input
                      placeholder="e.g. 255.255.255.0"
                      value={formData.subnetMask}
                      onChange={(e) => handleChange("subnetMask", e.target.value)}
                    />
                  </div>
                  <div className="input-wrap">
                    <span>DNS Server</span>
                    <input
                      placeholder="e.g. 8.8.8.8"
                      value={formData.dnsServer}
                      onChange={(e) => handleChange("dnsServer", e.target.value)}
                    />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={formData.dhcpEnabled}
                    onChange={(e) => handleChange("dhcpEnabled", e.target.checked)}
                  />
                  <span>Enable DHCP service on this device</span>
                </div>
              </div>
            )}

            {/* ── POOL ──────────────────────────────────────────────────── */}
            {formData.dhcpScope === "pool" && (
              <div className="config-group-mono highlight-area">
                <label>IP Allocation Engine</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Start IP</span>
                    <input
                      placeholder="e.g. 192.168.1.100"
                      value={formData.startIP}
                      onChange={(e) => handleChange("startIP", e.target.value)}
                    />
                  </div>
                  <div className="input-wrap">
                    <span>End IP</span>
                    <input
                      placeholder="e.g. 192.168.1.200"
                      value={formData.endIP}
                      onChange={(e) => handleChange("endIP", e.target.value)}
                    />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Lease Time Policy</span>
                    {/* Req #7: default "Select" */}
                    <select
                      value={formData.leaseTime}
                      onChange={(e) => handleChange("leaseTime", e.target.value)}
                    >
                      <option value="Select" disabled>Select</option>
                      <option>1 hour</option>
                      <option>12 hours</option>
                      <option>24 hours</option>
                      <option>7 days</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Conflict Handling</span>
                    <select
                      value={formData.conflictHandling}
                      onChange={(e) => handleChange("conflictHandling", e.target.value)}
                    >
                      <option value="Select" disabled>Select</option>
                      <option>Reject duplicate</option>
                      <option>Override oldest</option>
                      <option>Ignore conflict</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── RESERVATIONS ──────────────────────────────────────────── */}
            {formData.dhcpScope === "reservation" && (
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
                    {formData.reservations.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            placeholder="e.g. PC-Reception"
                            value={r.device}
                            onChange={(e) => updateReservation(i, "device", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            placeholder="e.g. AA:BB:CC:DD:EE:FF"
                            value={r.mac}
                            onChange={(e) => updateReservation(i, "mac", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            placeholder="e.g. 192.168.1.50"
                            value={r.ip}
                            onChange={(e) => updateReservation(i, "ip", e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            value={r.status}
                            onChange={(e) => updateReservation(i, "status", e.target.value)}
                          >
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

            {/* ── ADVANCED ──────────────────────────────────────────────── */}
            {formData.dhcpScope === "advanced" && (
              <div className="config-group-mono highlight-area">
                <label>DHCP System Policies</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Domain Name</span>
                    <input
                      placeholder="e.g. corp.local"
                      value={formData.domainName}
                      onChange={(e) => handleChange("domainName", e.target.value)}
                    />
                  </div>
                  <div className="input-wrap">
                    <span>NTP Server</span>
                    <input
                      placeholder="e.g. time.google.com"
                      value={formData.ntpServer}
                      onChange={(e) => handleChange("ntpServer", e.target.value)}
                    />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>DHCP Relay (Helper)</span>
                    <input
                      placeholder="e.g. 192.168.10.1"
                      value={formData.dhcpRelay}
                      onChange={(e) => handleChange("dhcpRelay", e.target.value)}
                    />
                  </div>
                  <div className="input-wrap">
                    <span>DNS Update Mode</span>
                    <select
                      value={formData.dnsUpdateMode}
                      onChange={(e) => handleChange("dnsUpdateMode", e.target.value)}
                    >
                      <option value="Select" disabled>Select</option>
                      <option>Automatic</option>
                      <option>Manual</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={formData.authoritative}
                    onChange={(e) => handleChange("authoritative", e.target.checked)}
                  />
                  <span>Authoritative DHCP server</span>
                </div>
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={formData.conflictDetection}
                    onChange={(e) => handleChange("conflictDetection", e.target.checked)}
                  />
                  <span>Enable conflict detection engine</span>
                </div>
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={formData.auditTrail}
                    onChange={(e) => handleChange("auditTrail", e.target.checked)}
                  />
                  <span>Enable audit trail logging</span>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply Configuration</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}