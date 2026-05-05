import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Lock, ArrowLeftRight, ShieldCheck, Network, Activity } from "lucide-react";

let persistentVPNState = null;

const defaultState = {
  activeVPNTab:   "tunnel",
  localGateway:   "",
  remoteGateway:  "",
  localSubnet:    "",
  remoteSubnet:   "",
  autoNegotiate:  true,
  ikeVersion:     "IKEv2 (Recommended)",
  encryption:     "AES-256",
  integrity:      "SHA-256",
  preSharedKey:   "",
  pfs:            true,
  srcNetwork:     "",
  dstNetwork:     "",
  encryptMatched: true,
  bypassLocal:    false,
};

function dispatchLog(deviceName, deviceLocation, message) {
  window.dispatchEvent(
    new CustomEvent("add-system-log", {
      detail: { device: "Router", deviceName, message, location: deviceLocation, italic: true },
    })
  );
}

export default function VPNModal({ onClose, deviceName = "Router-Core-01", deviceLocation = "Data Center" }) {
  const [state, setState] = useState(persistentVPNState || defaultState);
  const prevState = useRef(persistentVPNState || defaultState);
  const set = (field, value) => setState((s) => ({ ...s, [field]: value }));

  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

  const handleApply = () => {
    const prev = prevState.current;
    const logs = [];
    const ts = now();

    // Tunnel
    if (state.localGateway !== prev.localGateway || state.remoteGateway !== prev.remoteGateway) {
      logs.push(
        `%VPN-5-TUNNEL_MODIFY: [${ts}] ${deviceName} @ ${deviceLocation} — IPSec tunnel endpoints updated. ` +
        `Local: ${prev.localGateway || "—"} → ${state.localGateway} | Remote: ${prev.remoteGateway || "—"} → ${state.remoteGateway}. ` +
        `Existing IKE SA will be torn down and re-negotiated with new parameters.`
      );
    } else if (state.localGateway) {
      logs.push(
        `%VPN-6-TUNNEL_INSTALL: [${ts}] ${deviceName} @ ${deviceLocation} — Site-to-Site tunnel configured. ` +
        `Local endpoint: ${state.localGateway} | Remote peer: ${state.remoteGateway}. ` +
        `IKE negotiation initiated; expecting ISAKMP MAIN_MODE exchange.`
      );
    }

    if (state.localSubnet !== prev.localSubnet || state.remoteSubnet !== prev.remoteSubnet) {
      logs.push(
        `%VPN-5-SUBNET_MODIFY: [${ts}] ${deviceName} — Protected subnet selectors updated. ` +
        `Local: ${prev.localSubnet || "—"} → ${state.localSubnet} | Remote: ${prev.remoteSubnet || "—"} → ${state.remoteSubnet}. ` +
        `Crypto ACL re-generated; Phase 2 (IPSec SA) will renegotiate.`
      );
    }

    // Crypto
    if (state.ikeVersion !== prev.ikeVersion) {
      logs.push(
        `%CRYPTO-5-IKE_VERSION_MOD: [${ts}] ${deviceName} — IKE version changed from ${prev.ikeVersion || "—"} to ${state.ikeVersion}. ` +
        `All active IKE SAs terminated; re-negotiation required on both peers.`
      );
    }
    if (state.encryption !== prev.encryption) {
      logs.push(
        `%CRYPTO-5-CIPHER_MOD: [${ts}] ${deviceName} — Encryption algorithm changed from ` +
        `${prev.encryption || "—"} to ${state.encryption}. ` +
        `IPSec ESP proposals updated; peer must support matching cipher suite.`
      );
    }
    if (state.integrity !== prev.integrity) {
      logs.push(
        `%CRYPTO-5-HMAC_MOD: [${ts}] ${deviceName} — Integrity algorithm changed from ` +
        `${prev.integrity || "—"} to ${state.integrity}. ` +
        `Packet authentication hash updated on both Phase 1 and Phase 2 proposals.`
      );
    }
    if (state.pfs !== prev.pfs) {
      logs.push(
        state.pfs
          ? `%CRYPTO-5-PFS_ENABLED: [${ts}] ${deviceName} — Perfect Forward Secrecy enabled (DH Group 14). ` +
            `Each Phase 2 SA will generate independent keying material, preventing retroactive decryption.`
          : `%CRYPTO-5-PFS_DISABLED: [${ts}] ${deviceName} — PFS disabled. ` +
            `Phase 2 keys will be derived from Phase 1 master secret; consider re-enabling for compliance.`
      );
    }

    // Traffic rules
    if (state.srcNetwork !== prev.srcNetwork || state.dstNetwork !== prev.dstNetwork) {
      logs.push(
        `%VPN-5-CRYPTO_ACL_MOD: [${ts}] ${deviceName} — Crypto ACL selectors updated. ` +
        `Source: ${prev.srcNetwork || "—"} → ${state.srcNetwork} | Dest: ${prev.dstNetwork || "—"} → ${state.dstNetwork}. ` +
        `Interesting-traffic classification refreshed; Phase 2 SAs renegotiating.`
      );
    }

    if (logs.length === 0) {
      logs.push(
        `%VPN-6-NOP: [${ts}] ${deviceName} @ ${deviceLocation} — VPN Apply invoked; no configuration changes detected. ` +
        `Existing tunnel state and cryptographic policies remain unchanged.`
      );
    }

    logs.forEach((message) => dispatchLog(deviceName, deviceLocation, message));
    persistentVPNState = state;
    prevState.current = state;
    onClose();
  };

  return createPortal(
    <div className="config-modal-overlay vpn-modal-layer">
      <div className="nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Lock size={18} />
            <span>VPN Configuration</span>
          </div>
          <div className="nav-list">
            <button className={`nav-item ${state.activeVPNTab === "tunnel" ? "active" : ""}`} onClick={() => set("activeVPNTab", "tunnel")}>
              <div className="nav-icon"><ArrowLeftRight size={16} /></div>
              <div className="nav-text"><strong>Site-to-Site</strong><p>Tunnel endpoints</p></div>
            </button>
            <button className={`nav-item ${state.activeVPNTab === "crypto" ? "active" : ""}`} onClick={() => set("activeVPNTab", "crypto")}>
              <div className="nav-icon"><ShieldCheck size={16} /></div>
              <div className="nav-text"><strong>Encryption</strong><p>IPSec / IKE policies</p></div>
            </button>
            <button className={`nav-item ${state.activeVPNTab === "routing" ? "active" : ""}`} onClick={() => set("activeVPNTab", "routing")}>
              <div className="nav-icon"><Network size={16} /></div>
              <div className="nav-text"><strong>Traffic Rules</strong><p>VPN ACL selectors</p></div>
            </button>
            <button className={`nav-item ${state.activeVPNTab === "status" ? "active" : ""}`} onClick={() => set("activeVPNTab", "status")}>
              <div className="nav-icon"><Activity size={16} /></div>
              <div className="nav-text"><strong>Monitoring</strong><p>Tunnel health & uptime</p></div>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{state.activeVPNTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {state.activeVPNTab === "tunnel" && (
              <div className="config-group-mono">
                <label>Site-to-Site Tunnel Setup</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Local Gateway</span>
                    <input placeholder="e.g. 203.0.113.1" value={state.localGateway} onChange={(e) => set("localGateway", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Remote Gateway</span>
                    <input placeholder="e.g. 198.51.100.1" value={state.remoteGateway} onChange={(e) => set("remoteGateway", e.target.value)} />
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Local Subnet</span>
                    <input placeholder="e.g. 192.168.1.0/24" value={state.localSubnet} onChange={(e) => set("localSubnet", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Remote Subnet</span>
                    <input placeholder="e.g. 10.10.0.0/24" value={state.remoteSubnet} onChange={(e) => set("remoteSubnet", e.target.value)} />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.autoNegotiate} onChange={(e) => set("autoNegotiate", e.target.checked)} />
                  <span>Auto-negotiate tunnel</span>
                </div>
              </div>
            )}

            {state.activeVPNTab === "crypto" && (
              <div className="config-group-mono">
                <label>IPSec / IKE Encryption</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>IKE Version</span>
                    <select value={state.ikeVersion} onChange={(e) => set("ikeVersion", e.target.value)}>
                      <option>Select</option>
                      <option>IKEv2 (Recommended)</option>
                      <option>IKEv1</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Encryption</span>
                    <select value={state.encryption} onChange={(e) => set("encryption", e.target.value)}>
                      <option>Select</option>
                      <option>AES-256</option>
                      <option>AES-128</option>
                      <option>3DES (Legacy)</option>
                    </select>
                  </div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Integrity</span>
                    <select value={state.integrity} onChange={(e) => set("integrity", e.target.value)}>
                      <option>Select</option>
                      <option>SHA-256</option>
                      <option>SHA-1</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Pre-Shared Key</span>
                    <input type="password" placeholder="e.g. ••••••••••" value={state.preSharedKey} onChange={(e) => set("preSharedKey", e.target.value)} />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.pfs} onChange={(e) => set("pfs", e.target.checked)} />
                  <span>Enable Perfect Forward Secrecy (PFS)</span>
                </div>
              </div>
            )}

            {state.activeVPNTab === "routing" && (
              <div className="config-group-mono">
                <label>VPN Traffic Selection (Crypto ACL)</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Source Network</span>
                    <input placeholder="e.g. 192.168.1.0/24" value={state.srcNetwork} onChange={(e) => set("srcNetwork", e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <span>Destination Network</span>
                    <input placeholder="e.g. 10.10.0.0/24" value={state.dstNetwork} onChange={(e) => set("dstNetwork", e.target.value)} />
                  </div>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.encryptMatched} onChange={(e) => set("encryptMatched", e.target.checked)} />
                  <span>Encrypt matching traffic only</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" checked={state.bypassLocal} onChange={(e) => set("bypassLocal", e.target.checked)} />
                  <span>Bypass local traffic optimization</span>
                </div>
              </div>
            )}

            {state.activeVPNTab === "status" && (
              <div className="config-group-mono">
                <label>Tunnel Monitoring Dashboard</label>
                <table className="acl-table">
                  <thead>
                    <tr><th>Tunnel</th><th>Status</th><th>Uptime</th><th>Latency</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>HQ ↔ Branch A</td>
                      <td style={{ color: "green" }}>UP</td>
                      <td>3h 21m</td>
                      <td>28ms</td>
                    </tr>
                    <tr>
                      <td>HQ ↔ Branch B</td>
                      <td style={{ color: "red" }}>DOWN</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply VPN</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}