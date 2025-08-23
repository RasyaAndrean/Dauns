"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YamlParser = void 0;
class YamlParser {
    constructor() {
        this.language = 'yaml';
        this.fileExtensions = ['.yml', '.yaml'];
    }
    parseVariables(content, filePath) {
        const variables = [];
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
    inferYamlType(value) {
        if (!value || value === '')
            return 'null';
        if (value === 'true' || value === 'false')
            return 'boolean';
        if (/^\d+$/.test(value))
            return 'number';
        if (/^\d*\.\d+$/.test(value))
            return 'float';
        if (value.startsWith('[') && value.endsWith(']'))
            return 'array';
        if (value.startsWith('{') && value.endsWith('}'))
            return 'object';
        return 'string';
    }
    calculateYamlScope(indent) {
        const level = indent.length / 2; // Assuming 2 spaces per level
        return `level-${level}`;
    }
    parseImports(content) {
        // YAML doesn't have imports in the traditional sense
        return [];
    }
    getVariableReferences(content, variableName) {
        const references = [];
        const lines = content.split('\n');
        const regex = new RegExp(`\\b${this.escapeRegExp(variableName)}\\b`, 'g');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match;
            while ((match = regex.exec(line)) !== null) {
                const contextStart = Math.max(0, match.index - 20);
                const contextEnd = Math.min(line.length, match.index + variableName.length + 20);
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
    getSupportedRefactorings() {
        return ['rename'];
    }
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
exports.YamlParser = YamlParser;
//# sourceMappingURL=yamlParser.js.map