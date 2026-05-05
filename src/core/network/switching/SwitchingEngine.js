import MacTable from './MacTable.js';

/**
 * SwitchingEngine.js
 * 
 * The Layer 2 processing brain of a switch.
 * Handles the deterministic frame processing pipeline:
 * 1. Frame Ingress
 * 2. MAC Learning
 * 3. Forwarding Decision (Known Unicast vs. Unknown/Broadcast)
 * 4. Egress
 */
export default class SwitchingEngine {
  /**
   * @param {import('../Device.js').default} device - The parent switch hardware
   */
  constructor(device) {
    this.device = device;
    this.macTable = new MacTable();
  }

  /**
   * The core pipeline. Called every time the switch receives a frame on any port.
   * 
   * @param {object} frame - The Layer 2 Ethernet Frame
   * @param {import('../Interface.js').default} ingressInterface - Where it came in
   */
  processFrame(frame, ingressInterface) {
    // 1. Frame Ingress & Validation
    if (!frame || !frame.srcMac || !frame.dstMac) {
      console.warn(`[${this.device.hostname}] Dropping invalid frame.`);
      return;
    }

    const ingressPort = ingressInterface.physicalPort;
    if (!ingressPort || ingressPort.physicalStatus !== 'up') {
      return;
    }

    // Default to VLAN 1 if the frame is untagged (Phase 1)
    // Later, we will read the access VLAN of the port here.
    const vlanId = frame.vlanId || ingressInterface.vlan || 1;

    // 2. MAC Learning
    // Record the Source MAC and the physical port it came from
    this.macTable.learn(frame.srcMac, ingressPort.id, vlanId);

    // 3. Forwarding Decision
    const isBroadcast = frame.dstMac.toUpperCase() === 'FF:FF:FF:FF:FF:FF';
    
    if (isBroadcast) {
      // Action: Flood broadcast frames
      this._flood(frame, ingressPort, vlanId);
    } else {
      // Look up the Destination MAC in the CAM table
      const egressPortId = this.macTable.lookup(frame.dstMac, vlanId);

      if (egressPortId) {
        // Known Unicast: Forward directly to the specific port
        this._forward(frame, egressPortId);
      } else {
        // Unknown Unicast: Flood it out all ports in the VLAN
        this._flood(frame, ingressPort, vlanId);
      }
    }
  }

  /**
   * Forward a frame out a specific physical port.
   * 
   * @param {object} frame 
   * @param {string} egressPortId 
   */
  _forward(frame, egressPortId) {
    // Look up the actual port object from the device chassis
    const egressPort = this.device.ports.find(p => p.id === egressPortId);
    
    if (!egressPort || !egressPort.link || egressPort.physicalStatus !== 'up') {
      return; // Drop if port is down or unplugged
    }

    // Pass the frame down to the physical cable to transmit
    egressPort.link.transmitPacket(frame, egressPort);
  }

  /**
   * Flood a frame out ALL active ports EXCEPT the one it arrived on.
   * 
   * @param {object} frame 
   * @param {import('../PhysicalPort.js').default} ingressPort 
   * @param {number} vlanId 
   */
  _flood(frame, ingressPort, vlanId) {
    // Find all ports that have cables plugged in and are active
    const activePorts = this.device.occupiedPorts.filter(
      p => p.physicalStatus === 'up' && p.id !== ingressPort.id
    );

    activePorts.forEach(egressPort => {
      // Phase 2 preview: Only flood out ports that belong to the same VLAN
      const portVlan = egressPort.interface?.vlan || 1;
      
      if (portVlan === vlanId) {
        // We clone the frame so each physical path gets its own instance in memory
        const frameClone = JSON.parse(JSON.stringify(frame));
        egressPort.link.transmitPacket(frameClone, egressPort);
      }
    });
  }
}