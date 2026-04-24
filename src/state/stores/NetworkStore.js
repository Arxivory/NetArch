import Device from "../../core/network/Device";
import appState from "../AppState";

export class NetworkStore {
  constructor() {
    this.devices = [];
    this.links = [];
    this.metadata = {
      name: 'Untitled Network',
      created: new Date(),
      modified: new Date()
    };
    this.listeners = [];
  }

  addDevice(deviceData) {
    if (!deviceData.id || !deviceData.type || !deviceData.position) {
      console.error('Invalid device data', deviceData);
      return null;
    }

    if (this.devices.find(d => d.id === deviceData.id)) {
      console.warn(`Device already exists: ${deviceData.id}`);
      return null;
    }

    console.log(deviceData);

    const floor = appState.structural.getFloor(deviceData.floorId);

    const device = new Device({
        id: deviceData.id,
        type: deviceData.type,
        hostname: deviceData.name || deviceData.label || deviceData.hostname,
        catalogId: deviceData.catalogId,
        siteId: deviceData.siteId,
        floorId: deviceData.floorId,
        spaceId: deviceData.spaceId,
        domainId: deviceData.domainId,
        transform: {
            position: { x: deviceData.position.x * 0.7, y: floor.altitude + 1, z: deviceData.position.y * 0.7},
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 7, y: 7, z: 7 }
        }
    });

    this.devices.push(device);
    this.updateModified();
    this.notify();

    return device;
  }

removeDevice(deviceId) {
    const index = this.devices.findIndex(d => d.id === deviceId);
    if (index === -1) return false;

    // 1. Use the correct property names: sourceId and targetId
    const linksToRemove = this.links
        .filter(l => l.sourceId === deviceId || l.targetId === deviceId)
        .map(l => l.id);

    // 2. Delete those cables first to free up surviving ports!
    linksToRemove.forEach(linkId => {
        this.removeLink(linkId); 
    });

    // 3. Now safely destroy the device itself
    this.devices.splice(index, 1);
    
    // Tell the Canvas to visually destroy the device graphic
    window.dispatchEvent(new CustomEvent('forceCanvasDelete', { detail: { id: deviceId } }));

    this.updateModified();
    this.notify();

    return true;
  }

updateDevice(deviceId, updates) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) return false;

    // 1. Guardrail: Prevent Empty Names
    if (updates.label !== undefined) {
        if (updates.label.trim() === '') {
            delete updates.label; // Cancel this specific update
        } else {
            device.hostname = updates.label;
            device.name = updates.label;
            device.label = updates.label;
        }
    }

    Object.assign(device, updates);

    // 2. Dispatch event to instantly update Canvas
    window.dispatchEvent(new CustomEvent('forceCanvasUpdate', { 
        detail: { id: deviceId, updates } 
    }));
    
    this.updateModified();
    this.notify(); 
    return true;
  }

  getDevice(deviceId) {
    return this.devices.find(d => d.id === deviceId);
  }

  getAllDevices() {
    return [...this.devices];
  }

  addLink(linkData) {
    if (!linkData.id || !linkData.sourceId || !linkData.targetId) {
      console.error('Invalid link data', linkData);
      return null;
    }

    if (!this.getDevice(linkData.sourceId) || !this.getDevice(linkData.targetId)) {
      console.error('One or both devices do not exist');
      return null;
    }

    const link = {
      ...linkData,
      properties: linkData.properties || {}
    };

    this.links.push(link);
    this.updateModified();
    this.notify();

    return link;
  }

  // Helper to safely detach a port so it returns to the dropdown
  _freePort(deviceId, portId) {
    const dev = this.devices.find(d => d.id === deviceId);
    if (dev && dev.interfaces) {
      const port = dev.interfaces.find(i => 
        i.id === portId || i.name === portId || i.label === portId
      );
      if (port) {
        port.status = 'available';
        port.connected = false;
        delete port.connectedTo;
        delete port.linkId;
        delete port.targetDevice;
        delete port.targetInterface;
      }
    }
  }

  // The main update function
  updateLinkEndpoint(linkId, endpointType, newDeviceId, newPortId) {
    const link = this.getLink(linkId);
    if (!link) return false;

    // 1. Free the old port on the old device
    const oldDeviceId = endpointType === 'source' ? link.sourceId : link.targetId;
    const oldPortId = endpointType === 'source' ? link.sourcePort : link.targetPort;
    this._freePort(oldDeviceId, oldPortId);

    // 2. Update the link with the new destination
    if (endpointType === 'source') {
      link.sourceId = newDeviceId;
      link.sourcePort = newPortId;
    } else {
      link.targetId = newDeviceId;
      link.targetPort = newPortId;
    }

    this.updateModified();
    this.notify();

    // Force UI properties panel to re-render to reflect the freed/used ports
    if (appState.selection && typeof appState.selection.notify === 'function') {
      appState.selection.notify();
    }
    return true;
  }

removeLink(linkId) {
    const index = this.links.findIndex(l => l.id === linkId);
    if (index === -1) return false;

    const link = this.links[index];

    // Helper function to thoroughly scrub a port clean
    const freePort = (devId, portId) => {
        const dev = this.devices.find(d => d.id === devId);
        if (dev && dev.interfaces) {
            const port = dev.interfaces.find(i => 
                i.id === portId || i.name === portId || i.label === portId
            );
            
            if (port) {
                // Completely free the port so it returns to the dropdown
                port.status = 'available';
                port.connected = false;
                delete port.connectedTo;
                delete port.linkId;
                delete port.targetDevice;
                delete port.targetInterface;
            }
        }
    };

    // 1. Free the ports using the CORRECT cable properties!
    freePort(link.sourceId, link.sourcePort);
    freePort(link.targetId, link.targetPort);

    // 2. Destroy the Link data
    this.links.splice(index, 1);

    // 3. Tell the Canvas to visually destroy the cable
    window.dispatchEvent(new CustomEvent('forceCanvasDelete', { detail: { id: linkId } }));

    this.updateModified();
    this.notify();

    // 4. Force the Properties Panel to re-render so the dropdown updates instantly
    if (appState.selection && typeof appState.selection.notify === 'function') {
        appState.selection.notify();
    }

    return true;
  }

  getLink(linkId) {
    return this.links.find(l => l.id === linkId);
  }

  getAllLinks() {
    return [...this.links];
  }

  setNetworkName(name) {
    this.metadata.name = name;
    this.updateModified();
    this.notify();
  }

  getNetworkName() {
    return this.metadata.name;
  }

  updateModified() {
    this.metadata.modified = new Date();
  }

  reset() {
    this.devices = [];
    this.links = [];
    this.metadata = {
      name: 'Untitled Network',
      created: new Date(),
      modified: new Date()
    };
    this.notify();
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('Listener must be a function');
      return () => {};
    }

    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this);
      } catch (error) {
        console.error('Error in NetworkStore listener:', error);
      }
    });
  }
}
