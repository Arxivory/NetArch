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
import appState from "../state/AppState";
import { StartDrawCableCommand } from "../core/editor/DrawingCommands";

const categoryDetails = {
  Routers: { name: "Router", icon: Router },
  Switches: { name: "Switch", icon: Server },
  Cables: { name: "Cable", icon: Cable },
  EndDevices: { name: "End Device", icon: MonitorSmartphone },
  Wireless: { name: "Wireless", icon: Wifi },
  Furniture: { name: "Furniture", icon: Armchair },
};

const categories = Object.keys(categoryDetails);

export default function ObjectLibrary({ canvasController }) {
  const handleDrawCable = () => {
    if (!canvasController) return;
    const cmd = new StartDrawCableCommand(canvasController, appState);
    cmd.execute();
  };

  const onDragStart = (event, nodeType, label) => {
    const data = { type: nodeType, label: label };
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

      {categories.map((cat) => {
        const { name, icon: IconComponent } = categoryDetails[cat];
        const isCable = name === "Cable";

        return (
          <div key={cat} className="device-category">
            <p className="category-label">{cat}</p>
            <div className="device-grid">
              {Array(6).fill(null).map((_, i) => (
                <div
                  key={i}
                  draggable={!isCable}
                  onDragStart={!isCable ? (event) => onDragStart(event, cat, name) : undefined}
                  onClick={isCable ? handleDrawCable : undefined}
                  className={`device-tile ${!isCable ? 'draggable-tile' : ''}`}
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
