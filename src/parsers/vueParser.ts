import { JavaScriptParser } from './javascriptParser';
import {
  ILanguageParser,
  ImportInfo,
  RefactoringType,
  ReferenceInfo,
  VariableInfo,
} from './types';

export class VueParser implements ILanguageParser {
  language = 'vue';
  fileExtensions = ['.vue'];

  parseVariables(content: string, filePath: string): VariableInfo[] {
    const variables: VariableInfo[] = [];

    // Parse Vue.js components
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const templateMatch = content.match(
      /<template[^>]*>([\s\S]*?)<\/template>/i
    );

    if (scriptMatch) {
      // Parse JavaScript/TypeScript in <script> section
      const jsParser = new JavaScriptParser();
      variables.push(...jsParser.parseVariables(scriptMatch[1], filePath));
    }

    if (templateMatch) {
      // Parse Vue template variables
      variables.push(
        ...this.parseTemplateVariables(templateMatch[1], filePath)
      );
    }

    return variables;
  }

  private parseTemplateVariables(
    template: string,
    filePath: string
  ): VariableInfo[] {
    const variables: VariableInfo[] = [];

    // Vue template patterns
    const patterns = [
      // v-for directives: v-for="item in items"
      /v-for="([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([^"]+)"/g,
      // v-model: v-model="variableName"
      /v-model="([^"]+)"/g,
      // Mustache interpolations: {{ variableName }}
      /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g,
      // v-bind: :prop="variable"
      /:[\w-]+="\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*"/g,
    ];

    return this.extractTemplateVariables(template, patterns, filePath);
  }

  private extractTemplateVariables(
    template: string,
    patterns: RegExp[],
    filePath: string
  ): VariableInfo[] {
    const variables: VariableInfo[] = [];
    const lines = template.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const pattern of patterns) {
        // Reset the pattern to ensure we get all matches
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const varName = match[1];
          if (varName) {
            variables.push({
              name: varName,
              type: 'any',
              declarationType: 'vue-template-variable',
              line: lineNum,
              character: match.index,
              filePath: filePath,
              scope: 'template',
              value: varName,
              references: [],
            });
          }
        }
      }
    }

    return variables;
  }

  parseImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];

    // Parse imports in <script> section
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch) {
      const jsParser = new JavaScriptParser();
      imports.push(...jsParser.parseImports(scriptMatch[1]));
    }

    return imports;
  }

  getVariableReferences(
    content: string,
    variableName: string
  ): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    // Check script section
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch) {
      const jsParser = new JavaScriptParser();
      const scriptReferences = jsParser.getVariableReferences(
        scriptMatch[1],
        variableName
      );
      references.push(...scriptReferences);
    }

    // Check template section
    const templateMatch = content.match(
      /<template[^>]*>([\s\S]*?)<\/template>/i
    );
    if (templateMatch) {
      const templateReferences = this.getTemplateVariableReferences(
        templateMatch[1],
        variableName
      );
      references.push(...templateReferences);
    }

    return references;
  }

  private getTemplateVariableReferences(
    template: string,
    variableName: string
  ): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];
    const lines = template.split('\n');

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
    return ['rename', 'extract'];
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
