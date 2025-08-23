export interface VariableInfo {
  name: string;
  type: string;
  declarationType: string;
  line: number;
  character: number;
  filePath: string;
  scope: string;
  value?: string;
  references: ReferenceInfo[];
}

export interface ImportInfo {
  name: string;
  path: string;
  line: number;
  character: number;
  type: 'import' | 'require' | 'from';
}

export interface ReferenceInfo {
  line: number;
  character: number;
  context: string;
}

export type RefactoringType =
  | 'rename'
  | 'extract'
  | 'convert'
  | 'inline'
  | 'move'
  | 'split';

// Base Parser Interface
export interface ILanguageParser {
  language: string;
  fileExtensions: string[];
  parseVariables(content: string, filePath: string): VariableInfo[];
  parseImports(content: string): ImportInfo[];
  getVariableReferences(content: string, variableName: string): ReferenceInfo[];
  getSupportedRefactorings(): RefactoringType[];
}
