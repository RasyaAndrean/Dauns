import * as vscode from 'vscode';
import { VariableInfo } from '../parsers/types';

export class EnhancedVariableInspector implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | undefined> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);

    // In a real implementation, we would get variables from a more comprehensive source
    // For now, we'll simulate this with a placeholder
    const variable: VariableInfo | undefined = await this.findVariable(
      document,
      word
    );

    if (!variable) {
      return undefined;
    }

    const hoverContent = this.createEnhancedHoverContent(document, variable);
    return new vscode.Hover(hoverContent, wordRange);
  }

  private async findVariable(
    document: vscode.TextDocument,
    variableName: string
  ): Promise<VariableInfo | undefined> {
    // This is a simplified implementation
    // In a real extension, this would use a more sophisticated variable tracking system

    // For demonstration purposes, we'll create a mock variable
    // In practice, this would come from the actual variable analysis

    // Try to extract value from the document
    const text = document.getText();
    const valueMatch = text.match(
      new RegExp(`\\b${variableName}\\s*=\\s*([^;\\n]+)`)
    );
    const value = valueMatch ? valueMatch[1].trim() : undefined;

    // Simple type inference
    let type = 'unknown';
    if (value) {
      if (
        value.startsWith('"') ||
        value.startsWith("'") ||
        value.startsWith('`')
      ) {
        type = 'string';
      } else if (value === 'true' || value === 'false') {
        type = 'boolean';
      } else if (!isNaN(Number(value))) {
        type = 'number';
      } else if (value.startsWith('[')) {
        type = 'array';
      } else if (value.startsWith('{')) {
        type = 'object';
      } else if (value.startsWith('function') || value.includes('=>')) {
        type = 'function';
      }
    }

    // Find position of variable
    const varMatch = text.match(
      new RegExp(`\\b(let|const|var)\\s+${variableName}\\b`)
    );
    let line = 1,
      character = 1;
    if (varMatch && varMatch.index !== undefined) {
      const beforeMatch = text.substring(0, varMatch.index);
      const lines = beforeMatch.split('\n');
      line = lines.length;
      character = lines[lines.length - 1].length + 1;
    }

    return {
      name: variableName,
      type: type,
      declarationType: varMatch ? varMatch[1] : 'unknown',
      line: line,
      character: character,
      filePath: document.fileName,
      scope: 'local',
      value: value,
      references: [], // In a real implementation, this would be populated
    };
  }

  private createEnhancedHoverContent(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): vscode.MarkdownString {
    const content = new vscode.MarkdownString();
    content.isTrusted = true;

    // Variable header with icon
    content.appendMarkdown(
      `### ${this.getIconForType(variable.type)} ${variable.name}\n\n`
    );

    // Basic information
    content.appendMarkdown(`**Type:** \`${variable.type}\`\n\n`);
    content.appendMarkdown(
      `**Declaration:** \`${variable.declarationType}\`\n\n`
    );
    content.appendMarkdown(`**Scope:** \`${variable.scope}\`\n\n`);

    // Location information
    content.appendMarkdown(
      `**Location:** Line ${variable.line}, Column ${variable.character}\n\n`
    );

    // Value preview if available
    if (variable.value) {
      content.appendMarkdown(`**Value:**\n\n`);
      content.appendCodeblock(
        variable.value,
        this.getLanguageForType(variable.type)
      );

      // For objects and arrays, provide structure overview
      if (variable.type === 'object' || variable.type === 'array') {
        content.appendMarkdown(`\n**Structure Overview:**\n\n`);
        const structure = this.analyzeStructure(variable.value);
        content.appendMarkdown(structure);
      }
    }

    // Usage information
    content.appendMarkdown(
      `\n**References:** ${variable.references.length}\n\n`
    );

    // Quick actions with icons
    content.appendMarkdown(`---\n\n`);
    content.appendMarkdown(`#### Quick Actions\n\n`);

    content.appendMarkdown(
      `$(pencil) [Rename](command:dauns.renameVariable?${encodeURIComponent(
        JSON.stringify({ name: variable.name })
      )}) | ` +
        `$(search) [Find All References](command:dauns.findReferences?${encodeURIComponent(
          JSON.stringify({ name: variable.name })
        )}) | ` +
        `$(symbol-variable) [Extract Variable](command:dauns.extractVariable)`
    );

    // Additional actions based on type
    if (variable.type === 'function') {
      content.appendMarkdown(
        ` | $(debug-start) [Debug Function](command:dauns.debugFunction)`
      );
    }

    if (variable.declarationType === 'let') {
      content.appendMarkdown(
        ` | $(symbol-constant) [Convert to Const](command:dauns.convertToConst)`
      );
    }

    return content;
  }

  private getIconForType(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
        return '$(symbol-string)';
      case 'number':
        return '$(symbol-number)';
      case 'boolean':
        return '$(symbol-boolean)';
      case 'array':
        return '$(symbol-array)';
      case 'object':
        return '$(symbol-object)';
      case 'function':
        return '$(symbol-function)';
      default:
        return '$(symbol-variable)';
    }
  }

  private getLanguageForType(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
      case 'number':
      case 'boolean':
        return 'javascript';
      case 'array':
      case 'object':
        return 'json';
      case 'function':
        return 'javascript';
      default:
        return 'javascript';
    }
  }

  private analyzeStructure(value: string): string {
    try {
      // For objects
      if (value.startsWith('{')) {
        const obj = JSON.parse(value);
        return this.formatObjectStructure(obj, 0);
      }

      // For arrays
      if (value.startsWith('[')) {
        const arr = JSON.parse(value);
        return this.formatArrayStructure(arr, 0);
      }
    } catch (e) {
      // If parsing fails, return a simplified view
      return this.getSimplifiedStructure(value);
    }

    return '_Unable to analyze structure_';
  }

  private formatObjectStructure(obj: any, depth: number): string {
    if (depth > 3) {
      return '_..._';
    } // Limit depth to prevent too much nesting

    let result = '';
    const indent = '  '.repeat(depth);

    const keys = Object.keys(obj);
    for (let i = 0; i < Math.min(keys.length, 5); i++) {
      // Limit to first 5 properties
      const key = keys[i];
      const value = obj[key];
      const valueType = typeof value;

      if (valueType === 'object' && value !== null) {
        if (Array.isArray(value)) {
          result += `${indent}- ${key}: [${value.length} items]\n`;
        } else {
          result += `${indent}- ${key}: {${
            Object.keys(value).length
          } properties}\n`;
          result += this.formatObjectStructure(value, depth + 1);
        }
      } else {
        result += `${indent}- ${key}: ${valueType}\n`;
      }
    }

    if (keys.length > 5) {
      result += `${indent}... and ${keys.length - 5} more properties\n`;
    }

    return result;
  }

  private formatArrayStructure(arr: any[], depth: number): string {
    if (depth > 3) {
      return '_..._';
    } // Limit depth to prevent too much nesting

    let result = '';
    const indent = '  '.repeat(depth);

    for (let i = 0; i < Math.min(arr.length, 3); i++) {
      // Limit to first 3 items
      const item = arr[i];
      const itemType = typeof item;

      if (itemType === 'object' && item !== null) {
        if (Array.isArray(item)) {
          result += `${indent}[${i}]: [${item.length} items]\n`;
        } else {
          result += `${indent}[${i}]: {${
            Object.keys(item).length
          } properties}\n`;
        }
      } else {
        result += `${indent}[${i}]: ${itemType}\n`;
      }
    }

    if (arr.length > 3) {
      result += `${indent}... and ${arr.length - 3} more items\n`;
    }

    return result;
  }

  private getSimplifiedStructure(value: string): string {
    // Remove outer brackets/braces for a cleaner view
    let cleanValue = value.trim();
    if (cleanValue.startsWith('{') && cleanValue.endsWith('}')) {
      cleanValue = cleanValue.substring(1, cleanValue.length - 1);
    } else if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
      cleanValue = cleanValue.substring(1, cleanValue.length - 1);
    }

    // Truncate if too long
    if (cleanValue.length > 100) {
      cleanValue = cleanValue.substring(0, 100) + '...';
    }

    return `\`\`\`javascript\n${cleanValue}\n\`\`\``;
  }
}
