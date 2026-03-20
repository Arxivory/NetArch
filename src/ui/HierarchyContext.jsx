import { createContext, useContext, useState, useEffect } from "react";
import appState from "../state/AppState";

const HierarchyContext = createContext();

export function HierarchyProvider({ children }) {
  const [hierarchy, setHierarchy] = useState([]);

  useEffect(() => {
    const tree = appState.structural.getHierarchyTree(appState.network);
    setHierarchy(tree);

    const unsubscribeStructural = appState.structural.subscribe(() => {
      const updatedTree = appState.structural.getHierarchyTree(appState.network);
      setHierarchy(updatedTree);
    });

    const unsubscribeNetwork = appState.network.subscribe(() => {
      const updatedTree = appState.structural.getHierarchyTree(appState.network);
      setHierarchy(updatedTree);
    });

    return () => {
      unsubscribeStructural();
      unsubscribeNetwork();
    };
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
      const added = appState.structural.addFloor({ ...newNode, siteId: parentId });
      if (added && added.id) {
        appState.ui.setActiveFloor(added.id);
      }
    } else if (type === 'space') {
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
