# Change Log

All notable changes to the "dauns-variable-detective" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Creator information: Rasya Andrean (rasyaandrean@outlook.co.id)
- Logo and icon for the extension

### Changed

- Updated LICENSE file with creator information
- Updated README with new logo

## [0.0.1] - 2025-08-24

### Added

- Initial release
- Variable detection for let, const, and var declarations
- Support for .js, .ts, .jsx, .tsx files
- Quick Pick UI for browsing variables
- Navigation to variable declarations
- Tree View Panel for hierarchical variable display
- Workspace-wide variable scanning capability
- Folder-specific scanning from explorer context menu
- Unused variable detection feature
- Configurable settings for customization
- Progress indication for long-running operations
- Cancellable scanning operations
- Welcome view with quick actions in tree view
- Variable dependency analysis with circular dependency detection
- Variable lifecycle tracking with event monitoring
- Cross-reference tracking across multiple files
- Webview panels for detailed analysis visualization
- Advanced pattern recognition for unusual variable behavior
- Comprehensive refactoring tools suite
- Rename variable across workspace with preview
- Extract variable with smart naming suggestions
- Convert variable declaration with intelligent recommendations
- Inline variable functionality
- Refactoring submenu in context menu
- Multi-language parser system for Python, Vue.js, JSON, and YAML
- Advanced UI components including hover information, decorations, minimap indicators, breadcrumbs, and custom tree icons
- Interactive variable panel with webview interface
- Performance optimization strategies including async scanner, caching, memory management, debounced file watcher, and performance monitor

### Changed

- Enhanced variable scanner with better regex matching
- Improved type inference with additional type detection
- Extended file support and performance optimizations

### Fixed

- Improved regex patterns to avoid false positives
- Better handling of variable type inference
