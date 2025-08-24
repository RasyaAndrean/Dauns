import * as vscode from 'vscode';
import { VariableUsageInfo } from './variableUsageTracker';

/**
 * Interface for code quality insights
 */
export interface CodeInsights {
  totalVariables: number;
  codeSmells: CodeSmell[];
  bestPracticeViolations: BestPracticeViolation[];
  performanceIndicators: PerformanceIndicator[];
  complexityMetrics: ComplexityMetrics;
  recommendations: string[];
}

/**
 * Interface for code smells
 */
export interface CodeSmell {
  type:
    | 'unusedVariable'
    | 'writeOnlyVariable'
    | 'shadowedVariable'
    | 'poorlyNamedVariable'
    | 'complexVariable';
  variableName: string;
  location: { line: number; character: number };
  severity: 'low' | 'medium' | 'high';
  message: string;
}

/**
 * Interface for best practice violations
 */
export interface BestPracticeViolation {
  type:
    | 'varUsage'
    | 'longVariableName'
    | 'shortVariableName'
    | 'nonDescriptiveName';
  variableName: string;
  location: { line: number; character: number };
  message: string;
}

/**
 * Interface for performance indicators
 */
export interface PerformanceIndicator {
  type: 'largeObject' | 'frequentlyUsed' | 'rarelyUsed';
  variableName: string;
  value: number;
  message: string;
}

/**
 * Interface for complexity metrics
 */
export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  variableComplexity: number;
}

/**
 * Code Insights Analyzer for identifying code quality issues and providing recommendations
 */
export class CodeInsightsAnalyzer {
  /**
   * Analyzes code for insights and issues
   * @param variables The variables to analyze
   * @returns Detailed code insights
   */
  static analyzeCode(variables: VariableUsageInfo[]): CodeInsights {
    const insights: CodeInsights = {
      totalVariables: variables.length,
      codeSmells: [],
      bestPracticeViolations: [],
      performanceIndicators: [],
      complexityMetrics: {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        variableComplexity: 0,
      },
      recommendations: [],
    };

    // Analyze each variable for issues
    for (const variable of variables) {
      // Check for unused variables
      if (variable.isUnused) {
        insights.codeSmells.push({
          type: 'unusedVariable',
          variableName: variable.name,
          location: { line: variable.line, character: variable.character },
          severity: 'medium',
          message: `Variable '${variable.name}' is declared but never used`,
        });
      }

      // Check for write-only variables
      if (variable.isWriteOnly) {
        insights.codeSmells.push({
          type: 'writeOnlyVariable',
          variableName: variable.name,
          location: { line: variable.line, character: variable.character },
          severity: 'medium',
          message: `Variable '${variable.name}' is assigned but never read`,
        });
      }

      // Check for poorly named variables
      if (this.isPoorlyNamed(variable.name)) {
        insights.codeSmells.push({
          type: 'poorlyNamedVariable',
          variableName: variable.name,
          location: { line: variable.line, character: variable.character },
          severity: 'low',
          message: `Variable '${variable.name}' has a non-descriptive name`,
        });
      }

      // Check for best practice violations
      if (variable.declarationType === 'var') {
        insights.bestPracticeViolations.push({
          type: 'varUsage',
          variableName: variable.name,
          location: { line: variable.line, character: variable.character },
          message: `Variable '${variable.name}' is declared with 'var' instead of 'let' or 'const'`,
        });
      }

      // Check for long variable names
      if (variable.name.length > 30) {
        insights.bestPracticeViolations.push({
          type: 'longVariableName',
          variableName: variable.name,
          location: { line: variable.line, character: variable.character },
          message: `Variable '${variable.name}' has a very long name (${variable.name.length} characters)`,
        });
      }

      // Check for short variable names (except common loop counters)
      if (
        variable.name.length < 2 &&
        !['i', 'j', 'k'].includes(variable.name)
      ) {
        insights.bestPracticeViolations.push({
          type: 'shortVariableName',
          variableName: variable.name,
          location: { line: variable.line, character: variable.character },
          message: `Variable '${variable.name}' has a very short name`,
        });
      }

      // Check for non-descriptive names
      const nonDescriptiveNames = [
        'data',
        'temp',
        'value',
        'item',
        'obj',
        'arr',
        'list',
        'result',
      ];
      if (nonDescriptiveNames.includes(variable.name.toLowerCase())) {
        insights.bestPracticeViolations.push({
          type: 'nonDescriptiveName',
          variableName: variable.name,
          location: { line: variable.line, character: variable.character },
          message: `Variable '${variable.name}' has a non-descriptive name`,
        });
      }

      // Performance indicators for frequently used variables
      if (variable.usageCount > 10) {
        insights.performanceIndicators.push({
          type: 'frequentlyUsed',
          variableName: variable.name,
          value: variable.usageCount,
          message: `Variable '${variable.name}' is used ${variable.usageCount} times`,
        });
      }

      // Performance indicators for rarely used variables
      if (variable.usageCount === 1 && !variable.isUnused) {
        insights.performanceIndicators.push({
          type: 'rarelyUsed',
          variableName: variable.name,
          value: variable.usageCount,
          message: `Variable '${variable.name}' is used only once`,
        });
      }
    }

    // Generate complexity metrics
    insights.complexityMetrics = this.calculateComplexityMetrics(variables);

    // Generate recommendations
    insights.recommendations = this.generateRecommendations(insights);

    return insights;
  }

  /**
   * Checks if a variable name is poorly named
   * @param name The variable name
   * @returns True if the name is considered poor
   */
  private static isPoorlyNamed(name: string): boolean {
    // Check for single letter names (except i, j, k which are common loop counters)
    if (name.length === 1 && !['i', 'j', 'k'].includes(name)) {
      return true;
    }

    // Check for meaningless names
    const meaninglessNames = [
      'data',
      'temp',
      'value',
      'item',
      'obj',
      'arr',
      'list',
      'result',
    ];
    if (meaninglessNames.includes(name.toLowerCase())) {
      return true;
    }

    // Check for non-descriptive names
    if (name.length <= 2 && !name.match(/^[ijk]$/)) {
      return true;
    }

    return false;
  }

  /**
   * Calculates complexity metrics
   * @param variables The variables to analyze
   * @returns Complexity metrics
   */
  private static calculateComplexityMetrics(
    variables: VariableUsageInfo[]
  ): ComplexityMetrics {
    // Calculate variable complexity based on usage patterns
    let variableComplexity = 0;
    for (const variable of variables) {
      // More complex if used many times or has complex types
      variableComplexity += variable.usageCount;
      if (
        variable.type === 'object' ||
        variable.type === 'array' ||
        variable.type === 'function'
      ) {
        variableComplexity += 2;
      }
    }

    return {
      cyclomaticComplexity: variables.length, // Simplified
      cognitiveComplexity: Math.floor(variables.length / 2), // Simplified
      variableComplexity: variableComplexity,
    };
  }

  /**
   * Generates recommendations based on insights
   * @param insights The code insights
   * @returns Array of recommendations
   */
  private static generateRecommendations(insights: CodeInsights): string[] {
    const recommendations: string[] = [];

    // Recommendations based on code smells
    const unusedCount = insights.codeSmells.filter(
      s => s.type === 'unusedVariable'
    ).length;
    if (unusedCount > 0) {
      recommendations.push(
        `Remove ${unusedCount} unused variables to improve code clarity`
      );
    }

    const writeOnlyCount = insights.codeSmells.filter(
      s => s.type === 'writeOnlyVariable'
    ).length;
    if (writeOnlyCount > 0) {
      recommendations.push(
        `Investigate ${writeOnlyCount} write-only variables - they may indicate logic issues`
      );
    }

    const poorlyNamedCount = insights.codeSmells.filter(
      s => s.type === 'poorlyNamedVariable'
    ).length;
    if (poorlyNamedCount > 0) {
      recommendations.push(
        `Consider renaming ${poorlyNamedCount} poorly named variables for better readability`
      );
    }

    // Recommendations based on best practice violations
    const varCount = insights.bestPracticeViolations.filter(
      v => v.type === 'varUsage'
    ).length;
    if (varCount > 0) {
      recommendations.push(
        `Replace ${varCount} 'var' declarations with 'let' or 'const' for better scoping`
      );
    }

    // General recommendations
    if (insights.totalVariables > 50) {
      recommendations.push(
        'Consider breaking this file into smaller modules to improve maintainability'
      );
    }

    if (insights.complexityMetrics.variableComplexity > 200) {
      recommendations.push(
        'The variable complexity is high - consider simplifying data structures or logic'
      );
    }

    // If no issues found, provide positive feedback
    if (recommendations.length === 0) {
      recommendations.push(
        'Great job! No major issues found in your variable usage.'
      );
      recommendations.push(
        'Your code follows good practices and is easy to understand.'
      );
    }

    return recommendations;
  }

  /**
   * Generates a code insights report
   * @param insights The insights to format
   * @returns A formatted code insights report
   */
  static generateInsightsReport(insights: CodeInsights): string {
    let report = 'Code Insights Report\n';
    report += '===================\n\n';

    report += `Total Variables Analyzed: ${insights.totalVariables}\n\n`;

    if (insights.codeSmells.length > 0) {
      report += 'Code Smells:\n';
      for (const smell of insights.codeSmells) {
        report += `  [${smell.severity.toUpperCase()}] ${
          smell.variableName
        } (line ${smell.location.line}): ${smell.message}\n`;
      }
      report += '\n';
    }

    if (insights.bestPracticeViolations.length > 0) {
      report += 'Best Practice Violations:\n';
      for (const violation of insights.bestPracticeViolations) {
        report += `  ${violation.variableName} (line ${violation.location.line}): ${violation.message}\n`;
      }
      report += '\n';
    }

    if (insights.performanceIndicators.length > 0) {
      report += 'Performance Indicators:\n';
      for (const indicator of insights.performanceIndicators) {
        report += `  ${indicator.variableName}: ${indicator.message}\n`;
      }
      report += '\n';
    }

    report += 'Complexity Metrics:\n';
    report += `  Cyclomatic Complexity: ${insights.complexityMetrics.cyclomaticComplexity}\n`;
    report += `  Cognitive Complexity: ${insights.complexityMetrics.cognitiveComplexity}\n`;
    report += `  Variable Complexity: ${insights.complexityMetrics.variableComplexity}\n\n`;

    if (insights.recommendations.length > 0) {
      report += 'Recommendations:\n';
      for (const recommendation of insights.recommendations) {
        report += `  - ${recommendation}\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Shows insights in a webview panel
   * @param insights The insights to display
   */
  static async showInsightsPanel(insights: CodeInsights): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'codeInsights',
      'Code Insights',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    const report = this.generateInsightsReport(insights);

    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Insights</title>
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
          .high { color: var(--vscode-errorForeground); }
          .medium { color: var(--vscode-editorWarning-foreground); }
          .low { color: var(--vscode-editorInfo-foreground); }
          pre {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 15px;
            overflow-x: auto;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Code Insights Report</h1>
        <pre>${report.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `;
  }
}
