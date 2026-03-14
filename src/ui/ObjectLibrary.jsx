// import {
//   Server,
//   Network,
//   Router,
//   Database,
//   Cable,
//   Wifi,
//   Armchair,
//   Import,
//   MonitorSmartphone
// } from "lucide-react";
// import appState from "../state/AppState";
// import { StartDrawCableCommand } from "../core/editor/DrawingCommands";

// const categoryDetails = {
//   Routers: { name: "Router", icon: Router },
//   Switches: { name: "Switch", icon: Server },
//   Cables: { name: "Cable", icon: Cable },
//   EndDevices: { name: "End Device", icon: MonitorSmartphone },
//   Wireless: { name: "Wireless", icon: Wifi },
//   Furniture: { name: "Furniture", icon: Armchair },
// };

// const categories = Object.keys(categoryDetails);

// export default function ObjectLibrary({ canvasController }) {
//   const handleDrawCable = () => {
//     if (!canvasController) return;
//     const cmd = new StartDrawCableCommand(canvasController, appState);
//     cmd.execute();
//   };

//   const onDragStart = (event, nodeType, label) => {
//     const data = { type: nodeType, label: label };
//     event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
//     event.dataTransfer.effectAllowed = "move";
//   };

//   return (
//     <div className="object-library">
//       <div className="panel-header-container">
//         <h3 className="panel-header-title">Object Library</h3>
//         <button className="import-btn" onClick={() => console.log("Import clicked")}>
//           <Import size={16} />
//           Import
//         </button>
//       </div>

//       <hr className="header-separator" />

//       {categories.map((cat) => {
//         const { name, icon: IconComponent } = categoryDetails[cat];
//         const isCable = name === "Cable";

//         return (
//           <div key={cat} className="device-category">
//             <p className="category-label">{cat}</p>
//             <div className="device-grid">
//               {Array(6).fill(null).map((_, i) => (
//                 <div
//                   key={i}
//                   draggable={!isCable}
//                   onDragStart={!isCable ? (event) => onDragStart(event, cat, name) : undefined}
//                   onClick={isCable ? handleDrawCable : undefined}
//                   className={`device-tile ${!isCable ? 'draggable-tile' : ''}`}
//                 >
//                   <div className="device-icon">
//                     <IconComponent size={32} />
//                   </div>
//                   <p className="device-type">{name}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

import React from "react";
import {createPortal} from "react-dom";
import {
  Server,
  Network, // Router icon usually
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
// 1. IMPORT YOUR CATALOG
import deviceCatalog from "../data/deviceCatalog"; // Adjust path as needed

const categoryDetails = {
  Routers: { 
    name: "Router", 
    icon: Router, 
    dataKey: "routers" // Maps to deviceCatalog.routers
  },
  Switches: { 
    name: "Switch", 
    icon: Server, 
    dataKey: "switches" // Maps to deviceCatalog.switches
  },
  EndDevices: { 
    name: "End Device", 
    icon: MonitorSmartphone, 
    dataKey: "endDevices" 
  },
  Cables: { 
    name: "Cable", 
    icon: Cable, 
    dataKey: "cables" 
  },
  // These don't exist in your catalog yet, so we handle them gracefully
  Wireless: { name: "Wireless", icon: Wifi, dataKey: null },
  Furniture: { name: "Furniture", icon: Armchair, dataKey: null },
};



const categories = Object.keys(categoryDetails);

export default function ObjectLibrary({ canvasController }) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [customDevices, setCustomDevices] = useState({
    routers: {},
    switches: {},
    endDevices: {},
    cables: {}
  });

  // Updated to accept specific cable type
  const handleDrawCable = (cableType) => {
    if (!canvasController) return;
    // You might want to pass cableType to the command later
    console.log("Selected cable:", cableType); 
    const cmd = new StartDrawCableCommand(canvasController, appState, cableType);
    cmd.execute();
  };

  /**
   * 2. UPDATED DRAG START
   * We now pass the specific 'modelId' (e.g., '2960') 
   * so the Canvas knows exactly what to create.
   */
  const onDragStart = (event, categoryName, device) => {
    const data = { 
      type: categoryName, // e.g., 'Switch' (matches your creation logic family)
      label: device.displayName,
      modelId: device.modelId, // CRITICAL: '2960', '1941', etc.
      catalogId: device.modelId // Redundant but useful if your create function needs it
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
        const { name, icon: IconComponent, dataKey } = categoryDetails[catKey];
        
        // 3. GET ACTUAL DATA
        // If dataKey exists, grab values from catalog. If not, empty array.
        const items = dataKey && deviceCatalog[dataKey] 
          ? Object.values(deviceCatalog[dataKey]) 
          : [];

        // If no items in this category, skip rendering (or show placeholder)
        if (items.length === 0) return null;

        const isCableCategory = catKey === "Cables";

        return (
          <div key={catKey} className="device-category">
            <p className="category-label">{catKey}</p>
            <div className="device-grid">
              
              {/* 4. DYNAMIC ITERATION */}
              {items.map((device) => (
                <div
                  key={device.modelId || device.id} // Cables use 'id', devices use 'modelId'
                  draggable={!isCableCategory}
                  onDragStart={
                    !isCableCategory 
                      ? (event) => onDragStart(event, name, device) 
                      : undefined
                  }
                  onClick={
                    isCableCategory 
                      ? () => handleDrawCable(device.id) 
                      : undefined
                  }
                  className={`device-tile ${!isCableCategory ? 'draggable-tile' : ''}`}
                  title={device.displayName || device.label} // Tooltip
                >

                  <div className="device-icon">
                    {/* You could eventually load device.model3D thumbnails here */}
                    <IconComponent size={32} style={{ color: device.visual?.color || 'inherit' }} />
                  </div>
                  
                  {/* Display the specific name: "Cisco 2960" */}
                  <p className="device-type">
                    {device.displayName || device.label}
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