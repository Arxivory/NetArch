import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import appState from "../state/AppState";
import { UpdateEntityTransformCommand } from "../core/editor/DrawingCommands";
import { Network, ArrowLeftRight, ShieldCheck, Server, Lock, Activity, Clock, Terminal, ArrowDown, Map} from "lucide-react";

const DEVICE_CONFIGS = {
  router: [
    { label: "Routing Protocol", desc: "Configure OSPF, BGP, or Static routes", icon: Network },
    { label: "NAT/PAT", desc: "Translate private IPs to public addresses", icon: ArrowLeftRight },
    { label: "Access Control List", desc: "Create permit/deny traffic rules", icon: ShieldCheck },
    { label: "DHCP Server", desc: "Manage IP address pools for the network", icon: Server },
    { label: "VPN Config", desc: "Set up secure site-to-site tunnels", icon: Lock },
    { label: "SNMP/MIB", desc: "Configure remote monitoring and alerts", icon: Activity },
    { label: "NTP", desc: "Synchronize device clock with time servers", icon: Clock },
    { label: "Terminal/SSH", desc: "Secure remote command line access", icon: Terminal }
  ],
  switch: [
    { label: "VLAN Manager", desc: "Create and assign Virtual LANs" },
    { label: "Spanning Tree", desc: "Configure STP to prevent network loops" },
    { label: "Port Security", desc: "Bind specific MAC addresses to ports" },
    { label: "VLAN Trunking", desc: "Configure 802.1Q tags for switch links" },
    { label: "QoS Settings", desc: "Prioritize voice or video data packets" },
    { label: "User Auth", desc: "Configure RADIUS/802.1X port access" },
    { label: "IGMP Snooping", desc: "Optimize multicast traffic delivery" },
    { label: "Logs/Syslog", desc: "Export event logs to a central server" }
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

  const [isOSPFModalOpen, setIsOSPFModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("basic"); // For switching tabs
  const [ospfNetworks, setOspfNetworks] = useState([{ id: Date.now(), network: "", areaId: "" }]); // For dynamic networks

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
          entity = {
            ...entity,
            ...storeNode,
            label: storeNode.label || storeNode.hostname || storeNode.name || entity.label
          };
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
    let updatedEntity = { ...selectedEntity, [field]: value };

    if (field === "ipAddress" || field === "subnetMask") {
      const interfaces = Array.isArray(selectedEntity.interfaces) ? [...selectedEntity.interfaces] : [];
      const firstInterface = interfaces[0] ? { ...interfaces[0] } : {};
      const ipv4 = { ...(firstInterface.ipv4 || {}) };

      if (field === "ipAddress") {
        ipv4.address = value;
      }
      if (field === "subnetMask") {
        ipv4.subnetMask = value;
      }

      firstInterface.ipv4 = ipv4;
      interfaces[0] = firstInterface;
      updatedEntity = { ...selectedEntity, interfaces, [field]: value };
    }

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
      setIsModalOpen(true);
      setIsRoutingModalOpen(true);
    } else {
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
            <input className="field-input" value={selectedEntity?.interfaces?.[0]?.ipv4?.address ?? selectedEntity?.ipAddress ?? ""} onChange={(e) => handleDeviceChange('ipAddress', e.target.value)} />
          </div>
          <div><label>Subnet Mask</label>
            <input className="field-input" value={selectedEntity?.interfaces?.[0]?.ipv4?.subnetMask ?? selectedEntity?.subnetMask ?? ""} onChange={(e) => handleDeviceChange('subnetMask', e.target.value)} />
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
  <div className="config-modal-overlay routing-modal-layer">
    <div className="config-modal-content routing-modal-size">
      <div className="modal-header">
        <div className="header-text-stack">
           <h2>Routing Protocol Configuration</h2>
           <span>Select the routing protocol you want to configure.</span>
        </div>
      </div>
      <div className="modal-body">
        <div className="routing-selection-grid">


  <div className="routing-option-card" onClick={() => setIsOSPFModalOpen(true)}>
    <div className="routing-icon ospf">
      <Network size={20} />
    </div>
    <h3>OSPF</h3>
    <p>Open Shortest Path First Link-state routing protocol</p>
    
  </div>

  <div className="routing-option-card" onClick={() => console.log("BGP Clicked")}>
    <div className="routing-icon bgp">
      <ArrowLeftRight size={20} />
    </div>
    <h3>BGP</h3>
    <p>Border Gateway Protocol for routing between AS</p>
  </div>

  <div className="routing-option-card" onClick={() => console.log("Static Clicked")}>
    <div className="routing-icon static">
      <Map size={20} />
    </div>
    <h3>Static Routes</h3>
    <p>Manually configured static network paths</p>
  </div>

</div>
      </div>
      <div className="modal-footer">
         <button className="cancel-btn" onClick={() => setIsRoutingModalOpen(false)}>Cancel</button>
      </div>
    </div>
  </div>,
  document.body
)}

        {isOSPFModalOpen && createPortal(
  <div className="config-modal-overlay ospf-modal-layer">
    <div className="config-modal-content ospf-modal-size">
      <div className="modal-header">
        <div className="header-with-icon">
          <div className="settings-icon-bg">
            <Activity size={18} className="teal-icon" />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>OSPF CONFIGURATION</h2>
        </div>
        <button className="close-btn" onClick={() => setIsOSPFModalOpen(false)}>×</button>
      </div>

      <div className="modal-body">
        {/* Tab Switching Logic */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "basic" ? "active" : ""}`} 
            onClick={() => setActiveTab("basic")}
          >
            Basic
          </button>
          <button 
            className={`tab ${activeTab === "advanced" ? "active" : ""}`} 
            onClick={() => setActiveTab("advanced")}
          >
            Advanced
          </button>
        </div>

        {activeTab === "basic" ? (
          <>
            <div className="input-grid">
              <div className="input-field">
                <label>Process ID</label>
                <input type="text" defaultValue="1" />
              </div>
              <div className="input-field">
                <label>Router ID</label>
                <input type="text" placeholder="1.1.1.1" />
              </div>
            </div>

            <div className="networks-section">
              <label className="section-label">Networks</label>
              {ospfNetworks.map((net, index) => (
                <div key={net.id} className="network-entry">
                  <div className="net-input">
                    <span>Network</span>
                    <input 
                      type="text" 
                      placeholder="192.168.1.0/24" 
                      value={net.network}
                      onChange={(e) => {
                        const newNets = [...ospfNetworks];
                        newNets[index].network = e.target.value;
                        setOspfNetworks(newNets);
                      }}
                    />
                  </div>
                  <div className="net-input">
                    <span>Area ID</span>
                    <input 
                      type="text" 
                      placeholder="0" 
                      value={net.areaId}
                      onChange={(e) => {
                        const newNets = [...ospfNetworks];
                        newNets[index].areaId = e.target.value;
                        setOspfNetworks(newNets);
                      }}
                    />
                  </div>
                  {ospfNetworks.length > 1 && (
                    <button 
                      className="delete-row-btn" 
                      onClick={() => setOspfNetworks(ospfNetworks.filter(n => n.id !== net.id))}
                    >
                      <Activity size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button 
                className="add-network-btn" 
                onClick={() => setOspfNetworks([...ospfNetworks, { id: Date.now(), network: "", areaId: "" }])}
              >
                + Add Network
              </button>
            </div>
          </>
        ) : (
          /* OSPF Advanced Configuration Content */
          <div className="advanced-ospf-content">
            <div className="input-grid">
              <div className="input-field">
                <label>Hello Interval (sec)</label>
                <input type="number" defaultValue="10" />
              </div>
              <div className="input-field">
                <label>Dead Interval (sec)</label>
                <input type="number" defaultValue="40" />
              </div>
              <div className="input-field">
                <label>Priority</label>
                <input type="number" defaultValue="1" />
              </div>
              <div className="input-field">
                <label>Cost</label>
                <input type="number" placeholder="Auto" />
              </div>
            </div>
            <div className="checkbox-field" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
              <input type="checkbox" id="passive" />
              <label htmlFor="passive" style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}>Passive Interface</label>
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="cancel-btn" onClick={() => setIsOSPFModalOpen(false)}>Cancel</button>
        // Locate the Save button in your OSPF modal code
<button className="save-btn" onClick={() => {
  // 1. Create the log message based on the configuration
  const logMessage = `OSPF configured: Process ID 1, Router ID 1.1.1.1, ${ospfNetworks.length} network(s) defined.`;

  // 2. Dispatch a custom event with the log data
  const logEvent = new CustomEvent("add-system-log", {
    detail: {
      device: "Router",
      deviceName: selectedEntity?.name || "R-1", // Uses the selected router's name
      message: logMessage,
      location: "Data Center", // Or your dynamic location variable
    }
  });
  window.dispatchEvent(logEvent);

  // 3. Close the modal
  setIsOSPFModalOpen(false);
}}>
  Save
</button>
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