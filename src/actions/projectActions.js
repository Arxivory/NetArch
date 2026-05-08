import { exportProject, importProject } from "../core/LogicalCanvasController";
import appState from "../state/AppState";


const isElectron = () => typeof window !== "undefined" && !!window.api?.saveFile;

const browserDownload = (data, filename = "project.netarch") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const browserOpen = () =>
  new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".netarch,.json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try { resolve(JSON.parse(ev.target.result)); }
        catch { reject(new Error("Invalid file — could not parse JSON.")); }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsText(file);
    };
    input.click();
  });

// ─── Full Canvas Purge ───────────────────────────────────────────────────────
// Dispatches forceCanvasDelete for every structural + network item BEFORE
// clearing state arrays, so the 3D scene can find & remove meshes while
// they still exist in the store. This fixes the ghost-overlap bug on New Project.
const purgeCanvasEntities = () => {
  const s = appState.structural;

  const ids = [
    ...(s.domains || []).map(d => d.id),
    ...(s.sites || []).map(x => x.id),
    ...(s.floors || []).map(x => x.id),
    ...(s.spaces || []).map(x => x.id),
    ...(s.walls || []).map(x => x.id),
    ...(s.doors || []).map(x => x.id),
    ...(s.windows || []).map(x => x.id),
    ...(s.conduits || []).map(x => x.id),
    ...(s.risers || []).map(x => x.id),
    ...(s.undergroundConduits || []).map(x => x.id),
    ...(appState.network.devices || []).map(d => d.id),
    ...(appState.network.links || []).map(l => l.id),
  ];

  ids.forEach(id => {
    window.dispatchEvent(new CustomEvent('forceCanvasDelete', { detail: { id } }));
  });
};

// ─── File Actions ────────────────────────────────────────────────────────────

export const newProject = (canvasController) => {
  if (!window.confirm("Start a new project? Unsaved changes will be lost.")) return;

  try {
    // Step 1: Fire canvas delete events while meshes still exist in state
    purgeCanvasEntities();

    // Step 2: Give the canvas one frame to process, then wipe state
    setTimeout(() => {
      try {
        appState.structural.clear?.();

        appState.network.devices = [];
        appState.network.links = [];
        appState.network.notify?.();

        if (appState.furniture?.furnitures) {
          appState.furniture.furnitures = [];
          appState.furniture.notify?.();
        }

        appState.selection.clearSelection?.();
        appState.commands.clearHistory?.();
        appState.ui.setActiveFloor?.(null);

        canvasController?.reset?.();

        importProject({ domains: [] }, canvasController);
        console.log("New project created.");
      } catch (err) {
        console.error("New project state reset failed:", err);
        alert("Failed to reset the project. Please reload the app.");
      }
    }, 50);

  } catch (err) {
    console.error("New project purge failed:", err);
    alert("Failed to clear the canvas. Please try again.");
  }
};

export const saveProject = async () => {
  try {
    const data = exportProject();
    if (isElectron()) {
      const result = await window.api.saveFile(data);
      console.log("Saved (Electron):", result);
      return result;
    } else {
      const projectName = appState.network?.metadata?.name || "project";
      browserDownload(data, `${projectName}.netarch`);
      console.log("Saved (browser download)");
      return { success: true };
    }
  } catch (err) {
    console.error("Save failed:", err);
    alert(`Save failed: ${err.message}`);
    throw err;
  }
};

export const openProject = async (canvasController) => {
  try {
    let data = null;
    if (isElectron()) {
      if (!window.api?.openFile) { console.error("openFile API not available"); return; }
      data = await window.api.openFile();
    } else {
      data = await browserOpen();
    }
    if (!data) return;
    if (!data.state && !data.domains) {
      alert("Invalid project file. Please select a valid .netarch or .json file.");
      return;
    }
    importProject(data, canvasController);
    console.log("Project opened successfully.");
  } catch (err) {
    console.error("Open failed:", err);
    alert(`Open failed: ${err.message}`);
  }
};

export const importProjectFile = async (canvasController) => {
  try {
    let data = null;
    if (isElectron() && window.api?.openFile) {
      data = await window.api.openFile();
    } else {
      data = await browserOpen();
    }
    if (!data) return;
    if (!data.state && !data.domains) {
      alert("Unsupported file format. Please import a valid .netarch or .json file.");
      return;
    }
    importProject(data, canvasController);
    console.log("Project imported successfully.");
  } catch (err) {
    console.error("Import failed:", err);
    alert(`Import failed: ${err.message}`);
  }
};

export const exportProjectAs = async (format = "json") => {
  try {
    const data = exportProject();
    const projectName = appState.network?.metadata?.name || "project";
    if (format === "json") {
      if (isElectron() && window.api?.saveFile) {
        await window.api.saveFile(data);
      } else {
        browserDownload(data, `${projectName}.netarch`);
      }
      return { success: true };
    }
    if (format === "png") {
      const canvas = document.querySelector("canvas");
      if (!canvas) { alert("No canvas found to export."); return; }
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
      return { success: true };
    }
    alert(`Export format "${format}" is not supported yet.`);
  } catch (err) {
    console.error("Export failed:", err);
    alert(`Export failed: ${err.message}`);
    throw err;
  }
};

export const undo = (canvasController) => {
  if (canvasController?.undo) canvasController.undo();
};

export const redo = (canvasController) => {
  if (canvasController?.redo) canvasController.redo();
};

export const canUndo = () => appState.canUndo();
export const canRedo = () => appState.canRedo();
