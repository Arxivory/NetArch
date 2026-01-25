import {
  Mountain,
  Building,
  Grid,
  RectangleHorizontal,
  House,
  DoorOpen,
  Square,
  Play,
  File,
  FilePlus,
  Save,
  MousePointer,
  Hand,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useState } from "react";
import { useHierarchy } from "../HierarchyContext";
import StructuralOption from "./StructuralOption";

export default function Toolbar({ logicalCanvasRef }) {
  const { addNode } = useHierarchy();
  const [drawingMode, setDrawingMode] = useState(null);

  const handleShapeSelect = (type, shape) => {
    addNode(1, type.toLowerCase(), `New ${type}`);
  };

  const handleDrawWall = () => {
    if (logicalCanvasRef && logicalCanvasRef.current) {
      logicalCanvasRef.current.startDrawWall();
      setDrawingMode("wall");
    }
  };

  const handleRectangleSelect = (shape) => {
    if (shape === "Rectangle" && logicalCanvasRef && logicalCanvasRef.current) {
      logicalCanvasRef.current.startDrawRoom();
      setDrawingMode('room');
    } else if (shape === "Circular") {
      logicalCanvasRef.current.startDrawCircle();
      setDrawingMode('circle');
    } else if (shape === "Polygon") {
      logicalCanvasRef.current.startDrawPolygon();
      setDrawingMode('polygon');
    }
  };

  const handleSelect = () => {
    if (logicalCanvasRef && logicalCanvasRef.current) {
      logicalCanvasRef.current.cancelDrawing();
    }
    setDrawingMode(null);
  };

  return (
    <div className="toolbar flex items-end gap-6 px-3 py-2 border-b border-gray-300 bg-white text-xs">
      <div className="flex flex-col items-center justify-end">
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <FilePlus size={16} /> New
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <File size={16} /> Open
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <Save size={16} /> Save
          </button>
        </div>
        <span className="text-[10px] text-gray-500 mt-1">Files</span>
      </div>

      <div className="border-l border-gray-300 h-10 my-auto" />

      <div className="flex flex-col items-center justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelect}
            className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1"
          >
            <MousePointer size={16} /> Select
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <Hand size={16} /> Pan
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <ZoomIn size={16}/> Zoom in
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <ZoomOut size={16}/> Zoom out
          </button>
        </div>
        <span className="text-[10px] text-gray-500 mt-1">Controls</span>
      </div>

      <div className="border-l border-gray-300 h-10 my-auto" />

      <div className="flex flex-col items-center justify-end">
        <div className="flex items-center gap-2">
      
          <StructuralOption
            label="Domain"
            icon={Mountain}
            onSelectShape={(shape) => {
              handleRectangleSelect(shape);
              handleShapeSelect("Domain");
            }}
          />
          <StructuralOption
            label="Site"
            icon={Building}
            onSelectShape={(shape) => {
              handleRectangleSelect(shape);
              handleShapeSelect("Site");
            }}
          />
          <StructuralOption
            label="Space"
            icon={Grid}
            onSelectShape={(shape) => {
              handleRectangleSelect(shape);
              handleShapeSelect("Space");
            }}
          />
        </div>
        <span className="text-[10px] text-gray-500 mt-1">Structure</span>
      </div>
      <div className="border-l border-gray-300 h-10 my-auto" />

      <div className="flex flex-col items-center justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDrawWall}
            className={`px-2 py-1 h-8 rounded flex items-center gap-1 ${
              drawingMode === "wall"
            }`}
          >
            <RectangleHorizontal size={16} /> Wall
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <House size={16} /> Roof
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <DoorOpen size={16} /> Door
          </button>
          <button className="px-2 py-1 h-8 flex items-center hover:bg-gray-100 rounded gap-1">
            <Square size={16} /> Window
          </button>
        </div>
        <span className="text-[10px] text-gray-500 mt-1">Fenestration</span>
      </div>
      
      <div className="flex flex-col items-center justify-end ml-auto">
        <button className="simulate-btn bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 h-8">
          <Play size={16} /> Simulate
        </button>
        <span className="text-[10px] text-gray-500 mt-1 invisible">
          Simulate
        </span>
      </div>
    </div>
  );
}