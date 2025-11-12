import { Server, Network, Router, Database, Wifi, Armchair } from "lucide-react";

const categoryDetails = {
  Routers: {
    name: "Router",
    icon: Router, // lucide Router icon
  },
  Switches: {
    name: "Switch",
    icon: Network, // Network works well for switches
  },
  Hubs: {
    name: "Hub",
    icon: Database, // Database can represent hub/server rack
  },
  Wireless: {
    name: "Wireless",
    icon: Wifi,
  },
  Furniture: {
    name: "Furniture",
    icon: Armchair, // use Armchair (exists) instead of Chair
  }
};

const categories = Object.keys(categoryDetails);

export default function ObjectLibrary() {
  return (
    <div className="object-library">
      <h3 className="panel-header">Object Library</h3>
      <hr className="header-separator" />

      {categories.map((cat) => {
        const { name, icon: Icon } = categoryDetails[cat];

        return (
          <div key={cat} className="mb-3">
            <p className="text-gray-600 font-medium">{cat}</p>
            <div className="device-grid">
              {Array(6)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="device-tile">
                    <div className="device-icon mb-1">
                      <Icon size={32} />
                    </div>
                    <p className="device-type">{name}</p>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
