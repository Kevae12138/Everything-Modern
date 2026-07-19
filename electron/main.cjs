const { app, BrowserWindow, ipcMain, shell, clipboard, Menu, Tray, nativeImage, globalShortcut, screen } = require("electron");
const { spawn } = require("node:child_process");
const { existsSync, statSync, readFileSync, unlinkSync, writeFileSync, mkdirSync, readdirSync } = require("node:fs");
const { dirname, extname, join } = require("node:path");
const { tmpdir } = require("node:os");

const iconCache = new Map();
const defaultSystemSettings = {
  startAtLogin: false,
  stayInBackground: true,
  quickOpenShortcut: "Ctrl+Alt+E",
  desktopOpenShortcut: "Ctrl+Alt+D",
  showDesktopModule: false,
  showDesktopTree: true,
  showWindowTitle: true
};

let mainWindow = null;
let tray = null;
let isQuitting = false;
let systemSettings = { ...defaultSystemSettings };
let registeredShortcut = "";
let shortcutRegistered = false;
let shortcutError = "";
let registeredDesktopShortcut = "";
let desktopShortcutRegistered = false;
let desktopShortcutError = "";
let launcherCompactMode = false;
let launcherDismissibleMode = false;
let expandedBounds = null;
let launchMode = "normal";

app.disableHardwareAcceleration();

if (process.env.EVERYTHING_SHELL_DEBUG_PORT) {
  app.commandLine.appendSwitch("remote-debugging-port", process.env.EVERYTHING_SHELL_DEBUG_PORT);
}

function resolveEsPath() {
  const packaged = join(process.resourcesPath || "", "vendor", "es", "es.exe");
  const local = join(__dirname, "..", "vendor", "es", "es.exe");
  return existsSync(packaged) ? packaged : local;
}

function resolveEverythingPath() {
  const candidates = [
    process.env.EVERYTHING_EXE_PATH,
    "D:\\Software\\Everything\\Everything.exe",
    "C:\\Program Files\\Everything\\Everything.exe",
    "C:\\Program Files (x86)\\Everything\\Everything.exe",
    join(process.env.LOCALAPPDATA || "", "Programs", "Everything", "Everything.exe")
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) || candidates[0] || "";
}

function resolveAppIconPath() {
  const packaged = join(process.resourcesPath || "", "app", "assets", "app-icon.ico");
  const local = join(__dirname, "..", "assets", "app-icon.ico");
  return existsSync(packaged) ? packaged : local;
}

function settingsPath() {
  return join(app.getPath("userData"), "system-settings.json");
}

function normalizeSystemSettings(value = {}) {
  return {
    startAtLogin: Boolean(value.startAtLogin ?? defaultSystemSettings.startAtLogin),
    stayInBackground: Boolean(value.stayInBackground ?? defaultSystemSettings.stayInBackground),
    quickOpenShortcut:
      value.quickOpenShortcut === undefined
        ? defaultSystemSettings.quickOpenShortcut
        : String(value.quickOpenShortcut || "").trim(),
    desktopOpenShortcut:
      value.desktopOpenShortcut === undefined
        ? defaultSystemSettings.desktopOpenShortcut
        : String(value.desktopOpenShortcut || "").trim(),
    showDesktopModule: Boolean(value.showDesktopModule ?? defaultSystemSettings.showDesktopModule),
    showDesktopTree: Boolean(value.showDesktopTree ?? defaultSystemSettings.showDesktopTree),
    showWindowTitle: Boolean(value.showWindowTitle ?? defaultSystemSettings.showWindowTitle)
  };
}

function loadSystemSettings() {
  try {
    const saved = JSON.parse(readFileSync(settingsPath(), "utf8"));
    systemSettings = normalizeSystemSettings(saved);
  } catch {
    systemSettings = { ...defaultSystemSettings };
  }
}

function saveSystemSettings() {
  mkdirSync(app.getPath("userData"), { recursive: true });
  writeFileSync(settingsPath(), JSON.stringify(systemSettings, null, 2), "utf8");
}

function getPublicSystemSettings() {
  return {
    ...systemSettings,
    shortcutRegistered,
    shortcutError,
    desktopShortcutRegistered,
    desktopShortcutError
  };
}

function emitLaunchMode() {
  const win = mainWindow || BrowserWindow.getAllWindows()[0];
  if (win && !win.webContents.isDestroyed()) {
    win.webContents.send("window:launch-mode", launchMode);
  }
}

function showMainWindow(mode = "normal") {
  launchMode = mode;
  const win = mainWindow || BrowserWindow.getAllWindows()[0];
  if (!win) {
    createWindow();
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  emitLaunchMode();
}

function applyWindowMode(mode) {
  const win = mainWindow || BrowserWindow.getAllWindows()[0];
  if (!win) return false;
  const display = screen.getDisplayMatching(win.getBounds());
  const workArea = display.workArea;

  if (mode === "compact") {
    if (!launcherCompactMode && win.isVisible() && !win.isMinimized()) expandedBounds = win.getBounds();
    launcherCompactMode = true;
    launcherDismissibleMode = true;
    const width = Math.min(760, workArea.width - 32);
    win.setMinimumSize(360, 64);
    win.setSize(width, 64, true);
    win.setPosition(Math.round(workArea.x + (workArea.width - width) / 2), Math.round(workArea.y + (workArea.height - 64) / 2), true);
    return true;
  }

  if (mode === "desktop") {
    launcherCompactMode = false;
    launcherDismissibleMode = true;
    const margin = 36;
    const width = 410;
    const height = Math.min(760, Math.max(460, workArea.height - margin * 2));
    win.setMinimumSize(360, 460);
    win.setSize(width, height, true);
    win.setPosition(workArea.x + margin, workArea.y + margin, true);
    return true;
  }

  launcherCompactMode = false;
  launcherDismissibleMode = false;
  const nextBounds = expandedBounds || { width: 1180, height: 760 };
  const width = Math.min(Math.max(nextBounds.width, 860), workArea.width);
  const height = Math.min(Math.max(nextBounds.height, 520), workArea.height);
  win.setMinimumSize(860, 520);
  win.setSize(width, height, true);
  if (mode === "expandedCentered") {
    win.setPosition(
      Math.round(workArea.x + (workArea.width - width) / 2),
      Math.round(workArea.y + (workArea.height - height) / 2),
      true
    );
  }
  return true;
}

function syncStartAtLogin() {
  app.setLoginItemSettings({
    openAtLogin: Boolean(systemSettings.startAtLogin),
    path: process.execPath
  });
}

function registerAppShortcut(currentShortcut, currentRegisteredShortcut, callback) {
  if (currentRegisteredShortcut) globalShortcut.unregister(currentRegisteredShortcut);
  const shortcut = String(currentShortcut || "").trim();
  if (!shortcut) return { registeredShortcut: "", registered: false, error: "" };

  const registered = globalShortcut.register(shortcut, callback);
  return {
    registeredShortcut: shortcut,
    registered,
    error: registered ? "" : "快捷键注册失败，可能已被其他软件占用。"
  };
}

function registerQuickShortcut() {
  if (registeredShortcut) {
    globalShortcut.unregister(registeredShortcut);
    registeredShortcut = "";
  }
  if (registeredDesktopShortcut) {
    globalShortcut.unregister(registeredDesktopShortcut);
    registeredDesktopShortcut = "";
  }

  shortcutRegistered = false;
  shortcutError = "";
  desktopShortcutRegistered = false;
  desktopShortcutError = "";

  const quick = registerAppShortcut(systemSettings.quickOpenShortcut, "", () => showMainWindow("quickSearch"));
  registeredShortcut = quick.registeredShortcut;
  shortcutRegistered = quick.registered;
  shortcutError = quick.error;

  const desktop = registerAppShortcut(systemSettings.desktopOpenShortcut, "", () => showMainWindow("desktop"));
  registeredDesktopShortcut = desktop.registeredShortcut;
  desktopShortcutRegistered = desktop.registered;
  desktopShortcutError = desktop.error;
}

function updateTray() {
  if (!systemSettings.stayInBackground) {
    tray?.destroy();
    tray = null;
    return;
  }

  if (!tray) {
    const icon = nativeImage.createFromPath(resolveAppIconPath());
    tray = new Tray(icon);
    tray.setToolTip("Everything Modern");
    tray.on("click", () => showMainWindow("normal"));
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "打开", click: () => showMainWindow("normal") },
      {
        label: "退出",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
}

function applySystemSettings() {
  syncStartAtLogin();
  registerQuickShortcut();
  updateTray();
}

function run(command, args, timeout = 12000, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ...extraEnv,
        LANG: "zh_CN.UTF-8",
        LC_ALL: "zh_CN.UTF-8"
      }
    });
    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`命令超时：${command}`));
    }, timeout);

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const out = Buffer.concat(stdout).toString("utf8").trim();
      const err = Buffer.concat(stderr).toString("utf8").trim();
      if (code && code !== 0) {
        reject(new Error(err || out || `命令退出码：${code}`));
        return;
      }
      resolve(out);
    });
  });
}

function parseTsv(text) {
  const normalized = text.replace(/^\uFEFF/, "");
  if (!normalized.trim()) return [];
  return normalized
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const [
        name = "",
        folder = "",
        extension = "",
        size = "",
        modified = "",
        created = "",
        accessed = "",
        attributes = "",
        runCount = "0"
      ] = line.split("\t");
      const fullPath = folder ? `${folder}\\${name}` : name;
      let isFolder = attributes.includes("D");
      if (!isFolder && existsSync(fullPath)) {
        try {
          isFolder = statSync(fullPath).isDirectory();
        } catch {
          isFolder = false;
        }
      }
      return {
        id: `${fullPath}-${index}`,
        name,
        folder,
        path: fullPath,
        extension,
        size: Number(size || 0),
        modified,
        created,
        accessed,
        attributes,
        runCount: Number(runCount || 0),
        isFolder
      };
    });
}

function expandEnvironmentPath(value) {
  return String(value || "").replace(/%([^%]+)%/g, (_match, name) => process.env[name] || _match);
}

function parseIconLocation(value) {
  const raw = String(value || "").trim();
  if (!raw || /^,[-]?\d+$/.test(raw)) return { iconPath: "", iconIndex: 0 };

  const match = raw.match(/^(.*),(-?\d+)$/);
  const pathPart = match ? match[1] : raw;
  return {
    iconPath: expandEnvironmentPath(pathPart.trim().replace(/^"|"$/g, "")),
    iconIndex: match ? Number(match[2] || 0) : 0
  };
}

function normalizeIconPath(value) {
  return parseIconLocation(value).iconPath;
}

function getImageFileIcon(iconPath) {
  const normalizedPath = normalizeIconPath(iconPath);
  const extension = extname(normalizedPath).toLowerCase();
  if (![".ico", ".png", ".jpg", ".jpeg", ".bmp"].includes(extension) || !existsSync(normalizedPath)) {
    return "";
  }

  try {
    const image = nativeImage.createFromPath(normalizedPath);
    return image.isEmpty() ? "" : image.toDataURL();
  } catch {
    return "";
  }
}

async function extractWindowsIcon(iconPath, iconIndex = 0) {
  const normalizedPath = normalizeIconPath(iconPath);
  if (!normalizedPath || !existsSync(normalizedPath)) return "";

  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class EverythingModernIconNative {
  [DllImport("Shell32.dll", CharSet = CharSet.Unicode)]
  public static extern int ExtractIconEx(string file, int index, IntPtr[] largeIcons, IntPtr[] smallIcons, int icons);
  [DllImport("User32.dll")]
  public static extern bool DestroyIcon(IntPtr icon);
}
"@
$path = $env:EVERYTHING_MODERN_ICON_PATH
$index = [int]($env:EVERYTHING_MODERN_ICON_INDEX)
$handles = New-Object IntPtr[] 1
$icon = $null
try {
  $count = [EverythingModernIconNative]::ExtractIconEx($path, $index, $handles, $null, 1)
  if ($count -gt 0 -and $handles[0] -ne [IntPtr]::Zero) {
    $icon = [System.Drawing.Icon]::FromHandle($handles[0])
  } else {
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
  }
  if ($null -eq $icon) { exit 2 }
  $bitmap = $icon.ToBitmap()
  $stream = New-Object System.IO.MemoryStream
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  [Convert]::ToBase64String($stream.ToArray())
  $stream.Dispose()
  $bitmap.Dispose()
} finally {
  if ($null -ne $icon) { $icon.Dispose() }
  if ($handles[0] -ne [IntPtr]::Zero) { [EverythingModernIconNative]::DestroyIcon($handles[0]) | Out-Null }
}
`;

  try {
    const encodedScript = Buffer.from(script, "utf16le").toString("base64");
    const base64 = await run(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encodedScript],
      8000,
      {
        EVERYTHING_MODERN_ICON_PATH: normalizedPath,
        EVERYTHING_MODERN_ICON_INDEX: String(Number(iconIndex || 0))
      }
    );
    return base64 ? `data:image/png;base64,${base64.trim()}` : "";
  } catch {
    return "";
  }
}

function shouldUseWindowsIconFallback(icon, candidate, iconIndex) {
  const extension = extname(normalizeIconPath(candidate)).toLowerCase();
  if (![".exe", ".dll", ".ocx", ".cpl", ".scr", ".bat", ".cmd"].includes(extension)) return false;
  return Number(iconIndex || 0) !== 0 || !icon || icon.length <= 520;
}

function readUrlIconMetadata(fullPath) {
  try {
    const text = readFileSync(fullPath, "utf8");
    const lines = text.split(/\r?\n/);
    const iconLine = lines.find((line) => line.toLowerCase().startsWith("iconfile="));
    if (!iconLine) return {};
    const indexLine = lines.find((line) => line.toLowerCase().startsWith("iconindex="));
    const iconPath = normalizeIconPath(iconLine.slice(iconLine.indexOf("=") + 1).trim());
    const iconIndex = Number(indexLine?.slice(indexLine.indexOf("=") + 1).trim() || 0);
    return iconPath ? { iconPath, iconIndex } : {};
  } catch {
    return {};
  }
}

function readShortcutMetadata(fullPath, extension) {
  if (extension === "lnk") {
    try {
      const shortcut = shell.readShortcutLink(fullPath);
      const iconLocation = parseIconLocation(shortcut.icon);
      return {
        targetPath: shortcut.target || "",
        iconPath: iconLocation.iconPath || shortcut.target || "",
        iconIndex: iconLocation.iconIndex
      };
    } catch {
      return {};
    }
  }

  if (extension === "url") {
    return readUrlIconMetadata(fullPath);
  }

  return {};
}

function buildSearchArgs(options) {
  const query = String(options.query || "").trim();
  const limit = Math.min(Math.max(Number(options.limit || 200), 1), 1000);
  const offset = Math.max(Number(options.offset || 0), 0);
  const sort = options.sort || "name";
  const order = options.order === "descending" ? "descending" : "ascending";
  const kind = options.kind || "all";

  const args = [
    "-timeout",
    "6000",
    "-n",
    String(limit),
    "-o",
    String(offset),
    "-tsv",
    "-no-header",
    "-utf8-bom",
    "-date-format",
    "1",
    "-size-format",
    "1",
    "-name",
    "-path-column",
    "-extension",
    "-size",
    "-date-modified",
    "-date-created",
    "-date-accessed",
    "-attributes",
    "-run-count",
    `-sort-${sort}-${order}`
  ];

  appendSearchModeArgs(args, { ...options, kind });
  return { args, query, limit, offset };
}

function appendSearchModeArgs(args, options) {
  if (options.regex) args.push("-regex");
  if (options.caseSensitive) args.push("-case");
  if (options.wholeWord) args.push("-whole-word");
  if (options.matchPath) args.push("-match-path");
  if (options.kind === "folder") args.push("/ad");
  if (options.kind === "file") args.push("/a-d");
}

function buildCountArgs(options, query) {
  const args = ["-timeout", "6000"];
  appendSearchModeArgs(args, {
    ...options,
    kind: options.kind || "all"
  });
  args.push("-get-result-count", query);
  return args;
}

async function getItemIcon(item) {
  const extension = String(item.extension || "").toLowerCase();
  const shortcutMetadata =
    (extension === "lnk" || extension === "url") && (!item.iconPath || !item.targetPath)
      ? readShortcutMetadata(item.path, extension)
      : {};
  const iconPath = String(item.iconPath || shortcutMetadata.iconPath || "").trim();
  const targetPath = String(item.targetPath || shortcutMetadata.targetPath || "").trim();
  const iconIndex = Number(item.iconIndex ?? shortcutMetadata.iconIndex ?? 0);
  const sourcePath = iconPath || targetPath || item.path;
  const pathScopedExtensions = new Set(["exe", "dll", "ocx", "cpl", "scr", "bat", "cmd", "lnk", "url"]);
  const cacheKey =
    item.isFolder || pathScopedExtensions.has(extension)
      ? `path:${sourcePath || item.path}:${iconIndex}`
      : `ext:${extension || item.path}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);

  const candidates = [
    { path: iconPath, index: iconIndex },
    { path: targetPath, index: 0 },
    { path: item.path, index: 0 }
  ].filter((candidate) => Boolean(candidate.path));

  for (const candidate of candidates) {
    const imageIcon = getImageFileIcon(candidate.path);
    if (imageIcon) {
      iconCache.set(cacheKey, imageIcon);
      return imageIcon;
    }

    try {
      const normalizedPath = normalizeIconPath(candidate.path);
      const image = await app.getFileIcon(normalizedPath, { size: "small" });
      const icon = image.isEmpty() ? "" : image.toDataURL();
      if (shouldUseWindowsIconFallback(icon, normalizedPath, candidate.index)) {
        const extractedIcon = await extractWindowsIcon(normalizedPath, candidate.index);
        if (extractedIcon) {
          iconCache.set(cacheKey, extractedIcon);
          return extractedIcon;
        }
      }
      if (icon) {
        iconCache.set(cacheKey, icon);
        return icon;
      }
    } catch {
      // Try the next available icon source.
    }
  }
  return "";
}

async function searchEverything(options) {
  const esPath = resolveEsPath();
  if (!existsSync(esPath)) throw new Error(`找不到 es.exe：${esPath}`);

  const { args, query, limit, offset } = buildSearchArgs(options);
  const exportPath = join(tmpdir(), `everything-shell-${process.pid}-${Date.now()}.tsv`);
  const exportArgs = [...args, "-export-tsv", exportPath];
  if (query) exportArgs.push(query);

  await run(esPath, exportArgs);
  const rows = existsSync(exportPath) ? readFileSync(exportPath, "utf8") : "";
  try {
    if (existsSync(exportPath)) unlinkSync(exportPath);
  } catch {
    // Temporary files are best-effort cleanup.
  }

  const countText = query ? await run(esPath, buildCountArgs(options, query)).catch(() => "") : "";

  return {
    query,
    limit,
    offset,
    total: Number(countText.trim() || 0),
    items: parseTsv(rows)
  };
}

function readDesktopItemsFrom(folder, source) {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.name.toLowerCase() !== "desktop.ini")
    .map((entry) => {
      const fullPath = join(folder, entry.name);
      let isFolder = entry.isDirectory();
      let stats = null;
      try {
        stats = statSync(fullPath);
        isFolder = stats.isDirectory();
      } catch {
        isFolder = entry.isDirectory();
      }
      const extension = isFolder ? "" : extname(entry.name).replace(/^\./, "").toLowerCase();
      const name = isFolder || !extension ? entry.name : entry.name.slice(0, -(extension.length + 1));
      const shortcutMetadata = isFolder ? {} : readShortcutMetadata(fullPath, extension);
      return {
        id: fullPath,
        name,
        folder,
        path: fullPath,
        extension,
        size: isFolder ? 0 : Number(stats?.size || 0),
        modified: stats?.mtime ? stats.mtime.toISOString() : "",
        created: stats?.birthtime ? stats.birthtime.toISOString() : "",
        accessed: stats?.atime ? stats.atime.toISOString() : "",
        isFolder,
        source,
        ...shortcutMetadata
      };
    });
}

function listDesktopItems() {
  const userDesktop = app.getPath("desktop");
  const publicDesktop = join(process.env.PUBLIC || "C:\\Users\\Public", "Desktop");
  const deduped = new Map();
  for (const item of [
    ...readDesktopItemsFrom(userDesktop, "user"),
    ...readDesktopItemsFrom(publicDesktop, "public")
  ]) {
    if (!deduped.has(item.path)) deduped.set(item.path, item);
  }
  return [...deduped.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-CN", { numeric: true, sensitivity: "base" })
  );
}

function listFolderItems(folder) {
  if (!folder || !existsSync(folder) || !statSync(folder).isDirectory()) return [];
  return readDesktopItemsFrom(folder, "folder");
}

function getFocusedWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 860,
    minHeight: 64,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    backgroundColor: "#00000000",
    icon: resolveAppIconPath(),
    title: "Everything Modern",
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow = win;

  Menu.setApplicationMenu(null);

  win.on("close", (event) => {
    if (!isQuitting && systemSettings.stayInBackground) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });

  win.on("blur", () => {
    if (launcherDismissibleMode && !isQuitting) win.hide();
  });

  if (process.env.ELECTRON_START_URL) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    win.loadFile(join(__dirname, "..", "build", "renderer", "index.html"));
  }

  win.once("ready-to-show", () => {
    win.show();
  });
}

ipcMain.handle("everything:status", async () => {
  const esPath = resolveEsPath();
  const everythingPath = resolveEverythingPath();
  let version = "";
  let online = false;
  if (existsSync(esPath)) {
    try {
      version = await run(esPath, ["-get-everything-version"], 6000);
      online = Boolean(version);
    } catch {
      online = false;
    }
  }
  return {
    online,
    version,
    esPath,
    everythingPath,
    esExists: existsSync(esPath),
    everythingExists: existsSync(everythingPath)
  };
});

ipcMain.handle("everything:search", (_event, options) => searchEverything(options || {}));

ipcMain.handle("file:icon", async (_event, item) => getItemIcon(item || {}));

ipcMain.handle("desktop:list", () => listDesktopItems());

ipcMain.handle("desktop:list-folder", (_event, folder) => listFolderItems(folder));

ipcMain.handle("system:get-settings", () => getPublicSystemSettings());

ipcMain.handle("window:getLaunchMode", () => launchMode);

ipcMain.handle("system:update-settings", (_event, patch) => {
  systemSettings = normalizeSystemSettings({ ...systemSettings, ...(patch || {}) });
  saveSystemSettings();
  applySystemSettings();
  return getPublicSystemSettings();
});

ipcMain.handle("file:open", async (_event, targetPath) => {
  if (!targetPath || !existsSync(targetPath)) throw new Error("路径不存在");
  await shell.openPath(targetPath);
  return true;
});

ipcMain.handle("file:reveal", async (_event, targetPath) => {
  if (!targetPath || !existsSync(targetPath)) throw new Error("路径不存在");
  shell.showItemInFolder(targetPath);
  return true;
});

ipcMain.handle("file:folder", async (_event, targetPath) => {
  if (!targetPath || !existsSync(targetPath)) throw new Error("路径不存在");
  const folder = statSync(targetPath).isDirectory() ? targetPath : dirname(targetPath);
  await shell.openPath(folder);
  return true;
});

ipcMain.handle("file:copyPath", async (_event, targetPath) => {
  clipboard.writeText(String(targetPath || ""));
  return true;
});

ipcMain.handle("everything:openNative", async () => {
  const everythingPath = resolveEverythingPath();
  if (!existsSync(everythingPath)) throw new Error("找不到 Everything.exe");
  await shell.openPath(everythingPath);
  return true;
});

ipcMain.handle("window:minimize", () => {
  getFocusedWindow()?.minimize();
  return true;
});

ipcMain.handle("window:toggleMaximize", () => {
  const win = getFocusedWindow();
  if (!win) return false;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
  return true;
});

ipcMain.handle("window:close", () => {
  const win = getFocusedWindow();
  if (systemSettings.stayInBackground) win?.hide();
  else {
    isQuitting = true;
    win?.close();
  }
  return true;
});

ipcMain.handle("window:setMode", (_event, mode) => applyWindowMode(mode));

app.whenReady().then(() => {
  loadSystemSettings();
  applySystemSettings();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showMainWindow("normal");
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !systemSettings.stayInBackground) app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  tray?.destroy();
});
