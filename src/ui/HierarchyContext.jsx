import { createContext, useContext, useState } from "react";

const HierarchyContext = createContext();

export function HierarchyProvider({ children }) {
  const [hierarchy, setHierarchy] = useState([
    {
      id: 1,
      label: "Centro Escolar University Manila",
      type: "domain",
      children: [],
    },
  ]);

  const addNode = (parentId, type, label) => {
    const newNode = {
      id: Date.now(),
      label,
      type,
      children: [],
    };

    function addRecursive(nodes) {
      return nodes.map((n) => {
        if (n.id === parentId) {
          return { ...n, children: [...n.children, newNode] };
        }
        return { ...n, children: addRecursive(n.children) };
      });
    }

    setHierarchy((prev) => addRecursive(prev));
  };

  return (
    <HierarchyContext.Provider value={{ hierarchy, addNode }}>
      {children}
    </HierarchyContext.Provider>
  );
}

export const useHierarchy = () => useContext(HierarchyContext);
