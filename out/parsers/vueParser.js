"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueParser = void 0;
const javascriptParser_1 = require("./javascriptParser");
class VueParser {
    constructor() {
        this.language = 'vue';
        this.fileExtensions = ['.vue'];
    }
    parseVariables(content, filePath) {
        const variables = [];
        // Parse Vue.js components
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
        if (scriptMatch) {
            // Parse JavaScript/TypeScript in <script> section
            const jsParser = new javascriptParser_1.JavaScriptParser();
            variables.push(...jsParser.parseVariables(scriptMatch[1], filePath));
        }
        if (templateMatch) {
            // Parse Vue template variables
            variables.push(...this.parseTemplateVariables(templateMatch[1], filePath));
        }
        return variables;
    }
    parseTemplateVariables(template, filePath) {
        const variables = [];
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
    extractTemplateVariables(template, patterns, filePath) {
        const variables = [];
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
    parseImports(content) {
        const imports = [];
        // Parse imports in <script> section
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (scriptMatch) {
            const jsParser = new javascriptParser_1.JavaScriptParser();
            imports.push(...jsParser.parseImports(scriptMatch[1]));
        }
        return imports;
    }
    getVariableReferences(content, variableName) {
        const references = [];
        // Check script section
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (scriptMatch) {
            const jsParser = new javascriptParser_1.JavaScriptParser();
            const scriptReferences = jsParser.getVariableReferences(scriptMatch[1], variableName);
            references.push(...scriptReferences);
        }
        // Check template section
        const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
        if (templateMatch) {
            const templateReferences = this.getTemplateVariableReferences(templateMatch[1], variableName);
            references.push(...templateReferences);
        }
        return references;
    }
    getTemplateVariableReferences(template, variableName) {
        const references = [];
        const lines = template.split('\n');
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
        return ['rename', 'extract'];
    }
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
exports.VueParser = VueParser;
//# sourceMappingURL=vueParser.js.map