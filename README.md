# Everything Modern

Everything Modern 是一个面向 Windows 的 Everything 前端壳子，目标是在保留 Everything 高速搜索能力的基础上，提供更现代、简洁的界面，并增加桌面分类管理、快捷键呼出、外观设置等功能。

项目地址：https://github.com/Kevae12138/Everything-Modern

作者：Kevae12138

## 功能

- 调用 Everything/ES 命令行进行本机文件搜索
- 支持文件图标显示，包括 `.lnk` 和 `.url` 快捷方式图标解析
- 支持搜索排序、类型筛选、匹配路径、正则等搜索选项
- 支持快捷键呼出极简搜索框
- 支持桌面分类模块和树状文件夹浏览
- 支持窗口圆角、按钮圆角、行高、行间距等外观设置
- 支持系统自启动、后台驻留、快捷键配置

## 环境要求

- Windows 10/11
- Node.js 20 或更新版本
- Everything 1.5
- Everything Command-line Interface `es.exe`

> 本项目不包含 Everything 或 `es.exe` 的二进制文件。请从 voidtools 官方渠道安装 Everything，并下载对应的 ES 命令行工具。

## 开发运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
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

## 开源协议

本项目基于 MIT License 开源。

Everything 是 voidtools 的软件，本项目只是第三方前端壳子，不隶属于 voidtools。
