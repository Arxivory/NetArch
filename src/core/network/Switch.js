/**
 * Switch.js
 * 
 * Behavior installer for switches.
 * Attaches Layer 2 switching logic to a Device instance at runtime.
 * 
 * Pattern: Behavior/Mixin rather than subclassing.
 * This avoids coupling DeviceFactory to switch-specific logic.
 * 
 * Usage:
 *   const device = new Device(config);
 *   if (device.type === 'switch') {
 *     installSwitchBehavior(device);
 *   }
 */

import SwitchingEngine from './switching/SwitchingEngine.js';
import VLANManager from './switching/VLAN.js';
import STPEngine from './switching/protocols/STP.js';

/**
 * Install switch behavior on a Device instance.
 * After calling this, the device will:
 *  - Have a MAC Address Table (CAM)
 *  - Support Layer 2 frame forwarding and flooding
 *  - Isolate broadcast domains (VLANs)
 * 
 * @param {Device} device - The device to upgrade to a switch
 * @returns {Device} The same device, now with switching behavior
 */
export function installSwitchBehavior(device) {
  // Prevent double-installation
  if (device._switchInstalled) {
    console.warn(`[${device.hostname}] Switch behavior already installed`);
    return device;
  }

  // =========================================================================
  // INSTALL SWITCHING COMPONENTS
  // =========================================================================
  // Install the VLAN Manager first, as the Switching Engine will rely on it for VLAN info
  device.vlanManager = new VLANManager(device);
  // Instantiates the brain, which internally creates the MacTable
  device.engine = new SwitchingEngine(device);

  // Install and boot Spanning Tree
  device.stpEngine = new STPEngine(device);
  device.stpEngine.start()
  // =========================================================================
  // OVERRIDE PACKET HANDLING
  // =========================================================================

  /**
   * Main packet receiving hook.
   * Called whenever an interface receives a frame from a physical link.
   */
  device.onPacketReceived = function(packet, ingressInterface) {
    // Route the ethernet frame through the Layer 2 pipeline
    this.engine.processFrame(packet, ingressInterface);
  };

  // =========================================================================
  // INTERFACE STATUS CHANGES
  // =========================================================================

  /**
   * Called when an interface comes up or goes down.
   * Clears MAC addresses associated with a port that goes down.
   */
  const originalOnInterfaceStatusChange = device.onInterfaceStatusChange;
  device.onInterfaceStatusChange = function(iface, newStatus, prevStatus) {
    // Call original if it exists
    if (originalOnInterfaceStatusChange) {
      originalOnInterfaceStatusChange.call(this, iface, newStatus, prevStatus);
    }

    // If a port goes down, flush its dynamically learned MAC addresses
    if (newStatus === 'down' || newStatus === 'err-disabled') {
      const portId = iface.physicalPort?.id;
      if (portId) {
        // Iterate and remove entries matching this port
        for (const [mac, data] of this.engine.macTable.entries.entries()) {
          if (data.portId === portId) {
            this.engine.macTable.entries.delete(mac);
          }
        }
        console.log(`[${this.hostname}] Flushed MAC entries for downed interface ${iface.name}`);
      }
    }
  };

  // =========================================================================
  // MANAGEMENT COMMANDS (Cisco CLI Equivalents)
  // =========================================================================

  /**
   * Display the MAC address table (Cisco-style: show mac address-table)
   * Essential for connecting to your Advanced Configuration UI modals.
   */
  device.showMacAddressTable = function() {
    return this.engine.macTable.getTable();
  };

  /**
   * Clear dynamic MAC address entries (Cisco-style: clear mac address-table dynamic)
   */
  device.clearMacAddressTable = function() {
    this.engine.macTable.flush();
    console.log(`[${this.hostname}] MAC address table cleared.`);
  };

  // NEW: UI helper to display VLAN assignments (Cisco: show vlan brief)
  device.showVlanBrief = function() {
    const db = this.vlanManager.getDatabase();
    return db.map(vlan => {
       const ports = [];
       // Find all access ports assigned to this VLAN
       for(const [portId, vId] of this.vlanManager.accessVlans.entries()) {
           if(vId === vlan.id && this.vlanManager.portModes.get(portId) !== 'trunk') {
               const portName = portId.split('::')[1] || portId; // Extract friendly name
               ports.push(portName);
           }
       }
       return { ...vlan, ports };
    });
  };

  // =========================================================================
  // MARK INSTALLATION COMPLETE
  // =========================================================================

  device._switchInstalled = true;

  console.log(`[${device.hostname}] Switch behavior installed ✓`);

  return device;
}

/**
 * Check if a device has switch behavior installed.
 * @param {Device} device
 * @returns {boolean}
 */
export function isSwitch(device) {
  return device._switchInstalled === true;
}

/**
 * Uninstall switch behavior (cleanup).
 * @param {Device} device
 */
export function uninstallSwitchBehavior(device) {
  if (!device._switchInstalled) {
    return;
  }

  // Clear state
  if (device.engine && device.engine.macTable) {
    device.engine.macTable.flush();
  }

  // Remove added methods and components
  delete device.vlanManager;
  delete device.engine;
  delete device.showMacAddressTable;
  delete device.clearMacAddressTable;
  delete device.showVlanBrief;
  delete device._switchInstalled;

  console.log(`[${device.hostname}] Switch behavior uninstalled`);
}

export default {
  installSwitchBehavior,
  isSwitch,
  uninstallSwitchBehavior,
};