# Everything Modern

![GitHub release](https://img.shields.io/github/v/release/Kevae12138/Everything-Modern?style=flat-square)
![GitHub downloads](https://img.shields.io/github/downloads/Kevae12138/Everything-Modern/total?style=flat-square)
![License](https://img.shields.io/github/license/Kevae12138/Everything-Modern?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows-0078d4?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-43-47848f?style=flat-square)
![React](https://img.shields.io/badge/React-19-149eca?style=flat-square)

English | [简体中文](README.zh-CN.md)

Everything Modern is a modern Windows shell for Everything search. It wraps Everything's fast local file search in a clean white desktop app and adds global hotkeys, desktop categorization, tree-style folder browsing, icon extraction, appearance settings, and background tray behavior.

> Everything Modern is an independent third-party frontend shell. It does not replace Everything's indexing service.

- Repository: https://github.com/Kevae12138/Everything-Modern
- Author: Kevae12138
- Current version: `v0.1.0`

## Download

End users do not need to download the source code or build the app manually. Download the Windows package from Releases:

[Download Everything Modern v0.1.0](https://github.com/Kevae12138/Everything-Modern/releases/tag/v0.1.0)

Usage:

1. Download `Everything-Modern-v0.1.0-win-x64.zip`
2. Extract the archive
3. Run `Everything Modern.exe`

The release package includes Everything Modern, the Electron runtime, and the Everything Command-line Interface `es.exe`. Search still requires Everything 1.5 to be installed and running on the machine.

## Contents

- [Features](#features)
- [Desktop Categorization](#desktop-categorization)
- [Window Modes](#window-modes)
- [Requirements](#requirements)
- [Build From Source](#build-from-source)
- [Package](#package)
- [FAQ](#faq)
- [Third-Party Notices](#third-party-notices)
- [License](#license)

## Features

### Everything Search

- Uses Everything Command-line Interface `es.exe` for local file search
- Supports Everything 1.5
- Supports plain keywords and Everything search syntax
- Supports sorting by name, path, size, extension, and modified time
- Supports ascending/descending order, file type filters, path matching, and regex search
- Supports loading more search results
- Supports opening files, revealing files, and copying paths

### Icon Extraction

- Shows file icons in search results and desktop categorization
- Supports regular files, folders, and application shortcuts
- Resolves `.lnk` shortcut icons
- Resolves `.url` shortcut icons
- Falls back to target executable or icon location when shortcut metadata is incomplete
- Uses an additional Windows icon extraction fallback for some program icons

### Hotkeys

- Global hotkey for the compact search box
- Separate hotkey for the desktop categorization panel
- Compact search box opens centered on screen
- Submitting a search restores the full results window and recenters it
- Compact search and desktop categorization windows hide automatically when they lose focus

### Appearance Settings

Everything Modern provides visual appearance settings that are saved automatically:

- Window radius
- Input radius
- Button radius
- Search result row height
- Search result row spacing
- UI font size
- List font size
- Toolbar height
- Border strength

### System Settings

System settings currently include:

- Remember last search logic
- Start with Windows
- Stay in background
- Show window title
- Quick search hotkey
- Show desktop categorization
- Show tree structure
- Desktop categorization hotkey
- About

## Desktop Categorization

Desktop categorization is the main feature besides search. It reads items from the current user's desktop and the public desktop, then displays them in a list style similar to search results.

It is designed for organizing desktop apps, files, and folders. The idea is close to app folders on mobile systems: put desktop items into categories so the desktop stays cleaner.

Supported actions:

- Detect desktop items automatically
- Show desktop application shortcuts
- Show desktop files
- Show desktop folders
- Show matching icons
- Create categories
- Assign desktop items to categories
- Rename categories
- Delete categories
- Reorder categories by dragging in edit mode
- Show type and category selectors in edit mode
- Keep the normal view minimal outside edit mode

### Tree-Style Folder Browsing

The `Show tree structure` option can be enabled in system settings.

When enabled:

- Folders in desktop categorization can be opened inside the app
- Double-clicking a folder shows its contents in the same panel instead of opening File Explorer
- Subfolders can be opened recursively
- Breadcrumb navigation can return to the desktop root or a parent folder

When disabled:

- Double-clicking a folder lets Windows handle it normally

## Window Modes

Everything Modern currently has three main opening modes:

| Mode | Trigger | Behavior |
| --- | --- | --- |
| Normal | exe, taskbar, tray | Shows the full search interface by default |
| Quick Search | Quick search hotkey | Shows only a centered compact search box, then restores the full results window after searching |
| Desktop Categorization | Desktop categorization hotkey | Shows only the desktop categorization panel on the left side of the screen with margins |

## Requirements

- Windows 10/11
- Everything 1.5

If you only want to use the app, download the Windows zip package from Releases.

If you want to modify the source or build it yourself, you also need:

- Node.js 20 or later
- Everything Command-line Interface `es.exe`, used by the packaged search feature

> This project does not include Everything's indexing service. Install and run Everything from voidtools.

## Build From Source

Install dependencies:

```bash
npm install
```

Build renderer assets:

```bash
npm run build
```

## Package

Build the Windows portable package:

```bash
npm run dist:portable
```

Before packaging or running search features, place `es.exe` at:

```text
vendor/es/es.exe
```

You can also specify the Everything executable path with:

```text
EVERYTHING_EXE_PATH=C:\Program Files\Everything\Everything.exe
```

The app tries these locations:

- `EVERYTHING_EXE_PATH`
- `D:\Software\Everything\Everything.exe`
- `C:\Program Files\Everything\Everything.exe`
- `C:\Program Files (x86)\Everything\Everything.exe`
- `%LOCALAPPDATA%\Programs\Everything\Everything.exe`

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- lucide-react
- Everything CLI `es.exe`

## FAQ

### Can it replace Everything?

No. Everything Modern is a third-party frontend shell for Everything. File indexing and search are still provided by Everything.

### Why is there no exe in the source repository?

GitHub source repositories are not a good place for large binaries. Packaged Windows builds are published in GitHub Releases.

### Why is `es.exe` not in the source repository?

`es.exe` comes from voidtools. The source repository only keeps the expected location. Release packages include runtime files needed by the app.

### Why do some features depend on Everything 1.5?

The current project is adapted for Everything 1.5 and the ES command-line tool. Older Everything versions may miss required query behavior or returned fields.

## Third-Party Notices

- Everything Modern is an independent third-party frontend shell and is not affiliated with voidtools
- Everything and `es.exe` belong to their respective rights holders
- Electron runtime files are distributed with the Windows release package
- This repository does not commit `node_modules/`
- This repository does not commit packaged exe files
- This repository does not commit local `es.exe`
- Ready-to-run Windows packages are published in GitHub Releases

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for more information.

## License

This project is licensed under the MIT License.
