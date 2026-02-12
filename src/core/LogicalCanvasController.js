import appState from '../state/AppState.js';
import LogicalLayout from '../core/layout/LogicalLayout.js';

export class LogicalCanvasController {
  constructor(container, opts = {}) {
    this.layout = new LogicalLayout({
      container,
      width: opts.width || 800,
      height: opts.height || 600,
      gridSize: opts.gridSize || 32,
      snap: opts.snap ?? true,
      onRectangleCreated: (rect) => this._handleRectangleCreated(rect),
      onWallCreated: (wall) => this._handleWallCreated(wall),
      onCableCreated: (cable) => this._handleCableCreated(cable),
      onCircleCreated: (circle) => this._handleCircleCreated(circle),
      onPolygonCreated: (polygon) => this._handlePolygonCreated(polygon),
      onDeviceAdded: (device) => this._handleDeviceAdded(device)
    });

    this.domainLabelIter = 0;
    this.siteLabelIter = 0;
    this.floorLabelIter = 0;
    this.spaceLabelIter = 0;
  }

  destroy() {
    if (this.layout) {
      this.layout.destroy();
      this.layout = null;
    }
  }

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

  startDrawWall() {
    this.layout?.startDrawWall();
  }

  startDrawCable() {
    this.layout?.startDrawCable();
  }

  startDrawPolygon(type = '') {
    this.layout?.startDrawPolygon(type);
  }

  startPan() {
    this.layout?.startPan();
  }

  cancelDrawing() {
    this.layout?.cancelDrawing();
  }

  addDevice(deviceData, x, y) {
    this.layout?.addDevice(deviceData, x, y);
  }

  getSnappedCoords(clientX, clientY) {
    return this.layout?.getSnappedCanvasCoords(clientX, clientY);
  }

  clear() {
    this.layout?.clear();
  }

  // ============= State Management Handlers =============

  _handleRectangleCreated(rect) {
    if (rect.structureType === 'Domain') {
      appState.structural.addDomain({
        id: rect.id,
        label: `Domain ${this.domainLabelIter++}`,
        shapeType: 'rectangle',
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h
      });
    } else if (rect.structureType === 'Site') {
      const selection = appState.selection;

      const selectedDomainId = selection.getFocusedId();
      const selectedType = selection.focusedType;

      if (!selectedDomainId || selectedType !== 'domain') {
        console.warn('Site creation failed: A Domain must be selected in the hierarchy.');
        return;
      }

      appState.structural.addSite({
        id: rect.id,
        label: `Site ${this.siteLabelIter++}`,
        domainId: selectedDomainId,
        shapeType: 'rectangle',
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h
      });
    } else if (rect.structureType === 'Space') {
      // TODO: Get selected floor ID from appState.selection
      const selectedFloorId = appState.selection?.getSelectedId?.() || null;
      if (!selectedFloorId) {
        console.warn('No floor selected for space creation');
        return;
      }
      appState.structural.addSpace({
        id: rect.id,
        label: `Space ${rect.id}`,
        floorId: selectedFloorId,
        shapeType: 'rectangle',
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h
      });
    }
  }

  _handleWallCreated(wall) {
    // Walls don't go in structural hierarchy, just stored in layout
    // Could add to a separate store if needed
  }

  _handleCableCreated(cable) {
    // Cables don't go in structural hierarchy, just stored in layout
    // Could add to a separate store if needed
  }

  _handleCircleCreated(circle) {
    if (circle.structureType === 'Domain') {
      appState.structural.addDomain({
        id: circle.id,
        label: `Domain ${circle.id}`,
        x: circle.x,
        y: circle.y,
        r: circle.r
      });
    } else if (circle.structureType === 'Site') {
      const selectedDomainId = appState.selection?.getSelectedId?.() || null;
      if (!selectedDomainId) {
        console.warn('No domain selected for site creation');
        return;
      }
      appState.structural.addSite({
        id: circle.id,
        label: `Site ${circle.id}`,
        domainId: selectedDomainId,
        x: circle.x,
        y: circle.y,
        r: circle.r
      });
    } else if (circle.structureType === 'Space') {
      const selectedFloorId = appState.selection?.getSelectedId?.() || null;
      if (!selectedFloorId) {
        console.warn('No floor selected for space creation');
        return;
      }
      appState.structural.addSpace({
        id: circle.id,
        label: `Space ${circle.id}`,
        floorId: selectedFloorId,
        x: circle.x,
        y: circle.y,
        r: circle.r
      });
    }
  }

  _handlePolygonCreated(polygon) {
    if (polygon.structureType === 'Domain') {
      appState.structural.addDomain({
        id: polygon.id,
        label: `Domain ${polygon.id}`,
        shapeType: 'polygon',
        x: polygon.x,
        y: polygon.y,
        points: polygon.points
      });
    } else if (polygon.structureType === 'Site') {
      const selectedDomainId = appState.selection?.getSelectedId?.() || null;
      if (!selectedDomainId) {
        console.warn('No domain selected for site creation');
        return;
      }
      appState.structural.addSite({
        id: polygon.id,
        label: `Site ${polygon.id}`,
        shapeType: 'polygon',
        x: polygon.x,
        y: polygon.y,
        domainId: selectedDomainId,
        points: polygon.points
      });
    } else if (polygon.structureType === 'Space') {
      const selectedFloorId = appState.selection?.getSelectedId?.() || null;
      if (!selectedFloorId) {
        console.warn('No floor selected for space creation');
        return;
      }
      appState.structural.addSpace({
        id: polygon.id,
        label: `Space ${polygon.id}`,
        shapeType: 'polygon',
        x: polygon.x,
        y: polygon.y,
        floorId: selectedFloorId,
        points: polygon.points
      });
    }
  }

  _handleDeviceAdded(device) {
    // Device added - can be processed further if needed
    // Add to network store or selection
  }

  //we will call the appstate and push the data to the app state variables.
}

export default LogicalCanvasController;
