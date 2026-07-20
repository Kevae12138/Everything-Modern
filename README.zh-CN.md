# Everything Modern

![GitHub release](https://img.shields.io/github/v/release/Kevae12138/Everything-Modern?style=flat-square)
![GitHub downloads](https://img.shields.io/github/downloads/Kevae12138/Everything-Modern/total?style=flat-square)
![License](https://img.shields.io/github/license/Kevae12138/Everything-Modern?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows-0078d4?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-43-47848f?style=flat-square)
![React](https://img.shields.io/badge/React-19-149eca?style=flat-square)

[English](README.md) | 简体中文

Everything Modern 是一个面向 Windows 的 Everything 现代化前端壳子。它把 Everything 的高速本机文件搜索能力，包装成更简洁的白色桌面应用，并加入全局快捷键、桌面分类、树状文件夹浏览、图标解析、外观设置和后台驻留等功能。

> Everything Modern is a modern Windows shell for Everything search, with global hotkeys, desktop categorization, tree-style folder browsing, and a cleaner Electron + React interface.

- 项目地址：https://github.com/Kevae12138/Everything-Modern
- 作者：Kevae12138
- 当前版本：`v0.1.1`

## 下载

普通用户不需要下载源码或自行构建，可以直接到 Releases 下载 Windows 版本：

[下载 Everything Modern v0.1.1](https://github.com/Kevae12138/Everything-Modern/releases/tag/v0.1.1)

使用方式：

1. 下载 `Everything-Modern-v0.1.1-win-x64.zip`
2. 解压压缩包
3. 双击运行 `Everything Modern.exe`

发布包中包含 Everything Modern 本体、Electron 运行时和 Everything Command-line Interface `es.exe`。搜索能力仍依赖本机已安装并运行 Everything 1.5。

## 目录

- [功能特性](#功能特性)
- [桌面分类](#桌面分类)
- [界面模式](#界面模式)
- [安装要求](#安装要求)
- [源码构建](#源码构建)
- [构建发布](#构建发布)
- [常见问题](#常见问题)
- [第三方声明](#第三方声明)
- [开源协议](#开源协议)

## 功能特性

### Everything 搜索

- 调用 Everything Command-line Interface `es.exe` 进行本机搜索
- 支持 Everything 1.5
- 支持普通关键词和 Everything 搜索语法
- 支持按名称、路径、大小、扩展名、修改时间等字段排序
- 支持升序、降序、文件类型筛选、匹配路径、正则搜索
- 支持搜索结果分页加载
- 支持打开文件、定位文件、复制路径

### 图标解析

- 搜索结果和桌面分类都支持显示文件图标
- 支持普通文件、文件夹、软件快捷方式图标
- 支持 `.lnk` 快捷方式图标解析
- 支持 `.url` 快捷方式图标解析
- 当快捷方式本身没有可用图标时，会继续尝试读取目标程序或图标路径
- 针对部分 Windows 程序图标，提供系统图标提取兜底逻辑

### 快捷键

- 支持全局快捷键呼出极简搜索框
- 支持单独设置桌面分类快捷键
- 快捷搜索框默认居中显示
- 输入关键词并搜索后，窗口会恢复成完整搜索结果界面并重新居中
- 快捷搜索框和桌面分类浮窗失焦后会自动隐藏

### 外观设置

Everything Modern 提供可视化外观设置，并自动保存：

- 窗口圆角
- 输入框圆角
- 按钮圆角
- 搜索结果行高
- 搜索结果行间距
- 界面字号
- 列表字号
- 工具栏高度
- 边框强度

### 系统设置

系统设置里包含软件行为相关选项：

- 参考上次搜索逻辑
- 是否系统自启动
- 是否存在后台
- 显示窗口软件名称
- 快速调用快捷键
- 显示桌面分类
- 显示树状结构
- 桌面分类快捷键
- 关于

## 桌面分类

桌面分类是 Everything Modern 除搜索之外的主要功能。它会读取当前用户桌面和公共桌面的内容，并以类似搜索结果的列表样式展示。

它适合用来整理桌面软件、文件和文件夹，思路接近手机系统里的图标文件夹：用户可以把桌面上的项目分到不同分类，让桌面管理更清爽。

支持能力：

- 自动识别桌面项目
- 支持桌面软件快捷方式
- 支持桌面普通文件
- 支持桌面文件夹
- 支持显示对应图标
- 支持新建分类
- 支持给桌面项目分配分类
- 支持编辑分类名称
- 支持删除分类
- 支持在编辑模式下拖拽调整分类顺序
- 支持在编辑模式下显示类型和分类选择
- 非编辑模式下保持更简洁的展示

### 树状文件夹浏览

系统设置中可以开启“显示树状结构”。

开启后：

- 桌面分类中的文件夹可以直接在软件内打开
- 双击文件夹后，不会跳到 Windows 资源管理器，而是在当前模块里显示文件夹内容
- 支持继续进入子文件夹
- 顶部提供路径导航，可以回到桌面根级或上级文件夹

关闭后：

- 双击文件夹会按普通文件夹打开方式交给系统处理

## 界面模式

Everything Modern 当前主要有三种打开状态：

| 模式 | 触发方式 | 行为 |
| --- | --- | --- |
| 普通打开 | exe、任务栏、托盘 | 默认显示完整搜索界面 |
| 快捷搜索 | 快速调用快捷键 | 只显示居中的极简搜索框，搜索后恢复完整结果页 |
| 桌面分类 | 桌面分类快捷键 | 只显示桌面分类模块，窗口位于屏幕左侧并保留边距 |

## 安装要求

- Windows 10/11
- Everything 1.5

如果你只想使用软件，请下载 Releases 中的 Windows 压缩包。

如果你想修改源码或自行构建，还需要：

- Node.js 20 或更新版本
- Everything Command-line Interface `es.exe`，用于打包后的搜索功能

> 本项目不包含 Everything 的索引服务。请从 voidtools 官方渠道安装并运行 Everything。

## 源码构建

安装依赖：

```bash
npm install
```

构建前端资源：

```bash
npm run build
```

## 构建发布

构建 Windows 便携版：

```bash
npm run dist:portable
```

打包或运行搜索功能前，请将 `es.exe` 放到：

```text
vendor/es/es.exe
```

也可以通过环境变量指定 Everything 安装路径：

```text
EVERYTHING_EXE_PATH=C:\Program Files\Everything\Everything.exe
```

程序会尝试查找以下位置：

- `EVERYTHING_EXE_PATH`
- `D:\Software\Everything\Everything.exe`
- `C:\Program Files\Everything\Everything.exe`
- `C:\Program Files (x86)\Everything\Everything.exe`
- `%LOCALAPPDATA%\Programs\Everything\Everything.exe`

## 技术栈

- Electron
- React
- TypeScript
- Vite
- lucide-react
- Everything CLI `es.exe`

## 常见问题

### 它能替代 Everything 吗？

不能。Everything Modern 是 Everything 的第三方前端壳子，文件索引和搜索能力仍来自 Everything。

### 为什么源码仓库里没有 exe？

GitHub 普通源码仓库不适合提交大型二进制文件，打包好的 Windows 版本放在 GitHub Releases 中。

### 为什么源码仓库里没有 `es.exe`？

`es.exe` 来自 voidtools。源码仓库只保留放置位置说明，发布包会携带运行所需文件。

### 为什么有些功能依赖 Everything 1.5？

项目当前按 Everything 1.5 和 ES 命令行工具进行适配，旧版本 Everything 可能缺少需要的查询能力或返回字段。

## 第三方声明

- Everything Modern 是第三方前端壳子，不隶属于 voidtools
- Everything 和 `es.exe` 的版权归其各自权利人所有
- Electron 运行时随 Windows 发布包一起分发
- 本仓库不提交 `node_modules/`
- 本仓库不提交打包后的 exe
- 本仓库不提交本地 `es.exe`
- 可直接运行的 Windows 发布包会放在 GitHub Releases

更多信息见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 开源协议

本项目基于 MIT License 开源。
