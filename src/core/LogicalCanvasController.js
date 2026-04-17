import appState from '../state/AppState.js';
import LogicalLayout from '../core/layout/LogicalLayout.js';
import { createDeviceInstance } from '../data/deviceCatalog';
import { createFurnitureInstance } from '../data/furnitureCatalog';
import { validateConnection } from '../data/deviceCatalog';
import { validatePortSelection } from '../data/deviceCatalog';
import { showErrorModal } from '../util/ErrorHandling.js';

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
      onFreeformCreated: (freeform) => this._handleShapeCreated(freeform, 'freeform'),
      onWallCreated: (wall) => this._handleWallCreated(wall),
      onCableCreated: (cable) => this._handleCableCreated(cable),
      onDeviceAdded: (device) => this._handleDeviceAdded(device),
      onFurnitureAdded: (furniture) => this._handleFurnitureAdded(furniture),
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
  // =========================================================
  // PUBLIC API
  // =========================================================

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

    // 3. Try furniture (just in case!)
    if (deletedIds.length === 0 && appState.furniture && appState.furniture.removeFurniture) {
        appState.furniture.removeFurniture(idToDelete);
        deletedIds = [idToDelete];
    }

    // 4. Clear the visual objects from the canvas
    if (deletedIds.length > 0) {
        deletedIds.forEach(deletedId => {
            this.removeEntity(deletedId);
        });
        
        if (appState.selection && appState.selection.clearSelection) {
            appState.selection.clearSelection();
            appState.selection.notify?.();
        }
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

  setActiveFloor(floorId) {
    this.layout?.setActiveFloor(floorId);
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

        this.layout.addDevice({ ...newDevice }, x, y);

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

    // --- 4. SHAPE ROUTING ---
    if (structureType === 'Domain') {
      appState.structural.addDomain({
        ...shapeData, label: `Domain ${this.counters.domain++}`,
        x, y, w, h, maxX, maxY 
      });
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
      appState.structural.addSite({
        id, domainId: parentId, label: `Site ${this.counters.site++}`,
        shapeType, x, y, w, h, maxX, maxY, r, points 
      });
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
      appState.structural.addFloor({
        id, siteId: parentId, label: `Floor ${this.counters.floor++}`,
        shapeType, x, y, w, h, maxX, maxY, r, points 
      });
      appState.ui.setActiveFloor(id);
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
      appState.structural.addSpace({
        id, floorId: parentId, label: `Space ${this.counters.space++}`,
        shapeType, x, y, w, h, maxX, maxY, r, points 
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

  _handleDeviceAdded(device) {
    this.addDevice(device, device.x, device.y);
  }

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

  _handleEntityChanged(en) {
    appState.selection.notify();
  }
}

export default LogicalCanvasController;