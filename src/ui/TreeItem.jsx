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
    <div className="pl-2">
      <div
        className="flex items-center cursor-pointer select-none hover:bg-gray-100 rounded px-1 py-0.5"
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown size={14} className="mr-1 text-gray-600" />
          ) : (
            <ChevronRight size={14} className="mr-1 text-gray-600" />
          )
        ) : (
          <span className="w-4" />
        )}
        {Icon && <Icon size={14} className="mr-1 text-gray-700" />}
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
