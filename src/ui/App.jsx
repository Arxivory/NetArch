import Topbar from "./Topbar";
import Toolbar from "./Toolbar";
import ObjectLibrary from "./ObjectLibrary";
import Workspace from "./Workspace/Workspace";
import HierarchyPanel from "./HierarchyPanel";
import PropertiesPanel from "./PropertiesPanel";
import { HierarchyProvider } from "./HierarchyContext";

// Import the new SwitchPanel instead of ConsolePanel and SimulationPanel
import SwitchPanel from "./logs/SwitchPanel";

export default function App() {
  return (
    <HierarchyProvider>
      <div className="app">
        <Topbar />
        <Toolbar />

        <Workspace />

        <div className="main-layout">
          <ObjectLibrary />

          {/* Replace ConsolePanel with SwitchPanel */}
          <SwitchPanel />

          <div className="right-panel">
            <HierarchyPanel />
            <PropertiesPanel />
          </div>
        </div>
      </div>
    </HierarchyProvider>
  );
}