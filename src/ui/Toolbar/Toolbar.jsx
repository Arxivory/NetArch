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
  Circle,
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
      setDrawingMode('wall');
    }
  };

  const handleDrawCircle = () => {
    if (logicalCanvasRef && logicalCanvasRef.current) {
      logicalCanvasRef.current.startDrawCircle();
      setDrawingMode('circle');
    }
  };

  const handleShapeSelectFromDropdown = (shape) => {
    if (!logicalCanvasRef || !logicalCanvasRef.current) return;
    if (shape === "Rectangle") {
      logicalCanvasRef.current.startDrawRoom();
      setDrawingMode('room');
    } else if (shape === "Circular" || shape === "Circle") {
      // some label variants may use "Circular" in the dropdown
      logicalCanvasRef.current.startDrawCircle();
      setDrawingMode('circle');
    }
  };

  const handleSelect = () => {
    if (logicalCanvasRef && logicalCanvasRef.current) {
      logicalCanvasRef.current.cancelDrawing();
    }
    setDrawingMode(null);
  };

  return (
    <div className="toolbar flex items-center gap-2 px-2 py-1 border-b border-gray-300 bg-white text-xs">
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <FilePlus size={16} /> New
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <File size={16} /> Open
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <Save size={16} /> Save
      </button>

      <div className="border-l border-gray-300 h-6 my-auto" />

      <button 
        onClick={handleSelect}
        className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1"
      >
        <MousePointer size={16} /> Select
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <Hand size={16} /> Pan
      </button>

      <div className="border-l border-gray-300 h-6 my-auto" />

      <StructuralOption
        label="Domain"
        icon={Mountain}
        onSelectShape={(shape) => {
          handleShapeSelectFromDropdown(shape);
          handleShapeSelect("Domain");
        }}
      />

      <StructuralOption
        label="Site"
        icon={Building}
        onSelectShape={(shape) => {
          handleShapeSelectFromDropdown(shape);
          handleShapeSelect("Site");
        }}
      />

      <StructuralOption
        label="Space"
        icon={Grid}
        onSelectShape={(shape) => {
          handleShapeSelectFromDropdown(shape);
          handleShapeSelect("Space");
        }}
      />

      <div className="border-l border-gray-300 h-6 my-auto" />

      <button 
        onClick={handleDrawWall}
        className={`px-2 py-1 rounded flex items-center gap-1 ${
          drawingMode === 'wall' 
            ? 'bg-gray-100' 
            : 'hover:bg-gray-100'
        }`}
      >
        <RectangleHorizontal size={16} /> Wall
      </button>
      <button 
        onClick={handleDrawCircle}
        className={`px-2 py-1 rounded flex items-center gap-1 ${
          drawingMode === 'circle' 
            ? 'bg-gray-100' 
            : 'hover:bg-gray-100'
        }`}
      >
        <Circle size={16} /> Circle
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <House size={16} /> Roof
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <DoorOpen size={16} /> Door
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <Square size={16} /> Window
      </button>

      <div className="border-l border-gray-300 h-6 my-auto" />

      <button className="simulate-btn bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 ml-auto">
        <Play size={16} /> Simulate
      </button>
    </div>
  );
}
