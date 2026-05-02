const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  saveFile: (data) => ipcRenderer.invoke("save-file", data),
  openFile: () => ipcRenderer.invoke("open-file"),
});