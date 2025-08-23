import * as vscode from 'vscode';

export interface VariableInfo {
  name: string;
  kind: string; // let, const, var
  type: string; // inferred type
  line: number;
  character: number;
}

export function scanVariablesInDocument(
  document: vscode.TextDocument
): VariableInfo[] {
  const variables: VariableInfo[] = [];
  const text = document.getText();

  // Regular expressions to match variable declarations
  // Updated to be more precise and avoid false positives
  const constRegex = /\bconst\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const letRegex = /\blet\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const varRegex = /\bvar\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;

  // Find const variables
  findVariables(constRegex, text, document, variables, 'const');

  // Find let variables
  findVariables(letRegex, text, document, variables, 'let');

  // Find var variables
  findVariables(varRegex, text, document, variables, 'var');

  return variables;
}

function findVariables(
  regex: RegExp,
  text: string,
  document: vscode.TextDocument,
  variables: VariableInfo[],
  kind: string
) {
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Skip matches that might be part of other expressions
    const beforeMatch = match.index > 0 ? text.charAt(match.index - 1) : ' ';
    if (
      beforeMatch !== ' ' &&
      beforeMatch !== '\n' &&
      beforeMatch !== '\t' &&
      beforeMatch !== ';' &&
      beforeMatch !== '{'
    ) {
      continue;
    }

    const variableName = match[1];
    const offset = match.index + match[0].indexOf(variableName);
    const position = document.positionAt(offset);

    // Simple type inference based on assignment
    const type = inferType(text, match.index + match[0].length);

    variables.push({
      name: variableName,
      kind: kind,
      type: type,
      line: position.line + 1,
      character: position.character + 1,
    });
  }
}

function inferType(text: string, startIndex: number): string {
  // Look for assignment (=) after the variable declaration
  const assignmentIndex = text.indexOf('=', startIndex);
  if (assignmentIndex === -1) {
    return 'unknown';
  }

  // Find the end of the line or statement
  const endIndex = Math.min(
    text.indexOf(';', assignmentIndex),
    text.indexOf('\n', assignmentIndex),
    text.length
  );

  if (endIndex === -1) {
    // If no semicolon or newline, use the rest of the text
    var sampleText = text.substring(assignmentIndex + 1).trim();
  } else {
    var sampleText = text.substring(assignmentIndex + 1, endIndex).trim();
  }

  // Remove any trailing comments
  const commentIndex = sampleText.indexOf('//');
  if (commentIndex !== -1) {
    sampleText = sampleText.substring(0, commentIndex).trim();
  }

  // Check for different types
  if (
    sampleText.startsWith('"') ||
    sampleText.startsWith("'") ||
    sampleText.startsWith('`')
  ) {
    return 'string';
  }

  if (sampleText.startsWith('[')) {
    return 'array';
  }

  if (sampleText.startsWith('{')) {
    return 'object';
  }

  if (sampleText === 'true' || sampleText === 'false') {
    return 'boolean';
  }

  if (sampleText === 'null') {
    return 'null';
  }

  if (sampleText === 'undefined') {
    return 'undefined';
  }

  if (!isNaN(Number(sampleText)) && sampleText.trim() !== '') {
    return 'number';
  }

  if (
    sampleText.startsWith('function') ||
    sampleText.startsWith('(') ||
    sampleText.includes('=>')
  ) {
    return 'function';
  }

  if (sampleText.startsWith('new ')) {
    // Try to extract the constructor name
    const newMatch = sampleText.match(/new\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (newMatch) {
      return newMatch[1];
    }
    return 'instance';
  }

  return 'unknown';
}
