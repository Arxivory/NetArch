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
import React, {useState, useRef, useEffect} from "react";
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
    dataKey: "furnitures", // Make sure your furnitureCatalog exports an object with this key!
    catalog: furnitureCatalog,
    entityType: "furniture" // <--- This will tell the canvas what to do!
  },
};

const categories = Object.keys(categoryDetails);

export default function ObjectLibrary({ canvasController }) {
  const [showImportModal, setshowImportModal] = useState(false);
  const [importErro, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [customDevices, setCustomDevices] = useState({
    routers: {},
    switches: {},
    endDevices: {},
    cables: {}
  });

  const fileInputRef = useRef(null);

  useEffect (() => {
    if (showImportModal ) {
      document.body.style.overflow = "hidden";

    } else  {
      document.body.style.overflow = "unset"; 
    }

  }, [showImportModal]);

  const handleDrawCable = (cableType) => {
    if (!canvasController) return;
    console.log("Selected cable:", cableType); 
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

  const parseModelFilename = (filename) => {
    const nameWithoutExt = filename.replace(/\.(obj|glb|fbx|)$/i, '');
    const parts = nameWithoutExt.toLoweCase().split(/[_-]+/);
    let vendor = "Unknown";
    let family = "endDevice";
    let modelId = nameWithoutExt;

    if (parts.length >= 3) {
      vendor = parts [0].charAt(0).toUpperCase() + parts[0].slice(1);
      family = parts [1];
      modelId = parts.slice(2).join('-');

    }

    const familyMap = {
      'switch': 'switches',
      'router': 'routers',
      'host': 'endDevices',
      'server': 'endDevices',
      'endDevice': 'endDevices',

    };

    const targetKey = familyMap[family] || 'endDevices';

    return  {
      device: {
        modelId: modelId.toUpperCase(),
        displayName: nameWithoutExt.replace(/[_-]+/g, ' ').toUpperCase(),
        family: family,
        vendor,
        model3D: `/models/${filename}`
      },
      targetKey
    };
  };

  const processFile = (file) => {
    if (!file) return;
    const validExtensions = ['obj', 'glb', 'fbx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setImportError (`Unsupported file type: ${fileExt}. Please upload .obj, .glb, or .fbx files.`);
      return;
    }

    const { device, targetKey } = parseModelFilename(file.name);
    setCustomDevices(prev => ({
      ...prev,
      [targetKey]: {
        ...prev[targetKey],
        [device.modelId]: device
      }
    }));

    setImportSuccess(`Successfully imported ${device.displayName} as a ${targetKey.slice(0, -1)}.`);
    setTimeout(() => {
      setshowImportModal(false);
      setImportSuccess(null);

    }, 3000);

  };

  const ModalPortal = () => {
    return createPortal(
      <div className="import-modal-overlay" onClick={() => setShowImportModal(false)}>
        <div className="import-modal" onClick={(e) => e.stopPropagation()}>
          <div className="import-modal-header">
            <button className="close-btn" onClick={() => setShowImportModal(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="import-modal-content">
            {importError && <div className="import-alert error">{importError}</div>}
            {importSuccess && <div className="import-alert success">{importSuccess}</div>}

            <div 
              className="import-drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); processFile(e.dataTransfer.files[0]); }}
            >
              
              <label className="import-file-label">
                <h1>Import Devices</h1>
                <input type="file" onChange={(e) => processFile(e.target.files[0])} hidden />
              </label>
            </div>

            <div className="import-format-info">
              <p><strong>Supported:</strong> .obj, .glb, .fbx</p>
              <pre className="format-example">vendor-family-model.obj</pre>
            </div>
          </div>
        </div>
      </div>,
      document.body // This pushes it to the end of the body tag
    );
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
                      ? (event) => onDragStart(event, name, item, entityType) // Pass entityType here!
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