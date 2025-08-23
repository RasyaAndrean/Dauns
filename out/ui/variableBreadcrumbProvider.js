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
exports.VariableBreadcrumbProvider = void 0;
const vscode = __importStar(require("vscode"));
const variableScanner_1 = require("../variableScanner");
class VariableBreadcrumbProvider {
    async provideDocumentSymbols(document, token) {
        const variables = (0, variableScanner_1.scanVariablesInDocument)(document);
        const symbols = [];
        // Group variables by kind (const, let, var)
        const kindGroups = this.groupByKind(variables);
        for (const [kind, vars] of kindGroups) {
            // Find the range of this kind - for now we'll use the entire document
            const kindRange = new vscode.Range(0, 0, document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            const kindSymbol = new vscode.DocumentSymbol(kind, 'Variable Kind', vscode.SymbolKind.Namespace, kindRange, new vscode.Range(0, 0, 0, 0));
            for (const variable of vars) {
                const varRange = new vscode.Range(variable.line - 1, variable.character - 1, variable.line - 1, variable.character - 1 + variable.name.length);
                const varSymbol = new vscode.DocumentSymbol(variable.name, variable.type, this.getSymbolKind(variable.type), varRange, varRange);
                kindSymbol.children.push(varSymbol);
            }
            symbols.push(kindSymbol);
        }
        return symbols;
    }
    groupByKind(variables) {
        const groups = new Map();
        for (const variable of variables) {
            const kind = variable.kind || 'unknown';
            if (!groups.has(kind)) {
                groups.set(kind, []);
            }
            groups.get(kind).push(variable);
        }
        return groups;
    }
    getSymbolKind(type) {
        switch (type.toLowerCase()) {
            case 'function':
                return vscode.SymbolKind.Function;
            case 'object':
                return vscode.SymbolKind.Object;
            case 'array':
                return vscode.SymbolKind.Array;
            case 'string':
                return vscode.SymbolKind.String;
            case 'number':
                return vscode.SymbolKind.Number;
            case 'boolean':
                return vscode.SymbolKind.Boolean;
            default:
                return vscode.SymbolKind.Variable;
        }
    }
}
exports.VariableBreadcrumbProvider = VariableBreadcrumbProvider;
//# sourceMappingURL=variableBreadcrumbProvider.js.map