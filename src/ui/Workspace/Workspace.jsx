import { useState, useRef, useEffect } from "react";
import PhysicalMode from "./PhysicalMode";
import { ModeSwitch } from "./ModeSwitch";
import LogicalMode from "./LogicalMode";

export default function Workspace() {
  const [mode, setMode] = useState("logical");
  const logicalRef = useRef(null);
  const [modeSwitchStyle, setModeSwitchStyle] = useState(null);

  // compute position of mode switch relative to toolbar and object library
  useEffect(() => {
    function compute() {
      const toolbar = document.querySelector('.toolbar');
      const objectLib = document.querySelector('.object-library');
      const workspaceEl = document.querySelector('.workspace');

      const toolbarRect = toolbar ? toolbar.getBoundingClientRect() : { bottom: 0 };
      const libRect = objectLib ? objectLib.getBoundingClientRect() : { right: 0 };
      const workspaceRect = workspaceEl ? workspaceEl.getBoundingClientRect() : { left: 0, top: 0 };

      // position the switch inside the workspace: top just below toolbar, left just right of object library
      const top = Math.max(toolbarRect.bottom - workspaceRect.top + 8, 8);
      const left = Math.max(libRect.right - workspaceRect.left + 8, 8);

      setModeSwitchStyle({ position: 'absolute', top: `${top}px`, left: `${left}px`, zIndex: 0 });
    }

    compute();

    const ro = new ResizeObserver(compute);
    const toolbar = document.querySelector('.toolbar');
    const objectLib = document.querySelector('.object-library');
    if (toolbar) ro.observe(toolbar);
    if (objectLib) ro.observe(objectLib);
    ro.observe(document.documentElement);

    window.addEventListener('resize', compute);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  return (
    <div className="workspace">
      {mode === "logical" ? (
        <LogicalMode ref={logicalRef} />
      ) : (
        <PhysicalMode />
      )}

  <ModeSwitch currentMode={mode} onModeChange={(m) => setMode(m)} style={modeSwitchStyle} />
    </div>
  );
}
