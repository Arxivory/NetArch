import { createContext, useContext, useState } from "react";

const HierarchyContext = createContext();

export function HierarchyProvider({ children }) {
  const [hierarchy, setHierarchy] = useState([
    {
      id: 1,
      label: "Centro Escolar University Manila",
      type: "domain",
      children: [
        {
          id: 2,
          label: "Librada Avelino Hall",
          type: "building",
          children: [
            {
              id: 3,
              label: "1st Floor",
              type: "floor",
              children: [
                {
                  id: 4,
                  label: "Room 100",
                  type: "room",
                  children: [],
                },
                {
                  id: 5,
                  label: "Room 101",
                  type: "room",
                  children: [],
                },
              ],
            },
          ],
        },
      ],
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
