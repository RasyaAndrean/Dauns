"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanVariablesInDocument = scanVariablesInDocument;
function scanVariablesInDocument(document) {
    var variables = [];
    var text = document.getText();
    // Regular expressions to match variable declarations
    // Updated to be more precise and avoid false positives
    var constRegex = /\bconst\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    var letRegex = /\blet\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    var varRegex = /\bvar\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    // Find const variables
    findVariables(constRegex, text, document, variables, 'const');
    // Find let variables
    findVariables(letRegex, text, document, variables, 'let');
    // Find var variables
    findVariables(varRegex, text, document, variables, 'var');
    return variables;
}
function findVariables(regex, text, document, variables, kind) {
    var match;
    while ((match = regex.exec(text)) !== null) {
        // Skip matches that might be part of other expressions
        var beforeMatch = match.index > 0 ? text.charAt(match.index - 1) : ' ';
        if (beforeMatch !== ' ' &&
            beforeMatch !== '\n' &&
            beforeMatch !== '\t' &&
            beforeMatch !== ';' &&
            beforeMatch !== '{') {
            continue;
        }
        var variableName = match[1];
        var offset = match.index + match[0].indexOf(variableName);
        var position = document.positionAt(offset);
        // Simple type inference based on assignment
        var type = inferType(text, match.index + match[0].length);
        variables.push({
            name: variableName,
            kind: kind,
            type: type,
            line: position.line + 1,
            character: position.character + 1,
        });
    }
}
function inferType(text, startIndex) {
    // Look for assignment (=) after the variable declaration
    var assignmentIndex = text.indexOf('=', startIndex);
    if (assignmentIndex === -1) {
        return 'unknown';
    }
    // Find the end of the line or statement
    var endIndex = Math.min(text.indexOf(';', assignmentIndex), text.indexOf('\n', assignmentIndex), text.length);
    if (endIndex === -1) {
        // If no semicolon or newline, use the rest of the text
        var sampleText = text.substring(assignmentIndex + 1).trim();
    }
    else {
        var sampleText = text.substring(assignmentIndex + 1, endIndex).trim();
    }
    // Remove any trailing comments
    var commentIndex = sampleText.indexOf('//');
    if (commentIndex !== -1) {
        sampleText = sampleText.substring(0, commentIndex).trim();
    }
    // Check for different types
    if (sampleText.startsWith('"') ||
        sampleText.startsWith("'") ||
        sampleText.startsWith('`')) {
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
    if (sampleText.startsWith('function') ||
        sampleText.startsWith('(') ||
        sampleText.includes('=>')) {
        return 'function';
    }
    if (sampleText.startsWith('new ')) {
        // Try to extract the constructor name
        var newMatch = sampleText.match(/new\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (newMatch) {
            return newMatch[1];
        }
        return 'instance';
    }
    return 'unknown';
}
