import { useState, useEffect } from "react";
import appState from "../state/AppState"; 
import { Mountain, Grid, ChevronRight, ChevronDown, Building, Server, Box, Layers, CopyPlus, Wifi } from "lucide-react";
import FloorSpecifier from "./FloorSpecifier";

const icons = {
  domain: Mountain,
  site: Building,
  floor: Box,
  space: Grid,
  rack: Server,
  device: Wifi,
};

export default function TreeItem({ node }) {
  const [open, setOpen] = useState(true);
  const [isFocused, setIsFocused] = useState(appState.selection.isFocused(node.id));
  const [specifierOpen, setSpecifierOpen] = useState(false);
  const [floorSpecifierCount, setFloorSpecifierCount] = useState(0);

  useEffect(() => {
    const unsubscribe = appState.selection.subscribe((store) => {
      setIsFocused(store.isFocused(node.id));
    });
    return unsubscribe;
  }, [node.id]);

  const Icon = icons[node.type] || Box;
  const hasChildren = node.children && node.children.length > 0;

  const handleRowClick = (e) => {
    appState.selection.focusedNode(node.id, node.type);
    
    // maintain active floor when clicking sites or floors
    if (node.type === "floor") {
      appState.ui.setActiveFloor(node.id);
    } else if (node.type === "site") {
      const floors = appState.structural.getFloorsBySite(node.id);
      if (floors && floors.length) {
        appState.ui.setActiveFloor(floors[0].id);
      } else {
        appState.ui.setActiveFloor(null);
      }
    } else if (node.type === "device") {
      // When clicking a device, set the active floor to its floor
      if (node.floorId) {
        appState.ui.setActiveFloor(node.floorId);
      }
    } else {
      // Clear active floor when clicking domain, space, or other types
      appState.ui.setActiveFloor(null);
    }
  };

  const toggleOpen = (e) => {
    e.stopPropagation(); 
    setOpen(!open);
  };

  return (
    <div className={`tree-item ${isFocused ? "focused" : ""}`}>
      <div 
        className={`tree-item-row ${isFocused ? "selected-bg" : ""}`} 
        onClick={handleRowClick}
      >
        <div className="tree-item-wrapper">
          <div className="chevron-label">
            <div className="chevron-wrapper" onClick={toggleOpen}>
              {hasChildren ? (
                open ? <ChevronDown size={14} className="tree-chevron" /> : <ChevronRight size={14} className="tree-chevron" />
              ) : (
                <span className="tree-spacer" />
              )}
            </div>

          
            {Icon && <Icon size={14} className="tree-icon" />}
            <span className="item-label">{node.label}</span>
          </div>

          {node.type === 'site' && <CopyPlus size={12} onClick={() => setSpecifierOpen(!specifierOpen)}/>}
        </div>
        
      </div>

      {open && (
        <div className="tree-children">
          {hasChildren &&
            node.children.map((child) => (
              <TreeItem key={child.id} node={child} />
            ))}
          {node.type === "site" && specifierOpen && (
              <FloorSpecifier parentId={node.id} onCloseModal={() => { setSpecifierOpen(!specifierOpen); setFloorSpecifierCount(floorSpecifierCount + 1)}} floorCount={floorSpecifierCount} />
          )}
        </div>
      )}
    </div>
  );
}