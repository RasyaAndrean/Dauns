import * as vscode from 'vscode';
import { scanVariablesInDocument } from '../variableScanner';
import {
  ILanguageParser,
  ImportInfo,
  RefactoringType,
  ReferenceInfo,
  VariableInfo,
} from './types';

export class JavaScriptParser implements ILanguageParser {
  language = 'javascript';
  fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

  parseVariables(content: string, filePath: string): VariableInfo[] {
    // Create a mock TextDocument for our existing scanner
    const mockDocument = {
      getText: () => content,
      fileName: filePath,
      lineAt: (line: number) => ({
        text: content.split('\n')[line] || '',
      }),
      positionAt: (offset: number) => {
        const lines = content.substring(0, offset).split('\n');
        return new vscode.Position(
          lines.length - 1,
          lines[lines.length - 1].length
        );
      },
    } as unknown as vscode.TextDocument;

    // Use existing scanner
    const variables = scanVariablesInDocument(mockDocument);

    // Convert to the new VariableInfo format
    return variables.map(variable => ({
      name: variable.name,
      type: variable.type,
      declarationType: variable.kind,
      line: variable.line,
      character: variable.character,
      filePath: filePath,
      scope: 'unknown',
      references: [],
    }));
  }

  parseImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];

    // ES6 import patterns
    const es6ImportRegex =
      /import\s+(?:(?:{[^}]+}|\w+)\s+from\s+)?["'](.*?\.js)["']/g;
    let match;

    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push({
        name: match[1],
        path: match[2] || match[1],
        line: content.substring(0, match.index).split('\n').length,
        character: match.index,
        type: 'import',
      });
    }

    // Require patterns
    const requireRegex = /require\s*\(\s*["'](.*?\.js)["']\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        name: match[1],
        path: match[1],
        line: content.substring(0, match.index).split('\n').length,
        character: match.index,
        type: 'require',
      });
    }

    return imports;
  }

  getVariableReferences(
    content: string,
    variableName: string
  ): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];
    const regex = new RegExp(`\\b${variableName}\\b`, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const line = lines.length;
      const character = lines[lines.length - 1].length + 1;

      // Get context around the reference
      const contextStart = Math.max(0, match.index - 20);
      const contextEnd = Math.min(
        content.length,
        match.index + variableName.length + 20
      );
      const context = content.substring(contextStart, contextEnd);

      references.push({
        line: line,
        character: character,
        context: context,
      });
    }

    return references;
  }

  getSupportedRefactorings(): RefactoringType[] {
    return ['rename', 'extract', 'convert', 'inline'];
  }
}
