import * as vscode from 'vscode';
import { scanVariablesInDocument } from '../variableScanner';

export class MinimapProvider {
  private minimapDecoration: vscode.TextEditorDecorationType;

  constructor() {
    this.minimapDecoration = vscode.window.createTextEditorDecorationType({
      overviewRulerColor: new vscode.ThemeColor('editorInfo.foreground'),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    });
  }

  async updateMinimap(editor: vscode.TextEditor): Promise<void> {
    if (!editor || !this.isSupported(editor.document)) return;

    const variables: any[] = scanVariablesInDocument(editor.document);
    const decorations: vscode.DecorationOptions[] = [];

    for (const variable of variables) {
      // Add variable declaration to minimap
      const range = new vscode.Range(
        variable.line - 1,
        variable.character - 1,
        variable.line - 1,
        variable.character - 1 + variable.name.length
      );

      decorations.push({
        range,
        hoverMessage: `Variable: ${variable.name} (${variable.type})`,
      });
    }

    editor.setDecorations(this.minimapDecoration, decorations);
  }

  private isSupported(document: vscode.TextDocument): boolean {
    const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx'];
    const extension = document.fileName
      .substring(document.fileName.lastIndexOf('.'))
      .toLowerCase();
    return supportedExtensions.includes(extension);
  }

  dispose(): void {
    this.minimapDecoration.dispose();
  }
}
