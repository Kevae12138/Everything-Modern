# Everything Modern

Everything Modern 是一个面向 Windows 的 Everything 现代化前端壳子。它保留 Everything 的高速本机文件搜索能力，同时提供更简洁的白色界面、快捷键呼出、桌面分类管理、树状文件夹浏览、外观设置和系统设置。

项目地址：https://github.com/Kevae12138/Everything-Modern

作者：Kevae12138

## 下载使用

普通用户不需要下载源码或自行构建，可以直接到 Releases 下载 Windows 版本：

https://github.com/Kevae12138/Everything-Modern/releases

使用方式：

1. 下载 `Everything-Modern-v0.1.0-win-x64.zip`
2. 解压压缩包
3. 双击运行 `Everything Modern.exe`

发布包中包含 Everything Modern 本体、Electron 运行时和 Everything Command-line Interface `es.exe`。搜索能力仍依赖本机已安装并运行 Everything 1.5。

## 项目定位

Everything 本身非常轻量、快速、稳定，但原生界面偏传统。Everything Modern 的目标不是替代 Everything 的索引能力，而是在 Everything 和 `es.exe` 的基础上，提供一个更适合日常快速调用的桌面搜索与桌面图标管理界面。

适合这些场景：

- 希望用更简洁的界面调用 Everything 搜索
- 希望通过快捷键快速弹出搜索框
- 希望把桌面软件和文件按分类整理
- 希望在一个左侧浮窗里浏览桌面文件夹内容
- 希望自由调整窗口圆角、按钮圆角、行距等界面细节

## 核心功能

### Everything 搜索

- 调用 Everything Command-line Interface `es.exe` 进行本机搜索
- 支持 Everything 1.5
- 支持普通关键词搜索
- 支持 Everything 搜索语法
- 支持按名称、路径、大小、扩展名、修改时间等字段排序
- 支持升序和降序
- 支持筛选全部、文件、文件夹
- 支持匹配路径
- 支持正则搜索
- 支持搜索结果分页加载
- 支持打开文件、定位文件、复制路径

### 图标显示

- 搜索结果支持显示文件图标
- 桌面分类支持显示软件、文件、文件夹图标
- 支持 `.lnk` 快捷方式图标解析
- 支持 `.url` 快捷方式图标解析
- 当快捷方式本身没有可用图标时，会尝试读取目标程序或图标路径
- 针对部分 Windows 程序图标，提供额外的系统图标提取兜底逻辑

### 快捷键快速搜索

- 支持设置全局快捷键呼出搜索框
- 快捷键打开时默认只显示极简搜索框
- 极简搜索框默认居中显示
- 搜索提交后，窗口会恢复成完整搜索结果界面，并重新位于屏幕中央
- 极简搜索框失焦后会自动隐藏
- 普通方式打开软件时，不会进入极简模式，会默认显示完整搜索界面

### 桌面分类

桌面分类是 Everything Modern 除搜索之外的主要功能。它会读取当前用户桌面和公共桌面的内容，并以和搜索结果相似的列表样式展示。

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

桌面分类的设计类似手机里的图标文件夹：用户可以把桌面上的软件和文件整理到不同分类里，让桌面管理更清爽。

### 桌面分类快捷键

- 支持单独设置“桌面分类快捷键”
- 使用该快捷键打开时，只显示桌面分类模块
- 桌面分类浮窗默认出现在屏幕左侧
- 窗口与屏幕上边、下边、左边保留较大边距，避免贴边
- 桌面分类浮窗失焦后会自动隐藏

### 树状文件夹浏览

系统设置中可以开启“显示树状结构”。

开启后：

- 桌面分类中的文件夹可以直接在软件内打开
- 双击文件夹后，不会跳到 Windows 资源管理器，而是在当前模块里显示文件夹内容
- 支持继续进入子文件夹
- 顶部提供路径导航，可以回到桌面根级或上级文件夹

关闭后：

- 双击文件夹会按普通文件夹打开方式交给系统处理

### 外观设置

Everything Modern 提供可视化外观设置，并自动保存。

当前支持调整：

- 窗口圆角
- 输入框圆角
- 按钮圆角
- 搜索结果行高
- 搜索结果行间距
- 界面字号
- 列表字号
- 工具栏高度
- 边框强度

这些设置可以让用户按自己的审美调整界面，例如更紧凑、更宽松、更圆润或更接近原生 Everything 的信息密度。

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

“关于”区域会显示：

- 项目地址
- 作者

## 界面模式

Everything Modern 当前主要有三种打开状态：

### 普通打开

从 exe、任务栏、托盘等方式打开时，默认显示完整搜索界面。

### 快捷搜索打开

通过快速调用快捷键打开时，只显示一个居中的短搜索框。输入关键词并搜索后，会切换回完整搜索结果界面。

### 桌面分类打开

通过桌面分类快捷键打开时，只显示桌面分类模块，并出现在屏幕左侧。

## 环境要求

- Windows 10/11
- Node.js 20 或更新版本
- Everything 1.5
- Everything Command-line Interface `es.exe`

> 本项目不包含 Everything 或 `es.exe` 的二进制文件。请从 voidtools 官方渠道安装 Everything，并下载对应的 ES 命令行工具。

## 开发运行

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

## 构建

构建前端资源：

```bash
npm run build
```

构建 Windows 便携版：

```bash
npm run dist:portable
```

## 配置 ES

开发或打包前，请将 `es.exe` 放到：

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

## 注意事项

- Everything Modern 是第三方前端壳子，不隶属于 voidtools
- Everything 和 `es.exe` 的版权归其各自权利人所有
- 本仓库不提交 `node_modules/`
- 本仓库不提交打包后的 exe
- 本仓库不提交本地 `es.exe`
- 可直接运行的 Windows 发布包会放在 GitHub Releases

## 开源协议

本项目基于 MIT License 开源。
