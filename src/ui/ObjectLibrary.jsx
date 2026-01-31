import {
  Server,
  Network,
  Router,
  Database,
  Cable,
  Wifi,
  Armchair,
  Import,
  MonitorSmartphone
} from "lucide-react";
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
    icon: MonitorSmartphone,
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
    setDrawingMode("cable");
  };

  const onDragStart = (event, nodeType, label) => {
    const data = { type: nodeType, label };
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(data)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="object-library">

      {}
      <div className="object-library-header">
        <h3 className="panel-header">Object Library</h3>

        <button
          className="import-btn"
          onClick={() => console.log("Import clicked")}
        >
          <Import size={16} />
          Import
        </button>
      </div>

      <hr className="header-separator" />

      {}
      {categories.map((cat) => {
        const { name, icon: IconComponent } = categoryDetails[cat];

        return (
          <div key={cat} className="device-category">
            <p className="category-title">{cat}</p>

            <div className="device-grid">
              {Array(6)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    draggable={name !== "Cable"}
                    onClick={
                      name === "Cable" ? handleDrawCable : undefined
                    }
                    onDragStart={
                      name !== "Cable"
                        ? (event) =>
                            onDragStart(event, cat, name)
                        : undefined
                    }
                    className={`device-tile ${
                      name !== "Cable" ? "draggable" : ""
                    }`}
                  >
                    <div className="device-icon">
                      <IconComponent size={32} />
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
