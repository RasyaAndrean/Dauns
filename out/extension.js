"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const dependencyAnalyzer_1 = require("./dependencyAnalyzer");
const parserFactory_1 = require("./parsers/parserFactory");
const asyncScanner_1 = require("./performance/asyncScanner");
const cacheManager_1 = require("./performance/cacheManager");
const debounceManager_1 = require("./performance/debounceManager");
const memoryManager_1 = require("./performance/memoryManager");
const performanceMonitor_1 = require("./performance/performanceMonitor");
const refactoringCommands_1 = require("./refactoring/refactoringCommands");
const treeViewProvider_1 = require("./treeViewProvider");
const interactiveVariablePanel_1 = require("./ui/interactiveVariablePanel");
const minimapProvider_1 = require("./ui/minimapProvider");
const variableBreadcrumbProvider_1 = require("./ui/variableBreadcrumbProvider");
const variableDecorationProvider_1 = require("./ui/variableDecorationProvider");
const variableHoverProvider_1 = require("./ui/variableHoverProvider");
const unusedVariableDetector_1 = require("./unusedVariableDetector");
const variableLifecycle_1 = require("./variableLifecycle");
const variableScanner_1 = require("./variableScanner");
const workspaceScanner_1 = require("./workspaceScanner");
function activate(context) {
    console.log('Dauns extension is now active!');
    // Create the tree view provider
    const treeViewProvider = new treeViewProvider_1.VariablesTreeViewProvider(vscode.workspace.rootPath);
    const treeView = vscode.window.createTreeView('daunsVariables', {
        treeDataProvider: treeViewProvider,
    });
    // Create the workspace scanner
    const workspaceScanner = new workspaceScanner_1.WorkspaceScanner(treeViewProvider);
    // Create the parser factory
    const parserFactory = new parserFactory_1.ParserFactory();
    // Create performance optimization components
    const asyncScanner = new asyncScanner_1.AsyncScanner(4); // 4 worker threads
    const cacheManager = new cacheManager_1.CacheManager();
    const memoryManager = new memoryManager_1.MemoryManager();
    const debounceManager = new debounceManager_1.DebounceManager(500); // 500ms debounce delay
    const performanceMonitor = new performanceMonitor_1.PerformanceMonitor();
    // Start performance monitoring
    performanceMonitor.startMonitoring();
    memoryManager.monitorMemoryUsage();
    // Register memory cleanup callback
    memoryManager.registerCleanupCallback(() => {
        cacheManager.clearCache();
    });
    // Create UI components
    const hoverProvider = new variableHoverProvider_1.VariableHoverProvider();
    const decorationProvider = new variableDecorationProvider_1.VariableDecorationProvider();
    const minimapProvider = new minimapProvider_1.MinimapProvider();
    const breadcrumbProvider = new variableBreadcrumbProvider_1.VariableBreadcrumbProvider();
    const interactivePanel = new interactiveVariablePanel_1.InteractiveVariablePanel();
    // Register UI components
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file' }, hoverProvider));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: 'file' }, breadcrumbProvider));
    // Register refactoring commands
    refactoringCommands_1.RefactoringCommands.registerCommands(context);
    // Update decorations when the active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            const timer = performanceMonitor.startOperation('updateDecorations');
            decorationProvider.updateDecorations(editor);
            minimapProvider.updateMinimap(editor);
            timer.end();
        }
    });
    // Update decorations when the text document changes
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === event.document) {
            // Debounce the update to avoid excessive processing
            debounceManager.debounceFileUpdate(event.document.fileName, () => {
                const timer = performanceMonitor.startOperation('debouncedUpdate');
                decorationProvider.updateDecorations(editor);
                minimapProvider.updateMinimap(editor);
                timer.end();
            });
        }
    });
    // Handle file saves
    vscode.workspace.onDidSaveTextDocument(document => {
        // Debounce workspace updates
        debounceManager.debounceWorkspaceUpdate(() => {
            const timer = performanceMonitor.startOperation('fileSave');
            // Clear cache for this file
            cacheManager.clearCache();
            // Update tree view if it's the active file
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document) {
                // Trigger a refresh of the tree view
                treeViewProvider.refresh();
            }
            timer.end();
        });
    });
    let disposable = vscode.commands.registerCommand('dauns.scanVariables', () => {
        const timer = performanceMonitor.startOperation('scanVariables');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            performanceMonitor.recordError();
            timer.end();
            return;
        }
        const document = editor.document;
        const fileExtension = document.fileName.substring(document.fileName.lastIndexOf('.'));
        // Try to get cached result first
        const cachedResult = cacheManager.getCachedResult(document.fileName);
        if (cachedResult) {
            performanceMonitor.recordCacheHit();
            // Use cached result
            const variables = cachedResult.variables;
            // Update the tree view with the cached variables
            treeViewProvider.updateVariables(document.fileName, variables);
            // Update decorations and minimap
            decorationProvider.updateDecorations(editor);
            minimapProvider.updateMinimap(editor);
            const quickPickItems = variables.map((variable) => ({
                label: variable.name,
                description: `${variable.type} (${variable.declarationType || variable.kind || 'unknown'})`,
                detail: `Line ${variable.line}, Column ${variable.character}`,
            }));
            vscode.window
                .showQuickPick(quickPickItems, {
                placeHolder: 'Select a variable to see more details',
                matchOnDetail: true,
            })
                .then(selection => {
                if (selection) {
                    const selectedVariable = variables.find((v) => v.name === selection.label);
                    if (selectedVariable) {
                        const position = new vscode.Position(selectedVariable.line - 1, selectedVariable.character - 1);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                    }
                }
            });
            timer.end();
            return;
        }
        performanceMonitor.recordCacheMiss();
        // Try to get a parser for this file type
        const parser = parserFactory.getParser(fileExtension);
        let variables = [];
        if (parser) {
            // Use the appropriate parser for this language
            variables = parser.parseVariables(document.getText(), document.fileName);
        }
        else {
            // Fall back to the original JavaScript/TypeScript scanner
            variables = (0, variableScanner_1.scanVariablesInDocument)(document);
        }
        // Cache the result
        cacheManager.setCachedResult(document.fileName, variables);
        if (variables.length === 0) {
            vscode.window.showInformationMessage('No variables found in the current file.');
            timer.end();
            return;
        }
        // Update the tree view with the new variables
        treeViewProvider.updateVariables(document.fileName, variables);
        // Update decorations and minimap
        decorationProvider.updateDecorations(editor);
        minimapProvider.updateMinimap(editor);
        const quickPickItems = variables.map((variable) => ({
            label: variable.name,
            description: `${variable.type} (${variable.declarationType || variable.kind || 'unknown'})`,
            detail: `Line ${variable.line}, Column ${variable.character}`,
        }));
        vscode.window
            .showQuickPick(quickPickItems, {
            placeHolder: 'Select a variable to see more details',
            matchOnDetail: true,
        })
            .then(selection => {
            if (selection) {
                const selectedVariable = variables.find((v) => v.name === selection.label);
                if (selectedVariable) {
                    const position = new vscode.Position(selectedVariable.line - 1, selectedVariable.character - 1);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                }
            }
        });
        timer.end();
    });
    // Register a command to detect unused variables
    const detectUnusedCommand = vscode.commands.registerCommand('dauns.detectUnusedVariables', () => {
        const timer = performanceMonitor.startOperation('detectUnusedVariables');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            performanceMonitor.recordError();
            timer.end();
            return;
        }
        const document = editor.document;
        const variables = (0, variableScanner_1.scanVariablesInDocument)(document);
        if (variables.length === 0) {
            vscode.window.showInformationMessage('No variables found in the current file.');
            timer.end();
            return;
        }
        const unusedVariables = unusedVariableDetector_1.UnusedVariableDetector.findUnusedVariables(document, variables);
        unusedVariableDetector_1.UnusedVariableDetector.showUnusedVariables(unusedVariables);
        timer.end();
    });
    // Register a command to analyze variable dependencies
    const analyzeDependenciesCommand = vscode.commands.registerCommand('dauns.analyzeDependencies', async () => {
        const timer = performanceMonitor.startOperation('analyzeDependencies');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            performanceMonitor.recordError();
            timer.end();
            return;
        }
        const document = editor.document;
        const variables = (0, variableScanner_1.scanVariablesInDocument)(document);
        if (variables.length === 0) {
            vscode.window.showInformationMessage('No variables found in the current file.');
            timer.end();
            return;
        }
        const dependencyGraph = dependencyAnalyzer_1.DependencyAnalyzer.analyzeDependencies(document, variables);
        const circularDeps = dependencyAnalyzer_1.DependencyAnalyzer.findCircularDependencies(dependencyGraph);
        let output = dependencyAnalyzer_1.DependencyAnalyzer.formatDependencyGraph(dependencyGraph);
        if (circularDeps.length > 0) {
            output += '\nCircular Dependencies Found:\n';
            for (const cycle of circularDeps) {
                output += `- ${cycle.join(' -> ')}\n`;
            }
        }
        const panel = vscode.window.createWebviewPanel('daunsDependencies', 'Variable Dependencies', vscode.ViewColumn.One, {
            enableScripts: true,
        });
        panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Variable Dependencies</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          pre { background-color: #f4f4f4; padding: 15px; overflow-x: auto; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Variable Dependency Analysis</h1>
        <pre>${output.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `;
        timer.end();
    });
    // Register a command to track variable lifecycle
    const trackLifecycleCommand = vscode.commands.registerCommand('dauns.trackLifecycle', () => {
        const timer = performanceMonitor.startOperation('trackLifecycle');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            performanceMonitor.recordError();
            timer.end();
            return;
        }
        const document = editor.document;
        const variables = (0, variableScanner_1.scanVariablesInDocument)(document);
        if (variables.length === 0) {
            vscode.window.showInformationMessage('No variables found in the current file.');
            timer.end();
            return;
        }
        const lifecycleAnalysis = variableLifecycle_1.VariableLifecycleTracker.trackLifecycle(document, variables);
        const unusualPatterns = variableLifecycle_1.VariableLifecycleTracker.findUnusualPatterns(lifecycleAnalysis);
        let output = variableLifecycle_1.VariableLifecycleTracker.formatLifecycle(lifecycleAnalysis);
        if (unusualPatterns.length > 0) {
            output += '\nUnusual Patterns Detected:\n';
            for (const variable of unusualPatterns) {
                output += `- ${variable.name} (${variable.kind})\n`;
            }
        }
        const panel = vscode.window.createWebviewPanel('daunsLifecycle', 'Variable Lifecycle', vscode.ViewColumn.One, {
            enableScripts: true,
        });
        panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Variable Lifecycle</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          pre { background-color: #f4f4f4; padding: 15px; overflow-x: auto; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Variable Lifecycle Analysis</h1>
        <pre>${output.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `;
        timer.end();
    });
    // Register a command to show interactive variable panel
    const showInteractivePanelCommand = vscode.commands.registerCommand('dauns.showInteractivePanel', async () => {
        const timer = performanceMonitor.startOperation('showInteractivePanel');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            performanceMonitor.recordError();
            timer.end();
            return;
        }
        const document = editor.document;
        const fileExtension = document.fileName.substring(document.fileName.lastIndexOf('.'));
        // Try to get cached result first
        const cachedResult = cacheManager.getCachedResult(document.fileName);
        let variables = [];
        if (cachedResult) {
            performanceMonitor.recordCacheHit();
            variables = cachedResult.variables;
        }
        else {
            performanceMonitor.recordCacheMiss();
            // Try to get a parser for this file type
            const parser = parserFactory.getParser(fileExtension);
            if (parser) {
                // Use the appropriate parser for this language
                variables = parser.parseVariables(document.getText(), document.fileName);
            }
            else {
                // Fall back to the original JavaScript/TypeScript scanner
                variables = (0, variableScanner_1.scanVariablesInDocument)(document);
            }
            // Cache the result
            cacheManager.setCachedResult(document.fileName, variables);
        }
        if (variables.length === 0) {
            vscode.window.showInformationMessage('No variables found in the current file.');
            timer.end();
            return;
        }
        await interactivePanel.show(variables);
        timer.end();
    });
    // Register a command to scan the entire workspace
    const scanWorkspaceCommand = vscode.commands.registerCommand('dauns.scanWorkspace', () => {
        const timer = performanceMonitor.startOperation('scanWorkspace');
        workspaceScanner.scanWorkspace();
        timer.end();
    });
    // Register a command to scan a specific folder
    const scanFolderCommand = vscode.commands.registerCommand('dauns.scanFolder', async (uri) => {
        const timer = performanceMonitor.startOperation('scanFolder');
        if (uri) {
            workspaceScanner.scanFolder(uri);
        }
        else {
            // If no URI is provided, show folder picker
            const folders = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Folder to Scan',
            });
            if (folders && folders.length > 0) {
                workspaceScanner.scanFolder(folders[0]);
            }
        }
        timer.end();
    });
    // Register a command to refresh the tree view
    const refreshCommand = vscode.commands.registerCommand('dauns.refreshVariables', () => {
        const timer = performanceMonitor.startOperation('refreshVariables');
        treeViewProvider.refresh();
        vscode.window.showInformationMessage('Variable list refreshed!');
        timer.end();
    });
    // Register a command to clear the tree view
    const clearCommand = vscode.commands.registerCommand('dauns.clearVariables', () => {
        const timer = performanceMonitor.startOperation('clearVariables');
        treeViewProvider.clear();
        cacheManager.clearCache();
        vscode.window.showInformationMessage('Variable list cleared!');
        timer.end();
    });
    // Register a command to show performance report
    const showPerformanceReportCommand = vscode.commands.registerCommand('dauns.showPerformanceReport', () => {
        const timer = performanceMonitor.startOperation('showPerformanceReport');
        const report = performanceMonitor.getPerformanceReport();
        const panel = vscode.window.createWebviewPanel('daunsPerformance', 'DAUNS Performance Report', vscode.ViewColumn.One, {
            enableScripts: true,
        });
        // Format operation stats for display
        let operationStatsHtml = '';
        for (const [operationName, stats] of report.operationStats) {
            operationStatsHtml += `
          <div class="metric">
            <h3>${operationName}</h3>
            <p>Count: ${stats.count}</p>
            <p>Average Duration: ${stats.averageDuration.toFixed(2)} ms</p>
          </div>
        `;
        }
        panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DAUNS Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1, h2, h3 { color: #333; }
          .metric { margin: 10px 0; padding: 10px; background-color: #f4f4f4; border-radius: 5px; }
          .recommendations { margin-top: 20px; }
          .recommendation { margin: 5px 0; padding: 5px; background-color: #fff3cd; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <h1>DAUNS Performance Report</h1>

        <div class="metric">
          <h2>Average Scan Time</h2>
          <p>${report.averageScanTime.toFixed(2)} ms</p>
        </div>

        <div class="metric">
          <h2>Cache Efficiency</h2>
          <p>${(report.cacheEfficiency * 100).toFixed(2)}%</p>
        </div>

        <div class="metric">
          <h2>Error Rate</h2>
          <p>${(report.errorRate * 100).toFixed(2)}%</p>
        </div>

        <h2>Operation Statistics</h2>
        ${operationStatsHtml}

        <div class="recommendations">
          <h2>Recommendations</h2>
          ${report.recommendations
            .map(rec => `<div class="recommendation">${rec}</div>`)
            .join('')}
        </div>
      </body>
      </html>
    `;
        timer.end();
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(detectUnusedCommand);
    context.subscriptions.push(analyzeDependenciesCommand);
    context.subscriptions.push(trackLifecycleCommand);
    context.subscriptions.push(scanWorkspaceCommand);
    context.subscriptions.push(scanFolderCommand);
    context.subscriptions.push(refreshCommand);
    context.subscriptions.push(clearCommand);
    context.subscriptions.push(showInteractivePanelCommand);
    context.subscriptions.push(showPerformanceReportCommand);
    context.subscriptions.push(treeView);
    context.subscriptions.push(decorationProvider);
    context.subscriptions.push(minimapProvider);
    context.subscriptions.push(interactivePanel);
    context.subscriptions.push(asyncScanner);
    context.subscriptions.push(cacheManager);
    context.subscriptions.push(memoryManager);
    context.subscriptions.push(debounceManager);
    context.subscriptions.push(performanceMonitor);
}
function deactivate() {
    // Clean up resources if needed
}
//# sourceMappingURL=extension.js.map