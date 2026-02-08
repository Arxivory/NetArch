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

  // ============= State Management Handlers (Will implement soonn) =============

  _handleRectangleCreated(rect) {
    // Rectangle creation handled by drawing layer
  }

  _handleWallCreated(wall) {
    // Wall creation handled by drawing layer
  }

  _handleCableCreated(cable) {
    // Cable creation handled by drawing layer
  }

  _handleCircleCreated(circle) {
    // Circle creation handled by drawing layer
  }

  _handlePolygonCreated(polygon) {
    // Polygon creation handled by drawing layer
  }

  _handleDeviceAdded(device) {
    // Device added - can be processed further if needed
  }

  //we will call the appstate and push the data to the app state variables.
}

export default LogicalCanvasController;
