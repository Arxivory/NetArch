import Device from "../../core/network/Device";

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

    const device = new Device({
        id: deviceData.id,
        type: deviceData.type,
        hostname: deviceData.name || deviceData.label || deviceData.hostname,
        siteId: deviceData.siteId,
        floorId: deviceData.floorId,
        spaceId: deviceData.spaceId,
        domainId: deviceData.domainId,
        transform: {
            position: deviceData.position || { x: 0, y: 0, z: 0 }
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

    this.devices.splice(index, 1);

    this.links = this.links.filter(
      l => l.sourceDevice !== deviceId && l.targetDevice !== deviceId
    );

    this.updateModified();
    this.notify();

    return true;
  }

  updateDevice(deviceId, updates) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) return false;

    Object.assign(device, updates);
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
    if (!linkData.id || !linkData.sourceDevice || !linkData.targetDevice) {
      console.error('Invalid link data', linkData);
      return null;
    }

    if (!this.getDevice(linkData.sourceDevice) || !this.getDevice(linkData.targetDevice)) {
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

  removeLink(linkId) {
    const index = this.links.findIndex(l => l.id === linkId);
    if (index === -1) return false;

    this.links.splice(index, 1);
    this.updateModified();
    this.notify();

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
