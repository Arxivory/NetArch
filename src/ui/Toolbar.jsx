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
} from "lucide-react";
import { useHierarchy } from "./HierarchyContext";

export default function Toolbar() {
  const { addNode } = useHierarchy();

  return (
    <div className="toolbar flex items-center gap-2 px-2 py-1 border-b border-gray-300 bg-white text-xs">
      {/* File Controls */}
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

      {/* Selection Tools */}
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <MousePointer size={16} /> Select
      </button>
      <button className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">
        <Hand size={16} /> Pan
      </button>

      <div className="border-l border-gray-300 h-6 my-auto" />

      {/* Structural Controls */}
      <button
        className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 structural-btn"
        onClick={() => addNode(1, "domain", "New Domain")}
      >
        <Mountain size={16} /> Domain
      </button>

      <button
        className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 structural-btn"
        onClick={() => addNode(1, "site", "New Site")}
      >
        <Building size={16} /> Site
      </button>

      <button
        className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 structural-btn"
        onClick={() => addNode(1, "space", "New Space")}
      >
        <Grid size={16} /> Space
      </button>

      <div className="border-l border-gray-300 h-6 my-auto" />

      {/* Building Elements */}
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

      {/* Simulation */}
      <button className="simulate-btn bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 ml-auto">
        <Play size={16} /> Simulate
      </button>
    </div>
  );
}
