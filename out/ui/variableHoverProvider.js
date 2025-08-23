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
exports.VariableHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const variableScanner_1 = require("../variableScanner");
class VariableHoverProvider {
    async provideHover(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange)
            return undefined;
        const word = document.getText(wordRange);
        const variables = (0, variableScanner_1.scanVariablesInDocument)(document);
        const variable = variables.find((v) => v.name === word);
        if (!variable)
            return undefined;
        const hoverContent = this.createHoverContent(variable);
        return new vscode.Hover(hoverContent, wordRange);
    }
    createHoverContent(variable) {
        const content = new vscode.MarkdownString();
        content.isTrusted = true;
        // Variable header
        content.appendMarkdown(`**${variable.name}** \`${variable.type}\`\n\n`);
        // Declaration info
        content.appendMarkdown(`*Declared as:* \`${variable.kind}\`\n\n`);
        // Location information
        content.appendMarkdown(`*Location:* Line ${variable.line}, Column ${variable.character}\n\n`);
        // Quick actions
        content.appendMarkdown(`[Rename](command:dauns.renameVariable?${encodeURIComponent(JSON.stringify({ name: variable.name }))}) | ` +
            `[Find References](command:dauns.findReferences?${encodeURIComponent(JSON.stringify({ name: variable.name }))}) | ` +
            `[Extract Variable](command:dauns.extractVariable)`);
        return content;
    }
}
exports.VariableHoverProvider = VariableHoverProvider;
//# sourceMappingURL=variableHoverProvider.js.map