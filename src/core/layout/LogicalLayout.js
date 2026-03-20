import Grid from './Grid.js';
import ShapeCreator from './ShapeCreator.js';
import ShapeRenderer from '../rendering/ShapeRenderer.js';
import PointerHandler from '../rendering/PointerHandler.js';
import { Selection } from '../editor/Selection.js';
import EntityTransformer from './transform/EntityTransformer.js';
import { System } from 'check2d';
import appState from '../../state/AppState.js';

export class LogicalLayout {
  constructor(opts = {}) {
    this.container = opts.container || document.body;
    this.width = opts.width || 800;
    this.height = opts.height || 600;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    this.system = new System();

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
      onFreeformCreated: opts.onFreeformCreated || null,
      onWallCreated: opts.onWallCreated || null,
      onCableCreated: opts.onCableCreated || null,
      system: this.system
    });

    this.shapeRenderer = new ShapeRenderer({
      gridSize: opts.gridSize || 32
    });

    this.pointerHandler = new PointerHandler({
      onPointerDown: this._onPointerDown.bind(this),
      onPointerMove: this._onPointerMove.bind(this),
      onPointerUp: this._onPointerUp.bind(this),
      onRightClick: this._onRightClick.bind(this)
    });

    this.selection = new Selection({
      dpr: this.devicePixelRatio
    });

    this.entityTransformer = new EntityTransformer();

    this.selectedEntity = null;
    this.isResizing = false;
    this.resizeStart = null;

    this.canvas = null;
    this.ctx = null;

    this.mode = 'select';
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
    this.currentFreeform = [];
    this.devices = [];
    this.cables = [];
    this.furnitures = [];

    this.store = appState.selection;

    this.store.subscribe(() => this.syncWithState());

    this.pendingCableSource = null;
    this.currentCableType = "straight";
    this.hoveredDevice = null;
    this.activeCableType = "straight";

    this.structureType = '';
    this.bgColor = opts.bgColor || '#ffffffff';
    this.activeFloorId = null;

    this.onZoomSelected = opts.onZoomSelected || null;
    this.onDeviceAdded = opts.onDeviceAdded || null;
    this.onFurnitureAdded = opts.onFurnitureAdded || null;
    this.onEntitySelected = opts.onEntitySelected || null;
    this.onEntityChanged = opts.onEntityChanged || null;
    this.onPortSelect = opts.onPortSelect || null;

    this.selectedEntity = null;
    this.originalEntity = null;

    this.interaction = {
      mode: null,
      handle: null,
      start: null
    };


    this.deviceIcons = {};

    const svgs = {
      'router': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18h.01"/><path d="M10.01 18h.01"/><path d="M15 10v4"/><path d="M17.84 7.17a4 4 0 0 0-5.66 0"/><path d="M20.66 4.34a8 8 0 0 0-11.31 0"/></svg>`,
      'server': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
      'pc': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
      'switch': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></svg>`,
      'desk': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-armchair-icon lucide-armchair"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>',
      'firewall': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`
    };

    Object.keys(svgs).forEach(key => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgs[key]);
      this.deviceIcons[key] = img;
    });

    this._initCanvas();
    this._render();

    this.syncWithState();

  }

  syncWithState() {
    this.selectedEntity = this.findEntityById(this.store.getFocusedId());
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
    this.furnitures = [];
    this.cables = [];
    this.mode = 'none';
    this.startPoint = null;
    this.currentPoint = null;
    this._render();
  }

  setActiveFloor(floorId) {
    this.activeFloorId = floorId;
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

  startDrawFreeform(structureType = '') {
    this.mode = 'freeform';
    this.currentPolygon = [];
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawWall() {
    this.mode = 'wall';
    this._updateCursor();
  }

  startDrawCable(type = "straight") {
    this.mode = 'cable';
    this.activeCableType = type;
    this._updateCursor();
  }


  startSelect() {
    this.mode = 'select';
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
    const size = this.shapeRenderer.gridSize * 1.5;
    const device = this.shapeCreator.createDevice(deviceData, x, y, size);
    this.devices.push(device);

    if (this.onDeviceAdded) {
      this.onDeviceAdded(device);
    }
    this._render();
  }

 addFurniture(furnitureData, x, y) {
    console.log('Adding furniture with data:', furnitureData, 'from LogicalLaypout bsuiyti');
    const size = this.shapeRenderer.gridSize * 1.5;

    // Combine type and name to figure out what icon to show (if you have them)
    const rawType = (furnitureData.type + ' ' + (furnitureData.name || furnitureData.label || '')).toLowerCase();

    let iconKey = null;

    if (rawType.includes('desk') || rawType.includes('table')) {
      iconKey = 'desk';
    } else if (rawType.includes('chair') || rawType.includes('seat')) {
      iconKey = 'chair';
    } else if (rawType.includes('cabinet') || rawType.includes('rack')) {
      iconKey = 'cabinet';
    }

    // Assuming you might add a furnitureIcons dictionary in the future.
    // If it's undefined, your render loop will likely just draw the bounding box/path, which is fine!
    const iconImage = this.deviceIcons[iconKey];

    const half = size / 2;
    const px = x - half;
    const py = y - half;
    const path = new Path2D();
    path.rect(px, py, size, size);

    const furniture = {
      id: `furniture_${Math.random().toString(36).slice(2, 9)}`,
      type: furnitureData.type || 'furniture',
      label: furnitureData.name || furnitureData.label || 'Furniture',
      x,
      y,
      width: size,
      height: size,
      icon: iconImage, 
      transform: {
        position: { x, y, z: 0 },
        scale: 1,
        rotation: { x: 0, y: 0, z: 0 }
      },
      path,
      hitTestMode: 'path'
    };

    this.furnitures.push(furniture);

    if(this.onFurnitureAdded) {
      
      this.onFurnitureAdded(furniture);
    }
    this._render();
  }
 
  getSnappedCanvasCoords(clientX, clientY) {
    const zoomFactor = this.pointerHandler.getZoom();
    const canvasPoint = this.pointerHandler.clientToWorld(clientX, clientY, this.viewState, zoomFactor);
    return this.grid.snapToGrid(canvasPoint);
  }

  _updateCursor() {
    const cursorMap = {
      'rectangle': 'crosshair',
      'circle': 'crosshair',
      'polygon': 'crosshair',
      'freeform': 'crosshair',
      'wall': 'crosshair',
      'cable': 'crosshair',
      'pan': 'grab',
      'none': 'default',
      'select': 'default'
    };
    this.pointerHandler.setCursor(cursorMap[this.mode] || 'default');
  }

  _onPointerDown(e) {
    if (this.mode === 'none') {
      this.pointerHandler.setPointerDown(false);
      return;
    }

    if (this.mode === 'pan') {
      this.pointerHandler.setCursor('grabbing');
      this.pointerHandler.setPanStart(e.clientX, e.clientY);
      this.pointerHandler.setPointerDown(true);
    }

    const zoomFactor = this.pointerHandler.getZoom();
    const p = this.pointerHandler.clientToWorld(e.clientX, e.clientY, this.viewState, zoomFactor);
    const snapped = this.grid.snapToGrid(p);

    if (this.mode === 'cable') {
      const device = this._findDeviceAt(snapped.x, snapped.y);
      if (!device) return;

      if (this.onPortSelect) {
        this.onPortSelect(device, e.clientX, e.clientY, (selectedPort) => {
          if (!selectedPort) return;

          if (!this.pendingCableSource) {
            this.pendingCableSource = device;
            this.pendingCableSourcePort = selectedPort;
            this._render();
          } else {
            const cable = {
              id: `cable_${Math.random().toString(36).slice(2, 9)}`,
              type: this.activeCableType,
              sourceId: this.pendingCableSource.id,
              sourcePort: this.pendingCableSourcePort,
              targetId: device.id,
              targetPort: selectedPort,
              properties: {
                bandwidth: null,
                latency: null,
                status: "up"
              }
            };

            this.cables.push(cable);

            if (this.shapeCreator.onCableCreated) {
              this.shapeCreator.onCableCreated(cable);
            }

            this.pendingCableSource = null;
            this.pendingCableSourcePort = null;
            this._render();
          }
        });
      }
      return;
    }


    if (this.mode === 'select') {
      const en = this.identifyEntity(e.clientX, e.clientY);
      if (!en) {
        // Clear focus when clicking on empty canvas
        appState.selection.focusedNode(null, null);
        return;
      }

      if (en.saveCurrentPosition) {
        en.saveCurrentPosition();
      }

      const zoom = this.pointerHandler.getZoom();
      const p = this.pointerHandler.clientToWorld(e.clientX, e.clientY, this.viewState, zoom);

      const x = en.x;
      const y = en.y;
      const w = en.w || en.width;
      const h = en.h || en.height;
      const size = 8;

      const handles = {
        nw: [x, y],
        ne: [x + w, y],
        sw: [x, y + h],
        se: [x + w, y + h]
      };

      for (const key in handles) {
        const [hx, hy] = handles[key];
        if (Math.abs(p.x - hx) < size && Math.abs(p.y - hy) < size && en.type === 'rectangle') {
          this.interaction = {
            mode: 'resize',
            handle: key,
            start: { x: p.x, y: p.y }
          };
          this.pointerHandler.setPointerDown(true);
          return;
        }
      }

      this.interaction = {
        mode: 'move',
        start: { x: p.x, y: p.y }
      };

      this.pointerHandler.setPointerDown(true);
      return;
    }



    if (this.mode === 'polygon') {
      if (this.currentPolygon.length === 0) {
        this.currentPolygon.push(snapped);
      }
      else {
        const first = this.currentPolygon[0];
        const canClose = this.shapeCreator.canClosePolygon(
          first,
          snapped,
          this.grid.getSnapTolerance()
        );

        if (canClose && this.currentPolygon.length >= 3) {
          const polygon = this.shapeCreator.createPolygon(
            [...this.currentPolygon],
            this.structureType, this.system
          );
          if (!this._checkForOverlap(polygon, "creation")) {
            if (this.shapeCreator.onPolygonCreated) {
              this.shapeCreator.onPolygonCreated(polygon);
            }
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

    if (this.mode === 'freeform') {
      this.currentFreeform.push(snapped);
      this.currentPoint = snapped;
      this._render();
      return;
    }

    if (this.mode !== 'select' && this.mode !== 'pan' && this.mode !== 'none') {
      this.pointerHandler.setPointerDown(true);
      this.startPoint = snapped;
      this.currentPoint = snapped;
      this._render();
    }
  }

  _onPointerMove(e) {
    if (!this.canvas) return;

    const zoomFactor = this.pointerHandler.getZoom();
    const p = this.pointerHandler.clientToWorld(e.clientX, e.clientY, this.viewState, zoomFactor);

    if (this.mode === 'select') {
      if (this.selectedEntity) {
        const en = this.selectedEntity;

        const x = en.x;
        const y = en.y;
        const w = en.w || en.width;
        const h = en.h || en.height;
        const size = 8;

        const handles = {
          nw: [x, y],
          ne: [x + w, y],
          sw: [x, y + h],
          se: [x + w, y + h]
        };

        let cursor = 'move';

        for (const key in handles) {
          const [hx, hy] = handles[key];
          if (Math.abs(p.x - hx) < size && Math.abs(p.y - hy) < size) {
            cursor = (key === 'nw' || key === 'se')
              ? 'nwse-resize'
              : 'nesw-resize';
          }
        }
        this.pointerHandler.setCursor(cursor);
      }
      else {
        this.pointerHandler.setCursor('default');
      }
    }

    if (this.mode === 'polygon' || this.mode === 'freeform') {
      this.currentPoint = this.grid.snapToGrid(p);
      this._render();
      return;
    }

    const snapped = this.grid.snapToGrid(p);
    this.currentPoint = snapped;

    if (this.mode === 'cable') {
      this.hoveredDevice = this._findDeviceAt(snapped.x, snapped.y);
      this._render();
    } else {
      this.hoveredDevice = null;
    }

    if (this.pointerHandler.getIsPointerDown()) {
      if (this.mode === 'pan') {
        this._pan(e.clientX, e.clientY);
        this._render();
        return;
      }

      if (this.mode === 'select' && this.selectedEntity && this.interaction.mode) {
        const en = this.selectedEntity;

        const dx = p.x - this.interaction.start.x;
        const dy = p.y - this.interaction.start.y;

        if (this.interaction.mode === "move") {
          en.move(dx, dy);
        }

        if (this.interaction.mode === "resize" && en.type === 'rectangle') {
          let wKey = en.transform.scale.w;
          let hKey = en.transform.scale.h;
          switch (this.interaction.handle) {
            case "se":
              wKey += dx;
              hKey += dy;
              break;
            case "nw":
              en.move(dx, dy);
              wKey -= dx;
              hKey -= dy;
              break;
            case "ne":
              en.move(0, dy)
              wKey += dx;
              hKey -= dy;
              break;
            case "sw":
              en.move(dx, 0);
              wKey -= dx;
              hKey += dy;
              break;
            default:
              throw new Error();
          }
          en.setWidthAndHeight(wKey, hKey);
        }

        this.interaction.start = { x: p.x, y: p.y };
        this.onEntityChanged(en);
        this._render();
        return;
      }
      if (
        this.mode === 'rectangle' ||
        this.mode === 'circle' ||
        this.mode === 'wall' ||
        this.mode === 'cable'
      ) {
        this._render();
        return;
      }

    }

  }

  _onPointerUp(e) {
    if (this.interaction.mode === 'move') {
      if (this._checkForOverlap(this.selectedEntity, "transformation")) {
        this.selectedEntity.restoreToSavedPosition();
        this.onEntityChanged();
        this._render();
      }
    }

    this.interaction = {
      mode: null,
      handle: null,
      start: null
    };
    this.isResizing = false;
    this.resizeStart = null;

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

  _onRightClick() {
    if (this.currentFreeform.length > 1) {
      const freeform = this.shapeCreator.createFreeform(
        [...this.currentFreeform],
        this.structureType, this.system
      );
      if (!this._checkForOverlap(freeform, "creation")) {
        if (this.shapeCreator.onFreeformCreated) {
          this.shapeCreator.onFreeformCreated(freeform);
        }
        this.freeforms.push(freeform);
      }
      this.currentFreeform = [];
      this.mode = 'none';
      this.currentPoint = null;
      this._updateCursor();
      this._render();
    }
  }

  _createShapeFromMode() {
    const activeFloor = appState.ui.activeFloorId;

    if (this.mode === 'rectangle') {
      const rect = this.shapeCreator.createRectangle(
        this.startPoint,
        this.currentPoint,
        this.structureType,
      );
      if (rect) {
        rect.floorId = activeFloor || null;
        if (rect.body) rect.body.floorId = activeFloor || null;
        if (!this._checkForOverlap(rect, "creation")) {
          if (this.shapeCreator.onRectangleCreated) {
            this.shapeCreator.onRectangleCreated(rect);
          }
          this.rectangles.push(rect);
        }
      }
    } else if (this.mode === 'circle') {
      const circle = this.shapeCreator.createCircle(
        this.startPoint,
        this.currentPoint,
        this.structureType
      );
      if (circle) {
        circle.floorId = activeFloor || null;
        if (circle.body) circle.body.floorId = activeFloor || null;
        if (!this._checkForOverlap(circle, "creation")) {
          if (this.shapeCreator.onCircleCreated) {
            this.shapeCreator.onCircleCreated(circle);
          }
          this.circles.push(circle);
        }
      }
    } else if (this.mode === 'wall') {
      const wall = this.shapeCreator.createWall(this.startPoint, this.currentPoint);
      if (wall) {
        wall.floorId = activeFloor || null;
        this.walls.push(wall);
      }
    } else if (this.mode === 'cable') {
      const cable = this.shapeCreator.createCable(this.startPoint, this.currentPoint);
      if (cable) {
        cable.floorId = activeFloor || null;
        this.cables.push(cable);
      }
    } else if (this.mode === 'polygon') {
      const polygon = this.shapeCreator.createPolygon(this.currentPolygon, this.structureType);
      if (polygon) {
        polygon.floorId = activeFloor || null;
        if (polygon.body) polygon.body.floorId = activeFloor || null;
        if (!this._checkForOverlap(polygon, "creation")) {
          this.polygons.push(polygon);
        } else {
          // Remove polygon bodies if overlap check failed
          if (polygon.bodies) {
            for (const body of polygon.bodies) {
              this.system.remove(body);
            }
          } else if (polygon.body) {
            this.system.remove(polygon.body);
          }
        }
      }
    }
  }

  _pan(clientX, clientY) {
    const delta = this.pointerHandler.getPanDelta(clientX, clientY);
    this.viewState.e += delta.dx;
    this.viewState.f += delta.dy;
    this.pointerHandler.setPanStart(clientX, clientY);
  }

  _renderDeviceCables(ctx, activeFloor) {
    ctx.save();
    ctx.lineWidth = 2;

    for (const cable of this.cables) {
      const src = this.findEntityById(cable.sourceId);
      const dst = this.findEntityById(cable.targetId);

      if (!src || !dst) continue;

      if (activeFloor) {
        const srcOnFloor = src.floorId == null || src.floorId === activeFloor;
        const dstOnFloor = dst.floorId == null || dst.floorId === activeFloor;
        if (!srcOnFloor || !dstOnFloor) continue;
      }

      ctx.beginPath();

      if (cable.type === "console") {
        ctx.strokeStyle = "#007BFF";
        ctx.setLineDash([]);

        const midX = (src.x + dst.x) / 2;
        const midY = (src.y + dst.y) / 2 - 40;

        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(midX, midY, dst.x, dst.y);
      }

      else if (cable.type === "copper-crossover") {
        ctx.strokeStyle = "#000000";
        ctx.setLineDash([6, 4]);
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
      }

      else if (cable.type === "copper-straight") {
        ctx.strokeStyle = "#000000";
        ctx.setLineDash([]);
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
      }

      else {
        ctx.strokeStyle = "#000000";
        ctx.setLineDash([]);
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  _render() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const zoomFactor = this.pointerHandler.getZoom();
    const scale = this.devicePixelRatio * zoomFactor;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    ctx.setTransform(
      scale,
      0,
      0,
      scale,
      this.viewState.e * this.devicePixelRatio,
      this.viewState.f * this.devicePixelRatio
    )

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    this.grid.renderMinorGrids(ctx, w, h);
    this.grid.renderMajorGrids(ctx, w, h);

    // Only filter by floor if a floor is explicitly focused. Otherwise, render all floors stacked.
    const shouldFilterByFloor = appState.selection.focusedType === 'floor';
    const activeFloor = shouldFilterByFloor ? (this.activeFloorId || appState.ui.activeFloorId) : null;
    const filterForFloor = (arr) => {
      if (!activeFloor) return arr;
      return arr.filter(o => o.floorId == null || o.floorId === activeFloor);
    };

    this.shapeRenderer.renderRectangles(ctx, filterForFloor(this.rectangles));
    this.shapeRenderer.renderPolygons(ctx, filterForFloor(this.polygons));
    this.shapeRenderer.renderFreeforms(ctx, this.freeforms);
    this.shapeRenderer.renderCircles(ctx, filterForFloor(this.circles));
    this.shapeRenderer.renderWalls(ctx, filterForFloor(this.walls));
    this._renderDeviceCables(ctx, activeFloor);

    ctx.save();
    for (const device of filterForFloor(this.devices)) {
      const tileW = device.transform.scale.w + 32;
      const tileH = device.transform.scale.h + 45;
      const tx = device.x - tileW / 2;
      const ty = device.y - tileH / 2.5;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(tx, ty, tileW, tileH, 8);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    for (const furniture of this.furnitures) {
      const tileW = furniture.width + 32; 
      const tileH = furniture.height + 45;
      const tx = furniture.x - tileW / 2;
      const ty = furniture.y - tileH / 2.5;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.roundRect(tx, ty, tileW, tileH, 8); 
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    this.shapeRenderer.renderDevices(ctx, filterForFloor(this.devices));
    this.shapeRenderer.renderFurnitures(ctx, this.furnitures);

    if (this.selectedEntity && this.selectedEntity.sourceId) {
      const cable = this.selectedEntity;
      const src = this.findEntityById(cable.sourceId);
      const dst = this.findEntityById(cable.targetId);

      if (src && dst) {

        ctx.save();
        ctx.strokeStyle = "#00AEEF";
        ctx.lineWidth = 4;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    if ((this.currentPolygon.length > 0 || this.currentFreeform.length > 0) && this.currentPoint) {
      ctx.save();
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = 'rgba(0,255,0,0.08)';
      ctx.lineWidth = 1.5;
      let points;
      if (this.mode === 'polygon') {
        points = this.currentPolygon;
      }
      else if (this.mode === 'freeform') {
        points = this.currentFreeform;
      }
      this.shapeRenderer.outlinePolygonOrFreeformInProgress(
        ctx,
        points,
        this.currentPoint,
        this.grid.getSnapTolerance()
      );
      ctx.restore();
    }
    else if (this.startPoint && this.currentPoint) {
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

    if (this.selectedEntity && !this.selectedEntity.sourceId) {
      const en = this.selectedEntity;
      let x, y, w, h;

      if (en.interfaces !== undefined || en.icon !== undefined) {
        w = en.width + 16;
        h = en.height + 16;
        x = en.x - w / 2;
        y = en.y - h / 2;
      }
      else if (en.width !== undefined) {
        w = en.width;
        h = en.height;
        x = en.x - w / 2;
        y = en.y - h / 2;
      } else {
        x = en.x;
        y = en.y;
        w = en.w;
        h = en.h;
      }

      if (x !== undefined && w !== undefined) {
        ctx.save();
        ctx.strokeStyle = "#00AEEF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        const size = 8;
        const handles = [
          [x, y], [x + w, y], [x, y + h], [x + w, y + h]
        ];

        ctx.fillStyle = "#00AEEF";
        handles.forEach(([hx, hy]) => {
          ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
        });
        ctx.restore();
      }
    }

    if (this.pendingCableSource) {
      const en = this.pendingCableSource;
      const safeW = en.width !== undefined ? en.width : (en.w || 32);
      const safeH = en.height !== undefined ? en.height : (en.h || 32);

      const w = safeW + 16;
      const h = safeH + 16;
      const x = en.x - w / 2;
      const y = en.y - h / 2;

      ctx.save();
      ctx.strokeStyle = "#ff9900";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();
      ctx.restore();
    }

    if (this.hoveredDevice && this.mode === 'cable') {
      const en = this.hoveredDevice;

      const safeW = en.width !== undefined ? en.width : (en.w || 32);
      const safeH = en.height !== undefined ? en.height : (en.h || 32);

      const w = safeW + 16;
      const h = safeH + 16;
      const x = en.x - w / 2;
      const y = en.y - h / 2;

      ctx.save();
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  getAllSelectableEntities() {
    return [
      this.cables,
      this.devices,
      this.rectangles,
      this.polygons,
      this.circles,
      this.walls,
      this.doors,
      this.windows,
      this.roofs,
      this.freeforms
    ];
  }

  findEntityById(id) {
    const lists = this.getAllSelectableEntities();
    for (const arr of lists) {
      for (const en of arr) {
        if (en && en.id === id) {
          return en;
        }
      }
    }
    return null;
  }

  removeEntityById(id) {
    const lists = this.getAllSelectableEntities();
    for (let arr of lists) {
      arr = arr.filter(e => e.id !== id);
    }
    return null;
  }

  updateEntityTransform(id, updates = {}) {
    const en = this.findEntityById(id);
    if (this.entityTransformer.applyEntityTransform(en, updates, this.shapeRenderer, this._checkForOverlap.bind(this))) {
      this._render();
      return true;
    }
    return false;
  }

  identifyEntity(x, y) {
    const entities = this.getAllSelectableEntities();
    let en = this.selection.identifyEntity(x, y, entities, this.ctx);

    if (!en) {
      for (const cable of this.cables) {
        const src = this.findEntityById(cable.sourceId);
        const dst = this.findEntityById(cable.targetId);

        if (!src || !dst) continue;

        const dist = this._pointToLineDistance(
          x, y,
          src.x, src.y,
          dst.x, dst.y
        );

        if (dist < 6) {
          en = cable;
          break;
        }
      }
    }

    this.selectedEntity = en || null;

    if (this.onEntitySelected) this.onEntitySelected(en);
    this._render();
    return en;
  }

  setZoom(zoom) {
    this.pointerHandler.setZoom(zoom);
    this._render();
  }


  _findDeviceAt(x, y) {
    for (const device of this.devices) {
      const dx = device.x - device.w / 2;
      const dy = device.y - device.h / 2;

      if (
        x >= dx &&
        x <= dx + device.w &&
        y >= dy &&
        y <= dy + device.h
      ) {
        return device;
      }
    }
    return null;
  }

  _pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  _checkForOverlap(currentEntity, action) {
    if (currentEntity === null) {
      return true;
    }

    // Only check for overlap on entities that support it (like structures),
    // and ignore others (like devices, furniture, walls, etc.).
    if (typeof currentEntity.checkIfOverlapping !== 'function') {
      return false;
    }

    if (currentEntity.checkIfOverlapping(currentEntity.floorId)) {
      alert("Overlapping detected");
      if (action === 'creation') {
        if (currentEntity.type === 'freeform') {
          for (const body of currentEntity.bodies) {
            this.system.remove(body);
          }
        }
        else {
          this.system.remove(currentEntity.body);
        }
      }
      return true;
    }
    return false;
  }


}

export default LogicalLayout;