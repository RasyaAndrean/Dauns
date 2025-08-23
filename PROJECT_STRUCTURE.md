# DAUNS Project Structure

This document describes the organization of files and directories in the DAUNS VS Code extension project.

## Root Directory

```
DAUNS/
├── src/                    # Source code
├── out/                    # Compiled output
├── node_modules/           # Dependencies
├── .vscode/                # VS Code configuration
├── .eslintrc.json          # ESLint configuration
├── .vscodeignore           # Files to ignore when packaging
├── package.json            # Project metadata and scripts
├── package-lock.json       # Dependency lock file
├── tsconfig.json           # TypeScript configuration
├── README.md               # Project overview and usage guide
├── LICENSE                 # License information
├── example.js              # Example file for testing
├── dauns-variable-detective-0.0.1.vsix  # Packaged extension
└── Documentation files (FEATURES.md, ROADMAP.md, etc.)
```

## Source Code Structure

```
src/
├── extension.ts              # Main extension entry point
├── variableScanner.ts        # Core variable scanning logic
├── workspaceScanner.ts       # Workspace-wide scanning functionality
├── treeViewProvider.ts       # Tree view implementation
├── configManager.ts          # Configuration management
├── unusedVariableDetector.ts # Unused variable detection
├── dependencyAnalyzer.ts     # Variable dependency analysis
├── variableLifecycle.ts      # Variable lifecycle tracking
├── crossReferenceTracker.ts  # Cross-reference tracking
├── parsers/                  # Multi-language parser system
│   ├── types.ts              # Shared types and interfaces
│   ├── parserFactory.ts      # Parser factory implementation
│   ├── javascriptParser.ts   # JavaScript/TypeScript parser
│   ├── pythonParser.ts       # Python parser
│   ├── vueParser.ts          # Vue.js parser
│   ├── jsonParser.ts         # JSON parser
│   ├── yamlParser.ts         # YAML parser
│   └── parserTest.ts         # Parser testing utilities
├── performance/              # Performance optimization components
│   ├── asyncScanner.ts       # Async file scanning with simulated workers
│   ├── cacheManager.ts       # Intelligent caching system
│   ├── memoryManager.ts      # Memory usage monitoring and management
│   ├── debounceManager.ts    # Debounced file watching
│   └── performanceMonitor.ts # Performance metrics and reporting
├── ui/                       # Advanced UI components
│   ├── variableHoverProvider.ts     # Variable hover information
│   ├── variableDecorationProvider.ts # Variable visual decorations
│   ├── minimapProvider.ts           # Minimap indicators
│   ├── variableBreadcrumbProvider.ts # Breadcrumb navigation
│   ├── customTreeIcons.ts           # Custom tree view icons
│   └── interactiveVariablePanel.ts   # Interactive webview panel
├── refactoring/              # Refactoring tools
│   ├── renameProvider.ts            # Variable renaming
│   ├── extractVariableProvider.ts   # Variable extraction
│   ├── convertVariableProvider.ts   # Variable conversion
│   ├── inlineVariableProvider.ts    # Variable inlining
│   └── refactoringCommands.ts       # Refactoring command registration
└── test/                     # Test suite
    ├── suite/                # Unit tests
    │   ├── extension.test.ts # Core extension tests
    │   └── index.ts          # Test runner
    ├── runTest.ts            # Test execution script
    ├── performanceTest.ts    # Performance component tests
    └── simplePerformanceTest.ts # Simple performance verification
```

## Component Descriptions

### Core Components

- **extension.ts**: Main entry point that initializes all components and registers commands
- **variableScanner.ts**: Implements the core variable detection logic for JavaScript/TypeScript
- **workspaceScanner.ts**: Handles scanning across entire workspaces
- **treeViewProvider.ts**: Provides the hierarchical variable view in the explorer
- **configManager.ts**: Manages user configuration through VS Code settings

### Analysis Components

- **unusedVariableDetector.ts**: Identifies potentially unused variables
- **dependencyAnalyzer.ts**: Analyzes relationships between variables
- **variableLifecycle.ts**: Tracks variable usage patterns
- **crossReferenceTracker.ts**: Tracks variable references across files

### Parser System

The parsers directory contains implementations for multiple languages:

- **types.ts**: Shared interfaces and types for all parsers
- **parserFactory.ts**: Factory for creating appropriate parsers based on file extensions
- **javascriptParser.ts**: Enhanced parser for JavaScript and TypeScript
- **pythonParser.ts**: Parser for Python files
- **vueParser.ts**: Parser for Vue.js single-file components
- **jsonParser.ts**: Parser for JSON files
- **yamlParser.ts**: Parser for YAML files

### Performance Optimization

The performance directory contains components that optimize extension performance:

- **asyncScanner.ts**: Non-blocking file processing
- **cacheManager.ts**: Intelligent result caching
- **memoryManager.ts**: Memory usage monitoring
- **debounceManager.ts**: Reduced processing of rapid updates
- **performanceMonitor.ts**: Metrics collection and reporting

### UI Components

The ui directory contains enhanced visualization components:

- **variableHoverProvider.ts**: Detailed information on hover
- **variableDecorationProvider.ts**: Visual indicators for variable states
- **minimapProvider.ts**: Variable indicators in the minimap
- **variableBreadcrumbProvider.ts**: Hierarchical navigation
- **customTreeIcons.ts**: Status-aware tree view icons
- **interactiveVariablePanel.ts**: Webview-based detailed view

### Refactoring Tools

The refactoring directory contains code transformation tools:

- **renameProvider.ts**: Workspace-wide variable renaming
- **extractVariableProvider.ts**: Code extraction utilities
- **convertVariableProvider.ts**: Variable declaration conversion
- **inlineVariableProvider.ts**: Variable inlining tools
- **refactoringCommands.ts**: Command registration and coordination

### Testing

The test directory contains the test suite:

- **suite/**: Unit tests for core functionality
- **performanceTest.ts**: Tests for performance components
- **simplePerformanceTest.ts**: Basic verification of performance components
- **runTest.ts**: Test execution script

## Output Directory

The out directory contains the compiled JavaScript files that are generated when the extension is built. This directory is automatically generated and should not be manually modified.

## Documentation

Documentation files are located in the root directory:

- **README.md**: Main project documentation
- **FEATURES.md**: Detailed feature descriptions
- **USAGE.md**: Usage instructions
- **ARCHITECTURE.md**: Technical architecture
- **ROADMAP.md**: Future development plans
- **CHANGELOG.md**: Version history
- **PROJECT_STRUCTURE.md**: This file
- **Language-specific documentation**: MULTI_LANGUAGE_PARSER_SUMMARY.md, etc.
- **Component-specific documentation**: ADVANCED_UI_COMPONENTS.md, etc.
