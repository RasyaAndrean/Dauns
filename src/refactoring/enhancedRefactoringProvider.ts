import * as vscode from 'vscode';
import { VariableInfo } from '../parsers/types';

export class EnhancedRefactoringProvider {
  /**
   * Optimizes variable declarations by suggesting better declaration types
   * @param document The text document
   * @param variable The variable to optimize
   */
  static async optimizeVariableDeclaration(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): Promise<void> {
    // Check if the variable is declared with 'let' but never reassigned
    if (variable.declarationType === 'let') {
      const isReassigned = this.isVariableReassigned(document, variable);

      if (!isReassigned) {
        const action = await vscode.window.showInformationMessage(
          `Variable '${variable.name}' is declared with 'let' but never reassigned. Consider changing to 'const'.`,
          'Convert to const',
          'Ignore'
        );

        if (action === 'Convert to const') {
          await this.convertToConst(document, variable);
        }
        return;
      }
    }

    // Check if the variable is declared with 'var'
    if (variable.declarationType === 'var') {
      const action = await vscode.window.showInformationMessage(
        `Variable '${variable.name}' is declared with 'var'. Consider changing to 'let' or 'const'.`,
        'Convert to let',
        'Convert to const',
        'Ignore'
      );

      if (action === 'Convert to let') {
        await this.convertToLet(document, variable);
      } else if (action === 'Convert to const') {
        await this.convertToConst(document, variable);
      }
      return;
    }

    vscode.window.showInformationMessage(
      `No optimization suggestions for variable '${variable.name}'.`
    );
  }

  /**
   * Checks if a variable is reassigned in the document
   * @param document The text document
   * @param variable The variable to check
   * @returns True if the variable is reassigned
   */
  private static isVariableReassigned(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): boolean {
    const text = document.getText();
    // Look for assignment patterns like "variableName ="
    const assignmentPattern = new RegExp(`\\b${variable.name}\\s*=`, 'g');
    const matches = text.match(assignmentPattern);

    // If there are matches, check if any are not the initial declaration
    if (matches) {
      // Count total assignments
      const totalAssignments = matches.length;

      // A variable declared with let/const/var will have one assignment in its declaration
      // So if there's more than one, it's reassigned
      return totalAssignments > 1;
    }

    return false;
  }

  /**
   * Converts a variable declaration from 'let' or 'var' to 'const'
   * @param document The text document
   * @param variable The variable to convert
   */
  private static async convertToConst(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const position = new vscode.Position(variable.line - 1, 0);
    const line = document.lineAt(position.line).text;

    // Replace the declaration keyword
    const newLine = line.replace(
      new RegExp(`\\b(${variable.declarationType})\\b`),
      'const'
    );

    edit.replace(
      document.uri,
      new vscode.Range(position, position.with(position.line, line.length)),
      newLine
    );

    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
      vscode.window.showInformationMessage(
        `Converted '${variable.name}' to const.`
      );
    } else {
      vscode.window.showErrorMessage(
        `Failed to convert '${variable.name}' to const.`
      );
    }
  }

  /**
   * Converts a variable declaration from 'var' to 'let'
   * @param document The text document
   * @param variable The variable to convert
   */
  private static async convertToLet(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const position = new vscode.Position(variable.line - 1, 0);
    const line = document.lineAt(position.line).text;

    // Replace the declaration keyword
    const newLine = line.replace(
      new RegExp(`\\b(${variable.declarationType})\\b`),
      'let'
    );

    edit.replace(
      document.uri,
      new vscode.Range(position, position.with(position.line, line.length)),
      newLine
    );

    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
      vscode.window.showInformationMessage(
        `Converted '${variable.name}' to let.`
      );
    } else {
      vscode.window.showErrorMessage(
        `Failed to convert '${variable.name}' to let.`
      );
    }
  }

  /**
   * Renames a variable with improved UI and validation
   * @param document The text document
   * @param variable The variable to rename
   */
  static async enhancedRenameVariable(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): Promise<void> {
    // Show input box with validation
    const newName = await vscode.window.showInputBox({
      prompt: `Rename variable '${variable.name}'`,
      value: variable.name,
      validateInput: (value: string) => {
        if (!value) {
          return 'Variable name cannot be empty';
        }

        if (value === variable.name) {
          return 'New name must be different from current name';
        }

        if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
          return 'Invalid variable name format';
        }

        // Check for reserved keywords
        const reservedKeywords = [
          'break',
          'case',
          'catch',
          'class',
          'const',
          'continue',
          'debugger',
          'default',
          'delete',
          'do',
          'else',
          'export',
          'extends',
          'finally',
          'for',
          'function',
          'if',
          'import',
          'in',
          'instanceof',
          'let',
          'new',
          'return',
          'super',
          'switch',
          'this',
          'throw',
          'try',
          'typeof',
          'var',
          'void',
          'while',
          'with',
          'yield',
        ];

        if (reservedKeywords.includes(value)) {
          return `'${value}' is a reserved keyword`;
        }

        return null;
      },
    });

    if (!newName) {
      return;
    }

    // Show preview of changes
    const affectedRanges = this.findVariableReferences(document, variable.name);

    if (affectedRanges.length === 0) {
      vscode.window.showInformationMessage(
        `No references found for variable '${variable.name}'.`
      );
      return;
    }

    // Create a preview panel
    const panel = vscode.window.createWebviewPanel(
      'renamePreview',
      `Rename Preview: ${variable.name} → ${newName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    // Generate preview content
    let previewContent = `<h1>Rename Preview</h1>`;
    previewContent += `<p><strong>Variable:</strong> ${variable.name} → ${newName}</p>`;
    previewContent += `<p><strong>Occurrences:</strong> ${affectedRanges.length}</p>`;
    previewContent += `<h2>Changes</h2>`;
    previewContent += `<ul>`;

    for (const range of affectedRanges) {
      const line = document.lineAt(range.start.line);
      previewContent += `<li>Line ${range.start.line + 1}: ${line.text}</li>`;
    }

    previewContent += `</ul>`;
    previewContent += `<button id="confirmRename">Confirm Rename</button>`;
    previewContent += `<button id="cancelRename">Cancel</button>`;

    previewContent += `
      <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('confirmRename').addEventListener('click', () => {
          vscode.postMessage({ command: 'confirm' });
        });
        document.getElementById('cancelRename').addEventListener('click', () => {
          vscode.postMessage({ command: 'cancel' });
        });
      </script>
    `;

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rename Preview</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 10px; }
          button { margin: 5px; padding: 5px 10px; }
          ul { max-height: 300px; overflow-y: auto; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        ${previewContent}
      </body>
      </html>
    `;

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'confirm':
          await this.performRename(document, variable.name, newName);
          panel.dispose();
          break;
        case 'cancel':
          panel.dispose();
          break;
      }
    }, undefined);
  }

  /**
   * Finds all references to a variable in a document
   * @param document The text document
   * @param variableName The name of the variable
   * @returns Array of ranges where the variable is referenced
   */
  private static findVariableReferences(
    document: vscode.TextDocument,
    variableName: string
  ): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const text = document.getText();
    const regex = new RegExp(`\\b${variableName}\\b`, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + variableName.length);
      ranges.push(new vscode.Range(startPos, endPos));
    }

    return ranges;
  }

  /**
   * Performs the actual rename operation
   * @param document The text document
   * @param oldName The current variable name
   * @param newName The new variable name
   */
  private static async performRename(
    document: vscode.TextDocument,
    oldName: string,
    newName: string
  ): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const references = this.findVariableReferences(document, oldName);

    // Apply edits in reverse order to maintain correct positions
    for (let i = references.length - 1; i >= 0; i--) {
      edit.replace(document.uri, references[i], newName);
    }

    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
      vscode.window.showInformationMessage(
        `Renamed '${oldName}' to '${newName}'.`
      );
    } else {
      vscode.window.showErrorMessage(
        `Failed to rename '${oldName}' to '${newName}'.`
      );
    }
  }

  /**
   * Shows refactoring suggestions for a variable
   * @param document The text document
   * @param variable The variable to analyze
   */
  static async showRefactoringSuggestions(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): Promise<void> {
    const suggestions: string[] = [];

    // Check for optimization suggestions
    if (
      variable.declarationType === 'let' &&
      !this.isVariableReassigned(document, variable)
    ) {
      suggestions.push('Convert to const (variable is never reassigned)');
    }

    if (variable.declarationType === 'var') {
      suggestions.push('Convert to let or const (var is deprecated)');
    }

    // Check for naming suggestions
    if (this.isPoorlyNamed(variable.name)) {
      suggestions.push('Consider renaming for better clarity');
    }

    // Check for unused variable
    if (variable.references.length === 0) {
      suggestions.push('Variable is unused - consider removing');
    }

    if (suggestions.length === 0) {
      vscode.window.showInformationMessage(
        `No refactoring suggestions for '${variable.name}'.`
      );
      return;
    }

    // Show suggestions in a quick pick
    const selected = await vscode.window.showQuickPick(suggestions, {
      placeHolder: `Refactoring suggestions for '${variable.name}'`,
    });

    if (selected) {
      if (selected.includes('Convert to const')) {
        await this.convertToConst(document, variable);
      } else if (selected.includes('Convert to let')) {
        await this.convertToLet(document, variable);
      } else if (selected.includes('renaming')) {
        await this.enhancedRenameVariable(document, variable);
      } else if (selected.includes('removing')) {
        const confirm = await vscode.window.showWarningMessage(
          `Remove unused variable '${variable.name}'?`,
          { modal: true },
          'Yes',
          'No'
        );

        if (confirm === 'Yes') {
          await this.removeVariable(document, variable);
        }
      }
    }
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
    const meaninglessNames = ['data', 'temp', 'value', 'item', 'obj', 'arr'];
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
   * Removes a variable declaration
   * @param document The text document
   * @param variable The variable to remove
   */
  private static async removeVariable(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const line = document.lineAt(variable.line - 1);

    // Remove the entire line
    edit.delete(
      document.uri,
      new vscode.Range(
        new vscode.Position(variable.line - 1, 0),
        new vscode.Position(variable.line - 1, line.text.length)
      )
    );

    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
      vscode.window.showInformationMessage(
        `Removed unused variable '${variable.name}'.`
      );
    } else {
      vscode.window.showErrorMessage(
        `Failed to remove variable '${variable.name}'.`
      );
    }
  }
}
