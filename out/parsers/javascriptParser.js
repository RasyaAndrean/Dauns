"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaScriptParser = void 0;
const vscode = __importStar(require("vscode"));
const variableScanner_1 = require("../variableScanner");
class JavaScriptParser {
    constructor() {
        this.language = 'javascript';
        this.fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
    }
    parseVariables(content, filePath) {
        // Create a mock TextDocument for our existing scanner
        const mockDocument = {
            getText: () => content,
            fileName: filePath,
            lineAt: (line) => ({
                text: content.split('\n')[line] || '',
            }),
            positionAt: (offset) => {
                const lines = content.substring(0, offset).split('\n');
                return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
            },
        };
        // Use existing scanner
        const variables = (0, variableScanner_1.scanVariablesInDocument)(mockDocument);
        // Convert to the new VariableInfo format
        return variables.map(variable => ({
            name: variable.name,
            type: variable.type,
            declarationType: variable.kind,
            line: variable.line,
            character: variable.character,
            filePath: filePath,
            scope: 'unknown',
            references: [],
        }));
    }
    parseImports(content) {
        const imports = [];
        // ES6 import patterns
        const es6ImportRegex = /import\s+(?:(?:{[^}]+}|\w+)\s+from\s+)?["'](.*?\.js)["']/g;
        let match;
        while ((match = es6ImportRegex.exec(content)) !== null) {
            imports.push({
                name: match[1],
                path: match[2] || match[1],
                line: content.substring(0, match.index).split('\n').length,
                character: match.index,
                type: 'import',
            });
        }
        // Require patterns
        const requireRegex = /require\s*\(\s*["'](.*?\.js)["']\s*\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push({
                name: match[1],
                path: match[1],
                line: content.substring(0, match.index).split('\n').length,
                character: match.index,
                type: 'require',
            });
        }
        return imports;
    }
    getVariableReferences(content, variableName) {
        const references = [];
        const regex = new RegExp(`\\b${variableName}\\b`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
            const lines = content.substring(0, match.index).split('\n');
            const line = lines.length;
            const character = lines[lines.length - 1].length + 1;
            // Get context around the reference
            const contextStart = Math.max(0, match.index - 20);
            const contextEnd = Math.min(content.length, match.index + variableName.length + 20);
            const context = content.substring(contextStart, contextEnd);
            references.push({
                line: line,
                character: character,
                context: context,
            });
        }
        return references;
    }
    getSupportedRefactorings() {
        return ['rename', 'extract', 'convert', 'inline'];
    }
}
exports.JavaScriptParser = JavaScriptParser;
//# sourceMappingURL=javascriptParser.js.map