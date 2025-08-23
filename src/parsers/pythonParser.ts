import {
  ILanguageParser,
  ImportInfo,
  RefactoringType,
  ReferenceInfo,
  VariableInfo,
} from './types';

export class PythonParser implements ILanguageParser {
  language = 'python';
  fileExtensions = ['.py', '.pyw', '.pyx'];

  parseVariables(content: string, filePath: string): VariableInfo[] {
    const variables: VariableInfo[] = [];

    // Regular expressions untuk Python
    const patterns = [
      // Variable assignments: x = value
      /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/gm,
      // Function parameters: def func(param1, param2):
      /def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\):/g,
      // Class attributes: self.attribute = value
      /self\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/gm,
      // For loop variables: for item in items:
      /for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+):/g,
      // Global declarations: global variable_name
      /global\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      // Nonlocal declarations: nonlocal variable_name
      /nonlocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    ];

    // Implement Python-specific variable detection
    return this.extractVariables(content, patterns, filePath);
  }

  private extractVariables(
    content: string,
    patterns: RegExp[],
    filePath: string
  ): VariableInfo[] {
    const variables: VariableInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of patterns) {
        // Reset the pattern to ensure we get all matches
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          // Different patterns have different capture groups
          let varName, value, indent;
          if (
            pattern.source.includes('=') &&
            !pattern.source.includes('self\\.')
          ) {
            // Assignment pattern
            [, indent, varName, value] = match;
          } else if (pattern.source.includes('def\\s+')) {
            // Function pattern
            [, varName] = match;
            value = 'function';
          } else if (pattern.source.includes('self\\.')) {
            // Class attribute pattern
            [, varName, value] = match;
          } else if (pattern.source.includes('for\\s+')) {
            // For loop pattern
            [, varName] = match;
            value = 'loop variable';
          } else if (pattern.source.includes('global\\s+')) {
            // Global pattern
            [, varName] = match;
            value = 'global';
          } else if (pattern.source.includes('nonlocal\\s+')) {
            // Nonlocal pattern
            [, varName] = match;
            value = 'nonlocal';
          }

          if (varName) {
            variables.push({
              name: varName,
              type: this.inferPythonType(value || ''),
              declarationType: 'python-variable',
              line: i + 1,
              character: match.index,
              filePath: filePath,
              scope: 'unknown',
              value: value,
              references: [],
            });
          }
        }
      }
    }

    return variables;
  }

  private inferPythonType(value: string): string {
    // Python type inference
    if (/^["'].*["']$/.test(value.trim())) return 'str';
    if (/^\d+$/.test(value.trim())) return 'int';
    if (/^\d*\.\d+$/.test(value.trim())) return 'float';
    if (/^(True|False)$/.test(value.trim())) return 'bool';
    if (/^\[.*\]$/.test(value.trim())) return 'list';
    if (/^\{.*\}$/.test(value.trim())) return 'dict';
    if (/^\(.*\)$/.test(value.trim())) return 'tuple';
    return 'Any';
  }

  parseImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const lines = content.split('\n');

    // Python import patterns
    const importRegex = /^(\s*)import\s+(.+)$/;
    const fromImportRegex = /^(\s*)from\s+(.+)\s+import\s+(.+)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      let match = importRegex.exec(line);
      if (match) {
        const [, , modules] = match;
        const moduleList = modules.split(',').map(m => m.trim());

        for (const module of moduleList) {
          const parts = module.split(/\s+as\s+/);
          const moduleName = parts[0];
          const alias = parts[1] || moduleName;

          imports.push({
            name: alias,
            path: moduleName,
            line: i + 1,
            character: line.indexOf(moduleName),
            type: 'import',
          });
        }
      }

      match = fromImportRegex.exec(line);
      if (match) {
        const [, , module, items] = match;
        const itemList = items.split(',').map(item => item.trim());

        for (const item of itemList) {
          const parts = item.split(/\s+as\s+/);
          const itemName = parts[0];
          const alias = parts[1] || itemName;

          imports.push({
            name: alias,
            path: `${module}.${itemName}`,
            line: i + 1,
            character: line.indexOf(itemName),
            type: 'from',
          });
        }
      }
    }

    return imports;
  }

  getVariableReferences(
    content: string,
    variableName: string
  ): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];
    const lines = content.split('\n');

    const regex = new RegExp(`\\b${this.escapeRegExp(variableName)}\\b`, 'g');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = regex.exec(line)) !== null) {
        const contextStart = Math.max(0, match.index - 20);
        const contextEnd = Math.min(
          line.length,
          match.index + variableName.length + 20
        );
        const context = line.substring(contextStart, contextEnd);

        references.push({
          line: i + 1,
          character: match.index,
          context: context,
        });
      }
    }

    return references;
  }

  getSupportedRefactorings(): RefactoringType[] {
    return ['rename', 'extract', 'convert', 'inline'];
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
