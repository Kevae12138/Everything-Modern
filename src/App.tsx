import {
  Copy,
  ExternalLink,
  File,
  Folder,
  FolderOpen,
  Check,
  LayoutGrid,
  List,
  Loader2,
  Maximize2,
  Minus,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Cog,
  Trash2,
  ChevronDown,
  X
} from "lucide-react";
import { CSSProperties, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

const limit = 80;
const appearanceVersion = "2026-07-system-settings-1";
const allDesktopCategoryId = "__all";
const iconCache = new Map<string, string>();
const iconRequests = new Map<string, Promise<string>>();
const iconQueue: Array<() => void> = [];
let activeIconRequests = 0;
const maxActiveIconRequests = 3;
const maxMemoryIcons = 96;

type Appearance = {
  windowRadius: number;
  controlRadius: number;
  buttonRadius: number;
  rowHeight: number;
  rowGap: number;
  fontSize: number;
  tableFontSize: number;
  toolbarHeight: number;
  borderStrength: number;
};

type SearchPrefs = {
  kind: SearchKind;
  sort: SearchSort;
  order: SearchOrder;
  matchPath: boolean;
  regex: boolean;
};

type DesktopCategory = {
  id: string;
  name: string;
  itemPaths: string[];
};

type DesktopViewMode = "list" | "grid";
type DesktopSortMode = "name-ascending" | "name-descending" | "custom";

type DesktopDisplaySettings = {
  listIconSize: number;
  gridIconSize: number;
  nameSize: number;
  rowGap: number;
  gridTileSize: number;
  listRowHeight: number;
};

const defaultAppearance: Appearance = {
  windowRadius: 18,
  controlRadius: 10,
  buttonRadius: 9,
  rowHeight: 30,
  rowGap: 5,
  fontSize: 14,
  tableFontSize: 13,
  toolbarHeight: 44,
  borderStrength: 56
};

const defaultSearchPrefs: SearchPrefs = {
  kind: "all",
  sort: "name",
  order: "ascending",
  matchPath: false,
  regex: false
};

const sortOptions: { label: string; value: SearchSort }[] = [
  { label: "名称", value: "name" },
  { label: "修改时间", value: "date-modified" },
  { label: "路径", value: "path" },
  { label: "大小", value: "size" },
  { label: "扩展名", value: "extension" }
];

const kindOptions: { label: string; value: SearchKind }[] = [
  { label: "全部", value: "all" },
  { label: "文件", value: "file" },
  { label: "文件夹", value: "folder" }
];

const orderOptions: { label: string; value: SearchOrder }[] = [
  { label: "升序", value: "ascending" },
  { label: "降序", value: "descending" }
];

const desktopSortOptions: { label: string; value: DesktopSortMode }[] = [
  { label: "名称升序", value: "name-ascending" },
  { label: "名称降序", value: "name-descending" },
  { label: "自定义排序", value: "custom" }
];

const defaultDesktopDisplaySettings: DesktopDisplaySettings = {
  listIconSize: 16,
  gridIconSize: 48,
  nameSize: 12,
  rowGap: 10,
  gridTileSize: 104,
  listRowHeight: 29
};

const desktopDisplayFields: {
  key: keyof DesktopDisplaySettings;
  label: string;
  min: number;
  max: number;
  unit: string;
}[] = [
  { key: "listIconSize", label: "列表图标", min: 14, max: 32, unit: "px" },
  { key: "gridIconSize", label: "网格图标", min: 24, max: 72, unit: "px" },
  { key: "gridTileSize", label: "网格方框", min: 84, max: 168, unit: "px" },
  { key: "nameSize", label: "名称大小", min: 10, max: 16, unit: "px" },
  { key: "rowGap", label: "行距", min: 4, max: 22, unit: "px" },
  { key: "listRowHeight", label: "列表行高", min: 24, max: 44, unit: "px" }
];

const appearanceFields: {
  key: keyof Appearance;
  label: string;
  min: number;
  max: number;
  unit: string;
}[] = [
  { key: "windowRadius", label: "窗口圆角", min: 0, max: 32, unit: "px" },
  { key: "controlRadius", label: "输入框圆角", min: 0, max: 24, unit: "px" },
  { key: "buttonRadius", label: "按钮圆角", min: 0, max: 24, unit: "px" },
  { key: "rowHeight", label: "行高", min: 22, max: 46, unit: "px" },
  { key: "rowGap", label: "行间距", min: 0, max: 10, unit: "px" },
  { key: "fontSize", label: "界面字号", min: 12, max: 18, unit: "px" },
  { key: "tableFontSize", label: "列表字号", min: 12, max: 18, unit: "px" },
  { key: "toolbarHeight", label: "工具栏高度", min: 30, max: 48, unit: "px" },
  { key: "borderStrength", label: "边框强度", min: 45, max: 120, unit: "" }
];

function loadAppearance() {
  try {
    if (localStorage.getItem("appearanceVersion") !== appearanceVersion) return defaultAppearance;
    const saved = localStorage.getItem("appearance");
    return saved ? { ...defaultAppearance, ...JSON.parse(saved) } : defaultAppearance;
  } catch {
    return defaultAppearance;
  }
}

function loadRememberSearchLogic() {
  return localStorage.getItem("rememberSearchLogic") !== "false";
}

function loadSearchPrefs(remember: boolean) {
  try {
    if (!remember) return defaultSearchPrefs;
    const saved = localStorage.getItem("searchPrefs");
    return saved ? { ...defaultSearchPrefs, ...JSON.parse(saved) } : defaultSearchPrefs;
  } catch {
    return defaultSearchPrefs;
  }
}

function loadDesktopCategories() {
  try {
    const saved = localStorage.getItem("desktopCategories");
    const categories = saved ? (JSON.parse(saved) as DesktopCategory[]) : [];
    return categories.filter((category) => category.id && category.name && Array.isArray(category.itemPaths));
  } catch {
    return [];
  }
}

function loadDesktopSortMode(): DesktopSortMode {
  const saved = localStorage.getItem("desktopSortMode");
  return saved === "name-descending" || saved === "custom" ? saved : "name-ascending";
}

function loadDesktopCustomOrder() {
  try {
    const saved = localStorage.getItem("desktopCustomOrder");
    const order = saved ? (JSON.parse(saved) as string[]) : [];
    return order.filter((path) => typeof path === "string" && path);
  } catch {
    return [];
  }
}

function loadDesktopDisplaySettings() {
  try {
    const saved = localStorage.getItem("desktopDisplaySettings");
    const settings = saved ? { ...defaultDesktopDisplaySettings, ...JSON.parse(saved) } : defaultDesktopDisplaySettings;
    return {
      listIconSize: Math.min(Math.max(Number(settings.listIconSize) || defaultDesktopDisplaySettings.listIconSize, 14), 32),
      gridIconSize: Math.min(Math.max(Number(settings.gridIconSize ?? settings.iconSize) || defaultDesktopDisplaySettings.gridIconSize, 24), 72),
      nameSize: Math.min(Math.max(Number(settings.nameSize) || defaultDesktopDisplaySettings.nameSize, 10), 16),
      rowGap: Math.min(Math.max(Number(settings.rowGap) || defaultDesktopDisplaySettings.rowGap, 4), 22),
      gridTileSize: Math.min(Math.max(Number(settings.gridTileSize) || defaultDesktopDisplaySettings.gridTileSize, 84), 168),
      listRowHeight: Math.min(Math.max(Number(settings.listRowHeight) || defaultDesktopDisplaySettings.listRowHeight, 24), 44)
    };
  } catch {
    return defaultDesktopDisplaySettings;
  }
}

function formatSize(size: number, isFolder: boolean) {
  if (isFolder) return "";
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDesktopType(item: Pick<DesktopItem, "extension" | "isFolder">) {
  if (item.isFolder) return "文件夹";
  if (item.extension === "lnk") return "快捷方式";
  return item.extension || "文件";
}

type IconSourceItem = Pick<EverythingSearchItem, "path" | "extension" | "isFolder"> & {
  targetPath?: string;
  iconPath?: string;
  iconIndex?: number;
};

function iconCacheKey(item: IconSourceItem) {
  if (item.isFolder) return "__folder";
  const extension = item.extension.toLowerCase();
  if (["exe", "dll", "ocx", "cpl", "scr", "bat", "cmd", "lnk", "url"].includes(extension)) {
    return `path:${item.iconPath || item.targetPath || item.path}:${item.iconIndex || 0}`;
  }
  return `ext:${extension || item.path}`;
}

function scheduleIconQueue() {
  const idleCallback = window.requestIdleCallback;
  if (idleCallback) {
    idleCallback(() => runNextIconJobs(), { timeout: 500 });
    return;
  }
  window.setTimeout(runNextIconJobs, 50);
}

function runNextIconJobs() {
  while (activeIconRequests < maxActiveIconRequests && iconQueue.length) {
    const job = iconQueue.shift();
    if (job) job();
  }
}

function rememberIconInMemory(key: string, icon: string) {
  iconCache.delete(key);
  iconCache.set(key, icon);
  while (iconCache.size > maxMemoryIcons) {
    const oldestKey = iconCache.keys().next().value;
    if (!oldestKey) break;
    iconCache.delete(oldestKey);
  }
}

function clearRendererMemoryCache() {
  iconCache.clear();
  iconRequests.clear();
  iconQueue.length = 0;
}

function requestIcon(item: IconSourceItem, key: string) {
  const cached = iconCache.get(key);
  if (cached) return Promise.resolve(cached);

  const existing = iconRequests.get(key);
  if (existing) return existing;

  const request = new Promise<string>((resolve, reject) => {
    iconQueue.push(() => {
      activeIconRequests += 1;
      window.everything
        .getIcon({
          path: item.path,
          extension: item.extension,
          isFolder: item.isFolder,
          targetPath: item.targetPath,
          iconPath: item.iconPath,
          iconIndex: item.iconIndex
        })
        .then(resolve, reject)
        .finally(() => {
          activeIconRequests = Math.max(0, activeIconRequests - 1);
          iconRequests.delete(key);
          runNextIconJobs();
        });
    });
    scheduleIconQueue();
  });
  iconRequests.set(key, request);
  return request;
}

function shortcutFromEvent(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Backspace" || event.key === "Delete") return "";
  const modifierKeys = new Set(["Control", "Shift", "Alt", "Meta"]);
  if (modifierKeys.has(event.key)) return null;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");

  const keyMap: Record<string, string> = {
    " ": "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Escape: "Esc"
  };
  const key = keyMap[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
  if (!parts.length || key === "Esc") return null;
  return [...parts, key].join("+");
}

function ResultIcon({ item }: { item: IconSourceItem }) {
  const key = iconCacheKey(item);
  const holderRef = useRef<HTMLSpanElement>(null);
  const [icon, setIcon] = useState(() => iconCache.get(key) ?? "");
  const [visible, setVisible] = useState(() => Boolean(iconCache.get(key)));

  useEffect(() => {
    const cached = iconCache.get(key);
    setIcon(cached ?? "");
    setVisible(Boolean(cached));

    const node = holderRef.current;
    if (!node || cached) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { root: null, rootMargin: "160px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [key]);

  useEffect(() => {
    let live = true;
    if (!visible) {
      return () => {
        live = false;
      };
    }

    const cached = iconCache.get(key);
    if (cached) {
      setIcon(cached);
      return () => {
        live = false;
      };
    }

    requestIcon(item, key)
      .then((nextIcon) => {
        if (!live) return;
        if (nextIcon) {
          rememberIconInMemory(key, nextIcon);
          setIcon(nextIcon);
        } else {
          setIcon("");
        }
      })
      .catch(() => {
        if (live) setIcon("");
      });

    return () => {
      live = false;
    };
  }, [item.extension, item.iconIndex, item.iconPath, item.isFolder, item.path, item.targetPath, key, visible]);

  const fallback = item.isFolder ? <Folder size={16} /> : <File size={16} />;
  if (icon) {
    return (
      <span ref={holderRef} className="result-icon" aria-hidden="true">
        <img
          className="file-icon"
          src={icon}
          alt=""
          onError={() => {
            iconCache.delete(key);
            setIcon("");
          }}
        />
      </span>
    );
  }

  return (
    <span ref={holderRef} className="result-icon" aria-hidden="true">
      {fallback}
    </span>
  );
}

function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  width
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeFromKeyboard = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("keydown", closeFromKeyboard);
    return () => {
      window.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [open]);

  return (
    <div
      ref={menuRef}
      className="select-menu"
      style={width ? ({ "--select-width": `${width}px` } as CSSProperties) : undefined}
    >
      <button
        type="button"
        className="select-trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected.label}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="select-popover">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? "select-option selected" : "select-option"}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function App() {
  const [appearance, setAppearance] = useState<Appearance>(loadAppearance);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const [rememberSearchLogic, setRememberSearchLogic] = useState(loadRememberSearchLogic);
  const [searchPrefs, setSearchPrefs] = useState<SearchPrefs>(() => loadSearchPrefs(loadRememberSearchLogic()));
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [desktopItems, setDesktopItems] = useState<DesktopItem[]>([]);
  const [desktopCategories, setDesktopCategories] = useState<DesktopCategory[]>(loadDesktopCategories);
  const [desktopViewMode, setDesktopViewMode] = useState<DesktopViewMode>("list");
  const [desktopSortMode, setDesktopSortMode] = useState<DesktopSortMode>(loadDesktopSortMode);
  const [desktopCustomOrder, setDesktopCustomOrder] = useState<string[]>(loadDesktopCustomOrder);
  const [desktopDisplaySettings, setDesktopDisplaySettings] = useState<DesktopDisplaySettings>(loadDesktopDisplaySettings);
  const [desktopDisplayOpen, setDesktopDisplayOpen] = useState(false);
  const [selectedDesktopCategoryId, setSelectedDesktopCategoryId] = useState(allDesktopCategoryId);
  const [desktopEditMode, setDesktopEditMode] = useState(false);
  const [draggedDesktopCategoryId, setDraggedDesktopCategoryId] = useState("");
  const [draggedDesktopItemPath, setDraggedDesktopItemPath] = useState("");
  const [searchResultsRevealed, setSearchResultsRevealed] = useState(true);
  const [launchMode, setLaunchMode] = useState<LaunchMode>("normal");
  const [shortcutRecording, setShortcutRecording] = useState(false);
  const [desktopShortcutRecording, setDesktopShortcutRecording] = useState(false);
  const [desktopFolderStack, setDesktopFolderStack] = useState<DesktopItem[]>([]);
  const [desktopFolderItems, setDesktopFolderItems] = useState<DesktopItem[]>([]);
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [status, setStatus] = useState<EverythingStatus | null>(null);
  const [items, setItems] = useState<EverythingSearchItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const draggedDesktopCategoryIdRef = useRef("");
  const draggedDesktopItemPathRef = useRef("");

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);
  const canLoadMore = items.length < total;
  const desktopOnlyMode = launchMode === "desktop" && !settingsOpen && !systemOpen;
  const quickSearchMode = launchMode === "quickSearch" && !settingsOpen && !systemOpen;
  const quickSearchSettingsMode = launchMode === "quickSearch" && (settingsOpen || systemOpen);
  const desktopModuleVisible = desktopOnlyMode || (!quickSearchMode && Boolean(systemSettings?.showDesktopModule));
  const searchResultsVisible = !desktopOnlyMode && !quickSearchMode && (launchMode === "normal" || searchResultsRevealed);
  const launcherCompact = quickSearchMode;
  const selectedDesktopCategory = desktopCategories.find((category) => category.id === selectedDesktopCategoryId) ?? null;
  const selectedDesktopItems = useMemo(() => {
    if (!selectedDesktopCategory) return desktopItems;
    const itemSet = new Set(selectedDesktopCategory.itemPaths);
    return desktopItems.filter((item) => itemSet.has(item.path));
  }, [desktopCategories, desktopItems, selectedDesktopCategory]);
  const rawDesktopDisplayItems = desktopFolderStack.length ? desktopFolderItems : selectedDesktopItems;
  const desktopDisplayItems = useMemo(() => {
    const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
    const itemsToSort = [...rawDesktopDisplayItems];
    if (desktopSortMode === "name-ascending") {
      return itemsToSort.sort((a, b) => collator.compare(a.name, b.name));
    }
    if (desktopSortMode === "name-descending") {
      return itemsToSort.sort((a, b) => collator.compare(b.name, a.name));
    }
    const orderMap = new Map(desktopCustomOrder.map((path, index) => [path, index]));
    return itemsToSort.sort((a, b) => {
      const aOrder = orderMap.get(a.path);
      const bOrder = orderMap.get(b.path);
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return collator.compare(a.name, b.name);
    });
  }, [desktopCustomOrder, desktopSortMode, rawDesktopDisplayItems]);

  const appearanceStyle = {
    "--window-radius": `${appearance.windowRadius}px`,
    "--control-radius": `${appearance.controlRadius}px`,
    "--button-radius": `${appearance.buttonRadius}px`,
    "--row-height": `${appearance.rowHeight}px`,
    "--row-gap": `${appearance.rowGap}px`,
    "--font-size": `${appearance.fontSize}px`,
    "--table-font-size": `${appearance.tableFontSize}px`,
    "--toolbar-height": `${appearance.toolbarHeight}px`,
    "--border": `rgb(${appearance.borderStrength} ${appearance.borderStrength + 8} ${appearance.borderStrength + 18})`,
    "--desktop-list-icon-size": `${desktopDisplaySettings.listIconSize}px`,
    "--desktop-grid-icon-size": `${desktopDisplaySettings.gridIconSize}px`,
    "--desktop-name-size": `${desktopDisplaySettings.nameSize}px`,
    "--desktop-row-gap": `${desktopDisplaySettings.rowGap}px`,
    "--desktop-grid-tile-size": `${desktopDisplaySettings.gridTileSize}px`,
    "--desktop-list-row-height": `${desktopDisplaySettings.listRowHeight}px`
  } as CSSProperties;

  const options = useMemo<EverythingSearchOptions>(
    () => ({
      query: committedQuery,
      limit,
      offset,
      sort: searchPrefs.sort,
      order: searchPrefs.order,
      kind: searchPrefs.kind,
      regex: searchPrefs.regex,
      caseSensitive: false,
      wholeWord: false,
      matchPath: searchPrefs.matchPath
    }),
    [committedQuery, offset, searchPrefs]
  );

  useEffect(() => {
    localStorage.setItem("appearance", JSON.stringify(appearance));
    localStorage.setItem("appearanceVersion", appearanceVersion);
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem("desktopCategories", JSON.stringify(desktopCategories));
  }, [desktopCategories]);

  useEffect(() => {
    localStorage.setItem("desktopSortMode", desktopSortMode);
  }, [desktopSortMode]);

  useEffect(() => {
    localStorage.setItem("desktopCustomOrder", JSON.stringify(desktopCustomOrder));
  }, [desktopCustomOrder]);

  useEffect(() => {
    localStorage.setItem("desktopDisplaySettings", JSON.stringify(desktopDisplaySettings));
  }, [desktopDisplaySettings]);

  useEffect(() => {
    if (!desktopEditMode) setDesktopDisplayOpen(false);
  }, [desktopEditMode]);

  useEffect(() => {
    localStorage.setItem("rememberSearchLogic", String(rememberSearchLogic));
    if (rememberSearchLogic) localStorage.setItem("searchPrefs", JSON.stringify(searchPrefs));
  }, [rememberSearchLogic, searchPrefs]);

  useEffect(() => {
    setDesktopFolderStack([]);
    setDesktopFolderItems([]);
  }, [selectedDesktopCategoryId, systemSettings?.showDesktopTree]);

  useEffect(() => {
    window.everything.status().then(setStatus).catch((err) => setError(String(err.message || err)));
    window.everything.getSystemSettings().then(setSystemSettings).catch((err) => setError(String(err.message || err)));
    window.everything.getLaunchMode().then(applyLaunchMode).catch(() => undefined);
    const removeLaunchListener = window.everything.onLaunchMode(applyLaunchMode);
    const removeVisibilityListener = window.everything.onWindowVisibility((visible) => {
      if (visible) return;
      clearRendererMemoryCache();
      setItems([]);
      setSelectedId("");
      setTotal(0);
      setOffset(0);
      setLoading(false);
      setDesktopFolderStack([]);
      setDesktopFolderItems([]);
      window.everything.trimMemory().catch(() => undefined);
    });
    refreshDesktopItems();
    return () => {
      removeLaunchListener();
      removeVisibilityListener();
    };
  }, []);

  useEffect(() => {
    window.everything
      .setWindowMode(
        launcherCompact ? "compact" : desktopOnlyMode ? "desktop" : quickSearchSettingsMode ? "expandedCentered" : "expanded"
      )
      .catch(() => undefined);
    if (launcherCompact) {
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [desktopOnlyMode, launcherCompact, quickSearchSettingsMode]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Enter" && selected && document.activeElement !== inputRef.current) {
        window.everything.openFile(selected.path).catch((err) => setError(String(err.message || err)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    if (!committedQuery.trim()) {
      setItems([]);
      setTotal(0);
      setSelectedId("");
      return;
    }

    let live = true;
    setLoading(true);
    setError("");

    window.everything
      .search(options)
      .then((data) => {
        if (!live) return;
        setItems((current) => (data.offset === 0 ? data.items : [...current, ...data.items]));
        setTotal(data.total);
        if (data.offset === 0) setSelectedId(data.items[0]?.id ?? "");
      })
      .catch((err) => {
        if (live) setError(String(err.message || err));
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [options]);

  function clearSearchState() {
    setCommittedQuery("");
    setItems([]);
    setTotal(0);
    setSelectedId("");
    setOffset(0);
    setError("");
    setLoading(false);
  }

  function applyLaunchMode(mode: LaunchMode) {
    setLaunchMode(mode);
    if (mode === "quickSearch") {
      setSearchResultsRevealed(false);
      setQuery("");
      clearSearchState();
      setDesktopFolderStack([]);
      setDesktopFolderItems([]);
    } else if (mode === "desktop") {
      setSearchResultsRevealed(false);
      setDesktopFolderStack([]);
      setDesktopFolderItems([]);
      refreshDesktopItems();
    } else {
      setSearchResultsRevealed(true);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) clearSearchState();
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      clearSearchState();
      return;
    }
    const shouldCenterExpandedWindow = launchMode === "quickSearch";
    setSearchResultsRevealed(true);
    setLaunchMode("normal");
    setOffset(0);
    setCommittedQuery(nextQuery);
    if (shouldCenterExpandedWindow) {
      window.everything.setWindowMode("expandedCentered").catch(() => undefined);
    }
  }

  function updateSearchPref<K extends keyof SearchPrefs>(key: K, value: SearchPrefs[K]) {
    setOffset(0);
    setSearchPrefs((current) => ({ ...current, [key]: value }));
  }

  function refreshStatus() {
    window.everything.status().then(setStatus).catch((err) => setError(String(err.message || err)));
  }

  function loadMore() {
    if (!loading && canLoadMore) setOffset((value) => value + limit);
  }

  function fileAction(action: "openFile" | "revealFile" | "openFolder" | "copyPath", path: string) {
    window.everything[action](path).catch((err) => setError(String(err.message || err)));
  }

  function updateAppearance(key: keyof Appearance, value: number) {
    setAppearance((current) => ({ ...current, [key]: value }));
  }

  function resetAppearance() {
    setAppearance(defaultAppearance);
  }

  function updateSystemSettings(patch: Partial<SystemSettings>) {
    window.everything
      .updateSystemSettings(patch)
      .then(setSystemSettings)
      .catch((err) => setError(String(err.message || err)));
  }

  function captureShortcut(event: KeyboardEvent<HTMLInputElement>) {
    event.preventDefault();
    setShortcutRecording(true);
    const nextShortcut = shortcutFromEvent(event);
    if (nextShortcut === null) return;
    setShortcutRecording(false);
    updateSystemSettings({ quickOpenShortcut: nextShortcut });
  }

  function captureDesktopShortcut(event: KeyboardEvent<HTMLInputElement>) {
    event.preventDefault();
    setDesktopShortcutRecording(true);
    const nextShortcut = shortcutFromEvent(event);
    if (nextShortcut === null) return;
    setDesktopShortcutRecording(false);
    updateSystemSettings({ desktopOpenShortcut: nextShortcut });
  }

  function toggleRememberSearchLogic(checked: boolean) {
    setRememberSearchLogic(checked);
    if (checked) {
      localStorage.setItem("searchPrefs", JSON.stringify(searchPrefs));
    } else {
      localStorage.removeItem("searchPrefs");
    }
  }

  function refreshDesktopItems() {
    window.everything
      .listDesktopItems()
      .then((nextItems) => {
        setDesktopItems(nextItems);
        const livePaths = new Set(nextItems.map((item) => item.path));
        setDesktopCategories((current) =>
          current.map((category) => ({
            ...category,
            itemPaths: category.itemPaths.filter((path) => livePaths.has(path))
          }))
        );
      })
      .catch((err) => setError(String(err.message || err)));
  }

  function openDesktopFolder(item: DesktopItem) {
    if (!systemSettings?.showDesktopTree || !item.isFolder) {
      fileAction("openFile", item.path);
      return;
    }
    window.everything
      .listFolderItems(item.path)
      .then((nextItems) => {
        setDesktopFolderStack((current) => [...current, item]);
        setDesktopFolderItems(nextItems);
      })
      .catch((err) => setError(String(err.message || err)));
  }

  function goDesktopFolderRoot() {
    setDesktopFolderStack([]);
    setDesktopFolderItems([]);
  }

  function goDesktopFolderAt(index: number) {
    const nextStack = desktopFolderStack.slice(0, index + 1);
    const folder = nextStack[nextStack.length - 1];
    if (!folder) {
      goDesktopFolderRoot();
      return;
    }
    window.everything
      .listFolderItems(folder.path)
      .then((nextItems) => {
        setDesktopFolderStack(nextStack);
        setDesktopFolderItems(nextItems);
      })
      .catch((err) => setError(String(err.message || err)));
  }

  function createDesktopCategory() {
    const id = `category-${Date.now()}`;
    const category = {
      id,
      name: `分类 ${desktopCategories.length + 1}`,
      itemPaths: []
    };
    setDesktopCategories((current) => [...current, category]);
    setSelectedDesktopCategoryId(id);
  }

  function deleteDesktopCategory(id: string) {
    setDesktopCategories((current) => current.filter((category) => category.id !== id));
    if (selectedDesktopCategoryId === id) setSelectedDesktopCategoryId(allDesktopCategoryId);
  }

  function renameDesktopCategory(id: string, name: string) {
    const nextName = name.trim();
    setDesktopCategories((current) =>
      current.map((category) => (category.id === id ? { ...category, name: nextName || category.name } : category))
    );
  }

  function findDesktopCategoryId(path: string) {
    return desktopCategories.find((category) => category.itemPaths.includes(path))?.id ?? "";
  }

  function assignDesktopItem(path: string, categoryId: string) {
    setDesktopCategories((current) =>
      current.map((category) => {
        const itemPaths = category.itemPaths.filter((itemPath) => itemPath !== path);
        if (category.id === categoryId) itemPaths.push(path);
        return { ...category, itemPaths };
      })
    );
  }

  function toggleDesktopViewMode() {
    setDesktopViewMode((current) => (current === "list" ? "grid" : "list"));
  }

  function changeDesktopSortMode(value: DesktopSortMode) {
    if (value === "custom") {
      const displayedPathSet = new Set(desktopDisplayItems.map((item) => item.path));
      setDesktopCustomOrder((current) => [
        ...desktopDisplayItems.map((item) => item.path),
        ...current.filter((path) => !displayedPathSet.has(path))
      ]);
    }
    setDesktopSortMode(value);
  }

  function updateDesktopDisplaySetting(key: keyof DesktopDisplaySettings, value: number) {
    setDesktopDisplaySettings((current) => ({ ...current, [key]: value }));
  }

  function resetDesktopDisplaySettings() {
    setDesktopDisplaySettings(defaultDesktopDisplaySettings);
  }

  function reorderDesktopItem(targetPath: string) {
    const sourcePath = draggedDesktopItemPathRef.current || draggedDesktopItemPath;
    if (!desktopEditMode || desktopSortMode !== "custom" || !sourcePath || sourcePath === targetPath) return;
    const currentPaths = desktopDisplayItems.map((item) => item.path);
    const fromIndex = currentPaths.indexOf(sourcePath);
    const toIndex = currentPaths.indexOf(targetPath);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextPaths = [...currentPaths];
    const [moved] = nextPaths.splice(fromIndex, 1);
    nextPaths.splice(toIndex, 0, moved);
    const nextPathSet = new Set(nextPaths);
    setDesktopCustomOrder((current) => [...nextPaths, ...current.filter((path) => !nextPathSet.has(path))]);
    draggedDesktopItemPathRef.current = "";
    setDraggedDesktopItemPath("");
  }

  function reorderDesktopCategory(targetId: string) {
    const sourceId = draggedDesktopCategoryIdRef.current || draggedDesktopCategoryId;
    if (!desktopEditMode || !sourceId || sourceId === targetId) return;
    setDesktopCategories((current) => {
      const fromIndex = current.findIndex((category) => category.id === sourceId);
      const toIndex = current.findIndex((category) => category.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    draggedDesktopCategoryIdRef.current = "";
    setDraggedDesktopCategoryId("");
  }

  return (
    <div className={launcherCompact ? "window-frame compact" : "window-frame"} style={appearanceStyle}>
      {!launcherCompact && (
      <div className="titlebar">
        <div className="title">{systemSettings?.showWindowTitle !== false ? "Everything Modern" : ""}</div>
        <div className="window-actions">
          <button title="最小化" onClick={() => window.everything.minimize()}>
            <Minus size={14} />
          </button>
          <button title="最大化" onClick={() => window.everything.toggleMaximize()}>
            <Maximize2 size={13} />
          </button>
          <button title="关闭" className="close-button" onClick={() => window.everything.close()}>
            <X size={15} />
          </button>
        </div>
      </div>
      )}

      <div
        className={[
          "app",
          desktopOnlyMode ? "desktop-only" : "",
          desktopModuleVisible ? "" : "desktop-module-hidden",
          searchResultsVisible ? "" : "search-results-hidden"
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {desktopModuleVisible && (
        <aside className={desktopEditMode ? "desktop-board editing" : "desktop-board"}>
          <div className="desktop-board-head">
            <div>
              <h2>桌面分类</h2>
              <span>{desktopItems.length.toLocaleString("zh-CN")} 个项目</span>
            </div>
            <div className="desktop-head-actions">
              <button title="刷新桌面" onClick={refreshDesktopItems}>
                <RefreshCw size={14} />
              </button>
              <button
                className="desktop-view-toggle"
                title={`切换显示：当前${desktopViewMode === "list" ? "列表" : "网格"}`}
                aria-label={`切换显示：当前${desktopViewMode === "list" ? "列表" : "网格"}`}
                onClick={toggleDesktopViewMode}
              >
                {desktopViewMode === "list" ? <List size={14} /> : <LayoutGrid size={14} />}
                <small>{desktopViewMode === "list" ? "列表" : "网格"}</small>
              </button>
              <button
                className={desktopEditMode ? "desktop-edit-toggle active" : "desktop-edit-toggle"}
                title={desktopEditMode ? "完成编辑" : "编辑分类"}
                onClick={() => setDesktopEditMode((current) => !current)}
              >
                {desktopEditMode ? <Check size={14} /> : <Pencil size={14} />}
                <span>{desktopEditMode ? "完成" : "编辑"}</span>
              </button>
              {desktopEditMode && (
                <>
                  <button title="显示调整" onClick={() => setDesktopDisplayOpen(true)}>
                    <Palette size={14} />
                  </button>
                  <button title="新建分类" onClick={createDesktopCategory}>
                    <Plus size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="desktop-board-controls">
            <span>排序</span>
            <SelectMenu value={desktopSortMode} options={desktopSortOptions} onChange={changeDesktopSortMode} width={124} />
          </div>

          <div className="category-list">
            <button
              className={selectedDesktopCategoryId === allDesktopCategoryId ? "category-item selected" : "category-item"}
              onClick={() => setSelectedDesktopCategoryId(allDesktopCategoryId)}
            >
              <span>全部桌面</span>
              <small>{desktopItems.length}</small>
            </button>
            {desktopCategories.map((category) => (
              <button
                key={category.id}
                className={[
                  "category-item",
                  selectedDesktopCategoryId === category.id ? "selected" : "",
                  draggedDesktopCategoryId === category.id ? "dragging" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                draggable={desktopEditMode}
                onDragStart={() => {
                  if (!desktopEditMode) return;
                  draggedDesktopCategoryIdRef.current = category.id;
                  setDraggedDesktopCategoryId(category.id);
                }}
                onDragOver={(event) => {
                  if (desktopEditMode && draggedDesktopCategoryId) event.preventDefault();
                }}
                onDrop={() => reorderDesktopCategory(category.id)}
                onDragEnd={() => {
                  draggedDesktopCategoryIdRef.current = "";
                  setDraggedDesktopCategoryId("");
                }}
                onClick={() => setSelectedDesktopCategoryId(category.id)}
              >
                <span>{category.name}</span>
                <small>{category.itemPaths.length}</small>
              </button>
            ))}
          </div>

          <div className="desktop-folder-head">
            {desktopEditMode && selectedDesktopCategory ? (
              <>
                <input
                  value={selectedDesktopCategory.name}
                  onChange={(event) => renameDesktopCategory(selectedDesktopCategory.id, event.target.value)}
                />
                <button title="删除分类" onClick={() => deleteDesktopCategory(selectedDesktopCategory.id)}>
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <strong>{selectedDesktopCategory?.name ?? "全部桌面"}</strong>
            )}
          </div>

          {systemSettings?.showDesktopTree && desktopFolderStack.length > 0 && (
            <div className="desktop-breadcrumb">
              <button type="button" onClick={goDesktopFolderRoot}>
                {selectedDesktopCategory?.name ?? "全部桌面"}
              </button>
              {desktopFolderStack.map((folder, index) => (
                <button key={folder.path} type="button" onClick={() => goDesktopFolderAt(index)}>
                  {folder.name}
                </button>
              ))}
            </div>
          )}

          <div className="desktop-result-wrap">
            {desktopViewMode === "list" ? (
              <table className="result-table desktop-result-table">
                <thead>
                  <tr>
                    <th className="desktop-name-col">名称</th>
                    {desktopEditMode && <th className="desktop-type-col">类型</th>}
                    {desktopEditMode && <th className="desktop-category-col">分类</th>}
                  </tr>
                </thead>
                <tbody>
                  {desktopDisplayItems.map((item) => (
                    <tr
                      key={item.path}
                      className={draggedDesktopItemPath === item.path ? "dragging" : ""}
                      title={item.path}
                      draggable={desktopEditMode && desktopSortMode === "custom"}
                      onDragStart={() => {
                        if (!desktopEditMode || desktopSortMode !== "custom") return;
                        draggedDesktopItemPathRef.current = item.path;
                        setDraggedDesktopItemPath(item.path);
                      }}
                      onDragOver={(event) => {
                        if (desktopEditMode && desktopSortMode === "custom" && draggedDesktopItemPath) event.preventDefault();
                      }}
                      onDrop={() => reorderDesktopItem(item.path)}
                      onDragEnd={() => {
                        draggedDesktopItemPathRef.current = "";
                        setDraggedDesktopItemPath("");
                      }}
                      onDoubleClick={() => openDesktopFolder(item)}
                    >
                      <td className="name-cell desktop-name-cell">
                        <ResultIcon item={item} />
                        <span>{item.name}</span>
                      </td>
                      {desktopEditMode && <td>{formatDesktopType(item)}</td>}
                      {desktopEditMode && (
                        <td className="desktop-category-cell">
                          <select
                            value={findDesktopCategoryId(item.path)}
                            onChange={(event) => assignDesktopItem(item.path, event.target.value)}
                          >
                            <option value="">未分类</option>
                            {desktopCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="desktop-grid">
                {desktopDisplayItems.map((item) => (
                  <div
                    key={item.path}
                    className={draggedDesktopItemPath === item.path ? "desktop-grid-item dragging" : "desktop-grid-item"}
                    title={item.path}
                    draggable={desktopEditMode && desktopSortMode === "custom"}
                    onDragStart={() => {
                      if (!desktopEditMode || desktopSortMode !== "custom") return;
                      draggedDesktopItemPathRef.current = item.path;
                      setDraggedDesktopItemPath(item.path);
                    }}
                    onDragOver={(event) => {
                      if (desktopEditMode && desktopSortMode === "custom" && draggedDesktopItemPath) event.preventDefault();
                    }}
                    onDrop={() => reorderDesktopItem(item.path)}
                    onDragEnd={() => {
                      draggedDesktopItemPathRef.current = "";
                      setDraggedDesktopItemPath("");
                    }}
                    onDoubleClick={() => openDesktopFolder(item)}
                  >
                    <div className="desktop-grid-icon">
                      <ResultIcon item={item} />
                    </div>
                    <div className="desktop-grid-name">{item.name}</div>
                  </div>
                ))}
              </div>
            )}
            {!desktopDisplayItems.length && <div className="desktop-empty">暂无项目</div>}
          </div>
        </aside>
        )}

        {!desktopOnlyMode && (
        <div className={searchResultsVisible ? "search-shell" : "search-shell compact"}>
        <header className={searchResultsVisible ? "header" : "header compact"}>
          <form className="search-bar" onSubmit={submit}>
            <Search size={17} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="搜索"
              autoFocus
            />
            <button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 size={15} className="spin" /> : "搜索"}
            </button>
            <button type="button" className="top-icon-button" title="系统设置" onClick={() => setSystemOpen(true)}>
              <Cog size={14} />
            </button>
            <button type="button" className="top-icon-button" title="外观设置" onClick={() => setSettingsOpen(true)}>
              <Palette size={14} />
            </button>
          </form>

          {searchResultsVisible && (
          <div className="tools">
            <div className="filter-controls">
              <SelectMenu value={searchPrefs.kind} options={kindOptions} onChange={(value) => updateSearchPref("kind", value)} width={108} />
              <SelectMenu value={searchPrefs.sort} options={sortOptions} onChange={(value) => updateSearchPref("sort", value)} width={112} />
              <SelectMenu value={searchPrefs.order} options={orderOptions} onChange={(value) => updateSearchPref("order", value)} width={104} />
              <label className="check">
                <input
                  type="checkbox"
                  checked={searchPrefs.matchPath}
                  onChange={(event) => updateSearchPref("matchPath", event.target.checked)}
                />
                匹配路径
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={searchPrefs.regex}
                  onChange={(event) => updateSearchPref("regex", event.target.checked)}
                />
                正则
              </label>
            </div>
          </div>
          )}
        </header>

        {searchResultsVisible && (
        <>
        <div className="status-row">
          <span className={status?.online ? "dot online" : "dot"} />
          <span>{status?.online ? `Everything ${status.version}` : "Everything 未连接"}</span>
          <span className="divider" />
          <span>{committedQuery ? `${total.toLocaleString("zh-CN")} 个对象` : "输入关键词开始搜索"}</span>
          {error && <span className="error">{error}</span>}
          <button title="刷新状态" onClick={refreshStatus}>
            <RefreshCw size={14} />
          </button>
        </div>

        <main className="main">
          <table className="result-table">
            <thead>
              <tr>
                <th className="name-col">名称</th>
                <th>路径</th>
                <th className="size-col">大小</th>
                <th className="time-col">修改时间</th>
                <th className="type-col">类型</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={selectedId === item.id ? "selected" : ""}
                  onClick={() => setSelectedId(item.id)}
                  onDoubleClick={() => fileAction("openFile", item.path)}
                >
                  <td className="name-cell">
                    <ResultIcon item={item} />
                    <span>{item.name}</span>
                  </td>
                  <td title={item.folder}>{item.folder}</td>
                  <td>{formatSize(item.size, item.isFolder)}</td>
                  <td>{formatDate(item.modified)}</td>
                  <td>{item.isFolder ? "文件夹" : item.extension}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!committedQuery && <div className="empty">使用 Everything 语法或普通关键词搜索本机文件。</div>}
          {committedQuery && !loading && items.length === 0 && !error && <div className="empty">没有找到对象。</div>}
        </main>

        <footer className="footer">
          <div className="path">{selected?.path || ""}</div>
          <div className="actions">
            <button disabled={!selected} onClick={() => selected && fileAction("openFile", selected.path)}>
              <ExternalLink size={14} />
              打开
            </button>
            <button disabled={!selected} onClick={() => selected && fileAction("revealFile", selected.path)}>
              <FolderOpen size={14} />
              定位
            </button>
            <button disabled={!selected} onClick={() => selected && fileAction("copyPath", selected.path)}>
              <Copy size={14} />
              复制路径
            </button>
            <button disabled={!canLoadMore || loading} onClick={loadMore}>
              {loading ? "搜索中" : "更多"}
            </button>
          </div>
        </footer>
        </>
        )}
        </div>
        )}
      </div>

      {settingsOpen && (
        <div className="settings-backdrop" onMouseDown={() => setSettingsOpen(false)}>
          <aside className="settings-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="settings-head">
              <div>
                <h2>外观设置</h2>
                <p>调整后会自动保存。</p>
              </div>
              <button title="关闭" onClick={() => setSettingsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="settings-list">
              {appearanceFields.map((field) => (
                <label key={field.key} className="range-row">
                  <span>{field.label}</span>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    value={appearance[field.key]}
                    onChange={(event) => updateAppearance(field.key, Number(event.target.value))}
                  />
                  <output>
                    {appearance[field.key]}
                    {field.unit}
                  </output>
                </label>
              ))}
            </div>

            <div className="settings-foot">
              <button onClick={resetAppearance}>
                <RotateCcw size={14} />
                恢复默认
              </button>
            </div>
          </aside>
        </div>
      )}

      {desktopDisplayOpen && (
        <div className="settings-backdrop" onMouseDown={() => setDesktopDisplayOpen(false)}>
          <aside className="settings-panel desktop-display-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="settings-head">
              <div>
                <h2>桌面显示</h2>
                <p>调整桌面分类的列表和网格显示。</p>
              </div>
              <button title="关闭" onClick={() => setDesktopDisplayOpen(false)}>
                <X size={15} />
              </button>
            </div>

            <div className="desktop-display-form">
              {desktopDisplayFields.map((field) => (
                <label key={field.key}>
                  <span>{field.label}</span>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    value={desktopDisplaySettings[field.key]}
                    onChange={(event) => updateDesktopDisplaySetting(field.key, Number(event.target.value))}
                  />
                  <strong>
                    {desktopDisplaySettings[field.key]}
                    {field.unit}
                  </strong>
                </label>
              ))}
            </div>

            <div className="desktop-display-actions">
              <button className="reset-button" type="button" onClick={resetDesktopDisplaySettings}>
                <RotateCcw size={14} />
                恢复默认
              </button>
            </div>
          </aside>
        </div>
      )}

      {systemOpen && (
        <div className="settings-backdrop" onMouseDown={() => setSystemOpen(false)}>
          <aside className="settings-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="settings-head">
              <div>
                <h2>系统设置</h2>
                <p>调整后会自动保存。</p>
              </div>
              <button title="关闭" onClick={() => setSystemOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="system-list">
              <label className="switch-row">
                <span>参考上次搜索逻辑</span>
                <input
                  type="checkbox"
                  checked={rememberSearchLogic}
                  onChange={(event) => toggleRememberSearchLogic(event.target.checked)}
                />
              </label>
              <label className="switch-row">
                <span>是否系统自启动</span>
                <input
                  type="checkbox"
                  checked={Boolean(systemSettings?.startAtLogin)}
                  onChange={(event) => updateSystemSettings({ startAtLogin: event.target.checked })}
                />
              </label>
              <label className="switch-row">
                <span>是否存在后台</span>
                <input
                  type="checkbox"
                  checked={Boolean(systemSettings?.stayInBackground)}
                  onChange={(event) => updateSystemSettings({ stayInBackground: event.target.checked })}
                />
              </label>
              <label className="switch-row">
                <span>显示窗口软件名称</span>
                <input
                  type="checkbox"
                  checked={systemSettings?.showWindowTitle !== false}
                  onChange={(event) => updateSystemSettings({ showWindowTitle: event.target.checked })}
                />
              </label>
              <label className="shortcut-row">
                <span>快速调用快捷键</span>
                <input
                  value={shortcutRecording ? "" : systemSettings?.quickOpenShortcut ?? ""}
                  readOnly
                  onFocus={() => setShortcutRecording(true)}
                  onBlur={() => setShortcutRecording(false)}
                  onKeyDown={captureShortcut}
                  placeholder={shortcutRecording ? "按下新的快捷键" : "点击后按组合键"}
                />
                <button type="button" onClick={() => updateSystemSettings({ quickOpenShortcut: "" })}>
                  清空
                </button>
              </label>
              {systemSettings?.quickOpenShortcut && (
                <div className={systemSettings.shortcutRegistered ? "setting-note good" : "setting-note warning"}>
                  {systemSettings.shortcutRegistered
                    ? `快捷键已启用：${systemSettings.quickOpenShortcut}`
                    : systemSettings.shortcutError || "快捷键注册失败，可能被其他软件占用。"}
                </div>
              )}
              <div className="settings-group-title">桌面分类</div>
              <label className="switch-row">
                <span>显示桌面分类</span>
                <input
                  type="checkbox"
                  checked={Boolean(systemSettings?.showDesktopModule)}
                  onChange={(event) => updateSystemSettings({ showDesktopModule: event.target.checked })}
                />
              </label>
              <label className="switch-row">
                <span>显示树状结构</span>
                <input
                  type="checkbox"
                  checked={systemSettings?.showDesktopTree !== false}
                  onChange={(event) => updateSystemSettings({ showDesktopTree: event.target.checked })}
                />
              </label>
              <label className="shortcut-row">
                <span>桌面分类快捷键</span>
                <input
                  value={desktopShortcutRecording ? "" : systemSettings?.desktopOpenShortcut ?? ""}
                  readOnly
                  onFocus={() => setDesktopShortcutRecording(true)}
                  onBlur={() => setDesktopShortcutRecording(false)}
                  onKeyDown={captureDesktopShortcut}
                  placeholder={desktopShortcutRecording ? "按下新的快捷键" : "点击后按组合键"}
                />
                <button type="button" onClick={() => updateSystemSettings({ desktopOpenShortcut: "" })}>
                  清空
                </button>
              </label>
              {systemSettings?.desktopOpenShortcut && (
                <div className={systemSettings.desktopShortcutRegistered ? "setting-note good" : "setting-note warning"}>
                  {systemSettings.desktopShortcutRegistered
                    ? `快捷键已启用：${systemSettings.desktopOpenShortcut}`
                    : systemSettings.desktopShortcutError || "快捷键注册失败，可能被其他软件占用。"}
                </div>
              )}
              <div className="settings-group-title">关于</div>
              <div className="about-list">
                <div>
                  <span>项目地址</span>
                  <a href="https://github.com/Kevae12138/Everything-Modern" target="_blank" rel="noreferrer">
                    github.com/Kevae12138/Everything-Modern
                  </a>
                </div>
                <div>
                  <span>作者</span>
                  <strong>Kevae12138</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
