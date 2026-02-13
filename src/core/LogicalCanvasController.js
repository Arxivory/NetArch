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
      onEntitySelected: (entity) => this._handleEntitySelected(entity)
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

  _handleShapeCreated(shapeData, shapeType) {
    const { structureType, id, x, y, w, h, r, points } = shapeData;

    if (structureType === 'Domain') {
      appState.structural.addDomain({
        id,
        label: `Domain ${this.counters.domain++}`,
        shapeType: shapeType,
        x, y, w, h, r, points
      });
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
}

export default LogicalCanvasController;