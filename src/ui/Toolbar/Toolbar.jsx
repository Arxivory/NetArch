// import {Undo2, Redo2} from 'lucide-react';
// import {
//   Mountain, Building, Grid, RectangleHorizontal, House, DoorOpen,
//   Square, Play, File, FilePlus, Save, MousePointer, Hand, ZoomIn, ZoomOut, Trash2,// <-- Added Trash2
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import appState from "../../state/AppState";
// import {
//   StartDrawRectangleCommand, StartDrawCircleCommand, StartDrawPolygonCommand, StartDrawFreeformCommand, StartDrawWallCommand,
//   StartSelectCommand, StartPanCommand, StartZoomInCommand, StartZoomOutCommand, CancelDrawingCommand
// } from "../../core/editor/DrawingCommands";
// import StructuralOption from "./StructuralOption";

// export default function Toolbar({ canvasController }) {
//   const [activeTool, setActiveTool] = useState("select");

//   // 1. Update the state hooks
// const [canUndo, setCanUndo] = useState(false);
// const [canRedo, setCanRedo] = useState(false);
// useEffect(() => {
//   // 2. Subscribe directly to the global appState
//   // Your AppState calls notifyListeners() whenever this.commands updates
//   const unsubscribe = appState.subscribe((state) => {
//     setCanUndo(state.canUndo()); // Uses the delegation methods in your AppState.js
//     setCanRedo(state.canRedo());
//   });

//   // Set initial state
//   setCanUndo(appState.canUndo());
//   setCanRedo(appState.canRedo());

//   return unsubscribe;
// }, []);

// // 3. Update the handler functions to use your AppState delegation
// // const handleUndo = () => {
// //   if (canvasController?.undo) {
// //     canvasController.undo();
// //   }
// // };

// const handleUndo = () => {
//   const cmd = appState.undo();
//   if (cmd && cmd.undo) cmd.undo();
// };


// // const handleRedo = () => {
// //   if (canvasController?.redo) {
// //     canvasController.redo();
// //   }
// // };
// const handleRedo = () => {
//   const cmd = appState.redo();
//   if (cmd && cmd.execute) cmd.execute();
// };

//   useEffect(() => {
//     const unsubscribe = appState.tools.subscribe(() => {
//       setActiveTool(appState.tools.getActiveTool() || "select");
//     });
//     return unsubscribe;
//   }, []);

//   const executeCommand = (Command, ...args) => {
//     if (!canvasController) return;
//     const cmd = new Command(canvasController, appState, ...args);
//     cmd.execute();
//   };

//   const isActive = (mode) => activeTool === mode;

// const handleDelete = () => {
//     if (!appState || !appState.selection) return;

//     let ids = appState.selection.getSelectedDeviceIds();
//     if (!ids || ids.length === 0) {
//       const focused = appState.selection.getFocusedId();
//       if (focused) ids = [focused];
//     }

//     if (ids && ids.length > 0) {
//       // BEHAVIOR 1: Something is selected. Delete it instantly!
//       if (canvasController && canvasController.executeDelete) {
//           canvasController.executeDelete(ids[0]);
//       }
//     } else {
//       // BEHAVIOR 2: Nothing is selected. Toggle "Delete Mode" on/off!
//       if (appState.tools) {
//           const isDeleteMode = appState.tools.activeTool === 'delete';
          
//           if (isDeleteMode) {
//               executeCommand(StartSelectCommand);
//               appState.tools.setActiveTool('select');
//           } else {
//               executeCommand(StartSelectCommand); 
//               appState.tools.setActiveTool('delete');
//           }
//       }
//     }
//   };

//   const handleStructuralShape = (structureType, shape) => {
//     if (!canvasController) return;

//     let Command;
//     switch (shape) {
//       case "Rectangle":
//         Command = StartDrawRectangleCommand;
//         break;
//       case "Circular":
//         Command = StartDrawCircleCommand;
//         break;
//       case "Polygon":
//         Command = StartDrawPolygonCommand;
//         break;
//       // case "Freeform":
//       //   Command = StartDrawFreeformCommand;
//       //   break;
//       default:
//         Command = StartDrawRectangleCommand;
//     }

//     const cmd = new Command(canvasController, appState, structureType);
//     cmd.execute();
//     appState.tools.setActiveTool(structureType.toLowerCase());
//   };

//   return (
//     <div className="toolbar">
//       <div className="toolbar-group">
//         <div className="toolbar-row">
//           <button className="toolbar-btn"><FilePlus size={16} /> New</button>
//           <button className="toolbar-btn"><File size={16} /> Open</button>
//           <button className="toolbar-btn"><Save size={16} /> Save</button>
//         </div>
//         <span className="toolbar-label">Files</span>
//       </div>

//       <div className="toolbar-divider" />

//       <div className="toolbar-group">
//         <div className="toolbar-row">
//           <button
//             onClick={() => executeCommand(StartSelectCommand)}
//             className={`toolbar-btn ${isActive("select") ? "active" : ""}`}
//           >
//             <MousePointer size={16} /> Select
//           </button>
//          <button 
//             onClick={handleDelete} 
//             className={`toolbar-btn ${isActive("delete") ? "active" : ""}`} 
//             title="Delete Selected or Toggle Eraser"
//           >
//             <Trash2 size={16} /> Delete
//           </button>
//           <button
//             onClick={() => executeCommand(StartPanCommand)}
//             className={`toolbar-btn ${isActive("pan") ? "active" : ""}`}
//           >
//             <Hand size={16} /> Pan
//           </button>
//           <button
//             onClick={() => executeCommand(StartZoomInCommand)}
//             className={`toolbar-btn ${isActive("zoom in") ? "active" : ""}`}>
//             <ZoomIn size={16} /> Zoom in
//           </button>
//           <button
//             onClick={() => executeCommand(StartZoomOutCommand)}
//             className={`toolbar-btn ${isActive("zoom out") ? "active" : ""}`}>
//             <ZoomOut size={16} /> Zoom out
//           </button>
          
//         </div>
//         <span className="toolbar-label">Controls</span>
//       </div>

//       <div className="toolbar-divider" />

//       <div className="toolbar-group">
//         <div className="toolbar-row">
//           <StructuralOption
//             label="Domain" icon={Mountain} isActive={activeTool === "domain"}
//             onSelectShape={(shape) => handleStructuralShape('Domain', shape)}
//           />
//           <StructuralOption
//             label="Site" icon={Building} isActive={activeTool === "site"}
//             onSelectShape={(shape) => handleStructuralShape('Site', shape)}
//           />
//           <StructuralOption
//             label="Space" icon={Grid} isActive={activeTool === "space"}
//             onSelectShape={(shape) => handleStructuralShape('Space', shape)}
//           />
//         </div>
//         <span className="toolbar-label">Structure</span>
//       </div>

//       <div className="toolbar-divider" />

//       <div className="toolbar-group">
//         <div className="toolbar-row">
//           <button
//             onClick={() => executeCommand(StartDrawWallCommand)}
//             className={`toolbar-btn ${isActive("wall") ? "active" : ""}`}
//           >
//             <RectangleHorizontal size={16} /> Wall
//           </button>
//           <button className="toolbar-btn"><House size={16} /> Roof</button>
//           <button className="toolbar-btn"><DoorOpen size={16} /> Door</button>
//           <button className="toolbar-btn"><Square size={16} /> Window</button>
//         </div>
//         <span className="toolbar-label">Fenestration</span>
//       </div>

//       <div className="toolbar-group ml-auto">
//         <button className="simulate-btn">
//           <Play size={16} /> Simulate
//         </button>
//         <span className="toolbar-label invisible">Simulate</span>
//       </div>
//     </div>
//   );
// }



import { Undo2, Redo2 } from "lucide-react"; // Add to existing lucide-react imports
import {
  Mountain, Building, Grid, RectangleHorizontal, House, DoorOpen,
  Square, Play, File, FilePlus, Save, MousePointer, Hand, ZoomIn, ZoomOut, Trash2 // <-- Added Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { exportProject, importProject } from "../../core/LogicalCanvasController";
import appState from "../../state/AppState";
import {
  StartDrawRectangleCommand, StartDrawCircleCommand, StartDrawPolygonCommand, StartDrawFreeformCommand, StartDrawWallCommand,
  StartSelectCommand, StartPanCommand, StartZoomInCommand, StartZoomOutCommand, CancelDrawingCommand,
  StartDrawDoorCommand, StartDrawWindowCommand
} from "../../core/editor/DrawingCommands";
import StructuralOption from "./StructuralOption";

export default function Toolbar({ canvasController }) {
  const [activeTool, setActiveTool] = useState("select");

  // 1. Update the state hooks
const [canUndo, setCanUndo] = useState(false);
const [canRedo, setCanRedo] = useState(false);
const handleSave = async () => {
  try {
    const data = exportProject();
    await window.api.saveFile(data);
  } catch (err) {
    console.error("Save failed:", err);
  }
};

const handleOpen = async () => {
  try {
    const data = await window.api.openFile();
    if (!data) return;

    importProject(data);
  } catch (err) {
    console.error("Open failed:", err);
  }
};

const handleNew = () => {
  if (window.confirm("Start a new project? Unsaved changes will be lost.")) {
    importProject({ domains: [] });
  }
};
useEffect(() => {
  // 2. Subscribe directly to the global appState
  // Your AppState calls notifyListeners() whenever this.commands updates
  const unsubscribe = appState.subscribe((state) => {
    setCanUndo(state.canUndo()); // Uses the delegation methods in your AppState.js
    setCanRedo(state.canRedo());
  });

  // Set initial state
  setCanUndo(appState.canUndo());
  setCanRedo(appState.canRedo());

  return unsubscribe;
}, []);

// 3. Update the handler functions to use your AppState delegation
const handleUndo = () => {
  if (canvasController?.undo) {
    canvasController.undo();
  }
};

const handleRedo = () => {
  if (canvasController?.redo) {
    canvasController.redo();
  }
};

  useEffect(() => {
    const unsubscribe = appState.tools.subscribe(() => {
      setActiveTool(appState.tools.getActiveTool() || "select");
    });
    return unsubscribe;
  }, []);

  const executeCommand = (Command, ...args) => {
    if (!canvasController) return;
    const cmd = new Command(canvasController, appState, ...args);
    cmd.execute();
  };

  const isActive = (mode) => activeTool === mode;

const handleDelete = () => {
    if (!appState || !appState.selection) return;

    let ids = appState.selection.getSelectedDeviceIds();
    if (!ids || ids.length === 0) {
      const focused = appState.selection.getFocusedId();
      if (focused) ids = [focused];
    }

    if (ids && ids.length > 0) {
      // BEHAVIOR 1: Something is selected. Delete it instantly!
      if (canvasController && canvasController.executeDelete) {
          canvasController.executeDelete(ids[0]);
      }
    } else {
      // BEHAVIOR 2: Nothing is selected. Toggle "Delete Mode" on/off!
      if (appState.tools) {
          const isDeleteMode = appState.tools.activeTool === 'delete';
          
          if (isDeleteMode) {
              executeCommand(StartSelectCommand);
              appState.tools.setActiveTool('select');
          } else {
              executeCommand(StartSelectCommand); 
              appState.tools.setActiveTool('delete');
          }
      }
    }
  };

  const handleStructuralShape = (structureType, shape) => {
    if (!canvasController) return;

    let Command;
    switch (shape) {
      case "Rectangle":
        Command = StartDrawRectangleCommand;
        break;
      case "Circular":
        Command = StartDrawCircleCommand;
        break;
      case "Polygon":
        Command = StartDrawPolygonCommand;
        break;
      default:
        Command = StartDrawRectangleCommand;
    }

    const cmd = new Command(canvasController, appState, structureType);
    cmd.execute();
    appState.tools.setActiveTool(structureType.toLowerCase());
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <div className="toolbar-row">
          <button className="toolbar-btn" onClick={handleNew}>
            <FilePlus size={16} /> New
          </button>
          <button className="toolbar-btn" onClick={handleOpen}>
            <File size={16} /> Open
          </button>
          <button className="toolbar-btn" onClick={handleSave}>
            <Save size={16} /> Save
          </button>

          <div className="toolbar-v-separator" /> 
          <button 
  className="toolbar-btn-icon" 
  onClick={handleUndo}
  title="Undo (Ctrl+Z)"
>
  <Undo2 size={16} className={!canUndo ? "opacity-20" : ""} />
</button>

<button 
  className="toolbar-btn-icon" 
  onClick={handleRedo} 
  title="Redo (Ctrl+Y)"
>
  <Redo2 size={16} className={!canRedo ? "opacity-20" : ""} />
</button>
        </div>
        <span className="toolbar-label">Files</span>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="toolbar-row">
          <button
            onClick={() => executeCommand(StartSelectCommand)}
            className={`toolbar-btn ${isActive("select") ? "active" : ""}`}
          >
            <MousePointer size={16} /> Select
          </button>
         <button 
            onClick={handleDelete} 
            className={`toolbar-btn ${isActive("delete") ? "active" : ""}`} 
            title="Delete Selected or Toggle Eraser"
          >
            <Trash2 size={16} /> Delete
          </button>
          <button
            onClick={() => executeCommand(StartPanCommand)}
            className={`toolbar-btn ${isActive("pan") ? "active" : ""}`}
          >
            <Hand size={16} /> Pan
          </button>
          <button
            onClick={() => executeCommand(StartZoomInCommand)}
            className={`toolbar-btn ${isActive("zoom in") ? "active" : ""}`}>
            <ZoomIn size={16} /> Zoom in
          </button>
          <button
            onClick={() => executeCommand(StartZoomOutCommand)}
            className={`toolbar-btn ${isActive("zoom out") ? "active" : ""}`}>
            <ZoomOut size={16} /> Zoom out
          </button>
          
        </div>
        <span className="toolbar-label">Controls</span>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="toolbar-row">
          <StructuralOption
            label="Domain" icon={Mountain} isActive={activeTool === "domain"}
            onSelectShape={(shape) => handleStructuralShape('Domain', shape)}
          />
          <StructuralOption
            label="Site" icon={Building} isActive={activeTool === "site"}
            onSelectShape={(shape) => handleStructuralShape('Site', shape)}
          />
          <StructuralOption
            label="Space" icon={Grid} isActive={activeTool === "space"}
            onSelectShape={(shape) => handleStructuralShape('Space', shape)}
          />
        </div>
        <span className="toolbar-label">Structure</span>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="toolbar-row">
          <button
            onClick={() => executeCommand(StartDrawWallCommand)}
            className={`toolbar-btn ${isActive("wall") ? "active" : ""}`}
          >
            <RectangleHorizontal size={16} /> Wall
          </button>
          <button className="toolbar-btn"
            onClick={() => executeCommand(StartDrawDoorCommand)}
            className={`toolbar-btn ${isActive("door") ? "active" : ""}`}
          ><DoorOpen size={16}/> Door</button>
          <button className="toolbar-btn"
            onClick={() => executeCommand(StartDrawWindowCommand)}
            className={`toolbar-btn ${isActive("window") ? "active" : ""}`}
          ><Square size={16} /> Window</button>
        </div>
        <span className="toolbar-label">Fenestration</span>
      </div>

      <div className="toolbar-group ml-auto">
        <button className="simulate-btn">
          <Play size={16} /> Simulate
        </button>
        <span className="toolbar-label invisible">Simulate</span>
      </div>
    </div>
  );
}