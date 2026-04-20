import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Server,
  Router,
  Cable,
  Wifi,
  Armchair,
  Import,
  MonitorSmartphone,
  Cpu,
  X,
  TriangleAlert
} from "lucide-react";
import appState from "../state/AppState";
import { StartDrawCableCommand } from "../core/editor/DrawingCommands";
import deviceCatalog, { registerImportedDevice } from "../data/deviceCatalog";

// 1. DATA SOURCES
import furnitureCatalog from "../data/furnitureCatalog";
import { showErrorModal } from "../util/ErrorHandling";

// 2. ICON MAPPING FOR DYNAMIC ICONS
const ICON_MAP = {
  router: Router,
  switch: Server,
  wifi: Wifi,
  ap: Wifi,
  wireless: Wifi,
  host: MonitorSmartphone,
  pc: MonitorSmartphone,
  laptop: MonitorSmartphone,
  server: Server,
  cable: Cable,
  furniture: Armchair,
  chair: Armchair,
  table: Armchair,
};

const categoryDetails = {
  Routers: { name: "Router", icon: Router, dataKey: "routers", catalog: deviceCatalog, entityType: "device" },
  Switches: { name: "Switch", icon: Server, dataKey: "switches", catalog: deviceCatalog, entityType: "device" },
  EndDevices: { name: "End Device", icon: MonitorSmartphone, dataKey: "endDevices", catalog: deviceCatalog, entityType: "device" },
  Cables: { name: "Cable", icon: Cable, dataKey: "cables", catalog: deviceCatalog, entityType: "cable" },
  Furniture: { name: "Furniture", icon: Armchair, dataKey: "furnitures", catalog: furnitureCatalog, entityType: "furniture" },
};

export default function ObjectLibrary({ canvasController }) {
  const [showImportModal, setshowImportModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  
  // State for imported devices - clearly separated from catalog
  const [importedItems, setImportedItems] = useState([]);

  useEffect(() => {
    document.body.style.overflow = (showImportModal || errorModal.show) ? "hidden" : "unset";
  }, [showImportModal, errorModal]);

  const showErrorModal = (message) => {
    setErrorModal({ show: true, message });
  };

  const handleDrawCable = (cableId) => {
    if (!canvasController) return;
    appState.ui.selectedCable = cableId;
    const cmd = new StartDrawCableCommand(canvasController, appState, cableId);
    cmd.execute();
  };

  const onDragStart = (event, categoryName, item, entityType, isImported = false) => {
    const data = { 
      type: categoryName, 
      label: item.displayName || item.label || item.name,
      modelId: item.modelId || item.id, 
      catalogId: item.modelId || item.id, 
      entityType: entityType,
      isImported: isImported
    };
    event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  const processFile = (file) => {
    if (!file) return;
    const validExtensions = ['.obj', '.glb', '.fbx'];
    const filename = file.name.toLowerCase();
    const fileExt = '.' + filename.split('.').pop();

    if (!validExtensions.includes(fileExt)) {
      setshowImportModal(false); 
      showErrorModal("The selected object is not supported for placement yet. Please import a supported device model and try again.");
      return;
    }

    // Determine icon based on filename
    let SelectedIcon = Cpu;
    for (const [keyword, iconComponent] of Object.entries(ICON_MAP)) {
      if (filename.includes(keyword)) {
        SelectedIcon = iconComponent;
        break;
      }
    }

    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const newItem = {
      modelId: `imported-${Date.now()}`,
      displayName: nameWithoutExt.toUpperCase(),
      family: "imported",
      model3D: URL.createObjectURL(file),
      sourceExtension: fileExt.slice(1),
      icon: SelectedIcon
    };

    try {
      registerImportedDevice(newItem);
    } catch (err) {
      console.error("Failed to register imported device:", err);
      showErrorModal("Failed to register imported device. Please try again.");
      return;
    }

    setImportedItems(prev => [...prev, newItem]);
    setImportSuccess(`Successfully registered ${newItem.displayName}.`);
    
    setTimeout(() => {
      setshowImportModal(false);
      setImportSuccess(null);
    }, 1500);
  };

  const ModalPortal = () => {
    return createPortal(
      <div className="import-modal-overlay" onClick={() => setshowImportModal(false)}>
        <div className="import-modal" onClick={(e) => e.stopPropagation()}>
          <div className="import-modal-header">
            <button className="close-btn" onClick={() => setshowImportModal(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="import-modal-content">
            {importError && <div className="import-alert error-container">{importError}</div>}
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
      document.body
    );
  };

  const ErrorModal = () => {
    return createPortal(
      <div className="import-modal-overlay">
        <div className="import-modal error-style">
          <div className="import-modal-content">
            <div className="error-header">
              <TriangleAlert className="warning-icon" size={24} color="#f59e0b" />
              <h2>Unsupported Object</h2>
            </div>
            <p className="error-description">{errorModal.message}</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={() => setErrorModal({ show: false, message: "" })}>
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="object-library">
      <div className="panel-header-container">
        <h3 className="panel-header-title">Object Library</h3>
        <button className="import-btn" onClick={() => setshowImportModal(true)}>
          <Import size={16} />
          Import
        </button>
      </div>

      <hr className="header-separator" /> 
      
      <div className="library-scroll-area">
        {/* 1. DEDICATED IMPORTED CATEGORY (BEFORE ROUTERS) */}
        {importedItems.length > 0 && (
          <div className="device-category imported-section">
            <p className="category-label">Imported Devices</p>
            <div className="device-grid">
              {importedItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.modelId}
                    draggable
                    onDragStart={(e) => onDragStart(e, "Imported", item, "device", true)}
                    className="device-tile draggable-tile imported-tile"
                  >
                    <div className="device-icon">
                      <ItemIcon size={32} />
                    </div>
                    <p className="device-type">{item.displayName}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. CATALOG CATEGORIES */}
        {Object.keys(categoryDetails).map((catKey) => {
          const { name, icon: IconComponent, dataKey, catalog, entityType } = categoryDetails[catKey];
          const items = dataKey && catalog[dataKey] ? Object.values(catalog[dataKey]) : [];

          if (items.length === 0) return null;

          return (
            <div key={catKey} className="device-category">
              <p className="category-label">{catKey}</p>
              <div className="device-grid">
                {items.map((device) => (
                  <div
                    key={device.modelId || device.id}
                    draggable={catKey !== "Cables"}
                    onDragStart={catKey !== "Cables" ? (e) => onDragStart(e, name, device, entityType) : undefined}
                    onClick={catKey === "Cables" ? () => handleDrawCable(device.id) : undefined}
                    className="device-tile draggable-tile"
                  >
                    <div className="device-icon">
                      <IconComponent size={32} />
                    </div>
                    <p className="device-type">{device.displayName || device.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showImportModal && <ModalPortal />}
      {errorModal.show && <ErrorModal />}
    </div>
  );
}


//// BEGINNING

//   const ModalPortal = () => {
//     return createPortal(
//       <div className="import-modal-overlay" onClick={() => setshowImportModal(false)}>
//         <div className="import-modal" onClick={(e) => e.stopPropagation()}>
//           <div className="import-modal-header">
//             <button className="close-btn" onClick={() => setshowImportModal(false)}>
//               < X size={16} />
//             </button>
//           </div>

//           <div className="import-modal-content">
//             {importError && <div className="import-alert error-container">{importError}</div>}
//             {importSuccess && <div className="import-alert success">{importSuccess}</div>}
          

//             <div 
//               className="import-drop-zone"
//               onDragOver={(e) => e.preventDefault()}
//               onDrop={(e) => { e.preventDefault(); processFile(e.dataTransfer.files[0]); }}
//             >
              
//               <label className="import-file-label">
//                 <h1>Import Devices</h1>
//                 <input type="file" onChange={(e) => processFile(e.target.files[0])} hidden />
//               </label>
//             </div>

//             <div className="import-format-info">
//               <p><strong>Supported:</strong> .obj, .glb, .fbx</p>
//               <pre className="format-example">vendor-family-model.obj</pre>
//             </div>
//           </div>
//         </div>
//       </div>,
//       document.body // This pushes it to the end of the body tag
//     );
//   };

//   return (
//     <div className="object-library">
//       <div className="panel-header-container">
//         <h3 className="panel-header-title">Object Library</h3>
//         <button className="import-btn" onClick={() => setshowImportModal(true)}>
//           <Import size={16} />
//           Import
//         </button>
//       </div>

//       <hr className="header-separator" /> 
      
//       <div className="library-scroll-area">
//         {Object.keys(categoryDetails).map((catKey) => {
//           const { name, icon: IconComponent, dataKey, catalog, entityType } = categoryDetails[catKey];
//           const catalogItems = dataKey && catalog[dataKey] ? Object.values(catalog[dataKey]) : [];
//           const importedItems = dataKey && customDevices[dataKey] ? Object.values(customDevices[dataKey]) : [];
//           const items = [...catalogItems, ...importedItems];

//           if (items.length === 0) return null;

//           return (
//             <div key={catKey} className="device-category">
//               <p className="category-label">{catKey}</p>
//               <div className="device-grid">
//                 {items.map((device) => (
//                   <div
//                     key={device.modelId || device.id}
//                     draggable={catKey !== "Cables"}
//                     onDragStart={catKey !== "Cables" ? (e) => onDragStart(e, name, device, entityType) : undefined}
//                     onClick={catKey === "Cables" ? () => handleDrawCable(device.id) : undefined}
//                     className="device-tile draggable-tile"
//                   >
//                     <div className="device-icon">
//                       <IconComponent size={32} />
//                     </div>
//                     <p className="device-type">{device.displayName || device.label}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {showImportModal && <ModalPortal />}
//     </div>
//   );
// }


/// ENDDDD

      {/* {categories.map((catKey) => {
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

    {showImportModal && <ModalPortal />}
    </div>
  );
} */}