import * as vscode from 'vscode';

export interface DaunsConfig {
  // File extensions to scan
  fileExtensions: string[];

  // Whether to include node_modules in workspace scans
  includeNodeModules: boolean;

  // Maximum file size to scan (in KB)
  maxFileSizeKB: number;

  // Whether to show function variables in results
  showFunctionVariables: boolean;

  // Whether to show unused variables warning
  showUnusedVariablesWarning: boolean;

  // Regex patterns for custom variable detection
  customVariablePatterns: string[];
}

export class ConfigManager {
  private static configPrefix = 'dauns';

  static getConfig(): DaunsConfig {
    const config = vscode.workspace.getConfiguration(this.configPrefix);

    return {
      fileExtensions: config.get('fileExtensions', [
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
      ]),
      includeNodeModules: config.get('includeNodeModules', false),
      maxFileSizeKB: config.get('maxFileSizeKB', 1024),
      showFunctionVariables: config.get('showFunctionVariables', true),
      showUnusedVariablesWarning: config.get(
        'showUnusedVariablesWarning',
        true
      ),
      customVariablePatterns: config.get('customVariablePatterns', []),
    };
  }

  static async updateConfig(newConfig: Partial<DaunsConfig>): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configPrefix);

    for (const [key, value] of Object.entries(newConfig)) {
      await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
  }

  static onConfigChange(listener: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(this.configPrefix)) {
        listener();
      }
    });
  }
}
