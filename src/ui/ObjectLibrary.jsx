import { Server, Network, Router, Database, Cable, Wifi, Armchair, Import } from "lucide-react";

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

export default function ObjectLibrary() {
  
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

        return (
          <div key={cat} className="mb-3">
            <p className="text-gray-600 font-medium">{cat}</p>
            <div className="device-grid">
              {Array(6)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(event) => onDragStart(event, cat, name)}
                    className="device-tile cursor-grab active:cursor-grabbing"
                  >
                    <div className="device-icon mb-1">
                      <IconComponent size={32} />
                    </div>

                    <p className="device-type">
                      {name}
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