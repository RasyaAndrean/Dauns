import * as vscode from 'vscode';

export class ConvertVariableProvider {
  /**
   * Converts a variable declaration from one type to another (var/let/const)
   * @param context The extension context
   */
  static async convertVariable(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const position = editor.selection.active;
      const lineText = editor.document.lineAt(position.line).text;

      // Find variable declaration on this line
      const varMatch = lineText.match(
        /\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/
      );
      if (!varMatch) {
        vscode.window.showErrorMessage(
          'No variable declaration found on this line'
        );
        return;
      }

      const currentType = varMatch[1];
      const variableName = varMatch[2];

      // Ask for new variable type
      const newType = await vscode.window.showQuickPick(
        ['var', 'let', 'const'].filter(type => type !== currentType),
        {
          placeHolder: `Convert ${currentType} ${variableName} to:`,
        }
      );

      if (!newType) {
        return; // User cancelled
      }

      // Create the workspace edit
      const edit = new vscode.WorkspaceEdit();

      // Find the exact position of the variable keyword
      const keywordIndex = lineText.indexOf(currentType);
      const keywordRange = new vscode.Range(
        new vscode.Position(position.line, keywordIndex),
        new vscode.Position(position.line, keywordIndex + currentType.length)
      );

      // Replace the keyword
      edit.replace(editor.document.uri, keywordRange, newType);

      // Apply the edit
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        vscode.window.showInformationMessage(
          `Converted ${currentType} ${variableName} to ${newType}`
        );
      } else {
        vscode.window.showErrorMessage('Failed to convert variable');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error converting variable:', error);
      vscode.window.showErrorMessage(`Failed to convert variable: ${error}`);
    }
  }

  /**
   * Provides smart suggestions for variable conversion based on usage
   * @param context The extension context
   */
  static async smartConvertVariable(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const position = editor.selection.active;
      const lineText = editor.document.lineAt(position.line).text;

      // Find variable declaration on this line
      const varMatch = lineText.match(
        /\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/
      );
      if (!varMatch) {
        vscode.window.showErrorMessage(
          'No variable declaration found on this line'
        );
        return;
      }

      const currentType = varMatch[1];
      const variableName = varMatch[2];

      // Analyze the variable usage to suggest the best conversion
      const suggestion = this.analyzeVariableUsage(
        editor.document,
        variableName,
        currentType
      );

      // Ask for new variable type with smart suggestion
      const options: vscode.QuickPickItem[] = [
        {
          label: 'var',
          description: currentType === 'var' ? '(current)' : '',
        },
        {
          label: 'let',
          description:
            currentType === 'let'
              ? '(current)'
              : suggestion === 'let'
              ? '(recommended)'
              : '',
        },
        {
          label: 'const',
          description:
            currentType === 'const'
              ? '(current)'
              : suggestion === 'const'
              ? '(recommended)'
              : '',
        },
      ];

      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: `Convert ${currentType} ${variableName} to:`,
      });

      if (!selected) {
        return; // User cancelled
      }

      const newType = selected.label;

      if (newType === currentType) {
        vscode.window.showInformationMessage(
          `${currentType} ${variableName} is already correctly declared`
        );
        return;
      }

      // Create the workspace edit
      const edit = new vscode.WorkspaceEdit();

      // Find the exact position of the variable keyword
      const keywordIndex = lineText.indexOf(currentType);
      const keywordRange = new vscode.Range(
        new vscode.Position(position.line, keywordIndex),
        new vscode.Position(position.line, keywordIndex + currentType.length)
      );

      // Replace the keyword
      edit.replace(editor.document.uri, keywordRange, newType);

      // Apply the edit
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        vscode.window.showInformationMessage(
          `Converted ${currentType} ${variableName} to ${newType}` +
            (suggestion === newType ? ' (recommended)' : '')
        );
      } else {
        vscode.window.showErrorMessage('Failed to convert variable');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error converting variable:', error);
      vscode.window.showErrorMessage(`Failed to convert variable: ${error}`);
    }
  }

  /**
   * Analyzes variable usage to suggest the best declaration type
   * @param document The text document
   * @param variableName The name of the variable
   * @param currentType The current declaration type
   * @returns Recommended declaration type
   */
  private static analyzeVariableUsage(
    document: vscode.TextDocument,
    variableName: string,
    currentType: string
  ): string {
    const text = document.getText();

    // Check if the variable is reassigned
    const reassignmentRegex = new RegExp(
      `\\b${this.escapeRegExp(variableName)}\\s*=`,
      'g'
    );
    const reassignmentMatches = text.match(reassignmentRegex);
    const reassignmentCount = reassignmentMatches
      ? reassignmentMatches.length
      : 0;

    // Check if the variable is declared in multiple places
    const declarationRegex = new RegExp(
      `\\b(var|let|const)\\s+${this.escapeRegExp(variableName)}\\b`,
      'g'
    );
    const declarationMatches = text.match(declarationRegex);
    const declarationCount = declarationMatches ? declarationMatches.length : 0;

    // If the variable is never reassigned and only declared once, const is recommended
    if (reassignmentCount === 0 && declarationCount === 1) {
      return 'const';
    }

    // If the variable is reassigned, let is recommended
    if (reassignmentCount > 0) {
      return 'let';
    }

    // If the variable is declared multiple times, var might be intended (though not recommended)
    if (declarationCount > 1) {
      return 'var';
    }

    // Default to current type if no clear recommendation
    return currentType;
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
