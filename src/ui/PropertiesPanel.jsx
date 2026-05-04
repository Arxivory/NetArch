import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import appState from "../state/AppState";
import { UpdateEntityTransformCommand } from "../core/editor/DrawingCommands";

import RoutingModal        from "./ConfigModals/RoutingModal";
import NATModal            from "./ConfigModals/NATModal";
import ACLModal            from "./ConfigModals/ACLModal";
import DHCPModal           from "./ConfigModals/DHCPModal";
import VPNModal            from "./ConfigModals/VPNModal";
import SNMPModal           from "./ConfigModals/SNMPModal";
import NTPModal            from "./ConfigModals/NTPModal";
import SSHModal            from "./ConfigModals/SSHModal";
import VLANModal           from "./ConfigModals/VLANModal";
import STPModal            from "./ConfigModals/STPModal";
import PortSecurityModal   from "./ConfigModals/PortSecurityModal";
import QoSModal            from "./ConfigModals/QoSModal";
import AuthenticationModal from "./ConfigModals/AuthenticationModal";
import IGMPModals          from "./ConfigModals/IGMPModals";
import SyslogModal         from "./ConfigModals/SyslogModal";

// ─── Config card map (drives the Advanced Configuration grid) ─────────────────
const DEVICE_CONFIGS = {
  router: [
    { label: "Routing Protocol",    desc: "Configure OSPF, BGP, or Static routes" },
    { label: "NAT/PAT",             desc: "Translate private IPs to public addresses" },
    { label: "Access Control List", desc: "Create permit/deny traffic rules" },
    { label: "DHCP Server",         desc: "Manage IP address pools for the network" },
    { label: "VPN Config",          desc: "Set up secure site-to-site tunnels" },
    { label: "SNMP/MIB",           desc: "Configure remote monitoring and alerts" },
    { label: "NTP",                 desc: "Synchronize device clock with time servers" },
    { label: "SSH",                 desc: "Secure remote command line access" },
  ],
  switch: [
    { label: "VLAN Manager",   desc: "Create and assign Virtual LANs" },
    { label: "Spanning Tree",  desc: "Configure STP to prevent network loops" },
    { label: "Port Security",  desc: "Bind specific MAC addresses to ports" },
    { label: "VLAN Trunking",  desc: "Configure 802.1Q tags for switch links" },
    { label: "QoS Settings",   desc: "Prioritize voice or video data packets" },
    { label: "User Auth",      desc: "Configure RADIUS/802.1X port access" },
    { label: "IGMP Snooping",  desc: "Optimize multicast traffic delivery" },
    { label: "Logs/Syslog",    desc: "Export event logs to a central server" },
  ],
  pc: [
    { label: "Interface Metric",   desc: "Set priority between Wi-Fi and Ethernet" },
    { label: "802.1X Supplicant",  desc: "Configure certificate-based port auth" },
    { label: "DNS Suffix",         desc: "Set domain name for internal host lookups" },
    { label: "Static Route",       desc: "Manually override default gateway paths" },
    { label: "Wake-on-LAN",        desc: "Enable remote power-on via network" },
    { label: "Proxy Settings",     desc: "Configure web traffic filtering" },
    { label: "Local Firewall",     desc: "Manage OS-level software rules" },
    { label: "Remote Desktop",     desc: "Enable/Disable RDP or VNC access" },
  ],
  smartphone: [
    { label: "APN Settings",        desc: "Configure cellular data carrier gateway" },
    { label: "MDM Profile",         desc: "Enroll device in corporate management" },
    { label: "VPN On-Demand",       desc: "Trigger secure tunnel for work apps" },
    { label: "SSID Priority",       desc: "Manage preferred Wi-Fi network list" },
    { label: "Hotspot Config",      desc: "Manage tethering and sharing settings" },
    { label: "Certificate Manager", desc: "Install digital IDs for secure Wi-Fi" },
    { label: "Data Roaming",        desc: "Configure behavior on foreign networks" },
    { label: "Location Services",   desc: "Permissions for network-based GPS" },
  ],
};

export default function PropertiesPanel({ canvasController }) {
  // ── Entity + transform state ───────────────────────────────────────────────
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [transform, setTransform] = useState({
    position: { x: 0, y: 0, z: 0 },
    scale:    { factor: 1 },
    rotation: { x: 0, y: 0, z: 0 },
  });
  const originalLabelRef = useRef("");

  // ── Advanced Config grid modal ─────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Per-feature modal open state ──────────────────────────────────────────
  const [isRoutingModalOpen,      setIsRoutingModalOpen]      = useState(false);
  const [isNATModalOpen,          setIsNATModalOpen]          = useState(false);
  const [isACLModalOpen,          setIsACLModalOpen]          = useState(false);
  const [isDHCPModalOpen,         setIsDHCPModalOpen]         = useState(false);
  const [isVPNModalOpen,          setIsVPNModalOpen]          = useState(false);
  const [isSNMPModalOpen,         setIsSNMPModalOpen]         = useState(false);
  const [isNTPModalOpen,          setIsNTPModalOpen]          = useState(false);
  const [isSSHModalOpen,          setIsSSHModalOpen]          = useState(false);
  const [isVLANModalOpen,         setIsVLANModalOpen]         = useState(false);
  const [isSTPModalOpen,          setIsSTPModalOpen]          = useState(false);
  const [isPortSecurityModalOpen, setIsPortSecurityModalOpen] = useState(false);
  const [isQoSModalOpen,          setIsQoSModalOpen]          = useState(false);
  const [isAuthModalOpen,         setIsAuthModalOpen]         = useState(false);
  const [isIGMPModalOpen,         setIsIGMPModalOpen]         = useState(false);
  const [isSyslogModalOpen,       setIsSyslogModalOpen]       = useState(false);

  // ── Subscription: keep selectedEntity in sync with appState ───────────────
  useEffect(() => {
    const updatePanelContent = () => {
      let ids = appState.selection.getSelectedDeviceIds();
      if (!ids || ids.length === 0) {
        const focused = appState.selection.getFocusedId();
        if (focused) ids = [focused];
      }

      if (ids && ids.length > 0) {
        const entityId = ids[0];
        let entity    = findEntityById(entityId);
        let storeNode = null;

        if (appState.structural) {
          const { domains, sites, floors, spaces } = appState.structural;
          storeNode =
            (domains || []).find(d  => d.id  === entityId) ||
            (sites   || []).find(s  => s.id  === entityId) ||
            (floors  || []).find(f  => f.id  === entityId) ||
            (spaces  || []).find(sp => sp.id === entityId);
        }

        if (!storeNode && appState.network)
          storeNode = appState.network.getDevice(entityId);

        if (!storeNode && appState.furniture)
          storeNode = appState.furniture.getFurniture(entityId);

        if (entity && storeNode) {
          entity = { ...entity, label: storeNode.label || storeNode.hostname || storeNode.name };
        } else if (!entity && storeNode) {
          entity = storeNode;
        }

        if (entity) {
          setSelectedEntity(entity);
          setTransform({
            position: {
              x: entity.transform?.position?.x ?? entity.x ?? 0,
              y: entity.transform?.position?.y ?? entity.y ?? 0,
              z: entity.transform?.position?.z ?? 0,
            },
            scale:    entity.transform?.scale    ?? 1,
            rotation: {
              x: entity.transform?.rotation?.x ?? 0,
              y: entity.transform?.rotation?.y ?? 0,
              z: entity.transform?.rotation?.z ?? 0,
            },
          });
          return;
        }
      }
      setSelectedEntity(null);
    };

    const unsubscribeSelection  = appState.selection.subscribe(updatePanelContent);
    const unsubscribeStructural = appState.structural.subscribe(updatePanelContent);
    const unsubscribeNetwork    = appState.network.subscribe(updatePanelContent);
    const unsubscribeFurniture  = appState.furniture.subscribe(updatePanelContent);

    updatePanelContent();

    return () => {
      if (unsubscribeSelection)  unsubscribeSelection();
      if (unsubscribeStructural) unsubscribeStructural();
      if (unsubscribeNetwork)    unsubscribeNetwork();
      if (unsubscribeFurniture)  unsubscribeFurniture();
    };
  }, [canvasController]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const findEntityById = (id) => {
    if (!canvasController?.layout) return null;
    return canvasController.layout.findEntityById(id);
  };

  const getDeviceLabel = (id) => {
    if (!canvasController?.layout?.devices) return id;
    const d = canvasController.layout.devices.find(x => x.id === id);
    return d?.label || d?.name || id;
  };

  const getDeviceType = () => {
    if (!selectedEntity) return null;
    const typeStr  = (selectedEntity.type  || "").toLowerCase();
    const labelStr = (selectedEntity.label || "").toLowerCase().replace(/\s/g, "");
    if (typeStr.includes("router") || labelStr.includes("router")) return "router";
    if (typeStr.includes("switch") || labelStr.includes("switch")) return "switch";
    if (typeStr.includes("phone")  || labelStr.includes("phone"))  return "smartphone";
    return "pc";
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTransformChange = (type, axis, value) => {
    if (!selectedEntity || !canvasController) return;
    let numericValue = parseFloat(value);
    if (numericValue < 0 || numericValue === null) numericValue = 0;

    const updates = { [type]: { ...selectedEntity.transform[type], [axis]: numericValue } };
    const cmd = new UpdateEntityTransformCommand(canvasController, appState, selectedEntity.id, updates);
    cmd.execute();

    const entity = findEntityById(selectedEntity.id);
    if (entity) {
      setTransform({
        position: { ...entity.transform.position },
        scale:    entity.transform.scale ?? 1,
        rotation: { ...entity.transform.rotation },
      });
    }
  };

  const handleDeviceChange = (field, value) => {
    if (!selectedEntity) return;
    setSelectedEntity({ ...selectedEntity, [field]: value });
    if (field === "label" && value.trim() === "") return;
    if (appState.network?.updateDevice)
      appState.network.updateDevice(selectedEntity.id, { [field]: value });
  };

  const handleFurnitureChange = (field, value) => {
    if (!selectedEntity) return;
    setSelectedEntity({ ...selectedEntity, [field]: value });
    if (appState.furniture?.updateFurniture)
      appState.furniture.updateFurniture(selectedEntity.id, { [field]: value });
    if (canvasController?.layout) {
      const canvasEntity = canvasController.layout.findEntityById(selectedEntity.id);
      if (canvasEntity) {
        canvasEntity[field] = value;
        if (field === "label") canvasEntity.name = value;
        canvasController.layout._render();
      }
    }
  };

  const handleStructureRenameFocus = () => {
    originalLabelRef.current = selectedEntity.label || selectedEntity.name || "";
  };

  const handleStructureRenameChange = (e) => {
    const newName = e.target.value;
    setSelectedEntity({ ...selectedEntity, label: newName });
    if (newName.trim() !== "") {
      const typeStr = (selectedEntity.structureType || selectedEntity.type || "").toLowerCase();
      if (appState.structural.renameStructure)
        appState.structural.renameStructure(selectedEntity.id, newName, typeStr);
    }
  };

  const handleStructureRenameBlur = (e) => {
    if (e.target.value.trim() === "") {
      const previous = originalLabelRef.current;
      setSelectedEntity({ ...selectedEntity, label: previous });
      const typeStr = (selectedEntity.structureType || selectedEntity.type || "").toLowerCase();
      if (appState.structural.renameStructure)
        appState.structural.renameStructure(selectedEntity.id, previous, typeStr);
    }
  };

  // Dispatches clicks from the Advanced Config grid to the correct modal
  const handleConfigItemClick = (label) => {
    const map = {
      "Routing Protocol":    () => setIsRoutingModalOpen(true),
      "NAT/PAT":             () => setIsNATModalOpen(true),
      "Access Control List": () => setIsACLModalOpen(true),
      "DHCP Server":         () => setIsDHCPModalOpen(true),
      "VPN Config":          () => setIsVPNModalOpen(true),
      "SNMP/MIB":           () => setIsSNMPModalOpen(true),
      "NTP":                 () => setIsNTPModalOpen(true),
      "SSH":                 () => setIsSSHModalOpen(true),
      "VLAN Manager":        () => setIsVLANModalOpen(true),
      "Spanning Tree":       () => setIsSTPModalOpen(true),
      "Port Security":       () => setIsPortSecurityModalOpen(true),
      "QoS Settings":        () => setIsQoSModalOpen(true),
      "User Auth":           () => setIsAuthModalOpen(true),
      "IGMP Snooping":       () => setIsIGMPModalOpen(true),
      "Logs/Syslog":         () => setIsSyslogModalOpen(true),
    };
    map[label]?.() ?? console.log(`Opening ${label}`);
  };

  // ── Derived flags ──────────────────────────────────────────────────────────
  const deviceType   = getDeviceType();
  const configGroups = [{ category: "Advanced Configuration", items: DEVICE_CONFIGS[deviceType] || [] }];

  const isDevice = selectedEntity && selectedEntity.interfaces !== undefined;
  const isCable  = selectedEntity && selectedEntity.sourceId !== undefined && selectedEntity.targetId !== undefined;
  const isWall   = selectedEntity && selectedEntity.type === "wall";
  const isStructure = selectedEntity && (
    selectedEntity.structureType === "Domain" ||
    selectedEntity.structureType === "Site"   ||
    selectedEntity.structureType === "Floor"  ||
    selectedEntity.structureType === "Space"  ||
    ["space", "site", "domain", "floor"].includes(selectedEntity.type)
  );
  const isFurniture = selectedEntity && !isDevice && !isCable && !isWall && !isStructure;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="properties-panel">
      <h3>Properties</h3>

      {/* ── Cable ─────────────────────────────────────────────────────────── */}
      {isCable && (
        <div className="properties-group">
          <div><label>Cable Type</label>    <input className="field-input" value={selectedEntity.type       || ""} readOnly /></div>
          <div><label>Source Device</label> <input className="field-input" value={getDeviceLabel(selectedEntity.sourceId)} readOnly /></div>
          <div><label>Source Port</label>   <input className="field-input" value={selectedEntity.sourcePort || ""} readOnly /></div>
          <div><label>Target Device</label> <input className="field-input" value={getDeviceLabel(selectedEntity.targetId)} readOnly /></div>
          <div><label>Target Port</label>   <input className="field-input" value={selectedEntity.targetPort || ""} readOnly /></div>
        </div>
      )}

      {/* ── Wall ──────────────────────────────────────────────────────────── */}
      {isWall && (
        <div className="properties-group">
          <div><label>Wall Name</label><input className="field-input" value={selectedEntity.label || "Wall"} readOnly /></div>
          <div>
            <label>Material</label>
            <select className="field-input">
              <option>Concrete</option><option>Wood</option><option>Glass</option><option>Metal</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Network Device ────────────────────────────────────────────────── */}
      {isDevice && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div>
            <label>Device Name</label>
            <input className="field-input" value={selectedEntity?.label || ""}
              onChange={(e) => handleDeviceChange("label", e.target.value)} />
          </div>
          <div>
            <label>IP Address</label>
            <input className="field-input" value={selectedEntity?.interfaces?.[0]?.ipv4?.address || ""}
              onChange={(e) => handleDeviceChange("ipAddress", e.target.value)} />
          </div>
          <div>
            <label>Subnet Mask</label>
            <input className="field-input" value={selectedEntity?.interfaces?.[0]?.ipv4?.subnetMask || ""}
              onChange={(e) => handleDeviceChange("subnetMask", e.target.value)} />
          </div>
          <div>
            <label>Default Gateway</label>
            <input className="field-input" value={selectedEntity?.defaultGateway || ""}
              onChange={(e) => handleDeviceChange("defaultGateway", e.target.value)} />
          </div>
          <button className="floor-specifier-btn" onClick={() => setIsModalOpen(true)}>
            Advanced Configuration
          </button>
        </div>
      )}

      {/* ── Furniture ─────────────────────────────────────────────────────── */}
      {isFurniture && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div>
            <label>Furniture Name</label>
            <input className="field-input" value={selectedEntity?.label || ""}
              onChange={(e) => handleFurnitureChange("label", e.target.value)} />
          </div>
        </div>
      )}

      {/* ── Structure (Domain / Site / Floor / Space) ─────────────────────── */}
      {isStructure && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div>
            <label>Name</label>
            <input
              className="field-input"
              value={selectedEntity.label ?? selectedEntity.name ?? ""}
              onFocus={handleStructureRenameFocus}
              onChange={handleStructureRenameChange}
              onBlur={handleStructureRenameBlur}
            />
          </div>
          <div><label>Type</label><input className="field-input" value={selectedEntity.structureType || selectedEntity.type || ""} readOnly /></div>
          <div>
            <label>Material</label>
            <select className="field-input">
              <option>Concrete</option><option>Wood</option><option>Tile</option><option>Carpet</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Transform ─────────────────────────────────────────────────────── */}
      <hr className="header-separator" />
      <h3>Transformations</h3>
      {selectedEntity ? (
        <>
          <div className="transform-header"><span></span><span>X</span><span>Y</span><span>Z</span></div>
          <div className="transform-grid">
            <label>Position</label>
            <input type="number" className="field-input" value={transform.position.x} onChange={(e) => handleTransformChange("position", "x", e.target.value)} />
            <input type="number" className="field-input" value={transform.position.y} onChange={(e) => handleTransformChange("position", "y", e.target.value)} />
            <input type="number" className="field-input" value={transform.position.z} onChange={(e) => handleTransformChange("position", "z", e.target.value)} />
          </div>
          <div className="transform-grid">
            <label>Scale</label>
            <input type="number" className="field-input" value={transform.scale.factor} onChange={(e) => handleTransformChange("scale", "factor", e.target.value)} />
            <input type="number" className="field-input" defaultValue={0} disabled />
            <input type="number" className="field-input" defaultValue={0} disabled />
          </div>
          <div className="transform-grid">
            <label>Rotation</label>
            <input type="number" className="field-input" value={transform.rotation.x} onChange={(e) => handleTransformChange("rotation", "x", e.target.value)} />
            <input type="number" className="field-input" value={transform.rotation.y} onChange={(e) => handleTransformChange("rotation", "y", e.target.value)} />
            <input type="number" className="field-input" value={transform.rotation.z} onChange={(e) => handleTransformChange("rotation", "z", e.target.value)} />
          </div>
        </>
      ) : (
        <p className="empty-selection-msg">Select an entity to see transform properties</p>
      )}

      {/* ── Advanced Config grid (entry point) ────────────────────────────── */}
      {isModalOpen && createPortal(
        <div className="config-modal-overlay">
          <div className="config-modal-content">
            <div className="modal-header">
              <h2>Advanced {deviceType?.toUpperCase()} Configuration: {selectedEntity?.label}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {configGroups.map((group) => (
                <div key={group.category} className="config-section">
                  <div className="config-grid">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className="config-item-card"
                        onClick={() => handleConfigItemClick(item.label)}
                      >
                        <div className="config-text">
                          <div className="config-label">{item.label}</div>
                          <div className="config-desc">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Individual modal slots ─────────────────────────────────────────── */}
      {isRoutingModalOpen && (
  <RoutingModal
    onClose={() => setIsRoutingModalOpen(false)}
    deviceName={selectedEntity?.label || "Router"}
    deviceLocation={
      (() => {
        if (!selectedEntity || !canvasController?.layout) return "Unknown";
        // Walk up the hierarchy: find which floor/space the device is on
        const floors = appState.structural?.floors || [];
        const spaces = appState.structural?.spaces || [];
        const matchSpace = spaces.find(sp => sp.deviceIds?.includes(selectedEntity.id));
        if (matchSpace) return matchSpace.label || matchSpace.name || "Unknown Space";
        const matchFloor = floors.find(f => f.deviceIds?.includes(selectedEntity.id));
        if (matchFloor) return matchFloor.label || matchFloor.name || "Unknown Floor";
        return "Unknown Location";
      })()
    }
  />
)}
      {isNATModalOpen          && <NATModal            onClose={() => setIsNATModalOpen(false)}          />}
      {isACLModalOpen          && <ACLModal            onClose={() => setIsACLModalOpen(false)}          />}
      {isDHCPModalOpen         && <DHCPModal           onClose={() => setIsDHCPModalOpen(false)}         />}
      {isVPNModalOpen          && <VPNModal            onClose={() => setIsVPNModalOpen(false)}          />}
      {isSNMPModalOpen         && <SNMPModal           onClose={() => setIsSNMPModalOpen(false)}         />}
      {isNTPModalOpen          && <NTPModal            onClose={() => setIsNTPModalOpen(false)}          />}
      {isSSHModalOpen          && <SSHModal            onClose={() => setIsSSHModalOpen(false)}          />}
      {isVLANModalOpen         && <VLANModal           onClose={() => setIsVLANModalOpen(false)}         />}
      {isSTPModalOpen          && <STPModal            onClose={() => setIsSTPModalOpen(false)}          />}
      {isPortSecurityModalOpen && <PortSecurityModal   onClose={() => setIsPortSecurityModalOpen(false)} />}
      {isQoSModalOpen          && <QoSModal            onClose={() => setIsQoSModalOpen(false)}          />}
      {isAuthModalOpen         && <AuthenticationModal onClose={() => setIsAuthModalOpen(false)}         />}
      {isIGMPModalOpen         && <IGMPModals          onClose={() => setIsIGMPModalOpen(false)}         />}
      {isSyslogModalOpen       && <SyslogModal         onClose={() => setIsSyslogModalOpen(false)}       />}
    </div>
  );
}