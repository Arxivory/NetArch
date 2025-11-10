import { useState } from "react";
import ConsolePanel from "./ConsolePanel";
import SimulationPanel from "./SimulationPanel";

export default function SwitchPanel() {
  const [activeTab, setActiveTab] = useState("device"); // Default tab = ConsolePanel

  return (
    <div className="flex flex-col h-full">
      {/* Tab Buttons */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "device"
              ? "text-blue-600 border-b-2 border-blue-500"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("device")}
        >
          Device
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "simulation"
              ? "text-blue-600 border-b-2 border-blue-500"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("simulation")}
        >
          Simulation
        </button>
      </div>

      {/* Active Panel (inherits each panel’s own styling) */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {activeTab === "device" ? <ConsolePanel /> : <SimulationPanel />}
      </div>
    </div>
  );
}
