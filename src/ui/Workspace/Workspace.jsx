import SceneCanvas from "./SceneCanvas";
import { ModeSwitch } from "./ModeSwitch";
import { LogicalMode } from "./LogicalMode";

export default function Workspace() {
  return (
    <div className="workspace">
      <LogicalMode />
      <ModeSwitch currentMode={"logical"}/>
    </div>
  );
}
