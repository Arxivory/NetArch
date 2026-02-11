import Grid from './Grid.js';
import ShapeCreator from './ShapeCreator.js';
import ShapeRenderer from '../rendering/ShapeRenderer.js';
import PointerHandler from '../rendering/PointerHandler.js';

export class LogicalLayout {
  constructor(opts = {}) {
    this.container = opts.container || document.body;
    this.width = opts.width || 800;
    this.height = opts.height || 600;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    this.grid = new Grid({
      gridSize: opts.gridSize || 32,
      gridColor: opts.gridColor || '#818181ff',
      gridMajorColor: opts.gridMajorColor || '#6b6b6bff',
      gridMinorAlpha: opts.gridMinorAlpha || 0.12,
      snap: opts.snap ?? true,
      snapTolerance: opts.snapTolerance || 8
    });

    this.shapeCreator = new ShapeCreator({
      onRectangleCreated: opts.onRectangleCreated || null,
      onCircleCreated: opts.onCircleCreated || null,
      onPolygonCreated: opts.onPolygonCreated || null,
      onWallCreated: opts.onWallCreated || null,
      onCableCreated: opts.onCableCreated || null
    });

    this.shapeRenderer = new ShapeRenderer({
      gridSize: opts.gridSize || 32
    });

    this.pointerHandler = new PointerHandler({
      onPointerDown: this._onPointerDown.bind(this),
      onPointerMove: this._onPointerMove.bind(this),
      onPointerUp: this._onPointerUp.bind(this)
    });

    this.canvas = null;
    this.ctx = null;

    this.mode = 'none';
    this.startPoint = null;
    this.currentPoint = null;
    this.viewState = { e: 0, f: 0 };

    this.rectangles = [];
    this.polygons = [];
    this.currentPolygon = [];
    this.circles = [];
    this.walls = [];
    this.doors = [];
    this.windows = [];
    this.roofs = [];
    this.freeforms = [];
    this.devices = [];
    this.cables = [];

    this.structureType = '';
    this.bgColor = opts.bgColor || '#ffffffff';

    this.onDeviceAdded = opts.onDeviceAdded || null;

    this._initCanvas();
    this._render();
  }

  _initCanvas() {
    const c = document.createElement('canvas');
    c.style.display = 'block';
    c.style.width = this.width + 'px';
    c.style.height = this.height + 'px';
    c.width = Math.floor(this.width * this.devicePixelRatio);
    c.height = Math.floor(this.height * this.devicePixelRatio);
    
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    
    this.container.appendChild(c);
    this.pointerHandler.attach(c);
  }

  destroy() {
    if (!this.canvas) return;
    this.pointerHandler.detach();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;
    if (!this.canvas) return;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.floor(w * this.devicePixelRatio);
    this.canvas.height = Math.floor(h * this.devicePixelRatio);
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    this._render();
  }

  setGridSize(size) {
    this.grid.setSize(size);
    this.shapeRenderer.gridSize = size;
    this._render();
  }

  enableSnap(enabled) {
    this.grid.setSnap(enabled);
  }

  clear() {
    this.rectangles = [];
    this.polygons = [];
    this.currentPolygon = [];
    this.circles = [];
    this.walls = [];
    this.roofs = [];
    this.doors = [];
    this.windows = [];
    this.freeforms = [];
    this.devices = [];
    this.cables = [];
    this.mode = 'none';
    this.startPoint = null;
    this.currentPoint = null;
    this._render();
  }

  startDrawRectangle(structureType = '') {
    this.mode = 'rectangle';
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawCircle(structureType = '') {
    this.mode = 'circle';
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawPolygon(structureType = '') {
    this.mode = 'polygon';
    this.currentPolygon = [];
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawWall() {
    this.mode = 'wall';
    this._updateCursor();
  }

  startDrawCable() {
    this.mode = 'cable';
    this._updateCursor();
  }

  startPan() {
    this.mode = 'pan';
    this._updateCursor();
  }

  cancelDrawing() {
    this.mode = 'none';
    this.startPoint = null;
    this.currentPoint = null;
    this.pointerHandler.setPointerDown(false);
    this._updateCursor();
    this._render();
  }

  addDevice(deviceData, x, y) {
    const device = {
      id: `device_${Math.random().toString(36).slice(2, 9)}`,
      type: deviceData.type,
      label: deviceData.label,
      x,
      y
    };
    this.devices.push(device);
    if (this.onDeviceAdded) {
      this.onDeviceAdded(device);
    }
    this._render();
  }

  getSnappedCanvasCoords(clientX, clientY) {
    const canvasPoint = this.pointerHandler.clientToWorld(clientX, clientY, this.viewState);
    return this.grid.snapToGrid(canvasPoint);
  }

  _updateCursor() {
    const cursorMap = {
      'rectangle': 'crosshair',
      'circle': 'crosshair',
      'polygon': 'crosshair',
      'wall': 'crosshair',
      'cable': 'crosshair',
      'pan': 'grab',
      'none': 'default'
    };
    this.pointerHandler.setCursor(cursorMap[this.mode] || 'default');
  }

  _onPointerDown(e) {
    if (this.mode === 'none') return;

    if (this.mode === 'pan') {
      this.pointerHandler.setCursor('grabbing');
      this.pointerHandler.setPanStart(e.clientX, e.clientY);
    }

    const p = this.pointerHandler.clientToWorld(e.clientX, e.clientY, this.viewState);
    const snapped = this.grid.snapToGrid(p);

    if (this.mode === 'polygon') {
      if (this.currentPolygon.length === 0) {
        this.currentPolygon.push(snapped);
      } else {
        const first = this.currentPolygon[0];
        const canClose = this.shapeCreator.canClosePolygon(
          first,
          snapped,
          this.grid.getSnapTolerance()
        );

        if (canClose && this.currentPolygon.length >= 3) {
          const polygon = this.shapeCreator.createPolygon(
            [...this.currentPolygon],
            this.structureType
          );
          if (polygon) {
            this.polygons.push(polygon);
          }
          this.currentPolygon = [];
          this.mode = 'none';
          this.currentPoint = null;
          this._updateCursor();
          this._render();
          return;
        }
        this.currentPolygon.push(snapped);
      }
      this.currentPoint = snapped;
      this._render();
      return;
    }

    this.pointerHandler.setPointerDown(true);
    this.startPoint = snapped;
    this.currentPoint = snapped;
    this._render();
  }

  _onPointerMove(e) {
    if (!this.canvas) return;

    const p = this.pointerHandler.clientToWorld(e.clientX, e.clientY, this.viewState);

    if (this.mode === 'polygon') {
      this.currentPoint = this.grid.snapToGrid(p);
      this._render();
      return;
    }

    const snapped = this.grid.snapToGrid(p);
    this.currentPoint = snapped;

    if (this.pointerHandler.getIsPointerDown() && this.mode !== 'none') {
      if (this.mode === 'pan') {
        this._pan(e.clientX, e.clientY);
      }
      this._render();
    }
  }

  _onPointerUp(e) {
    if (!this.pointerHandler.getIsPointerDown()) return;

    if (this.mode === 'pan') {
      this.pointerHandler.setCursor('grab');
    }

    this.pointerHandler.setPointerDown(false);

    if (!this.startPoint || !this.currentPoint) {
      this.startPoint = null;
      this.currentPoint = null;
      return;
    }

    this._createShapeFromMode();

    this.startPoint = null;
    this.currentPoint = null;
    this._render();
  }

  _createShapeFromMode() {
    if (this.mode === 'rectangle') {
      const rect = this.shapeCreator.createRectangle(
        this.startPoint,
        this.currentPoint,
        this.structureType
      );
      if (rect) this.rectangles.push(rect);
    } else if (this.mode === 'circle') {
      const circle = this.shapeCreator.createCircle(
        this.startPoint,
        this.currentPoint,
        this.structureType
      );
      if (circle) this.circles.push(circle);
    } else if (this.mode === 'wall') {
      const wall = this.shapeCreator.createWall(this.startPoint, this.currentPoint);
      if (wall) this.walls.push(wall);
    } else if (this.mode === 'cable') {
      const cable = this.shapeCreator.createCable(this.startPoint, this.currentPoint);
      if (cable) this.cables.push(cable);
    } else if (this.mode === 'polygon') {
      const polygon = this.shapeCreator.createPolygon(this.currentPolygon, this.structureType);
      if (polygon) this.polygons.push(polygon);
    }
  }

  _pan(clientX, clientY) {
    const delta = this.pointerHandler.getPanDelta(clientX, clientY);
    this.viewState.e += delta.dx;
    this.viewState.f += delta.dy;
    this.pointerHandler.setPanStart(clientX, clientY);
  }

  _render() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    ctx.setTransform(
      this.devicePixelRatio,
      0,
      0,
      this.devicePixelRatio,
      this.viewState.e * this.devicePixelRatio,
      this.viewState.f * this.devicePixelRatio
    );

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    this.grid.renderMinorGrids(ctx, w, h);
    this.grid.renderMajorGrids(ctx, w, h);

    this.shapeRenderer.renderRectangles(ctx, this.rectangles);
    this.shapeRenderer.renderPolygons(ctx, this.polygons);
    this.shapeRenderer.renderCircles(ctx, this.circles);
    this.shapeRenderer.renderWalls(ctx, this.walls);
    this.shapeRenderer.renderCables(ctx, this.cables);
    this.shapeRenderer.renderDevices(ctx, this.devices);

    if (this.mode === 'polygon' && this.currentPolygon.length > 0 && this.currentPoint) {
      ctx.save();
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = 'rgba(0,255,0,0.08)';
      ctx.lineWidth = 1.5;
      this.shapeRenderer.outlinePolygonInProgress(
        ctx,
        this.currentPolygon,
        this.currentPoint,
        this.grid.getSnapTolerance()
      );
      ctx.restore();
    } else if (this.startPoint && this.currentPoint) {
      ctx.save();
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = 'rgba(0,255,0,0.08)';
      ctx.lineWidth = 1.5;

      if (this.mode === 'rectangle') {
        this.shapeRenderer.outlineRectangle(ctx, this.startPoint, this.currentPoint);
      } else if (this.mode === 'circle') {
        this.shapeRenderer.outlineCircle(ctx, this.startPoint, this.currentPoint);
      } else if (this.mode === 'wall') {
        this.shapeRenderer.outlineWall(ctx, this.startPoint, this.currentPoint);
      } else if (this.mode === 'cable') {
        this.shapeRenderer.outlineCable(ctx, this.startPoint, this.currentPoint);
      }

      ctx.restore();
    }
  }
}

export default LogicalLayout;
