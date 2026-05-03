import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import {
  Network, ArrowLeftRight, Server, Lock, Activity, Clock,
  Terminal, ArrowDown, Map, Layers, Cable, GitBranch,
  ShieldCheck, ServerIcon
} from "lucide-react";

// ─── Context ─────────────────────────────────────────────────────────────────

const PropertiesContext = createContext(null);

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error("useProperties must be used inside <PropertiesProvider>");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function PropertiesProvider({ children }) {

  // ── Per-feature modal open state ─────────────────────────────────────────
  const [isRoutingModalOpen,      setIsRoutingModalOpen]      = useState(false);
  const [activeRoutingTab,        setActiveRoutingTab]        = useState("ospf");

  const [isNATModalOpen,          setIsNATModalOpen]          = useState(false);
  const [activeNatType,           setActiveNatType]           = useState("pat");

  const [isACLModalOpen,          setIsACLModalOpen]          = useState(false);
  const [activeACLSection,        setActiveACLSection]        = useState("config");

  const [isDHCPModalOpen,         setIsDHCPModalOpen]         = useState(false);
  const [dhcpScope,               setDhcpScope]               = useState("basic");

  const [isVPNModalOpen,          setIsVPNModalOpen]          = useState(false);
  const [activeVPNTab,            setActiveVPNTab]            = useState("tunnel");

  const [isSNMPModalOpen,         setIsSNMPModalOpen]         = useState(false);
  const [activeSNMPTab,           setActiveSNMPTab]           = useState("agent");

  const [isNTPModalOpen,          setIsNTPModalOpen]          = useState(false);
  const [activeNTPTab,            setActiveNTPTab]            = useState("server");

  const [isSSHModalOpen,          setIsSSHModalOpen]          = useState(false);
  const [activeSSHTab,            setActiveSSHTab]            = useState("general");

  const [isVLANModalOpen,         setIsVLANModalOpen]         = useState(false);
  const [activeVLANTab,           setActiveVLANTab]           = useState("vlans");

  const [isSTPModalOpen,          setIsSTPModalOpen]          = useState(false);
  const [activeSTPTab,            setActiveSTPTab]            = useState("global");

  const [isPortSecurityModalOpen, setIsPortSecurityModalOpen] = useState(false);
  const [activePortSecurityTab,   setActivePortSecurityTab]   = useState("mac");

  const [isQoSModalOpen,          setIsQoSModalOpen]          = useState(false);
  const [activeQoSTab,            setActiveQoSTab]            = useState("classification");

  const [isAuthModalOpen,         setIsAuthModalOpen]         = useState(false);
  const [activeAuthTab,           setActiveAuthTab]           = useState("radius");

  const [isIGMPModalOpen,         setIsIGMPModalOpen]         = useState(false);
  const [activeIGMPTab,           setActiveIGMPTab]           = useState("snooping");

  const [isSyslogModalOpen,       setIsSyslogModalOpen]       = useState(false);
  const [activeSyslogTab,         setActiveSyslogTab]         = useState("servers");

  // ── Dispatch: config card click → correct modal ──────────────────────────
  const handleConfigItemClick = (label) => {
    const map = {
      "Routing Protocol":   () => setIsRoutingModalOpen(true),
      "NAT/PAT":            () => setIsNATModalOpen(true),
      "Access Control List": () => setIsACLModalOpen(true),
      "DHCP Server":        () => setIsDHCPModalOpen(true),
      "VPN Config":         () => setIsVPNModalOpen(true),
      "SNMP/MIB":          () => setIsSNMPModalOpen(true),
      "NTP":                () => setIsNTPModalOpen(true),
      "SSH":                () => setIsSSHModalOpen(true),
      "VLAN Manager":       () => setIsVLANModalOpen(true),
      "Spanning Tree":      () => setIsSTPModalOpen(true),
      "Port Security":      () => setIsPortSecurityModalOpen(true),
      "QoS Settings":       () => setIsQoSModalOpen(true),
      "User Auth":          () => setIsAuthModalOpen(true),
      "IGMP Snooping":      () => setIsIGMPModalOpen(true),
      "Logs/Syslog":        () => setIsSyslogModalOpen(true),
    };
    map[label]?.() ?? console.log(`Opening ${label}`);
  };

  const value = {
    // Routing
    isRoutingModalOpen,  setIsRoutingModalOpen,
    activeRoutingTab,    setActiveRoutingTab,
    // NAT
    isNATModalOpen,      setIsNATModalOpen,
    activeNatType,       setActiveNatType,
    // ACL
    isACLModalOpen,      setIsACLModalOpen,
    activeACLSection,    setActiveACLSection,
    // DHCP
    isDHCPModalOpen,     setIsDHCPModalOpen,
    dhcpScope,           setDhcpScope,
    // VPN
    isVPNModalOpen,      setIsVPNModalOpen,
    activeVPNTab,        setActiveVPNTab,
    // SNMP
    isSNMPModalOpen,     setIsSNMPModalOpen,
    activeSNMPTab,       setActiveSNMPTab,
    // NTP
    isNTPModalOpen,      setIsNTPModalOpen,
    activeNTPTab,        setActiveNTPTab,
    // SSH
    isSSHModalOpen,      setIsSSHModalOpen,
    activeSSHTab,        setActiveSSHTab,
    // VLAN
    isVLANModalOpen,     setIsVLANModalOpen,
    activeVLANTab,       setActiveVLANTab,
    // STP
    isSTPModalOpen,      setIsSTPModalOpen,
    activeSTPTab,        setActiveSTPTab,
    // Port Security
    isPortSecurityModalOpen, setIsPortSecurityModalOpen,
    activePortSecurityTab,   setActivePortSecurityTab,
    // QoS
    isQoSModalOpen,      setIsQoSModalOpen,
    activeQoSTab,        setActiveQoSTab,
    // Auth
    isAuthModalOpen,     setIsAuthModalOpen,
    activeAuthTab,       setActiveAuthTab,
    // IGMP
    isIGMPModalOpen,     setIsIGMPModalOpen,
    activeIGMPTab,       setActiveIGMPTab,
    // Syslog
    isSyslogModalOpen,   setIsSyslogModalOpen,
    activeSyslogTab,     setActiveSyslogTab,
    // Dispatcher
    handleConfigItemClick,
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// MODAL COMPONENTS
// Each modal receives its open-state and setter via props OR via context.
// The pattern below uses props so each modal is independently portable.
// ═════════════════════════════════════════════════════════════════════════════


// ─── Routing Protocol ────────────────────────────────────────────────────────

export function RoutingModal({ onClose }) {
  const { activeRoutingTab, setActiveRoutingTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay nat-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        {/* SIDEBAR */}
        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Network size={20} />
            <span>Routing Protocol Configuration</span>
          </div>
          <div className="nav-list">
            {[
              { key: "ospf",    icon: <Activity size={16} />,      title: "OSPF",         sub: "Dynamic internal routing" },
              { key: "bgp",     icon: <ArrowLeftRight size={16} />, title: "BGP",          sub: "External / ISP routing" },
              { key: "static",  icon: <Map size={16} />,           title: "Static Routes", sub: "Manual control" },
              { key: "control", icon: <Server size={16} />,        title: "Route Control", sub: "Filters & redistribution" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeRoutingTab === key ? "active" : ""}`} onClick={() => setActiveRoutingTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeRoutingTab.toUpperCase()} SETTINGS</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {/* Global */}
            <div className="config-group-mono">
              <label>Global Routing Settings</label>
              <div className="inline-fields">
                <div className="input-wrap"><span>Router ID</span><input placeholder="1.1.1.1" /></div>
                <div className="input-wrap"><span>Default Route</span><input placeholder="0.0.0.0/0 → 192.168.1.1" /></div>
              </div>
            </div>

            {/* Dynamic content */}
            <div className="config-group-mono highlight-area">

              {activeRoutingTab === "ospf" && (
                <>
                  <label>OSPF Configuration</label>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Process ID</span><input placeholder="1" /></div>
                    <div className="input-wrap">
                      <span>Area Type</span>
                      <select><option>Backbone (Area 0)</option><option>Stub Area</option><option>NSSA</option></select>
                    </div>
                  </div>
                  <div className="input-wrap"><span>Networks (CIDR)</span><input placeholder="192.168.1.0/24, 10.0.0.0/8" /></div>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Hello Timer</span><input placeholder="10s" /></div>
                    <div className="input-wrap"><span>Dead Timer</span><input placeholder="40s" /></div>
                  </div>
                  <div className="checkbox-wrap"><input type="checkbox" /><span>Enable OSPF Authentication</span></div>
                </>
              )}

              {activeRoutingTab === "bgp" && (
                <>
                  <label>BGP Configuration</label>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Local AS</span><input placeholder="65001" /></div>
                    <div className="input-wrap"><span>Keepalive Timer</span><input placeholder="60s" /></div>
                  </div>
                  <label>Neighbors</label>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Neighbor IP</span><input placeholder="203.0.113.1" /></div>
                    <div className="input-wrap"><span>Remote AS</span><input placeholder="65002" /></div>
                  </div>
                  <div className="input-wrap"><span>Advertised Networks</span><input placeholder="10.0.0.0/8" /></div>
                  <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable Route Reflector</span></div>
                </>
              )}

              {activeRoutingTab === "static" && (
                <>
                  <label>Static Route</label>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Destination</span><input placeholder="10.0.0.0/8" /></div>
                    <div className="input-wrap"><span>Next Hop</span><input placeholder="192.168.1.1" /></div>
                  </div>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Metric</span><input placeholder="1" /></div>
                    <div className="input-wrap"><span>Interface</span><select><option>G0/0</option><option>G0/1</option></select></div>
                  </div>
                  <div className="checkbox-wrap"><input type="checkbox" /><span>Floating Route (backup)</span></div>
                </>
              )}

              {activeRoutingTab === "control" && (
                <>
                  <label>Route Control & Policies</label>
                  <div className="input-wrap">
                    <span>Route Redistribution</span>
                    <select><option>None</option><option>OSPF → BGP</option><option>BGP → OSPF</option></select>
                  </div>
                  <div className="input-wrap"><span>Route Filtering (ACL)</span><input placeholder="Permit 192.168.0.0/16" /></div>
                  <div className="input-wrap"><span>Max Routes</span><input placeholder="1000" /></div>
                  <div className="checkbox-wrap"><input type="checkbox" /><span>Enable Route Logging</span></div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply Routing</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── NAT/PAT ─────────────────────────────────────────────────────────────────

export function NATModal({ onClose }) {
  const { activeNatType, setActiveNatType } = useProperties();

  return createPortal(
    <div className="config-modal-overlay nat-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><ArrowLeftRight size={20} /><span>NAT Configuration</span></div>
          <div className="nav-list">
            {[
              { key: "pat",     icon: <Activity size={16} />, title: "PAT (Overload)", sub: "Many-to-One" },
              { key: "static",  icon: <Server size={16} />,   title: "Static NAT",     sub: "One-to-One / Port" },
              { key: "dynamic", icon: <Network size={16} />,  title: "Dynamic NAT",    sub: "Pool Mapping" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeNatType === key ? "active" : ""}`} onClick={() => setActiveNatType(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeNatType.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            <div className="config-group-mono">
              <label>Interface Assignment</label>
              <div className="inline-fields">
                <div className="input-wrap"><span>Inside</span><select><option>G0/0 (LAN)</option></select></div>
                <div className="input-wrap"><span>Outside</span><select><option>G0/1 (WAN)</option></select></div>
              </div>
            </div>

            <div className="config-group-mono">
              <label>Access Control List (ACL)</label>
              <div className="inline-fields">
                <div className="input-wrap"><span>ACL ID</span><input placeholder="1" /></div>
                <div className="input-wrap"><span>Source Network</span><input placeholder="192.168.1.0" /></div>
                <div className="input-wrap"><span>Wildcard Mask</span><input placeholder="0.0.0.255" /></div>
              </div>
            </div>

            <div className="config-group-mono highlight-area">
              {activeNatType === "pat" && (
                <>
                  <label>PAT Configuration</label>
                  <div className="input-wrap">
                    <span>Translation Mode</span>
                    <select><option>Use Interface IP</option><option>Use NAT Pool</option></select>
                  </div>
                  <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable Overload (Port Translation)</span></div>
                </>
              )}

              {activeNatType === "static" && (
                <>
                  <label>Static Mapping</label>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Private IP</span><input placeholder="192.168.1.10" /></div>
                    <div className="input-wrap"><span>Public IP</span><input placeholder="203.0.113.5" /></div>
                  </div>
                  <label style={{ marginTop: "15px" }}>Port Forwarding (Static PAT)</label>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Private Port</span><input placeholder="80" /></div>
                    <div className="input-wrap"><span>Public Port</span><input placeholder="8080" /></div>
                  </div>
                </>
              )}

              {activeNatType === "dynamic" && (
                <>
                  <label>NAT Pool</label>
                  <div className="input-wrap"><span>Pool Name</span><input placeholder="MYPOOL" /></div>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Start IP</span><input placeholder="203.0.113.10" /></div>
                    <div className="input-wrap"><span>End IP</span><input placeholder="203.0.113.20" /></div>
                    <div className="input-wrap"><span>Netmask</span><input placeholder="255.255.255.224" /></div>
                  </div>
                  <div className="input-wrap"><span>Bind ACL ID</span><input placeholder="1" /></div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={onClose}>Apply Changes</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── ACL ─────────────────────────────────────────────────────────────────────

export function ACLModal({ onClose }) {
  const { activeACLSection, setActiveACLSection } = useProperties();

  return createPortal(
    <div className="config-modal-overlay nat-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><ShieldCheck size={20} /><span>Access Control List Configuration</span></div>
          <div className="nav-list">
            {[
              { key: "rules",    icon: <Lock size={16} />,         title: "ACL Rules",          sub: "Permit / Deny logic" },
              { key: "binding",  icon: <Network size={16} />,      title: "Interface Binding",  sub: "Apply ACL to ports" },
              { key: "advanced", icon: <ArrowLeftRight size={16} />, title: "Traffic Behavior", sub: "Flow & logging" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeACLSection === key ? "active" : ""}`} onClick={() => setActiveACLSection(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeACLSection.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            <div className="config-group-mono">
              <label>ACL Mode</label>
              <div className="inline-fields">
                <div className="input-wrap"><span>Type</span><select><option>Standard</option><option>Extended</option></select></div>
                <div className="input-wrap"><span>ACL ID / Name</span><input placeholder="ACL_101" /></div>
              </div>
            </div>

            <div className="config-group-mono highlight-area">
              {activeACLSection === "rules" && (
                <>
                  <label>Rule Engine (Top-down priority)</label>
                  <table className="acl-table">
                    <thead><tr><th>#</th><th>Action</th><th>Protocol</th><th>Source</th><th>Destination</th><th>Port</th><th>Log</th></tr></thead>
                    <tbody>
                      {[1,2,3,4].map((_, i) => (
                        <tr key={i}>
                          <td>{i+1}</td>
                          <td><select><option>permit</option><option>deny</option></select></td>
                          <td><select><option>ip</option><option>tcp</option><option>udp</option><option>icmp</option></select></td>
                          <td><input placeholder="192.168.1.0/24" /></td>
                          <td><input placeholder="any" /></td>
                          <td><input placeholder="80,443" /></td>
                          <td><input type="checkbox" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Implicit Deny (block unmatched traffic)</span></div>
                </>
              )}

              {activeACLSection === "binding" && (
                <>
                  <label>Apply ACL to Interface</label>
                  <div className="inline-fields">
                    <div className="input-wrap"><span>Interface</span><select><option>G0/0 (LAN)</option><option>G0/1 (WAN)</option><option>VLAN 10</option></select></div>
                    <div className="input-wrap"><span>Direction</span><select><option>Inbound</option><option>Outbound</option></select></div>
                  </div>
                  <div className="input-wrap"><span>Apply To</span><select><option>All Traffic</option><option>Matched Traffic Only</option></select></div>
                </>
              )}

              {activeACLSection === "advanced" && (
                <>
                  <label>Traffic Behavior</label>
                  <div className="input-wrap"><span>Default Action</span><select><option>Deny</option><option>Permit</option></select></div>
                  <div className="input-wrap"><span>Logging Level</span><select><option>None</option><option>Errors Only</option><option>All Matches</option></select></div>
                  <div className="checkbox-wrap"><input type="checkbox" /><span>Enable Stateful Inspection</span></div>
                  <div className="checkbox-wrap"><input type="checkbox" /><span>Enable Rate Limiting</span></div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply ACL</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── DHCP ─────────────────────────────────────────────────────────────────────

export function DHCPModal({ onClose }) {
  const { dhcpScope, setDhcpScope } = useProperties();

  return createPortal(
    <div className="config-modal-overlay dhcp-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Server size={18} /><span>Advanced Configuration</span></div>
          <div className="nav-list">
            {[
              { key: "basic",       icon: <Network size={16} />,  title: "Basic Setup",    sub: "Gateway, DNS, Lease" },
              { key: "pool",        icon: <ArrowDown size={16} />, title: "IP Pool Engine", sub: "Allocation system" },
              { key: "reservation", icon: <Lock size={16} />,     title: "Binding Table",  sub: "MAC → IP mapping" },
              { key: "advanced",    icon: <Activity size={16} />, title: "System Control", sub: "Policies & behavior" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${dhcpScope === key ? "active" : ""}`} onClick={() => setDhcpScope(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

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
                  <div className="input-wrap"><span>Default Gateway</span><input placeholder="192.168.1.1" /></div>
                  <div className="input-wrap"><span>Subnet Mask</span><input placeholder="255.255.255.0" /></div>
                  <div className="input-wrap"><span>DNS Server</span><input placeholder="8.8.8.8" /></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable DHCP service</span></div>
              </div>
            )}

            {dhcpScope === "pool" && (
              <div className="config-group-mono highlight-area">
                <label>IP Allocation Engine</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Start IP</span><input placeholder="192.168.1.100" /></div>
                  <div className="input-wrap"><span>End IP</span><input placeholder="192.168.1.200" /></div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Lease Time Policy</span><select><option>1 hour</option><option>12 hours</option><option>24 hours</option><option>7 days</option></select></div>
                  <div className="input-wrap"><span>Conflict Handling</span><select><option>Reject duplicate</option><option>Override oldest</option><option>Ignore conflict</option></select></div>
                </div>
              </div>
            )}

            {dhcpScope === "reservation" && (
              <div className="config-group-mono highlight-area">
                <label>Static Binding Table</label>
                <table className="acl-table">
                  <thead><tr><th>Device</th><th>MAC Address</th><th>Reserved IP</th><th>Status</th></tr></thead>
                  <tbody>
                    {[1,2,3].map(i => (
                      <tr key={i}>
                        <td><input placeholder="Device Name" /></td>
                        <td><input placeholder="AA:BB:CC:DD:EE:FF" /></td>
                        <td><input placeholder="192.168.1.10" /></td>
                        <td><select><option>Active</option><option>Disabled</option></select></td>
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
                  <div className="input-wrap"><span>Domain Name</span><input placeholder="corp.local" /></div>
                  <div className="input-wrap"><span>NTP Server</span><input placeholder="time.google.com" /></div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap"><span>DHCP Relay</span><input placeholder="192.168.10.1" /></div>
                  <div className="input-wrap"><span>DNS Update Mode</span><select><option>Automatic</option><option>Manual</option><option>Disabled</option></select></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Authoritative DHCP server</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Enable conflict detection engine</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Enable system logging</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Enable audit trail (enterprise mode)</span></div>
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


// ─── VPN ─────────────────────────────────────────────────────────────────────

export function VPNModal({ onClose }) {
  const { activeVPNTab, setActiveVPNTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay vpn-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Lock size={18} /><span>VPN Configuration</span></div>
          <div className="nav-list">
            {[
              { key: "tunnel",  icon: <ArrowLeftRight size={16} />, title: "Site-to-Site", sub: "Tunnel endpoints" },
              { key: "crypto",  icon: <ShieldCheck size={16} />,    title: "Encryption",   sub: "IPSec / IKE policies" },
              { key: "routing", icon: <Network size={16} />,        title: "Traffic Rules", sub: "VPN ACL selectors" },
              { key: "status",  icon: <Activity size={16} />,       title: "Monitoring",   sub: "Tunnel health & uptime" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeVPNTab === key ? "active" : ""}`} onClick={() => setActiveVPNTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeVPNTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeVPNTab === "tunnel" && (
              <div className="config-group-mono">
                <label>Site-to-Site Tunnel Setup</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Local Gateway</span><input placeholder="203.0.113.1" /></div>
                  <div className="input-wrap"><span>Remote Gateway</span><input placeholder="198.51.100.1" /></div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Local Subnet</span><input placeholder="192.168.1.0/24" /></div>
                  <div className="input-wrap"><span>Remote Subnet</span><input placeholder="10.10.0.0/24" /></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Auto-negotiate tunnel</span></div>
              </div>
            )}

            {activeVPNTab === "crypto" && (
              <div className="config-group-mono">
                <label>IPSec / IKE Encryption</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>IKE Version</span><select><option>IKEv2 (Recommended)</option><option>IKEv1</option></select></div>
                  <div className="input-wrap"><span>Encryption</span><select><option>AES-256</option><option>AES-128</option><option>3DES (Legacy)</option></select></div>
                </div>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Integrity</span><select><option>SHA-256</option><option>SHA-1</option></select></div>
                  <div className="input-wrap"><span>Pre-Shared Key</span><input type="password" placeholder="••••••••••" /></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable Perfect Forward Secrecy (PFS)</span></div>
              </div>
            )}

            {activeVPNTab === "routing" && (
              <div className="config-group-mono">
                <label>VPN Traffic Selection (Crypto ACL)</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Source Network</span><input placeholder="192.168.1.0/24" /></div>
                  <div className="input-wrap"><span>Destination Network</span><input placeholder="10.10.0.0/24" /></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Encrypt matching traffic only</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Bypass local traffic optimization</span></div>
              </div>
            )}

            {activeVPNTab === "status" && (
              <div className="config-group-mono">
                <label>Tunnel Monitoring Dashboard</label>
                <table className="acl-table">
                  <thead><tr><th>Tunnel</th><th>Status</th><th>Uptime</th><th>Latency</th></tr></thead>
                  <tbody>
                    <tr><td>HQ ↔ Branch A</td><td style={{ color: "green" }}>UP</td><td>3h 21m</td><td>28ms</td></tr>
                    <tr><td>HQ ↔ Branch B</td><td style={{ color: "red" }}>DOWN</td><td>—</td><td>—</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply VPN</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── SNMP ─────────────────────────────────────────────────────────────────────

export function SNMPModal({ onClose }) {
  const { activeSNMPTab, setActiveSNMPTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay snmp-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Activity size={18} /><span>SNMP Configuration</span></div>
          <div className="nav-list">
            {[
              { key: "agent",    icon: <Server size={16} />,   title: "SNMP Agent",    sub: "Identity & versioning" },
              { key: "security", icon: <Lock size={16} />,     title: "Security",      sub: "v1/v2c/v3 access control" },
              { key: "mib",      icon: <Network size={16} />,  title: "MIB Monitoring", sub: "OID tracking & thresholds" },
              { key: "traps",    icon: <Activity size={16} />, title: "Traps",         sub: "Alert destinations" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeSNMPTab === key ? "active" : ""}`} onClick={() => setActiveSNMPTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced SNMP Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeSNMPTab === "agent" && (
              <div className="config-group-mono">
                <label>SNMP Agent Settings</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>SNMP Version</span><select><option>v3 (Recommended)</option><option>v2c</option><option>v1</option></select></div>
                  <div className="input-wrap"><span>System Name</span><input placeholder="Core-Router-01" /></div>
                </div>
                <div className="input-wrap"><span>System Location</span><input placeholder="Server Room A" /></div>
                <div className="input-wrap"><span>System Contact</span><input placeholder="admin@corp.local" /></div>
              </div>
            )}

            {activeSNMPTab === "security" && (
              <div className="config-group-mono">
                <label>Community Strings / v3 Users</label>
                <table className="acl-table">
                  <thead><tr><th>Name</th><th>Access</th><th>Auth Protocol</th><th>Priv Protocol</th></tr></thead>
                  <tbody>
                    {[1,2].map(i => (
                      <tr key={i}>
                        <td><input placeholder="public" /></td>
                        <td><select><option>Read-Only</option><option>Read-Write</option></select></td>
                        <td><select><option>MD5</option><option>SHA</option></select></td>
                        <td><select><option>DES</option><option>AES</option></select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSNMPTab === "mib" && (
              <div className="config-group-mono">
                <label>MIB OID Monitoring</label>
                <table className="acl-table">
                  <thead><tr><th>OID</th><th>Threshold</th><th>Alert</th></tr></thead>
                  <tbody>
                    {[1,2,3].map(i => (
                      <tr key={i}>
                        <td><input placeholder="1.3.6.1.2.1.1.1.0" /></td>
                        <td><input placeholder="90%" /></td>
                        <td><input type="checkbox" defaultChecked /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSNMPTab === "traps" && (
              <div className="config-group-mono">
                <label>Trap Destinations</label>
                <table className="acl-table">
                  <thead><tr><th>Host IP</th><th>Port</th><th>Community</th></tr></thead>
                  <tbody>
                    {[1,2].map(i => (
                      <tr key={i}>
                        <td><input placeholder="192.168.1.100" /></td>
                        <td><input placeholder="162" /></td>
                        <td><input placeholder="public" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply SNMP</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── NTP ─────────────────────────────────────────────────────────────────────

export function NTPModal({ onClose }) {
  const { activeNTPTab, setActiveNTPTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay ntp-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Clock size={18} /><span>NTP Configuration</span></div>
          <div className="nav-list">
            {[
              { key: "server", icon: <Server size={16} />,   title: "NTP Servers", sub: "Time source pool" },
              { key: "sync",   icon: <Clock size={16} />,    title: "Sync Engine", sub: "Drift & intervals" },
              { key: "auth",   icon: <Lock size={16} />,     title: "Auth Keys",   sub: "Trusted sources" },
              { key: "status", icon: <Activity size={16} />, title: "Status",      sub: "Clock health" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeNTPTab === key ? "active" : ""}`} onClick={() => setActiveNTPTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced NTP Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeNTPTab === "server" && (
              <div className="config-group-mono">
                <label>NTP Server Pool</label>
                <table className="acl-table">
                  <thead><tr><th>#</th><th>Server</th><th>Type</th><th>Active</th></tr></thead>
                  <tbody>
                    {[1,2,3].map((_, i) => (
                      <tr key={i}>
                        <td>{i+1}</td>
                        <td><input placeholder="time.server.com" /></td>
                        <td><select><option>Public</option><option>Pool</option><option>Internal</option><option>Fallback</option></select></td>
                        <td><input type="checkbox" defaultChecked /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeNTPTab === "sync" && (
              <div className="config-group-mono">
                <label>Synchronization Engine</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Sync Interval</span><select><option>30 sec</option><option>60 sec</option><option>5 min</option><option>15 min</option><option>1 hour</option></select></div>
                  <div className="input-wrap"><span>Mode</span><select><option>Client</option><option>Server</option><option>Peer</option></select></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Auto drift correction (slew mode)</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Force sync on boot</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Fallback to secondary NTP source</span></div>
              </div>
            )}

            {activeNTPTab === "auth" && (
              <div className="config-group-mono">
                <label>NTP Authentication Layer</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Key ID</span><input placeholder="1" /></div>
                  <div className="input-wrap"><span>Algorithm</span><select><option>MD5</option><option>SHA1</option><option>SHA256</option></select></div>
                </div>
                <div className="input-wrap"><span>Shared Key</span><input type="password" placeholder="••••••••••••" /></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Require authentication for all NTP peers</span></div>
              </div>
            )}

            {activeNTPTab === "status" && (
              <div className="config-group-mono">
                <label>Clock Synchronization Health</label>
                <table className="acl-table">
                  <thead><tr><th>Source</th><th>Status</th><th>Offset</th><th>Last Sync</th></tr></thead>
                  <tbody>
                    <tr><td>time.google.com</td><td style={{ color: "green" }}>SYNCED</td><td>+0.003s</td><td>12s ago</td></tr>
                    <tr><td>pool.ntp.org</td><td style={{ color: "green" }}>SYNCED</td><td>+0.007s</td><td>18s ago</td></tr>
                    <tr><td>Local Clock</td><td style={{ color: "orange" }}>STANDBY</td><td>—</td><td>—</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply NTP</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── SSH ─────────────────────────────────────────────────────────────────────

export function SSHModal({ onClose }) {
  const { activeSSHTab, setActiveSSHTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay ssh-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Lock size={18} /><span>SSH / Remote Access</span></div>
          <div className="nav-list">
            {[
              { key: "general",  icon: <Server size={16} />,     title: "General",        sub: "Enable & port settings" },
              { key: "auth",     icon: <ShieldCheck size={16} />, title: "Authentication", sub: "Password / Key access" },
              { key: "keys",     icon: <Lock size={16} />,       title: "SSH Keys",       sub: "Public key management" },
              { key: "access",   icon: <Network size={16} />,    title: "Access Control", sub: "Allowed IPs / users" },
              { key: "sessions", icon: <Activity size={16} />,   title: "Sessions",       sub: "Active connections" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeSSHTab === key ? "active" : ""}`} onClick={() => setActiveSSHTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>{activeSSHTab.toUpperCase()} Settings</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeSSHTab === "general" && (
              <div className="config-group-mono">
                <label>SSH Service Settings</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Enable SSH</span><select><option>Enabled</option><option>Disabled</option></select></div>
                  <div className="input-wrap"><span>Port</span><input placeholder="22" /></div>
                  <div className="input-wrap"><span>Protocol Version</span><select><option>SSH-2 (Recommended)</option><option>SSH-1 (Legacy)</option></select></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Allow remote root login</span></div>
              </div>
            )}

            {activeSSHTab === "auth" && (
              <div className="config-group-mono">
                <label>Authentication Methods</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Password Login</span><select><option>Enabled</option><option>Disabled</option></select></div>
                  <div className="input-wrap"><span>Key-Based Auth</span><select><option>Required</option><option>Optional</option><option>Disabled</option></select></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Disable empty passwords</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>2FA (future support)</span></div>
              </div>
            )}

            {activeSSHTab === "keys" && (
              <div className="config-group-mono">
                <label>SSH Public Keys</label>
                <table className="acl-table">
                  <thead><tr><th>User</th><th>Key Type</th><th>Fingerprint</th><th>Active</th></tr></thead>
                  <tbody>
                    {[1,2,3].map(i => (
                      <tr key={i}>
                        <td><input placeholder="admin" /></td>
                        <td><select><option>RSA</option><option>ECDSA</option><option>ED25519</option></select></td>
                        <td><input placeholder="SHA256:xxxxxx" /></td>
                        <td><input type="checkbox" defaultChecked /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSSHTab === "access" && (
              <div className="config-group-mono">
                <label>Access Restrictions</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Allowed IP Range</span><input placeholder="192.168.1.0/24" /></div>
                  <div className="input-wrap"><span>Blocked IP</span><input placeholder="0.0.0.0/0 (optional)" /></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable IP filtering</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Rate limiting (anti brute-force)</span></div>
              </div>
            )}

            {activeSSHTab === "sessions" && (
              <div className="config-group-mono">
                <label>Active SSH Sessions</label>
                <div className="acl-table">
                  <table>
                    <thead><tr><th>User</th><th>Source IP</th><th>Uptime</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr><td>admin</td><td>192.168.1.10</td><td>2h 12m</td><td style={{ color: "green" }}>ACTIVE</td></tr>
                      <tr><td>root</td><td>10.0.0.5</td><td>15m</td><td style={{ color: "green" }}>ACTIVE</td></tr>
                      <tr><td>guest</td><td>203.0.113.9</td><td>—</td><td style={{ color: "red" }}>BLOCKED</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply SSH Config</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── VLAN ─────────────────────────────────────────────────────────────────────

export function VLANModal({ onClose }) {
  const { activeVLANTab, setActiveVLANTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay vlan-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Network size={18} /><span>VLAN Manager</span></div>
          <div className="nav-list">
            {[
              { key: "vlans",   icon: <Layers size={16} />,       title: "VLAN Database",  sub: "Create & manage VLANs" },
              { key: "ports",   icon: <Cable size={16} />,        title: "Port Assignment", sub: "Access & trunk ports" },
              { key: "trunk",   icon: <ArrowLeftRight size={16} />, title: "Trunking",      sub: "802.1Q uplink config" },
              { key: "stp",     icon: <GitBranch size={16} />,    title: "STP",            sub: "Loop prevention" },
              { key: "monitor", icon: <Activity size={16} />,     title: "Monitor",        sub: "VLAN statistics" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeVLANTab === key ? "active" : ""}`} onClick={() => setActiveVLANTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced VLAN Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeVLANTab === "vlans" && (
              <div className="config-group-mono">
                <label>VLAN Database</label>
                <table className="acl-table">
                  <thead><tr><th>VLAN ID</th><th>Name</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {[1,2,3].map(i => (
                      <tr key={i}>
                        <td><input placeholder="10" /></td>
                        <td><input placeholder="Management" /></td>
                        <td><select><option>Data</option><option>Voice</option><option>Native</option></select></td>
                        <td><select><option>Active</option><option>Suspended</option></select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable VLAN pruning</span></div>
              </div>
            )}

            {activeVLANTab === "ports" && (
              <div className="config-group-mono">
                <label>Switch Port Assignment</label>
                <table className="acl-table">
                  <thead><tr><th>Interface</th><th>Mode</th><th>Access VLAN</th><th>Voice VLAN</th></tr></thead>
                  <tbody>
                    {["Fa0/1","Fa0/2","Fa0/3","Gi0/1"].map((port, i) => (
                      <tr key={i}>
                        <td>{port}</td>
                        <td><select><option>Access</option><option>Trunk</option><option>Dynamic Auto</option></select></td>
                        <td><input placeholder="10" /></td>
                        <td><input placeholder="20" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeVLANTab === "trunk" && (
              <div className="config-group-mono">
                <label>802.1Q Trunk Configuration</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Native VLAN</span><input placeholder="99" /></div>
                  <div className="input-wrap"><span>Allowed VLANs</span><input placeholder="10,20,30,99" /></div>
                  <div className="input-wrap"><span>Encapsulation</span><select><option>802.1Q</option><option>ISL</option></select></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable DTP negotiation</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Restrict unused VLANs</span></div>
              </div>
            )}

            {activeVLANTab === "stp" && (
              <div className="config-group-mono">
                <label>Spanning Tree Protocol</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>STP Mode</span><select><option>Rapid PVST+</option><option>PVST+</option><option>MST</option></select></div>
                  <div className="input-wrap"><span>Bridge Priority</span><input placeholder="32768" /></div>
                  <div className="input-wrap"><span>Root Guard</span><select><option>Enabled</option><option>Disabled</option></select></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable PortFast on access ports</span></div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable BPDU Guard</span></div>
              </div>
            )}

            {activeVLANTab === "monitor" && (
              <div className="config-group-mono">
                <label>VLAN Monitoring & Statistics</label>
                <div className="acl-table">
                  <table>
                    <thead><tr><th>VLAN</th><th>Ports</th><th>Traffic Load</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr><td>10</td><td>Fa0/1, Fa0/2</td><td>42%</td><td style={{ color: "green" }}>ACTIVE</td></tr>
                      <tr><td>20</td><td>Fa0/3</td><td>67%</td><td style={{ color: "green" }}>ACTIVE</td></tr>
                      <tr><td>99</td><td>Gi0/1</td><td>12%</td><td style={{ color: "orange" }}>NATIVE</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply VLAN Config</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── STP ─────────────────────────────────────────────────────────────────────

export function STPModal({ onClose }) {
  const { activeSTPTab, setActiveSTPTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay stp-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><GitBranch size={18} /><span>Spanning Tree</span></div>
          <div className="nav-list">
            {[
              { key: "global",     icon: <Network size={16} />,     title: "Global STP",     sub: "Core spanning tree mode" },
              { key: "priority",   icon: <Layers size={16} />,      title: "Bridge Priority", sub: "Root bridge election" },
              { key: "protection", icon: <ShieldCheck size={16} />, title: "Protection",     sub: "BPDU & root guard" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeSTPTab === key ? "active" : ""}`} onClick={() => setActiveSTPTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Spanning Tree Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeSTPTab === "global" && (
              <div className="config-group-mono">
                <label>STP Global Settings</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>STP Mode</span><select><option>Rapid PVST+</option><option>PVST+</option><option>MST</option></select></div>
                  <div className="input-wrap"><span>Hello Time</span><input placeholder="2 sec" /></div>
                  <div className="input-wrap"><span>Forward Delay</span><input placeholder="15 sec" /></div>
                </div>
              </div>
            )}

            {activeSTPTab === "priority" && (
              <div className="config-group-mono">
                <label>Bridge Priority</label>
                <table className="acl-table">
                  <thead><tr><th>VLAN</th><th>Priority</th><th>Role</th></tr></thead>
                  <tbody>
                    {[10,20,30].map((vlan, i) => (
                      <tr key={i}>
                        <td>{vlan}</td>
                        <td><input placeholder="32768" /></td>
                        <td><select><option>Root Primary</option><option>Root Secondary</option><option>Normal</option></select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSTPTab === "protection" && (
              <div className="config-group-mono">
                <label>Loop Protection Features</label>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable BPDU Guard</span></div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable Root Guard</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Enable Loop Guard</span></div>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply STP Config</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── Port Security ────────────────────────────────────────────────────────────

export function PortSecurityModal({ onClose }) {
  const { activePortSecurityTab, setActivePortSecurityTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay port-security-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><ShieldCheck size={18} /><span>Port Security</span></div>
          <div className="nav-list">
            {[
              { key: "mac",       icon: <Cable size={16} />, title: "MAC Binding",    sub: "Allowed device addresses" },
              { key: "violation", icon: <Lock size={16} />,  title: "Violation Action", sub: "Unauthorized access policy" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activePortSecurityTab === key ? "active" : ""}`} onClick={() => setActivePortSecurityTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Port Security</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activePortSecurityTab === "mac" && (
              <div className="config-group-mono">
                <label>Secure MAC Address Table</label>
                <table className="acl-table">
                  <thead><tr><th>Port</th><th>MAC Address</th><th>Max MACs</th></tr></thead>
                  <tbody>
                    {["Fa0/1","Fa0/2","Gi0/1"].map((port, i) => (
                      <tr key={i}>
                        <td>{port}</td>
                        <td><input placeholder="AA:BB:CC:DD:EE:FF" /></td>
                        <td><input placeholder="1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activePortSecurityTab === "violation" && (
              <div className="config-group-mono">
                <label>Violation Policies</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Action</span><select><option>Shutdown</option><option>Restrict</option><option>Protect</option></select></div>
                  <div className="input-wrap"><span>Recovery Time</span><input placeholder="300 sec" /></div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply Security</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── QoS ─────────────────────────────────────────────────────────────────────

export function QoSModal({ onClose }) {
  const { activeQoSTab, setActiveQoSTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay qos-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Activity size={18} /><span>QoS Settings</span></div>
          <div className="nav-list">
            {[
              { key: "classification", icon: <Layers size={16} />,       title: "Classification", sub: "Traffic identification" },
              { key: "queue",          icon: <ArrowLeftRight size={16} />, title: "Queueing",      sub: "Bandwidth allocation" },
              { key: "policing",       icon: <ShieldCheck size={16} />,   title: "Policing",       sub: "Rate limiting policies" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeQoSTab === key ? "active" : ""}`} onClick={() => setActiveQoSTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced QoS Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeQoSTab === "classification" && (
              <div className="config-group-mono">
                <label>Traffic Classification</label>
                <table className="acl-table">
                  <thead><tr><th>Class</th><th>Protocol</th><th>DSCP</th><th>Priority</th></tr></thead>
                  <tbody>
                    {["Voice","Video","Data"].map((c, i) => (
                      <tr key={i}>
                        <td>{c}</td>
                        <td><input placeholder="SIP / RTP" /></td>
                        <td><input placeholder="46" /></td>
                        <td><select><option>High</option><option>Medium</option><option>Low</option></select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeQoSTab === "queue" && (
              <div className="config-group-mono">
                <label>Queue Management</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Scheduling</span><select><option>Weighted Round Robin</option><option>Strict Priority</option></select></div>
                  <div className="input-wrap"><span>Voice Queue</span><input placeholder="40%" /></div>
                  <div className="input-wrap"><span>Video Queue</span><input placeholder="30%" /></div>
                </div>
              </div>
            )}

            {activeQoSTab === "policing" && (
              <div className="config-group-mono">
                <label>Traffic Policing</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Rate Limit</span><input placeholder="100 Mbps" /></div>
                  <div className="input-wrap"><span>Burst Size</span><input placeholder="1 MB" /></div>
                </div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Drop excess traffic</span></div>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply QoS</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── Auth (RADIUS / 802.1X) ───────────────────────────────────────────────────

export function AuthModal({ onClose }) {
  const { activeAuthTab, setActiveAuthTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay auth-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Lock size={18} /><span>User Authentication</span></div>
          <div className="nav-list">
            {[
              { key: "radius", icon: <Server size={16} />,     title: "RADIUS",  sub: "AAA authentication server" },
              { key: "dot1x",  icon: <ShieldCheck size={16} />, title: "802.1X", sub: "Port-based access control" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeAuthTab === key ? "active" : ""}`} onClick={() => setActiveAuthTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

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
                  <div className="input-wrap"><span>Server IP</span><input placeholder="192.168.1.200" /></div>
                  <div className="input-wrap"><span>Port</span><input placeholder="1812" /></div>
                  <div className="input-wrap"><span>Shared Secret</span><input type="password" placeholder="••••••••" /></div>
                </div>
              </div>
            )}

            {activeAuthTab === "dot1x" && (
              <div className="config-group-mono">
                <label>802.1X Access Control</label>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable 802.1X globally</span></div>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Force authentication on access ports</span></div>
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


// ─── IGMP Snooping ────────────────────────────────────────────────────────────

export function IGMPModal({ onClose }) {
  const { activeIGMPTab, setActiveIGMPTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay igmp-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><Layers size={18} /><span>IGMP Snooping</span></div>
          <div className="nav-list">
            {[
              { key: "snooping", icon: <Network size={16} />, title: "Snooping", sub: "Multicast optimization" },
              { key: "querier",  icon: <Server size={16} />,  title: "Querier",  sub: "IGMP query management" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeIGMPTab === key ? "active" : ""}`} onClick={() => setActiveIGMPTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced IGMP Snooping</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeIGMPTab === "snooping" && (
              <div className="config-group-mono">
                <label>Multicast Traffic Settings</label>
                <div className="checkbox-wrap"><input type="checkbox" defaultChecked /><span>Enable IGMP Snooping</span></div>
                <div className="checkbox-wrap"><input type="checkbox" /><span>Fast leave processing</span></div>
              </div>
            )}

            {activeIGMPTab === "querier" && (
              <div className="config-group-mono">
                <label>Querier Parameters</label>
                <div className="inline-fields">
                  <div className="input-wrap"><span>Querier IP</span><input placeholder="192.168.1.1" /></div>
                  <div className="input-wrap"><span>Query Interval</span><input placeholder="125 sec" /></div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply IGMP</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── Syslog ───────────────────────────────────────────────────────────────────

export function SyslogModal({ onClose }) {
  const { activeSyslogTab, setActiveSyslogTab } = useProperties();

  return createPortal(
    <div className="config-modal-overlay syslog-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header"><ServerIcon size={18} /><span>Logs / Syslog</span></div>
          <div className="nav-list">
            {[
              { key: "servers",  icon: <Server size={16} />,   title: "Syslog Servers", sub: "Remote logging endpoints" },
              { key: "severity", icon: <Activity size={16} />, title: "Severity Levels", sub: "Critical event filtering" },
            ].map(({ key, icon, title, sub }) => (
              <button key={key} className={`nav-item ${activeSyslogTab === key ? "active" : ""}`} onClick={() => setActiveSyslogTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{title}</strong><p>{sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Syslog Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">
            {activeSyslogTab === "servers" && (
              <div className="config-group-mono">
                <label>Remote Syslog Servers</label>
                <table className="acl-table">
                  <thead><tr><th>Server IP</th><th>Port</th><th>Protocol</th></tr></thead>
                  <tbody>
                    {[1,2].map(i => (
                      <tr key={i}>
                        <td><input placeholder="192.168.1.250" /></td>
                        <td><input placeholder="514" /></td>
                        <td><select><option>UDP</option><option>TCP</option></select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSyslogTab === "severity" && (
              <div className="config-group-mono">
                <label>Logging Severity</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Console Logging</span>
                    <select><option>Warnings</option><option>Errors</option><option>Critical</option></select>
                  </div>
                  <div className="input-wrap"><span>Buffer Size</span><input placeholder="8192 KB" /></div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary">Apply Syslog</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}