import { useState, useRef, useEffect } from "react";
import PhysicalMode from "./PhysicalMode";
import { ModeSwitch } from "./ModeSwitch";
import LogicalMode from "./LogicalMode";

export default function Workspace({ logicalCanvasRef }) {
  const [mode, setMode] = useState("logical");
  const localLogicalRef = useRef(null);
  const [modeSwitchStyle, setModeSwitchStyle] = useState(null);

  useEffect(() => {
    if (logicalCanvasRef) {
      logicalCanvasRef.current = localLogicalRef.current;
    }
  }, [logicalCanvasRef]);

  return (
    <div className="workspace">
      {mode === "logical" ? (
        <LogicalMode ref={localLogicalRef} />
      ) : (
        <PhysicalMode />
      )}

  <ModeSwitch currentMode={mode} onModeChange={(m) => setMode(m)} style={modeSwitchStyle} />
    </div>
  );
}
