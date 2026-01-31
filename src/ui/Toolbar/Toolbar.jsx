import {
  Mountain, Building, Grid, RectangleHorizontal, House, DoorOpen,
  Square, Play, File, FilePlus, Save, MousePointer, Hand, ZoomIn, ZoomOut
} from "lucide-react";
import { useState } from "react";
import { useHierarchy } from "../HierarchyContext";
import StructuralOption from "./StructuralOption";

export default function Toolbar({ logicalCanvasRef }) {
  const { addNode } = useHierarchy();
  const [drawingMode, setDrawingMode] = useState("select");
  const isActive = (mode) => drawingMode === mode;

  const handleShapeSelect = (type, shape) => {
    addNode(1, type.toLowerCase(), `New ${type}`);
  };

  const handleDrawWall = () => {
    if (logicalCanvasRef?.current) {
      logicalCanvasRef.current.startDrawWall();
      setDrawingMode("wall");
    }
  };

  const handleRectangleSelect = (shape) => {
    if (!logicalCanvasRef?.current) return;
    if (shape === "Rectangle") logicalCanvasRef.current.startDrawRoom();
    else if (shape === "Circular") logicalCanvasRef.current.startDrawCircle();
    else if (shape === "Polygon") logicalCanvasRef.current.startDrawPolygon();
    setDrawingMode(shape.toLowerCase());
  };

  return (
    <div className="toolbar">
      {/* File Group */}
      <div className="toolbar-group">
        <div className="toolbar-row">
          <button className="toolbar-btn">
            <FilePlus size={16} /> New
          </button>
          <button className="toolbar-btn">
            <File size={16} /> Open
          </button>
          <button className="toolbar-btn">
            <Save size={16} /> Save
          </button>
        </div>
        <span className="toolbar-label">Files</span>
      </div>

      <div className="toolbar-divider" />

      {/* Controls Group */}
      <div className="toolbar-group">
        <div className="toolbar-row">
          <button
            onClick={() => { if(logicalCanvasRef?.current) logicalCanvasRef.current.cancelDrawing(); setDrawingMode("select"); }}
            className={`toolbar-btn ${isActive("select") ? "active" : ""}`}
          >
            <MousePointer size={16} /> Select
          </button>
          <button 
            onClick={() => setDrawingMode("pan")}
            className={`toolbar-btn ${isActive("pan") ? "active" : ""}`}
          >
            <Hand size={16} /> Pan
          </button>
          <button className="toolbar-btn"><ZoomIn size={16}/> Zoom in</button>
          <button className="toolbar-btn"><ZoomOut size={16}/> Zoom out</button>
        </div>
        <span className="toolbar-label">Controls</span>
      </div>

      <div className="toolbar-divider" />

      {/* Structure Group */}
      <div className="toolbar-group">
        <div className="toolbar-row">
          <StructuralOption
            label="Domain" icon={Mountain} isActive={isActive("domain")} 
            onSelectShape={(shape) => { handleRectangleSelect(shape); handleShapeSelect("Domain"); setDrawingMode("domain"); }}
          />
          <StructuralOption
            label="Site" icon={Building} isActive={isActive("site")}
            onSelectShape={(shape) => { handleRectangleSelect(shape); handleShapeSelect("Site"); setDrawingMode("site"); }}
          />
          <StructuralOption
            label="Space" icon={Grid} isActive={isActive("space")}
            onSelectShape={(shape) => { handleRectangleSelect(shape); handleShapeSelect("Space"); setDrawingMode("space"); }}
          />
        </div>
        <span className="toolbar-label">Structure</span>
      </div>

      <div className="toolbar-divider" />

      {/* Fenestration Group */}
      <div className="toolbar-group">
        <div className="toolbar-row">
          <button onClick={handleDrawWall} className={`toolbar-btn ${isActive("wall") ? "active" : ""}`}>
            <RectangleHorizontal size={16} /> Wall
          </button>
          <button onClick={() => setDrawingMode("roof")} className={`toolbar-btn ${isActive("roof") ? "active" : ""}`}>
            <House size={16} /> Roof
          </button>
          <button onClick={() => setDrawingMode("door")} className={`toolbar-btn ${isActive("door") ? "active" : ""}`}>
            <DoorOpen size={16} /> Door
          </button>
          <button onClick={() => setDrawingMode("window")} className={`toolbar-btn ${isActive("window") ? "active" : ""}`}>
            <Square size={16} /> Window
          </button>
        </div>
        <span className="toolbar-label">Fenestration</span>
      </div>
      
      {/* Simulation Section */}
      <div className="toolbar-group ml-auto">
        <button className="simulate-btn">
          <Play size={16} /> Simulate
        </button>
        <span className="toolbar-label invisible">Simulate</span>
      </div>
    </div>
  );
}