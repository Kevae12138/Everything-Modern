type SearchSort =
  | "name"
  | "path"
  | "size"
  | "extension"
  | "date-created"
  | "date-modified"
  | "date-accessed"
  | "run-count";

type SearchOrder = "ascending" | "descending";
type SearchKind = "all" | "file" | "folder";
type LaunchMode = "normal" | "quickSearch" | "desktop";

interface EverythingStatus {
  online: boolean;
  version: string;
  esPath: string;
  everythingPath: string;
  esExists: boolean;
  everythingExists: boolean;
}

interface EverythingSearchItem {
  id: string;
  name: string;
  folder: string;
  path: string;
  extension: string;
  size: number;
  modified: string;
  created: string;
  accessed: string;
  attributes: string;
  runCount: number;
  isFolder: boolean;
}

interface DesktopItem {
  id: string;
  name: string;
  folder: string;
  path: string;
  extension: string;
  size: number;
  modified: string;
  created: string;
  accessed: string;
  isFolder: boolean;
  source: "user" | "public" | "folder";
  targetPath?: string;
  iconPath?: string;
  iconIndex?: number;
}

interface EverythingSearchResponse {
  query: string;
  limit: number;
  offset: number;
  total: number;
  items: EverythingSearchItem[];
}

interface EverythingSearchOptions {
  query: string;
  limit: number;
  offset: number;
  sort: SearchSort;
  order: SearchOrder;
  kind: SearchKind;
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  matchPath: boolean;
}

interface SystemSettings {
  startAtLogin: boolean;
  stayInBackground: boolean;
  showDesktopModule: boolean;
  showDesktopTree: boolean;
  showWindowTitle: boolean;
  quickOpenShortcut: string;
  desktopOpenShortcut: string;
  shortcutRegistered: boolean;
  shortcutError: string;
  desktopShortcutRegistered: boolean;
  desktopShortcutError: string;
}

interface Window {
  everything: {
    status: () => Promise<EverythingStatus>;
    search: (options: EverythingSearchOptions) => Promise<EverythingSearchResponse>;
    openNative: () => Promise<boolean>;
    openFile: (path: string) => Promise<boolean>;
    revealFile: (path: string) => Promise<boolean>;
    openFolder: (path: string) => Promise<boolean>;
    copyPath: (path: string) => Promise<boolean>;
    getIcon: (
      item: Pick<EverythingSearchItem, "path" | "extension" | "isFolder"> & {
        targetPath?: string;
        iconPath?: string;
        iconIndex?: number;
      }
    ) => Promise<string>;
    listDesktopItems: () => Promise<DesktopItem[]>;
    listFolderItems: (folder: string) => Promise<DesktopItem[]>;
    getSystemSettings: () => Promise<SystemSettings>;
    updateSystemSettings: (patch: Partial<SystemSettings>) => Promise<SystemSettings>;
    getLaunchMode: () => Promise<LaunchMode>;
    onLaunchMode: (callback: (mode: LaunchMode) => void) => () => void;
    minimize: () => Promise<boolean>;
    toggleMaximize: () => Promise<boolean>;
    setWindowMode: (mode: "compact" | "expanded" | "expandedCentered" | "desktop") => Promise<boolean>;
    close: () => Promise<boolean>;
  };
}
