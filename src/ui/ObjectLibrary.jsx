import { Server, Network, Router, Database, Cable, Wifi, Armchair, Import, MonitorSmartphone } from "lucide-react";
import { useState } from "react";

const categoryDetails = {
  Routers: {
    name: "Router",
    icon: Router,
  },
  Switches: {
    name: "Switch",
    icon: Server,
  },
  Hubs: {
    name: "Hub",
    icon: Database,
  },
  Cables: {
    name: "Cable",
    icon: Cable,
  },
  EndDevices: {
    name: "End Device",
    icon: MonitorSmartphone
  },
  Wireless: {
    name: "Wireless",
    icon: Wifi,
  },
  Furniture: {
    name: "Furniture",
    icon: Armchair,
  },
};

const categories = Object.keys(categoryDetails);

export default function ObjectLibrary({ logicalCanvasRef }) {
  
  const [drawingMode, setDrawingMode] = useState(null);

  const handleDrawCable = () => {
    logicalCanvasRef.current.startDrawCable();
    setDrawingMode('cable');
  }

  const onDragStart = (event, nodeType, label) => {
    // We create a data object to identify what is being dragged
    const data = { type: nodeType, label: label };
    
    // We attach this data to the drag event so the canvas can read it later
    event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="object-library">
      
      {/* --- NEW HEADER SECTION --- */}
      <div className="flex items-center justify-between mb-2">
        {/* Title */}
        <h3 className="panel-header mb-0">Object Library</h3>
        
        {/* Import Button */}
        <button 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors border border-gray-200"
          onClick={() => console.log("Import clicked")}
        >
          <Import size={16} />
          Import
        </button>
      </div>
      {/* -------------------------- */}

      <hr className="header-separator" />

      {/* Loop over the categories */}
      {categories.map((cat) => {
        const { name, icon: IconComponent } = categoryDetails[cat];

        if (name === "Cable") {
          return (
            <div key={cat} className="mb-3">
              <p className="text-gray-600 font-medium">{cat}</p>
              <div className="device-grid">
                {Array(6)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="device-tile"
                      onClick={handleDrawCable}
                    >
                      <div className="device-icon mb-1">
                        {/* Use the dynamic icon */}
                        <IconComponent size={32} />
                      </div>

                      <p className="device-type">
                        {/* Use the dynamic name */}
                        {name}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          );
        } else {
            return (
            <div key={cat} className="mb-3">
              <p className="text-gray-600 font-medium">{cat}</p>
              <div className="device-grid">
                {Array(6)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      // 2. NEW: Enable dragging on this specific tile
                      draggable
                      // 3. NEW: Connect the drag event to our function
                      onDragStart={(event) => onDragStart(event, cat, name)}
                      // 4. NEW: Add cursor styles so the user knows it's grabbable
                      className="device-tile cursor-grab active:cursor-grabbing"
                    >
                      <div className="device-icon mb-1">
                        {/* Use the dynamic icon */}
                        <IconComponent size={32} />
                      </div>

                      <p className="device-type">
                        {/* Use the dynamic name */}
                        {name}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}