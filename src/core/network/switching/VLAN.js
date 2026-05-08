/**
 * VLAN.js
 * 
 * Manages the VLAN Database (vlan.dat) and port assignments for a Layer 2 Switch.
 */
export default class VLANManager {
  /**
   * @param {import('../Device.js').default} device - The parent switch hardware
   */
  constructor(device) {
    this.device = device;
    
    // VLAN Database: Map of vlanId (number) -> name (string)
    this.database = new Map();
    
    // Port Configurations
    // Maps portId -> 'access' | 'trunk'
    this.portModes = new Map(); 
    
    // Maps portId -> vlanId (for access ports)
    this.accessVlans = new Map();
    
    // Boot up with standard Cisco default VLANs
    this._initDefaults();
  }

  _initDefaults() {
    this.database.set(1, 'default');
    this.database.set(1002, 'fddi-default');
    this.database.set(1003, 'token-ring-default');
    this.database.set(1004, 'fddinet-default');
    this.database.set(1005, 'trnet-default');
  }

  // =========================================================================
  // VLAN DATABASE MANAGEMENT
  // =========================================================================

  addVlan(vlanId, name = null) {
    if (vlanId <= 0 || vlanId > 4094) {
      throw new Error("VLAN ID must be between 1 and 4094.");
    }
    const vlanName = name || `VLAN${vlanId.toString().padStart(4, '0')}`;
    this.database.set(vlanId, vlanName);
    console.log(`[${this.device.hostname}] Created VLAN ${vlanId} (${vlanName})`);
  }

  removeVlan(vlanId) {
    if ([1, 1002, 1003, 1004, 1005].includes(vlanId)) {
      throw new Error(`Cannot delete default VLAN ${vlanId}.`);
    }
    this.database.delete(vlanId);
    console.log(`[${this.device.hostname}] Deleted VLAN ${vlanId}`);
    
    // If a VLAN is deleted, any access ports assigned to it fallback to VLAN 1
    for (const [portId, pVlanId] of this.accessVlans.entries()) {
      if (pVlanId === vlanId) {
        this.accessVlans.set(portId, 1);
        console.warn(`[${this.device.hostname}] Port ${portId.split('::')[1]} fell back to VLAN 1`);
      }
    }
  }

  // =========================================================================
  // PORT CONFIGURATION (switchport)
  // =========================================================================

  setPortMode(portId, mode) {
    if (mode !== 'access' && mode !== 'trunk') {
      throw new Error("Port mode must be 'access' or 'trunk'.");
    }
    this.portModes.set(portId, mode);
    
    // Ensure it has a default access VLAN assigned if it doesn't already
    if (!this.accessVlans.has(portId)) {
      this.accessVlans.set(portId, 1);
    }
  }

  setAccessVlan(portId, vlanId) {
    if (!this.database.has(vlanId)) {
      console.log(`[${this.device.hostname}] VLAN ${vlanId} does not exist. Creating it.`);
      this.addVlan(vlanId);
    }
    this.accessVlans.set(portId, vlanId);
    this.portModes.set(portId, 'access'); // Automatically force to access mode
  }

  // =========================================================================
  // ENGINE LOGIC HOOKS (Used by SwitchingEngine.js)
  // =========================================================================

  /**
   * Determines the VLAN of an incoming frame.
   * If the frame arrived on an Access port, it is assigned that port's VLAN.
   */
  getIngressVlan(portId) {
    return this.accessVlans.get(portId) || 1;
  }

  /**
   * Checks if a frame belonging to a specific VLAN is allowed to leave this port.
   */
  isEgressAllowed(portId, frameVlanId) {
    const mode = this.portModes.get(portId) || 'access';
    
    if (mode === 'access') {
      // Isolation: Access ports can ONLY send traffic belonging to their exact VLAN
      const assignedVlan = this.accessVlans.get(portId) || 1;
      return assignedVlan === frameVlanId;
    } else if (mode === 'trunk') {
      // Trunk ports allow all VLANs to pass through
      return true; 
    }
    return false;
  }

  // =========================================================================
  // UI HELPERS (For your VLANModal.jsx later!)
  // =========================================================================
  
  getDatabase() {
    return Array.from(this.database.entries()).map(([id, name]) => ({ id, name }));
  }
}