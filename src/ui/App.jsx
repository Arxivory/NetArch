import { useRef, useState, useEffect } from "react";
import appState from "../state/AppState";
import { NetworkManager } from "../core/network/network-system";
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
  const [networkManager, setNetworkManager] = useState(null);
  const [networkRunning, setNetworkRunning] = useState(false);

  useEffect(() => {
    const manager = new NetworkManager(appState.network);
    manager.initialize();
    setNetworkManager(manager);

    return () => {
      manager.destroy?.();
    };
  }, []);

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
        <Topbar canvasController={canvasControllerRef.current || controller} />
        <Toolbar
          canvasController={controller}
          networkManager={networkManager}
          networkRunning={networkRunning}
          setNetworkRunning={setNetworkRunning}
        />

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