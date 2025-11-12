import { useRef } from "react";
import Topbar from "./Topbar";
import Toolbar from "./Toolbar/Toolbar";
import ObjectLibrary from "./ObjectLibrary";
import Workspace from "./Workspace/Workspace";
import HierarchyPanel from "./HierarchyPanel";
import PropertiesPanel from "./PropertiesPanel";
import { HierarchyProvider } from "./HierarchyContext";
import ConsoleSimulationLogs from "./logs/ConsoleSimulationLogs";

export default function App() {
  const logicalCanvasRef = useRef(null);

  return (
    <HierarchyProvider> 
      <div className="app">
        <Topbar />
        <Toolbar />

        <Workspace />
        <div className="main-layout">
          <ObjectLibrary />
          <ConsoleSimulationLogs />
          <div className="right-panel">
            <HierarchyPanel />   
            <PropertiesPanel />
          </div>
        </div>
      </div>
    </HierarchyProvider>
  );
}
