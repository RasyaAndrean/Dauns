import { VariableInfo } from '../parsers/types';
import { AIVariableAnalyzer, VariableQualityScore } from './variableAnalyzer';

// Code Quality Metrics Interface
export interface CodeQualityMetrics {
  overallScore: number;
  variableScores: VariableQualityScore[];
  fileComplexity: FileComplexityMetrics;
  generalSuggestions: string[];
  timestamp: number;
}

// File Complexity Metrics Interface
export interface FileComplexityMetrics {
  totalVariables: number;
  uniqueVariableTypes: number;
  globalVariablePercentage: number;
  variableReuseFactor: number;
  cycloComplexity: number; // estimated based on conditionals and loops
  maintainabilityIndex: number; // 0-100 scale
}

/**
 * Code quality analyzer that provides metrics and suggestions for improving code quality
 * related to variable usage and management.
 */
export class CodeQualityAnalyzer {
  private aiAnalyzer: AIVariableAnalyzer;

  constructor() {
    this.aiAnalyzer = new AIVariableAnalyzer();
  }

  /**
   * Analyzes the code quality based on variable usage
   * @param variables The list of variables to analyze
   * @param fileContent The content of the file being analyzed
   * @returns Comprehensive code quality metrics
   */
  public analyzeCodeQuality(
    variables: VariableInfo[],
    fileContent: string
  ): CodeQualityMetrics {
    // Calculate individual variable scores
    const variableScores = variables.map(variable =>
      this.aiAnalyzer.calculateVariableQualityScore(variable, variables)
    );

    // Calculate file complexity metrics
    const fileComplexity = this.calculateFileComplexity(variables, fileContent);

    // Calculate overall score (weighted average of various factors)
    const overallScore = this.calculateOverallScore(
      variableScores,
      fileComplexity
    );

    // Generate general suggestions based on the analysis
    const generalSuggestions = this.generateGeneralSuggestions(
      variableScores,
      fileComplexity
    );

    return {
      overallScore,
      variableScores,
      fileComplexity,
      generalSuggestions,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculates file complexity metrics
   * @param variables The list of variables in the file
   * @param fileContent The content of the file
   * @returns File complexity metrics
   */
  private calculateFileComplexity(
    variables: VariableInfo[],
    fileContent: string
  ): FileComplexityMetrics {
    // Count total variables
    const totalVariables = variables.length;

    // Count unique variable types
    const uniqueTypes = new Set(variables.map(v => v.type));
    const uniqueVariableTypes = uniqueTypes.size;

    // Calculate global variable percentage
    const globalVariables = variables.filter(v => v.scope === 'global');
    const globalVariablePercentage =
      totalVariables > 0 ? (globalVariables.length / totalVariables) * 100 : 0;

    // Calculate variable reuse factor (average references per variable)
    const totalReferences = variables.reduce(
      (sum, v) => sum + v.references.length,
      0
    );
    const variableReuseFactor =
      totalVariables > 0 ? totalReferences / totalVariables : 0;

    // Estimate cyclomatic complexity based on conditionals and loops
    const conditionalMatches = (
      fileContent.match(/if|else|switch|case|for|while|do/g) || []
    ).length;
    const cycloComplexity = 1 + conditionalMatches;

    // Calculate maintainability index (simplified version)
    // Formula: 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(L)
    // where V is Halstead volume, G is cyclomatic complexity, L is lines of code
    const linesOfCode = fileContent.split('\n').length;
    // Simplified calculation
    const maintainabilityIndex = Math.max(
      0,
      Math.min(
        100,
        100 -
          0.2 * cycloComplexity -
          0.1 * linesOfCode -
          0.2 * globalVariablePercentage
      )
    );

    return {
      totalVariables,
      uniqueVariableTypes,
      globalVariablePercentage,
      variableReuseFactor,
      cycloComplexity,
      maintainabilityIndex,
    };
  }

  /**
   * Calculates the overall code quality score
   * @param variableScores Individual variable quality scores
   * @param fileComplexity File complexity metrics
   * @returns Overall code quality score (0-100)
   */
  private calculateOverallScore(
    variableScores: VariableQualityScore[],
    fileComplexity: FileComplexityMetrics
  ): number {
    // If no variables, return a neutral score
    if (variableScores.length === 0) {
      return 50;
    }

    // Average variable quality score (40% weight)
    const avgVariableScore =
      variableScores.reduce((sum, score) => sum + score.overallScore, 0) /
      variableScores.length;

    // Global variable penalty (10% weight)
    // Higher percentage of global variables reduces score
    const globalVarScore = 100 - fileComplexity.globalVariablePercentage;

    // Maintainability score (30% weight)
    const maintainabilityScore = fileComplexity.maintainabilityIndex;

    // Variable reuse factor score (20% weight)
    // Optimal reuse factor is around 3-5, too high or too low is penalized
    let reuseFactorScore = 100;
    if (fileComplexity.variableReuseFactor < 1) {
      reuseFactorScore = 50; // Too many unused or underused variables
    } else if (fileComplexity.variableReuseFactor > 10) {
      reuseFactorScore = 70; // Variables might be overused, consider refactoring
    }

    // Calculate weighted average
    const overallScore = Math.round(
      avgVariableScore * 0.4 +
        globalVarScore * 0.1 +
        maintainabilityScore * 0.3 +
        reuseFactorScore * 0.2
    );

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, overallScore));
  }

  /**
   * Generates general suggestions for improving code quality
   * @param variableScores Individual variable quality scores
   * @param fileComplexity File complexity metrics
   * @returns List of general suggestions
   */
  private generateGeneralSuggestions(
    variableScores: VariableQualityScore[],
    fileComplexity: FileComplexityMetrics
  ): string[] {
    const suggestions: string[] = [];

    // Analyze naming consistency
    const lowNamingScores = variableScores.filter(
      score => score.namingScore < 70
    );
    if (
      lowNamingScores.length > 3 ||
      (variableScores.length > 10 &&
        lowNamingScores.length / variableScores.length > 0.3)
    ) {
      suggestions.push(
        'Consider adopting a consistent naming convention throughout the file'
      );
    }

    // Analyze global variable usage
    if (fileComplexity.globalVariablePercentage > 30) {
      suggestions.push(
        'Reduce the number of global variables to improve maintainability'
      );
    }

    // Analyze variable reuse
    if (fileComplexity.variableReuseFactor < 1) {
      suggestions.push(
        'Many variables are declared but rarely used. Consider refactoring to reduce unused variables'
      );
    } else if (fileComplexity.variableReuseFactor > 10) {
      suggestions.push(
        'Some variables are used extensively. Consider breaking down complex functions or introducing additional variables for clarity'
      );
    }

    // Analyze complexity
    if (fileComplexity.cycloComplexity > 15) {
      suggestions.push(
        'Code has high cyclomatic complexity. Consider refactoring complex conditional logic into smaller, more manageable functions'
      );
    }

    // Analyze maintainability
    if (fileComplexity.maintainabilityIndex < 50) {
      suggestions.push(
        'Code maintainability is low. Consider refactoring for improved readability and reduced complexity'
      );
    }

    // If code is generally good
    if (suggestions.length === 0 && fileComplexity.maintainabilityIndex > 80) {
      suggestions.push(
        'Code quality is good. Maintain consistent practices as the codebase grows'
      );
    }

    return suggestions;
  }

  /**
   * Generates a visual report of code quality metrics
   * @param metrics Code quality metrics to visualize
   * @returns HTML content for the webview panel
   */
  public generateQualityReport(metrics: CodeQualityMetrics): string {
    // Format date
    const date = new Date(metrics.timestamp);
    const dateString =
      date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

    // Create quality score color
    const getScoreColor = (score: number): string => {
      if (score >= 90) {
        return '#4CAF50';
      } // Green
      if (score >= 70) {
        return '#8BC34A';
      } // Light green
      if (score >= 50) {
        return '#FFC107';
      } // Yellow
      if (score >= 30) {
        return '#FF9800';
      } // Orange
      return '#F44336'; // Red
    };

    // Create HTML for variable scores table
    const variableScoresHtml = metrics.variableScores
      .sort((a, b) => a.overallScore - b.overallScore) // Sort by score ascending (worst first)
      .map(
        score => `
        <tr>
          <td>${score.name}</td>
          <td style="text-align: center; background-color: ${getScoreColor(
            score.namingScore
          )}">${score.namingScore}</td>
          <td style="text-align: center; background-color: ${getScoreColor(
            score.usageScore
          )}">${score.usageScore}</td>
          <td style="text-align: center; background-color: ${getScoreColor(
            score.scopeScore
          )}">${score.scopeScore}</td>
          <td style="text-align: center; background-color: ${getScoreColor(
            score.overallScore
          )}">${score.overallScore}</td>
          <td>${score.suggestions.join('<br>')}</td>
        </tr>
      `
      )
      .join('');

    // Create HTML for general suggestions
    const suggestionsHtml = metrics.generalSuggestions
      .map(suggestion => `<li>${suggestion}</li>`)
      .join('');

    // Create HTML content
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Quality Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 20px; }
          h1, h2, h3 { margin-top: 20px; }
          .score-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; font-size: 1.2em; margin: 10px 0; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; text-align: left; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
          .metric-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
          .metric-title { font-weight: bold; margin-bottom: 5px; }
          .metric-value { font-size: 1.2em; }
        </style>
      </head>
      <body>
        <h1>Code Quality Report</h1>
        <p>Generated on ${dateString}</p>

        <h2>Overall Score</h2>
        <div class="score-badge" style="background-color: ${getScoreColor(
          metrics.overallScore
        )}">
          ${metrics.overallScore}/100
        </div>

        <h2>File Complexity Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-title">Total Variables</div>
            <div class="metric-value">${
              metrics.fileComplexity.totalVariables
            }</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Unique Variable Types</div>
            <div class="metric-value">${
              metrics.fileComplexity.uniqueVariableTypes
            }</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Global Variable %</div>
            <div class="metric-value">${metrics.fileComplexity.globalVariablePercentage.toFixed(
              1
            )}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Variable Reuse Factor</div>
            <div class="metric-value">${metrics.fileComplexity.variableReuseFactor.toFixed(
              2
            )}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Cyclomatic Complexity</div>
            <div class="metric-value">${
              metrics.fileComplexity.cycloComplexity
            }</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Maintainability Index</div>
            <div class="metric-value" style="color: ${getScoreColor(
              metrics.fileComplexity.maintainabilityIndex
            )}">
              ${metrics.fileComplexity.maintainabilityIndex.toFixed(0)}/100
            </div>
          </div>
        </div>

        <h2>General Suggestions</h2>
        <ul>
          ${suggestionsHtml || '<li>No general suggestions available.</li>'}
        </ul>

        <h2>Variable Quality Analysis</h2>
        <table>
          <thead>
            <tr>
              <th>Variable Name</th>
              <th>Naming Score</th>
              <th>Usage Score</th>
              <th>Scope Score</th>
              <th>Overall Score</th>
              <th>Suggestions</th>
            </tr>
          </thead>
          <tbody>
            ${
              variableScoresHtml ||
              '<tr><td colspan="6">No variables analyzed.</td></tr>'
            }
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
}
