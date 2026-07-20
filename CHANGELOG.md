# Changelog / 更新日志

All notable changes to Everything Modern are documented in this file.

Everything Modern 的重要变更都会记录在此文件中。

## 0.1.1 - 2026-07-20

### Added / 新增

- Added a desktop category module with list and grid views.
  新增桌面分类模块，支持列表视图和网格视图。
- Added desktop category sorting by name ascending, name descending, and custom order.
  新增桌面分类排序，支持名称升序、名称降序和自定义排序。
- Added drag-and-drop reordering for desktop category items when edit mode and custom sorting are enabled.
  在编辑模式且启用自定义排序时，支持拖拽调整桌面分类项目顺序。
- Added a desktop category appearance dialog for adjusting list icon size, grid icon size, grid tile size, item name size, row spacing, and list row height.
  新增桌面分类外观设置弹窗，可调整列表图标、网格图标、网格方框、名称大小、行距和列表行高。
- Added persistent icon disk caching under the app user data folder to avoid extracting the same icons on every launch.
  新增图标磁盘缓存，缓存保存在应用用户数据目录中，避免每次启动重复提取相同图标。
- Added window visibility events and memory trimming hooks for lower background resource usage.
  新增窗口可见性事件和内存清理接口，用于降低后台资源占用。

### Changed / 改进

- Improved desktop category editing so it stays visually close to the normal display mode.
  优化桌面分类编辑模式，使其视觉效果更接近正常显示模式。
- Improved grid layout so items are arranged according to the configured tile size and available window width.
  优化网格布局，使项目根据设置的方框大小和窗口可用宽度自动排列。
- Improved icon extraction for Windows shortcuts, folders, extensionless application entries, and executable targets.
  优化 Windows 快捷方式、文件夹、无扩展名应用入口和可执行文件目标的图标提取。
- Reduced icon loading pressure by loading icons on demand with a smaller concurrency limit and bounded in-memory caches.
  通过按需加载、限制并发和控制内存缓存上限，降低图标加载压力。
- Reduced default search result page size to lower renderer memory usage.
  降低默认搜索结果分页数量，以减少渲染进程内存占用。
- Centered settings dialogs opened from quick search mode.
  修复快捷搜索模式下打开设置弹窗时的位置，使其显示在屏幕中央。

### Fixed / 修复

- Fixed desktop category spacing that could leave overly large gaps between entries.
  修复桌面分类条目之间可能出现过大间隔的问题。
- Fixed rounded overlay clipping around compact search and modal surfaces.
  修复紧凑搜索框和弹窗圆角区域外遮罩溢出的问题。
- Fixed inconsistent behavior where some desktop applications with valid icons could appear without icons.
  修复部分桌面应用明明有图标但在软件内不显示图标的问题。
- Fixed custom desktop category ordering persistence.
  修复桌面分类自定义排序的持久化问题。

### Performance / 性能

- Clears transient search results, folder results, and icon memory caches when the window is hidden.
  窗口隐藏时清理临时搜索结果、文件夹结果和图标内存缓存。
- Enables renderer throttling while hidden and disables spellcheck to reduce background overhead.
  窗口隐藏时启用渲染节流，并关闭拼写检查以降低后台开销。
- Keeps the app responsive while avoiding unnecessary repeated icon extraction.
  在保持软件响应速度的同时，避免不必要的重复图标提取。
