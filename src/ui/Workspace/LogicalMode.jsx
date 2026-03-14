import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import LogicalCanvasController from "../../core/LogicalCanvasController";
import appState from "../../state/AppState";

const LogicalMode = forwardRef(function LogicalMode(
  { className = "", style = {}, gridSize = 24, snap = true, canvasControllerRef },
  ref
) {
  const containerRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    controllerRef.current = new LogicalCanvasController(container, {
      width: Math.max(rect.width, 1),
      height: Math.max(rect.height, 1),
      gridSize,
      snap
    });

    if (canvasControllerRef) {
      canvasControllerRef.current = controllerRef.current;
    }

    const handleResize = () => {
      if (!controllerRef.current || !container) return;
      const r = container.getBoundingClientRect();
      controllerRef.current.setSize(Math.max(r.width, 1), Math.max(r.height, 1));
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      ro.disconnect();
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [gridSize, snap, canvasControllerRef]);

  useEffect(() => {
    const handleUpdate = () => {
      if (controllerRef.current) {
        const isFocusedOnFloor = appState.selection.focusedType === 'floor';
        const floorId = isFocusedOnFloor ? appState.ui.activeFloorId : null;
        controllerRef.current.setActiveFloor(floorId);
      }
    };

    const unsubUi = appState.ui.subscribe(() => {
      handleUpdate();
    });

    const unsubSel = appState.selection.subscribe(() => {
      handleUpdate();
    });

    return () => {
      unsubUi();
      unsubSel();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    startDrawRectangle: (type) => controllerRef.current?.startDrawRectangle(type),
    startDrawCircle: (type) => controllerRef.current?.startDrawCircle(type),
    startDrawWall: () => controllerRef.current?.startDrawWall(),
    startDrawCable: () => controllerRef.current?.startDrawCable(),
    startDrawPolygon: (type) => controllerRef.current?.startDrawPolygon(type),
    cancelDrawing: () => controllerRef.current?.cancelDrawing(),
    addDevice: (data, x, y) => controllerRef.current?.addDevice(data, x, y),
    enableSnap: (v) => controllerRef.current?.enableSnap(v),
    setGridSize: (n) => controllerRef.current?.setGridSize(n),
    clear: () => controllerRef.current?.clear(),
    getSnappedCoords: (x, y) => controllerRef.current?.getSnappedCoords(x, y),
  }));

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

const onDrop = (event) => {
  event.preventDefault();
  
  const dataString = event.dataTransfer.getData("application/reactflow");
  if (!dataString) return;

  try {
    const data = JSON.parse(dataString);
    // data is now: { type: "Switches", modelId: "2960", label: "Cisco Catalyst 2960" }

    const coords = controllerRef.current?.getSnappedCoords(event.clientX, event.clientY);
    
    if (coords && controllerRef.current) {
      console.log('From Logical Mode Data: ', data.label);
      controllerRef.current.addDevice(data, coords.x, coords.y);
    }
  } catch (err) {
    console.error("Error dropping device:", err);
  }
};

  return (
    <div
      ref={containerRef}
      className={("logical-mode-container " + className).trim()}
      style={style}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
});

export default LogicalMode;
