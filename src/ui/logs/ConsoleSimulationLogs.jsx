import { useState } from "react";
import ConsolePanel from "./ConsolePanel";
import SimulationPanel from "./SimulationPanel";

export default function ConsoleSimulationLogs() {
  const [activeTab, setActiveTab] = useState("console");

  return (
    <div className="console-simulation-logs flex flex-col h-full bg-gray-50 border border-gray-200 rounded-md shadow-sm">
      {/* ===== Tabs (SwitchPanel equivalent) ===== */}
      <div className="flex items-center bg-white border-b border-gray-300 px-4 py-2">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-all duration-200 ${
            activeTab === "console"
              ? "text-blue-600 border-b-2 border-blue-500"
              : "text-gray-600 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("console")}
        >
          Devices
        </button>

        <button
          className={`ml-4 px-4 py-2 text-sm font-medium rounded-t-md transition-all duration-200 ${
            activeTab === "simulation"
              ? "text-blue-600 border-b-2 border-blue-500"
              : "text-gray-600 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("simulation")}
        >
          Simulation
        </button>
      </div>

      {/* ===== Active Panel ===== */}
      <div className="flex-1 overflow-hidden bg-white">
        {activeTab === "console" ? <ConsolePanel /> : <SimulationPanel />}
      </div>
    </div>
  );
}
