import * as vscode from 'vscode';
import { VariableInfo } from '../parsers/types';

/**
 * Interface for scope information
 */
export interface ScopeInfo {
  type: 'global' | 'function' | 'block' | 'module';
  startLine: number;
  endLine: number;
  name?: string;
  parent?: ScopeInfo;
  children: ScopeInfo[];
}

/**
 * Interface for enhanced variable information with scope details
 */
export interface ScopedVariableInfo extends VariableInfo {
  scopeInfo: ScopeInfo;
  isShadowed: boolean;
  shadowedBy?: ScopedVariableInfo[];
  shadows?: ScopedVariableInfo;
}

/**
 * Scope Analyzer for detecting variable scopes and shadowing
 */
export class ScopeAnalyzer {
  /**
   * Analyzes scopes in a document and identifies variable shadowing
   * @param document The text document to analyze
   * @param variables The variables found in the document
   * @returns Enhanced variable information with scope details
   */
  static analyzeScopes(
    document: vscode.TextDocument,
    variables: VariableInfo[]
  ): ScopedVariableInfo[] {
    const text = document.getText();
    const lines = text.split('\n');

    // Build scope hierarchy
    const globalScope: ScopeInfo = {
      type: 'global',
      startLine: 1,
      endLine: lines.length,
      children: [],
    };

    const scopes = this.buildScopeHierarchy(text, globalScope);

    // Enhance variables with scope information
    const scopedVariables: ScopedVariableInfo[] = variables.map(variable => {
      const scope = this.findVariableScope(variable, scopes);
      return {
        ...variable,
        scopeInfo: scope,
        isShadowed: false, // Will be updated later
      };
    });

    // Detect shadowing
    this.detectShadowing(scopedVariables);

    return scopedVariables;
  }

  /**
   * Builds a hierarchy of scopes from the document text
   * @param text The document text
   * @param globalScope The global scope to build upon
   * @returns Array of all scopes
   */
  private static buildScopeHierarchy(
    text: string,
    globalScope: ScopeInfo
  ): ScopeInfo[] {
    const scopes: ScopeInfo[] = [globalScope];

    // Regular expressions for scope boundaries
    const functionRegex =
      /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\([^)]*\)\s*\{/g;

    const blockRegex = /\{/g;
    const closingBraceRegex = /\}/g;

    // Track positions of all braces
    const bracePositions: { position: number; type: 'open' | 'close' }[] = [];

    // Find all opening braces
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
      bracePositions.push({ position: match.index, type: 'open' });
    }

    // Find all closing braces
    while ((match = closingBraceRegex.exec(text)) !== null) {
      bracePositions.push({ position: match.index, type: 'close' });
    }

    // Sort by position
    bracePositions.sort((a, b) => a.position - b.position);

    // Match opening and closing braces to identify blocks
    const braceStack: { position: number; line: number }[] = [];
    const blockRanges: { startLine: number; endLine: number }[] = [];

    for (const brace of bracePositions) {
      const line = this.getLineNumberOfPosition(text, brace.position);

      if (brace.type === 'open') {
        braceStack.push({ position: brace.position, line });
      } else if (brace.type === 'close' && braceStack.length > 0) {
        const openBrace = braceStack.pop()!;
        blockRanges.push({ startLine: openBrace.line, endLine: line });
      }
    }

    // Create block scopes for each block range
    for (const range of blockRanges) {
      // Skip very small blocks (likely object literals)
      if (range.endLine - range.startLine > 1) {
        const blockScope: ScopeInfo = {
          type: 'block',
          startLine: range.startLine,
          endLine: range.endLine,
          children: [],
          parent: this.findParentScope(range.startLine, scopes),
        };

        if (blockScope.parent) {
          blockScope.parent.children.push(blockScope);
        }

        scopes.push(blockScope);
      }
    }

    // Find functions and create function scopes
    while ((match = functionRegex.exec(text)) !== null) {
      const functionName = match[1];
      const functionStart = match.index;
      const functionStartLine = this.getLineNumberOfPosition(
        text,
        functionStart
      );

      // Find the matching closing brace for this function
      const functionEndLine = this.findFunctionEndLine(
        text,
        functionStartLine,
        blockRanges
      );

      if (functionEndLine > functionStartLine) {
        const functionScope: ScopeInfo = {
          type: 'function',
          startLine: functionStartLine,
          endLine: functionEndLine,
          name: functionName,
          children: [],
          parent: this.findParentScope(functionStartLine, scopes),
        };

        if (functionScope.parent) {
          functionScope.parent.children.push(functionScope);
        }

        scopes.push(functionScope);
      }
    }

    return scopes;
  }

  /**
   * Finds the line number for a given character position
   * @param text The document text
   * @param position The character position
   * @returns The line number (1-based)
   */
  private static getLineNumberOfPosition(
    text: string,
    position: number
  ): number {
    const substr = text.substring(0, position);
    return substr.split('\n').length;
  }

  /**
   * Finds the end line of a function based on brace matching
   * @param text The document text
   * @param startLine The starting line of the function
   * @param blockRanges The identified block ranges
   * @returns The end line of the function
   */
  private static findFunctionEndLine(
    text: string,
    startLine: number,
    blockRanges: { startLine: number; endLine: number }[]
  ): number {
    // Find the block range that starts at or near the function start line
    for (const range of blockRanges) {
      if (range.startLine >= startLine && range.endLine > range.startLine) {
        return range.endLine;
      }
    }

    return startLine;
  }

  /**
   * Finds the parent scope for a given line
   * @param line The line number
   * @param scopes The available scopes
   * @returns The parent scope or undefined
   */
  private static findParentScope(
    line: number,
    scopes: ScopeInfo[]
  ): ScopeInfo | undefined {
    // Find the most specific scope that contains this line
    let bestScope: ScopeInfo | undefined;

    for (const scope of scopes) {
      if (scope.startLine <= line && scope.endLine >= line) {
        if (
          !bestScope ||
          (scope.startLine >= bestScope.startLine &&
            scope.endLine <= bestScope.endLine)
        ) {
          bestScope = scope;
        }
      }
    }

    return bestScope;
  }

  /**
   * Finds the scope for a specific variable
   * @param variable The variable to find scope for
   * @param scopes The available scopes
   * @returns The scope containing the variable
   */
  private static findVariableScope(
    variable: VariableInfo,
    scopes: ScopeInfo[]
  ): ScopeInfo {
    // Find the most specific scope that contains this variable
    let bestScope = scopes[0]; // Default to global scope

    for (const scope of scopes) {
      if (scope.startLine <= variable.line && scope.endLine >= variable.line) {
        if (
          scope.startLine >= bestScope.startLine &&
          scope.endLine <= bestScope.endLine
        ) {
          bestScope = scope;
        }
      }
    }

    return bestScope;
  }

  /**
   * Detects variable shadowing within scopes
   * @param variables The scoped variables to analyze
   */
  private static detectShadowing(variables: ScopedVariableInfo[]): void {
    // Group variables by name
    const variablesByName: Record<string, ScopedVariableInfo[]> = {};

    for (const variable of variables) {
      if (!variablesByName[variable.name]) {
        variablesByName[variable.name] = [];
      }
      variablesByName[variable.name].push(variable);
    }

    // Check for shadowing within each group
    for (const name in variablesByName) {
      const vars = variablesByName[name];
      if (vars.length > 1) {
        // Sort by scope depth (innermost first)
        vars.sort(
          (a, b) =>
            this.getScopeDepth(b.scopeInfo) - this.getScopeDepth(a.scopeInfo)
        );

        // Mark shadowing relationships
        for (let i = 1; i < vars.length; i++) {
          vars[i].isShadowed = true;
          vars[i].shadowedBy = vars.slice(0, i);
          vars[i].shadows = vars[0]; // Shadowed by the innermost declaration
        }
      }
    }
  }

  /**
   * Gets the depth of a scope in the hierarchy
   * @param scope The scope to measure
   * @returns The depth of the scope
   */
  private static getScopeDepth(scope: ScopeInfo): number {
    let depth = 0;
    let current: ScopeInfo | undefined = scope;

    while (current?.parent) {
      depth++;
      current = current.parent;
    }

    return depth;
  }

  /**
   * Shows scope information in a quick pick
   * @param scopedVariables The scoped variables to display
   */
  static async showScopeInfo(
    scopedVariables: ScopedVariableInfo[]
  ): Promise<void> {
    if (scopedVariables.length === 0) {
      vscode.window.showInformationMessage('No variables found!');
      return;
    }

    const quickPickItems = scopedVariables.map(variable => {
      let description = `${variable.type} (${variable.declarationType})`;
      let detail = `Scope: ${variable.scopeInfo.type}`;

      if (variable.isShadowed) {
        description += ' - SHADOWED';
        detail += ' ⚠️';
      }

      if (variable.scopeInfo.name) {
        detail += ` in ${variable.scopeInfo.name}`;
      }

      detail += ` at line ${variable.line}`;

      return {
        label: variable.name,
        description,
        detail,
        variable,
      };
    });

    const selection = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: 'Select a variable to see detailed scope information',
      matchOnDetail: true,
    });

    if (selection) {
      const selectedVariable = selection.variable as ScopedVariableInfo;

      // Create a detailed message with scope information
      let message = `Variable: ${selectedVariable.name}\n`;
      message += `Type: ${selectedVariable.type}\n`;
      message += `Declaration: ${selectedVariable.declarationType}\n`;
      message += `Scope: ${selectedVariable.scopeInfo.type}\n`;
      message += `Location: Line ${selectedVariable.line}\n`;
      message += `Shadowed: ${selectedVariable.isShadowed ? 'Yes' : 'No'}\n`;

      if (selectedVariable.isShadowed && selectedVariable.shadows) {
        message += `Shadowed by: ${selectedVariable.shadows.name} at line ${selectedVariable.shadows.line}\n`;
      }

      if (
        selectedVariable.shadowedBy &&
        selectedVariable.shadowedBy.length > 0
      ) {
        message += `Shadows: ${selectedVariable.shadowedBy
          .map(v => `${v.name} (line ${v.line})`)
          .join(', ')}\n`;
      }

      vscode.window.showInformationMessage(message, { modal: true });
    }
  }

  /**
   * Generates a scope report
   * @param scopedVariables The scoped variables to analyze
   * @returns A formatted scope report
   */
  static generateScopeReport(scopedVariables: ScopedVariableInfo[]): string {
    const shadowedVariables = scopedVariables.filter(v => v.isShadowed);

    let report = 'Variable Scope Analysis Report\n';
    report += '=============================\n\n';

    report += `Total Variables: ${scopedVariables.length}\n`;
    report += `Shadowed Variables: ${shadowedVariables.length}\n\n`;

    if (shadowedVariables.length > 0) {
      report += 'Shadowed Variables:\n';
      for (const variable of shadowedVariables) {
        report += `  - ${variable.name} (${variable.declarationType}) at line ${variable.line} `;
        report += `in ${variable.scopeInfo.type} scope`;
        if (variable.scopeInfo.name) {
          report += ` (${variable.scopeInfo.name})`;
        }
        if (variable.shadows) {
          report += ` - shadowed by ${variable.shadows.name} at line ${variable.shadows.line}\n`;
        } else {
          report += '\n';
        }
      }
      report += '\n';
    }

    // Group variables by scope type
    const variablesByScope: Record<string, ScopedVariableInfo[]> = {};
    for (const variable of scopedVariables) {
      const scopeType = variable.scopeInfo.type;
      if (!variablesByScope[scopeType]) {
        variablesByScope[scopeType] = [];
      }
      variablesByScope[scopeType].push(variable);
    }

    report += 'Variables by Scope:\n';
    for (const scopeType in variablesByScope) {
      report += `  ${scopeType}: ${variablesByScope[scopeType].length}\n`;
    }

    return report;
  }
}
