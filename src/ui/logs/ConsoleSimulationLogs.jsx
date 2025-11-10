import React, { useState } from "react";
import SwitchPanel from "./SwitchPanel";
import ConsolePanel from "./ConsolePanel";
import SimulationPanel from "./SimulationPanel";

const ConsoleSimulationLogs = () => {
  const [activeTab, setActiveTab] = useState("devices");

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 border border-gray-300 rounded-md overflow-hidden">
      <div className="border-b border-gray-300 bg-white shadow-sm">
        <SwitchPanel activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-4 relative">
        {activeTab === "devices" && (
          <div className="h-full">
            <ConsolePanel />
          </div>
        )}
        {activeTab === "simulation" && (
          <div className="h-full">
            <SimulationPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsoleSimulationLogs;
