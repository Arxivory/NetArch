import { useRef } from "react";
import Topbar from "./Topbar";
import Toolbar from "./Toolbar/Toolbar";
import ObjectLibrary from "./ObjectLibrary";
import Workspace from "./Workspace/Workspace";
import HierarchyPanel from "./HierarchyPanel";
import PropertiesPanel from "./PropertiesPanel";
import ConsolePanel from "./ConsolePanel";
import { HierarchyProvider } from "./HierarchyContext";

export default function App() {
  const logicalCanvasRef = useRef(null);

  return (
    <HierarchyProvider> 
      <div className="app">
        <Topbar />
        <Toolbar logicalCanvasRef={logicalCanvasRef} />

        <Workspace logicalCanvasRef={logicalCanvasRef} />
        <div className="main-layout">
          <ObjectLibrary />
          <ConsolePanel />
          <div className="right-panel">
            <HierarchyPanel />   
            <PropertiesPanel />
          </div>
        </div>
        
      </div>
    </HierarchyProvider>
  );
}
