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
// Re-importing StructuralOption
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
    } else if (shape === "Circular") {
      // some label variants may use "Circular" in the dropdown
      logicalCanvasRef.current.startDrawCircle();
      setDrawingMode('circle');
    }
    // You could add else-if blocks here for "Polygon", "Freeform", etc.
    // else if (shape === "Polygon") { ... }
  };

  const handleSelect = () => {
    if (logicalCanvasRef && logicalCanvasRef.current) {
      logicalCanvasRef.current.cancelDrawing();
    }
    setDrawingMode(null);
  };

  return (
    <div className="toolbar flex items-end gap-6 px-3 py-2 border-b border-gray-300 bg-white text-xs">
      {/* Files group */}
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

      {/* Controls group */}
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
        </div>
        <span className="text-[10px] text-gray-500 mt-1">Controls</span>
      </div>

      <div className="border-l border-gray-300 h-10 my-auto" />

      {/* ============================================================
        UPDATED SECTION: Structure group
        ============================================================
        
        This now uses your <StructuralOption> component, which
        will render the horizontal button with the dropdown.
      */}
      <div className="flex flex-col items-center justify-end">
        <div className="flex items-center gap-2">
          {/*
            The <StructuralOption> component's button now has h-8,
            so it no longer needs a wrapper.
          */}
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
      {/* ========================================================== */}


      <div className="border-l border-gray-300 h-10 my-auto" />

      {/* Fenestration group */}
      <div className="flex flex-col items-center justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDrawWall}
            className={`px-2 py-1 h-8 rounded flex items-center gap-1 ${
              drawingMode === "wall"
                ? "bg-gray-100"
                : "hover:bg-gray-100"
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

      <div className="border-l border-gray-300 h-10 my-auto" />

      {/* Simulate group (with previous fix) */}
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