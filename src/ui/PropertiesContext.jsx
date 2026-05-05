import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import {
  Network, ArrowLeftRight, Server, Lock, Activity, Clock,
  Terminal, ArrowDown, Map, Layers, Cable, GitBranch,
  ShieldCheck, ServerIcon
} from "lucide-react";

// ─── Context ──────────────────────────────────────────────────────────────────

const PropertiesContext = createContext(null);

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error("useProperties must be used inside <PropertiesProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

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

  const [isTrunkingModalOpen,     setIsTrunkingModalOpen]     = useState(false);
  const [activeTrunkTab,          setActiveTrunkTab]          = useState("config");

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
      "Routing Protocol":    () => setIsRoutingModalOpen(true),
      "NAT/PAT":             () => setIsNATModalOpen(true),
      "Access Control List": () => setIsACLModalOpen(true),
      "DHCP Server":         () => setIsDHCPModalOpen(true),
      "VPN Config":          () => setIsVPNModalOpen(true),
      "SNMP/MIB":            () => setIsSNMPModalOpen(true),
      "NTP":                 () => setIsNTPModalOpen(true),
      "SSH":                 () => setIsSSHModalOpen(true),
      "VLAN Manager":        () => setIsVLANModalOpen(true),
      "Spanning Tree":       () => setIsSTPModalOpen(true),
      "Port Security":       () => setIsPortSecurityModalOpen(true),
      "VLAN Trunking":       () => setIsTrunkingModalOpen(true),
      "QoS Settings":        () => setIsQoSModalOpen(true),
      "User Auth":           () => setIsAuthModalOpen(true),
      "IGMP Snooping":       () => setIsIGMPModalOpen(true),
      "Logs/Syslog":         () => setIsSyslogModalOpen(true),
    };
    map[label]?.() ?? console.log(`Opening ${label}`);
  };

  const value = {
    // Routing
    isRoutingModalOpen,      setIsRoutingModalOpen,
    activeRoutingTab,        setActiveRoutingTab,
    // NAT
    isNATModalOpen,          setIsNATModalOpen,
    activeNatType,           setActiveNatType,
    // ACL
    isACLModalOpen,          setIsACLModalOpen,
    activeACLSection,        setActiveACLSection,
    // DHCP
    isDHCPModalOpen,         setIsDHCPModalOpen,
    dhcpScope,               setDhcpScope,
    // VPN
    isVPNModalOpen,          setIsVPNModalOpen,
    activeVPNTab,            setActiveVPNTab,
    // SNMP
    isSNMPModalOpen,         setIsSNMPModalOpen,
    activeSNMPTab,           setActiveSNMPTab,
    // NTP
    isNTPModalOpen,          setIsNTPModalOpen,
    activeNTPTab,            setActiveNTPTab,
    // SSH
    isSSHModalOpen,          setIsSSHModalOpen,
    activeSSHTab,            setActiveSSHTab,
    // VLAN
    isVLANModalOpen,         setIsVLANModalOpen,
    activeVLANTab,           setActiveVLANTab,
    // STP
    isSTPModalOpen,          setIsSTPModalOpen,
    activeSTPTab,            setActiveSTPTab,
    // Port Security
    isPortSecurityModalOpen, setIsPortSecurityModalOpen,
    activePortSecurityTab,   setActivePortSecurityTab,
    // Trunking
    isTrunkingModalOpen,     setIsTrunkingModalOpen,
    activeTrunkTab,          setActiveTrunkTab,
    // QoS
    isQoSModalOpen,          setIsQoSModalOpen,
    activeQoSTab,            setActiveQoSTab,
    // Auth
    isAuthModalOpen,         setIsAuthModalOpen,
    activeAuthTab,           setActiveAuthTab,
    // IGMP
    isIGMPModalOpen,         setIsIGMPModalOpen,
    activeIGMPTab,           setActiveIGMPTab,
    // Syslog
    isSyslogModalOpen,       setIsSyslogModalOpen,
    activeSyslogTab,         setActiveSyslogTab,
    // Dispatcher
    handleConfigItemClick,
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
}


