import { createContext, useContext, useState, useEffect } from "react";
import appState from "../state/AppState";

const HierarchyContext = createContext();

export function HierarchyProvider({ children }) {
  const [hierarchy, setHierarchy] = useState([]);

  useEffect(() => {
    const tree = appState.structural.getHierarchyTree();
    setHierarchy(tree);

    const unsubscribe = appState.structural.subscribe(() => {
      const updatedTree = appState.structural.getHierarchyTree();
      setHierarchy(updatedTree);
    });

    return unsubscribe;
  }, []);

  const selectNode = (id, type) => {
    appState.selection.focusedNode(id, type);
  }

  const addNode = (parentId, type, label) => {
    const newNode = {
      id: Date.now(),
      label,
      type,
      children: [],
    };

    if (type === 'domain') {
      appState.structural.addDomain(newNode);
    } else if (type === 'site') {
      appState.structural.addSite({ ...newNode, domainId: parentId });
    } else if (type === 'floor') {
      appState.structural.addFloor({ ...newNode, siteId: parentId });
    } else if (type === 'space' || type === 'room') {
      appState.structural.addSpace({ ...newNode, floorId: parentId });
    }
  };

  return (
    <HierarchyContext.Provider value={{ hierarchy, addNode }}>
      {children}
    </HierarchyContext.Provider>
  );
}

export const useHierarchy = () => useContext(HierarchyContext);
