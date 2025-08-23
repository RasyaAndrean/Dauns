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
exports.UnusedVariableDetector = void 0;
const vscode = __importStar(require("vscode"));
class UnusedVariableDetector {
    // Find unused variables in a document
    static findUnusedVariables(document, variables) {
        const text = document.getText();
        const unusedVariables = [];
        for (const variable of variables) {
            // Skip function declarations as they might be exported or used elsewhere
            if (variable.type === 'function') {
                continue;
            }
            // Count occurrences of the variable name in the document (excluding declaration)
            const variableRegex = new RegExp(`\\b${this.escapeRegExp(variable.name)}\\b`, 'g');
            const matches = text.match(variableRegex);
            const usageCount = matches ? matches.length : 0;
            // If usage count is 1 or less, it means it's only declared but not used
            // (or only used once which is just the declaration)
            if (usageCount <= 1) {
                unusedVariables.push({
                    ...variable,
                    usageCount: usageCount,
                });
            }
        }
        return unusedVariables;
    }
    // Escape special regex characters
    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    // Show unused variables in a quick pick
    static async showUnusedVariables(unusedVariables) {
        if (unusedVariables.length === 0) {
            vscode.window.showInformationMessage('No unused variables found!');
            return;
        }
        const quickPickItems = unusedVariables.map(variable => ({
            label: variable.name,
            description: `${variable.type} (${variable.kind})`,
            detail: `Declared at line ${variable.line}, column ${variable.character} - Used ${variable.usageCount} time(s)`,
        }));
        const selection = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: `Found ${unusedVariables.length} unused variable(s). Select one to navigate to it.`,
        });
        if (selection) {
            const selectedVariable = unusedVariables.find(v => v.name === selection.label);
            if (selectedVariable) {
                // We would need to navigate to the variable, but we don't have the document reference here
                vscode.window.showInformationMessage(`Selected unused variable: ${selectedVariable.name}`);
            }
        }
    }
}
exports.UnusedVariableDetector = UnusedVariableDetector;
//# sourceMappingURL=unusedVariableDetector.js.map