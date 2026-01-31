import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import LogicalCanvas from "../../core/logicalcanvas";

const LogicalMode = forwardRef(function LogicalMode(
    { className = "", style = {}, gridSize = 24, snap = true },
    ref
) {
    const containerRef = useRef(null);
    const lcRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const width = Math.max(rect.width, window.innerWidth);
        const height = Math.max(rect.height, window.innerHeight);

        const lc = new LogicalCanvas({
            container,
            width,
            height,
            gridSize,
            snap,
            onRoomCreated: (room) => {
                console.log("Room created:", room);
            },
            onWallCreated: (wall) => {
                console.log("Wall created:", wall);
            },
            onCableCreated: (cable) => {
                console.log("Cable created: ", cable);
            }
        });
        lcRef.current = lc;

        function handleResize() {
            if (!lcRef.current || !container) return;
            const r = container.getBoundingClientRect();
            lcRef.current.setSize(Math.max(r.width, 1), Math.max(r.height, 1));
        }

        const ro = new ResizeObserver(handleResize);
        ro.observe(container);

        return () => {
            ro.disconnect();
            if (lcRef.current) {
                lcRef.current.destroy();
                lcRef.current = null;
            }
        };
    }, [gridSize, snap]);

    useImperativeHandle(ref, () => ({
        get instance() {
            return lcRef.current;
        },
        startDrawRoom: () => lcRef.current && lcRef.current.startDrawRoom(),
        startDrawCircle: () => lcRef.current && lcRef.current.startDrawCircle(),
        startDrawWall: () => lcRef.current && lcRef.current.startDrawWall(),
        startDrawCable: () => lcRef.current && lcRef.current.startDrawCable(),
        startDrawPolygon: () => lcRef.current && lcRef.current.startDrawPolygon(),
        cancelDrawing: () => lcRef.current && lcRef.current.cancelDrawing(),
        clear: () => lcRef.current && lcRef.current.clear(),
        addDevice: (data, x, y) => lcRef.current && lcRef.current.addDevice(data, x, y),
        enableSnap: (v) => lcRef.current && lcRef.current.enableSnap(v),
        setGridSize: (n) => lcRef.current && lcRef.current.setGridSize(n),
        enableSnap: (v) => lcRef.current && lcRef.current.enableSnap(v),
        setGridSize: (n) => lcRef.current && lcRef.current.setGridSize(n),
    }));

    

    const onDragOver = (event) => {
        event.preventDefault(); 
        event.dataTransfer.dropEffect = "move";
    };

    const onDrop = (event) => {
        event.preventDefault();

      
        const reactFlowData = event.dataTransfer.getData("application/reactflow");

        if (!reactFlowData) {
            return; 
        }
        
       
        const droppedObjectData = JSON.parse(reactFlowData);

       
        const clientX = event.clientX;
        const clientY = event.clientY;

        

        const lcInstance = lcRef.current;
        if (!lcInstance) return;

      
        const snappedCoords = lcInstance.getSnappedCanvasCoords(clientX, clientY);

        if (snappedCoords) {
           
            lcInstance.addDevice(droppedObjectData, snappedCoords.x, snappedCoords.y);
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

export { LogicalMode };
export default LogicalMode;
