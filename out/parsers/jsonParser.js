"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonParser = void 0;
class JsonParser {
    constructor() {
        this.language = 'json';
        this.fileExtensions = ['.json', '.jsonc'];
    }
    parseVariables(content, filePath) {
        const variables = [];
        try {
            const jsonObject = JSON.parse(content);
            this.traverseJsonObject(jsonObject, '', variables, filePath);
        }
        catch (error) {
            // Handle invalid JSON
            console.error('Invalid JSON:', error);
        }
        return variables;
    }
    traverseJsonObject(obj, path, variables, filePath) {
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
    getJsonType(value) {
        if (value === null)
            return 'null';
        if (Array.isArray(value))
            return 'array';
        return typeof value;
    }
    parseImports(content) {
        // JSON doesn't have imports in the traditional sense
        return [];
    }
    getVariableReferences(content, variableName) {
        const references = [];
        return references;
    }
    getSupportedRefactorings() {
        return ['rename'];
    }
}
exports.JsonParser = JsonParser;
//# sourceMappingURL=jsonParser.js.map