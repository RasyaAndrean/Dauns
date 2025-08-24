# Change Log

All notable changes to the "dauns-variable-detective" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [8.8.0] - 2025-08-25

### Added

- Version update to 8.8.0
- Comprehensive code quality improvements and linting error fixes
- Enhanced test suite with all tests passing
- Improved variable statistics calculation
- Better environment configuration for development

### Changed

- Removed unused parameters and variables throughout the codebase
- Optimized function signatures by removing unused context parameters
- Fixed curly brace warnings by adding braces to all if statements
- Updated ESLint configuration with proper environment definitions
- Improved code maintainability and readability

### Fixed

- Resolved compilation errors after parameter removal
- Fixed failing tests in code insights and variable statistics modules
- Corrected variable name assertions in test suite
- Fixed mostUsedVariables calculation to properly exclude unused variables

## [2.8.0] - 2025-08-25

### Added

- Version update to 2.8.0
- Creator information: Rasya Andrean (rasyaandrean@outlook.co.id)
- Logo and icon for the extension
- AI-powered code analysis features:
  - Smart variable analysis with naming and usage recommendations
  - Code quality metrics and improvement suggestions
  - Security vulnerability detection for variable usage
  - Team collaboration for sharing analysis results
  - Internationalization (i18n) support with multiple languages
- New commands for AI features:
  - Analyze Code Quality with AI
  - Analyze Code Security
  - Share Analysis with Team
  - Select Language (i18n)
- Variable Usage Tracking features:
  - Track how many times each variable is used
  - Highlight unused variables
  - Show variable references count
  - Dead code detection
- Scope Analysis features:
  - Visual indication of variable scope (global, function, block)
  - Scope hierarchy visualization
  - Variable shadowing detection
  - Scope-based variable grouping
- Variable Statistics features:
  - Most used variables tracking
  - Variable complexity metrics
  - File variable count
  - Project-wide variable analysis
- Code Insights features:
  - Variable lifecycle tracking
  - Memory usage estimates
  - Performance impact indicators
  - Best practices suggestions
- Variable Journey Mode features:
  - Trace variable from declaration to usage
  - Visual flow diagram
  - Interactive variable timeline
- New commands for Variable Analysis features:
  - Track Variable Usage
  - Show Variable Usage Report
  - Analyze Variable Scopes
  - Show Scope Report
  - Show Refactoring Suggestions
  - Show Variable Statistics
  - Show Code Insights
  - Show Variable Journey
  - Show Minimap Legend

### Changed

- Updated LICENSE file with creator information
- Updated README with new logo and implemented AI features
- Improved project structure and organization
- Enhanced documentation for implemented features

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
