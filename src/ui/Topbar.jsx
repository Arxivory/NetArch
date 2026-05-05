import React, { useState, useRef, useEffect } from "react";
import {
  newProject,
  saveProject,
  openProject,
  undo,
  redo
} from "../actions/projectActions";
// import { importProject } from "../../core/LogicalCanvasController";
// import { exportProject, importProject } from "../../core/LogicalCanvasController";
import { exportProject, importProject } from "../core/LogicalCanvasController";

export default function Topbar({ canvasController }) {

  const [openMenu, setOpenMenu] = useState(null);
  const topbarRef = useRef(null);

  const menuItems = {
    File: ["New Project", "Open...", "Save", "Export"],
    Edit: ["Undo", "Redo", "Cut", "Copy", "Paste"],
    View: ["Zoom In", "Zoom Out", "Reset View", "Toggle Grid"],
    Tools: ["Measure", "Calculate", "Settings"]
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (topbarRef.current && !topbarRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className="topbar-container" ref={topbarRef}>
      <div className="topbar-group">
        {Object.keys(menuItems).map((menu) => (
          <div key={menu} className="dropdown-container">
            <button
              className={`topbar-button ${openMenu === menu ? "active" : ""}`}
              onClick={() => toggleMenu(menu)}
            >
              {menu}
            </button>

            {openMenu === menu && (
              <div className="dropdown-panel topbar-dropdown">
                {menuItems[menu].map((item) => (
                  <button
                    key={item}
                    className="dropdown-item"
                    onClick={async () => {
                      setOpenMenu(null);

                      switch (item) {
                        case "New Project":
                          newProject(canvasController);
                          break;

                        case "Save":
                          try {
                            const result = await saveProject();
                            console.log("Saved:", result);
                          } catch (err) {
                            console.error(err);
                          }
                          break;

                        case "Open...":
                          await openProject(canvasController);
                          break;

                        case "Undo":
                          undo(canvasController);
                          break;

                        case "Redo":
                          redo(canvasController);
                          break;

                        default:
                          console.log("Unhandled menu:", item);
                      }
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}