import * as vscode from 'vscode';

export class ExtractVariableProvider {
  /**
   * Extracts selected text into a new variable
   * @param context The extension context
   */
  static async extractVariable(
    context: vscode.ExtensionContext
  ): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showErrorMessage('Please select text to extract');
        return;
      }

      const selectedText = editor.document.getText(selection);
      if (!selectedText.trim()) {
        vscode.window.showErrorMessage('Selected text is empty');
        return;
      }

      // Ask for variable name
      const variableName = await vscode.window.showInputBox({
        prompt: 'Enter variable name',
        validateInput: (value: string) => {
          if (!value) {
            return 'Variable name cannot be empty';
          }
          if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
            return 'Invalid variable name format';
          }
          return null;
        },
      });

      if (!variableName) {
        return; // User cancelled
      }

      // Determine the best place to insert the variable declaration
      const insertPosition = this.findBestInsertPosition(editor, selection);

      // Create the workspace edit
      const edit = new vscode.WorkspaceEdit();

      // Insert the variable declaration
      const declaration = `const ${variableName} = ${selectedText};\n`;
      edit.insert(editor.document.uri, insertPosition, declaration);

      // Replace the selected text with the variable name
      edit.replace(editor.document.uri, selection, variableName);

      // Apply the edit
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        vscode.window.showInformationMessage(
          `Extracted variable '${variableName}'`
        );
      } else {
        vscode.window.showErrorMessage('Failed to extract variable');
      }
    } catch (error) {
      console.error('Error extracting variable:', error);
      vscode.window.showErrorMessage(`Failed to extract variable: ${error}`);
    }
  }

  /**
   * Finds the best position to insert a variable declaration
   * @param editor The text editor
   * @param selection The current selection
   * @returns The position where the variable should be declared
   */
  private static findBestInsertPosition(
    editor: vscode.TextEditor,
    selection: vscode.Selection
  ): vscode.Position {
    const document = editor.document;
    const selectionStart = selection.start;

    // Look for the beginning of the current scope (function, class, or file)
    let insertLine = selectionStart.line;

    // Move up to find a suitable insertion point
    while (insertLine > 0) {
      const lineText = document.lineAt(insertLine - 1).text.trim();

      // If we find a function or class declaration, insert after it
      if (
        lineText.startsWith('function ') ||
        lineText.startsWith('class ') ||
        lineText.startsWith('const ') ||
        lineText.startsWith('let ') ||
        lineText.startsWith('var ')
      ) {
        break;
      }

      // If we find a block opening, insert after it
      if (lineText.endsWith('{')) {
        break;
      }

      insertLine--;
    }

    // Skip any empty lines
    while (insertLine < selectionStart.line) {
      const lineText = document.lineAt(insertLine).text.trim();
      if (lineText !== '') {
        break;
      }
      insertLine++;
    }

    return new vscode.Position(insertLine, 0);
  }

  /**
   * Extracts a complex expression into a new variable with intelligent naming
   * @param context The extension context
   */
  static async extractWithSmartNaming(
    context: vscode.ExtensionContext
  ): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showErrorMessage('Please select text to extract');
        return;
      }

      const selectedText = editor.document.getText(selection);
      if (!selectedText.trim()) {
        vscode.window.showErrorMessage('Selected text is empty');
        return;
      }

      // Generate a smart variable name based on the expression
      const suggestedName = this.generateVariableName(selectedText);

      // Ask for variable name with suggestion
      const variableName = await vscode.window.showInputBox({
        prompt: 'Enter variable name',
        value: suggestedName,
        validateInput: (value: string) => {
          if (!value) {
            return 'Variable name cannot be empty';
          }
          if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
            return 'Invalid variable name format';
          }
          return null;
        },
      });

      if (!variableName) {
        return; // User cancelled
      }

      // Determine the best place to insert the variable declaration
      const insertPosition = this.findBestInsertPosition(editor, selection);

      // Create the workspace edit
      const edit = new vscode.WorkspaceEdit();

      // Insert the variable declaration
      const declaration = `const ${variableName} = ${selectedText};\n`;
      edit.insert(editor.document.uri, insertPosition, declaration);

      // Replace the selected text with the variable name
      edit.replace(editor.document.uri, selection, variableName);

      // Apply the edit
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        vscode.window.showInformationMessage(
          `Extracted variable '${variableName}'`
        );
      } else {
        vscode.window.showErrorMessage('Failed to extract variable');
      }
    } catch (error) {
      console.error('Error extracting variable:', error);
      vscode.window.showErrorMessage(`Failed to extract variable: ${error}`);
    }
  }

  /**
   * Generates a variable name based on the expression content
   * @param expression The expression to generate a name for
   * @returns A suggested variable name
   */
  private static generateVariableName(expression: string): string {
    // Remove extra whitespace
    expression = expression.trim();

    // Handle common patterns
    if (expression.startsWith('document.querySelector')) {
      return 'element';
    }

    if (expression.startsWith('document.getElementById')) {
      return 'element';
    }

    if (expression.startsWith('JSON.parse')) {
      return 'parsedData';
    }

    if (expression.startsWith('JSON.stringify')) {
      return 'jsonString';
    }

    if (expression.includes('.map(')) {
      return 'mappedArray';
    }

    if (expression.includes('.filter(')) {
      return 'filteredArray';
    }

    if (expression.includes('.reduce(')) {
      return 'reducedValue';
    }

    if (expression.includes('.sort(')) {
      return 'sortedArray';
    }

    if (expression.startsWith('new Date')) {
      return 'date';
    }

    if (expression.startsWith('Math.')) {
      return 'mathResult';
    }

    if (expression.startsWith('fetch(')) {
      return 'response';
    }

    if (expression.includes('=>') && expression.includes('{')) {
      return 'result';
    }

    // Handle string literals
    if (
      expression.startsWith('"') ||
      expression.startsWith("'") ||
      expression.startsWith('`')
    ) {
      // Try to extract meaningful name from string
      const content = expression.slice(1, -1);
      if (content.includes(' ')) {
        // Convert to camelCase
        return content
          .split(' ')
          .map((word, index) =>
            index === 0
              ? word.toLowerCase()
              : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join('');
      }
      return content;
    }

    // Handle array literals
    if (expression.startsWith('[')) {
      return 'array';
    }

    // Handle object literals
    if (expression.startsWith('{')) {
      return 'object';
    }

    // Handle function calls
    if (expression.includes('(') && expression.includes(')')) {
      const functionName = expression.split('(')[0];
      if (functionName.includes('.')) {
        const method = functionName.split('.').pop();
        if (method) {
          return method.replace(/[^a-zA-Z0-9]/g, '') + 'Result';
        }
      }
      return functionName.replace(/[^a-zA-Z0-9]/g, '') + 'Result';
    }

    // Default fallback
    return 'extractedValue';
  }
}
