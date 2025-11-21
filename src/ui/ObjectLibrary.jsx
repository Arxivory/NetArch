import { Server, Network, Router, Database, Cable, Wifi, Armchair, Import } from "lucide-react";


const categoryDetails = {
  Routers: {
    name: "Router",
    icon: Router, // lucide Router icon
  },
  Switches: {
    name: "Switch",
    icon: Server, // Network works well for switches
  },
  Hubs: {
    name: "Hub",
    icon: Database, // Database can represent hub/server rack
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
    icon: Armchair, // use Armchair (exists) instead of Chair
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
      <h3 className="panel-header">Object Library</h3>
      <hr className="header-separator" />

      {/* Loop over the categories */}
      {categories.map((cat) => {
        // Get the correct name and icon for this category
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
      })}
    </div>
  );
}