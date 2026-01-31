import { useState } from "react";
import {
  Mountain,
  Grid,
  ChevronRight,
  ChevronDown,
  Building,
  Layers,
  Server,
  Box,
} from "lucide-react";

const icons = {
  domain: Mountain,
  site: Building,
  space: Grid,
  rack: Server,
  device: Box,
};

export default function TreeItem({ node }) {
  const [open, setOpen] = useState(true);
  const Icon = icons[node.type] || Box;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="tree-item">
      <div
        className="tree-item-label"
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="tree-item-chevron" />
          ) : (
            <ChevronRight className="tree-item-chevron" />
          )
        ) : (
          <span className="tree-item-placeholder" />
        )}
        {Icon && <Icon className="tree-item-icon" />}
        <span className="item">{node.label}</span>
      </div>
      {open &&
        hasChildren &&
        node.children.map((child) => (
          <TreeItem key={child.id} node={child} />
        ))}
    </div>
  );
}
