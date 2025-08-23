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
exports.VariableDecorationProvider = void 0;
const vscode = __importStar(require("vscode"));
const variableScanner_1 = require("../variableScanner");
class VariableDecorationProvider {
    constructor() {
        this.createDecorationTypes();
    }
    createDecorationTypes() {
        this.unusedVariableDecoration =
            vscode.window.createTextEditorDecorationType({
                textDecoration: 'line-through',
                color: new vscode.ThemeColor('editorWarning.foreground'),
                backgroundColor: new vscode.ThemeColor('editorWarning.background'),
            });
        this.shadowedVariableDecoration =
            vscode.window.createTextEditorDecorationType({
                border: '1px solid',
                borderColor: new vscode.ThemeColor('editorError.foreground'),
                backgroundColor: new vscode.ThemeColor('editorError.background'),
            });
        this.globalVariableDecoration =
            vscode.window.createTextEditorDecorationType({
                fontWeight: 'bold',
                color: new vscode.ThemeColor('editorInfo.foreground'),
            });
    }
    async updateDecorations(editor) {
        if (!editor || !this.isSupported(editor.document))
            return;
        const variables = (0, variableScanner_1.scanVariablesInDocument)(editor.document);
        const unusedVars = [];
        const shadowedVars = [];
        const globalVars = [];
        for (const variable of variables) {
            const range = new vscode.Range(variable.line - 1, variable.character - 1, variable.line - 1, variable.character - 1 + variable.name.length);
            const decoration = {
                range,
                hoverMessage: this.createDecorationHoverMessage(variable),
            };
            // For now, we'll mark all variables as potentially unused since we don't have reference tracking
            // In a real implementation, this would be based on actual reference analysis
            unusedVars.push(decoration);
            // We'll assume no variables are shadowed or global in this simplified version
        }
        // Apply decorations
        editor.setDecorations(this.unusedVariableDecoration, unusedVars);
        editor.setDecorations(this.shadowedVariableDecoration, shadowedVars);
        editor.setDecorations(this.globalVariableDecoration, globalVars);
    }
    createDecorationHoverMessage(variable) {
        const message = new vscode.MarkdownString();
        message.appendMarkdown(`⚠️ **Variable**: \`${variable.name}\`\n\n`);
        message.appendMarkdown(`Type: ${variable.type}\n\n`);
        message.appendMarkdown('Consider checking if this variable is used in your code.');
        return message;
    }
    isSupported(document) {
        const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx'];
        const extension = document.fileName
            .substring(document.fileName.lastIndexOf('.'))
            .toLowerCase();
        return supportedExtensions.includes(extension);
    }
    dispose() {
        this.unusedVariableDecoration.dispose();
        this.shadowedVariableDecoration.dispose();
        this.globalVariableDecoration.dispose();
    }
}
exports.VariableDecorationProvider = VariableDecorationProvider;
//# sourceMappingURL=variableDecorationProvider.js.map