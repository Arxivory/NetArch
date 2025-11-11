import { useState } from "react";
import ConsolePanel from "./ConsolePanel";
import SimulationPanel from "./SimulationPanel"; 
import SwitchPanel from "./SwitchPanel";

export default function ConsoleSimulationLogs() {
  const [activeTab, setActiveTab] = useState("console");

  return (
  
    <div className="console-simulation-logs flex flex-col fixed bottom-0 h-52 bg-gray-100 border-t border-gray-300 z-20 w-[900px] mx-auto">
      <SwitchPanel activeTab={activeTab} setActiveTab={setActiveTab} />
     
      <div className="px-1 w-full flex-1"> 
        {activeTab === "console" ? <ConsolePanel /> : <SimulationPanel />}
      </div>
    </div>
  );
}