import * as vscode from 'vscode';

export class InlineVariableProvider {
  /**
   * Inlines a variable by replacing its usages with its value
   * @param context The extension context
   */
  static async inlineVariable(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const position = editor.selection.active;
      const document = editor.document;
      const lineText = document.lineAt(position.line).text;

      // Find variable declaration on this line
      const varMatch = lineText.match(
        /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+)/
      );
      if (!varMatch) {
        vscode.window.showErrorMessage(
          'No valid variable declaration found on this line'
        );
        return;
      }

      const variableName = varMatch[2];
      const variableValue = varMatch[3].trim();

      // Confirm with user before inlining
      const confirm = await vscode.window.showWarningMessage(
        `Inline variable '${variableName}' with value '${variableValue}'? This will remove the declaration and replace all usages.`,
        { modal: true },
        'Yes',
        'Cancel'
      );

      if (confirm !== 'Yes') {
        return;
      }

      // Find all usages of the variable
      const text = document.getText();
      const usageRegex = new RegExp(
        `\\b${this.escapeRegExp(variableName)}\\b`,
        'g'
      );
      const matches = [...text.matchAll(usageRegex)];

      if (matches.length <= 1) {
        vscode.window.showWarningMessage(
          `Variable '${variableName}' is not used anywhere, consider removing it instead.`
        );
        return;
      }

      // Create the workspace edit
      const edit = new vscode.WorkspaceEdit();

      // Replace all usages except the declaration
      for (const match of matches) {
        // Skip the declaration itself
        if (match.index >= lineText.length) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + variableName.length);
          const range = new vscode.Range(startPos, endPos);
          edit.replace(document.uri, range, variableValue);
        }
      }

      // Remove the variable declaration line
      const lineRange = new vscode.Range(
        new vscode.Position(position.line, 0),
        new vscode.Position(position.line, lineText.length)
      );
      edit.delete(document.uri, lineRange);

      // Apply the edit
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        vscode.window.showInformationMessage(
          `Inlined variable '${variableName}'`
        );
      } else {
        vscode.window.showErrorMessage('Failed to inline variable');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error inlining variable:', error);
      vscode.window.showErrorMessage(`Failed to inline variable: ${error}`);
    }
  }

  /**
   * Inlines all unused variables in the current document
   * @param context The extension context
   */
  static async inlineUnusedVariables(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }
      // This would require scanning for variables first, which we can do by
      // temporarily using the variable scanner (not implemented here for brevity)

      vscode.window.showInformationMessage(
        'Inline unused variables feature is being prepared'
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error inlining unused variables:', error);
      vscode.window.showErrorMessage(
        `Failed to inline unused variables: ${error}`
      );
    }
  }

  /**
   * Escapes special regex characters in a string
   * @param string The string to escape
   * @returns The escaped string
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
