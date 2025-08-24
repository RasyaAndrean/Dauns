import {
  ILanguageParser,
  ImportInfo,
  RefactoringType,
  ReferenceInfo,
  VariableInfo,
} from './types';

export class YamlParser implements ILanguageParser {
  language = 'yaml';
  fileExtensions = ['.yml', '.yaml'];

  parseVariables(content: string, filePath: string): VariableInfo[] {
    const variables: VariableInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)$/);

      if (match) {
        const [, indent, key, value] = match;
        variables.push({
          name: key,
          type: this.inferYamlType(value.trim()),
          declarationType: 'property',
          line: i,
          character: match.index || 0,
          filePath,
          scope: this.calculateYamlScope(indent),
          value: value.trim(),
          references: [],
        });
      }
    }

    return variables;
  }

  private inferYamlType(value: string): string {
    if (!value || value === '') {
      return 'null';
    }
    if (value === 'true' || value === 'false') {
      return 'boolean';
    }
    if (/^\d+$/.test(value)) {
      return 'number';
    }
    if (/^\d*\.\d+$/.test(value)) {
      return 'float';
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      return 'array';
    }
    if (value.startsWith('{') && value.endsWith('}')) {
      return 'object';
    }
    return 'string';
  }

  private calculateYamlScope(indent: string): string {
    const level = indent.length / 2; // Assuming 2 spaces per level
    return `level-${level}`;
  }

  parseImports(): ImportInfo[] {
    // YAML doesn't have imports in the traditional sense
    return [];
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
    return ['rename'];
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
