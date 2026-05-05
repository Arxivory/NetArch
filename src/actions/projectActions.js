import { exportProject, importProject } from "../core/LogicalCanvasController";
import appState from "../state/AppState";

// export const newProject = (canvasController, restartCanvas) => {
//   const confirmNew = window.confirm(
//     "Start a new project? Unsaved changes will be lost."
//   );
//   if (!confirmNew) return;

//   canvasController?.destroy?.();

//   appState.reset?.();
//   appState.structural.clear?.();
//   appState.selection.clear?.();
//   appState.history?.clear?.();

//   restartCanvas?.();

//   importProject({ domains: [] });
// };

// export const newProject = (canvasController) => {
//   const confirmNew = window.confirm(
//     "Start a new project? Unsaved changes will be lost."
//   );

//   if (!confirmNew) return;

//   // 🔥 HARD RESET STATE
//   appState.reset?.(); // if you have reset method

//   appState.structural.clear?.();
//   appState.selection.clear?.();
//   appState.history?.clear?.();

//   canvasController?.reset?.();

//   importProject({ domains: [] }, canvasController);
// };

export const newProject = (canvasController) => {
  if (!window.confirm("Start a new project?")) return;

  appState.reset();

  canvasController.reset();

  importProject({ domains: [] }, canvasController);
};

export const saveProject = async () => {
  const data = exportProject();
  return await window.api.saveFile(data);
};

export const openProject = async () => {
  if (!window.api?.openFile) {
    console.error("openFile API not available");
    return;
  }

  const data = await window.api.openFile();
  if (!data) return;

  importProject(data);
};

export const undo = (canvasController) => {
  if (canvasController?.undo) {
    canvasController.undo();
  }
};

export const redo = (canvasController) => {
  if (canvasController?.redo) {
    canvasController.redo();
  }
};

export const canUndo = () => appState.canUndo();
export const canRedo = () => appState.canRedo();