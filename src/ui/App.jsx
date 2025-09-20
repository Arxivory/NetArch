import Toolbar from "./Toolbar";
import ObjectLibrary from "./ObjectLibrary";
import Workspace from "./Workspace/Workspace";
import HierarchyPanel from "./HierarchyPanel";
import PropertiesPanel from "./PropertiesPanel";
import ConsolePanel from "./ConsolePanel";

export default function App() {
  return (
    <div className="app">
      
      <Toolbar />

      <div className="main-layout">
        <ObjectLibrary />
        <Workspace />
        <div className="right-panel">
          <HierarchyPanel />
          <PropertiesPanel />
        </div>
      </div>

      <ConsolePanel />
    </div>
  );
}
