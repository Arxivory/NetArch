import {
  Mountain, Building, Grid, RectangleHorizontal, House, DoorOpen,
  Square, Play, File, FilePlus, Save, MousePointer, Hand, ZoomIn, ZoomOut
} from "lucide-react";
import { useEffect, useState } from "react";
import appState from "../../state/AppState";
import {
  StartDrawRectangleCommand, StartDrawCircleCommand, StartDrawPolygonCommand, StartDrawWallCommand,
  StartSelectCommand, StartPanCommand, StartZoomInCommand, StartZoomOutCommand, CancelDrawingCommand
} from "../../core/editor/DrawingCommands";
import StructuralOption from "./StructuralOption";

export default function Toolbar({ canvasController }) {
  const [activeTool, setActiveTool] = useState("select");

  useEffect(() => {
    const unsubscribe = appState.tools.subscribe(() => {
      setActiveTool(appState.tools.getActiveTool() || "select");
    });
    return unsubscribe;
  }, []);

  const executeCommand = (Command, ...args) => {
    if (!canvasController) return;
    const cmd = new Command(canvasController, appState, ...args);
    cmd.execute();
  };

  const isActive = (mode) => activeTool === mode;

  const handleStructuralShape = (structureType, shape) => {
    if (!canvasController) return;

    let Command;
    switch (shape) {
      case "Rectangle":
        Command = StartDrawRectangleCommand;
        break;
      case "Circular":
        Command = StartDrawCircleCommand;
        break;
      case "Polygon":
        Command = StartDrawPolygonCommand;
        break;
      case "Freeform":
        Command = StartDrawPolygonCommand;
        break;
      default:
        Command = StartDrawRectangleCommand;
    }

    const cmd = new Command(canvasController, appState, structureType);
    cmd.execute();
    appState.tools.setActiveTool(structureType.toLowerCase());
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <div className="toolbar-row">
          <button className="toolbar-btn"><FilePlus size={16} /> New</button>
          <button className="toolbar-btn"><File size={16} /> Open</button>
          <button className="toolbar-btn"><Save size={16} /> Save</button>
        </div>
        <span className="toolbar-label">Files</span>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="toolbar-row">
          <button
            onClick={() => executeCommand(StartSelectCommand)}
            className={`toolbar-btn ${isActive("select") ? "active" : ""}`}
          >
            <MousePointer size={16} /> Select
          </button>
          <button
            onClick={() => executeCommand(StartPanCommand)}
            className={`toolbar-btn ${isActive("pan") ? "active" : ""}`}
          >
            <Hand size={16} /> Pan
          </button>
          <button
            onClick={() => {
              executeCommand(StartZoomInCommand);
            }}
            className={`toolbar-btn ${isActive("zoom") ? "active" : ""}`}>
            <ZoomIn size={16} /> Zoom in</button>
          <button
            onClick={() => {executeCommand(StartZoomOutCommand);
            }}
            className={`toolbar-btn ${isActive("zoom") ? "active" : ""}`}>
            <ZoomOut size={16} /> Zoom out</button>
        </div>
        <span className="toolbar-label">Controls</span>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="toolbar-row">
          <StructuralOption
            label="Domain" icon={Mountain} isActive={activeTool === "domain"}
            onSelectShape={(shape) => {
              handleStructuralShape('Domain', shape);
            }}
          />
          <StructuralOption
            label="Site" icon={Building} isActive={activeTool === "site"}
            onSelectShape={(shape) => {
              handleStructuralShape('Site', shape);
            }}
          />
          <StructuralOption
            label="Space" icon={Grid} isActive={activeTool === "space"}
            onSelectShape={(shape) => {
              handleStructuralShape('Space', shape);
            }}
          />
        </div>
        <span className="toolbar-label">Structure</span>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="toolbar-row">
          <button
            onClick={() => executeCommand(StartDrawWallCommand)}
            className={`toolbar-btn ${isActive("wall") ? "active" : ""}`}
          >
            <RectangleHorizontal size={16} /> Wall
          </button>
          <button className="toolbar-btn"><House size={16} /> Roof</button>
          <button className="toolbar-btn"><DoorOpen size={16} /> Door</button>
          <button className="toolbar-btn"><Square size={16} /> Window</button>
        </div>
        <span className="toolbar-label">Fenestration</span>
      </div>

      <div className="toolbar-group ml-auto">
        <button className="simulate-btn">
          <Play size={16} /> Simulate
        </button>
        <span className="toolbar-label invisible">Simulate</span>
      </div>
    </div>
  );
}