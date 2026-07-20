# Changelog

All notable changes to Everything Modern are documented in this file.

## 0.1.1 - 2026-07-20

### Added

- Added a desktop category module with list and grid views.
- Added desktop category sorting by name ascending, name descending, and custom order.
- Added drag-and-drop reordering for desktop category items when edit mode and custom sorting are enabled.
- Added a desktop category appearance dialog for adjusting list icon size, grid icon size, grid tile size, item name size, row spacing, and list row height.
- Added persistent icon disk caching under the app user data folder to avoid extracting the same icons on every launch.
- Added window visibility events and memory trimming hooks for lower background resource usage.

### Changed

- Improved desktop category editing so it stays visually close to the normal display mode.
- Improved grid layout so items are arranged according to the configured tile size and available window width.
- Improved icon extraction for Windows shortcuts, folders, extensionless application entries, and executable targets.
- Reduced icon loading pressure by loading icons on demand with a smaller concurrency limit and bounded in-memory caches.
- Reduced default search result page size to lower renderer memory usage.
- Centered settings dialogs opened from quick search mode.

### Fixed

- Fixed desktop category spacing that could leave overly large gaps between entries.
- Fixed rounded overlay clipping around compact search and modal surfaces.
- Fixed inconsistent behavior where some desktop applications with valid icons could appear without icons.
- Fixed custom desktop category ordering persistence.

### Performance

- Clears transient search results, folder results, and icon memory caches when the window is hidden.
- Enables renderer throttling while hidden and disables spellcheck to reduce background overhead.
- Keeps the app responsive while avoiding unnecessary repeated icon extraction.
