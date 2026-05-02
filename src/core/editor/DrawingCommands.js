import { Command } from './Command.js';

/**
 * Base class for drawing tool commands (setup commands that don't change state)
 * These are tool activation commands, not structural entity creation
 */
export class DrawingCommand {
  constructor(controller, appState) {
    this.controller = controller;
    this.appState = appState;
  }

  execute() {
    throw new Error('execute() must be implemented');
  }

  undo() {
    // Most drawing commands don't need undo (tool activation)
  }
}

export class StartDrawRectangleCommand extends DrawingCommand {
  constructor(controller, appState, structureType = '') {
    super(controller, appState);
    this.structureType = structureType;
  }

  execute() {
    this.controller?.startDrawRectangle(this.structureType);
    this.appState.tools.setActiveTool('rectangle');
  }
}

export class StartDrawCircleCommand extends DrawingCommand {
  constructor(controller, appState, structureType = '') {
    super(controller, appState);
    this.structureType = structureType;
  }

  execute() {
    this.controller?.startDrawCircle(this.structureType);
    this.appState.tools.setActiveTool('circle');
  }
}

export class StartDrawWallCommand extends DrawingCommand {
  execute() {
    this.controller?.startDrawWall();
    this.appState.tools.setActiveTool('wall');
  }
}

export class StartDrawDoorCommand extends DrawingCommand {
  execute() {
    this.controller?.startDrawDoor();
    this.appState.tools.setActiveTool('door');
  }
}

export class StartDrawConduitCommand extends DrawingCommand {
  execute() {
    this.controller?.startDrawConduit();
    this.appState.tools.setActiveTool('conduit');
  }
}

export class StartDrawRiserCommand extends DrawingCommand {
  execute() {
    this.controller?.startDrawRiser();
    this.appState.tools.setActiveTool('riser');
  }
}

export class StartDrawWindowCommand extends DrawingCommand {
  execute() {
    this.controller?.startDrawWindow();
    this.appState.tools.setActiveTool('window');
  }
}

export class StartDrawCableCommand extends DrawingCommand {
  constructor(controller, appState, cableType = "straight") {
    super(controller, appState);
    this.cableType = cableType;
  }

  execute() {
    this.controller?.startDrawCable(this.cableType);
    this.appState.tools.setActiveTool('cable');
  }
}

export class StartDrawPolygonCommand extends DrawingCommand {
  constructor(controller, appState, structureType = '') {
    super(controller, appState);
    this.structureType = structureType;
  }

  execute() {
    this.controller?.startDrawPolygon(this.structureType);
    this.appState.tools.setActiveTool('polygon');
  }
}

export class StartDrawFreeformCommand extends DrawingCommand {
  constructor(controller, appState, structureType = '') {
    super(controller, appState);
    this.structureType = structureType;
  }
  
  execute() {
    this.controller?.startDrawFreeform(this.structureType);
    this.appState.tools.setActiveTool('freeform');
  }
}

export class StartSelectCommand extends DrawingCommand {
  execute() {
    this.controller?.startSelect();
    this.appState.tools.setActiveTool('select');
  }
}

export class StartPanCommand extends DrawingCommand {
  execute() {
    this.controller?.startPan();
    this.appState.tools.setActiveTool('pan');
  }
}

export class StartZoomInCommand extends DrawingCommand {
  execute() {
    this.appState.tools.setActiveTool('zoom');
    this.appState.ui.zoomIn();
    const zoom = this.appState.ui.getZoom();
    this.controller?._handleZoomSelected(zoom);
  }
}

export class StartZoomOutCommand extends DrawingCommand {
  execute() {
    this.appState.tools.setActiveTool('zoom');
    this.appState.ui.zoomOut();
    const zoom = this.appState.ui.getZoom();
    this.controller?._handleZoomSelected(zoom);
  }
}

export class CancelDrawingCommand extends DrawingCommand {
  execute() {
    this.controller?.cancelDrawing();
    this.appState.tools.clearActiveTool();
  }
}

export class AddDeviceCommand extends Command {
  constructor(appState, controller, deviceData, x, y, canvasId = null) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.deviceData = { ...deviceData };
    this.x = x;
    this.y = y;
    this.canvasId = canvasId || this.deviceData.id;
    this.description = `Added Device "${this.deviceData.label || this.deviceData.name || this.deviceData.type}"`;
    this.isRegistered = false;
  }

  execute() {
    const deviceId = this.deviceData.id || this.canvasId;
    const registerData = {
      ...this.deviceData,
      id: deviceId,
      position: {
        x: Number(this.deviceData.position?.x ?? this.x ?? 0),
        y: Number(this.deviceData.position?.y ?? this.y ?? 0),
        z: Number(this.deviceData.position?.z ?? 0)
      }
    };

    if (!this.isRegistered) {
      if (!this.appState.getDevice(deviceId)) {
        this.appState.network.addDevice(registerData);
      }

      this.controller?.entityIdMap?.set(this.canvasId, deviceId);
      this.controller?.structuralToCanvasMap?.set(deviceId, this.canvasId);

      if (this.controller?.physicalController) {
        this.controller.physicalController.createDeviceGLTFMesh(registerData);
      }

      this.isRegistered = true;
      return;
    }

    if (!this.appState.getDevice(deviceId)) {
      this.appState.network.addDevice(registerData);
    }

    if (this.controller && typeof this.controller.restoreCanvasDevice === 'function') {
      const existingCanvas = this.controller.layout?.findEntityById(this.canvasId);
      if (!existingCanvas) {
        this.controller.restoreCanvasDevice(registerData, this.canvasId, this.x, this.y);
      }
    }

    this.controller?.entityIdMap?.set(this.canvasId, deviceId);
    this.controller?.structuralToCanvasMap?.set(deviceId, this.canvasId);
  }

  undo() {
    if (!this.deviceData || !this.canvasId) return;

    this.appState.removeDevice(this.canvasId);
    this.controller?.removeEntity(this.canvasId);
    this.controller?.entityIdMap?.delete(this.canvasId);
    this.controller?.structuralToCanvasMap?.delete(this.canvasId);
  }

  redo() {
    this.execute();
  }
}

export class UpdateEntityTransformCommand extends DrawingCommand {
  constructor(controller, appState, entityId, updates) {
    super(controller, appState);
    this.entityId = entityId;
    this.updates = updates;
  }

  execute() {
    const success = this.controller?.updateEntityTransform(this.entityId, this.updates);
    return success;
  }
}

export class SetGridSizeCommand extends DrawingCommand {
  constructor(controller, appState, size) {
    super(controller, appState);
    this.size = size;
  }

  execute() {
    this.controller?.setGridSize(this.size);
  }
}

export class SetSnapCommand extends DrawingCommand {
  constructor(controller, appState, enabled) {
    super(controller, appState);
    this.enabled = enabled;
  }

  execute() {
    this.controller?.enableSnap(this.enabled);
  }
}

// =========================================================
// COMMAND IMPLEMENTATIONS FOR UNDO/REDO
// =========================================================
// These commands use the Command base class and implement both
// execute() and undo() for logical mode 2D operations

/**
 * CreateDomainCommand - Creates a new Domain
 * Undo: removes the domain and its children
 */
export class CreateDomainCommand extends Command {
  constructor(appState, controller, domainData, canvasId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.domainData = { ...domainData };
    this.canvasId = canvasId;
    this.description = `Created Domain "${this.domainData.label}"`;
    this.createdDomain = null;
  }

  execute() {
    if (this.createdDomain) {
      // Redo case: domain was already created
      if (!this.appState.structural.domains.some(d => d.id === this.createdDomain.id)) {
        this.appState.structural.domains.push(this.createdDomain);
        this.appState.structural.notify();
      }
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(this.createdDomain, this.canvasId);
      }
      if (this.createdDomain && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdDomain.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdDomain.id);
      }
    } else {
      // First execution: create the domain
      this.createdDomain = this.appState.structural.addDomain(this.domainData);
      if (this.createdDomain && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdDomain.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdDomain.id);
      }
    }
  }

  undo() {
    if (this.createdDomain) {
      const deletedIds = this.appState.structural.removeDomain(this.createdDomain.id);
      if (deletedIds && Array.isArray(deletedIds)) {
        deletedIds.forEach(id => {
          this.controller?.removeEntity(id);
        });
      }
      if (this.canvasId) {
        this.controller?.structuralToCanvasMap?.delete(this.createdDomain.id);
        this.controller?.entityIdMap?.delete(this.canvasId);
      }
    }
  }

  getDescription() {
    return this.description;
  }
}

/**
 * CreateSiteCommand - Creates a new Site within a Domain
 * Undo: removes the site and its children
 */
export class CreateSiteCommand extends Command {
  constructor(appState, controller, siteData, domainId, canvasId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.siteData = { ...siteData, domainId };
    this.canvasId = canvasId;
    this.description = `Created Site "${this.siteData.label}"`;
    this.createdSite = null;
  }

  execute() {
    if (this.createdSite) {
      // Redo case: site was already created
      if (!this.appState.structural.sites.some(s => s.id === this.createdSite.id)) {
        this.appState.structural.sites.push(this.createdSite);
        this.appState.structural.notify();
      }
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(this.createdSite, this.canvasId);
      }
      if (this.createdSite && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdSite.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdSite.id);
      }
    } else {
      // First execution: create the site
      this.createdSite = this.appState.structural.addSite(this.siteData);
      if (this.createdSite && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdSite.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdSite.id);
      }
    }
  }

  undo() {
    if (this.createdSite) {
      const deletedIds = this.appState.structural.removeSite(this.createdSite.id);
      if (deletedIds && Array.isArray(deletedIds)) {
        deletedIds.forEach(id => {
          this.controller?.removeEntity(id);
        });
      }
      if (this.canvasId) {
        this.controller?.structuralToCanvasMap?.delete(this.createdSite.id);
        this.controller?.entityIdMap?.delete(this.canvasId);
      }
    }
  }

  getDescription() {
    return this.description;
  }
}

/**
 * CreateFloorCommand - Creates a new Floor within a Site
 * Undo: removes the floor and its children
 */
export class CreateFloorCommand extends Command {
  constructor(appState, controller, floorData, siteId, canvasId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.floorData = { ...floorData, siteId };
    this.canvasId = canvasId;
    this.description = `Created Floor "${this.floorData.label}"`;
    this.createdFloor = null;
  }

  execute() {
    if (this.createdFloor) {
      // Redo case: floor was already created
      if (!this.appState.structural.floors.some(f => f.id === this.createdFloor.id)) {
        this.appState.structural.floors.push(this.createdFloor);
        this.appState.structural.notify();
      }
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(this.createdFloor, this.canvasId);
      }
      if (this.createdFloor) {
        this.appState.ui.setActiveFloor(this.createdFloor.id);
      }
      if (this.createdFloor && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdFloor.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdFloor.id);
      }
    } else {
      // First execution: create the floor
      this.createdFloor = this.appState.structural.addFloor(this.floorData);
      if (this.createdFloor) {
        this.appState.ui.setActiveFloor(this.createdFloor.id);
      }
      if (this.createdFloor && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdFloor.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdFloor.id);
      }
    }
  }

  undo() {
    if (this.createdFloor) {
      const deletedIds = this.appState.structural.removeFloor(this.createdFloor.id);
      if (deletedIds && Array.isArray(deletedIds)) {
        deletedIds.forEach(id => {
          this.controller?.removeEntity(id);
        });
      }
      if (this.canvasId) {
        this.controller?.structuralToCanvasMap?.delete(this.createdFloor.id);
        this.controller?.entityIdMap?.delete(this.canvasId);
      }
    }
  }

  getDescription() {
    return this.description;
  }
}

/**
 * CreateSpaceCommand - Creates a new Space within a Floor
 * Undo: removes the space
 */
export class CreateSpaceCommand extends Command {
  constructor(appState, controller, spaceData, floorId, canvasId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.spaceData = { ...spaceData, floorId };
    this.canvasId = canvasId;
    this.description = `Created Space "${this.spaceData.label}"`;
    this.createdSpace = null;
  }

  execute() {
    if (this.createdSpace) {
      // Redo case: space was already created
      if (!this.appState.structural.spaces.some(s => s.id === this.createdSpace.id)) {
        this.appState.structural.spaces.push(this.createdSpace);
        this.appState.structural.notify();
      }
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(this.createdSpace, this.canvasId);
      }
      if (this.createdSpace && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdSpace.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdSpace.id);
      }
    } else {
      // First execution: create the space
      this.createdSpace = this.appState.structural.addSpace(this.spaceData);
      if (this.createdSpace && this.canvasId) {
        this.controller?.structuralToCanvasMap?.set(this.createdSpace.id, this.canvasId);
        this.controller?.entityIdMap?.set(this.canvasId, this.createdSpace.id);
      }
    }
  }

  undo() {
    if (this.createdSpace) {
      const deletedIds = this.appState.structural.removeSpace(this.createdSpace.id);
      if (deletedIds && Array.isArray(deletedIds)) {
        deletedIds.forEach(id => {
          this.controller?.removeEntity(id);
        });
      }
      if (this.canvasId) {
        this.controller?.structuralToCanvasMap?.delete(this.createdSpace.id);
        this.controller?.entityIdMap?.delete(this.canvasId);
      }
    }
  }

  getDescription() {
    return this.description;
  }
}

/**
 * MoveCommand - Moves a structural entity (Domain, Site, Floor, Space)
 * Handles cascading movement of children
 */
export class RemoveDeviceCommand extends Command {
  constructor(appState, controller, deviceId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.deviceId = deviceId;
    this.description = `Removed Device ${deviceId}`;
    this.deviceBackup = null;
  }

  execute() {
    const device = this.appState.getDevice(this.deviceId);
    if (!device) {
      return;
    }

    this.deviceBackup = JSON.parse(JSON.stringify(device));
    this.appState.removeDevice(this.deviceId);
    this.controller?.removeEntity(this.deviceId);
  }

  undo() {
    if (!this.deviceBackup) {
      return;
    }

    if (!this.appState.getDevice(this.deviceId)) {
      this.appState.network.addDevice(this.deviceBackup);
    }

    if (this.controller?.restoreCanvasDevice) {
      this.controller.restoreCanvasDevice(this.deviceBackup, this.deviceId, this.deviceBackup.position?.x, this.deviceBackup.position?.y);
    }
  }

  redo() {
    this.execute();
  }
}

export class MoveCommand extends Command {
  constructor(appState, controller, entityId, kind, structureType, dx, dy) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.entityId = entityId;
    this.kind = kind; // 'structure' or 'device'
    this.structureType = structureType; // 'domain', 'site', 'floor', 'space' or null for devices
    this.dx = dx;
    this.dy = dy;
    this.description = kind === 'device' ? `Moved Device` : `Moved ${structureType}`;
  }

  execute() {
    // Move is already applied on the canvas and state during user drag.
    // This method is intentionally left blank for the initial execution.
  }

  undo() {
    if (this.kind === 'device') {
      this.controller?.applyDeviceMove(this.entityId, -this.dx, -this.dy);
      return;
    }

    this.controller?.applyStructuralMove(this.entityId, this.structureType, -this.dx, -this.dy, { skipBounds: true });
  }

  redo() {
    if (this.kind === 'device') {
      this.controller?.applyDeviceMove(this.entityId, this.dx, this.dy);
      return;
    }

    this.controller?.applyStructuralMove(this.entityId, this.structureType, this.dx, this.dy, { skipBounds: true });
  }

  getDescription() {
    return this.description;
  }
}

/**
 * RemoveDomainCommand - Removes a Domain and its children
 * Undo: restores the domain and its children
 */
export class RemoveDomainCommand extends Command {
  constructor(appState, controller, domainId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.domainId = domainId;
    this.description = `Removed Domain`;
    this.backup = null;
  }

  execute() {
    const domain = this.appState.structural.getDomain(this.domainId);
    if (!domain) return;

    // Backup all related data
    this.backup = {
      domain: JSON.parse(JSON.stringify(domain)),
      sites: this.appState.structural.sites.filter(s => s.domainId === this.domainId).map(s => JSON.parse(JSON.stringify(s))),
      floors: this.appState.structural.floors.filter(f => this.appState.structural.sites.some(s => s.id === f.siteId && s.domainId === this.domainId)).map(f => JSON.parse(JSON.stringify(f))),
      spaces: this.appState.structural.spaces.filter(sp => this.appState.structural.floors.some(f => f.id === sp.floorId && this.appState.structural.sites.some(s => s.id === f.siteId && s.domainId === this.domainId))).map(sp => JSON.parse(JSON.stringify(sp)))
    };

    // Remove from state and canvas
    const deletedIds = this.appState.structural.removeDomain(this.domainId);
    if (deletedIds && Array.isArray(deletedIds)) {
      deletedIds.forEach(id => {
        this.controller?.removeEntity(id);
      });
    }
  }

  undo() {
    if (!this.backup) return;

    // Restore in order: domain, sites, floors, spaces
    this.appState.structural.addDomain(this.backup.domain);
    this.backup.sites.forEach(site => this.appState.structural.addSite(site));
    this.backup.floors.forEach(floor => this.appState.structural.addFloor(floor));
    this.backup.spaces.forEach(space => this.appState.structural.addSpace(space));

    // Restore to canvas
    if (this.controller?.restoreCanvasShape) {
      this.controller.restoreCanvasShape(this.backup.domain, this.controller.structuralToCanvasMap.get(this.domainId));
    }
    this.backup.sites.forEach(site => {
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(site, this.controller.structuralToCanvasMap.get(site.id));
      }
    });
    this.backup.floors.forEach(floor => {
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(floor, this.controller.structuralToCanvasMap.get(floor.id));
      }
    });
    this.backup.spaces.forEach(space => {
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(space, this.controller.structuralToCanvasMap.get(space.id));
      }
    });
  }

  redo() {
    this.execute();
  }

  getDescription() {
    return this.description;
  }
}

/**
 * RemoveSiteCommand - Removes a Site and its children
 * Undo: restores the site and its children
 */
export class RemoveSiteCommand extends Command {
  constructor(appState, controller, siteId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.siteId = siteId;
    this.description = `Removed Site`;
    this.backup = null;
  }

  execute() {
    const site = this.appState.structural.sites.find(s => s.id === this.siteId);
    if (!site) return;

    // Backup all related data
    this.backup = {
      site: JSON.parse(JSON.stringify(site)),
      floors: this.appState.structural.floors.filter(f => f.siteId === this.siteId).map(f => JSON.parse(JSON.stringify(f))),
      spaces: this.appState.structural.spaces.filter(sp => this.appState.structural.floors.some(f => f.id === sp.floorId && f.siteId === this.siteId)).map(sp => JSON.parse(JSON.stringify(sp)))
    };

    // Remove from state and canvas
    const deletedIds = this.appState.structural.removeSite(this.siteId);
    if (deletedIds && Array.isArray(deletedIds)) {
      deletedIds.forEach(id => {
        this.controller?.removeEntity(id);
      });
    }
  }

  undo() {
    if (!this.backup) return;

    // Restore in order: site, floors, spaces
    this.appState.structural.addSite(this.backup.site);
    this.backup.floors.forEach(floor => this.appState.structural.addFloor(floor));
    this.backup.spaces.forEach(space => this.appState.structural.addSpace(space));

    // Restore to canvas
    if (this.controller?.restoreCanvasShape) {
      this.controller.restoreCanvasShape(this.backup.site, this.controller.structuralToCanvasMap.get(this.siteId));
    }
    this.backup.floors.forEach(floor => {
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(floor, this.controller.structuralToCanvasMap.get(floor.id));
      }
    });
    this.backup.spaces.forEach(space => {
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(space, this.controller.structuralToCanvasMap.get(space.id));
      }
    });
  }

  redo() {
    this.execute();
  }

  getDescription() {
    return this.description;
  }
}

/**
 * RemoveFloorCommand - Removes a Floor and its children
 * Undo: restores the floor and its children
 */
export class RemoveFloorCommand extends Command {
  constructor(appState, controller, floorId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.floorId = floorId;
    this.description = `Removed Floor`;
    this.backup = null;
  }

  execute() {
    const floor = this.appState.structural.floors.find(f => f.id === this.floorId);
    if (!floor) return;

    // Backup all related data
    this.backup = {
      floor: JSON.parse(JSON.stringify(floor)),
      spaces: this.appState.structural.spaces.filter(sp => sp.floorId === this.floorId).map(sp => JSON.parse(JSON.stringify(sp)))
    };

    // Remove from state and canvas
    const deletedIds = this.appState.structural.removeFloor(this.floorId);
    if (deletedIds && Array.isArray(deletedIds)) {
      deletedIds.forEach(id => {
        this.controller?.removeEntity(id);
      });
    }
  }

  undo() {
    if (!this.backup) return;

    // Restore in order: floor, spaces
    this.appState.structural.addFloor(this.backup.floor);
    this.backup.spaces.forEach(space => this.appState.structural.addSpace(space));

    // Restore to canvas
    if (this.controller?.restoreCanvasShape) {
      this.controller.restoreCanvasShape(this.backup.floor, this.controller.structuralToCanvasMap.get(this.floorId));
    }
    this.backup.spaces.forEach(space => {
      if (this.controller?.restoreCanvasShape) {
        this.controller.restoreCanvasShape(space, this.controller.structuralToCanvasMap.get(space.id));
      }
    });
  }

  redo() {
    this.execute();
  }

  getDescription() {
    return this.description;
  }
}

/**
 * RemoveSpaceCommand - Removes a Space
 * Undo: restores the space
 */
export class RemoveSpaceCommand extends Command {
  constructor(appState, controller, spaceId) {
    super();
    this.appState = appState;
    this.controller = controller;
    this.spaceId = spaceId;
    this.description = `Removed Space`;
    this.backup = null;
  }

  execute() {
    const space = this.appState.structural.spaces.find(s => s.id === this.spaceId);
    if (!space) return;

    // Backup data
    this.backup = JSON.parse(JSON.stringify(space));

    // Remove from state and canvas
    const deletedIds = this.appState.structural.removeSpace(this.spaceId);
    if (deletedIds && Array.isArray(deletedIds)) {
      deletedIds.forEach(id => {
        this.controller?.removeEntity(id);
      });
    }
  }

  undo() {
    if (!this.backup) return;

    // Restore
    this.appState.structural.addSpace(this.backup);

    // Restore to canvas
    if (this.controller?.restoreCanvasShape) {
      this.controller.restoreCanvasShape(this.backup, this.controller.structuralToCanvasMap.get(this.spaceId));
    }
  }

  redo() {
    this.execute();
  }

  getDescription() {
    return this.description;
  }
}

export default DrawingCommand;
