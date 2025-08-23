# DAUNS Extension Features

## 🌳 Tree View Panel

### Overview

The Tree View Panel provides a hierarchical view of all detected variables, organized by file. This feature enhances the user experience by offering a more comprehensive and persistent view of variables compared to the Quick Pick interface.

### Features

- Hierarchical organization of variables by file
- Persistent view in the Explorer panel
- Collapsible sections for easy navigation
- File-level and variable-level information
- Refresh and clear functionality

### Usage

1. Open a JavaScript or TypeScript file
2. Run any scan command (single file, folder, or workspace)
3. View results in the "DAUNS Variables" tree view in the Explorer panel
4. Click on any variable to navigate to its declaration

## 🌐 Workspace-wide Scanning

### Overview

Scan variables across your entire workspace or specific folders, providing project-wide visibility into variable usage.

### Features

- Full workspace scanning
- Folder-specific scanning from Explorer context menu
- Progress indication during scanning
- Cancellable operations
- Performance optimizations for large projects

### Usage

- **Workspace Scan**: Use Command Palette → "DAUNS: Scan Variables in Workspace"
- **Folder Scan**: Right-click on any folder in Explorer → "Scan Variables in Folder"

## 🔍 Unused Variable Detection

### Overview

Identify potentially unused variables to help clean up your codebase and eliminate dead code.

### Features

- Detection of variables with minimal usage
- Quick Pick interface for reviewing unused variables
- Detailed information about usage count and location
- Filtering to exclude function declarations

### Usage

1. Open a JavaScript or TypeScript file
2. Right-click in the editor → "Detect Unused Variables"
3. Review the list of potentially unused variables
4. Navigate to variables for further inspection

## 🔄 Variable Dependency Analysis

### Overview

Analyze relationships between variables to understand how they depend on each other within a file.

### Features

- Dependency graph visualization
- Circular dependency detection
- Webview panel for detailed analysis
- Relationship mapping between variables

### Usage

1. Open a JavaScript or TypeScript file
2. Right-click in the editor → "Analyze Variable Dependencies"
3. View the dependency graph in a webview panel
4. Identify circular dependencies and complex relationships

## 📈 Variable Lifecycle Tracking

### Overview

Monitor the complete lifecycle of variables from declaration through assignments to usage.

### Features

- Event tracking (declaration, assignment, usage, modification)
- Scope analysis (global, function, block)
- Unusual pattern detection
- Webview panel for detailed analysis

### Usage

1. Open a JavaScript or TypeScript file
2. Right-click in the editor → "Track Variable Lifecycle"
3. View the complete lifecycle of all variables in a webview panel
4. Identify variables with unusual usage patterns

## 🔧 Refactoring Tools

### Overview

Automate common code improvements with intelligent refactoring tools.

### Features

- **Rename Variable**: Rename a variable across the entire workspace with preview
- **Extract Variable**: Convert selected code into a new variable
- **Smart Extract Variable**: Extract with intelligent naming suggestions
- **Convert Variable**: Change variable declaration type (var/let/const)
- **Smart Convert Variable**: Get recommendations for best declaration type
- **Inline Variable**: Replace variable usages with its value

### Usage

1. Open a JavaScript or TypeScript file
2. Select text to extract or place cursor on a variable declaration
3. Right-click and select from the "Refactoring" submenu
4. Follow the prompts to complete the refactoring

#### Rename Variable Across Workspace

1. Right-click in the editor → "Rename Variable Across Workspace"
2. Enter the name of the variable to rename
3. Review the preview of affected files
4. Confirm and enter the new variable name
5. The extension will rename the variable across all files

#### Extract Variable

1. Select the code you want to extract
2. Right-click → "Extract Variable"
3. Enter a name for the new variable
4. The extension will create a new variable declaration and replace the selected code

#### Extract Variable with Smart Naming

1. Select the code you want to extract
2. Right-click → "Extract Variable with Smart Naming"
3. Review the suggested variable name or enter your own
4. The extension will create a new variable declaration and replace the selected code

#### Convert Variable Declaration

1. Place cursor on a variable declaration line
2. Right-click → "Convert Variable Declaration"
3. Select the new declaration type (var/let/const)
4. The extension will update the declaration

#### Convert Variable with Smart Suggestions

1. Place cursor on a variable declaration line
2. Right-click → "Convert Variable with Smart Suggestions"
3. Review the recommendation and select the new declaration type
4. The extension will update the declaration

#### Inline Variable

1. Place cursor on a variable declaration line
2. Right-click → "Inline Variable"
3. Confirm the inlining operation
4. The extension will replace all usages with the variable's value and remove the declaration

## ⚙️ Configurable Settings

### Overview

Customize the extension behavior through VS Code settings to match your workflow and preferences.

### Available Settings

- `dauns.fileExtensions`: File extensions to scan for variables
- `dauns.includeNodeModules`: Include node_modules directory in workspace scans
- `dauns.maxFileSizeKB`: Maximum file size to scan (in KB)
- `dauns.showFunctionVariables`: Show function variables in results
- `dauns.showUnusedVariablesWarning`: Show warning for unused variables
- `dauns.customVariablePatterns`: Custom regex patterns for variable detection

### Usage

1. Open VS Code Settings (Ctrl+, or Cmd+,)
2. Search for "DAUNS" to find extension settings
3. Modify settings according to your preferences

## 🚀 Performance Optimizations

### Overview

The extension implements several performance optimizations to ensure smooth operation even with large codebases.

### Features

- Progress indicators for long-running operations
- Cancellable scanning operations
- Efficient file processing
- Memory-conscious data handling

## 🎨 Enhanced User Interface

### Overview

The extension provides multiple UI options for viewing variable information.

### Features

- Quick Pick interface for focused interaction
- Tree View panel for persistent hierarchical display
- Context menus for easy access to commands
- Welcome view with quick actions
- Icons and visual indicators
- Webview panels for detailed analysis
- Refactoring submenu for code improvements

## 📊 Export Capabilities

### Overview

Future versions will include capabilities to export variable data for further analysis.

### Planned Features

- Export to CSV/JSON formats
- Generate documentation from variables
- Variable usage reports
- Code metrics dashboard

## 🌍 Multi-language Support

### Overview

Future versions will expand support beyond JavaScript and TypeScript.

### Planned Features

- Python variable detection
- Java, C#, PHP support
- Framework-specific patterns (Vue.js, React, Angular)
- JSON/XML property detection

## 🛠️ Technical Implementation

### Tree View Provider

Located in [treeViewProvider.ts](file:///D:/DAUNS/src/treeViewProvider.ts), this module implements the VS Code Tree View API to display variables in a hierarchical structure.

### Workspace Scanner

Located in [workspaceScanner.ts](file:///D:/DAUNS/src/workspaceScanner.ts), this module handles scanning multiple files across the workspace or specific folders.

### Unused Variable Detector

Located in [unusedVariableDetector.ts](file:///D:/DAUNS/src/unusedVariableDetector.ts), this module identifies potentially unused variables through usage analysis.

### Configuration Manager

Located in [configManager.ts](file:///D:/DAUNS/src/configManager.ts), this module handles extension configuration and settings management.

### Dependency Analyzer

Located in [dependencyAnalyzer.ts](file:///D:/DAUNS/src/dependencyAnalyzer.ts), this module analyzes relationships between variables and detects circular dependencies.

### Cross Reference Tracker

Located in [crossReferenceTracker.ts](file:///D:/DAUNS/src/crossReferenceTracker.ts), this module tracks variable usage across multiple files.

### Variable Lifecycle Tracker

Located in [variableLifecycle.ts](file:///D:/DAUNS/src/variableLifecycle.ts), this module monitors the complete lifecycle of variables from declaration to usage.

### Refactoring Tools

Located in [src/refactoring/](file:///D:/DAUNS/src/refactoring/), these modules provide automated code improvement capabilities:

- [renameProvider.ts](file:///D:/DAUNS/src/refactoring/renameProvider.ts) - Workspace-wide variable renaming
- [extractVariableProvider.ts](file:///D:/DAUNS/src/refactoring/extractVariableProvider.ts) - Code extraction tools
- [convertVariableProvider.ts](file:///D:/DAUNS/src/refactoring/convertVariableProvider.ts) - Variable declaration conversion
- [inlineVariableProvider.ts](file:///D:/DAUNS/src/refactoring/inlineVariableProvider.ts) - Variable inlining tools
- [refactoringCommands.ts](file:///D:/DAUNS/src/refactoring/refactoringCommands.ts) - Command registration and coordination
