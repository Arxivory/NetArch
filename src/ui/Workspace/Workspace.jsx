import { useState, useRef, useEffect } from "react";
import PhysicalMode from "./PhysicalMode";
import { ModeSwitch } from "./ModeSwitch";
import LogicalMode from "./LogicalMode";
import LogicalCanvasController from "../../core/LogicalCanvasController";

export default function Workspace({ canvasControllerRef }) {
  const [mode, setMode] = useState("logical");
  const logicalModeRef = useRef(null);

  useEffect(() => {
    if (mode === "logical" && logicalModeRef.current && canvasControllerRef) {
      // Create controller when LogicalMode is mounted
      if (!canvasControllerRef.current) {
        // Controller will be created by LogicalMode component
      }
    }
  }, [mode, canvasControllerRef]);

  return (
    <div className="workspace">
      {mode === "logical" && <LogicalMode ref={logicalModeRef} canvasControllerRef={canvasControllerRef} />}
      {mode === "physical" && <PhysicalMode />}
      <ModeSwitch currentMode={mode} onModeChange={setMode} />
    </div>
  );
}
