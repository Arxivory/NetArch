import React, { useState, useRef, useEffect } from "react";
import {
  newProject,
  saveProject,
  openProject,
  importProjectFile,
  exportProjectAs,
  undo,
  redo
} from "../actions/projectActions";
import HelpModal from "./HelpModal";

// ─── Export Format Picker Modal ───────────────────────────────────────────────
function ExportModal({ onClose, onExport }) {
  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div className="help-modal-header">
          <h3>Export Project</h3>
          <button className="help-modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ padding: "12px 16px 4px", color: "#666", fontSize: 13 }}>
          Choose a format to export your design.
        </p>
        <div className="export-options">
          <button className="export-option-btn" onClick={() => onExport("json")}>
            <span className="export-icon">📄</span>
            <div>
              <div className="export-format-name">Project File (.netarch)</div>
              <div className="export-format-desc">Full project data — can be re-imported.</div>
            </div>
          </button>
          <button className="export-option-btn" onClick={() => onExport("png")}>
            <span className="export-icon">🖼️</span>
            <div>
              <div className="export-format-name">Image (.png)</div>
              <div className="export-format-desc">Snapshot of the current canvas view.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────────────────
export default function Topbar({ canvasController }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const topbarRef = useRef(null);

  // Help tab opens the modal directly — no dropdown needed
  const HELP_TAB = "Help";

  const menuItems = {
    File: ["New Project", "Open...", "Save", "Import", "Export"],
    Edit: ["Undo", "Redo", "Cut", "Copy", "Paste"],
    View: ["Zoom In", "Zoom Out", "Reset View", "Toggle Grid"],
    Tools: ["Measure", "Calculate", "Settings"],
  };

  const SHORTCUTS = {
    "New Project": "Ctrl+N",
    "Open...":     "Ctrl+O",
    "Save":        "Ctrl+S",
    "Undo":        "Ctrl+Z",
    "Redo":        "Ctrl+Y",
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isTyping = active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || active?.isContentEditable;
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveProject(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") { e.preventDefault(); openProject(canvasController); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") { e.preventDefault(); newProject(canvasController); }
      if (e.key === "F1") { e.preventDefault(); setShowHelp(true); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvasController]);

  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);

  const handleMenuAction = async (item) => {
    setOpenMenu(null);
    switch (item) {
      case "New Project":   newProject(canvasController); break;
      case "Save":          try { await saveProject(); } catch { } break;
      case "Open...":       await openProject(canvasController); break;
      case "Import":        await importProjectFile(canvasController); break;
      case "Export":        setShowExport(true); break;
      case "Undo":          undo(canvasController); break;
      case "Redo":          redo(canvasController); break;
      case "Zoom In":       canvasController?.zoomIn?.(); break;
      case "Zoom Out":      canvasController?.zoomOut?.(); break;
      case "Reset View":    canvasController?.resetView?.(); break;
      case "Toggle Grid":   canvasController?.toggleGrid?.(); break;
      case "Measure":       canvasController?.startMeasure?.(); break;
      case "Calculate":     canvasController?.openCalculator?.(); break;
      case "Settings":      canvasController?.openSettings?.(); break;
      default:              console.log("Unhandled:", item);
    }
  };

  const handleExport = async (format) => {
    setShowExport(false);
    try { await exportProjectAs(format); } catch { }
  };

  return (
    <>
      <div className="topbar-container" ref={topbarRef}>
        <div className="topbar-group">
          {/* Regular dropdown menus */}
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
                      onClick={() => handleMenuAction(item)}
                    >
                      <span>{item}</span>
                      {SHORTCUTS[item] && (
                        <span className="dropdown-shortcut">{SHORTCUTS[item]}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Help — opens modal directly, no dropdown */}
          <button
            className="topbar-button topbar-help-btn"
            onClick={() => { setOpenMenu(null); setShowHelp(true); }}
          >
            {HELP_TAB}
          </button>
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} onExport={handleExport} />}
    </>
  );
}
