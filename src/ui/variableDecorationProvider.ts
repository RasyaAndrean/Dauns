import * as vscode from 'vscode';
import { scanVariablesInDocument } from '../variableScanner';

export class VariableDecorationProvider {
  private unusedVariableDecoration!: vscode.TextEditorDecorationType;
  private shadowedVariableDecoration!: vscode.TextEditorDecorationType;
  private globalVariableDecoration!: vscode.TextEditorDecorationType;

  constructor() {
    this.createDecorationTypes();
  }

  private createDecorationTypes(): void {
    this.unusedVariableDecoration =
      vscode.window.createTextEditorDecorationType({
        textDecoration: 'line-through',
        color: new vscode.ThemeColor('editorWarning.foreground'),
        backgroundColor: new vscode.ThemeColor('editorWarning.background'),
      });

    this.shadowedVariableDecoration =
      vscode.window.createTextEditorDecorationType({
        border: '1px solid',
        borderColor: new vscode.ThemeColor('editorError.foreground'),
        backgroundColor: new vscode.ThemeColor('editorError.background'),
      });

    this.globalVariableDecoration =
      vscode.window.createTextEditorDecorationType({
        fontWeight: 'bold',
        color: new vscode.ThemeColor('editorInfo.foreground'),
      });
  }

  async updateDecorations(editor: vscode.TextEditor): Promise<void> {
    if (!editor || !this.isSupported(editor.document)) {
      return;
    }

    const variables: any[] = scanVariablesInDocument(editor.document);
    const unusedVars: vscode.DecorationOptions[] = [];
    const shadowedVars: vscode.DecorationOptions[] = [];
    const globalVars: vscode.DecorationOptions[] = [];

    for (const variable of variables) {
      const range = new vscode.Range(
        variable.line - 1,
        variable.character - 1,
        variable.line - 1,
        variable.character - 1 + variable.name.length
      );

      const decoration: vscode.DecorationOptions = {
        range,
        hoverMessage: this.createDecorationHoverMessage(variable),
      };

      // For now, we'll mark all variables as potentially unused since we don't have reference tracking
      // In a real implementation, this would be based on actual reference analysis
      unusedVars.push(decoration);

      // We'll assume no variables are shadowed or global in this simplified version
    }

    // Apply decorations
    editor.setDecorations(this.unusedVariableDecoration, unusedVars);
    editor.setDecorations(this.shadowedVariableDecoration, shadowedVars);
    editor.setDecorations(this.globalVariableDecoration, globalVars);
  }

  private createDecorationHoverMessage(variable: any): vscode.MarkdownString {
    const message = new vscode.MarkdownString();
    message.appendMarkdown(`⚠️ **Variable**: \`${variable.name}\`\n\n`);
    message.appendMarkdown(`Type: ${variable.type}\n\n`);
    message.appendMarkdown(
      'Consider checking if this variable is used in your code.'
    );
    return message;
  }

  private isSupported(document: vscode.TextDocument): boolean {
    const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx'];
    const extension = document.fileName
      .substring(document.fileName.lastIndexOf('.'))
      .toLowerCase();
    return supportedExtensions.includes(extension);
  }

  dispose(): void {
    this.unusedVariableDecoration.dispose();
    this.shadowedVariableDecoration.dispose();
    this.globalVariableDecoration.dispose();
  }
}
