import { useState } from "react";
import ConsolePanel from "./ConsolePanel";
import SimulationPanel from "./SimulationPanel";

export default function SwitchPanel() {
  // Default tab is "Device", which shows the ConsolePanel
  const [activeTab, setActiveTab] = useState("device");

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-md">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "device"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("device")}
        >
          Device
        </button>

        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "simulation"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("simulation")}
        >
          Simulation
        </button>
      </div>

      {/* Panel content */}
      <div className="p-2">
        {activeTab === "device" ? <ConsolePanel /> : <SimulationPanel />}
      </div>
    </div>
  );
}
