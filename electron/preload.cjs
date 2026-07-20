const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("everything", {
  status: () => ipcRenderer.invoke("everything:status"),
  search: (options) => ipcRenderer.invoke("everything:search", options),
  openNative: () => ipcRenderer.invoke("everything:openNative"),
  openFile: (path) => ipcRenderer.invoke("file:open", path),
  revealFile: (path) => ipcRenderer.invoke("file:reveal", path),
  openFolder: (path) => ipcRenderer.invoke("file:folder", path),
  copyPath: (path) => ipcRenderer.invoke("file:copyPath", path),
  getIcon: (item) => ipcRenderer.invoke("file:icon", item),
  listDesktopItems: () => ipcRenderer.invoke("desktop:list"),
  listFolderItems: (folder) => ipcRenderer.invoke("desktop:list-folder", folder),
  getSystemSettings: () => ipcRenderer.invoke("system:get-settings"),
  updateSystemSettings: (patch) => ipcRenderer.invoke("system:update-settings", patch),
  getLaunchMode: () => ipcRenderer.invoke("window:getLaunchMode"),
  onLaunchMode: (callback) => {
    const listener = (_event, mode) => callback(mode);
    ipcRenderer.on("window:launch-mode", listener);
    return () => ipcRenderer.removeListener("window:launch-mode", listener);
  },
  onWindowVisibility: (callback) => {
    const listener = (_event, visible) => callback(Boolean(visible));
    ipcRenderer.on("window:visibility", listener);
    return () => ipcRenderer.removeListener("window:visibility", listener);
  },
  trimMemory: () => ipcRenderer.invoke("system:trim-memory"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("window:toggleMaximize"),
  setWindowMode: (mode) => ipcRenderer.invoke("window:setMode", mode),
  close: () => ipcRenderer.invoke("window:close")
});
