import * as vscode from 'vscode';
import { VariableInfo } from './variableScanner';

export interface UnusedVariable extends VariableInfo {
  usageCount: number;
}

export class UnusedVariableDetector {
  // Find unused variables in a document
  static findUnusedVariables(
    document: vscode.TextDocument,
    variables: VariableInfo[]
  ): UnusedVariable[] {
    const text = document.getText();
    const unusedVariables: UnusedVariable[] = [];

    for (const variable of variables) {
      // Skip function declarations as they might be exported or used elsewhere
      if (variable.type === 'function') {
        continue;
      }

      // Count occurrences of the variable name in the document (excluding declaration)
      const variableRegex = new RegExp(
        `\\b${this.escapeRegExp(variable.name)}\\b`,
        'g'
      );
      const matches = text.match(variableRegex);
      const usageCount = matches ? matches.length : 0;

      // If usage count is 1 or less, it means it's only declared but not used
      // (or only used once which is just the declaration)
      if (usageCount <= 1) {
        unusedVariables.push({
          ...variable,
          usageCount: usageCount,
        });
      }
    }

    return unusedVariables;
  }

  // Escape special regex characters
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Show unused variables in a quick pick
  static async showUnusedVariables(
    unusedVariables: UnusedVariable[]
  ): Promise<void> {
    if (unusedVariables.length === 0) {
      vscode.window.showInformationMessage('No unused variables found!');
      return;
    }

    const quickPickItems = unusedVariables.map(variable => ({
      label: variable.name,
      description: `${variable.type} (${variable.kind})`,
      detail: `Declared at line ${variable.line}, column ${variable.character} - Used ${variable.usageCount} time(s)`,
    }));

    const selection = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: `Found ${unusedVariables.length} unused variable(s). Select one to navigate to it.`,
    });

    if (selection) {
      const selectedVariable = unusedVariables.find(
        v => v.name === selection.label
      );
      if (selectedVariable) {
        // We would need to navigate to the variable, but we don't have the document reference here
        vscode.window.showInformationMessage(
          `Selected unused variable: ${selectedVariable.name}`
        );
      }
    }
  }
}
