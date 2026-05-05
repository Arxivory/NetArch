import MacTable from './MacTable.js';
import { isBroadcast } from '../Packet.js';

/**
 * SwitchingEngine.js
 * 
 * The Layer 2 processing brain of a switch.
 * Mirrors the RouterPipeline.js logic for Layer 2.
 */
export default class SwitchingEngine {
  constructor(device) {
    this.device = device;
    this.macTable = new MacTable();
  }

  processFrame(frame, ingressInterface) {
    // 1. Frame Ingress (Aligned with Packet.js schema)
    if (!frame || !frame.srcMAC || !frame.dstMAC) {
      console.warn(`[${this.device.hostname}] Dropping invalid frame.`);
      return;
    }

    const ingressPort = ingressInterface.physicalPort;
    if (!ingressPort || ingressPort.physicalStatus !== 'up') {
      return;
    }

    // 2. Extract VLAN from Packet.js vlanTag schema
    const vlanId = frame.vlanTag?.id || ingressInterface.vlan || 1;

    // 3. MAC Learning
    this.macTable.learn(frame.srcMAC, ingressPort.id, vlanId);

    // 4. Forwarding Decision (Using Packet.js helper)
    if (isBroadcast(frame)) {
      this._flood(frame, ingressPort, vlanId);
    } else {
      const egressPortId = this.macTable.lookup(frame.dstMAC, vlanId);

      if (egressPortId) {
        this._forward(frame, egressPortId);
      } else {
        this._flood(frame, ingressPort, vlanId);
      }
    }
  }

  _forward(frame, egressPortId) {
    const egressPort = this.device.ports.find(p => p.id === egressPortId);
    if (!egressPort || !egressPort.link || egressPort.physicalStatus !== 'up') return;
    
    egressPort.link.transmitPacket(frame, egressPort);
  }

  _flood(frame, ingressPort, vlanId) {
    const activePorts = this.device.occupiedPorts.filter(
      p => p.physicalStatus === 'up' && p.id !== ingressPort.id
    );

    activePorts.forEach(egressPort => {
      const portVlan = egressPort.interface?.vlan || 1;
      
      if (portVlan === vlanId) {
        const frameClone = JSON.parse(JSON.stringify(frame));
        egressPort.link.transmitPacket(frameClone, egressPort);
      }
    });
  }
}