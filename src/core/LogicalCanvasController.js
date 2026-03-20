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
    // =========================================================

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
    const { structureType, id, x, y, w, h, r, points } = shapeData;

const removeInvalidShape = () => {

      setTimeout(() => {
        if (this.layout && typeof this.layout.removeShapeById === 'function') {
           this.layout.removeShapeById(id);
        }
      }, 10);
  
      if (appState.tools) {
          appState.tools.setActiveTool('pointer');
      }
    };

    if (structureType === 'Domain') {
      const data = {
        ...shapeData,
        label: `Domain ${this.counters.domain++}`,
      };
      console.log("Creating Domain:", data);
      appState.structural.addDomain(data);
    }

    else if (structureType === 'Site') {
      const selection = appState.selection;
      const selectedDomainId = selection.focusedType === 'domain' ? selection.focusedId : null;

      if (!selectedDomainId) {
        showErrorModal("A Domain must be selected from the Hierarchy panel before creating a Site.", "Invalid Hierarchy");
        removeInvalidShape(); 
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

    else if (structureType === 'Floor') {
      const selection = appState.selection;
      const selectedSiteId = selection.focusedType === 'site' ? selection.focusedId : null;

      if (!selectedSiteId) {
        showErrorModal("A Site must be selected from the Hierarchy panel before creating a Floor.", "Invalid Hierarchy");
        removeInvalidShape(); 
        return;
      }

      appState.structural.addFloor({
        id,
        siteId: selectedSiteId,
        label: `Floor ${this.counters.floor++}`,
        shapeType: shapeType,
        x, y, w, h, r, points
      });
      appState.ui.setActiveFloor(id);
    }
else if (structureType === 'Space') {
      const selection = appState.selection;
      const selectedFloorId = selection.focusedType === 'floor' ? selection.focusedId : null;
      
      if (!selectedFloorId) {
        showErrorModal("A Floor must be selected from the Hierarchy panel before creating a Space.", "Invalid Hierarchy");
        removeInvalidShape(); 
        return;
      }

      appState.structural.addSpace({
        id,
        floorId: selectedFloorId,
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
    //console.log("notified");
    appState.selection.notify();
  }
}

export default LogicalCanvasController;