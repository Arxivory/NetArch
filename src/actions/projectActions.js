import { exportProject, importProject } from "../core/LogicalCanvasController";
import appState from "../state/AppState";

export const newProject = () => {
  const confirmNew = window.confirm(
    "Start a new project? Unsaved changes will be lost."
  );

  if (confirmNew) {
    importProject({ domains: [] }); 
  }
};

export const saveProject = async () => {
  const data = exportProject();
  return await window.api.saveFile(data);
};

export const openProject = async () => {
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