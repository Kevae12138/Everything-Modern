# Changelog / 更新日志

All notable changes to Everything Modern are documented in this file.

Everything Modern 的重要变更都会记录在此文件中。

## 0.1.2 - 2026-07-21

### Added / 新增

- Added desktop category layout controls for vertical or horizontal category placement.
  新增桌面分类排列方向设置，支持垂直或水平显示分类。
- Added desktop category placement controls for showing categories at the top or bottom of the desktop module.
  新增桌面分类位置设置，支持将分类放在桌面分类模块顶部或底部。
- Added a horizontal category row limit setting with a range from 1 to 6 categories per row.
  新增水平分类每行数量设置，可在 1 到 6 个分类之间调整。
- Added three desktop category label styles: full fill, name badge, and name underline.
  新增三种分类标签样式：整块填充、名称色块、名称下划线。
- Added per-category color settings from the desktop category right-click menu.
  新增单个分类颜色设置，可通过右键分类并选择“颜色设置”进入。
- Added per-category color controls for category text, filled background, underline, and name badge colors.
  新增每个分类独立的颜色控制，可调整分类名颜色、整块填充色、下划线颜色和名称色块颜色。

### Changed / 改进

- Desktop category names can now be temporarily blank while edit mode is active.
  桌面分类名称在编辑模式中允许临时留空。
- The desktop category appearance dialog now keeps category label style selection separate from per-category colors.
  桌面分类外观设置中的“分类标签”只保留标签样式选择，分类颜色改为单独右键设置。
- Desktop category label colors now remain visible in the normal state, while the selected category uses the default selected fill.
  桌面分类标签颜色现在会在常态显示，选中分类时统一使用默认选中填充色。
- The default fill color for the full-fill category label style is now white.
  “整块填充”分类标签样式的默认方框颜色改为白色。
- Desktop category assignment dropdowns now use the same custom dropdown style as the global filters.
  桌面分类编辑模式中的分类分配下拉框现在与全局筛选下拉框保持一致。

### Fixed / 修复

- Fixed desktop category assignment dropdown popovers being covered by following table rows.
  修复桌面分类编辑模式中的分类分配下拉选项被后续表格行遮挡的问题。
- Fixed desktop category assignment dropdown layering by lifting only the dropdown option popover instead of the whole row.
  修复桌面分类分配下拉框的层级关系，仅提升下拉选项浮层，不再提升整行或单元格。
- Fixed desktop category assignment dropdown positioning so option popovers stay within the desktop list area and are not covered by other category controls.
  修复桌面分类分配下拉选项的位置计算，使其不超出桌面列表顶部，也不会被其他分类控件遮挡。
- Prevents leaving desktop category edit mode while any category name is blank, and prompts the user to complete the name first.
  当存在空分类名时禁止退出桌面分类编辑模式，并提示用户先填写分类名。

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
