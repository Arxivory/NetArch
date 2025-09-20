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
  Hand
} from "lucide-react";

export default function Toolbar() {
  return (
    <div className="toolbar">
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <FilePlus size={16} /> 
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <File size={16} /> 
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <Save size={16} /> 
      </button>
      
      <div className="border-l border-gray-300 h-6 my-auto" />

      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <MousePointer size={16} /> Select
      </button>

      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <Hand size={16} /> Pan
      </button>

      <div className="border-l border-gray-300 h-6 my-auto" />

      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 structural-btn">
        <Mountain size={16} className="structural-btn-icon"/> Domain
      </button>

      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 structural-btn">
        <Building size={16} className="structural-btn-icon"/> Site
      </button>

      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 structural-btn">
        <Grid size={16} className="structural-btn-icon"/> Space
      </button>

      <div className="border-l border-gray-300 h-6 my-auto" />

      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <RectangleHorizontal size={16} /> Wall
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

      <button className="simulate-btn">
        <Play size={16} /> Simulate
      </button>
    </div>
  );
}
