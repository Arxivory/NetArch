import {
  Globe,
  MapPin,
  RectangleHorizontal,
  House,
  DoorOpen,
  Square,
  Play,
  File,
  FilePlus,
  Save
} from "lucide-react";

export default function Toolbar() {
  return (
    <div className="toolbar">
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

      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <Globe size={16} /> Domain
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <MapPin size={16} /> Site
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

      {/* Spacer pushes Simulate button to the right */}
      <div className="flex-grow" />

      <button className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-700">
        <Play size={16} /> Simulate
      </button>
    </div>
  );
}
