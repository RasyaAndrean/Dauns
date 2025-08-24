import * as vscode from 'vscode';
import { DependencyAnalyzer } from './dependencyAnalyzer';
import { ParserFactory } from './parsers/parserFactory';
import { AsyncScanner } from './performance/asyncScanner';
import { CacheManager } from './performance/cacheManager';
import { DebounceManager } from './performance/debounceManager';
import { MemoryManager } from './performance/memoryManager';
import { PerformanceMonitor } from './performance/performanceMonitor';
import { RefactoringCommands } from './refactoring/refactoringCommands';
import { VariablesTreeViewProvider } from './treeViewProvider';
import { InteractiveVariablePanel } from './ui/interactiveVariablePanel';
import { MinimapProvider } from './ui/minimapProvider';
import { VariableBreadcrumbProvider } from './ui/variableBreadcrumbProvider';
import { VariableDecorationProvider } from './ui/variableDecorationProvider';
import { VariableHoverProvider } from './ui/variableHoverProvider';
import { UnusedVariableDetector } from './unusedVariableDetector';
import { VariableLifecycleTracker } from './variableLifecycle';
import { scanVariablesInDocument } from './variableScanner';
import { WorkspaceScanner } from './workspaceScanner';

// Import the AI modules
import { CodeQualityAnalyzer } from './ai/codeQualityAnalyzer';
import { I18nManager } from './ai/i18n';
import { SecurityAnalyzer } from './ai/securityAnalyzer';
import { TeamCollaborationManager } from './ai/teamCollaboration';
import { AIVariableAnalyzer } from './ai/variableAnalyzer';

export function activate(context: vscode.ExtensionContext) {
  // eslint-disable-next-line no-console
  console.log('Dauns extension is now active!');

  // Create the tree view provider
  const treeViewProvider = new VariablesTreeViewProvider(
    vscode.workspace.rootPath
  );
  const treeView = vscode.window.createTreeView('daunsVariables', {
    treeDataProvider: treeViewProvider,
  });

  // Create the workspace scanner
  const workspaceScanner = new WorkspaceScanner(treeViewProvider);

  // Create the parser factory
  const parserFactory = new ParserFactory();

  // Create performance optimization components
  const asyncScanner = new AsyncScanner(4); // 4 worker threads
  const cacheManager = new CacheManager();
  const memoryManager = new MemoryManager();
  const debounceManager = new DebounceManager(500); // 500ms debounce delay
  const performanceMonitor = new PerformanceMonitor();

  // Create AI analysis components
  const aiVariableAnalyzer = AIVariableAnalyzer; // Using static methods
  const codeQualityAnalyzer = new CodeQualityAnalyzer();
  const securityAnalyzer = new SecurityAnalyzer();
  const teamCollaborationManager = new TeamCollaborationManager(context);
  const i18nManager = I18nManager.getInstance(); // Using singleton pattern

  // Start performance monitoring
  performanceMonitor.startMonitoring();
  memoryManager.monitorMemoryUsage();

  // Register memory cleanup callback
  memoryManager.registerCleanupCallback(() => {
    cacheManager.clearCache();
  });

  // Create UI components
  const hoverProvider = new VariableHoverProvider();
  const decorationProvider = new VariableDecorationProvider();
  const minimapProvider = new MinimapProvider();
  const breadcrumbProvider = new VariableBreadcrumbProvider();
  const interactivePanel = new InteractiveVariablePanel();

  // Register UI components
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: 'file' }, hoverProvider)
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      { scheme: 'file' },
      breadcrumbProvider
    )
  );

  // Register refactoring commands
  RefactoringCommands.registerCommands(context);

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

  let disposable = vscode.commands.registerCommand(
    'dauns.scanVariables',
    () => {
      const timer = performanceMonitor.startOperation('scanVariables');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const fileExtension = document.fileName.substring(
        document.fileName.lastIndexOf('.')
      );

      // Try to get cached result first
      const cachedResult = cacheManager.getCachedResult(document.fileName);
      if (cachedResult) {
        performanceMonitor.recordCacheHit();
        // Use cached result
        const variables: any = cachedResult.variables;

        // Update the tree view with the cached variables
        treeViewProvider.updateVariables(document.fileName, variables);

        // Update decorations and minimap
        decorationProvider.updateDecorations(editor);
        minimapProvider.updateMinimap(editor);

        const quickPickItems = variables.map((variable: any) => ({
          label: variable.name,
          description: `${variable.type} (${
            variable.declarationType || variable.kind || 'unknown'
          })`,
          detail: `Line ${variable.line}, Column ${variable.character}`,
        }));

        vscode.window
          .showQuickPick(quickPickItems, {
            placeHolder: 'Select a variable to see more details',
            matchOnDetail: true,
          })
          .then(selection => {
            if (selection) {
              const selectedVariable = variables.find(
                (v: any) => v.name === (selection as any).label
              );
              if (selectedVariable) {
                const position = new vscode.Position(
                  selectedVariable.line - 1,
                  selectedVariable.character - 1
                );
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                  new vscode.Range(position, position),
                  vscode.TextEditorRevealType.InCenter
                );
              }
            }
          });

        timer.end();
        return;
      }

      performanceMonitor.recordCacheMiss();

      // Try to get a parser for this file type
      const parser = parserFactory.getParser(fileExtension);

      let variables: any[] = [];

      if (parser) {
        // Use the appropriate parser for this language
        variables = parser.parseVariables(
          document.getText(),
          document.fileName
        );
      } else {
        // Fall back to the original JavaScript/TypeScript scanner
        variables = scanVariablesInDocument(document);
      }

      // Cache the result
      cacheManager.setCachedResult(document.fileName, variables);

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      // Update the tree view with the new variables
      treeViewProvider.updateVariables(document.fileName, variables);

      // Update decorations and minimap
      decorationProvider.updateDecorations(editor);
      minimapProvider.updateMinimap(editor);

      const quickPickItems = variables.map((variable: any) => ({
        label: variable.name,
        description: `${variable.type} (${
          variable.declarationType || variable.kind || 'unknown'
        })`,
        detail: `Line ${variable.line}, Column ${variable.character}`,
      }));

      vscode.window
        .showQuickPick(quickPickItems, {
          placeHolder: 'Select a variable to see more details',
          matchOnDetail: true,
        })
        .then(selection => {
          if (selection) {
            const selectedVariable = variables.find(
              (v: any) => v.name === (selection as any).label
            );
            if (selectedVariable) {
              const position = new vscode.Position(
                selectedVariable.line - 1,
                selectedVariable.character - 1
              );
              editor.selection = new vscode.Selection(position, position);
              editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
              );
            }
          }
        });

      timer.end();
    }
  );

  // Register a command to detect unused variables
  const detectUnusedCommand = vscode.commands.registerCommand(
    'dauns.detectUnusedVariables',
    () => {
      const timer = performanceMonitor.startOperation('detectUnusedVariables');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const variables = scanVariablesInDocument(document);

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      const unusedVariables = UnusedVariableDetector.findUnusedVariables(
        document,
        variables
      );
      UnusedVariableDetector.showUnusedVariables(unusedVariables);

      timer.end();
    }
  );

  // Register a command to analyze variable dependencies
  const analyzeDependenciesCommand = vscode.commands.registerCommand(
    'dauns.analyzeDependencies',
    async () => {
      const timer = performanceMonitor.startOperation('analyzeDependencies');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const variables = scanVariablesInDocument(document);

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      const dependencyGraph = DependencyAnalyzer.analyzeDependencies(
        document,
        variables
      );
      const circularDeps =
        DependencyAnalyzer.findCircularDependencies(dependencyGraph);

      let output = DependencyAnalyzer.formatDependencyGraph(dependencyGraph);

      if (circularDeps.length > 0) {
        output += '\nCircular Dependencies Found:\n';
        for (const cycle of circularDeps) {
          output += `- ${cycle.join(' -> ')}\n`;
        }
      }

      const panel = vscode.window.createWebviewPanel(
        'daunsDependencies',
        'Variable Dependencies',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

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
    }
  );

  // Register a command to track variable lifecycle
  const trackLifecycleCommand = vscode.commands.registerCommand(
    'dauns.trackLifecycle',
    () => {
      const timer = performanceMonitor.startOperation('trackLifecycle');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const variables = scanVariablesInDocument(document);

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      const lifecycleAnalysis = VariableLifecycleTracker.trackLifecycle(
        document,
        variables
      );
      const unusualPatterns =
        VariableLifecycleTracker.findUnusualPatterns(lifecycleAnalysis);

      let output = VariableLifecycleTracker.formatLifecycle(lifecycleAnalysis);

      if (unusualPatterns.length > 0) {
        output += '\nUnusual Patterns Detected:\n';
        for (const variable of unusualPatterns) {
          output += `- ${variable.name} (${variable.kind})\n`;
        }
      }

      const panel = vscode.window.createWebviewPanel(
        'daunsLifecycle',
        'Variable Lifecycle',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

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
    }
  );

  // Register a command to show interactive variable panel
  const showInteractivePanelCommand = vscode.commands.registerCommand(
    'dauns.showInteractivePanel',
    async () => {
      const timer = performanceMonitor.startOperation('showInteractivePanel');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const fileExtension = document.fileName.substring(
        document.fileName.lastIndexOf('.')
      );

      // Try to get cached result first
      const cachedResult = cacheManager.getCachedResult(document.fileName);
      let variables: any[] = [];

      if (cachedResult) {
        performanceMonitor.recordCacheHit();
        variables = cachedResult.variables as any[];
      } else {
        performanceMonitor.recordCacheMiss();

        // Try to get a parser for this file type
        const parser = parserFactory.getParser(fileExtension);

        if (parser) {
          // Use the appropriate parser for this language
          variables = parser.parseVariables(
            document.getText(),
            document.fileName
          );
        } else {
          // Fall back to the original JavaScript/TypeScript scanner
          variables = scanVariablesInDocument(document);
        }

        // Cache the result
        cacheManager.setCachedResult(document.fileName, variables);
      }

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      await interactivePanel.show(variables);

      timer.end();
    }
  );

  // Register a command to scan the entire workspace
  const scanWorkspaceCommand = vscode.commands.registerCommand(
    'dauns.scanWorkspace',
    () => {
      const timer = performanceMonitor.startOperation('scanWorkspace');
      workspaceScanner.scanWorkspace();
      timer.end();
    }
  );

  // Register a command to scan a specific folder
  const scanFolderCommand = vscode.commands.registerCommand(
    'dauns.scanFolder',
    async (uri: vscode.Uri) => {
      const timer = performanceMonitor.startOperation('scanFolder');

      if (uri) {
        workspaceScanner.scanFolder(uri);
      } else {
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
    }
  );

  // Register a command to refresh the tree view
  const refreshCommand = vscode.commands.registerCommand(
    'dauns.refreshVariables',
    () => {
      const timer = performanceMonitor.startOperation('refreshVariables');
      treeViewProvider.refresh();
      vscode.window.showInformationMessage('Variable list refreshed!');
      timer.end();
    }
  );

  // Register a command to clear the tree view
  const clearCommand = vscode.commands.registerCommand(
    'dauns.clearVariables',
    () => {
      const timer = performanceMonitor.startOperation('clearVariables');
      treeViewProvider.clear();
      cacheManager.clearCache();
      vscode.window.showInformationMessage('Variable list cleared!');
      timer.end();
    }
  );

  // Register a command to show performance report
  const showPerformanceReportCommand = vscode.commands.registerCommand(
    'dauns.showPerformanceReport',
    () => {
      const timer = performanceMonitor.startOperation('showPerformanceReport');

      const report = performanceMonitor.getPerformanceReport();
      const panel = vscode.window.createWebviewPanel(
        'daunsPerformance',
        'DAUNS Performance Report',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

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
    }
  );

  // Register AI-powered commands
  const analyzeCodeQualityCommand = vscode.commands.registerCommand(
    'dauns.analyzeCodeQuality',
    async () => {
      const timer = performanceMonitor.startOperation('analyzeCodeQuality');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const fileExtension = document.fileName.substring(
        document.fileName.lastIndexOf('.')
      );

      // Try to get a parser for this file type
      const parser = parserFactory.getParser(fileExtension);
      let variables: any[] = [];

      if (parser) {
        // Use the appropriate parser for this language
        variables = parser.parseVariables(
          document.getText(),
          document.fileName
        );
      } else {
        // Fall back to the original JavaScript/TypeScript scanner
        variables = scanVariablesInDocument(document);
      }

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      // Analyze code quality using AI
      const qualityReport = codeQualityAnalyzer.analyzeCodeQuality(
        variables,
        document.getText()
      );

      const panel = vscode.window.createWebviewPanel(
        'daunsCodeQuality',
        'Code Quality Analysis',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html =
        codeQualityAnalyzer.generateQualityReport(qualityReport);

      timer.end();
    }
  );

  const analyzeCodeSecurityCommand = vscode.commands.registerCommand(
    'dauns.analyzeCodeSecurity',
    async () => {
      const timer = performanceMonitor.startOperation('analyzeCodeSecurity');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const fileExtension = document.fileName.substring(
        document.fileName.lastIndexOf('.')
      );

      // Try to get a parser for this file type
      const parser = parserFactory.getParser(fileExtension);
      let variables: any[] = [];

      if (parser) {
        // Use the appropriate parser for this language
        variables = parser.parseVariables(
          document.getText(),
          document.fileName
        );
      } else {
        // Fall back to the original JavaScript/TypeScript scanner
        variables = scanVariablesInDocument(document);
      }

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      // Analyze security using AI
      const vulnerabilities = securityAnalyzer.analyzeSecurityVulnerabilities(
        variables,
        document.getText()
      );

      const panel = vscode.window.createWebviewPanel(
        'daunsSecurity',
        'Security Analysis',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html =
        securityAnalyzer.generateSecurityReport(vulnerabilities);

      timer.end();
    }
  );

  const shareAnalysisCommand = vscode.commands.registerCommand(
    'dauns.shareAnalysis',
    async () => {
      const timer = performanceMonitor.startOperation('shareAnalysis');

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        performanceMonitor.recordError();
        timer.end();
        return;
      }

      const document = editor.document;
      const fileExtension = document.fileName.substring(
        document.fileName.lastIndexOf('.')
      );

      // Try to get a parser for this file type
      const parser = parserFactory.getParser(fileExtension);
      let variables: any[] = [];

      if (parser) {
        // Use the appropriate parser for this language
        variables = parser.parseVariables(
          document.getText(),
          document.fileName
        );
      } else {
        // Fall back to the original JavaScript/TypeScript scanner
        variables = scanVariablesInDocument(document);
      }

      if (variables.length === 0) {
        vscode.window.showInformationMessage(
          'No variables found in the current file.'
        );
        timer.end();
        return;
      }

      // Create analysis for sharing
      const analysis = teamCollaborationManager.createAnalysis(
        document.fileName,
        variables
      );

      if (analysis) {
        vscode.window.showInformationMessage(
          'Analysis created successfully! You can now share it with your team.'
        );
      } else {
        vscode.window.showErrorMessage('Failed to create analysis.');
      }

      timer.end();
    }
  );

  const selectLanguageCommand = vscode.commands.registerCommand(
    'dauns.selectLanguage',
    async () => {
      const timer = performanceMonitor.startOperation('selectLanguage');

      const languages = [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Chinese (Simplified)', value: 'zh-cn' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Korean', value: 'ko' },
        { label: 'Russian', value: 'ru' },
        { label: 'Portuguese (Brazil)', value: 'pt-br' },
        { label: 'Indonesian', value: 'id' },
      ];

      const selected = await vscode.window.showQuickPick(languages, {
        placeHolder: 'Select language for DAUNS interface',
      });

      if (selected) {
        // Update language setting
        const success = i18nManager.setLocale(selected.value);

        if (success) {
          vscode.window.showInformationMessage(
            `Language set to ${selected.label}`
          );
        } else {
          vscode.window.showErrorMessage(
            `Failed to set language to ${selected.label}`
          );
        }
      }

      timer.end();
    }
  );

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
  context.subscriptions.push(analyzeCodeQualityCommand);
  context.subscriptions.push(analyzeCodeSecurityCommand);
  context.subscriptions.push(shareAnalysisCommand);
  context.subscriptions.push(selectLanguageCommand);
  context.subscriptions.push(treeView);
  context.subscriptions.push(decorationProvider);
  context.subscriptions.push(minimapProvider);
  context.subscriptions.push(interactivePanel);
  context.subscriptions.push(asyncScanner);
  context.subscriptions.push(cacheManager);
  context.subscriptions.push(memoryManager);
  context.subscriptions.push(debounceManager);
  context.subscriptions.push(performanceMonitor);
  // Note: We don't push the AI modules to subscriptions since they don't have dispose methods
}

export function deactivate() {
  // Clean up resources if needed
}
