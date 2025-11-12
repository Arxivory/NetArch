import { useState } from "react";
import ConsolePanel from "./ConsolePanel";
import SimulationPanel from "./SimulationPanel"; 
import SwitchPanel from "./SwitchPanel";

export default function ConsoleSimulationLogs() {
  const [activeTab, setActiveTab] = useState("console");

  return (
  
    <div className="console-simulation-logs ">
      <SwitchPanel activeTab={activeTab} setActiveTab={setActiveTab} />
     
      <div className="panel"> 
        {activeTab === "console" ? <ConsolePanel /> : <SimulationPanel />}
      </div>
    </div>
  );
}