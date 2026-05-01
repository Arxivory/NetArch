import appState from '../state/AppState.js';
import LogicalLayout from '../core/layout/LogicalLayout.js';
import { createDeviceInstance } from '../data/deviceCatalog';
import { createFurnitureInstance } from '../data/furnitureCatalog';
import { validateConnection } from '../data/deviceCatalog';
import { validatePortSelection } from '../data/deviceCatalog';
import { showErrorModal } from '../util/ErrorHandling.js';
import { CommandHistory } from './editor/CommandHistory.js';
import {
  CreateDomainCommand,
  CreateSiteCommand,
  CreateFloorCommand,
  CreateSpaceCommand,
  AddDeviceCommand,
  RemoveDeviceCommand,
  RemoveDomainCommand,
  RemoveSiteCommand,
  RemoveFloorCommand,
  RemoveSpaceCommand,
  MoveCommand
} from './editor/DrawingCommands.js';

export class LogicalCanvasController {
  constructor(container, opts = {}) {
    this.counters = {
      domain: 0,
      site: 0,
      floor: 0,
      space: 0
    };

    // Map canvas entity IDs to structural entity IDs for tracking
    this.entityIdMap = new Map(); // canvas_id -> structural_id
    this.structuralToCanvasMap = new Map(); // structural_id -> canvas_id
    this._suppressDeviceAddedCommand = false;

    // --- ADD THIS TO THE BOTTOM OF THE CONSTRUCTOR ---
    this.positionSnapshot = new Map();
    // --- NEW: Global Listener for Entity Updates ---
    window.addEventListener('forceCanvasUpdate', (e) => {
        if (this.layout) {
            const { id, updates } = e.detail;
            const canvasEntity = this.layout.findEntityById(id);
            if (canvasEntity) {
                const isLogicalDevice =
                  canvasEntity.interfaces !== undefined ||
                  canvasEntity.catalogId !== undefined ||
                  typeof canvasEntity.tileX === 'number';

                if (isLogicalDevice) {
                    // Logical canvas devices use a 2D transform shape (`scale.factor`).
                    // The physical store uses a 3D transform shape (`scale.x/y/z`).
                    // Never overwrite the logical transform with the physical one.
                    const { transform, ...safeUpdates } = updates || {};
                    Object.assign(canvasEntity, safeUpdates);
                } else {
                    Object.assign(canvasEntity, updates);
                }
                // Ensure text properties sync
                if (updates.label !== undefined) {
                    canvasEntity.hostname = updates.label;
                    canvasEntity.name = updates.label;
                }
                this.layout._render(); // Force instant redraw
            }
        }
    });
    this.pendingMoveEntities = new Map();
    this.invalidMoveAlerted = new Set();
    window.addEventListener('pointerdown', () => {
        this.positionSnapshot.clear();
        this.pendingMoveEntities.clear();
        this.invalidMoveAlerted.clear();
        const st = appState.structural;
        if (!st) return;
        
        // Take a snapshot of every structure's X/Y before the drag starts
        const elements = [...(st.domains||[]), ...(st.sites||[]), ...(st.floors||[]), ...(st.spaces||[])];
        elements.forEach(el => {
            const x = Number(el.geometry ? el.geometry.x : (el.x || 0));
            const y = Number(el.geometry ? el.geometry.y : (el.y || 0));
            this.positionSnapshot.set(el.id, { x, y });
        });

        // Also snapshot all devices for drag undo/redo support
        const allDevices = typeof appState.getAllDevices === 'function' ? appState.getAllDevices() : [];
        allDevices.forEach(device => {
            const x = Number(device.transform?.position?.x || 0);
            const y = Number(device.transform?.position?.y || 0);
            this.positionSnapshot.set(device.id, { x, y });
        });
    }, { capture: true });

    window.addEventListener('pointerup', () => {
      this._commitPendingMoveCommands();
    }, { capture: true });

    // Add this to the bottom of your constructor
    this.lastKnownPositions = new Map();
    // -------------------------------------------------

    this.layout = new LogicalLayout({
      container,
      width: opts.width || 800,
      height: opts.height || 600,
      gridSize: opts.gridSize || 32,
      snap: opts.snap ?? true,

      onRectangleCreated: (rect) => this._handleShapeCreated(rect, 'rectangle'),
      onCircleCreated: (circle) => this._handleShapeCreated(circle, 'circle'),
      onPolygonCreated: (poly) => this._handleShapeCreated(poly, 'polygon'),
      onFreeformCreated: (freeform) => this._handleShapeCreated(freeform, 'freeform'),
      onWallCreated: (wall) => this._handleWallCreated(wall),
      onCableCreated: (cable) => this._handleCableCreated(cable),
      // onDeviceAdded: (device) => this._handleDeviceAdded(device),
      onFurnitureAdded: (furniture) => this._handleFurnitureAdded(furniture),
      onEntitySelected: (entity) => this._handleEntitySelected(entity),
      onPortSelect: (device, x, y, callback) => this._handlePortSelect(device, x, y, callback),
      onEntityChanged: (en, dx, dy) => this._handleEntityChanged(en, dx, dy)
    });

    // Initialize CommandHistory for undo/redo
    this.commandHistory = new CommandHistory(appState.commands);
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
  // =========================================================
  // PUBLIC API
  // =========================================================

  /**
   * Undo the last command
   */
  undo() {
    if (this.commandHistory) {
      this.commandHistory.undo();
      // Ensure canvas is refreshed after undo
      if (this.layout && typeof this.layout._render === 'function') {
        this.layout._render();
      }
    }
  }

  /**
   * Redo the last undone command
   */
  redo() {
    if (this.commandHistory) {
      this.commandHistory.redo();
      // Ensure canvas is refreshed after redo
      if (this.layout && typeof this.layout._render === 'function') {
        this.layout._render();
      }
    }
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.commandHistory ? this.commandHistory.canUndo() : false;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.commandHistory ? this.commandHistory.canRedo() : false;
  }

  /**
   * Get the command store for UI subscriptions
   */
  getCommandStore() {
    return this.commandHistory ? this.commandHistory.getCommandStore() : null;
  }

  removeEntity(id) {
    if (!this.layout) return;

    // 1. Try removing it as a structural shape (Domain, Site, Floor, Space)
    if (typeof this.layout.removeShapeById === 'function') {
      this.layout.removeShapeById(id);
    }

    // 2. Try removing it as a Device or Furniture
    if (typeof this.layout.removeDevice === 'function') {
      this.layout.removeDevice(id);
    }
    if (typeof this.layout.removeFurniture === 'function') {
      this.layout.removeFurniture(id);
    }
    
    // 3. Generic fallback just in case your layout engine uses a unified method
    if (typeof this.layout.removeEntity === 'function') {
      this.layout.removeEntity(id);
    }

    // 4. Force the canvas to re-draw so the shape instantly disappears
    if (typeof this.layout.render === 'function') {
      this.layout.render();
    } else if (typeof this.layout._render === 'function') {
      this.layout._render();
    }
  }

executeDelete(idToDelete) {
        let deletedIds = [];

    // 1. Try deleting from structural state by finding the specific type
    if (appState.structural) {
        const st = appState.structural;
        
        if (st.domains && st.domains.some(d => d.id === idToDelete)) {
            deletedIds = st.removeDomain(idToDelete) || [idToDelete];
        } else if (st.sites && st.sites.some(s => s.id === idToDelete)) {
            deletedIds = st.removeSite(idToDelete) || [idToDelete];
        } else if (st.floors && st.floors.some(f => f.id === idToDelete)) {
            deletedIds = st.removeFloor(idToDelete) || [idToDelete];
        } else if (st.spaces && st.spaces.some(s => s.id === idToDelete)) {
            deletedIds = st.removeSpace(idToDelete) || [idToDelete];
        }
    }

    // 2. If it wasn't a structure, try devices
    if (deletedIds.length === 0 && appState.devices && appState.devices.removeDevice) {
        appState.devices.removeDevice(idToDelete); 
        deletedIds = [idToDelete];
    }

        // 3. Try furniture 
        if (deletedIds.length === 0 && appState.furniture && appState.furniture.removeFurniture) {
            const isFurniture = appState.furniture.furnitures && appState.furniture.furnitures.some(f => f.id === idToDelete);
            if (isFurniture) {
                appState.furniture.removeFurniture(idToDelete);
                deletedIds = [idToDelete];
            }
        }

        // 4. Fallback: If it wasn't caught above, it's likely a raw canvas shape (like a Wall)
        if (deletedIds.length === 0) {
            deletedIds = [idToDelete];
        }

        // 5. Clear the visual objects from the canvas
        if (deletedIds.length > 0) {
            deletedIds.forEach(deletedId => {
                if (typeof this.removeEntity === 'function') {
                    this.removeEntity(deletedId);
                }
            });
            
            if (appState.selection && appState.selection.clearSelection) {
                appState.selection.clearSelection();
                if (typeof appState.selection.notify === 'function') appState.selection.notify();
            }
        }
    }

  setSize(w, h) {
    this.layout?.setSize(w, h);
  }

  setGridSize(size) {
    this.layout?.setGridSize(size);
  }

  restoreCanvasShape(structure, canvasId) {
    if (!this.layout?.shapeCreator || !structure) {
      return null;
    }

    // If we no longer have the previous canvas mapping, fall back to the structural id.
    if (!canvasId) {
      canvasId = structure.id;
    }

    const structureType = structure.type || structure.structureType || '';
    const primitiveType = structure.shapeType || structure.type || 'rectangle';
    const geom = structure.geometry || {};
    const x = Number(geom.x || 0);
    const y = Number(geom.y || 0);
    const w = Number(geom.width ?? geom.w ?? 0);
    const h = Number(geom.height ?? geom.h ?? 0);
    const r = Number(geom.radius ?? geom.r ?? 0);
    const points = Array.isArray(geom.points) ? geom.points : [];

    let shape = null;
    if (primitiveType === 'rectangle') {
      shape = this.layout.shapeCreator.createRectangle(
        { x, y },
        { x: x + w, y: y + h },
        structureType
      );
    } else if (primitiveType === 'circle') {
      shape = this.layout.shapeCreator.createCircle(
        { x, y },
        { x: x + r, y },
        structureType
      );
    } else if (primitiveType === 'polygon') {
      shape = this.layout.shapeCreator.createPolygon(points, structureType);
    } else if (primitiveType === 'freeform') {
      shape = this.layout.shapeCreator.createFreeform(points, structureType);
    }

    if (!shape) {
      return null;
    }

    shape.id = canvasId;
    shape.floorId = structure.floorId || null;
    if (shape.body) {
      shape.body.floorId = shape.floorId;
      shape.body.structType = structureType;
    }

    const containerMap = {
      rectangle: 'rectangles',
      circle: 'circles',
      polygon: 'polygons',
      freeform: 'freeforms'
    };
    const listName = containerMap[shape.type] || 'rectangles';

    if (Array.isArray(this.layout[listName])) {
      this.layout[listName].push(shape);
    }

    if (this.entityIdMap) {
      this.entityIdMap.set(canvasId, structure.id);
    }
    if (this.structuralToCanvasMap) {
      this.structuralToCanvasMap.set(structure.id, canvasId);
    }

    if (typeof this.layout._render === 'function') {
      this.layout._render();
    }

    return shape;
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

  startDrawFreeform(type = '') {
    this.layout?.startDrawFreeform(type);
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

  _applyCanvasEntityMoveById(entityId, dx, dy) {
    if (!this.layout || typeof this.layout.findEntityById !== 'function') {
      return null;
    }

    const canvasEntity = this._findCanvasEntityForId(entityId);

    if (canvasEntity && typeof canvasEntity.move === 'function') {
      canvasEntity.move(dx, dy);
    } else if (canvasEntity) {
      canvasEntity.x = Number(canvasEntity.x || 0) + dx;
      canvasEntity.y = Number(canvasEntity.y || 0) + dy;
      if (canvasEntity.transform?.position) {
        canvasEntity.transform.position.x = Number(canvasEntity.transform.position.x || 0) + dx;
        canvasEntity.transform.position.y = Number(canvasEntity.transform.position.y || 0) + dy;
      }
    }

    return canvasEntity;
  }

  _findCanvasEntityForId(entityId) {
    if (!this.layout || typeof this.layout.findEntityById !== 'function') {
      return null;
    }

    let canvasEntity = this.layout.findEntityById(entityId);
    if (!canvasEntity) {
      const mappedId = this.structuralToCanvasMap.get(entityId);
      if (mappedId) {
        canvasEntity = this.layout.findEntityById(mappedId);
      }
    }

    return canvasEntity || null;
  }

  _recordPendingMove(entityId, moveInfo) {
    if (!this.pendingMoveEntities.has(entityId)) {
      this.pendingMoveEntities.set(entityId, moveInfo);
    }
  }

  _getStructuralObjectById(structuralId) {
    const st = appState.structural;
    if (!st) return null;
    return (st.domains?.find(d => String(d.id) === String(structuralId))
      || st.sites?.find(s => String(s.id) === String(structuralId))
      || st.floors?.find(f => String(f.id) === String(structuralId))
      || st.spaces?.find(sp => String(sp.id) === String(structuralId))
      || null);
  }

  _getStructuralPosition(structure) {
    const geom = structure.geometry || structure;
    return {
      x: Number(geom.x ?? geom.left ?? 0),
      y: Number(geom.y ?? geom.top ?? 0)
    };
  }

  _getStructuralTypeById(structuralId) {
    const st = appState.structural;
    if (!st) return null;

    if (st.domains?.some(d => String(d.id) === String(structuralId))) return 'domain';
    if (st.sites?.some(s => String(s.id) === String(structuralId))) return 'site';
    if (st.floors?.some(f => String(f.id) === String(structuralId))) return 'floor';
    if (st.spaces?.some(s => String(s.id) === String(structuralId))) return 'space';
    return null;
  }

  _getShapeBounds(shape) {
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
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        minX,
        minY,
        maxX,
        maxY
      };
    }

    const radius = Number(src.r ?? src.radius ?? 0);
    if (radius > 0) {
      const x = Number(src.x ?? 0) - radius;
      const y = Number(src.y ?? 0) - radius;
      return {
        x,
        y,
        w: radius * 2,
        h: radius * 2,
        minX: x,
        minY: y,
        maxX: x + radius * 2,
        maxY: y + radius * 2
      };
    }

    const x = Number(src.x ?? src.left ?? 0);
    const y = Number(src.y ?? src.top ?? 0);
    let w = Number(src.w ?? src.width ?? 0);
    let h = Number(src.h ?? src.height ?? 0);
    if (!w && src.maxX !== undefined) w = Number(src.maxX) - x;
    if (!h && src.maxY !== undefined) h = Number(src.maxY) - y;

    return {
      x,
      y,
      w,
      h,
      minX: Math.min(x, x + w),
      minY: Math.min(y, y + h),
      maxX: Math.max(x, x + w),
      maxY: Math.max(y, y + h)
    };
  }

  _setShapeBounds(shape, bounds) {
    if (!shape || !bounds) return;

    const geom = shape.geometry || shape;
    geom.x = bounds.x;
    geom.y = bounds.y;

    if ('width' in geom || shape.geometry) geom.width = bounds.w;
    if ('height' in geom || shape.geometry) geom.height = bounds.h;
    if ('w' in geom) geom.w = bounds.w;
    if ('h' in geom) geom.h = bounds.h;
    if ('maxX' in geom) geom.maxX = bounds.x + bounds.w;
    if ('maxY' in geom) geom.maxY = bounds.y + bounds.h;
  }

  _mapPointBetweenBounds(point, oldBounds, newBounds) {
    const scaleX = oldBounds.w !== 0 ? newBounds.w / oldBounds.w : 1;
    const scaleY = oldBounds.h !== 0 ? newBounds.h / oldBounds.h : 1;

    return {
      x: newBounds.x + (point.x - oldBounds.x) * scaleX,
      y: newBounds.y + (point.y - oldBounds.y) * scaleY
    };
  }

  _mapBoundsBetweenBounds(bounds, oldParentBounds, newParentBounds) {
    const topLeft = this._mapPointBetweenBounds(
      { x: bounds.x, y: bounds.y },
      oldParentBounds,
      newParentBounds
    );
    const scaleX = oldParentBounds.w !== 0 ? newParentBounds.w / oldParentBounds.w : 1;
    const scaleY = oldParentBounds.h !== 0 ? newParentBounds.h / oldParentBounds.h : 1;

    return {
      x: topLeft.x,
      y: topLeft.y,
      w: bounds.w * scaleX,
      h: bounds.h * scaleY
    };
  }

  _getCanvasEntityBounds(entity) {
    if (!entity) return null;

    if (typeof entity.tileX === 'number' && typeof entity.tileY === 'number') {
      return {
        x: entity.tileX,
        y: entity.tileY,
        w: entity.tileWidth ?? 0,
        h: entity.tileHeight ?? 0
      };
    }

    if (entity.type === 'furniture' || entity.entityType === 'furniture' || entity.id?.startsWith('furniture')) {
      const scale = entity.transform?.scale?.factor || entity.transform?.scale?.x || 1;
      const size = (entity.width ?? 0) * scale;
      return {
        x: Number(entity.x ?? 0) - size / 2,
        y: Number(entity.y ?? 0) - size / 2,
        w: size,
        h: size
      };
    }

    return {
      x: Number(entity.transform?.position?.x ?? entity.x ?? 0),
      y: Number(entity.transform?.position?.y ?? entity.y ?? 0),
      w: Number(entity.transform?.scale?.w ?? entity.w ?? entity.width ?? 0),
      h: Number(entity.transform?.scale?.h ?? entity.h ?? entity.height ?? 0)
    };
  }

  _applyCanvasEntityBoundsById(entityId, bounds) {
    const canvasEntity = this._findCanvasEntityForId(entityId);
    if (!canvasEntity || !bounds) return null;

    const currentBounds = this._getCanvasEntityBounds(canvasEntity);
    if (!currentBounds) return canvasEntity;

    const dx = bounds.x - currentBounds.x;
    const dy = bounds.y - currentBounds.y;
    if (dx !== 0 || dy !== 0) {
      if (typeof canvasEntity.move === 'function') {
        canvasEntity.move(dx, dy);
      } else {
        canvasEntity.x = Number(canvasEntity.x || 0) + dx;
        canvasEntity.y = Number(canvasEntity.y || 0) + dy;
        if (canvasEntity.transform?.position) {
          canvasEntity.transform.position.x = Number(canvasEntity.transform.position.x || 0) + dx;
          canvasEntity.transform.position.y = Number(canvasEntity.transform.position.y || 0) + dy;
        }
      }
    }

    if (typeof canvasEntity.setWidthAndHeight === 'function') {
      canvasEntity.setWidthAndHeight(bounds.w, bounds.h);
    }

    return canvasEntity;
  }

  _applyCanvasEntityCenterById(entityId, nextCenter) {
    const canvasEntity = this._findCanvasEntityForId(entityId);
    if (!canvasEntity || !nextCenter) return null;

    const currentBounds = this._getCanvasEntityBounds(canvasEntity);
    if (!currentBounds) return canvasEntity;

    const currentCenter = {
      x: currentBounds.x + currentBounds.w / 2,
      y: currentBounds.y + currentBounds.h / 2
    };
    const dx = nextCenter.x - currentCenter.x;
    const dy = nextCenter.y - currentCenter.y;

    if (dx !== 0 || dy !== 0) {
      if (typeof canvasEntity.move === 'function') {
        canvasEntity.move(dx, dy);
      } else {
        canvasEntity.x = Number(canvasEntity.x || 0) + dx;
        canvasEntity.y = Number(canvasEntity.y || 0) + dy;
        if (canvasEntity.transform?.position) {
          canvasEntity.transform.position.x = Number(canvasEntity.transform.position.x || 0) + dx;
          canvasEntity.transform.position.y = Number(canvasEntity.transform.position.y || 0) + dy;
        }
      }
    }

    return canvasEntity;
  }

  _getStructuralScaleChildren(structuralId, shapeType) {
    const st = appState.structural;
    if (!st) {
      return { structures: [], floorIds: [], spaceIds: [] };
    }

    let childSites = [];
    let childFloors = [];
    let childSpaces = [];

    if (shapeType === 'domain') {
      childSites = st.sites.filter(site => String(site.domainId) === String(structuralId));
      const siteIds = childSites.map(site => site.id);
      childFloors = st.floors.filter(floor => siteIds.some(siteId => String(siteId) === String(floor.siteId)));
      const floorIds = childFloors.map(floor => floor.id);
      childSpaces = st.spaces.filter(space => floorIds.some(floorId => String(floorId) === String(space.floorId)));
    } else if (shapeType === 'site') {
      childFloors = st.floors.filter(floor => String(floor.siteId) === String(structuralId));
      const floorIds = childFloors.map(floor => floor.id);
      childSpaces = st.spaces.filter(space =>
        floorIds.some(floorId => String(floorId) === String(space.floorId)) ||
        String(space.siteId) === String(structuralId)
      );
    } else if (shapeType === 'floor') {
      childFloors = st.floors.filter(floor => String(floor.id) === String(structuralId));
      childSpaces = st.spaces.filter(space => String(space.floorId) === String(structuralId));
    } else if (shapeType === 'space') {
      childSpaces = st.spaces.filter(space => String(space.id) === String(structuralId));
    }

    const floorIds = childFloors.map(floor => floor.id);
    if (shapeType === 'floor') floorIds.push(structuralId);

    const spaceIds = childSpaces.map(space => space.id);
    if (shapeType === 'space') spaceIds.push(structuralId);

    return {
      structures: [...childSites, ...childFloors, ...childSpaces],
      floorIds,
      spaceIds
    };
  }

  _scaleStructuralChildren(structuralId, shapeType, oldBounds, newBounds) {
    if (!oldBounds || !newBounds || oldBounds.w === 0 || oldBounds.h === 0) {
      return false;
    }

    const { structures, floorIds, spaceIds } = this._getStructuralScaleChildren(structuralId, shapeType);

    structures
      .filter(child => String(child.id) !== String(structuralId))
      .forEach(child => {
        const childBounds = this._getShapeBounds(child);
        if (!childBounds) return;

        const nextBounds = this._mapBoundsBetweenBounds(childBounds, oldBounds, newBounds);
        this._setShapeBounds(child, nextBounds);
        this._applyCanvasEntityBoundsById(child.id, nextBounds);
      });

    const scaleItems = (items = []) => {
      items.forEach(item => {
        const inScaledFloor = floorIds.some(floorId => String(floorId) === String(item.floorId));
        const inScaledSpace = spaceIds.some(spaceId => String(spaceId) === String(item.spaceId));
        if (!inScaledFloor && !inScaledSpace) return;

        const canvasEntity = this._findCanvasEntityForId(item.id);
        const canvasBounds = this._getCanvasEntityBounds(canvasEntity);
        const currentCenter = canvasBounds
          ? { x: canvasBounds.x + canvasBounds.w / 2, y: canvasBounds.y + canvasBounds.h / 2 }
          : {
              x: Number(item.transform?.position?.x ?? item.x ?? 0),
              y: Number(item.transform?.position?.y ?? item.y ?? 0)
            };
        const nextCenter = this._mapPointBetweenBounds(currentCenter, oldBounds, newBounds);
        const dx = nextCenter.x - currentCenter.x;
        const dy = nextCenter.y - currentCenter.y;

        this._applyCanvasEntityCenterById(item.id, nextCenter);

        if (item.transform?.position) {
          item.transform.position.x = Number(item.transform.position.x || 0) + dx;
          item.transform.position.y = Number(item.transform.position.y || 0) + dy;
        } else {
          item.x = Number(item.x || 0) + dx;
          item.y = Number(item.y || 0) + dy;
        }
      });
    };

    if (appState.network && typeof appState.network.getAllDevices === 'function') {
      scaleItems(appState.network.getAllDevices());
      appState.network.notify?.();
    }

    if (appState.furniture?.furnitures) {
      scaleItems(appState.furniture.furnitures);
      appState.furniture.notify?.();
    }

    appState.structural?.notify?.();
    this.layout?._render?.();
    return true;
  }

  _isStructuralMoveWithinBounds(structure, shapeType, dx, dy) {
    if (!structure) return true;

    const getBounds = (shape) => {
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
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          minX,
          minY,
          maxX,
          maxY
        };
      }

      const radius = Number(src.r ?? src.radius ?? 0);
      if (radius > 0) {
        const x = Number(src.x ?? 0);
        const y = Number(src.y ?? 0);
        return {
          x: x - radius,
          y: y - radius,
          w: radius * 2,
          h: radius * 2,
          minX: x - radius,
          minY: y - radius,
          maxX: x + radius,
          maxY: y + radius
        };
      }

      const x0 = Number(src.x ?? src.left ?? 0);
      const y0 = Number(src.y ?? src.top ?? 0);
      let w0 = Number(src.w ?? src.width ?? 0);
      let h0 = Number(src.h ?? src.height ?? 0);

      if (!w0 && src.maxX !== undefined) w0 = Number(src.maxX) - x0;
      if (!h0 && src.maxY !== undefined) h0 = Number(src.maxY) - y0;

      const minX0 = Math.min(x0, x0 + w0);
      const minY0 = Math.min(y0, y0 + h0);
      const maxX0 = Math.max(x0, x0 + w0);
      const maxY0 = Math.max(y0, y0 + h0);
      return {
        x: x0,
        y: y0,
        w: Math.abs(w0),
        h: Math.abs(h0),
        minX: minX0,
        minY: minY0,
        maxX: maxX0,
        maxY: maxY0
      };
    };

    const st = appState.structural;
    if (!st) return true;

    const childBounds = getBounds(structure);
    childBounds.minX += dx;
    childBounds.minY += dy;
    childBounds.maxX += dx;
    childBounds.maxY += dy;

    const parentCandidates = [];
    if (shapeType === 'site') {
      parentCandidates.push(st.domains?.find(d => d.id === structure.domainId));
    } else if (shapeType === 'floor') {
      parentCandidates.push(st.sites?.find(s => s.id === structure.siteId));
    } else if (shapeType === 'space') {
      parentCandidates.push(st.floors?.find(f => f.id === structure.floorId));
      parentCandidates.push(st.sites?.find(s => s.id === structure.siteId));
    }

    const validParentBounds = parentCandidates
      .map(parent => getBounds(parent))
      .filter(parentBounds => parentBounds && parentBounds.w > 0 && parentBounds.h > 0);

    if (!validParentBounds.length) {
      return true;
    }

    const tol = 2;
    return validParentBounds.every(parentBounds => !(
      childBounds.minX < parentBounds.minX - tol ||
      childBounds.minY < parentBounds.minY - tol ||
      childBounds.maxX > parentBounds.maxX + tol ||
      childBounds.maxY > parentBounds.maxY + tol
    ));
  }

  applyStructuralMove(structuralId, shapeType, dx, dy, options = {}) {
    const structure = this._getStructuralObjectById(structuralId);
    if (!structure || (dx === 0 && dy === 0)) {
      return false;
    }

    const skipCanvasMove = options.skipCanvasMove === true;
    const skipBounds = options.skipBounds === true;
    const skipParent = options.skipParent === true;

    if (!skipBounds && !this._isStructuralMoveWithinBounds(structure, shapeType, dx, dy)) {
      return false;
    }

    const moveItem = (item) => {
      if (!item) return;
      if (item.geometry) {
        item.geometry.x = Number(item.geometry.x) + dx;
        item.geometry.y = Number(item.geometry.y) + dy;
      } else {
        item.x = Number(item.x || 0) + dx;
        item.y = Number(item.y || 0) + dy;
      }
    };

    if (!skipParent) {
      moveItem(structure);
    }
    if (!skipCanvasMove) {
      this._applyCanvasEntityMoveById(structuralId, dx, dy);
    }

    let childSites = [];
    let childFloors = [];
    let childSpaces = [];
    const st = appState.structural;

    if (shapeType === 'domain') {
      childSites = st.sites.filter(s => s.domainId === structuralId);
      childFloors = st.floors.filter(f => childSites.some(s => s.id === f.siteId));
      childSpaces = st.spaces.filter(sp => childFloors.some(f => f.id === sp.floorId));
    } else if (shapeType === 'site') {
      childFloors = st.floors.filter(f => f.siteId === structuralId);
      childSpaces = st.spaces.filter(sp => childFloors.some(f => f.id === sp.floorId));
    } else if (shapeType === 'floor') {
      childSpaces = st.spaces.filter(sp => sp.floorId === structuralId);
    }

    const allChildStructures = [...childSites, ...childFloors, ...childSpaces];
    allChildStructures.forEach(child => {
      moveItem(child);
      this._applyCanvasEntityMoveById(child.id, dx, dy);
    });

    const floorIds = childFloors.map(f => f.id);
    if (shapeType === 'floor') floorIds.push(structuralId);

    const spaceIds = childSpaces.map(sp => sp.id);
    if (shapeType === 'space') spaceIds.push(structuralId);

    const moveItems = (items) => {
      (items || []).forEach(item => {
        if (floorIds.includes(item.floorId) || spaceIds.includes(item.spaceId)) {
          if (item.transform?.position) {
            item.transform.position.x = Number(item.transform.position.x || 0) + dx;
            item.transform.position.y = Number(item.transform.position.y || 0) + dy;
          } else {
            item.x = Number(item.x || 0) + dx;
            item.y = Number(item.y || 0) + dy;
          }
          // We must always move the child entities on the canvas to ensure they follow the parent
          this._applyCanvasEntityMoveById(item.id, dx, dy);
        }
      });
    };

    if (appState.network && typeof appState.network.getAllDevices === 'function') {
      moveItems(appState.network.getAllDevices());
      if (typeof appState.network.notify === 'function') {
        appState.network.notify();
      }
    }
    if (appState.furniture && appState.furniture.furnitures) {
      moveItems(appState.furniture.furnitures);
      if (typeof appState.furniture.notify === 'function') {
        appState.furniture.notify();
      }
    }

    if (appState.structural && typeof appState.structural.notify === 'function') {
      appState.structural.notify();
    }

    if (typeof this.layout._render === 'function') {
      this.layout._render();
    }

    return true;
  }

  applyDeviceMove(deviceId, dx, dy, options = {}) {
    if (dx === 0 && dy === 0) {
      return false;
    }

    const device = typeof appState.getDevice === 'function' ? appState.getDevice(deviceId) : null;
    if (!device) {
      return false;
    }

    device.transform = device.transform || { position: { x: 0, y: 0, z: 0 } };
    device.transform.position.x = Number(device.transform.position.x || 0) + dx;
    device.transform.position.y = Number(device.transform.position.y || 0) + dy;

    if (!options.skipCanvasMove) {
      this._applyCanvasEntityMoveById(deviceId, dx, dy);
    }

    if (appState.network && typeof appState.network.notify === 'function') {
      appState.network.notify();
    }

    if (typeof this.layout._render === 'function') {
      this.layout._render();
    }

    return true;
  }

  _commitPendingMoveCommands() {
    if (!this.pendingMoveEntities.size) {
      return;
    }

    this.pendingMoveEntities.forEach((moveInfo, entityId) => {
      if (moveInfo.kind === 'structure') {
        const startingPos = this.positionSnapshot.get(entityId);
        const model = this._getStructuralObjectById(entityId);
        if (!model || !startingPos) {
          return;
        }

        const currentPos = this._getStructuralPosition(model);
        const dx = Number(currentPos.x) - Number(startingPos.x);
        const dy = Number(currentPos.y) - Number(startingPos.y);
        if (dx === 0 && dy === 0) {
          return;
        }

        const moveCommand = new MoveCommand(appState, this, entityId, 'structure', moveInfo.structureType, dx, dy);
        this.commandHistory.executeCommand(moveCommand);
      } else if (moveInfo.kind === 'device') {
        const startingPos = this.positionSnapshot.get(entityId);
        if (!startingPos) {
          return;
        }

        const currentDevice = typeof appState.getDevice === 'function' ? appState.getDevice(entityId) : null;
        const currentX = Number(currentDevice?.transform?.position?.x || 0);
        const currentY = Number(currentDevice?.transform?.position?.y || 0);
        const dx = currentX - Number(startingPos.x);
        const dy = currentY - Number(startingPos.y);
        if (dx === 0 && dy === 0) {
          return;
        }

        const moveCommand = new MoveCommand(appState, this, entityId, 'device', null, dx, dy);
        this.commandHistory.executeCommand(moveCommand);
      }
    });

    this.pendingMoveEntities.clear();
  }

  setActiveFloor(floorId) {
    appState.ui.setActiveFloor(floorId); // ADDED: keep the global active floor in sync for shape creation and overlap checks
    this.layout?.setActiveFloor(floorId);
  }

  _getEntityBounds(entity) {
    if (!entity) return null;

    if (typeof entity.tileX === 'number' && typeof entity.tileY === 'number' &&
        typeof entity.tileWidth === 'number' && typeof entity.tileHeight === 'number') {
      return {
        minX: entity.tileX,
        minY: entity.tileY,
        maxX: entity.tileX + entity.tileWidth,
        maxY: entity.tileY + entity.tileHeight
      };
    }

    if (typeof entity.x === 'number' && typeof entity.y === 'number' &&
        typeof entity.width === 'number' && typeof entity.height === 'number') {
      return {
        minX: entity.x,
        minY: entity.y,
        maxX: entity.x + entity.width,
        maxY: entity.y + entity.height
      };
    }

    if (typeof entity.getCurrentBounds === 'function') {
      return entity.getCurrentBounds();
    }

    return null;
  }

  _getParentBounds(entity) {
    if (!entity || !appState.structural) return null;
    const st = appState.structural;
    const getBounds = (shape) => {
      if (!shape) return null;
      const src = shape.geometry || shape;
      const x = Number(src.x ?? src.left ?? 0);
      const y = Number(src.y ?? src.top ?? 0);
      const w = Number(src.w ?? src.width ?? 0);
      const h = Number(src.h ?? src.height ?? 0);
      const minX = Math.min(x, x + w);
      const minY = Math.min(y, y + h);
      const maxX = Math.max(x, x + w);
      const maxY = Math.max(y, y + h);
      return { minX, minY, maxX, maxY, width: Math.abs(w), height: Math.abs(h) };
    };

    if (entity.spaceId) {
      const space = st.spaces?.find(s => s.id === entity.spaceId);
      if (space) {
        return getBounds(space);
      }
    }

    if (entity.floorId) {
      const floor = st.floors?.find(f => f.id === entity.floorId);
      if (floor) {
        const floorBounds = getBounds(floor);
        if (floorBounds && floorBounds.width > 0 && floorBounds.height > 0) {
          return floorBounds;
        }
        const parentSite = st.sites?.find(s => s.id === floor.siteId);
        if (parentSite) {
          return getBounds(parentSite);
        }
      }
    }

    return null;
  }

  _isEntityWithinAssignedParentBounds(entity) {
    const entityBounds = this._getEntityBounds(entity);
    const parentBounds = this._getParentBounds(entity);
    if (!entityBounds || !parentBounds) return true;
    const tol = 2;
    return !(
      entityBounds.minX < parentBounds.minX - tol ||
      entityBounds.minY < parentBounds.minY - tol ||
      entityBounds.maxX > parentBounds.maxX + tol ||
      entityBounds.maxY > parentBounds.maxY + tol
    );
  }

addDevice(deviceData, x, y) {
    if (!this.layout) return;

    if (deviceData.entityType === 'furniture') {
        return this.addFurniture(deviceData, x, y);
    }

    const focusedType = appState.selection.focusedType;
    const focusedId = appState.selection.focusedId;

    if (focusedType !== 'floor' && focusedType !== 'space') {
        // ... (existing error handling)
        return;
    }

    // =========================================================
    // 1. Physical Bounds Validation (The code we just wrote!)
    // =========================================================
    if (this.layout && typeof this.layout.isPointInsideShape === 'function') {
        const dropIsInsideParent = this.layout.isPointInsideShape(focusedId, x, y);
        if (!dropIsInsideParent) {
            const prettyTypeName = focusedType.charAt(0).toUpperCase() + focusedType.slice(1);
            showErrorModal(
                `Placement Failed.\nYou dropped the item outside the physical area of the selected ${prettyTypeName}.`, 
                "Out of Bounds Error"
            );
            return; 
        }
    }

    // =========================================================
    // --- NEW: 2. Smart Space Interception ---
    // Prevent dropping ON a Space when only the Floor is selected
    // =========================================================
    if (focusedType === 'floor' && appState.structural && appState.structural.spaces) {
        const spacesOnFloor = appState.structural.spaces.filter(s => s.floorId === focusedId);
        const droppedInsideSpace = spacesOnFloor.find(space => 
            this.layout.isPointInsideShape(space.id, x, y)
        );
        if (droppedInsideSpace) {
            showErrorModal(
                `You dropped the device inside "${droppedInsideSpace.label}".\n\nTo place a device inside a Space, you must explicitly select that Space in the Hierarchy Panel first.`, 
                "Specific Placement Required"
            );
            return; 
        }
    }
    const catalogId = deviceData.modelId;
    if (!catalogId) {
        console.error("Missing modelId in deviceData", deviceData);
        return;
    }

    try {
        const newDevice = createDeviceInstance(catalogId, { x, y, z: 0 });
        newDevice.catalogId = catalogId;

        // AUTO NUMBER DEVICE NAME
        const baseName = newDevice.name;

        const existing = this.layout.devices.filter(
          d => d.name === baseName || d.label?.startsWith(baseName)
        );

        let newLabel = baseName;

        if (existing.length > 0) {
          newLabel = baseName + " (" + (existing.length + 1) + ")";
        }

        newDevice.label = newLabel;
        newDevice.name = newLabel;

        if (focusedType === 'space') {
            newDevice.spaceId = focusedId;
            const space = appState.structural.spaces.find(s => s.id === focusedId);
            if (space) {
                newDevice.floorId = space.floorId;
            }
        } else if (focusedType === 'floor') {
            newDevice.floorId = focusedId;
        }

        // this.layout.devices.push(newDevice);
        const layoutDevice = this.layout.shapeCreator.createDevice(
          newDevice, // still pass your instance
          x,
          y,
          this.layout.shapeRenderer.gridSize * 1.5
        );

        // preserve IDs + metadata
        layoutDevice.id = newDevice.id;
        layoutDevice.label = newDevice.label;
        layoutDevice.name = newDevice.name;
        layoutDevice.catalogId = newDevice.catalogId;
        layoutDevice.floorId = newDevice.floorId;
        layoutDevice.spaceId = newDevice.spaceId;

        this.layout.devices.push(layoutDevice);
        this.layout._render();
        this.layout._render();


        console.log("ADDING DEVICE TO LAYOUT:", newDevice.id);

        if (appState.network?.addDevice) {
            appState.network.addDevice(newDevice);
        }

        if (this.physicalController) {
            this.physicalController.createDeviceGLTFMesh(newDevice);
        } else {
            console.error("Physical controller reference not found.");
        }

        console.log('Device added:', newDevice.id, 'with Catalog ID:', newDevice.catalogId, 'to floor/space:', focusedId);
    } catch (error) {
        console.error("Failed to add device:", error.message);
    }
}

addFurniture(furnitureData, x, y) {
  console.log('Adding furniture with data:', furnitureData, 'at position:', { x, y });
    if (!this.layout) return;

    const focusedType = appState.selection.focusedType;
    const focusedId = appState.selection.focusedId;

    if (focusedType !== 'floor' && focusedType !== 'space') {
        console.error("Cannot add furniture: A floor or space must be selected in the hierarchy");
        alert('Please select a floor or space in the hierarchy before adding furniture.');
        return;
    }

    if (!focusedId) {
        console.error("Cannot add furniture: No floor or space is focused");
        alert('Please select a floor or space in the hierarchy before adding furniture.');
        return;
    }

    if (this.layout && typeof this.layout.isPointInsideShape === 'function') {
        const dropIsInsideParent = this.layout.isPointInsideShape(focusedId, x, y);
        if (!dropIsInsideParent) {
            const prettyTypeName = focusedType.charAt(0).toUpperCase() + focusedType.slice(1);
            showErrorModal(
                `Placement Failed.\nYou dropped the furniture outside the physical area of the selected ${prettyTypeName}.`,
                "Out of Bounds Error"
            );
            return;
        }
    }

    if (focusedType === 'floor' && appState.structural && appState.structural.spaces) {
        const spacesOnFloor = appState.structural.spaces.filter(s => s.floorId === focusedId);
        const droppedInsideSpace = spacesOnFloor.find(space => 
            this.layout.isPointInsideShape(space.id, x, y)
        );
        if (droppedInsideSpace) {
            showErrorModal(
                `You dropped the furniture inside "${droppedInsideSpace.label}".\n\nTo place furniture inside a Space, you must explicitly select that Space in the Hierarchy Panel first.`,
                "Specific Placement Required"
            );
            return;
        }
    }

    const catalogId = furnitureData.modelId;
    if (!catalogId) {
        console.error("Missing modelId in furnitureData", furnitureData);
        return;
    }

    try {
        const newFurniture = createFurnitureInstance(catalogId, { x, y, z: 0 });
        
        newFurniture.catalogId = catalogId; 
        newFurniture.label = furnitureData.label || newFurniture.name;

        if (focusedType === 'space') {
            newFurniture.spaceId = focusedId;
            const space = appState.structural.spaces.find(s => s.id === focusedId);
            if (space) {
                newFurniture.floorId = space.floorId;
            }
        } else if (focusedType === 'floor') {
            newFurniture.floorId = focusedId;
        }

        console.log('Creating furniture instance with catalogId:', catalogId, 'and:', newFurniture);

        this.layout.addFurniture({ ...newFurniture }, x, y);

        if (appState.furniture?.addFurniture) {
            appState.furniture.addFurniture(newFurniture);
        }

        if (this.physicalController) {
            this.physicalController.createFurnitureGLTFMesh(newFurniture);
        } else {
            console.warn("Physical controller not ready yet (normal if in 2D mode).");
        }

        console.log('Furniture added:', newFurniture.id, 'with Catalog ID:', newFurniture.catalogId);
    } catch (error) {
        console.error("Failed to add furniture:", error.message);
    }
}

  updateEntityTransform(id, updates) {
    this.layout?.updateEntityTransform(id, updates);
  }

  // =========================================================
  // STATE MANAGEMENT HANDLERS
  // =========================================================

_handlePortSelect(device, x, y, callback) {
    const existingMenu = document.getElementById('canvas-port-menu');
    if (existingMenu) existingMenu.remove();

    if (!device.interfaces || device.interfaces.length === 0) {
      console.warn(`Device ${device.label} has no ports available.`);
      callback(null);
      return;
    }

    const usedPorts = new Set();
    
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

    const availablePorts = device.interfaces.filter(port => !usedPorts.has(port));

    if (availablePorts.length === 0) {
      alert(`All ports on ${device.label} are currently in use!`);
      callback(null);
      return;
    }

    const menu = document.createElement('div');
    menu.id = 'canvas-port-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = '#ffffff';
    menu.style.border = '1px solid #94a3b8';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    menu.style.padding = '4px 0';
    menu.style.zIndex = '9999';
    menu.style.minWidth = '140px';
    menu.style.maxHeight = '300px'; 
    menu.style.overflowY = 'auto';  
    menu.style.fontFamily = 'sans-serif';
    menu.style.fontSize = '12px';
    menu.style.color = '#0f172a';

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
        let activeCable = appState.ui.selectedCable || appState.tools.activeTool;

        if (activeCable === 'straight') activeCable = 'copper-straight';
        if (activeCable === 'crossover') activeCable = 'copper-crossover';
        if (activeCable && activeCable !== 'cable') {
            const validation = validatePortSelection(activeCable, port);
            if (!validation.valid) {
              showErrorModal(validation.error, "Connection Error");
              menu.remove();
              document.removeEventListener('pointerdown', outsideClickListener);
              callback(null); 
              return; 
            }
        }
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
    const { structureType, id, r, points } = shapeData;
    console.log(`📥 _handleShapeCreated: received shapeData with id=${id}, structureType=${structureType}`);

    // --- 1. TOP-LEVEL HIERARCHY PRE-CHECK ---
    // Stop invalid Domain creation BEFORE overlap or bounds logic runs
    if (structureType === 'Domain') {
      const selectedType = appState.selection?.focusedType;
      
      if (selectedType === 'site' || selectedType === 'floor' || selectedType === 'space') {
        showErrorModal(
          `You cannot create a Domain while a ${selectedType} is selected. Domains are top-level structures. Please click the canvas background to deselect before drawing.`, 
          "Invalid Hierarchy"
        );
        
        // Remove the invalid shape immediately
        setTimeout(() => {
          if (this.layout && typeof this.layout.removeShapeById === 'function') {
             this.layout.removeShapeById(id);
          }
        }, 10);
        if (appState.tools) appState.tools.setActiveTool('pointer');
        
        return; // Halt the function completely so overlap checks don't run
      }
    }

    // --- 2. BULLETPROOF BOUNDS EXTRACTOR ---
    // Safely extracts coordinates, forces them to be numbers, and handles missing widths
    // Also handles circular shapes by converting radius to bounding box
    const getBounds = (shape) => {
      if (!shape) return null;
      // Handle both raw shape data and state-wrapped shapes (like geometry)
      const src = shape.geometry || shape;
      
      // If it's a circle, calculate bounding box from center and radius
      if (src.r !== undefined && src.r !== null) {
        const cx = Number(src.x ?? 0);
        const cy = Number(src.y ?? 0);
        const r = Number(src.r ?? 0);
        return {
          minX: cx - r, maxX: cx + r,
          minY: cy - r, maxY: cy + r,
          w: r * 2, h: r * 2, x: cx - r, y: cy - r, r
        };
      }
      
      let x = Number(src.x ?? src.left ?? 0);
      let y = Number(src.y ?? src.top ?? 0);
      let w = Number(src.w ?? src.width ?? 0);
      let h = Number(src.h ?? src.height ?? 0);
      
      // If width/height are missing, calculate them from maxX/maxY
      if (!w && src.maxX !== undefined) w = Number(src.maxX) - x;
      if (!h && src.maxY !== undefined) h = Number(src.maxY) - y;

      return {
        minX: Math.min(x, x + w), maxX: Math.max(x, x + w),
        minY: Math.min(y, y + h), maxY: Math.max(y, y + h),
        w: Math.abs(w), h: Math.abs(h), x, y
      };
    };

    // Prepare child coordinates for boundary checks and saving
    const cBounds = getBounds(shapeData);
    const x = cBounds.x, y = cBounds.y, w = cBounds.w, h = cBounds.h;
    const maxX = cBounds.maxX, maxY = cBounds.maxY;

    const removeInvalidShape = () => {
      setTimeout(() => {
        if (this.layout && typeof this.layout.removeShapeById === 'function') {
           this.layout.removeShapeById(id);
        }
      }, 10);
      if (appState.tools) appState.tools.setActiveTool('pointer');
    };

    // --- 3. BOUNDARY CHECKING LOGIC ---
    const checkParentBounds = (parentId, parentType) => {
      let parent = null;
      const st = appState.structural;
      
      if (parentType === 'domain') {
        parent = (st.domains || []).find(d => d.id === parentId);
      } 
      else if (parentType === 'site') {
        parent = (st.sites || []).find(s => s.id === parentId);
      } 
      else if (parentType === 'floor') {
        parent = (st.floors || []).find(f => f.id === parentId);
        
        // --- AUTO-GENERATED FLOOR FALLBACK ---
        // If the floor exists but has no intrinsic width/height because it was auto-generated,
        // we borrow the exact dimensions from the Site it belongs to.
        if (parent) {
          const tempBounds = getBounds(parent);
          if (tempBounds.w === 0 || tempBounds.h === 0) {
            const parentSite = (st.sites || []).find(s => s.id === parent.siteId);
            if (parentSite) {
              console.log(`Borrowing bounds from Site (ID: ${parentSite.id}) for auto-generated Floor.`);
              parent = parentSite; 
            } else {
              console.warn("Could not find the parent Site to borrow bounds from!");
            }
          }
        }
      }

      if (!parent) {
        console.error(`Bounds Check: Parent ${parentType} (ID: ${parentId}) not found in state.`);
        return false; 
      }

      const pBounds = getBounds(parent);

      // We only flag stale state if BOTH the floor AND its fallback site have 0 dimensions
      if (pBounds.w === 0 || pBounds.h === 0) {
         console.warn(`Bounds Check: The selected ${parentType} has 0 width/height in state. It was likely drawn before the code fix. Please delete it and redraw it.`);
         return false; 
      }

      const tol = 5; 

      if (
        cBounds.minX < pBounds.minX - tol || 
        cBounds.minY < pBounds.minY - tol || 
        cBounds.maxX > pBounds.maxX + tol || 
        cBounds.maxY > pBounds.maxY + tol
      ) {
        console.error("Out of Bounds Mathematical Failure:");
        console.table({
           "Parent Limits (Borrowed from Site)": { MinX: pBounds.minX, MinY: pBounds.minY, MaxX: pBounds.maxX, MaxY: pBounds.maxY },
           "Child Limits (Space)": { MinX: cBounds.minX, MinY: cBounds.minY, MaxX: cBounds.maxX, MaxY: cBounds.maxY }
        });
        return false; 
      }
      return true; 
    };

    // --- 4. SHAPE ROUTING - Execute commands for undo/redo tracking ---
    if (structureType === 'Domain') {
      const domainData = {
        ...shapeData, label: `Domain ${this.counters.domain++}`,
        x, y, w, h, maxX, maxY, shapeType: 'rectangle'
      };
      console.log(`🏢 Creating Domain with id=${domainData.id}`);
      
      const command = new CreateDomainCommand(appState, this, domainData, id);
      this.commandHistory.executeCommand(command);
    }
    else if (structureType === 'Site') {
      const parentId = appState.selection.focusedType === 'domain' ? appState.selection.focusedId : null;
      if (!parentId) {
        showErrorModal("A Domain must be selected from the Hierarchy panel before creating a Site.", "Invalid Hierarchy");
        return removeInvalidShape();
      }
      if (!checkParentBounds(parentId, 'domain')) {
        showErrorModal("The Site exceeds the physical boundaries of the selected Domain.", "Out of Bounds Error");
        return removeInvalidShape();
      }
      const siteData = {
        id, shapeType, x, y, w, h, maxX, maxY, r, points,
        label: `Site ${this.counters.site++}`
      };
      console.log(`🏪 Creating Site with id=${siteData.id}, domainId=${parentId}`);
      
      const command = new CreateSiteCommand(appState, this, siteData, parentId, id);
      this.commandHistory.executeCommand(command);
    } 
    else if (structureType === 'Floor') {
      const parentId = appState.selection.focusedType === 'site' ? appState.selection.focusedId : null;
      if (!parentId) {
        showErrorModal("A Site must be selected from the Hierarchy panel before creating a Floor.", "Invalid Hierarchy");
        return removeInvalidShape();
      }
      if (!checkParentBounds(parentId, 'site')) {
        showErrorModal("The Floor exceeds the physical boundaries of the selected Site.", "Out of Bounds Error");
        return removeInvalidShape();
      }
      const floorData = {
        id, shapeType, x, y, w, h, maxX, maxY, r, points,
        label: `Floor ${this.counters.floor++}`
      };
      console.log(`🏗️ Creating Floor with id=${floorData.id}, siteId=${parentId}`);
      
      const command = new CreateFloorCommand(appState, this, floorData, parentId, id);
      this.commandHistory.executeCommand(command);
    }
    else if (structureType === 'Space') {
      const parentId = appState.selection.focusedType === 'floor' ? appState.selection.focusedId : null;
      if (!parentId) {
        showErrorModal("A Floor must be selected from the Hierarchy panel before creating a Space.", "Invalid Hierarchy");
        return removeInvalidShape();
      }
      if (!checkParentBounds(parentId, 'floor')) {
        showErrorModal("The Space exceeds the physical boundaries of the selected Floor.", "Out of Bounds Error");
        return removeInvalidShape();
      }
      const spaceData = {
        id, shapeType, x, y, w, h, maxX, maxY, r, points,
        label: `Space ${this.counters.space++}`
      };
      console.log(`🎨 Creating Space with id=${spaceData.id}, floorId=${parentId}`);
      
      const command = new CreateSpaceCommand(appState, this, spaceData, parentId, id);
      this.commandHistory.executeCommand(command);
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
    console.log("🔌 Finalizing connection with data:", cableData);

    if (cableData.sourceId && cableData.targetId) {
      
      const sourceDevice = appState.getDevice(cableData.sourceId) || this.layout.devices.find(d => d.id === cableData.sourceId);
      const targetDevice = appState.getDevice(cableData.targetId) || this.layout.devices.find(d => d.id === cableData.targetId);

      if (!sourceDevice || !targetDevice) {
         console.error("Could not find source or target device.");
         return;
      }

      const possibleTypes = [
        appState.ui?.selectedCable, 
        appState.tools?.activeTool, 
        cableData.cableType, 
        cableData.type
      ];

      let actualCableId = possibleTypes.find(type => type && type !== 'cable');     
      if (actualCableId === 'straight') actualCableId = 'copper-straight';
      if (actualCableId === 'crossover') actualCableId = 'copper-crossover';
      if (!actualCableId) actualCableId = 'copper-straight';
      
      const validation = validateConnection(
        actualCableId, 
        cableData.sourcePort, 
        cableData.targetPort,
        sourceDevice.type,
        targetDevice.type
      );

      if (!validation.valid) {
       showErrorModal(validation.error, "Connection Error");    
        if (this.layout && this.layout.cables) {
            this.layout.cables = this.layout.cables.filter(c => c.id !== cableData.id);
            if (typeof this.layout.render === 'function') {
                this.layout.render();
            } else if (typeof this.layout._render === 'function') {
                this.layout._render();
            }
        }
        return; 
      }
      
      if (appState.network && typeof appState.network.connectDevices === 'function') {
        appState.network.connectDevices(
          cableData.sourceId,
          cableData.targetId,
          actualCableId 
        );
      } else {
        appState.addLink({
          id: cableData.id,
          sourceId: cableData.sourceId,
          targetId: cableData.targetId,
          sourcePort: cableData.sourcePort,
          targetPort: cableData.targetPort,
          type: actualCableId
        });
      }
    }
  }

  _handleZoomSelected(zoom) {
    this.layout.setZoom(zoom);
  }

  // _handleDeviceAdded(device) {
  //   this.addDevice(device, device.x, device.y);
  // }

  _handleFurnitureAdded(furniture) {
    this.addFurniture(furniture, furniture.x, furniture.y);
  }
  
_handleEntitySelected(entity) {
    if (!entity || !entity.id) {
      appState.selection.clearSelection?.();
      appState.selection.notify?.();
      return;
    }

    // --- Intercept clicks for Delete Mode safely ---
    if (appState.tools && appState.tools.activeTool === 'delete') {
        // Wait for the user to physically release the mouse button
        window.addEventListener('pointerup', () => {
            // Push the deletion to the very end of the Javascript event queue
            setTimeout(() => {
                if (this.executeDelete) {
                    this.executeDelete(entity.id);
                }
            }, 0);
        }, { once: true }); 
        
        return; 
    }

    if (entity.structureType) {
        const typeStr = entity.structureType.toLowerCase(); 
      
        appState.selection.focusedId = entity.id;
        appState.selection.focusedType = typeStr;
        appState.selection.notify?.(); 
    } 
    else if (entity.entityType === 'furniture' || entity.type === 'furniture') {
        if (typeof appState.selection.selectFurniture === 'function') {
            appState.selection.selectFurniture(entity.id);
        } else {
            appState.selection.focusedId = entity.id;
            appState.selection.focusedType = 'furniture';
            appState.selection.notify?.();
        }
    }
    else {
        appState.selection.selectDevice?.(entity.id, false);
    }
  }

_handleEntityChanged(en, dx = 0, dy = 0) {
    if (!en || !en.id) {
        appState.selection.notify();
        return;
    }

    const isDevice = en.interfaces !== undefined || en.catalogId !== undefined;
    const isFurniture = en?.type === 'furniture' || en?.entityType === 'furniture';
    const structuralId = this.entityIdMap.get(en.id) || en.id;
    const shapeObj = this._getStructuralObjectById(structuralId);

    // 1. Move/Bounds check for leaf entities (Devices/Furniture)
    const hasSavedPosition = en && en.savedPosition !== undefined;
    const moved = (dx !== 0 || dy !== 0) ||
      (hasSavedPosition && (en.x !== en.savedPosition.x || en.y !== en.savedPosition.y));

    if ((isDevice || isFurniture) && moved) {
        if (!this._isEntityWithinAssignedParentBounds(en)) {
            if (typeof en.restoreToSavedPosition === 'function') en.restoreToSavedPosition();
            this.layout?._render?.();
            appState.selection.notify?.();
            return;
        }
    }

    // 2. Structural Entity Change (Move or Resize)
    if (shapeObj && shapeObj.geometry) {
        const oldBounds = this._getShapeBounds(shapeObj);
        const oldX = Number(shapeObj.geometry.x);
        const oldY = Number(shapeObj.geometry.y);
        const newX = Number(en.x ?? oldX);
        const newY = Number(en.y ?? oldY);
        
        // Calculate shift in origin. This handles both normal moves and corner resizes.
        const effDx = newX - oldX;
        const effDy = newY - oldY;

        const nextWidth = Number(en.transform?.scale?.w ?? en.w ?? 0);
        const nextHeight = Number(en.transform?.scale?.h ?? en.h ?? 0);
        const currentWidth = Number(shapeObj.geometry.width ?? 0);
        const currentHeight = Number(shapeObj.geometry.height ?? 0);
        const isResize = (currentWidth !== nextWidth || currentHeight !== nextHeight);

        if (isResize || effDx !== 0 || effDy !== 0) {
            const nextBounds = {
                x: newX,
                y: newY,
                w: nextWidth,
                h: nextHeight
            };
            shapeObj.geometry.x = newX;
            shapeObj.geometry.y = newY;
            shapeObj.geometry.width = nextWidth;
            shapeObj.geometry.height = nextHeight;

            const shapeType = this._getStructuralTypeById(structuralId);

            if (shapeType && isResize) {
                this._scaleStructuralChildren(structuralId, shapeType, oldBounds, nextBounds);
            } else if (shapeType && (effDx !== 0 || effDy !== 0)) {
                // Propagate shift to children. skipParent is used because we just updated parent geometry.
                const success = this.applyStructuralMove(structuralId, shapeType, effDx, effDy, { 
                    skipCanvasMove: true,
                    skipParent: true
                });
                if (success) {
                    this._recordPendingMove(structuralId, { kind: 'structure', structureType: shapeType });
                }
            }
            appState.structural?.notify?.();
        }
    } 
    // 3. Direct Device/Furniture Move
    else if ((isDevice || isFurniture) && (dx !== 0 || dy !== 0)) {
        const entityId = structuralId || en.id;
        if (isDevice) {
            this.applyDeviceMove(entityId, dx, dy, { skipCanvasMove: true });
            this._recordPendingMove(entityId, { kind: 'device' });
        } else if (isFurniture) {
            const furniture = appState.furniture?.furnitures?.find(f => f.id === entityId);
            if (furniture) {
                furniture.transform = furniture.transform || { position: { x: 0, y: 0, z: 0 } };
                furniture.transform.position.x = Number(furniture.transform.position.x || 0) + dx;
                furniture.transform.position.y = Number(furniture.transform.position.y || 0) + dy;
                appState.furniture?.notify?.();
                this._recordPendingMove(entityId, { kind: 'device' });
            }
        }
    }

    appState.selection.notify();
  }
}

export default LogicalCanvasController;
