import { useState, useRef } from "react";
import PhysicalMode from "./PhysicalMode";
import { ModeSwitch } from "./ModeSwitch";
import LogicalMode from "./LogicalMode";

export default function Workspace() {
  const [mode, setMode] = useState("logical");
  const logicalRef = useRef(null);

  return (
    <div className="workspace">
      {mode === "logical" ? (
        <LogicalMode ref={logicalRef} />
      ) : (
        <PhysicalMode />
      )}

      <ModeSwitch currentMode={mode} onModeChange={(m) => setMode(m)} />
    </div>
  );
}
