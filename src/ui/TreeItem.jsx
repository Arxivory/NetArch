import { useState, useEffect } from "react";
import appState from "../state/AppState"; 
import { Mountain, Grid, ChevronRight, ChevronDown, Building, Server, Box } from "lucide-react";

const icons = {
  domain: Mountain,
  site: Building,
  space: Grid,
  rack: Server,
  device: Box,
};

export default function TreeItem({ node }) {
  const [open, setOpen] = useState(true);
  const [isFocused, setIsFocused] = useState(appState.selection.isFocused(node.id));

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

      {open && hasChildren && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}