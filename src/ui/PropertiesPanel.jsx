import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import appState from "../state/AppState";
import { UpdateEntityTransformCommand } from "../core/editor/DrawingCommands";


const DEVICE_CONFIGS = {
  router: [
    { label: "Routing Protocol", desc: "Configure OSPF, BGP, or Static routes" },
    { label: "NAT/PAT", desc: "Translate private IPs to public addresses" },
    { label: "Access Control List", desc: "Create permit/deny traffic rules" },
    { label: "DHCP Server", desc: "Manage IP address pools for the network" },
    { label: "VPN Config", desc: "Set up secure site-to-site tunnels" },
    { label: "SNMP/MIB", desc: "Configure remote monitoring and alerts" },
    { label: "NTP", desc: "Synchronize device clock with time servers" },
    { label: "Terminal/SSH", desc: "Secure remote command line access" }
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
  const [transform, setTransform] = useState({
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 }
  });

  useEffect(() => {
    const unsubscribe = appState.selection.subscribe(() => {
      let ids = appState.selection.getSelectedDeviceIds();
      if (!ids || ids.length === 0) {
        const focused = appState.selection.getFocusedId();
        if (focused) ids = [focused];
      }

      if (ids && ids.length > 0) {
        const entityId = ids[0];
        const entity = findEntityById(entityId);
        if (entity) {
          setSelectedEntity(entity);
          setTransform(entity.transform || {
            position: { x: entity.x || 0, y: entity.y || 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            rotation: { x: 0, y: 0, z: 0 }
          });
          return;
        }
      }
      setSelectedEntity(null);
    });

    return () => unsubscribe && unsubscribe();
  }, [canvasController]);

  const findEntityById = (id) => {
    if (!canvasController || !canvasController.layout) return null;
    return canvasController.layout.findEntityById(id);
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

  const isDevice = 
    selectedEntity && 
    selectedEntity.interfaces !== undefined;
  
    const isCable = 
      selectedEntity && 
      selectedEntity.sourceId !== undefined && 
      selectedEntity.targetId !== undefined;

   const isWall = 
    selectedEntity && 
    selectedEntity.type === "wall";

   const isStructure = 
    selectedEntity && 
    (
      selectedEntity.structureType === "Domain" ||
      selectedEntity.structureType === "Site" ||
      selectedEntity.structureType === "Floor" ||
      selectedEntity.structureType === "Space" ||
      selectedEntity.type === "space" ||
      selectedEntity.type === "site" ||
      selectedEntity.type === "domain" ||
      selectedEntity.type === "floor"
    );

    const isFurniture =
    selectedEntity &&
    !isDevice &&
    !isCable &&
    !isWall &&
    !isStructure;

  // 1. Keep handleTransformChange separate
  const handleTransformChange = (type, axis, value) => {
    if (!selectedEntity || !canvasController) return;

    const newTransform = JSON.parse(JSON.stringify(transform));
    if (type === 'scale') {
      newTransform.scale.x = parseFloat(value);
    } else {
      newTransform[type][axis] = parseFloat(value);
    }
    setTransform(newTransform);

    const updates = {};
    updates[type] = newTransform[type];
    const cmd = new UpdateEntityTransformCommand(canvasController, appState, selectedEntity.id, updates);
    cmd.execute();
  };

  // 2. Define handleDeviceChange AFTER the closing bracket of the previous function
  const handleDeviceChange = (field, value) => {
    if (!selectedEntity || !canvasController) return;

    const updatedEntity = { ...selectedEntity, [field]: value };
    setSelectedEntity(updatedEntity);

    if (canvasController.updateDevice) {
      canvasController.updateDevice(selectedEntity.id, { [field]: value });
    }
  };

  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      
      {isCable && (
        <div className="properties-group">
          <div><label>Cable Type</label>
          <input 
            className="field-input" 
            value={selectedEntity.type || ""} 
            readOnly
          />
        </div>

          <div><label>Source Device</label>
          <input 
            className="field-input" 
            value={getDeviceLabel(selectedEntity.sourceId)} 
            readOnly
            />
          </div>

          <div><label>Source Port</label>
          <input 
            className="field-input" 
            value={selectedEntity.sourcePort || ""} 
            readOnly
            />
          </div>

          <div><label>Target Device</label>
          <input 
            className="field-input" 
            value={getDeviceLabel(selectedEntity.targetId)} 
            readOnly
            />
          </div>

          <div><label>Target Port</label>
          <input 
            className="field-input" 
            value={selectedEntity.targetPort || ""} 
            readOnly /></div>
        </div>
        
      )}

      {isWall && (
        <div className="properties-group">
          <div><label>Wall Name</label><input className="field-input" value={selectedEntity.label || "Wall"} readOnly /></div>
          <div>
            <label>Material</label>
            <select className="field-input">
              <option>Concrete</option>
              <option>Wood</option>
              <option>Glass</option>
              <option>Metal</option>
            </select>
          </div>
        </div>
      )}

      {isDevice && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div><label>Device Name</label>
          <input 
            className="field-input" 
            value={selectedEntity?.label || ""} 
            onChange={(e) => handleDeviceChange('label', e.target.value)}
           />
          </div>

          <div><label>IP Address</label>
          <input 
            className="field-input" 
            value={selectedEntity?.interfaces?.[0]?.ipv4?.address || ""} 
            onChange={(e) => handleDeviceChange('ipAddress', e.target.value)}
             />
          </div>

          <div><label>Subnet Mask</label>
          <input 
            className="field-input" value={selectedEntity?.interfaces?.[0]?.ipv4?.subnetMask || ""} 
            onChange={(e) => handleDeviceChange('subnetMask', e.target.value)} 
            />
          </div>

          <div><label>Default Gateway</label>
          <input 
            className="field-input" 
            value={selectedEntity?.defaultGateway || ""} 
              onChange={(e) => handleDeviceChange('defaultGateway', e.target.value)} 
          />
          </div>
          <button 
            className="floor-specifier-btn" 
            style={{ marginTop: "12px", width: "100%" }} 
            onClick={() => setIsModalOpen(true)}
          >
            Advanced Configuration
          </button>
        </div>
      )}

      {isStructure && (
        <div className="properties-group">
          <hr className="header-separator" />
          <div><label>Name</label><input className="field-input" value={selectedEntity.label || selectedEntity.name || ""} readOnly /></div>
          <div><label>Type</label><input className="field-input" value={selectedEntity.structureType || selectedEntity.type || ""} readOnly /></div>
          <div>
            <label>Material</label>
            <select className="field-input">
              <option>Concrete</option>
              <option>Wood</option>
              <option>Tile</option>
              <option>Carpet</option>
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
            <input type="number" className="field-input" value={transform.scale.x} onChange={(e) => handleTransformChange('scale', 'x', e.target.value)} />
            <input type="number" className="field-input" defaultValue={0} disabled />
            <input type="number" className="field-input" defaultValue={0} disabled />
          </div>
          <div className="transform-grid">
            <label>Rotation</label>
            <input type="number" className="field-input" value={transform.rotation.x} onChange={(e) => handleTransformChange('rotation', 'x', e.target.value)} />
            <input type="number" className="field-input" value={transform.rotation.y} onChange={(e) => handleTransformChange('rotation', 'y', e.target.value)} />
            <input type="number" className="field-input" value={transform.rotation.z} onChange={(e) => handleTransformChange('rotation', 'z', e.target.value)} />
          </div>
        </>
      ) : (
        <p style={{ padding: '1rem', color: '#999' }}>Select an entity to see transform properties</p>
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
                    {group.items.map((item) => (
                      <div key={item.label} className="config-item-card" onClick={() => console.log(`Opening ${item.label}`)}>
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
    </div>
  );
}