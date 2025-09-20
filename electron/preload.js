// Safe bridge between React (renderer) and Node (main)
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Add custom APIs here later
});
