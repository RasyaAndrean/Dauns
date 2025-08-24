import * as vscode from 'vscode';
import { VariableUsageInfo } from './variableUsageTracker';

/**
 * Interface for variable statistics
 */
export interface VariableStatistics {
  totalVariables: number;
  variableTypes: Record<string, number>;
  declarationTypes: Record<string, number>;
  scopeDistribution: Record<string, number>;
  usageDistribution: {
    unused: number;
    writeOnly: number;
    active: number;
  };
  mostUsedVariables: VariableUsageInfo[];
  leastUsedVariables: VariableUsageInfo[];
  averageNameLength: number;
  longestVariableName: string;
  shortestVariableName: string;
}

/**
 * Variable Statistics Analyzer for generating detailed reports
 */
export class VariableStatisticsAnalyzer {
  /**
   * Analyzes variables and generates statistics
   * @param variables The variables to analyze
   * @returns Detailed statistics about the variables
   */
  static analyzeVariables(variables: VariableUsageInfo[]): VariableStatistics {
    // Initialize statistics
    const stats: VariableStatistics = {
      totalVariables: variables.length,
      variableTypes: {},
      declarationTypes: {},
      scopeDistribution: {},
      usageDistribution: {
        unused: 0,
        writeOnly: 0,
        active: 0,
      },
      mostUsedVariables: [],
      leastUsedVariables: [],
      averageNameLength: 0,
      longestVariableName: '',
      shortestVariableName: '',
    };

    // Calculate name length statistics
    let totalNameLength = 0;
    let longestName = '';
    let shortestName = variables.length > 0 ? variables[0].name : '';

    // Process each variable
    for (const variable of variables) {
      // Count variable types
      const type = variable.type || 'unknown';
      stats.variableTypes[type] = (stats.variableTypes[type] || 0) + 1;

      // Count declaration types
      const declType = variable.declarationType || 'unknown';
      stats.declarationTypes[declType] =
        (stats.declarationTypes[declType] || 0) + 1;

      // Count scope distribution
      const scope = variable.scope || 'unknown';
      stats.scopeDistribution[scope] =
        (stats.scopeDistribution[scope] || 0) + 1;

      // Count usage distribution
      if (variable.isUnused) {
        stats.usageDistribution.unused++;
      } else if (variable.isWriteOnly) {
        stats.usageDistribution.writeOnly++;
      } else {
        stats.usageDistribution.active++;
      }

      // Track name lengths
      totalNameLength += variable.name.length;
      if (variable.name.length > longestName.length) {
        longestName = variable.name;
      }
      if (variable.name.length < shortestName.length) {
        shortestName = variable.name;
      }
    }

    // Calculate average name length
    stats.averageNameLength =
      variables.length > 0 ? totalNameLength / variables.length : 0;
    stats.longestVariableName = longestName;
    stats.shortestVariableName = shortestName;

    // Get top 5 most used variables (excluding unused)
    const usedVariablesForMost = variables.filter(v => !v.isUnused);
    const sortedByUsage = [...usedVariablesForMost].sort(
      (a, b) => b.usageCount - a.usageCount
    );

    // Get top 5 most used variables
    stats.mostUsedVariables = sortedByUsage.slice(0, 5);

    // Get bottom 5 least used variables (excluding unused)
    const usedVariables = variables.filter(v => !v.isUnused);
    const sortedByLeastUsage = [...usedVariables].sort(
      (a, b) => a.usageCount - b.usageCount
    );
    stats.leastUsedVariables = sortedByLeastUsage.slice(0, 5);

    return stats;
  }

  /**
   * Generates a detailed statistics report
   * @param stats The statistics to format
   * @returns A formatted statistics report
   */
  static generateStatisticsReport(stats: VariableStatistics): string {
    let report = 'Variable Statistics Report\n';
    report += '========================\n\n';

    report += `Total Variables: ${stats.totalVariables}\n`;
    report += `Average Name Length: ${stats.averageNameLength.toFixed(
      2
    )} characters\n`;
    report += `Longest Variable Name: ${stats.longestVariableName} (${stats.longestVariableName.length} characters)\n`;
    report += `Shortest Variable Name: ${stats.shortestVariableName} (${stats.shortestVariableName.length} characters)\n\n`;

    report += 'Variable Types:\n';
    for (const [type, count] of Object.entries(stats.variableTypes)) {
      const percentage = ((count / stats.totalVariables) * 100).toFixed(1);
      report += `  ${type}: ${count} (${percentage}%)\n`;
    }
    report += '\n';

    report += 'Declaration Types:\n';
    for (const [type, count] of Object.entries(stats.declarationTypes)) {
      const percentage = ((count / stats.totalVariables) * 100).toFixed(1);
      report += `  ${type}: ${count} (${percentage}%)\n`;
    }
    report += '\n';

    report += 'Scope Distribution:\n';
    for (const [scope, count] of Object.entries(stats.scopeDistribution)) {
      const percentage = ((count / stats.totalVariables) * 100).toFixed(1);
      report += `  ${scope}: ${count} (${percentage}%)\n`;
    }
    report += '\n';

    report += 'Usage Distribution:\n';
    report += `  Unused: ${stats.usageDistribution.unused} (${(
      (stats.usageDistribution.unused / stats.totalVariables) *
      100
    ).toFixed(1)}%)\n`;
    report += `  Write-only: ${stats.usageDistribution.writeOnly} (${(
      (stats.usageDistribution.writeOnly / stats.totalVariables) *
      100
    ).toFixed(1)}%)\n`;
    report += `  Active: ${stats.usageDistribution.active} (${(
      (stats.usageDistribution.active / stats.totalVariables) *
      100
    ).toFixed(1)}%)\n\n`;

    if (stats.mostUsedVariables.length > 0) {
      report += 'Most Used Variables:\n';
      for (const variable of stats.mostUsedVariables) {
        report += `  ${variable.name}: ${variable.usageCount} uses\n`;
      }
      report += '\n';
    }

    if (stats.leastUsedVariables.length > 0) {
      report += 'Least Used Variables:\n';
      for (const variable of stats.leastUsedVariables) {
        report += `  ${variable.name}: ${variable.usageCount} uses\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Shows statistics in a webview panel
   * @param stats The statistics to display
   */
  static async showStatisticsPanel(stats: VariableStatistics): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'variableStatistics',
      'Variable Statistics',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    const report = this.generateStatisticsReport(stats);

    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Variable Statistics</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
          }
          h1, h2, h3 {
            color: var(--vscode-editorWidget-border);
            border-bottom: 1px solid var(--vscode-editorWidget-border);
            padding-bottom: 5px;
          }
          .metric {
            margin: 10px 0;
            padding: 10px;
            background-color: var(--vscode-sideBar-background);
            border-radius: 5px;
          }
          .unused { background-color: rgba(255, 107, 107, 0.2); }
          .writeonly { background-color: rgba(255, 165, 0, 0.2); }
          .active { background-color: rgba(76, 175, 80, 0.2); }
          pre {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 15px;
            overflow-x: auto;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Variable Statistics Report</h1>
        <pre>${report.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `;
  }
}
