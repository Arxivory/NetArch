import appState from '../state/AppState.js';
import LogicalLayout from '../core/layout/LogicalLayout.js';
import { createDeviceInstance } from '../data/deviceCatalog';

export class LogicalCanvasController {
  constructor(container, opts = {}) {
    this.counters = {
      domain: 0,
      site: 0,
      floor: 0,
      space: 0
    };

    this.layout = new LogicalLayout({
      container,
      width: opts.width || 800,
      height: opts.height || 600,
      gridSize: opts.gridSize || 32,
      snap: opts.snap ?? true,
      
      onRectangleCreated: (rect) => this._handleShapeCreated(rect, 'rectangle'),
      onCircleCreated: (circle) => this._handleShapeCreated(circle, 'circle'),
      onPolygonCreated: (poly) => this._handleShapeCreated(poly, 'polygon'),
      onWallCreated: (wall) => this._handleWallCreated(wall),
      onCableCreated: (cable) => this._handleCableCreated(cable),
      onDeviceAdded: (device) => this._handleDeviceAdded(device),
      onEntitySelected: (entity) => this._handleEntitySelected(entity),
      onPortSelect: (device, x, y, callback) => this._handlePortSelect(device, x, y, callback),
      onEntityChanged: (en) => this._handleEntityChanged(en)
    });
  }

  destroy() {
    if (this.layout) {
      this.layout.destroy();
      this.layout = null;
    }
  }

  // =========================================================
  // PUBLIC API
  // =========================================================

  setSize(w, h) {
    this.layout?.setSize(w, h);
  }

  setGridSize(size) {
    this.layout?.setGridSize(size);
  }

  enableSnap(enabled) {
    this.layout?.enableSnap(enabled);
  }

  startDrawRectangle(type = '') {
    this.layout?.startDrawRectangle(type);
  }

  startDrawCircle(type = '') {
    this.layout?.startDrawCircle(type);
  }

  startDrawPolygon(type = '') {
    this.layout?.startDrawPolygon(type);
  }

  startDrawWall() {
    this.layout?.startDrawWall();
  }

  startDrawCable() {
    this.layout?.startDrawCable();
  }

  startSelect() {
    this.layout?.startSelect();
  }

  startPan() {
    this.layout?.startPan();
  }

  cancelDrawing() {
    this.layout?.cancelDrawing();
  }

  getSnappedCoords(clientX, clientY) {
    return this.layout?.getSnappedCanvasCoords(clientX, clientY);
  }

  clear() {
    this.layout?.clear();
  }

  addDevice(deviceData, x, y) {
    if (!this.layout) return;

    const catalogId = deviceData.modelId || deviceData.type;

    try {
      const newDevice = createDeviceInstance(catalogId, { x, y, z: 0 });

      this.layout.addDevice({
        ...newDevice,
        label: newDevice.name
      }, x, y);

      if (appState.network?.addDevice) {
        appState.network.addDevice(newDevice);
        console.log('From Logical Canvas Controller, the device: ', newDevice, ' is added');
      }
    } catch (error) {
      console.error("Failed to add device:", error.message);
    }
  }

  updateEntityTransform(id, updates) {
    this.layout?.updateEntityTransform(id, updates);
  }

  // =========================================================
  // STATE MANAGEMENT HANDLERS
  // =========================================================

  _handlePortSelect(device, x, y, callback) {
    // 1. Remove any existing port menus
    const existingMenu = document.getElementById('canvas-port-menu');
    if (existingMenu) existingMenu.remove();

    if (!device.interfaces || device.interfaces.length === 0) {
      console.warn(`Device ${device.label} has no ports available.`);
      callback(null);
      return;
    }

    // --- NEW LOGIC: Check for Used Ports ---
    const usedPorts = new Set();
    
    // Scan all existing cables to see what is already plugged into this device
    if (this.layout && this.layout.cables) {
      this.layout.cables.forEach(cable => {
        if (cable.sourceId === device.id && cable.sourcePort) {
          usedPorts.add(cable.sourcePort);
        }
        if (cable.targetId === device.id && cable.targetPort) {
          usedPorts.add(cable.targetPort);
        }
      });
    }

    // Filter the device's total ports against the used ports
    const availablePorts = device.interfaces.filter(port => !usedPorts.has(port));

    // If all ports are full, let the user know and cancel!
    if (availablePorts.length === 0) {
      alert(`All ports on ${device.label} are currently in use!`);
      callback(null);
      return;
    }
    // ---------------------------------------

    // 2. Create the floating menu container
    const menu = document.createElement('div');
    menu.id = 'canvas-port-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = '#ffffff';
    menu.style.border = '1px solid #94a3b8';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    menu.style.padding = '4px 0';
    menu.style.zIndex = '9999';
    menu.style.minWidth = '140px';
    menu.style.maxHeight = '300px'; // Add a max height just in case of 48-port switches
    menu.style.overflowY = 'auto';  // Add scrolling for large numbers of ports
    menu.style.fontFamily = 'sans-serif';
    menu.style.fontSize = '12px';
    menu.style.color = '#0f172a';

    // 3. Create a clickable row ONLY for available ports
    availablePorts.forEach(port => {
      const item = document.createElement('div');
      item.innerText = port;
      item.style.padding = '8px 16px';
      item.style.cursor = 'pointer';
      item.style.transition = 'background-color 0.1s';
      
      item.onmouseenter = () => item.style.backgroundColor = '#f1f5f9';
      item.onmouseleave = () => item.style.backgroundColor = '#ffffff';

      item.onclick = (e) => {
        e.stopPropagation(); 
        menu.remove();
        document.removeEventListener('pointerdown', outsideClickListener);
        callback(port); 
      };
      
      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const outsideClickListener = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('pointerdown', outsideClickListener);
        callback(null); 
      }
    };
    
    setTimeout(() => {
      document.addEventListener('pointerdown', outsideClickListener);
    }, 10);
  }

  _handleShapeCreated(shapeData, shapeType) {
    const { structureType, id, x, y, w, h, r, points } = shapeData;

    if (structureType === 'Domain') {
      const data = {
        ...shapeData,
        label: `Domain ${this.counters.domain++}`,
      };
      console.log(data);
      appState.structural.addDomain(data);
    } 
    
    else if (structureType === 'Site') {
      const selection = appState.selection;
      const selectedDomainId = selection.getFocusedId() || selection.getSelectedId?.();

      if (!selectedDomainId) {
        console.warn('Site creation failed: A Domain must be selected.');
        return;
      }

      appState.structural.addSite({
        id,
        domainId: selectedDomainId,
        label: `Site ${this.counters.site++}`,
        shapeType: shapeType,
        x, y, w, h, r, points
      });
    } 
    
    else if (structureType === 'Space') {
      // const selectedFloorId = appState.ui?.activeFloorId || appState.selection?.getSelectedId?.();
      
      // if (!selectedFloorId) {
      //   console.warn('No floor selected for space creation');
      //   return;
      // }

      // appState.structural.addSpace({
      //   id,
      //   floorId: selectedFloorId,
      //   label: `Space ${this.counters.space++}`,
      //   shapeType: shapeType,
      //   x, y, w, h, r, points
      // });

      const selection = appState.selection;
      const selectedSiteId = selection.getFocusedId() || selection.getSelectedId();

      if (!selectedSiteId) {
        console.warn("Space creation failed: A Site must be selected.");
        return;
      }

      appState.structural.addSpace({
        id,
        siteId: selectedSiteId,
        label: `Space ${this.counters.space++}`,
        shapeType: shapeType,
        x, y, w, h, r, points
      });
    }
  }

  _handleWallCreated(wallData) {
    const activeFloorId = appState.ui?.activeFloorId;
    if (activeFloorId && appState.structural.addFenestration) {
      appState.structural.addFenestration(activeFloorId, {
        id: wallData.id,
        floorId: activeFloorId,
        type: 'wall',
        geometry: { start: wallData.start, end: wallData.end, thickness: 0.2 }
      });
    }
  }

  _handleCableCreated(cableData) {
    if (appState.network?.connectDevices && cableData.sourceId && cableData.targetId) {
      appState.network.connectDevices(
        cableData.sourceId,
        cableData.targetId,
        cableData.cableType || 'ethernet'
      );
    }
  }
  
  _handleZoomSelected(zoom){
    this.layout.setZoom(zoom);
  }

  _handleDeviceAdded(device) {
    this.addDevice(device, device.x, device.y);
  }
  
  _handleEntitySelected(entity) {
    if (!entity || !entity.id) {
      appState.selection.clearSelection?.();
      return;
    }

    appState.selection.selectDevice(entity.id, false);
  }
  
  _handleEntityChanged(en){
    //console.log("notified");
    appState.selection.notify();
  }
}

export default LogicalCanvasController;