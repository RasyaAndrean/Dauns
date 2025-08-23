import {
  ILanguageParser,
  ImportInfo,
  RefactoringType,
  ReferenceInfo,
  VariableInfo,
} from './types';

export class JsonParser implements ILanguageParser {
  language = 'json';
  fileExtensions = ['.json', '.jsonc'];

  parseVariables(content: string, filePath: string): VariableInfo[] {
    const variables: VariableInfo[] = [];

    try {
      const jsonObject = JSON.parse(content);
      this.traverseJsonObject(jsonObject, '', variables, filePath);
    } catch (error) {
      // Handle invalid JSON
      console.error('Invalid JSON:', error);
    }

    return variables;
  }

  private traverseJsonObject(
    obj: any,
    path: string,
    variables: VariableInfo[],
    filePath: string
  ): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        variables.push({
          name: key,
          type: this.getJsonType(value),
          declarationType: 'property',
          line: 0, // JSON doesn't have traditional line numbers
          character: 0,
          filePath,
          scope: path || 'root',
          value: typeof value === 'string' ? value : JSON.stringify(value),
          references: [],
        });

        if (typeof value === 'object') {
          this.traverseJsonObject(value, currentPath, variables, filePath);
        }
      }
    }
  }

  private getJsonType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  parseImports(content: string): ImportInfo[] {
    // JSON doesn't have imports in the traditional sense
    return [];
  }

  getVariableReferences(
    content: string,
    variableName: string
  ): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];
    return references;
  }

  getSupportedRefactorings(): RefactoringType[] {
    return ['rename'];
  }
}
