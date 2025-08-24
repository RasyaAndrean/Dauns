import * as vscode from 'vscode';
import { VariableInfo } from '../parsers/types';

export class EnhancedMinimapProvider {
  private decorationTypes: Map<string, vscode.TextEditorDecorationType> =
    new Map();
  private unusedDecoration: vscode.TextEditorDecorationType;
  private shadowedDecoration: vscode.TextEditorDecorationType;
  private globalDecoration: vscode.TextEditorDecorationType;

  constructor() {
    // Create decoration types for different variable types
    this.decorationTypes.set('string', this.createDecorationType('#4EC9B0'));
    this.decorationTypes.set('number', this.createDecorationType('#B5CEA8'));
    this.decorationTypes.set('boolean', this.createDecorationType('#569CD6'));
    this.decorationTypes.set('array', this.createDecorationType('#C586C0'));
    this.decorationTypes.set('object', this.createDecorationType('#4FC1FF'));
    this.decorationTypes.set('function', this.createDecorationType('#DCDCAA'));
    this.decorationTypes.set('unknown', this.createDecorationType('#9CDCFE'));

    // Create special decoration types
    this.unusedDecoration = this.createDecorationType(
      '#FF6B6B',
      'editorUnnecessaryCode.opacity'
    );
    this.shadowedDecoration = this.createDecorationType('#FFA500');
    this.globalDecoration = this.createDecorationType('#FFD700');
  }

  private createDecorationType(
    color: string,
    opacity?: string
  ): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      overviewRulerColor: color,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      light: {
        overviewRulerColor: color,
      },
      dark: {
        overviewRulerColor: color,
      },
      opacity: opacity,
    });
  }

  async updateMinimap(
    editor: vscode.TextEditor,
    variables: VariableInfo[]
  ): Promise<void> {
    if (!editor) {
      return;
    }

    // Clear all decorations first
    this.clearAllDecorations(editor);

    // Group variables by type for visualization
    const variablesByType: Map<string, vscode.DecorationOptions[]> = new Map();

    // Special decorations
    const unusedDecorations: vscode.DecorationOptions[] = [];
    const shadowedDecorations: vscode.DecorationOptions[] = [];
    const globalDecorations: vscode.DecorationOptions[] = [];

    for (const variable of variables) {
      // Create decoration for this variable
      const range = new vscode.Range(
        variable.line - 1,
        variable.character - 1,
        variable.line - 1,
        variable.character - 1 + variable.name.length
      );

      const decoration: vscode.DecorationOptions = {
        range,
        hoverMessage: this.createHoverMessage(variable),
      };

      // Add to unused decorations if applicable
      if (variable.references.length === 0) {
        unusedDecorations.push(decoration);
        continue; // Skip adding to type decorations for unused variables
      }

      // Add to shadowed decorations if applicable
      // Note: In a real implementation, we would check for actual shadowing
      // For now, we'll use a placeholder check
      if (variable.scope === 'shadowed') {
        shadowedDecorations.push(decoration);
        continue; // Skip adding to type decorations for shadowed variables
      }

      // Add to global decorations if applicable
      if (variable.scope === 'global') {
        globalDecorations.push(decoration);
      }

      // Add to type-based decorations
      const type = variable.type.toLowerCase() || 'unknown';
      if (!variablesByType.has(type)) {
        variablesByType.set(type, []);
      }
      variablesByType.get(type)!.push(decoration);
    }

    // Apply decorations
    variablesByType.forEach((decorations, type) => {
      const decorationType =
        this.decorationTypes.get(type) || this.decorationTypes.get('unknown')!;
      editor.setDecorations(decorationType, decorations);
    });

    // Apply special decorations
    editor.setDecorations(this.unusedDecoration, unusedDecorations);
    editor.setDecorations(this.shadowedDecoration, shadowedDecorations);
    editor.setDecorations(this.globalDecoration, globalDecorations);
  }

  private createHoverMessage(variable: VariableInfo): vscode.MarkdownString {
    const message = new vscode.MarkdownString();
    message.isTrusted = true;

    message.appendMarkdown(`**${variable.name}**\n\n`);
    message.appendMarkdown(`**Type:** \`${variable.type}\`\n\n`);
    message.appendMarkdown(
      `**Declaration:** \`${variable.declarationType}\`\n\n`
    );
    message.appendMarkdown(`**Scope:** \`${variable.scope}\`\n\n`);
    message.appendMarkdown(`**References:** ${variable.references.length}\n\n`);

    if (variable.value) {
      message.appendMarkdown(`**Value:** \`${variable.value}\`\n\n`);
    }

    return message;
  }

  private clearAllDecorations(editor: vscode.TextEditor): void {
    // Clear type-based decorations
    this.decorationTypes.forEach(decorationType => {
      editor.setDecorations(decorationType, []);
    });

    // Clear special decorations
    editor.setDecorations(this.unusedDecoration, []);
    editor.setDecorations(this.shadowedDecoration, []);
    editor.setDecorations(this.globalDecoration, []);
  }

  dispose(): void {
    // Dispose all decoration types
    this.decorationTypes.forEach(decorationType => {
      decorationType.dispose();
    });

    this.unusedDecoration.dispose();
    this.shadowedDecoration.dispose();
    this.globalDecoration.dispose();
  }

  /**
   * Updates the color theme for decorations
   */
  updateTheme(): void {
    // Dispose existing decorations
    this.dispose();

    // Recreate with updated theme
    this.constructor();
  }

  /**
   * Gets color for a variable type
   * @param type The variable type
   * @returns The color for that type
   */
  getColorForType(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
        return '#4EC9B0';
      case 'number':
        return '#B5CEA8';
      case 'boolean':
        return '#569CD6';
      case 'array':
        return '#C586C0';
      case 'object':
        return '#4FC1FF';
      case 'function':
        return '#DCDCAA';
      default:
        return '#9CDCFE';
    }
  }

  /**
   * Shows a legend for the minimap colors
   */
  async showLegend(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'minimapLegend',
      'DAUNS Minimap Legend',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DAUNS Minimap Legend</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
          }
          h2 {
            color: var(--vscode-editorWidget-border);
            border-bottom: 1px solid var(--vscode-editorWidget-border);
            padding-bottom: 5px;
          }
          h3 {
            color: var(--vscode-editorWidget-border);
          }
          ul {
            list-style-type: none;
            padding-left: 0;
          }
          li {
            margin: 10px 0;
            display: flex;
            align-items: center;
          }
          .color-box {
            width: 15px;
            height: 15px;
            display: inline-block;
            margin-right: 10px;
            border: 1px solid var(--vscode-editorWidget-border);
          }
        </style>
      </head>
      <body>
        <h2>DAUNS Minimap Legend</h2>

        <h3>Variable Types:</h3>
        <ul>
          <li><span class="color-box" style="background-color: #4EC9B0;"></span> <strong>String</strong> - String variables</li>
          <li><span class="color-box" style="background-color: #B5CEA8;"></span> <strong>Number</strong> - Number variables</li>
          <li><span class="color-box" style="background-color: #569CD6;"></span> <strong>Boolean</strong> - Boolean variables</li>
          <li><span class="color-box" style="background-color: #C586C0;"></span> <strong>Array</strong> - Array variables</li>
          <li><span class="color-box" style="background-color: #4FC1FF;"></span> <strong>Object</strong> - Object variables</li>
          <li><span class="color-box" style="background-color: #DCDCAA;"></span> <strong>Function</strong> - Function variables</li>
          <li><span class="color-box" style="background-color: #9CDCFE;"></span> <strong>Unknown</strong> - Variables with unknown types</li>
        </ul>

        <h3>Special Indicators:</h3>
        <ul>
          <li><span class="color-box" style="background-color: #FF6B6B;"></span> <strong>Unused</strong> - Variables that are declared but never used</li>
          <li><span class="color-box" style="background-color: #FFA500;"></span> <strong>Shadowed</strong> - Variables that shadow another variable in outer scope</li>
          <li><span class="color-box" style="background-color: #FFD700;"></span> <strong>Global</strong> - Global variables</li>
        </ul>

        <h3>Usage:</h3>
        <p>The minimap indicators appear in the right sidebar of the editor. Hover over them to see variable details.</p>
      </body>
      </html>
    `;
  }
}
