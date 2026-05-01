import Grid from './Grid.js';
import ShapeCreator from './ShapeCreator.js';
import ShapeRenderer from '../rendering/ShapeRenderer.js';
import PointerHandler from '../rendering/PointerHandler.js';
import { Selection } from '../editor/Selection.js';
import EntityTransformer from './transform/EntityTransformer.js';
import { System } from 'check2d';
import appState from '../../state/AppState.js';

// ADD THIS IMPORT:
import { UnitSystem, GridScale } from '../../util/UnitSystem.js'; // Adjust path if needed

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

    // --- NEW: Global Listener for Entity Deletions ---
    window.addEventListener('forceCanvasDelete', (e) => {
        if (e.detail && e.detail.id) {
            this.removeEntityById(e.detail.id);
        }
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
      'chair': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-armchair-icon lucide-armchair"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>',
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

  removeShapeById(id) {
    const entity = this.findEntityById(id);
    if (entity) {
      if (entity.body) {
         this.system.remove(entity.body);
      } else if (entity.bodies) {
         for (const body of entity.bodies) {
            this.system.remove(body);
         }
      }
    }
    this.rectangles = this.rectangles.filter(e => e.id !== id);
    this.polygons = this.polygons.filter(e => e.id !== id);
    this.circles = this.circles.filter(e => e.id !== id);
    this.freeforms = this.freeforms.filter(e => e.id !== id);
    
    this._render();
  }

  isPointInsideShape(id, x, y) {
  let entity = null;

  if (typeof this.findEntityById === 'function') {
    entity = this.findEntityById(id);
  }

  if (!entity && this.structures) {
    entity = this.structures.find(s => s.id === id);
  }
  if (!entity && this.shapes) {
    entity = this.shapes.find(s => s.id === id);
  }
  if (!entity && this.shapeCreator && this.shapeCreator.shapes) {
    entity = this.shapeCreator.shapes.find(s => s.id === id);
  }

  if (!entity) {
    console.warn(`Bounds Check: Could not find physical shape for ID ${id}. Allowing drop by default.`);
    return true;
  }

  if (entity.type === 'circle' && entity.r !== undefined) {
    const radius = entity.transform?.scale?.r ?? entity.r;
    return Math.hypot(x - entity.x, y - entity.y) <= radius; // ADDED: exact circle containment instead of loose bounding box
  }

  const points = entity.transform?.scale?.points || entity.points;
  if (points && points.length >= 3 && this.ctx) {
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x, points[i].y);
    }
    path.closePath();
    return this.ctx.isPointInPath(path, x, y); // ADDED: exact polygon/freeform containment
  }

  if (typeof entity.getCurrentBounds === 'function') {
    const bounds = entity.getCurrentBounds();
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
  }

  if (entity.x !== undefined && entity.w !== undefined && entity.h !== undefined) {
    return x >= entity.x && x <= (entity.x + entity.w) && y >= entity.y && y <= (entity.y + entity.h);
  }

  return true;
}


  validateDropLocation(x, y) {
    const selection = appState.selection;
    const targetId = selection.focusedId;
    
    // If nothing is selected, or layout is missing, fail the check
    if (!targetId || !this.layout) return false;

    if (typeof this.layout.isPointInsideShape === 'function') {
      return this.layout.isPointInsideShape(targetId, x, y);
    }
    return true; 
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
    this.currentFreeform = [];
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
    const activeFloor = appState.ui.activeFloorId;

    device.id = deviceData.id || device.id; // ADDED: keep the canvas device id aligned with the store/hierarchy id
    device.catalogId = deviceData.catalogId || null; // ADDED: preserve catalog metadata on the canvas entity
    device.floorId = deviceData.floorId ?? activeFloor ?? null; // CHANGED: preserve the assigned floor instead of always overwriting it
    device.spaceId = deviceData.spaceId ?? null; // ADDED: preserve the assigned space so movement can be constrained to it
    device.label = deviceData.label || deviceData.name || device.label; // ADDED: keep the visible label aligned with the store copy

    console.log("ADD → layout instance:", this.layout);
    console.log("ADD layout === global?", this.layout === window.__layoutRef);
    window.__layoutRef = this.layout;

    if (!this._checkForOverlap(device, "creation")) {
      this.devices.push(device);
      this._render();
    }
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
      id: furnitureData.id || `furniture_${Math.random().toString(36).slice(2, 9)}`, // CHANGED: keep the same id as the furniture store/hierarchy node
      type: furnitureData.type || 'furniture',
      label: furnitureData.name || furnitureData.label || 'Furniture',
      catalogId: furnitureData.catalogId || null, // ADDED: preserve catalog metadata
      floorId: furnitureData.floorId ?? appState.ui.activeFloorId ?? null, // ADDED: preserve floor context
      spaceId: furnitureData.spaceId ?? null, // ADDED: preserve space context
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
      hitTestMode: 'path',
      saveCurrentPosition() {
        this.savedPosition = { x: this.x, y: this.y };
      },
      restoreToSavedPosition() {
        if (!this.savedPosition) return;
        this.x = this.savedPosition.x;
        this.y = this.savedPosition.y;
        this.transform.position.x = this.x;
        this.transform.position.y = this.y;
      }
    };

    this.furnitures.push(furniture);

    if (this.onFurnitureAdded) {

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
      const handleHit = this._getResizeHandleAtPoint(this.selectedEntity, p);
      if (handleHit) {
        const { entity: en, handle: key, bounds } = handleHit;

        if (en.saveCurrentPosition) {
          en.saveCurrentPosition();
        }
        if (en.saveCurrentScale) {
          en.saveCurrentScale();
        }

        this.interaction = {
          mode: 'resize',
          handle: key,
          start: { x: p.x, y: p.y },
          bounds,
          center: { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 },
          baseScale: en.transform?.scale?.factor ?? 1
        };
        this.pointerHandler.setPointerDown(true);
        return;
      }

      const en = this.identifyEntity(e.clientX, e.clientY);
      if (!en) {
        // Clear focus when clicking on empty canvas
        appState.selection.focusedNode(null, null);
        return;
      }

      if (en.saveCurrentPosition) {
        en.saveCurrentPosition();
      }
      const bounds = this._getEntityInteractionBounds(en); // ADDED: use the correct drawn bounds for both shapes and devices
      const size = 8;

      if (bounds) {
        const { x, y, w, h } = bounds;
      const handles = {
        nw: [x, y],
        ne: [x + w, y],
        sw: [x, y + h],
        se: [x + w, y + h]
      };

      for (const key in handles) {
        const [hx, hy] = handles[key];
        if (Math.abs(p.x - hx) < size &&
         Math.abs(p.y - hy) < size &&
         this._isResizableEntity(en) ){
          if (en.saveCurrentScale) {
            en.saveCurrentScale(); // ADDED: allow device scaling to be rolled back if needed
          }
          this.interaction = {
            mode: 'resize',
            handle: key,
            start: { x: p.x, y: p.y },
            bounds,
            center: { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 }, // CHANGED: use rendered bounds so device resize centers stay aligned with the visible selection box
            baseScale: en.transform?.scale?.factor ?? 1
          };
          this.pointerHandler.setPointerDown(true);
          return;
        }
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
  } else {
    const first = this.currentPolygon[0];
    const canClose = this.shapeCreator.canClosePolygon(
      first,
      snapped,
      this.grid.getSnapTolerance()
    );

    if (canClose && this.currentPolygon.length >= 3) {
      const activeFloor = appState.ui.activeFloorId; // ADDED: capture the currently focused floor before overlap checking

      const polygon = this.shapeCreator.createPolygon(
        [...this.currentPolygon],
        this.structureType,
        this.system
      );

      if (polygon) {
        polygon.floorId = activeFloor || null; // ADDED: assign the polygon to the active floor for correct hierarchy overlap checks

        if (polygon.body) {
          polygon.body.floorId = activeFloor || null; // ADDED: assign the collision body to the same floor
        }

        if (!this._checkForOverlap(polygon, "creation")) {
          if (this.shapeCreator.onPolygonCreated) {
            this.shapeCreator.onPolygonCreated(polygon);
          }
          this.polygons.push(polygon);
        } else if (polygon.body) {
          this.system.remove(polygon.body); // ADDED: clean up inserted collision body if creation fails
        }
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
  if (this.currentFreeform.length === 0) {
    this.currentFreeform.push(snapped);
  } else {
    const first = this.currentFreeform[0];
    const canClose = this.shapeCreator.canClosePolygon(
      first,
      snapped,
      this.grid.getSnapTolerance()
    );

    if (canClose && this.currentFreeform.length >= 3) {
      const activeFloor = appState.ui.activeFloorId; // ADDED: capture the selected floor before overlap checking

      const freeform = this.shapeCreator.createFreeform(
        [...this.currentFreeform],
        this.structureType,
        this.system
      );

      if (freeform) {
        freeform.floorId = activeFloor || null; // ADDED: assign the freeform entity to the active floor

        if (freeform.bodies) {
          for (const body of freeform.bodies) {
            body.floorId = activeFloor || null; // ADDED: assign every freeform collision body to the same floor
          }
        }

        if (!this._checkForOverlap(freeform, "creation")) {
          if (this.shapeCreator.onFreeformCreated) {
            this.shapeCreator.onFreeformCreated(freeform);
          }
          this.freeforms.push(freeform);
        } else if (freeform.bodies) {
          for (const body of freeform.bodies) {
            this.system.remove(body); // ADDED: clean up inserted bodies if overlap validation fails
          }
        }
      }

      this.currentFreeform = [];
      this.mode = 'none';
      this.currentPoint = null;
      this._updateCursor();
      this._render();
      return;
    }

    this.currentFreeform.push(snapped);
  }

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
        
        const bounds = this._getEntityInteractionBounds(en); // ADDED: use correct visual bounds for devices too
        let cursor = 'move';

        if (bounds) {
          const { x, y, w, h } = bounds;
          const size = 8;

        const handles = {
          nw: [x, y],
          ne: [x + w, y],
          sw: [x, y + h],
          se: [x + w, y + h]
        };

        for (const key in handles) {
          const [hx, hy] = handles[key];
          if (
           Math.abs(p.x - hx) < size &&
           Math.abs(p.y - hy) < size &&
           this._isResizableEntity(en)

        )   {
            cursor = (key === 'nw' || key === 'se')
              ? 'nwse-resize'
              : 'nesw-resize';
          }
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
        let appliedDx = dx;
        let appliedDy = dy;
        let nextStart = { x: p.x, y: p.y };

        if (this.interaction.mode === "move") {
          if (this._isDeviceEntity(en) || this._isFurnitureEntity(en)) {
            const clamped = this._clampMovementWithinParent(en, dx, dy);
            en.move(clamped.dx, clamped.dy);
            appliedDx = clamped.dx;
            appliedDy = clamped.dy;
          } else if (en.structureType) {
            const clamped = this._clampStructuralMovementWithinParents(en, dx, dy);
            en.move(clamped.dx, clamped.dy);
            appliedDx = clamped.dx;
            appliedDy = clamped.dy;
          } else {
            en.move(dx, dy);
          }

          nextStart = {
            x: this.interaction.start.x + appliedDx,
            y: this.interaction.start.y + appliedDy
          };
        }

        if (this.interaction.mode === "resize" && en.type === 'rectangle') {
          const resizeResult = this._resizeRectangleWithinParents(en, p);
          appliedDx = resizeResult.movedDx;
          appliedDy = resizeResult.movedDy;
        }
        else if (this.interaction.mode === "resize" && this._isDeviceEntity(en)) {
          const baseBounds = this.interaction.bounds;
          const center = this.interaction.center;
          const widthRatio = (Math.abs(p.x - center.x) * 2) / baseBounds.w;
          const heightRatio = (Math.abs(p.y - center.y) * 2) / baseBounds.h;
          const requestedFactor = Math.max(
            0.25,
            this.interaction.baseScale * Math.max(widthRatio, heightRatio)
          ); // ADDED: uniformly scale the device based on dragged handle distance

          const factor = this._clampDeviceScaleWithinParent(en, requestedFactor, center);

      en.setScale({ factor });

      const resizedBounds = this._getEntityInteractionBounds(en);
    if (resizedBounds) {
      const dxCenter = center.x - (resizedBounds.x + resizedBounds.w / 2);
      const dyCenter = center.y - (resizedBounds.y + resizedBounds.h / 2);
      en.move(dxCenter, dyCenter); // ADDED: keep device scaling centered instead of drifting down-right
    }
  }

        this.interaction.start = nextStart;
        const shouldSyncDuringDrag = !!en.structureType &&
          (this.interaction.mode === "move" || this.interaction.mode === "resize");

        if (shouldSyncDuringDrag && this.onEntityChanged) {
          this.onEntityChanged(en, appliedDx, appliedDy); // CHANGED: keep structural store sync aligned with the movement that was actually applied after clamping
        }

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
    console.log('[LogicalLayout] _onPointerUp', {
      mode: this.mode,
      pointerDown: this.pointerHandler.getIsPointerDown(),
      startPoint: this.startPoint,
      currentPoint: this.currentPoint
    });

    const isDrawMode = this.mode !== 'select' && this.mode !== 'pan' && this.mode !== 'none';
    const hasValidDrawPoints = this.startPoint && this.currentPoint;

    if (isDrawMode && hasValidDrawPoints) {
      console.log('[LogicalLayout] finalizing draw mode on pointer up');
      this._createShapeFromMode();
    }

    if (this.selectedEntity && (this.interaction.mode === 'move' || this.interaction.mode === 'resize')) {
      let restoreDx = 0;
      let restoreDy = 0;
      const isMove = this.interaction.mode === 'move';
      const hasSavedPosition = this.selectedEntity.savedPosition !== undefined;

      if (isMove && this._checkForOverlap(this.selectedEntity, "transformation")) {
        if (hasSavedPosition && typeof this.selectedEntity.restoreToSavedPosition === 'function') {
          restoreDx = this.selectedEntity.savedPosition.x - this.selectedEntity.x;
          restoreDy = this.selectedEntity.savedPosition.y - this.selectedEntity.y;
          this.selectedEntity.restoreToSavedPosition();
        }
      }

      const actualDx = isMove && hasSavedPosition
        ? this.selectedEntity.x - this.selectedEntity.savedPosition.x
        : restoreDx;
      const actualDy = isMove && hasSavedPosition
        ? this.selectedEntity.y - this.selectedEntity.savedPosition.y
        : restoreDy;

      if (this.onEntityChanged) {
        this.onEntityChanged(this.selectedEntity, actualDx, actualDy); // CHANGED: commit device move/resize only once at drag end
      }
    }


    this.interaction = {
      mode: null,
      handle: null,
      start: null
    };
    this.isResizing = false;
    this.resizeStart = null;

    if (this.mode === 'pan') {
      this.pointerHandler.setCursor('grab');
    }

    this.pointerHandler.setPointerDown(false);

    this.startPoint = null;
    this.currentPoint = null;
    this._render();
  }

  _onRightClick() {
  if (this.currentFreeform.length > 1) {
    const activeFloor = appState.ui.activeFloorId; // ADDED: capture the active floor before overlap checking

    const freeform = this.shapeCreator.createFreeform(
      [...this.currentFreeform],
      this.structureType,
      this.system
    );

    if (freeform) {
      freeform.floorId = activeFloor || null; // ADDED: assign the freeform entity to the active floor

      if (freeform.bodies) {
        for (const body of freeform.bodies) {
          body.floorId = activeFloor || null; // ADDED: assign every freeform collision segment to the active floor
        }
      }

      if (!this._checkForOverlap(freeform, "creation")) {
        if (this.shapeCreator.onFreeformCreated) {
          this.shapeCreator.onFreeformCreated(freeform);
        }
        this.freeforms.push(freeform);
      } else if (freeform.bodies) {
        for (const body of freeform.bodies) {
          this.system.remove(body); // ADDED: clean up inserted collision bodies if creation fails
        }
      }
    }

    this.currentFreeform = [];
    this.mode = 'none';
    this.currentPoint = null;
    this._updateCursor();
    this._render();
  }
}


  _createShapeFromMode() {
    const activeFloor =
     appState.selection.focusedType === 'floor'
          ? appState.selection.focusedId // ADDED: prefer the explicitly selected floor from the hierarchy
          : appState.ui.activeFloorId; // KEEP: fallback to the currently active floor in UI state

    if (this.mode === 'rectangle') {
      const rect = this.shapeCreator.createRectangle(
        this.startPoint,
        this.currentPoint,
        this.structureType,
      );
      if (rect) {
        rect.floorId = activeFloor || null;
        if (rect.body) rect.body.floorId = activeFloor || null;
        console.log(`📦 Created canvas rectangle with ID: ${rect.id}, Type: ${this.structureType}`);
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
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(
        device.tileX,
        device.tileY,
        device.tileWidth,
        device.tileHeight,
        8
      );
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
    this.shapeRenderer.renderFurnitures(ctx, filterForFloor(this.furnitures));

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
      const bounds = this._getEntityInteractionBounds(en); // CHANGED: use the same bounds logic for shapes, devices, and furniture

      const x = bounds?.x;
      const y = bounds?.y;
      const w = bounds?.w;
      const h = bounds?.h;

      // For circles, we only need x, y, and radius defined
      const isCircle = en.type === 'circle' && en.r !== undefined;
      
      if (isCircle || (x !== undefined && w !== undefined)) {
        ctx.save();
        ctx.strokeStyle = "#00AEEF";
        ctx.lineWidth = 2;

        // Draw selection indicators
        if (isCircle) {
          // For circles, draw a circle outline
          ctx.beginPath();
          ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
          ctx.stroke();

          // Draw handles at cardinal points
          const size = 8;
          const handles = [
            [en.x, en.y - en.r],     // top
            [en.x, en.y + en.r],     // bottom
            [en.x - en.r, en.y],     // left
            [en.x + en.r, en.y]      // right
          ];

          ctx.fillStyle = "#00AEEF";
          handles.forEach(([hx, hy]) => {
            ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
          });
        } else {
          // For rectangles, draw bounding box
          ctx.strokeRect(x, y, w, h);

          const size = 8;
          const handles = [
            [x, y], [x + w, y], [x, y + h], [x + w, y + h]
          ];

          ctx.fillStyle = "#00AEEF";
          handles.forEach(([hx, hy]) => {
            ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
          });
        }

        const isStructural = ['rectangle', 'site', 'domain', 'space', 'polygon', 'freeform', 'circle'].includes(en.type);

        if (isStructural) {
          ctx.fillStyle = "black";
          ctx.font = "bold 14px Arial";
          ctx.textAlign = "center";

          // CIRCLE LOGIC: Display diameter and circumference
          if (en.type === 'circle' && en.r !== undefined) {
            const diameter = en.r * 2;
            const circumference = 2 * Math.PI * en.r;

            const diameterInMeters = UnitSystem.format(GridScale.toMeters(diameter), 'm');
            const circumferenceInMeters = UnitSystem.format(GridScale.toMeters(circumference), 'm');

            // Diameter label at the top
            ctx.fillText(`Ø ${diameterInMeters}`, en.x, en.y - en.r - 20);

            // Circumference label at the bottom
            ctx.fillText(`C ${circumferenceInMeters}`, en.x, en.y + en.r + 35);
          }

          else if (en.points && en.points.length > 1) {
            
            // PERIMETER LOGIC FOR ANY CUSTOM SHAPE
            for (let i = 0; i < en.points.length; i++) {
              const p1 = en.points[i];
              const p2 = en.points[(i + 1) % en.points.length];

              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);

              const meters = UnitSystem.format(GridScale.toMeters(pixelDistance), 'm');

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              let angle = Math.atan2(dy, dx);
              
              if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                 angle += Math.PI;
              }

              ctx.save();
              ctx.translate(midX, midY);
              ctx.rotate(angle);
              ctx.fillText(meters, 0, -8); 
              ctx.restore();
            }
          } else {
            // BOUNDING BOX LOGIC FOR STANDARD WxH RECTANGLES
            let boxX = x;
            let boxY = y;
            let boxW = w;
            let boxH = h;

            // Top Label: Overall Width
            if (boxW !== undefined) {
              const widthInMeters = UnitSystem.format(GridScale.toMeters(boxW), 'm');
              ctx.fillText(widthInMeters, boxX + (boxW / 2), boxY - 15);
            }

            // Right Label: Overall Height
            if (boxH !== undefined) {
              const heightInMeters = UnitSystem.format(GridScale.toMeters(boxH), 'm');
              ctx.save();
              ctx.translate(boxX + boxW + 20, boxY + (boxH / 2));
              ctx.rotate(Math.PI / 2);
              ctx.fillText(heightInMeters, 0, 0);
              ctx.restore();
            }
          }
        }

        ctx.restore();
      }
    }

    if (this.pendingCableSource) {
      const en = this.pendingCableSource;

      const w = en.renderWidth + 4;
      const h = en.renderHeight + 4;
      const x = en.x - 2;
      const y = en.y - 2;

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

      const w = en.renderWidth + 4;
      const h = en.renderHeight + 4;
      const x = en.x - 2;
      const y = en.y - 2;

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
      this.freeforms,
      this.furnitures
    ];
  }

  findEntityById(id) {
    const lists = this.getAllSelectableEntities();
    console.log("Searching for:", id);
    console.log("Device list:", this.devices.map(d => d.id));

    for (const arr of lists) {
      if (!arr) continue; 
      for (const en of arr) {
        if (en && en.id === id) {
          return en;
        }
      }
    }
    // If entity not found in layout, log for debugging
    console.log(`⚠️ No canvas entity found in layout with id: ${id}`);
    return null;
  }

removeEntityById(id) {
    if (!id) return false;

    // 1. Deselect it if the user is currently holding/clicking it
    if (this.selectedEntity && this.selectedEntity.id === id) {
        this.selectedEntity = null;
        this.interaction = { mode: null, handle: null, start: null };
        this.pointerHandler.setCursor('default');
    }

    // 2. Hunt down the entity in all possible canvas arrays
    let entityToRemove = null;
    
    // Add or remove array names here depending on how LogicalLayout stores them!
    const targetArrays = ['rectangles', 'circles', 'polygons', 'freeforms', 'devices', 'furnitures', 'cables', 'walls'];
    
    for (const arrName of targetArrays) {
        if (this[arrName]) {
            const index = this[arrName].findIndex(en => en.id === id);
            if (index !== -1) {
                entityToRemove = this[arrName][index];
                this[arrName].splice(index, 1); // Delete it from the drawing array
                break;
            }
        }
    }

    // 3. Remove it from the 2D physics/collision system so other objects can use its space
    if (entityToRemove && entityToRemove.body && this.system) {
        try {
            this.system.remove(entityToRemove.body); // or this.system.removeBody(entityToRemove.body) depending on your check2d version
        } catch (e) {
            console.warn("Could not cleanly remove body from physics system", e);
        }
    }

    // 4. Erase it from the canvas!
    this._render();
    return true;
  }

updateEntityTransform(id, updates = {}, skipOverlapCheck = false) {
    const en = this.findEntityById(id);
    if (!en) return false;

    // If skipOverlapCheck is true, we provide a dummy function that always returns false (no overlap).
    // Otherwise, we bind the strict physical overlap checker.
    const overlapValidator = skipOverlapCheck ? () => false : this._checkForOverlap.bind(this);

    if (this.entityTransformer.applyEntityTransform(en, updates, overlapValidator)) {
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

    console.log("SELECTED ENTITY:", en);

    if (en) {
      if (en.structureType) {
        appState.selection.focusedId = en.id;
        appState.selection.focusedType = en.structureType.toLowerCase();
        appState.selection.notify?.();
      } else {
        appState.selection.selectDevice?.(en.id, false);
      }
    } else {
      appState.selection.clearSelection?.();
    }

    if (this.onEntitySelected) this.onEntitySelected(en);

    this._render();
    return en;
  }

  setZoom(zoom) {
    this.pointerHandler.setZoom(zoom);
    this._render();
  }

  _isDeviceEntity(en) {
    return !!en && (en.interfaces !== undefined || en.catalogId !== undefined);
  }

  _isFurnitureEntity(en) {
    return !!en && (en.type === 'furniture' || en.id?.startsWith('furniture'));
  }

  _isResizableEntity(en) {
    return !!en && (en.type === 'rectangle' || this._isDeviceEntity(en)); // ADDED: devices can now use resize handles too
  }

  _getEntityBounds(en) {
    if (!en) return null;

    if (this._isDeviceEntity(en)) {
      return {
        minX: en.tileX,
        minY: en.tileY,
        maxX: en.tileX + en.tileWidth,
        maxY: en.tileY + en.tileHeight,
        width: en.tileWidth,
        height: en.tileHeight
      };
    }

    if (this._isFurnitureEntity(en)) {
      const w = (en.width ?? 0) + 32;
      const h = (en.height ?? 0) + 45;
      const x = en.x - w / 2;
      const y = en.y - h / 2.5;
      return {
        minX: x,
        minY: y,
        maxX: x + w,
        maxY: y + h,
        width: w,
        height: h
      };
    }

    if (en.type === 'circle' && en.r !== undefined) {
      const radius = Number(en.transform?.scale?.r ?? en.r ?? 0);
      const x = Number(en.x ?? 0);
      const y = Number(en.y ?? 0);
      return {
        minX: x - radius,
        minY: y - radius,
        maxX: x + radius,
        maxY: y + radius,
        width: radius * 2,
        height: radius * 2
      };
    }

    const points = en.transform?.scale?.points || en.points;
    if (Array.isArray(points) && points.length > 0) {
      const xs = points.map(point => Number(point.x ?? 0));
      const ys = points.map(point => Number(point.y ?? 0));
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    const x = Number(en.transform?.position?.x ?? en.x ?? 0);
    const y = Number(en.transform?.position?.y ?? en.y ?? 0);
    const w = Number(en.transform?.scale?.w ?? en.w ?? en.width ?? 0);
    const h = Number(en.transform?.scale?.h ?? en.h ?? en.height ?? 0);
    return {
      minX: x,
      minY: y,
      maxX: x + w,
      maxY: y + h,
      width: w,
      height: h
    };
  }

  _getParentBounds(en) {
    if (!en || !appState.structural) return null;
    const st = appState.structural;
    const getBounds = (shape) => {
      if (!shape) return null;
      const src = shape.geometry || shape;
      const x = Number(src.x ?? src.left ?? 0);
      const y = Number(src.y ?? src.top ?? 0);
      const w = Number(src.w ?? src.width ?? 0);
      const h = Number(src.h ?? src.height ?? 0);
      return {
        minX: Math.min(x, x + w),
        minY: Math.min(y, y + h),
        maxX: Math.max(x, x + w),
        maxY: Math.max(y, y + h),
        width: Math.abs(w),
        height: Math.abs(h)
      };
    };

    if (en.spaceId) {
      const space = st.spaces?.find(s => s.id === en.spaceId);
      if (space) return getBounds(space);
    }

    if (en.floorId) {
      const floor = st.floors?.find(f => f.id === en.floorId);
      if (floor) {
        const floorBounds = getBounds(floor);
        if (floorBounds && floorBounds.width > 0 && floorBounds.height > 0) {
          return floorBounds;
        }
        const parentSite = st.sites?.find(s => s.id === floor.siteId);
        if (parentSite) return getBounds(parentSite);
      }
    }

    return null;
  }

  _clampMovementWithinParent(en, dx, dy) {
    const entityBounds = this._getEntityBounds(en);
    const parentBounds = this._getParentBounds(en);
    if (!entityBounds || !parentBounds) return { dx, dy };

    let clampedDx = dx;
    let clampedDy = dy;

    if (entityBounds.minX + clampedDx < parentBounds.minX) {
      clampedDx = parentBounds.minX - entityBounds.minX;
    }
    if (entityBounds.maxX + clampedDx > parentBounds.maxX) {
      clampedDx = parentBounds.maxX - entityBounds.maxX;
    }
    if (entityBounds.minY + clampedDy < parentBounds.minY) {
      clampedDy = parentBounds.minY - entityBounds.minY;
    }
    if (entityBounds.maxY + clampedDy > parentBounds.maxY) {
      clampedDy = parentBounds.maxY - entityBounds.maxY;
    }

    return { dx: clampedDx, dy: clampedDy };
  }

  _getEntityInteractionBounds(en) {
    if (!en) return null;

    if (this._isDeviceEntity(en)) {
      return {
        x: en.tileX,       // ADDED: devices are drawn/hit-tested using tile bounds, not raw x/y/w/h
        y: en.tileY,
        w: en.tileWidth,
        h: en.tileHeight
      };
    }

  if (this._isFurnitureEntity(en)) {
    const w = (en.width ?? 0) + 32;
    const h = (en.height ?? 0) + 45;

    return {
      x: en.x - w / 2,
      y: en.y - h / 2.5,
      w,
      h
    };
  }

  return {
    x: en.transform?.position?.x ?? en.x,
    y: en.transform?.position?.y ?? en.y,
    w: en.transform?.scale?.w ?? en.w ?? en.width,
    h: en.transform?.scale?.h ?? en.h ?? en.height
  };
}

  _getResizeHandleAtPoint(en, point, size = 8) {
    if (!en || !point || !this._isResizableEntity(en)) {
      return null;
    }

    const bounds = this._getEntityInteractionBounds(en);
    if (!bounds) {
      return null;
    }

    const handles = {
      nw: [bounds.x, bounds.y],
      ne: [bounds.x + bounds.w, bounds.y],
      sw: [bounds.x, bounds.y + bounds.h],
      se: [bounds.x + bounds.w, bounds.y + bounds.h]
    };

    for (const [handle, [hx, hy]] of Object.entries(handles)) {
      if (Math.abs(point.x - hx) < size && Math.abs(point.y - hy) < size) {
        return { entity: en, handle, bounds };
      }
    }

    return null;
  }

  _getStructuralAncestorBounds(en) {
    if (!en?.structureType || !appState.structural) return [];

    const st = appState.structural;
    const structuralRecord =
      (en.structureType === 'Site' && st.sites?.find(site => site.id === en.id)) ||
      (en.structureType === 'Floor' && st.floors?.find(floor => floor.id === en.id)) ||
      (en.structureType === 'Space' && st.spaces?.find(space => space.id === en.id)) ||
      null;

    const bounds = [];
    const pushBounds = (shape) => {
      const extracted = this._extractStructuralShapeBounds(shape);
      if (extracted) {
        bounds.push(extracted);
      }
    };

    if (en.structureType === 'Site') {
      pushBounds(st.domains?.find(domain => domain.id === structuralRecord?.domainId));
    } else if (en.structureType === 'Floor') {
      pushBounds(st.sites?.find(site => site.id === structuralRecord?.siteId));
    } else if (en.structureType === 'Space') {
      const parentFloor = st.floors?.find(floor => floor.id === structuralRecord?.floorId);
      pushBounds(parentFloor);
      pushBounds(st.sites?.find(site => site.id === (structuralRecord?.siteId ?? parentFloor?.siteId)));
    }

    return bounds.filter(parentBounds =>
      parentBounds.width > 0 && parentBounds.height > 0
    );
  }

  _extractStructuralShapeBounds(shape) {
    if (!shape) return null;

    const src = shape.geometry || shape;
    const points = Array.isArray(src.points) ? src.points : [];
    if (points.length > 0) {
      const xs = points.map(point => Number(point.x ?? 0));
      const ys = points.map(point => Number(point.y ?? 0));
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    const radius = Number(src.r ?? src.radius ?? 0);
    if (radius > 0) {
      const x = Number(src.x ?? 0);
      const y = Number(src.y ?? 0);
      return {
        minX: x - radius,
        minY: y - radius,
        maxX: x + radius,
        maxY: y + radius,
        width: radius * 2,
        height: radius * 2
      };
    }

    const x = Number(src.x ?? src.left ?? 0);
    const y = Number(src.y ?? src.top ?? 0);
    let width = Number(src.w ?? src.width ?? 0);
    let height = Number(src.h ?? src.height ?? 0);

    if (!width && src.maxX !== undefined) {
      width = Number(src.maxX) - x;
    }
    if (!height && src.maxY !== undefined) {
      height = Number(src.maxY) - y;
    }

    return {
      minX: Math.min(x, x + width),
      minY: Math.min(y, y + height),
      maxX: Math.max(x, x + width),
      maxY: Math.max(y, y + height),
      width: Math.abs(width),
      height: Math.abs(height)
    };
  }

  _clampStructuralMovementWithinParents(en, dx, dy) {
    const entityBounds = this._getEntityBounds(en);
    const parentBoundsList = this._getStructuralAncestorBounds(en);
    if (!entityBounds || !parentBoundsList.length) {
      return { dx, dy };
    }

    let clampedDx = dx;
    let clampedDy = dy;

    for (const parentBounds of parentBoundsList) {
      if (entityBounds.minX + clampedDx < parentBounds.minX) {
        clampedDx = parentBounds.minX - entityBounds.minX;
      }
      if (entityBounds.maxX + clampedDx > parentBounds.maxX) {
        clampedDx = parentBounds.maxX - entityBounds.maxX;
      }
      if (entityBounds.minY + clampedDy < parentBounds.minY) {
        clampedDy = parentBounds.minY - entityBounds.minY;
      }
      if (entityBounds.maxY + clampedDy > parentBounds.maxY) {
        clampedDy = parentBounds.maxY - entityBounds.maxY;
      }
    }

    return { dx: clampedDx, dy: clampedDy };
  }

  _resizeRectangleWithinParents(en, point) {
    const baseBounds = this.interaction?.bounds || this._getEntityInteractionBounds(en);
    const currentBounds = this._getEntityInteractionBounds(en);
    if (!baseBounds || !currentBounds || !point) {
      return { movedDx: 0, movedDy: 0 };
    }

    const center = this.interaction?.center || {
      x: baseBounds.x + baseBounds.w / 2,
      y: baseBounds.y + baseBounds.h / 2
    };
    const minScaleRatio = Math.max(
      baseBounds.w > 0 ? 8 / baseBounds.w : 1,
      baseBounds.h > 0 ? 8 / baseBounds.h : 1
    );
    const widthRatio = baseBounds.w > 0
      ? (Math.abs(point.x - center.x) * 2) / baseBounds.w
      : 1;
    const heightRatio = baseBounds.h > 0
      ? (Math.abs(point.y - center.y) * 2) / baseBounds.h
      : 1;
    const requestedScaleRatio = Math.max(
      minScaleRatio,
      Math.max(widthRatio, heightRatio)
    );
    const scaleRatio = this._clampStructuralScaleWithinParents(
      en,
      requestedScaleRatio,
      baseBounds,
      center,
      minScaleRatio
    );
    const proposed = this._getScaledBoundsFromCenter(baseBounds, scaleRatio, center);
    const movedDx = proposed.x - currentBounds.x;
    const movedDy = proposed.y - currentBounds.y;

    if (movedDx !== 0 || movedDy !== 0) {
      en.move(movedDx, movedDy);
    }

    en.setWidthAndHeight(proposed.w, proposed.h);
    return { movedDx, movedDy };
  }

  _enforceMinimumRectangleSize(proposed, currentBounds, handle, minSize) {
    if (proposed.w < minSize) {
      if (handle === "nw" || handle === "sw") {
        proposed.x = currentBounds.x + currentBounds.w - minSize;
      }
      proposed.w = minSize;
    }

    if (proposed.h < minSize) {
      if (handle === "nw" || handle === "ne") {
        proposed.y = currentBounds.y + currentBounds.h - minSize;
      }
      proposed.h = minSize;
    }
  }

  _getContainmentPointsFromBounds(bounds) {
    if (!bounds) return [];

    const inset = 2;
    const left = bounds.x + inset;
    const top = bounds.y + inset;
    const right = bounds.x + bounds.w - inset;
    const bottom = bounds.y + bounds.h - inset;
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
      { x: centerX, y: centerY }
    ];
  }

  _isBoundsInsideAssignedParent(asset, bounds) {
    const points = this._getContainmentPointsFromBounds(bounds);
    if (!points.length) return true;

    if (asset.spaceId) {
      return points.every(point =>
        this.isPointInsideShape(asset.spaceId, point.x, point.y)
      );
    }

    if (asset.floorId) {
      const insideFloor = points.every(point =>
        this.isPointInsideShape(asset.floorId, point.x, point.y)
      );

      if (!insideFloor) {
        return false;
      }

      const spacesOnFloor = appState.structural?.spaces?.filter(
        space => String(space.floorId) === String(asset.floorId)
      ) || [];

      const intrudesIntoSpace = spacesOnFloor.some(space =>
        points.some(point => this.isPointInsideShape(space.id, point.x, point.y))
      );

      return !intrudesIntoSpace;
    }

    return true;
  }

  _getDeviceBoundsForFactor(device, factor, center) {
    const width = device.w * factor + device.tileExtraWidth;
    const height = device.h * factor + device.tileExtraHeight;

    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
      w: width,
      h: height
    };
  }

  _clampDeviceScaleWithinParent(device, requestedFactor, center) {
    if (!this._isDeviceEntity(device)) {
      return requestedFactor;
    }

    const currentFactor = Number(device.transform?.scale?.factor ?? 1);
    const minScale = 0.25;
    const normalizedRequested = Math.max(minScale, requestedFactor);

    if (normalizedRequested <= currentFactor) {
      return normalizedRequested;
    }

    const requestedBounds = this._getDeviceBoundsForFactor(device, normalizedRequested, center);
    if (this._isBoundsInsideAssignedParent(device, requestedBounds)) {
      return normalizedRequested;
    }

    let low = currentFactor;
    let high = normalizedRequested;
    let best = currentFactor;

    for (let i = 0; i < 14; i++) {
      const mid = (low + high) / 2;
      const midBounds = this._getDeviceBoundsForFactor(device, mid, center);
      if (this._isBoundsInsideAssignedParent(device, midBounds)) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    return best;
  }

  _getScaledBoundsFromCenter(bounds, scaleRatio, center) {
    const nextWidth = bounds.w * scaleRatio;
    const nextHeight = bounds.h * scaleRatio;

    return {
      x: center.x - nextWidth / 2,
      y: center.y - nextHeight / 2,
      w: nextWidth,
      h: nextHeight
    };
  }

  _isBoundsWithinStructuralParents(bounds, parentBoundsList) {
    if (!bounds) {
      return false;
    }

    return (parentBoundsList || []).every(parentBounds =>
      bounds.x >= parentBounds.minX &&
      bounds.y >= parentBounds.minY &&
      bounds.x + bounds.w <= parentBounds.maxX &&
      bounds.y + bounds.h <= parentBounds.maxY
    );
  }

  _clampStructuralScaleWithinParents(en, requestedScaleRatio, baseBounds, center, minScaleRatio = 1) {
    const normalizedRequested = Math.max(minScaleRatio, requestedScaleRatio);
    const parentBoundsList = en?.structureType ? this._getStructuralAncestorBounds(en) : [];

    if (!parentBoundsList.length || normalizedRequested <= 1) {
      return normalizedRequested;
    }

    const requestedBounds = this._getScaledBoundsFromCenter(baseBounds, normalizedRequested, center);
    if (this._isBoundsWithinStructuralParents(requestedBounds, parentBoundsList)) {
      return normalizedRequested;
    }

    let low = 1;
    let high = normalizedRequested;
    let best = 1;

    for (let i = 0; i < 14; i++) {
      const mid = (low + high) / 2;
      const midBounds = this._getScaledBoundsFromCenter(baseBounds, mid, center);
      if (this._isBoundsWithinStructuralParents(midBounds, parentBoundsList)) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    return best;
  }
  _getAssetContainmentPoints(asset) {
    const bounds = this._getEntityInteractionBounds(asset);
    if (!bounds) return [];

    const inset = 2; // ADDED: keep test points slightly inside the tile edges to avoid false negatives on exact borders
    const left = bounds.x + inset;
    const top = bounds.y + inset;
    const right = bounds.x + bounds.w - inset;
    const bottom = bounds.y + bounds.h - inset;
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
      { x: centerX, y: centerY }
    ];
  }

  _isAssetInsideAssignedParent(asset) {
    const points = this._getAssetContainmentPoints(asset);
    if (!points.length) return true;

    if (asset.spaceId) {
      return points.every(point =>
        this.isPointInsideShape(asset.spaceId, point.x, point.y)
      ); // ADDED: a space-owned device must keep its whole tile inside that space
    }

    if (asset.floorId) {
      const insideFloor = points.every(point =>
        this.isPointInsideShape(asset.floorId, point.x, point.y)
      );

      if (!insideFloor) {
        return false; // ADDED: a floor-owned device cannot leave its floor
      }

      const spacesOnFloor = appState.structural?.spaces?.filter(
        space => String(space.floorId) === String(asset.floorId)
      ) || [];

      const intrudesIntoSpace = spacesOnFloor.some(space =>
        points.some(point => this.isPointInsideShape(space.id, point.x, point.y))
      );

      return !intrudesIntoSpace; // ADDED: a floor-owned device cannot drift into a nested space unless it belongs to that space
    }

    return true;
  }

  _findDeviceAt(x, y) {
    for (const device of this.devices) {
      const bounds = this._getEntityInteractionBounds(device); // ADDED: use the same tile bounds used for selection/highlighting
      if (!bounds) continue;


      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.w &&
        y >= bounds.y &&
        y <= bounds.y + bounds.h
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

    // Devices and furniture are intended to be placed within structural elements (Spaces/Floors).
    // We skip the structural overlap check for these assets to avoid false positive alerts.
    const isAsset = currentEntity.interfaces !== undefined || currentEntity.catalogId !== undefined || currentEntity.type === 'furniture' || currentEntity.id?.startsWith('furniture');

  if (isAsset) {
    const insideAssignedParent = this._isAssetInsideAssignedParent(currentEntity);

    if (!insideAssignedParent) {
      if (action === 'creation' && currentEntity.body) {
        this.system.remove(currentEntity.body); // ADDED: clean up the collision body if placement is rejected
      }

      const assetName = this._isDeviceEntity(currentEntity) ? 'device' : 'asset';
      const actionLabel = action === 'creation' ? 'Placement' : 'Movement';

      alert(`${actionLabel} failed. The ${assetName} must remain inside its assigned Space or Floor.`); // CHANGED: assets now fail validation when dragged/dropped outside their parent
      return true;
    }

  return false;
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
