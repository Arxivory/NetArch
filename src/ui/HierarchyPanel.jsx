import { useHierarchy } from "./HierarchyContext";
import TreeItem from "./TreeItem";

export default function HierarchyPanel() {
  const { hierarchy } = useHierarchy();

  return (
    <div className="hierarchy-panel text-xs border-l border-gray-300 bg-white">
      <h3 className="panel-header font-semibold px-2 py-1 border-b border-gray-200">
        Hierarchy
      </h3>
      <div className="p-2">
        {hierarchy.map((node) => (
          <TreeItem key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
