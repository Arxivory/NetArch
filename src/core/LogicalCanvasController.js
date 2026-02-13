// import appState from '../state/AppState.js';
// import LogicalLayout from '../core/layout/LogicalLayout.js';

// export class LogicalCanvasController {
//   constructor(container, opts = {}) {
//     this.layout = new LogicalLayout({
//       container,
//       width: opts.width || 800,
//       height: opts.height || 600,
//       gridSize: opts.gridSize || 32,
//       snap: opts.snap ?? true,
//       onRectangleCreated: (rect) => this._handleRectangleCreated(rect),
//       onWallCreated: (wall) => this._handleWallCreated(wall),
//       onCableCreated: (cable) => this._handleCableCreated(cable),
//       onCircleCreated: (circle) => this._handleCircleCreated(circle),
//       onPolygonCreated: (polygon) => this._handlePolygonCreated(polygon),
//       onDeviceAdded: (device) => this._handleDeviceAdded(device),
//       onEntitySelected: (entity) => this._handleEntitySelected(entity)
//     });

//     this.domainLabelIter = 0;
//     this.siteLabelIter = 0;
//     this.floorLabelIter = 0;
//     this.spaceLabelIter = 0;
//   }

//   destroy() {
//     if (this.layout) {
//       this.layout.destroy();
//       this.layout = null;
//     }
//   }

//   setSize(w, h) {
//     this.layout?.setSize(w, h);
//   }

//   setGridSize(size) {
//     this.layout?.setGridSize(size);
//   }

//   enableSnap(enabled) {
//     this.layout?.enableSnap(enabled);
//   }

//   startDrawRectangle(type = '') {
//     this.layout?.startDrawRectangle(type);
//   }

//   startDrawCircle(type = '') {
//     this.layout?.startDrawCircle(type);
//   }

//   startDrawWall() {
//     this.layout?.startDrawWall();
//   }

//   startDrawCable() {
//     this.layout?.startDrawCable();
//   }

//   startDrawPolygon(type = '') {
//     this.layout?.startDrawPolygon(type);
//   }

//   startSelect() {
//     this.layout?.startSelect();
//   }

//   startPan() {
//     this.layout?.startPan();
//   }

//   cancelDrawing() {
//     this.layout?.cancelDrawing();
//   }

//   addDevice(deviceData, x, y) {
//     this.layout?.addDevice(deviceData, x, y);
//   }

//   updateEntityTransform(id, updates) {
//     this.layout?.updateEntityTransform(id, updates);
//   }

//   getSnappedCoords(clientX, clientY) {
//     return this.layout?.getSnappedCanvasCoords(clientX, clientY);
//   }

//   clear() {
//     this.layout?.clear();
//   }

//   // ============= State Management Handlers =============

//   _handleRectangleCreated(rect) {
//     if (rect.structureType === 'Domain') {
//       appState.structural.addDomain({
//         id: rect.id,
//         label: `Domain ${this.domainLabelIter++}`,
//         shapeType: 'rectangle',
//         x: rect.x,
//         y: rect.y,
//         w: rect.w,
//         h: rect.h
//       });
//     } else if (rect.structureType === 'Site') {
//       const selection = appState.selection;

//       const selectedDomainId = selection.getFocusedId();
//       const selectedType = selection.focusedType;

//       if (!selectedDomainId || selectedType !== 'domain') {
//         console.warn('Site creation failed: A Domain must be selected in the hierarchy.');
//         return;
//       }

//       appState.structural.addSite({
//         id: rect.id,
//         label: `Site ${this.siteLabelIter++}`,
//         domainId: selectedDomainId,
//         shapeType: 'rectangle',
//         x: rect.x,
//         y: rect.y,
//         w: rect.w,
//         h: rect.h
//       });
//     } else if (rect.structureType === 'Space') {
//       // TODO: Get selected floor ID from appState.selection
//       const selectedFloorId = appState.selection?.getSelectedId?.() || null;
//       if (!selectedFloorId) {
//         console.warn('No floor selected for space creation');
//         return;
//       }
//       appState.structural.addSpace({
//         id: rect.id,
//         label: `Space ${rect.id}`,
//         floorId: selectedFloorId,
//         shapeType: 'rectangle',
//         x: rect.x,
//         y: rect.y,
//         w: rect.w,
//         h: rect.h
//       });
//     }
//   }

//   _handleWallCreated(wall) {
//     // Walls don't go in structural hierarchy, just stored in layout
//     // Could add to a separate store if needed
//   }

//   _handleCableCreated(cable) {
//     // Cables don't go in structural hierarchy, just stored in layout
//     // Could add to a separate store if needed
//   }

//   _handleCircleCreated(circle) {
//     if (circle.structureType === 'Domain') {
//       appState.structural.addDomain({
//         id: circle.id,
//         label: `Domain ${circle.id}`,
//         x: circle.x,
//         y: circle.y,
//         r: circle.r
//       });
//     } else if (circle.structureType === 'Site') {
//       const selectedDomainId = appState.selection?.getSelectedId?.() || null;
//       if (!selectedDomainId) {
//         console.warn('No domain selected for site creation');
//         return;
//       }
//       appState.structural.addSite({
//         id: circle.id,
//         label: `Site ${circle.id}`,
//         domainId: selectedDomainId,
//         x: circle.x,
//         y: circle.y,
//         r: circle.r
//       });
//     } else if (circle.structureType === 'Space') {
//       const selectedFloorId = appState.selection?.getSelectedId?.() || null;
//       if (!selectedFloorId) {
//         console.warn('No floor selected for space creation');
//         return;
//       }
//       appState.structural.addSpace({
//         id: circle.id,
//         label: `Space ${circle.id}`,
//         floorId: selectedFloorId,
//         x: circle.x,
//         y: circle.y,
//         r: circle.r
//       });
//     }
//   }

//   _handlePolygonCreated(polygon) {
//     if (polygon.structureType === 'Domain') {
//       appState.structural.addDomain({
//         id: polygon.id,
//         label: `Domain ${polygon.id}`,
//         shapeType: 'polygon',
//         x: polygon.x,
//         y: polygon.y,
//         points: polygon.points
//       });
//     } else if (polygon.structureType === 'Site') {
//       const selectedDomainId = appState.selection?.getSelectedId?.() || null;
//       if (!selectedDomainId) {
//         console.warn('No domain selected for site creation');
//         return;
//       }
//       appState.structural.addSite({
//         id: polygon.id,
//         label: `Site ${polygon.id}`,
//         shapeType: 'polygon',
//         x: polygon.x,
//         y: polygon.y,
//         domainId: selectedDomainId,
//         points: polygon.points
//       });
//     } else if (polygon.structureType === 'Space') {
//       const selectedFloorId = appState.selection?.getSelectedId?.() || null;
//       if (!selectedFloorId) {
//         console.warn('No floor selected for space creation');
//         return;
//       }
//       appState.structural.addSpace({
//         id: polygon.id,
//         label: `Space ${polygon.id}`,
//         shapeType: 'polygon',
//         x: polygon.x,
//         y: polygon.y,
//         floorId: selectedFloorId,
//         points: polygon.points
//       });
//     }
//   }

//   _handleDeviceAdded(device) {
//     // Device added - can be processed further if needed
//     // Add to network store or selection
//   }
  
//   _handleEntitySelected(entity) {
//     if (!entity || !entity.id) return;
//     appState.selection.selectDevice(entity.id, false); // false = don't multi-select
//   }

//   //we will call the appstate and push the data to the app state variables.
// }

// export default LogicalCanvasController;

import appState from '../state/AppState.js';
import LogicalLayout from '../core/layout/LogicalLayout.js';
import { createDeviceInstance } from '../data/deviceCatalog'; // Make sure this path matches your file structure
export class LogicalCanvasController {
  constructor(container, opts = {}) {
    // Label counters for auto-naming
    this.counters = {
      domain: 1,
      site: 1,
      floor: 1,
      space: 1
    };

    this.layout = new LogicalLayout({
      container,
      width: opts.width || 800,
      height: opts.height || 600,
      gridSize: opts.gridSize || 32,
      snap: opts.snap ?? true,
      
      // Wire up the events to our handlers
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
  // PUBLIC API (Called by Toolbar/React Components)
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
    // type = 'Domain', 'Site', 'Space'
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

  /**
   * Adds a network device to the canvas.
   * INTEGRATED: Uses deviceCatalog to create specific models.
   */
  addDevice(deviceData, x, y) {
    if (!this.layout) return;

    // 1. Get the specific model ID (e.g. "2960") or fallback to type ("Switch")
    const catalogId = deviceData.modelId || deviceData.type;

    try {
      // 2. Create the full simulation object using your Factory
      const newDevice = createDeviceInstance(catalogId, { x, y, z: 0 });

      // 3. Add to Visual Layout
      this.layout.addDevice({
        ...newDevice,
        label: newDevice.name
      }, x, y);

      // 4. Add to Application State (Simulation Logic)
      // Ensure appState.network exists and has addDevice
      if (appState.network && appState.network.addDevice) {
        appState.network.addDevice(newDevice);
      }

      console.log(`Created Device: ${newDevice.name} (${newDevice.catalogId})`);
    } catch (error) {
      console.error("Failed to add device:", error.message);
    }
  }

  updateEntityTransform(id, updates) {
    this.layout?.updateEntityTransform(id, updates);
  }

  // =========================================================
  // STATE MANAGEMENT HANDLERS (Internal)
  // =========================================================

  /**
   * Unified handler for Rectangles, Circles, and Polygons
   * Handles the hierarchy logic (Domain -> Site -> Space)
   */
  _handleShapeCreated(shapeData, shapeType) {
    const { structureType, id, x, y, w, h, r, points } = shapeData;

    // --- A. DOMAIN (Campus) ---
    if (structureType === 'Domain') {
      const domain = {
        id,
        label: `Campus ${this.counters.domain++}`,
        geometry: { type: shapeType, x, y, w, h, r, points }
      };
      appState.structural.addDomain(domain);
      console.log('Domain created:', domain.label);
    } 
    
    // --- B. SITE (Building) ---
    else if (structureType === 'Site') {
      // Logic: A Site must be placed inside a Domain
      const activeDomainId = appState.selection?.getFocusedId(); 
      // Fallback: If no selection, grab the first domain available
      const targetDomainId = activeDomainId || (appState.structural.domains && appState.structural.domains[0]?.id);

      if (!targetDomainId) {
        console.warn('Cannot create Site: No Domain (Campus) exists or is selected.');
        alert("Please create or select a Domain first.");
        return; 
      }

      const site = {
        id,
        domainId: targetDomainId,
        label: `Building ${this.counters.site++}`,
        geometry: { type: shapeType, x, y, w, h, r, points }
      };
      appState.structural.addSite(site);
      console.log('Site created inside Domain:', targetDomainId);
    } 
    
    // --- C. SPACE (Room) ---
    else if (structureType === 'Space') {
      // Logic: A Space must be placed inside a Floor
      // You need to track which floor is currently "active" (viewed)
      const activeFloorId = appState.ui?.activeFloorId || appState.selection?.getSelectedId?.(); 
      
      if (!activeFloorId) {
        console.warn('Cannot create Space: No Active Floor selected.');
        alert("Please select a Floor first.");
        return; 
      }

      const space = {
        id,
        floorId: activeFloorId,
        label: `Room ${this.counters.space++}`,
        geometry: { type: shapeType, x, y, w, h, r, points }
      };
      appState.structural.addSpace(space);
      console.log('Space created on Floor:', activeFloorId);
    }
  }

  _handleWallCreated(wallData) {
    // Walls belong to the Active Floor
    const activeFloorId = appState.ui?.activeFloorId;
    if (!activeFloorId) {
        console.warn("Cannot create wall: No active floor.");
        return;
    }

    const newWall = {
      id: wallData.id,
      floorId: activeFloorId,
      type: 'wall',
      subType: 'partition',
      geometry: {
        start: wallData.start,
        end: wallData.end,
        thickness: 0.2
      }
    };

    // Add to Structural State
    if (appState.structural.addFenestration) {
        appState.structural.addFenestration(activeFloorId, newWall);
    }
  }

  _handleCableCreated(cableData) {
    // cableData usually contains { sourceId, targetId } from the visual connection
    if (!cableData.sourceId || !cableData.targetId) return;

    // Add to Network State
    if (appState.network && appState.network.connectDevices) {
        appState.network.connectDevices(
            cableData.sourceId,
            cableData.targetId,
            cableData.cableType || 'ethernet'
        );
        console.log(`Cable created: ${cableData.sourceId} <-> ${cableData.targetId}`);
    }
  }

  _handleDeviceAdded(device) {
    this.addDevice(device, device.x, device.y);
  }
  
  _handleEntitySelected(entity) {
    if (!entity || !entity.id) {
        appState.selection.clearSelection();
        return;
    }
    appState.selection.selectDevice(entity.id, false);
  }
}
  export default LogicalCanvasController;