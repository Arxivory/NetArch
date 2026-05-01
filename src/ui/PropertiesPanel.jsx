import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import appState from "../state/AppState";
import { UpdateEntityTransformCommand } from "../core/editor/DrawingCommands";
import { Network, ArrowLeftRight, Server, Lock, Activity, Clock,
        Terminal, ArrowDown, Map, Layers, Cable, GitBranch, ShieldCheck, ServerIcon} from "lucide-react";

const DEVICE_CONFIGS = {
  router: [
    { label: "Routing Protocol", desc: "Configure OSPF, BGP, or Static routes", icon: Network },
    { label: "NAT/PAT", desc: "Translate private IPs to public addresses", icon: ArrowLeftRight },
    { label: "Access Control List", desc: "Create permit/deny traffic rules", icon: ShieldCheck },
    { label: "DHCP Server", desc: "Manage IP address pools for the network", icon: Server },
    { label: "VPN Config", desc: "Set up secure site-to-site tunnels", icon: Lock },
    { label: "SNMP/MIB", desc: "Configure remote monitoring and alerts", icon: Activity },
    { label: "NTP", desc: "Synchronize device clock with time servers", icon: Clock },
    { label: "SSH", desc: "Secure remote command line access", icon: Terminal }
  ],
  switch: [
    { label: "VLAN Manager", desc: "Create and assign        Virtual LANs", icon: Network },
    { label: "Spanning Tree", desc: "Configure STP to prevent network loops", icon: GitBranch },
    { label: "Port Security", desc: "Bind specific MAC addresses to ports", icon: ShieldCheck },
    { label: "VLAN Trunking", desc: "Configure 802.1Q tags for switch links", icon: ArrowLeftRight },
    { label: "QoS Settings", desc: "Prioritize voice or video data packets", icon: Activity },
    { label: "User Auth", desc: "Configure RADIUS/802.1X port access", icon: Lock },
    { label: "IGMP Snooping", desc: "Optimize multicast traffic delivery", icon: Layers },
    { label: "Logs/Syslog", desc: "Export event logs to a central server", icon: ServerIcon }
  ],
  pc: [
    { label: "Interface Metric", desc: "Set priority between Wi-Fi and Ethernet" },
    { label: "802.1X Supplicant", desc: "Configure certificate-based port auth" },
    { label: "DNS Suffix", desc: "Set domain name for internal host lookups" },
    { label: "Static Route", desc: "Manually override default gateway paths" },
    { label: "Wake-on-LAN", desc: "Enable remote power-on via network" },
    { label: "Proxy Settings", desc: "Configure web traffic filtering" },
    { label: "Local Firewall", desc: "Manage OS-level software rules" },
    { label: "Remote Desktop", desc: "Enable/Disable RDP or VNC access" }
  ],
  smartphone: [
    { label: "APN Settings", desc: "Configure cellular data carrier gateway" },
    { label: "MDM Profile", desc: "Enroll device in corporate management" },
    { label: "VPN On-Demand", desc: "Trigger secure tunnel for work apps" },
    { label: "SSID Priority", desc: "Manage preferred Wi-Fi network list" },
    { label: "Hotspot Config", desc: "Manage tethering and sharing settings" },
    { label: "Certificate Manager", desc: "Install digital IDs for secure Wi-Fi" },
    { label: "Data Roaming", desc: "Configure behavior on foreign networks" },
    { label: "Location Services", desc: "Permissions for network-based GPS" }
  ]
};

export default function PropertiesPanel({ canvasController }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);
  const [activeRoutingTab, setActiveRoutingTab] = useState("ospf");
  const [isNATModalOpen, setIsNATModalOpen] = useState(false);
  const [activeNatType, setActiveNatType] = useState("pat"); // 'pat', 'static', 'dynamic', 'forward'
  const [isACLModalOpen, setIsACLModalOpen] = useState(false);
  const [activeACLSection, setActiveACLSection] = useState("config");
  const [isDHCPModalOpen, setIsDHCPModalOpen] = useState(false);
  const [dhcpScope, setDhcpScope] = useState("basic"); // basic | pool | reservation | advanced
  const [isVPNModalOpen, setIsVPNModalOpen] = useState(false);
  const [activeVPNTab, setActiveVPNTab] = useState("tunnel"); 
  const [isSNMPModalOpen, setIsSNMPModalOpen] = useState(false);
  const [activeSNMPTab, setActiveSNMPTab] = useState("agent"); 
  const [isNTPModalOpen, setIsNTPModalOpen] = useState(false);
  const [activeNTPTab, setActiveNTPTab] = useState("server");
  const [isSSHModalOpen, setIsSSHModalOpen] = useState(false);
  const [activeSSHTab, setActiveSSHTab] = useState("general");
  const [isVLANModalOpen, setIsVLANModalOpen] = useState(false);
  const [activeVLANTab, setActiveVLANTab] = useState("vlans");
  const [isSTPModalOpen, setIsSTPModalOpen] = useState(false);
const [activeSTPTab, setActiveSTPTab] = useState("global");

const [isPortSecurityModalOpen, setIsPortSecurityModalOpen] = useState(false);
const [activePortSecurityTab, setActivePortSecurityTab] = useState("mac");

const [isQoSModalOpen, setIsQoSModalOpen] = useState(false);
const [activeQoSTab, setActiveQoSTab] = useState("classification");

const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
const [activeAuthTab, setActiveAuthTab] = useState("radius");

const [isIGMPModalOpen, setIsIGMPModalOpen] = useState(false);
const [activeIGMPTab, setActiveIGMPTab] = useState("snooping");

const [isSyslogModalOpen, setIsSyslogModalOpen] = useState(false);
const [activeSyslogTab, setActiveSyslogTab] = useState("servers");

  const [activeTab, setActiveTab] = useState("basic"); // For switching tabs
  const [ospfNetworks, setOspfNetworks] = useState([{ id: Date.now(), network: "", areaId: "" }]); 

  const [transform, setTransform] = useState({
    position: { x: 0, y: 0, z: 0 },
    scale: { factor: 1 },
    rotation: { x: 0, y: 0, z: 0 }
  });
  const originalLabelRef = useRef("");

useEffect(() => {
    const updatePanelContent = () => {
      let ids = appState.selection.getSelectedDeviceIds();
      if (!ids || ids.length === 0) {
        const focused = appState.selection.getFocusedId();
        if (focused) ids = [focused];
      }

      if (ids && ids.length > 0) {
        const entityId = ids[0];
        let entity = findEntityById(entityId);
        let storeNode = null;
        
        if (appState.structural) {
          const { domains, sites, floors, spaces } = appState.structural;
          storeNode = 
            (domains || []).find(d => d.id === entityId) || 
            (sites || []).find(s => s.id === entityId) || 
            (floors || []).find(f => f.id === entityId) || 
            (spaces || []).find(sp => sp.id === entityId);
        }
        
        if (!storeNode && appState.network) {
            storeNode = appState.network.getDevice(entityId);
        }
        
        if (!storeNode && appState.furniture) {
            storeNode = appState.furniture.getFurniture(entityId);
        }

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
              z: entity.transform?.position?.z ?? 0
            },
            scale: entity.transform?.scale ?? 1,
            rotation: {
              x: entity.transform?.rotation?.x ?? 0,
              y: entity.transform?.rotation?.y ?? 0,
              z: entity.transform?.rotation?.z ?? 0
            }
          });
          return;
        }
      }
      setSelectedEntity(null);
    };

    const unsubscribeSelection = appState.selection.subscribe(updatePanelContent);
    const unsubscribeStructural = appState.structural.subscribe(updatePanelContent);
    const unsubscribeNetwork = appState.network.subscribe(updatePanelContent);
    const unsubscribeFurniture = appState.furniture.subscribe(updatePanelContent);

    updatePanelContent();

    return () => {
      if (unsubscribeSelection) unsubscribeSelection();
      if (unsubscribeStructural) unsubscribeStructural();
      if (unsubscribeNetwork) unsubscribeNetwork();
      if (unsubscribeFurniture) unsubscribeFurniture();
    };
  }, [canvasController]);

  const findEntityById = (id) => {
    if (canvasController?.layout) {
      const layoutEntity = canvasController.layout.findEntityById(id);
      if (layoutEntity) return layoutEntity;
    }

    const networkEntity = appState.network?.getDevice?.(id);
    if (networkEntity) {
      return {
        ...networkEntity,
        transform: {
          position: {
            x: networkEntity.position?.x ?? 0,
            y: networkEntity.position?.y ?? 0,
            z: networkEntity.position?.z ?? 0
          },
          scale: { x: 1, y: 1, z: 1 },
          rotation: { x: 0, y: 0, z: 0 }
        }
      };
    }

    const furnitureEntity = appState.furniture?.getFurniture?.(id);
    if (furnitureEntity) {
      return furnitureEntity;
    }

    return null;
  };

  const getDeviceLabel = (id) => {
    if (!canvasController?.layout?.devices) return id;
    const d = canvasController.layout.devices.find(x => x.id === id);
    return d?.label || d?.name || id;
  };

  const getDeviceType = () => {
    if (!selectedEntity) return null;
    const typeStr = (selectedEntity.type || "").toLowerCase();
    const labelStr = (selectedEntity.label || "").toLowerCase().replace(/\s/g, '');
    if (typeStr.includes('router') || labelStr.includes('router')) return 'router';
    if (typeStr.includes('switch') || labelStr.includes('switch')) return 'switch';
    if (typeStr.includes('phone') || labelStr.includes('phone')) return 'smartphone';
    return "pc";
  };

  const deviceType = getDeviceType();
  const configGroups = [
    {
      category: "Advanced Configuration",
      items: DEVICE_CONFIGS[deviceType] || []
    }
  ];

  const isDevice = selectedEntity && selectedEntity.interfaces !== undefined;
  const isCable = selectedEntity && selectedEntity.sourceId !== undefined && selectedEntity.targetId !== undefined;
  const isWall = selectedEntity && selectedEntity.type === "wall";
  const isStructure = selectedEntity && (
      selectedEntity.structureType === "Domain" ||
      selectedEntity.structureType === "Site" ||
      selectedEntity.structureType === "Floor" ||
      selectedEntity.structureType === "Space" ||
      selectedEntity.type === "space" ||
      selectedEntity.type === "site" ||
      selectedEntity.type === "domain" ||
      selectedEntity.type === "floor"
    );
  const isFurniture = selectedEntity && !isDevice && !isCable && !isWall && !isStructure;

  const handleTransformChange = (type, axis, value) => {
    if (!selectedEntity || !canvasController) return;
    let numericValue = parseFloat(value);
    if (numericValue < 0 || numericValue === null) numericValue = 0;

    const updates = {
      [type]: {
        ...selectedEntity.transform[type],
        [axis]: numericValue
      }
    };

    const cmd = new UpdateEntityTransformCommand(canvasController, appState, selectedEntity.id, updates);
    cmd.execute();
    
    const entity = findEntityById(selectedEntity.id);
    if (entity) {
      setTransform({
        position: { ...entity.transform.position },
        scale: entity.transform.scale ?? 1,
        rotation: { ...entity.transform.rotation }
      });
    }
  };
  
  const handleDeviceChange = (field, value) => {
    if (!selectedEntity) return;
    const updatedEntity = { ...selectedEntity, [field]: value };
    setSelectedEntity(updatedEntity);
    if (field === 'label' && value.trim() === '') return; 
    if (appState.network && appState.network.updateDevice) {
      appState.network.updateDevice(selectedEntity.id, { [field]: value });
    }
  };

  const handleFurnitureChange = (field, value) => {
    if (!selectedEntity) return;
    const updatedEntity = { ...selectedEntity, [field]: value };
    setSelectedEntity(updatedEntity);
    if (appState.furniture && appState.furniture.updateFurniture) {
      appState.furniture.updateFurniture(selectedEntity.id, { [field]: value });
    }
    if (canvasController && canvasController.layout) {
      const canvasEntity = canvasController.layout.findEntityById(selectedEntity.id);
      if (canvasEntity) {
        canvasEntity[field] = value;
        if (field === 'label') canvasEntity.name = value;
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
      if (appState.structural.renameStructure) {
        appState.structural.renameStructure(selectedEntity.id, newName, typeStr);
      }
    }
  };

  const handleStructureRenameBlur = (e) => {
    if (e.target.value.trim() === "") {
      const previousLabel = originalLabelRef.current;
      setSelectedEntity({ ...selectedEntity, label: previousLabel });
      const typeStr = (selectedEntity.structureType || selectedEntity.type || "").toLowerCase();
      if (appState.structural.renameStructure) {
        appState.structural.renameStructure(selectedEntity.id, previousLabel, typeStr);
      }
    }
  };

  const handleConfigItemClick = (label) => {
  if (label === "Routing Protocol") {
  setIsRoutingModalOpen(true);
  }
  else if (label === "NAT/PAT") {
    setIsNATModalOpen(true);
  } 
  else if (label === "Access Control List") {
    setIsACLModalOpen(true);
  }
  else if (label === "DHCP Server") {
  setIsDHCPModalOpen(true);
  }
  else if (label === "VPN Config") {
  setIsVPNModalOpen(true);
  }
  else if (label === "SNMP/MIB") {
  setIsSNMPModalOpen(true);
  }
  else if (label === "NTP") {
  setIsNTPModalOpen(true);
  }
  else if (label === "SSH") {
    setIsSSHModalOpen(true);
  }
  else if (label === "VLAN Manager") {
    setIsVLANModalOpen(true);
  }
  else if (label === "Spanning Tree") {
    setIsSTPModalOpen(true);
  }
  else if (label === "Port Security") {
    setIsPortSecurityModalOpen(true);
  }
  else if (label === "QoS Settings") {
    setIsQoSModalOpen(true);
  }
  else if (label === "User Auth") {
    setIsAuthModalOpen(true);
  }
  else if (label === "IGMP Snooping") {
    setIsIGMPModalOpen(true);
  }
  else if (label === "Logs/Syslog") {
    setIsSyslogModalOpen(true);
  }
  else {
    console.log(`Opening ${label}`);
  }
};

  return (
    <div className="properties-panel">
      <h3>Properties</h3>

      {isCable && (
        <div className="properties-group">
          <div><label>Cable Type</label><input className="field-input" value={selectedEntity.type || ""} readOnly /></div>
          <div><label>Source Device</label><input className="field-input" value={getDeviceLabel(selectedEntity.sourceId)} readOnly /></div>
          <div><label>Source Port</label><input className="field-input" value={selectedEntity.sourcePort || ""} readOnly /></div>
          <div><label>Target Device</label><input className="field-input" value={getDeviceLabel(selectedEntity.targetId)} readOnly /></div>
          <div><label>Target Port</label><input className="field-input" value={selectedEntity.targetPort || ""} readOnly /></div>
        </div>
      )}

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

      {isDevice && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div><label>Device Name</label>
            <input className="field-input" value={selectedEntity?.label || ""} onChange={(e) => handleDeviceChange('label', e.target.value)} />
          </div>
          <div><label>IP Address</label>
            <input className="field-input" value={selectedEntity?.interfaces?.[0]?.ipv4?.address || ""} onChange={(e) => handleDeviceChange('ipAddress', e.target.value)} />
          </div>
          <div><label>Subnet Mask</label>
            <input className="field-input" value={selectedEntity?.interfaces?.[0]?.ipv4?.subnetMask || ""} onChange={(e) => handleDeviceChange('subnetMask', e.target.value)} />
          </div>
          <div><label>Default Gateway</label>
            <input className="field-input" value={selectedEntity?.defaultGateway || ""} onChange={(e) => handleDeviceChange('defaultGateway', e.target.value)} />
          </div>
          <button className="floor-specifier-btn" onClick={() => setIsModalOpen(true)}>
            Advanced Configuration
          </button>
        </div>
      )}

      {isFurniture && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div><label>Furniture Name</label>
            <input className="field-input" value={selectedEntity?.label || ""} onChange={(e) => handleFurnitureChange('label', e.target.value)} />
          </div>
        </div>
      )}

      {isStructure && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div><label>Name</label>
            <input className="field-input" value={selectedEntity.label ?? selectedEntity.name ?? ""} onFocus={handleStructureRenameFocus} onChange={handleStructureRenameChange} onBlur={handleStructureRenameBlur} />
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

      <hr className="header-separator" />
      <h3>Transformations</h3>
      {selectedEntity ? (
        <>
          <div className="transform-header"><span></span><span>X</span><span>Y</span><span>Z</span></div>
          <div className="transform-grid">
            <label>Position</label>
            <input type="number" className="field-input" value={transform.position.x} onChange={(e) => handleTransformChange('position', 'x', e.target.value)} />
            <input type="number" className="field-input" value={transform.position.y} onChange={(e) => handleTransformChange('position', 'y', e.target.value)} />
            <input type="number" className="field-input" value={transform.position.z} onChange={(e) => handleTransformChange('position', 'z', e.target.value)} />
          </div>
          <div className="transform-grid">
            <label>Scale</label>
            <input type="number" className="field-input" value={transform.scale.factor} onChange={(e) => handleTransformChange('scale', 'factor', e.target.value)} />
            <input type="number" className="field-input" defaultValue={0} disabled /><input type="number" className="field-input" defaultValue={0} disabled />
          </div>
          <div className="transform-grid">
            <label>Rotation</label>
            <input type="number" className="field-input" value={transform.rotation.x} onChange={(e) => handleTransformChange('rotation', 'x', e.target.value)} />
            <input type="number" className="field-input" value={transform.rotation.y} onChange={(e) => handleTransformChange('rotation', 'y', e.target.value)} />
            <input type="number" className="field-input" value={transform.rotation.z} onChange={(e) => handleTransformChange('rotation', 'z', e.target.value)} />
          </div>
        </>
      ) : (
        <p className="empty-selection-msg">Select an entity to see transform properties</p>
      )}

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
                    {group.items.map((item) => {
            const Icon = item.icon;

         return (
            <div key={item.label} className="config-item-card" onClick={() => handleConfigItemClick(item.label)}>
              {Icon && <Icon size={24} className="config-icon" />}

            <div className="config-text">
            <div className="config-label">{item.label}</div>
            <div className="config-desc">{item.desc}</div>
                  </div>

              </div>
           );
        })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {isRoutingModalOpen && createPortal(
  <div className="config-modal-overlay nat-modal-layer">

    <div className="config-modal-content nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">
        <div className="sidebar-header">
          <Network size={20} />
          <span>Routing Protocol Configuration</span>
        </div>

        <div className="nav-list">

          <button className={`nav-item ${activeRoutingTab === 'ospf' ? 'active' : ''}`} onClick={() => setActiveRoutingTab('ospf')}>
            <div className="nav-icon"><Activity size={16} /></div>
            <div className="nav-text"><strong>OSPF</strong><p>Dynamic internal routing</p></div>
          </button>

          <button className={`nav-item ${activeRoutingTab === 'bgp' ? 'active' : ''}`} onClick={() => setActiveRoutingTab('bgp')}>
            <div className="nav-icon"><ArrowLeftRight size={16} /></div>
            <div className="nav-text"><strong>BGP</strong><p>External / ISP routing</p></div>
          </button>

          <button className={`nav-item ${activeRoutingTab === 'static' ? 'active' : ''}`} onClick={() => setActiveRoutingTab('static')}>
            <div className="nav-icon"><Map size={16} /></div>
            <div className="nav-text"><strong>Static Routes</strong><p>Manual control</p></div>
          </button>

          <button className={`nav-item ${activeRoutingTab === 'control' ? 'active' : ''}`} onClick={() => setActiveRoutingTab('control')}>
            <div className="nav-icon"><Server size={16} /></div>
            <div className="nav-text"><strong>Route Control</strong><p>Filters & redistribution</p></div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>{activeRoutingTab.toUpperCase()} SETTINGS</h3>
          <button className="close-btn-mono" onClick={() => setIsRoutingModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* ================= GLOBAL ================= */}
          <div className="config-group-mono">
            <label>Global Routing Settings</label>

            <div className="inline-fields">
              <div className="input-wrap">
                <span>Router ID</span>
                <input placeholder="1.1.1.1" />
              </div>

              <div className="input-wrap">
                <span>Default Route</span>
                <input placeholder="0.0.0.0/0 → 192.168.1.1" />
              </div>
            </div>
          </div>

          {/* ================= DYNAMIC CONTENT ================= */}
          <div className="config-group-mono highlight-area">

            {/* ================= OSPF ================= */}
            {activeRoutingTab === 'ospf' && (
              <>
                <label>OSPF Configuration</label>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Process ID</span>
                    <input placeholder="1" />
                  </div>

                  <div className="input-wrap">
                    <span>Area Type</span>
                    <select>
                      <option>Backbone (Area 0)</option>
                      <option>Stub Area</option>
                      <option>NSSA</option>
                    </select>
                  </div>
                </div>

                <div className="input-wrap">
                  <span>Networks (CIDR)</span>
                  <input placeholder="192.168.1.0/24, 10.0.0.0/8" />
                </div>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Hello Timer</span>
                    <input placeholder="10s" />
                  </div>

                  <div className="input-wrap">
                    <span>Dead Timer</span>
                    <input placeholder="40s" />
                  </div>
                </div>

                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable OSPF Authentication</span>
                </div>
              </>
            )}

            {/* ================= BGP ================= */}
            {activeRoutingTab === 'bgp' && (
              <>
                <label>BGP Configuration</label>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Local AS</span>
                    <input placeholder="65001" />
                  </div>

                  <div className="input-wrap">
                    <span>Keepalive Timer</span>
                    <input placeholder="60s" />
                  </div>
                </div>

                <label>Neighbors</label>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Neighbor IP</span>
                    <input placeholder="203.0.113.1" />
                  </div>

                  <div className="input-wrap">
                    <span>Remote AS</span>
                    <input placeholder="65002" />
                  </div>
                </div>

                <div className="input-wrap">
                  <span>Advertised Networks</span>
                  <input placeholder="10.0.0.0/8" />
                </div>

                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable Route Reflector</span>
                </div>
              </>
            )}

            {/* ================= STATIC ================= */}
            {activeRoutingTab === 'static' && (
              <>
                <label>Static Route</label>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Destination</span>
                    <input placeholder="10.0.0.0/8" />
                  </div>

                  <div className="input-wrap">
                    <span>Next Hop</span>
                    <input placeholder="192.168.1.1" />
                  </div>
                </div>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Metric</span>
                    <input placeholder="1" />
                  </div>

                  <div className="input-wrap">
                    <span>Interface</span>
                    <select>
                      <option>G0/0</option>
                      <option>G0/1</option>
                    </select>
                  </div>
                </div>

                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Floating Route (backup)</span>
                </div>
              </>
            )}

            {/* ================= CONTROL ================= */}
            {activeRoutingTab === 'control' && (
              <>
                <label>Route Control & Policies</label>

                <div className="input-wrap">
                  <span>Route Redistribution</span>
                  <select>
                    <option>None</option>
                    <option>OSPF → BGP</option>
                    <option>BGP → OSPF</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Route Filtering (ACL)</span>
                  <input placeholder="Permit 192.168.0.0/16" />
                </div>

                <div className="input-wrap">
                  <span>Max Routes</span>
                  <input placeholder="1000" />
                </div>

                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable Route Logging</span>
                </div>
              </>
            )}

          </div>

        </div>

        <div className="modal-footer-clean">
          <button className="btn-secondary" onClick={() => setIsRoutingModalOpen(false)}>Cancel</button>
          <button className="btn-primary">Apply Routing</button>
        </div>

      </div>
    </div>
  </div>,
  document.body
)}

{isNATModalOpen && createPortal(
  <div className="config-modal-overlay nat-modal-layer">
    <div className="config-modal-content nat-sidebar-layout">
      
      {/* SIDEBAR */}
      <div className="nat-sidebar">
        <div className="sidebar-header">
          <ArrowLeftRight size={20} />
          <span>NAT Configuration</span>
        </div>
        
        <div className="nav-list">
          <button className={`nav-item ${activeNatType === 'pat' ? 'active' : ''}`} onClick={() => setActiveNatType('pat')}>
            <div className="nav-icon"><Activity size={16} /></div>
            <div className="nav-text"><strong>PAT (Overload)</strong><p>Many-to-One</p></div>
          </button>
          
          <button className={`nav-item ${activeNatType === 'static' ? 'active' : ''}`} onClick={() => setActiveNatType('static')}>
            <div className="nav-icon"><Server size={16} /></div>
            <div className="nav-text"><strong>Static NAT</strong><p>One-to-One / Port</p></div>
          </button>

          <button className={`nav-item ${activeNatType === 'dynamic' ? 'active' : ''}`} onClick={() => setActiveNatType('dynamic')}>
            <div className="nav-icon"><Network size={16} /></div>
            <div className="nav-text"><strong>Dynamic NAT</strong><p>Pool Mapping</p></div>
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="nat-main-content">
        <div className="modal-header-clean">
          <h3>{activeNatType.toUpperCase()} Settings</h3>
          <button className="close-btn-mono" onClick={() => setIsNATModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* INTERFACES */}
          <div className="config-group-mono">
            <label>Interface Assignment</label>
            <div className="inline-fields">
              <div className="input-wrap">
                <span>Inside</span>
                <select><option>G0/0 (LAN)</option></select>
              </div>
              <div className="input-wrap">
                <span>Outside</span>
                <select><option>G0/1 (WAN)</option></select>
              </div>
            </div>
          </div>

          {/* ACL BUILDER (NEW) */}
          <div className="config-group-mono">
            <label>Access Control List (ACL)</label>
            <div className="inline-fields">
              <div className="input-wrap">
                <span>ACL ID</span>
                <input type="text" placeholder="1" />
              </div>
              <div className="input-wrap">
                <span>Source Network</span>
                <input type="text" placeholder="192.168.1.0" />
              </div>
              <div className="input-wrap">
                <span>Wildcard Mask</span>
                <input type="text" placeholder="0.0.0.255" />
              </div>
            </div>
          </div>

          {/* DYNAMIC CONTENT */}
          <div className="config-group-mono highlight-area">

            {/* PAT */}
            {activeNatType === 'pat' && (
              <>
                <label>PAT Configuration</label>

                <div className="input-wrap">
                  <span>Translation Mode</span>
                  <select>
                    <option>Use Interface IP</option>
                    <option>Use NAT Pool</option>
                  </select>
                </div>

                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable Overload (Port Translation)</span>
                </div>
              </>
            )}

            {/* STATIC NAT + STATIC PAT */}
            {activeNatType === 'static' && (
              <>
                <label>Static Mapping</label>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Private IP</span>
                    <input placeholder="192.168.1.10" />
                  </div>
                  <div className="input-wrap">
                    <span>Public IP</span>
                    <input placeholder="203.0.113.5" />
                  </div>
                </div>

                <label style={{ marginTop: "15px" }}>Port Forwarding (Static PAT)</label>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Private Port</span>
                    <input placeholder="80" />
                  </div>
                  <div className="input-wrap">
                    <span>Public Port</span>
                    <input placeholder="8080" />
                  </div>
                </div>
              </>
            )}

            {/* DYNAMIC NAT */}
            {activeNatType === 'dynamic' && (
  <>
    <label>NAT Pool</label>

    <div className="input-wrap">
      <span>Pool Name</span>
      <input placeholder="MYPOOL" />
    </div>

    <div className="inline-fields">
      <div className="input-wrap">
        <span>Start IP</span>
        <input placeholder="203.0.113.10" />
      </div>

      <div className="input-wrap">
        <span>End IP</span>
        <input placeholder="203.0.113.20" />
      </div>

      <div className="input-wrap">
        <span>Netmask</span>
        <input placeholder="255.255.255.224" />
      </div>
    </div>

    {/* FIXED ACL BINDING SECTION (IMPORTANT MISSING UI PART) */}
    <div className="input-wrap">
      <span>Bind ACL ID</span>
      <input placeholder="1" />
    </div>
  </>
)}

          </div>

          

        </div>

        <div className="modal-footer-clean">
          <button className="btn-secondary" onClick={() => setIsNATModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => setIsNATModalOpen(false)}>Apply Changes</button>
        </div>
      </div>
    </div>
  </div>,
  document.body
)}

{isACLModalOpen && createPortal(
  <div className="config-modal-overlay nat-modal-layer">

    <div className="config-modal-content nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">
        <div className="sidebar-header">
          <ShieldCheck size={20} />
          <span>Access Control List Configuration</span>
        </div>

        <div className="nav-list">

          <button className={`nav-item ${activeACLSection === 'rules' ? 'active' : ''}`} onClick={() => setActiveACLSection('rules')}>
            <div className="nav-icon"><Lock size={16} /></div>
            <div className="nav-text"><strong>ACL Rules</strong><p>Permit / Deny logic</p></div>
          </button>

          <button className={`nav-item ${activeACLSection === 'binding' ? 'active' : ''}`} onClick={() => setActiveACLSection('binding')}>
            <div className="nav-icon"><Network size={16} /></div>
            <div className="nav-text"><strong>Interface Binding</strong><p>Apply ACL to ports</p></div>
          </button>

          <button className={`nav-item ${activeACLSection === 'advanced' ? 'active' : ''}`} onClick={() => setActiveACLSection('advanced')}>
            <div className="nav-icon"><ArrowLeftRight size={16} /></div>
            <div className="nav-text"><strong>Traffic Behavior</strong><p>Flow & logging</p></div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>{activeACLSection.toUpperCase()} Settings</h3>
          <button className="close-btn-mono" onClick={() => setIsACLModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* ================= GLOBAL ================= */}
          <div className="config-group-mono">
            <label>ACL Mode</label>

            <div className="inline-fields">
              <div className="input-wrap">
                <span>Type</span>
                <select>
                  <option>Standard</option>
                  <option>Extended</option>
                </select>
              </div>

              <div className="input-wrap">
                <span>ACL ID / Name</span>
                <input placeholder="ACL_101" />
              </div>
            </div>
          </div>

          {/* ================= DYNAMIC ================= */}
          <div className="config-group-mono highlight-area">

            {/* ================= RULE ENGINE ================= */}
            {activeACLSection === "rules" && (
              <>
                <label>Rule Engine (Top-down priority)</label>

                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Action</th>
                      <th>Protocol</th>
                      <th>Source</th>
                      <th>Destination</th>
                      <th>Port</th>
                      <th>Log</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[1,2,3,4].map((r, i) => (
                      <tr key={i}>
                        <td>{i+1}</td>
                        <td>
                          <select>
                            <option>permit</option>
                            <option>deny</option>
                          </select>
                        </td>
                        <td>
                          <select>
                            <option>ip</option>
                            <option>tcp</option>
                            <option>udp</option>
                            <option>icmp</option>
                          </select>
                        </td>
                        <td><input placeholder="192.168.1.0/24" /></td>
                        <td><input placeholder="any" /></td>
                        <td><input placeholder="80,443" /></td>
                        <td><input type="checkbox" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Implicit Deny (block unmatched traffic)</span>
                </div>
              </>
            )}

            {/* ================= INTERFACE BINDING ================= */}
            {activeACLSection === "binding" && (
              <>
                <label>Apply ACL to Interface</label>

                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>Interface</span>
                    <select>
                      <option>G0/0 (LAN)</option>
                      <option>G0/1 (WAN)</option>
                      <option>VLAN 10</option>
                    </select>
                  </div>

                  <div className="input-wrap">
                    <span>Direction</span>
                    <select>
                      <option>Inbound</option>
                      <option>Outbound</option>
                    </select>
                  </div>
                </div>

                <div className="input-wrap">
                  <span>Apply To</span>
                  <select>
                    <option>All Traffic</option>
                    <option>Matched Traffic Only</option>
                  </select>
                </div>
              </>
            )}

            {/* ================= TRAFFIC BEHAVIOR ================= */}
            {activeACLSection === "advanced" && (
              <>
                <label>Traffic Behavior</label>

                <div className="input-wrap">
                  <span>Default Action</span>
                  <select>
                    <option>Deny</option>
                    <option>Permit</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Logging Level</span>
                  <select>
                    <option>None</option>
                    <option>Errors Only</option>
                    <option>All Matches</option>
                  </select>
                </div>

                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable Stateful Inspection</span>
                </div>

                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable Rate Limiting</span>
                </div>
              </>
            )}

          </div>

        </div>

        <div className="modal-footer-clean">
          <button className="btn-secondary" onClick={() => setIsACLModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary">
            Apply ACL
          </button>
        </div>

      </div>
    </div>
  </div>,
  document.body
)}

      {isDHCPModalOpen && createPortal(
  <div className="config-modal-overlay dhcp-modal-layer">

    <div className="nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Server size={18} />
          <span>Advanced Configuration</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${dhcpScope === "basic" ? "active" : ""}`}
            onClick={() => setDhcpScope("basic")}
          >
            <div className="nav-icon"><Network size={16} /></div>
            <div className="nav-text">
              <strong>Basic Setup</strong>
              <p>Gateway, DNS, Lease</p>
            </div>
          </button>

          <button
            className={`nav-item ${dhcpScope === "pool" ? "active" : ""}`}
            onClick={() => setDhcpScope("pool")}
          >
            <div className="nav-icon"><ArrowDown size={16} /></div>
            <div className="nav-text">
              <strong>IP Pool Engine</strong>
              <p>Allocation system</p>
            </div>
          </button>

          <button
            className={`nav-item ${dhcpScope === "reservation" ? "active" : ""}`}
            onClick={() => setDhcpScope("reservation")}
          >
            <div className="nav-icon"><Lock size={16} /></div>
            <div className="nav-text">
              <strong>Binding Table</strong>
              <p>MAC → IP mapping</p>
            </div>
          </button>

          <button
            className={`nav-item ${dhcpScope === "advanced" ? "active" : ""}`}
            onClick={() => setDhcpScope("advanced")}
          >
            <div className="nav-icon"><Activity size={16} /></div>
            <div className="nav-text">
              <strong>System Control</strong>
              <p>Policies & behavior</p>
            </div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        {/* HEADER */}
        <div className="modal-header-clean">
          <h3>{dhcpScope.toUpperCase()} Settings</h3>
          <button className="close-btn-mono" onClick={() => setIsDHCPModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* ================= BASIC ================= */}
          {dhcpScope === "basic" && (
            <div className="config-group-mono highlight-area">

              <label>Core DHCP Engine</label>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Default Gateway</span>
                  <input placeholder="192.168.1.1" />
                </div>

                <div className="input-wrap">
                  <span>Subnet Mask</span>
                  <input placeholder="255.255.255.0" />
                </div>

                <div className="input-wrap">
                  <span>DNS Server</span>
                  <input placeholder="8.8.8.8" />
                </div>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable DHCP service</span>
              </div>

            </div>
          )}

          {/* ================= POOL ENGINE ================= */}
          {dhcpScope === "pool" && (
            <div className="config-group-mono highlight-area">

              <label>IP Allocation Engine</label>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Start IP</span>
                  <input placeholder="192.168.1.100" />
                </div>

                <div className="input-wrap">
                  <span>End IP</span>
                  <input placeholder="192.168.1.200" />
                </div>
              </div>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Lease Time Policy</span>
                  <select>
                    <option>1 hour</option>
                    <option>12 hours</option>
                    <option>24 hours</option>
                    <option>7 days</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Conflict Handling</span>
                  <select>
                    <option>Reject duplicate</option>
                    <option>Override oldest</option>
                    <option>Ignore conflict</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* ================= RESERVATION ================= */}
          {dhcpScope === "reservation" && (
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
                  {[1,2,3].map((i) => (
                    <tr key={i}>
                      <td><input placeholder="Device Name" /></td>
                      <td><input placeholder="AA:BB:CC:DD:EE:FF" /></td>
                      <td><input placeholder="192.168.1.10" /></td>
                      <td>
                        <select>
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

          {/* ================= ADVANCED SYSTEM CONTROL ================= */}
          {dhcpScope === "advanced" && (
            <div className="config-group-mono highlight-area">

              <label>DHCP System Policies</label>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Domain Name</span>
                  <input placeholder="corp.local" />
                </div>

                <div className="input-wrap">
                  <span>NTP Server</span>
                  <input placeholder="time.google.com" />
                </div>
              </div>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>DHCP Relay</span>
                  <input placeholder="192.168.10.1" />
                </div>

                <div className="input-wrap">
                  <span>DNS Update Mode</span>
                  <select>
                    <option>Automatic</option>
                    <option>Manual</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Authoritative DHCP server</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Enable conflict detection engine</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Enable system logging</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Enable audit trail (enterprise mode)</span>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer-clean">
          <button className="btn-secondary" onClick={() => setIsDHCPModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary">
            Apply Configuration
          </button>
        </div>

      </div>
    </div>
  </div>,
  document.body
)}

{isVPNModalOpen && createPortal(
  <div className="config-modal-overlay vpn-modal-layer">

    <div className="nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Lock size={18} />
          <span>VPN Configuration</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeVPNTab === "tunnel" ? "active" : ""}`}
            onClick={() => setActiveVPNTab("tunnel")}
          >
            <div className="nav-icon"><ArrowLeftRight size={16} /></div>
            <div className="nav-text">
              <strong>Site-to-Site</strong>
              <p>Tunnel endpoints</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeVPNTab === "crypto" ? "active" : ""}`}
            onClick={() => setActiveVPNTab("crypto")}
          >
            <div className="nav-icon"><ShieldCheck size={16} /></div>
            <div className="nav-text">
              <strong>Encryption</strong>
              <p>IPSec / IKE policies</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeVPNTab === "routing" ? "active" : ""}`}
            onClick={() => setActiveVPNTab("routing")}
          >
            <div className="nav-icon"><Network size={16} /></div>
            <div className="nav-text">
              <strong>Traffic Rules</strong>
              <p>VPN ACL selectors</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeVPNTab === "status" ? "active" : ""}`}
            onClick={() => setActiveVPNTab("status")}
          >
            <div className="nav-icon"><Activity size={16} /></div>
            <div className="nav-text">
              <strong>Monitoring</strong>
              <p>Tunnel health & uptime</p>
            </div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>{activeVPNTab.toUpperCase()} Settings</h3>
          <button className="close-btn-mono" onClick={() => setIsVPNModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* ================= TUNNEL ================= */}
          {activeVPNTab === "tunnel" && (
            <div className="config-group-mono">

              <label>Site-to-Site Tunnel Setup</label>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Local Gateway</span>
                  <input placeholder="203.0.113.1" />
                </div>

                <div className="input-wrap">
                  <span>Remote Gateway</span>
                  <input placeholder="198.51.100.1" />
                </div>
              </div>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Local Subnet</span>
                  <input placeholder="192.168.1.0/24" />
                </div>

                <div className="input-wrap">
                  <span>Remote Subnet</span>
                  <input placeholder="10.10.0.0/24" />
                </div>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Auto-negotiate tunnel</span>
              </div>

            </div>
          )}

          {/* ================= CRYPTO ================= */}
          {activeVPNTab === "crypto" && (
            <div className="config-group-mono">

              <label>IPSec / IKE Encryption</label>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>IKE Version</span>
                  <select>
                    <option>IKEv2 (Recommended)</option>
                    <option>IKEv1</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Encryption</span>
                  <select>
                    <option>AES-256</option>
                    <option>AES-128</option>
                    <option>3DES (Legacy)</option>
                  </select>
                </div>
              </div>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Integrity</span>
                  <select>
                    <option>SHA-256</option>
                    <option>SHA-1</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Pre-Shared Key</span>
                  <input type="password" placeholder="••••••••••" />
                </div>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable Perfect Forward Secrecy (PFS)</span>
              </div>

            </div>
          )}

          {/* ================= ROUTING ================= */}
          {activeVPNTab === "routing" && (
            <div className="config-group-mono">

              <label>VPN Traffic Selection (Crypto ACL)</label>

              <div className="inline-fields">
                <div className="input-wrap">
                  <span>Source Network</span>
                  <input placeholder="192.168.1.0/24" />
                </div>

                <div className="input-wrap">
                  <span>Destination Network</span>
                  <input placeholder="10.10.0.0/24" />
                </div>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Encrypt matching traffic only</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Bypass local traffic optimization</span>
              </div>

            </div>
          )}

          {/* ================= STATUS ================= */}
          {activeVPNTab === "status" && (
            <div className="config-group-mono">

              <label>Tunnel Monitoring Dashboard</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>Tunnel</th>
                    <th>Status</th>
                    <th>Uptime</th>
                    <th>Latency</th>
                  </tr>
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
          <button className="btn-secondary" onClick={() => setIsVPNModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary">
            Apply VPN
          </button>
        </div>

      </div>
    </div>
  </div>,
  document.body
)}

{isSNMPModalOpen && createPortal(
  <div className="config-modal-overlay snmp-modal-layer">

    <div className="nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Activity size={18} />
          <span>SNMP Configuration</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeSNMPTab === "agent" ? "active" : ""}`}
            onClick={() => setActiveSNMPTab("agent")}
          >
            <div className="nav-icon"><Server size={16} /></div>
            <div className="nav-text">
              <strong>SNMP Agent</strong>
              <p>Identity & versioning</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSNMPTab === "security" ? "active" : ""}`}
            onClick={() => setActiveSNMPTab("security")}
          >
            <div className="nav-icon"><Lock size={16} /></div>
            <div className="nav-text">
              <strong>Security</strong>
              <p>v1/v2c/v3 access control</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSNMPTab === "mib" ? "active" : ""}`}
            onClick={() => setActiveSNMPTab("mib")}
          >
            <div className="nav-icon"><Network size={16} /></div>
            <div className="nav-text">
              <strong>MIB Monitoring</strong>
              <p>OID tracking & thresholds</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSNMPTab === "traps" ? "active" : ""}`}
            onClick={() => setActiveSNMPTab("traps")}
          >
            <div className="nav-icon"><ArrowDown size={16} /></div>
            <div className="nav-text">
              <strong>Traps & Alerts</strong>
              <p>Event notification system</p>
            </div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>{activeSNMPTab.toUpperCase()} Settings</h3>
          <button className="close-btn-mono" onClick={() => setIsSNMPModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* ================= AGENT ================= */}
          {activeSNMPTab === "agent" && (
            <div className="config-group-mono">

              <label>SNMP Agent Identity</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>System Name</span>
                  <input placeholder="Router-Core-01" />
                </div>

                <div className="input-wrap">
                  <span>Location</span>
                  <input placeholder="Data Center - Manila" />
                </div>

              </div>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>SNMP Version</span>
                  <select>
                    <option>v3 (Recommended)</option>
                    <option>v2c</option>
                    <option>v1 (Legacy)</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Contact</span>
                  <input placeholder="admin@network.local" />
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable SNMP agent globally</span>
              </div>

            </div>
          )}

          {/* ================= SECURITY ================= */}
          {activeSNMPTab === "security" && (
            <div className="config-group-mono">

              <label>SNMP Security Configuration</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Read Community</span>
                  <input placeholder="public" />
                </div>

                <div className="input-wrap">
                  <span>Write Community</span>
                  <input placeholder="private" />
                </div>

              </div>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Manager IP ACL</span>
                  <input placeholder="192.168.1.10/32" />
                </div>

                <div className="input-wrap">
                  <span>SNMPv3 Security Level</span>
                  <select>
                    <option>authPriv (Recommended)</option>
                    <option>authNoPriv</option>
                    <option>noAuthNoPriv</option>
                  </select>
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable access logging</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Restrict SNMP to trusted networks only</span>
              </div>

            </div>
          )}

          {/* ================= MIB ================= */}
          {activeSNMPTab === "mib" && (
            <div className="config-group-mono">

              <label>MIB / OID Monitoring Engine</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>OID</th>
                    <th>Metric</th>
                    <th>Threshold</th>
                    <th>Alert</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>.1.3.6.1.2.1.1.3</td>
                    <td>System Uptime</td>
                    <td><input placeholder="> 99.9%" /></td>
                    <td><input type="checkbox" defaultChecked /></td>
                  </tr>

                  <tr>
                    <td>.1.3.6.1.2.1.2.2</td>
                    <td>Interface Utilization</td>
                    <td><input placeholder="> 80%" /></td>
                    <td><input type="checkbox" /></td>
                  </tr>

                  <tr>
                    <td>.1.3.6.1.4.1</td>
                    <td>CPU Load</td>
                    <td><input placeholder="> 75%" /></td>
                    <td><input type="checkbox" defaultChecked /></td>
                  </tr>
                </tbody>
              </table>

            </div>
          )}

          {/* ================= TRAPS ================= */}
          {activeSNMPTab === "traps" && (
            <div className="config-group-mono">

              <label>Trap & Alert System</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Trap Receiver IP</span>
                  <input placeholder="192.168.1.100" />
                </div>

                <div className="input-wrap">
                  <span>Port</span>
                  <input placeholder="162" />
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Link up/down notifications</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>CPU / Memory threshold alerts</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Anomaly detection engine</span>
              </div>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">
          <button className="btn-secondary" onClick={() => setIsSNMPModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary">
            Apply SNMP
          </button>
        </div>

      </div>
    </div>
  </div>,
  document.body
)}

{isNTPModalOpen && createPortal(
  <div className="config-modal-overlay ntp-modal-layer">

    <div className="nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Clock size={18} />
          <span>NTP Configuration</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeNTPTab === "server" ? "active" : ""}`}
            onClick={() => setActiveNTPTab("server")}
          >
            <div className="nav-icon"><Server size={16} /></div>
            <div className="nav-text">
              <strong>NTP Servers</strong>
              <p>Time source hierarchy</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeNTPTab === "sync" ? "active" : ""}`}
            onClick={() => setActiveNTPTab("sync")}
          >
            <div className="nav-icon"><ArrowLeftRight size={16} /></div>
            <div className="nav-text">
              <strong>Sync Engine</strong>
              <p>Intervals & behavior</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeNTPTab === "auth" ? "active" : ""}`}
            onClick={() => setActiveNTPTab("auth")}
          >
            <div className="nav-icon"><Lock size={16} /></div>
            <div className="nav-text">
              <strong>Authentication</strong>
              <p>Secure time validation</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeNTPTab === "status" ? "active" : ""}`}
            onClick={() => setActiveNTPTab("status")}
          >
            <div className="nav-icon"><Activity size={16} /></div>
            <div className="nav-text">
              <strong>Monitoring</strong>
              <p>Clock drift & sync health</p>
            </div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>{activeNTPTab.toUpperCase()} Settings</h3>
          <button className="close-btn-mono" onClick={() => setIsNTPModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* ================= SERVERS ================= */}
          {activeNTPTab === "server" && (
            <div className="config-group-mono">
              <label>Time Source Hierarchy</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>NTP Server</th>
                    <th>Type</th>
                    <th>Enabled</th>
                  </tr>
                </thead>

                <tbody>
                  {[1,2,3].map((i) => (
                    <tr key={i}>
                      <td>{i}</td>
                      <td><input placeholder="time.server.com" /></td>
                      <td>
                        <select>
                          <option>Public</option>
                          <option>Pool</option>
                          <option>Internal</option>
                          <option>Fallback</option>
                        </select>
                      </td>
                      <td><input type="checkbox" defaultChecked /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= SYNC ENGINE ================= */}
          {activeNTPTab === "sync" && (
            <div className="config-group-mono">

              <label>Synchronization Engine</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Sync Interval</span>
                  <select>
                    <option>30 sec</option>
                    <option>60 sec</option>
                    <option>5 min</option>
                    <option>15 min</option>
                    <option>1 hour</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Mode</span>
                  <select>
                    <option>Client</option>
                    <option>Server</option>
                    <option>Peer</option>
                  </select>
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Auto drift correction (slew mode)</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Force sync on boot</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Fallback to secondary NTP source</span>
              </div>

            </div>
          )}

          {/* ================= AUTH ================= */}
          {activeNTPTab === "auth" && (
            <div className="config-group-mono">

              <label>NTP Authentication Layer</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Key ID</span>
                  <input placeholder="1" />
                </div>

                <div className="input-wrap">
                  <span>Algorithm</span>
                  <select>
                    <option>MD5</option>
                    <option>SHA1</option>
                    <option>SHA256</option>
                  </select>
                </div>

              </div>

              <div className="input-wrap">
                <span>Shared Key</span>
                <input type="password" placeholder="••••••••••••" />
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Require authentication for all NTP peers</span>
              </div>

            </div>
          )}

          {/* ================= STATUS ================= */}
          {activeNTPTab === "status" && (
            <div className="config-group-mono">

              <label>Clock Synchronization Health</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Offset</th>
                    <th>Last Sync</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>time.google.com</td>
                    <td style={{ color: "green" }}>SYNCED</td>
                    <td>+0.003s</td>
                    <td>12s ago</td>
                  </tr>

                  <tr>
                    <td>pool.ntp.org</td>
                    <td style={{ color: "green" }}>SYNCED</td>
                    <td>+0.007s</td>
                    <td>18s ago</td>
                  </tr>

                  <tr>
                    <td>Local Clock</td>
                    <td style={{ color: "orange" }}>STANDBY</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">
          <button className="btn-secondary" onClick={() => setIsNTPModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary">
            Apply NTP
          </button>
        </div>

      </div>
    </div>
  </div>,
  document.body
)}

{isSSHModalOpen && createPortal(
  <div className="config-modal-overlay ssh-modal-layer">

    <div className="nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Lock size={18} />
          <span>SSH / Remote Access</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeSSHTab === "general" ? "active" : ""}`}
            onClick={() => setActiveSSHTab("general")}
          >
            <div className="nav-icon"><Server size={16} /></div>
            <div className="nav-text">
              <strong>General</strong>
              <p>Enable & port settings</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSSHTab === "auth" ? "active" : ""}`}
            onClick={() => setActiveSSHTab("auth")}
          >
            <div className="nav-icon"><ShieldCheck size={16} /></div>
            <div className="nav-text">
              <strong>Authentication</strong>
              <p>Password / Key access</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSSHTab === "keys" ? "active" : ""}`}
            onClick={() => setActiveSSHTab("keys")}
          >
            <div className="nav-icon"><Lock size={16} /></div>
            <div className="nav-text">
              <strong>SSH Keys</strong>
              <p>Public key management</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSSHTab === "access" ? "active" : ""}`}
            onClick={() => setActiveSSHTab("access")}
          >
            <div className="nav-icon"><Network size={16} /></div>
            <div className="nav-text">
              <strong>Access Control</strong>
              <p>Allowed IPs / users</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSSHTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveSSHTab("sessions")}
          >
            <div className="nav-icon"><Activity size={16} /></div>
            <div className="nav-text">
              <strong>Sessions</strong>
              <p>Active connections</p>
            </div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        {/* HEADER */}
        <div className="modal-header-clean">
          <h3>{activeSSHTab.toUpperCase()} Settings</h3>
          <button className="close-btn-mono" onClick={() => setIsSSHModalOpen(false)}>×</button>
        </div>

        <div className="config-body">

          {/* ================= GENERAL ================= */}
          {activeSSHTab === "general" && (
            <div className="config-group-mono">

              <label>SSH Service Settings</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Enable SSH</span>
                  <select>
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Port</span>
                  <input placeholder="22" />
                </div>

                <div className="input-wrap">
                  <span>Protocol Version</span>
                  <select>
                    <option>SSH-2 (Recommended)</option>
                    <option>SSH-1 (Legacy)</option>
                  </select>
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Allow remote root login</span>
              </div>

            </div>
          )}

          {/* ================= AUTH ================= */}
          {activeSSHTab === "auth" && (
            <div className="config-group-mono">

              <label>Authentication Methods</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Password Login</span>
                  <select>
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Key-Based Auth</span>
                  <select>
                    <option>Required</option>
                    <option>Optional</option>
                    <option>Disabled</option>
                  </select>
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Disable empty passwords</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>2FA (future support)</span>
              </div>

            </div>
          )}

          {/* ================= KEYS ================= */}
          {activeSSHTab === "keys" && (
            <div className="config-group-mono">

              <label>SSH Public Keys</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Key Type</th>
                    <th>Fingerprint</th>
                    <th>Active</th>
                  </tr>
                </thead>

                <tbody>
                  {[1,2,3].map((i) => (
                    <tr key={i}>
                      <td><input placeholder="admin" /></td>
                      <td>
                        <select>
                          <option>RSA</option>
                          <option>ECDSA</option>
                          <option>ED25519</option>
                        </select>
                      </td>
                      <td><input placeholder="SHA256:xxxxxx" /></td>
                      <td><input type="checkbox" defaultChecked /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

          {/* ================= ACCESS CONTROL ================= */}
          {activeSSHTab === "access" && (
            <div className="config-group-mono">

              <label>Access Restrictions</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Allowed IP Range</span>
                  <input placeholder="192.168.1.0/24" />
                </div>

                <div className="input-wrap">
                  <span>Blocked IP</span>
                  <input placeholder="0.0.0.0/0 (optional)" />
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable IP filtering</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Rate limiting (anti brute-force)</span>
              </div>

            </div>
          )}

          {/* ================= SESSIONS ================= */}
          {activeSSHTab === "sessions" && (
            <div className="config-group-mono">

              <label>Active SSH Sessions</label>

              <div className="acl-table">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Source IP</th>
                      <th>Uptime</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>admin</td>
                      <td>192.168.1.10</td>
                      <td>2h 12m</td>
                      <td style={{ color: "green" }}>ACTIVE</td>
                    </tr>

                    <tr>
                      <td>root</td>
                      <td>10.0.0.5</td>
                      <td>15m</td>
                      <td style={{ color: "green" }}>ACTIVE</td>
                    </tr>

                    <tr>
                      <td>guest</td>
                      <td>203.0.113.9</td>
                      <td>—</td>
                      <td style={{ color: "red" }}>BLOCKED</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer-clean">
          <button className="btn-secondary" onClick={() => setIsSSHModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary">
            Apply SSH Config
          </button>
        </div>

      </div>
    </div>
  </div>,
  document.body
)}

      {isVLANModalOpen && createPortal(
  <div className="config-modal-overlay vlan-modal-layer">

    <div className="nat-sidebar-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Network size={18} />
          <span>VLAN Manager</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeVLANTab === "vlans" ? "active" : ""}`}
            onClick={() => setActiveVLANTab("vlans")}
          >
            <div className="nav-icon"><Layers size={16} /></div>
            <div className="nav-text">
              <strong>VLAN Database</strong>
              <p>Create & manage VLANs</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeVLANTab === "ports" ? "active" : ""}`}
            onClick={() => setActiveVLANTab("ports")}
          >
            <div className="nav-icon"><Cable size={16} /></div>
            <div className="nav-text">
              <strong>Port Assignment</strong>
              <p>Access & trunk ports</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeVLANTab === "trunk" ? "active" : ""}`}
            onClick={() => setActiveVLANTab("trunk")}
          >
            <div className="nav-icon"><ArrowLeftRight size={16} /></div>
            <div className="nav-text">
              <strong>Trunking</strong>
              <p>802.1Q uplink config</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeVLANTab === "stp" ? "active" : ""}`}
            onClick={() => setActiveVLANTab("stp")}
          >
            <div className="nav-icon"><GitBranch size={16} /></div>
            <div className="nav-text">
              <strong>STP Settings</strong>
              <p>Loop prevention</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeVLANTab === "monitor" ? "active" : ""}`}
            onClick={() => setActiveVLANTab("monitor")}
          >
            <div className="nav-icon"><Activity size={16} /></div>
            <div className="nav-text">
              <strong>Monitoring</strong>
              <p>Traffic & VLAN health</p>
            </div>
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="nat-main-content">

        {/* HEADER */}
        <div className="modal-header-clean">
          <h3>Advanced VLAN Switch Configuration</h3>

          <button
            className="close-btn-mono"
            onClick={() => setIsVLANModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="config-body">

          {/* ================= VLAN DATABASE ================= */}
          {activeVLANTab === "vlans" && (
            <div className="config-group-mono">

              <label>VLAN Database</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>VLAN ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {[1,2,3,4].map((i) => (
                    <tr key={i}>
                      <td>
                        <input placeholder="10" />
                      </td>

                      <td>
                        <input placeholder="SALES_VLAN" />
                      </td>

                      <td>
                        <select>
                          <option>Data</option>
                          <option>Voice</option>
                          <option>Management</option>
                          <option>Native</option>
                        </select>
                      </td>

                      <td>
                        <select>
                          <option>Active</option>
                          <option>Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable VLAN pruning</span>
              </div>

            </div>
          )}

          {/* ================= PORT ASSIGNMENT ================= */}
          {activeVLANTab === "ports" && (
            <div className="config-group-mono">

              <label>Switch Port Assignment</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>Interface</th>
                    <th>Mode</th>
                    <th>Access VLAN</th>
                    <th>Voice VLAN</th>
                  </tr>
                </thead>

                <tbody>
                  {["Fa0/1", "Fa0/2", "Fa0/3", "Gi0/1"].map((port, i) => (
                    <tr key={i}>

                      <td>{port}</td>

                      <td>
                        <select>
                          <option>Access</option>
                          <option>Trunk</option>
                          <option>Dynamic Auto</option>
                        </select>
                      </td>

                      <td>
                        <input placeholder="10" />
                      </td>

                      <td>
                        <input placeholder="20" />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

          {/* ================= TRUNKING ================= */}
          {activeVLANTab === "trunk" && (
            <div className="config-group-mono">

              <label>802.1Q Trunk Configuration</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Native VLAN</span>
                  <input placeholder="99" />
                </div>

                <div className="input-wrap">
                  <span>Allowed VLANs</span>
                  <input placeholder="10,20,30,99" />
                </div>

                <div className="input-wrap">
                  <span>Encapsulation</span>
                  <select>
                    <option>802.1Q</option>
                    <option>ISL</option>
                  </select>
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable DTP negotiation</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Restrict unused VLANs</span>
              </div>

            </div>
          )}

          {/* ================= STP ================= */}
          {activeVLANTab === "stp" && (
            <div className="config-group-mono">

              <label>Spanning Tree Protocol</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>STP Mode</span>
                  <select>
                    <option>Rapid PVST+</option>
                    <option>PVST+</option>
                    <option>MST</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Bridge Priority</span>
                  <input placeholder="32768" />
                </div>

                <div className="input-wrap">
                  <span>Root Guard</span>
                  <select>
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable PortFast on access ports</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable BPDU Guard</span>
              </div>

            </div>
          )}

          {/* ================= MONITOR ================= */}
          {activeVLANTab === "monitor" && (
            <div className="config-group-mono">

              <label>VLAN Monitoring & Statistics</label>

              <div className="acl-table">
                <table>
                  <thead>
                    <tr>
                      <th>VLAN</th>
                      <th>Ports</th>
                      <th>Traffic Load</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    <tr>
                      <td>10</td>
                      <td>Fa0/1, Fa0/2</td>
                      <td>42%</td>
                      <td style={{ color: "green" }}>ACTIVE</td>
                    </tr>

                    <tr>
                      <td>20</td>
                      <td>Fa0/3</td>
                      <td>67%</td>
                      <td style={{ color: "green" }}>ACTIVE</td>
                    </tr>

                    <tr>
                      <td>99</td>
                      <td>Gi0/1</td>
                      <td>12%</td>
                      <td style={{ color: "orange" }}>NATIVE</td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer-clean">

          <button
            className="btn-secondary"
            onClick={() => setIsVLANModalOpen(false)}
          >
            Cancel
          </button>

          <button className="btn-primary">
            Apply VLAN Config
          </button>

        </div>

      </div>
    </div>
  </div>,
  document.body
)}

{isSTPModalOpen && createPortal(
  <div className="config-modal-overlay stp-modal-layer">

    <div className="nat-sidebar-layout">

      <div className="nat-sidebar">

        <div className="sidebar-header">
          <GitBranch size={18} />
          <span>Spanning Tree</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeSTPTab === "global" ? "active" : ""}`}
            onClick={() => setActiveSTPTab("global")}
          >
            <div className="nav-icon"><Network size={16} /></div>

            <div className="nav-text">
              <strong>Global STP</strong>
              <p>Core spanning tree mode</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSTPTab === "priority" ? "active" : ""}`}
            onClick={() => setActiveSTPTab("priority")}
          >
            <div className="nav-icon"><Layers size={16} /></div>

            <div className="nav-text">
              <strong>Bridge Priority</strong>
              <p>Root bridge election</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSTPTab === "protection" ? "active" : ""}`}
            onClick={() => setActiveSTPTab("protection")}
          >
            <div className="nav-icon"><ShieldCheck size={16} /></div>

            <div className="nav-text">
              <strong>Protection</strong>
              <p>BPDU & root guard</p>
            </div>
          </button>

        </div>
      </div>

      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>Advanced Spanning Tree Configuration</h3>

          <button
            className="close-btn-mono"
            onClick={() => setIsSTPModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="config-body">

          {activeSTPTab === "global" && (
            <div className="config-group-mono">

              <label>STP Global Settings</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>STP Mode</span>

                  <select>
                    <option>Rapid PVST+</option>
                    <option>PVST+</option>
                    <option>MST</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Hello Time</span>
                  <input placeholder="2 sec" />
                </div>

                <div className="input-wrap">
                  <span>Forward Delay</span>
                  <input placeholder="15 sec" />
                </div>

              </div>

            </div>
          )}

          {activeSTPTab === "priority" && (
            <div className="config-group-mono">

              <label>Bridge Priority</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>VLAN</th>
                    <th>Priority</th>
                    <th>Role</th>
                  </tr>
                </thead>

                <tbody>
                  {[10,20,30].map((vlan, i) => (
                    <tr key={i}>
                      <td>{vlan}</td>

                      <td>
                        <input placeholder="32768" />
                      </td>

                      <td>
                        <select>
                          <option>Root Primary</option>
                          <option>Root Secondary</option>
                          <option>Normal</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

          {activeSTPTab === "protection" && (
            <div className="config-group-mono">

              <label>Loop Protection Features</label>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable BPDU Guard</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable Root Guard</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Enable Loop Guard</span>
              </div>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">

          <button
            className="btn-secondary"
            onClick={() => setIsSTPModalOpen(false)}
          >
            Cancel
          </button>

          <button className="btn-primary">
            Apply STP Config
          </button>

        </div>

      </div>
    </div>
  </div>,
  document.body
)}

    {isPortSecurityModalOpen && createPortal(
  <div className="config-modal-overlay port-security-modal-layer">

    <div className="nat-sidebar-layout">

      <div className="nat-sidebar">

        <div className="sidebar-header">
          <ShieldCheck size={18} />
          <span>Port Security</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activePortSecurityTab === "mac" ? "active" : ""}`}
            onClick={() => setActivePortSecurityTab("mac")}
          >
            <div className="nav-icon"><Cable size={16} /></div>

            <div className="nav-text">
              <strong>MAC Binding</strong>
              <p>Allowed device addresses</p>
            </div>
          </button>

          <button
            className={`nav-item ${activePortSecurityTab === "violation" ? "active" : ""}`}
            onClick={() => setActivePortSecurityTab("violation")}
          >
            <div className="nav-icon"><Lock size={16} /></div>

            <div className="nav-text">
              <strong>Violation Action</strong>
              <p>Unauthorized access policy</p>
            </div>
          </button>

        </div>
      </div>

      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>Advanced Port Security</h3>

          <button
            className="close-btn-mono"
            onClick={() => setIsPortSecurityModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="config-body">

          {activePortSecurityTab === "mac" && (
            <div className="config-group-mono">

              <label>Secure MAC Address Table</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>Port</th>
                    <th>MAC Address</th>
                    <th>Max MACs</th>
                  </tr>
                </thead>

                <tbody>
                  {["Fa0/1","Fa0/2","Gi0/1"].map((port, i) => (
                    <tr key={i}>

                      <td>{port}</td>

                      <td>
                        <input placeholder="AA:BB:CC:DD:EE:FF" />
                      </td>

                      <td>
                        <input placeholder="1" />
                      </td>

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

                <div className="input-wrap">
                  <span>Action</span>

                  <select>
                    <option>Shutdown</option>
                    <option>Restrict</option>
                    <option>Protect</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Recovery Time</span>
                  <input placeholder="300 sec" />
                </div>

              </div>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">

          <button
            className="btn-secondary"
            onClick={() => setIsPortSecurityModalOpen(false)}
          >
            Cancel
          </button>

          <button className="btn-primary">
            Apply Security
          </button>

        </div>

      </div>
    </div>
  </div>,
  document.body
)}

    {isQoSModalOpen && createPortal(
  <div className="config-modal-overlay qos-modal-layer">

    <div className="nat-sidebar-layout">

      {/* SIDEBAR */}
      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Activity size={18} />
          <span>QoS Settings</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeQoSTab === "classification" ? "active" : ""}`}
            onClick={() => setActiveQoSTab("classification")}
          >
            <div className="nav-icon"><Layers size={16} /></div>

            <div className="nav-text">
              <strong>Classification</strong>
              <p>Traffic identification</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeQoSTab === "queue" ? "active" : ""}`}
            onClick={() => setActiveQoSTab("queue")}
          >
            <div className="nav-icon"><ArrowLeftRight size={16} /></div>

            <div className="nav-text">
              <strong>Queueing</strong>
              <p>Bandwidth allocation</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeQoSTab === "policing" ? "active" : ""}`}
            onClick={() => setActiveQoSTab("policing")}
          >
            <div className="nav-icon"><ShieldCheck size={16} /></div>

            <div className="nav-text">
              <strong>Policing</strong>
              <p>Rate limiting policies</p>
            </div>
          </button>

        </div>
      </div>

      {/* MAIN */}
      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>Advanced QoS Configuration</h3>

          <button
            className="close-btn-mono"
            onClick={() => setIsQoSModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="config-body">

          {activeQoSTab === "classification" && (
            <div className="config-group-mono">

              <label>Traffic Classification</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Protocol</th>
                    <th>DSCP</th>
                    <th>Priority</th>
                  </tr>
                </thead>

                <tbody>
                  {["Voice","Video","Data"].map((c, i) => (
                    <tr key={i}>

                      <td>{c}</td>

                      <td>
                        <input placeholder="SIP / RTP" />
                      </td>

                      <td>
                        <input placeholder="46" />
                      </td>

                      <td>
                        <select>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </td>

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

                <div className="input-wrap">
                  <span>Scheduling</span>

                  <select>
                    <option>Weighted Round Robin</option>
                    <option>Strict Priority</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Voice Queue</span>
                  <input placeholder="40%" />
                </div>

                <div className="input-wrap">
                  <span>Video Queue</span>
                  <input placeholder="30%" />
                </div>

              </div>

            </div>
          )}

          {activeQoSTab === "policing" && (
            <div className="config-group-mono">

              <label>Traffic Policing</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Rate Limit</span>
                  <input placeholder="100 Mbps" />
                </div>

                <div className="input-wrap">
                  <span>Burst Size</span>
                  <input placeholder="1 MB" />
                </div>

              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Drop excess traffic</span>
              </div>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">

          <button
            className="btn-secondary"
            onClick={() => setIsQoSModalOpen(false)}
          >
            Cancel
          </button>

          <button className="btn-primary">
            Apply QoS
          </button>

        </div>

      </div>
    </div>
  </div>,
  document.body
)}

    {isAuthModalOpen && createPortal(
  <div className="config-modal-overlay auth-modal-layer">

    <div className="nat-sidebar-layout">

      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Lock size={18} />
          <span>User Authentication</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeAuthTab === "radius" ? "active" : ""}`}
            onClick={() => setActiveAuthTab("radius")}
          >
            <div className="nav-icon"><Server size={16} /></div>

            <div className="nav-text">
              <strong>RADIUS</strong>
              <p>AAA authentication server</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeAuthTab === "dot1x" ? "active" : ""}`}
            onClick={() => setActiveAuthTab("dot1x")}
          >
            <div className="nav-icon"><ShieldCheck size={16} /></div>

            <div className="nav-text">
              <strong>802.1X</strong>
              <p>Port-based access control</p>
            </div>
          </button>

        </div>
      </div>

      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>Advanced Authentication Settings</h3>

          <button
            className="close-btn-mono"
            onClick={() => setIsAuthModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="config-body">

          {activeAuthTab === "radius" && (
            <div className="config-group-mono">

              <label>RADIUS Server Configuration</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Server IP</span>
                  <input placeholder="192.168.1.200" />
                </div>

                <div className="input-wrap">
                  <span>Port</span>
                  <input placeholder="1812" />
                </div>

                <div className="input-wrap">
                  <span>Shared Secret</span>
                  <input type="password" placeholder="••••••••" />
                </div>

              </div>

            </div>
          )}

          {activeAuthTab === "dot1x" && (
            <div className="config-group-mono">

              <label>802.1X Access Control</label>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable 802.1X globally</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Force authentication on access ports</span>
              </div>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">

          <button
            className="btn-secondary"
            onClick={() => setIsAuthModalOpen(false)}
          >
            Cancel
          </button>

          <button className="btn-primary">
            Apply Authentication
          </button>

        </div>

      </div>
    </div>
  </div>,
  document.body
)}

    {isIGMPModalOpen && createPortal(
  <div className="config-modal-overlay igmp-modal-layer">

    <div className="nat-sidebar-layout">

      <div className="nat-sidebar">

        <div className="sidebar-header">
          <Layers size={18} />
          <span>IGMP Snooping</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeIGMPTab === "snooping" ? "active" : ""}`}
            onClick={() => setActiveIGMPTab("snooping")}
          >
            <div className="nav-icon"><Network size={16} /></div>

            <div className="nav-text">
              <strong>Snooping</strong>
              <p>Multicast optimization</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeIGMPTab === "querier" ? "active" : ""}`}
            onClick={() => setActiveIGMPTab("querier")}
          >
            <div className="nav-icon"><Server size={16} /></div>

            <div className="nav-text">
              <strong>Querier</strong>
              <p>IGMP query management</p>
            </div>
          </button>

        </div>
      </div>

      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>Advanced IGMP Snooping</h3>

          <button
            className="close-btn-mono"
            onClick={() => setIsIGMPModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="config-body">

          {activeIGMPTab === "snooping" && (
            <div className="config-group-mono">

              <label>Multicast Traffic Settings</label>

              <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Enable IGMP Snooping</span>
              </div>

              <div className="checkbox-wrap">
                <input type="checkbox" />
                <span>Fast leave processing</span>
              </div>

            </div>
          )}

          {activeIGMPTab === "querier" && (
            <div className="config-group-mono">

              <label>Querier Parameters</label>

              <div className="inline-fields">

                <div className="input-wrap">
                  <span>Querier IP</span>
                  <input placeholder="192.168.1.1" />
                </div>

                <div className="input-wrap">
                  <span>Query Interval</span>
                  <input placeholder="125 sec" />
                </div>

              </div>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">

          <button
            className="btn-secondary"
            onClick={() => setIsIGMPModalOpen(false)}
          >
            Cancel
          </button>

          <button className="btn-primary">
            Apply IGMP
          </button>

        </div>

      </div>
    </div>
  </div>,
  document.body
)}

    {isSyslogModalOpen && createPortal(
  <div className="config-modal-overlay syslog-modal-layer">

    <div className="nat-sidebar-layout">

      <div className="nat-sidebar">

        <div className="sidebar-header">
          <ServerIcon size={18} />
          <span>Logs / Syslog</span>
        </div>

        <div className="nav-list">

          <button
            className={`nav-item ${activeSyslogTab === "servers" ? "active" : ""}`}
            onClick={() => setActiveSyslogTab("servers")}
          >
            <div className="nav-icon"><Server size={16} /></div>

            <div className="nav-text">
              <strong>Syslog Servers</strong>
              <p>Remote logging endpoints</p>
            </div>
          </button>

          <button
            className={`nav-item ${activeSyslogTab === "severity" ? "active" : ""}`}
            onClick={() => setActiveSyslogTab("severity")}
          >
            <div className="nav-icon"><Activity size={16} /></div>

            <div className="nav-text">
              <strong>Severity Levels</strong>
              <p>Critical event filtering</p>
            </div>
          </button>

        </div>
      </div>

      <div className="nat-main-content">

        <div className="modal-header-clean">
          <h3>Advanced Syslog Configuration</h3>

          <button
            className="close-btn-mono"
            onClick={() => setIsSyslogModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="config-body">

          {activeSyslogTab === "servers" && (
            <div className="config-group-mono">

              <label>Remote Syslog Servers</label>

              <table className="acl-table">
                <thead>
                  <tr>
                    <th>Server IP</th>
                    <th>Port</th>
                    <th>Protocol</th>
                  </tr>
                </thead>

                <tbody>
                  {[1,2].map((i) => (
                    <tr key={i}>

                      <td>
                        <input placeholder="192.168.1.250" />
                      </td>

                      <td>
                        <input placeholder="514" />
                      </td>

                      <td>
                        <select>
                          <option>UDP</option>
                          <option>TCP</option>
                        </select>
                      </td>

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

                  <select>
                    <option>Warnings</option>
                    <option>Errors</option>
                    <option>Critical</option>
                  </select>
                </div>

                <div className="input-wrap">
                  <span>Buffer Size</span>
                  <input placeholder="8192 KB" />
                </div>

              </div>

            </div>
          )}

        </div>

        <div className="modal-footer-clean">

          <button
            className="btn-secondary"
            onClick={() => setIsSyslogModalOpen(false)}
          >
            Cancel
          </button>

          <button className="btn-primary">
            Apply Syslog
          </button>

        </div>

      </div>
    </div>
  </div>,
  document.body
)}

      {(() => {
        console.log("FIND → layout instance:", canvasController?.layout);
        console.log("FIND layout === global?", canvasController?.layout === window.__layoutRef);
        return null;
      })()}
    </div>
  );
}