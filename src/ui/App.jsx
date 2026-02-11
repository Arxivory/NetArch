import { useRef, useState, useEffect } from "react";
import Topbar from "./Topbar";
import Toolbar from "./Toolbar/Toolbar";
import ObjectLibrary from "./ObjectLibrary";
import Workspace from "./Workspace/Workspace";
import HierarchyPanel from "./HierarchyPanel";
import PropertiesPanel from "./PropertiesPanel";
import { HierarchyProvider } from "./HierarchyContext";
import ConsoleSimulationLogs from "./logs/ConsoleSimulationLogs";

export default function App() {
  const canvasControllerRef = useRef(null);
  const [controller, setController] = useState(null);

  // Force re-render when controller is set
  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasControllerRef.current && !controller) {
        setController(canvasControllerRef.current);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [controller]);

  return (
    <HierarchyProvider> 
      <div className="app">
        <Topbar />
        <Toolbar canvasController={controller}/>

        <Workspace canvasControllerRef={canvasControllerRef}/>
        <div className="main-layout">
          <ObjectLibrary canvasController={controller}/>
          <ConsoleSimulationLogs />
          <div className="right-panel">
            <HierarchyPanel />   
            <PropertiesPanel canvasController={controller} />
          </div>
        </div>
      </div>
    </HierarchyProvider>
  );
}