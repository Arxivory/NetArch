import Toolbar from "./Toolbar";
import ObjectLibrary from "./ObjectLibrary";
import Workspace from "./Workspace/Workspace";
import HierarchyPanel from "./HierarchyPanel";
import PropertiesPanel from "./PropertiesPanel";
import ConsolePanel from "./ConsolePanel";
import { HierarchyProvider } from "./HierarchyContext";

export default function App() {
  return (
    <HierarchyProvider> {/* ✅ wrap whole app */}
      <div className="app">
        {/* Top toolbar */}
        <Toolbar />

        <div className="main-layout">
          <ObjectLibrary />
          <Workspace />
          <div className="right-panel">
            <HierarchyPanel />   {/* ✅ now works with context */}
            <PropertiesPanel />
          </div>
        </div>

        <ConsolePanel />
      </div>
    </HierarchyProvider>
  );
}
