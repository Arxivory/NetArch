import React from "react";
import {
  Server,
  Network,
  Router,
  Database,
  Cable,
  Wifi,
  Armchair,
  Import,
  MonitorSmartphone,
  Cpu
} from "lucide-react";
import appState from "../state/AppState";
import { StartDrawCableCommand } from "../core/editor/DrawingCommands";

// 1. IMPORT YOUR CATALOGS
import deviceCatalog from "../data/deviceCatalog"; 
import furnitureCatalog from "../data/furnitureCatalog"; 

// 2. MAP CATALOGS AND ENTITY TYPES
const categoryDetails = {
  Routers: { 
    name: "Router", 
    icon: Router, 
    dataKey: "routers",
    catalog: deviceCatalog,
    entityType: "device"
  },
  Switches: { 
    name: "Switch", 
    icon: Server, 
    dataKey: "switches",
    catalog: deviceCatalog,
    entityType: "device"
  },
  EndDevices: { 
    name: "End Device", 
    icon: MonitorSmartphone, 
    dataKey: "endDevices",
    catalog: deviceCatalog,
    entityType: "device"
  },
  Cables: { 
    name: "Cable", 
    icon: Cable, 
    dataKey: "cables",
    catalog: deviceCatalog,
    entityType: "cable"
  },
  Furniture: { 
    name: "Furniture", 
    icon: Armchair, 
    dataKey: "furnitures",
    catalog: furnitureCatalog,
    entityType: "furniture"
  },
};

const categories = Object.keys(categoryDetails);

export default function ObjectLibrary({ canvasController }) {

const handleDrawCable = (cableType) => {
    if (!canvasController) return;
    console.log("Selected cable:", cableType); 

    appState.ui.selectedCable = cableType; 

    const cmd = new StartDrawCableCommand(canvasController, appState, cableType);
    cmd.execute();
  };

  // 3. ADD ENTITY TYPE TO DRAG DATA
  const onDragStart = (event, categoryName, item, entityType) => {
    const data = { 
      type: categoryName, 
      label: item.displayName || item.label || item.name,
      modelId: item.modelId || item.id, 
      catalogId: item.modelId || item.id, 
      entityType: entityType // 'device' OR 'furniture'
    };
    
    event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="object-library">
      <div className="panel-header-container">
        <h3 className="panel-header-title">Object Library</h3>
        <button className="import-btn" onClick={() => console.log("Import clicked")}>
          <Import size={16} />
          Import
        </button>
      </div>

      <hr className="header-separator" />

      {categories.map((catKey) => {
        const { name, icon: IconComponent, dataKey, catalog, entityType } = categoryDetails[catKey];
        
        // 4. DYNAMICALLY PULL FROM THE CORRECT CATALOG
        // If it's furniture, it uses furnitureCatalog. If a device, deviceCatalog.
        let items = [];
        if (catalog) {
            // Check if the catalog is structured with dataKeys (like deviceCatalog.switches)
            if (dataKey && catalog[dataKey]) {
                items = Object.values(catalog[dataKey]);
            } 
            // Fallback in case furnitureCatalog is just a flat list of items
            else if (entityType === "furniture") {
                items = Object.values(catalog); 
            }
        }

        if (items.length === 0) return null;

        const isCableCategory = entityType === "cable";

        return (
          <div key={catKey} className="device-category">
            <p className="category-label">{catKey}</p>
            <div className="device-grid">
              
              {items.map((item) => (
                <div
                  key={item.modelId || item.id} 
                  draggable={!isCableCategory}
                  onDragStart={
                    !isCableCategory 
                      ? (event) => onDragStart(event, name, item, entityType)
                      : undefined
                  }
                  onClick={
                    isCableCategory 
                      ? () => handleDrawCable(item.id) 
                      : undefined
                  }
                  className={`device-tile ${!isCableCategory ? 'draggable-tile' : ''}`}
                  title={item.displayName || item.label} 
                >
                  <div className="device-icon">
                    <IconComponent size={32} style={{ color: item.visual?.color || 'inherit' }} />
                  </div>
                  
                  <p className="device-type">
                    {item.displayName || item.label || item.name}
                  </p>
                </div>
              ))}

            </div>
          </div>
        );
      })}
    </div>
  );
}