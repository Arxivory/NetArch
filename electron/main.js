console.log("Electron started");

const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { dialog, ipcMain } = require("electron");
const fs = require("fs");

console.log("Electron main.js started");

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, 'netarch-logo.png'), 
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  Menu.setApplicationMenu(null);

  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";

  console.log("Loading URL:", startUrl);
  win.loadURL(startUrl);

  win.webContents.on("did-fail-load", () => {
    console.log("Retrying connection...");
    setTimeout(() => {
      win.loadURL(startUrl);
    }, 500);
  });
}

ipcMain.handle("save-file", async (event, data) => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: "NetArch Project", extensions: ["netarch"] }]
  });

  if (!filePath) return null;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
});

ipcMain.handle("open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "NetArch Project", extensions: ["netarch"] }],
    properties: ["openFile"]
  });

  if (canceled) return null;

  const content = fs.readFileSync(filePaths[0], "utf-8");
  return JSON.parse(content);
});

app.whenReady().then(() => {
  console.log("App ready");
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
